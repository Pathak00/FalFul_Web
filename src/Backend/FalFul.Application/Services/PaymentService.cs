using FalFul.Application.DTOs.Payment;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Enums;

namespace FalFul.Application.Services;

public class PaymentService(
    IPaymentRepository           payments,
    IPaymentMethodRepository     methods,
    IOrderRepository             orders,
    IAppSettingRepository        settings,
    IEnumerable<IPaymentGateway> gateways) : IPaymentService
{
    // ── Payment methods ────────────────────────────────────────────────────────

    public async Task<IEnumerable<PaymentMethodDto>> GetEnabledMethodsAsync()
        => (await methods.GetEnabledAsync()).Select(MapMethod);

    public async Task<IEnumerable<PaymentMethodDto>> GetAllMethodsAsync()
        => (await methods.GetAllAsync()).Select(MapMethod);

    public async Task<Result> UpdateMethodAsync(byte id, PaymentMethodUpdateDto dto)
    {
        try
        {
            await methods.UpdateAsync(id, dto.IsEnabled, dto.DisplayOrder, dto.IconUrl?.Trim(), dto.Description?.Trim());
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    // ── Settings ───────────────────────────────────────────────────────────────

    public async Task<PaymentSettingsDto> GetSettingsAsync()
    {
        var s = await payments.GetSettingsAsync();
        return new PaymentSettingsDto
        {
            AdvanceEnabled   = s.AdvanceEnabled,
            AdvancePercent   = s.AdvancePercent,
            MinAdvanceAmount = s.MinAdvanceAmount
        };
    }

    public async Task<Result> UpdateSettingsAsync(PaymentSettingsDto dto)
    {
        if (dto.AdvancePercent < 1 || dto.AdvancePercent > 100)
            return Result.Failure("Advance percent must be between 1 and 100.");
        if (dto.MinAdvanceAmount < 0)
            return Result.Failure("Minimum advance amount cannot be negative.");
        try
        {
            await settings.UpsertAsync("payment:advance:enabled",    dto.AdvanceEnabled ? "1" : "0");
            await settings.UpsertAsync("payment:advance:percent",    dto.AdvancePercent.ToString("F0"));
            await settings.UpsertAsync("payment:advance:min_amount", dto.MinAdvanceAmount.ToString("F0"));
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    // ── Initiate ───────────────────────────────────────────────────────────────

    public async Task<Result<InitiatePaymentResultDto>> InitiateAsync(int orderId, int userId, InitiatePaymentDto dto)
    {
        var order = await orders.GetByIdAsync(orderId);
        if (order is null || order.UserId != userId)
            return Result<InitiatePaymentResultDto>.Failure("Order not found.");

        // Allow re-initiation when a prior payment attempt failed (AwaitingPayment = pending gateway round-trip)
        if (order.Status == OrderStatus.AwaitingPayment)
        {
            var existing = (await payments.GetByOrderAsync(orderId)).ToList();
            var pendingOnline = existing.FirstOrDefault(p =>
                p.Status == PaymentStatus.Pending && p.PaymentMethodCode != "cod");

            if (pendingOnline is null)
                return Result<InitiatePaymentResultDto>.Failure("No pending payment found to retry.");

            var retryGateway = ResolveGateway(pendingOnline.PaymentMethodCode!);
            if (retryGateway is null)
                return Result<InitiatePaymentResultDto>.Failure("Payment gateway not configured.");

            var retryResult = await retryGateway.InitiateAsync(new GatewayInitiateRequest
            {
                PaymentId   = pendingOnline.Id,
                OrderId     = orderId,
                OrderNumber = order.OrderNumber,
                Amount      = pendingOnline.Amount,
                ReturnUrl   = dto.ReturnUrl,
                FailureUrl  = dto.FailureUrl
            });

            if (!retryResult.IsSuccess)
                return Result<InitiatePaymentResultDto>.Failure(retryResult.ErrorMessage ?? "Gateway initiation failed.");

            return Result<InitiatePaymentResultDto>.Success(new InitiatePaymentResultDto
            {
                RequiresRedirect = true,
                RedirectUrl      = retryResult.RedirectUrl,
                FormFields       = retryResult.FormFields,
                AdvanceAmount    = pendingOnline.Amount,
                Message          = "Retrying payment…"
            },"");
        }

        if (order.Status != OrderStatus.Pending)
            return Result<InitiatePaymentResultDto>.Failure("Payment can only be initiated for pending orders.");

        var enabledMethods = (await methods.GetEnabledAsync()).ToList();
        var chosenMethod   = enabledMethods.FirstOrDefault(m => m.Id == dto.PaymentMethodId);
        if (chosenMethod is null)
            return Result<InitiatePaymentResultDto>.Failure("Selected payment method is not available.");

        var config  = await payments.GetSettingsAsync();
        var advance = config.CalculateAdvance(order.TotalAmount);
        var isCod   = chosenMethod.Code == "cod";

        if (isCod && advance > 0)
        {
            // COD + advance enabled: customer must pay advance online first
            if (dto.AdvanceMethodId is null)
                return Result<InitiatePaymentResultDto>.Failure(
                    $"An online payment method is required for the advance of Rs {advance:F0}.");

            var advanceMethod = enabledMethods.FirstOrDefault(m => m.Id == dto.AdvanceMethodId && m.Code != "cod");
            if (advanceMethod is null)
                return Result<InitiatePaymentResultDto>.Failure("Selected advance payment method is not available.");

            var advancePaymentId = await payments.CreateAsync(orderId, dto.AdvanceMethodId.Value, PaymentType.Advance, advance);
            await payments.CreateAsync(orderId, dto.PaymentMethodId, PaymentType.Balance, order.TotalAmount - advance);
            await payments.UpdateOrderPaymentStatusAsync(orderId, PaymentStatus.Pending, advance);

            var gateway = ResolveGateway(advanceMethod.Code);
            if (gateway is null)
                return Result<InitiatePaymentResultDto>.Failure("Payment gateway not configured.");

            var result = await gateway.InitiateAsync(new GatewayInitiateRequest
            {
                PaymentId   = advancePaymentId,
                OrderId     = orderId,
                OrderNumber = order.OrderNumber,
                Amount      = advance,
                ReturnUrl   = dto.ReturnUrl,
                FailureUrl  = dto.FailureUrl
            });

            if (!result.IsSuccess)
                return Result<InitiatePaymentResultDto>.Failure(result.ErrorMessage ?? "Gateway initiation failed.");

            // Order awaits advance payment verification before admin can process it.
            // Non-fatal: gateway redirect proceeds even if this status update fails.
            try { await orders.UpdateStatusAsync(orderId, OrderStatus.AwaitingPayment); } catch { }

            return Result<InitiatePaymentResultDto>.Success(new InitiatePaymentResultDto
            {
                RequiresRedirect = result.RedirectUrl is not null || result.FormFields is not null,
                RedirectUrl      = result.RedirectUrl,
                FormFields       = result.FormFields,
                AdvanceAmount    = advance,
                BalanceAmount    = order.TotalAmount - advance,
                Message          = $"Pay Rs {advance:F0} advance now. Remaining Rs {order.TotalAmount - advance:F0} on delivery."
            },"");
        }
        else
        {
            // Full payment via chosen method, or COD with no advance required
            var paymentId = await payments.CreateAsync(orderId, dto.PaymentMethodId, PaymentType.Full, order.TotalAmount);

            if (isCod)
            {
                return Result<InitiatePaymentResultDto>.Success(new InitiatePaymentResultDto
                {
                    RequiresRedirect = false,
                    Message          = "Order confirmed. Pay cash on delivery."
                },"");
            }

            var gateway = ResolveGateway(chosenMethod.Code);
            if (gateway is null)
                return Result<InitiatePaymentResultDto>.Failure("Payment gateway not configured.");

            var result = await gateway.InitiateAsync(new GatewayInitiateRequest
            {
                PaymentId   = paymentId,
                OrderId     = orderId,
                OrderNumber = order.OrderNumber,
                Amount      = order.TotalAmount,
                ReturnUrl   = dto.ReturnUrl,
                FailureUrl  = dto.FailureUrl
            });

            if (!result.IsSuccess)
                return Result<InitiatePaymentResultDto>.Failure(result.ErrorMessage ?? "Gateway initiation failed.");

            // Order awaits full payment verification before admin can process it.
            // Non-fatal: gateway redirect proceeds even if this status update fails.
            try { await orders.UpdateStatusAsync(orderId, OrderStatus.AwaitingPayment); } catch { }

            return Result<InitiatePaymentResultDto>.Success(new InitiatePaymentResultDto
            {
                RequiresRedirect = result.RedirectUrl is not null || result.FormFields is not null,
                RedirectUrl      = result.RedirectUrl,
                FormFields       = result.FormFields,
                AdvanceAmount    = order.TotalAmount,
                Message          = "Redirecting to payment gateway."
            }, "");
        }
    }

    // ── Callbacks ──────────────────────────────────────────────────────────────

    public async Task<Result> HandleCallbackAsync(string gatewayCode, Dictionary<string, string> callbackData)
    {
        var gateway = ResolveGateway(gatewayCode);
        if (gateway is null) return Result.Failure("Unknown gateway.");

        // payment_id is encoded in the ReturnUrl by the frontend when initiating
        if (!callbackData.TryGetValue("payment_id", out var pidStr) || !int.TryParse(pidStr, out var paymentId))
            return Result.Failure("Payment ID missing from callback data.");

        var payment = await payments.GetByIdAsync(paymentId);
        if (payment is null) return Result.Failure("Payment record not found.");

        var verify = await gateway.VerifyAsync(callbackData);

        if (!verify.IsSuccess)
        {
            await payments.UpdateStatusAsync(paymentId, PaymentStatus.Failed,
                gatewayResponse: verify.RawResponse);
            return Result.Failure(verify.ErrorMessage ?? "Payment verification failed.");
        }

        await payments.UpdateStatusAsync(paymentId, PaymentStatus.Completed,
            verify.GatewayTransactionId, verify.RawResponse);

        // If all online payments for this order are complete, mark order as fully paid
        var orderPayments = (await payments.GetByOrderAsync(payment.OrderId)).ToList();
        var allOnlineDone = orderPayments
            .Where(p => p.PaymentMethodCode != "cod")
            .All(p => p.Status == PaymentStatus.Completed || p.Id == paymentId);

        if (allOnlineDone)
            await payments.UpdateOrderPaymentStatusAsync(payment.OrderId, PaymentStatus.Completed);

        // Advance/full payment verified: unblock the order so admin can process it
        var order = await orders.GetByIdAsync(payment.OrderId);
        if (order?.Status == OrderStatus.AwaitingPayment)
            await orders.UpdateStatusAsync(payment.OrderId, OrderStatus.Pending);

        return Result.Success("");
    }

    public async Task<Result> ConfirmCodBalanceAsync(int paymentId)
    {
        var payment = await payments.GetByIdAsync(paymentId);
        if (payment is null) return Result.Failure("Payment not found.");
        if (payment.PaymentMethodCode != "cod") return Result.Failure("This payment is not a COD payment.");

        var gateway = ResolveGateway("cod")!;
        var verify  = await gateway.VerifyAsync([]);

        await payments.UpdateStatusAsync(paymentId, PaymentStatus.Completed,
            verify.GatewayTransactionId, verify.RawResponse);

        return Result.Success("");
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    public async Task<IEnumerable<PaymentDto>> GetByOrderAsync(int orderId)
        => (await payments.GetByOrderAsync(orderId)).Select(MapPayment);

    public async Task<IEnumerable<PaymentDto>> GetAllAsync(
        byte? methodId = null, byte? status = null,
        string? fromDate = null, string? toDate = null)
    {
        var list = await payments.GetAllAsync(
            methodId,
            status.HasValue ? (PaymentStatus?)status.Value : null,
            fromDate: ParseDate(fromDate),
            toDate:   ParseDate(toDate));
        return list.Select(MapPayment);
    }

    // ── Report ─────────────────────────────────────────────────────────────────

    public async Task<PaymentReportDto> GetReportAsync(string? fromDate = null, string? toDate = null)
    {
        var data = await payments.GetReportAsync(ParseDate(fromDate), ParseDate(toDate));
        return new PaymentReportDto
        {
            TotalTransactions = data.TotalTransactions,
            TotalCollected    = data.TotalCollected,
            TotalPending      = data.TotalPending,
            TotalRefunded     = data.TotalRefunded,
            TotalAdvance      = data.TotalAdvance,
            TotalBalance      = data.TotalBalance,
            MethodBreakdown   = data.MethodBreakdown,
            StatusBreakdown   = data.StatusBreakdown.Select(s => new PaymentStatusBreakdownDto
            {
                Status = s.Status,
                Label  = PaymentStatusLabel(s.Status),
                Count  = s.Count,
                Total  = s.Total
            }).ToList()
        };
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private IPaymentGateway? ResolveGateway(string code)
        => gateways.FirstOrDefault(g => g.Code == code);

    private static DateOnly? ParseDate(string? s)
        => s is not null && DateOnly.TryParse(s, out var d) ? d : null;

    private static string PaymentTypeLabel(byte t) => t switch
    {
        1 => "Full",
        2 => "Advance",
        3 => "Balance",
        _ => "Unknown"
    };

    private static string PaymentStatusLabel(byte s) => s switch
    {
        1 => "Pending",
        2 => "Completed",
        3 => "Failed",
        4 => "Refunded",
        _ => "Unknown"
    };

    private static PaymentMethodDto MapMethod(Domain.Entities.PaymentOption m) => new()
    {
        Id           = m.Id,
        Name         = m.Name,
        Code         = m.Code,
        IsEnabled    = m.IsEnabled,
        DisplayOrder = m.DisplayOrder,
        IconUrl      = m.IconUrl,
        Description  = m.Description
    };

    private static PaymentDto MapPayment(Domain.Entities.Payment p) => new()
    {
        Id                   = p.Id,
        OrderId              = p.OrderId,
        OrderNumber          = p.OrderNumber,
        CustomerName         = p.CustomerName,
        PaymentMethodId      = p.PaymentMethodId,
        PaymentMethodName    = p.PaymentMethodName,
        PaymentMethodCode    = p.PaymentMethodCode,
        PaymentType          = (byte)p.PaymentType,
        PaymentTypeLabel     = PaymentTypeLabel((byte)p.PaymentType),
        Amount               = p.Amount,
        Status               = (byte)p.Status,
        StatusLabel          = PaymentStatusLabel((byte)p.Status),
        GatewayTransactionId = p.GatewayTransactionId,
        PaidAt               = p.PaidAt,
        CreatedAt            = p.CreatedAt
    };
}
