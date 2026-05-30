using FalFul.Application.DTOs.Payment;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IPaymentService
{
    // Payment methods (DB-driven, not hardcoded)
    Task<IEnumerable<PaymentMethodDto>> GetEnabledMethodsAsync();
    Task<IEnumerable<PaymentMethodDto>> GetAllMethodsAsync();
    Task<Result>                        UpdateMethodAsync(byte id, PaymentMethodUpdateDto dto);

    // Advance settings
    Task<PaymentSettingsDto> GetSettingsAsync();
    Task<Result>             UpdateSettingsAsync(PaymentSettingsDto dto);

    // Transaction lifecycle
    Task<Result<InitiatePaymentResultDto>> InitiateAsync(int orderId, int userId, InitiatePaymentDto dto);
    Task<Result>                           HandleCallbackAsync(string gatewayCode, Dictionary<string, string> callbackData);
    Task<Result>                           ConfirmCodBalanceAsync(int paymentId);

    // Queries
    Task<IEnumerable<PaymentDto>> GetByOrderAsync(int orderId);
    Task<IEnumerable<PaymentDto>> GetAllAsync(byte? methodId = null, byte? status = null, string? fromDate = null, string? toDate = null);

    // Report
    Task<PaymentReportDto> GetReportAsync(string? fromDate = null, string? toDate = null);
}
