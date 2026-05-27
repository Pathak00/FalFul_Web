using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using FalFul.Domain.Enums;

namespace FalFul.Application.Services;

public class DeliveryService(
    IDeliveryRepository      deliveries,
    IDeliveryAttemptRepository attempts,
    IDeliveryIssueRepository issues,
    IOrderRatingRepository   ratings,
    IOrderRepository         orders) : IDeliveryService
{
    public async Task<IEnumerable<DeliverySummaryDto>> GetAllAsync(byte? status = null, string? fromDate = null, string? toDate = null)
    {
        var list = await deliveries.GetAllAsync(status, ParseDate(fromDate), ParseDate(toDate));
        return list.Select(MapSummary);
    }

    public async Task<DeliveryDetailDto?> GetByIdAsync(int id)
    {
        var d = await deliveries.GetByIdAsync(id);
        return d is null ? null : MapDetail(d);
    }

    public async Task<Result> AssignRiderAsync(int id, AssignRiderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RiderName))  return Result.Failure("Rider name is required.");
        if (string.IsNullOrWhiteSpace(dto.RiderPhone)) return Result.Failure("Rider phone is required.");

        if (await deliveries.GetByIdAsync(id) is null) return Result.Failure("Delivery not found.");

        try { await deliveries.AssignRiderAsync(id, dto.RiderName.Trim(), dto.RiderPhone.Trim()); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> UpdateStatusAsync(int id, UpdateDeliveryStatusDto dto)
    {
        if (await deliveries.GetByIdAsync(id) is null) return Result.Failure("Delivery not found.");

        try { await deliveries.UpdateStatusAsync(id, dto.Status, dto.TrackingNotes?.Trim()); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> LogAttemptAsync(int deliveryId, LogDeliveryAttemptDto dto)
    {
        if (await deliveries.GetByIdAsync(deliveryId) is null) return Result.Failure("Delivery not found.");

        DateTime? rescheduledDate = null;
        if (!string.IsNullOrEmpty(dto.RescheduledDate) && DateTime.TryParse(dto.RescheduledDate, out var rd))
            rescheduledDate = rd;

        var attempt = new DeliveryAttempt
        {
            DeliveryId          = deliveryId,
            RiderName           = dto.RiderName?.Trim(),
            RiderPhone          = dto.RiderPhone?.Trim(),
            WasSuccessful       = dto.WasSuccessful,
            FailureReason       = dto.FailureReason,
            FailureNotes        = dto.FailureNotes?.Trim(),
            NextAction          = dto.NextAction,
            RescheduledDate     = rescheduledDate,
            RescheduledTimeSlot = dto.RescheduledTimeSlot?.Trim()
        };

        try { await attempts.LogAsync(attempt); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> ReportIssueAsync(int deliveryId, ReportIssueDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Description)) return Result.Failure("Description is required.");
        if (await deliveries.GetByIdAsync(deliveryId) is null) return Result.Failure("Delivery not found.");

        var issue = new DeliveryIssue
        {
            DeliveryId  = deliveryId,
            IssueType   = dto.IssueType,
            ReportedBy  = dto.ReportedBy,
            Description = dto.Description.Trim()
        };

        try { await issues.CreateAsync(issue); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> ResolveIssueAsync(int issueId, ResolveIssueDto dto)
    {
        try { await issues.ResolveAsync(issueId, dto.ResolutionNotes?.Trim()); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<DeliveryReportDto> GetDeliveryReportAsync(string? fromDate = null, string? toDate = null)
        => await deliveries.GetReportAsync(ParseDate(fromDate), ParseDate(toDate));

    public async Task<OrderReportDto> GetOrderReportAsync(string? fromDate = null, string? toDate = null)
        => await orders.GetReportAsync(ParseDate(fromDate), ParseDate(toDate));

    public async Task<Result> SubmitRatingAsync(int orderId, int userId, SubmitRatingDto dto)
    {
        if (dto.OverallRating < 1 || dto.OverallRating > 5)
            return Result.Failure("Overall rating must be between 1 and 5.");

        var order = await orders.GetByIdAsync(orderId);
        if (order is null || order.UserId != userId) return Result.Failure("Order not found.");

        // Rating is allowed once delivery is marked Delivered (not tied to order status)
        if (order.Delivery?.Status != DeliveryStatus.Delivered)
            return Result.Failure("You can only rate orders that have been delivered.");

        var rating = new OrderRating
        {
            OrderId              = orderId,
            UserId               = userId,
            DeliveryRating       = dto.DeliveryRating,
            ProductQualityRating = dto.ProductQualityRating,
            OverallRating        = dto.OverallRating,
            Comment              = dto.Comment?.Trim()
        };

        try { await ratings.UpsertAsync(rating); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<OrderRatingResponseDto?> GetRatingAsync(int orderId)
    {
        var r = await ratings.GetByOrderAsync(orderId);
        return r is null ? null : new OrderRatingResponseDto
        {
            Id                   = r.Id,
            DeliveryRating       = r.DeliveryRating,
            ProductQualityRating = r.ProductQualityRating,
            OverallRating        = r.OverallRating,
            Comment              = r.Comment,
            CreatedAt            = r.CreatedAt
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static DateOnly? ParseDate(string? s)
        => s is not null && DateOnly.TryParse(s, out var d) ? d : (DateOnly?)null;

    internal static string DeliveryStatusLabel(byte s) => s switch
    {
        1 => "Awaiting Rider",
        2 => "Rider Assigned",
        3 => "Picked Up",
        4 => "Out for Delivery",
        5 => "Delivered",
        6 => "Delivery Failed",
        7 => "Customer Unavailable",
        8 => "Rescheduled",
        9 => "Returned",
        _ => "Unknown"
    };

    internal static string FailureReasonLabelStatic(byte? r) => FailureReasonLabel(r);
    private static string FailureReasonLabel(byte? r) => r switch
    {
        1  => "Customer Not Home",
        2  => "Wrong Address",
        3  => "Customer Refused",
        4  => "Payment Refused",
        5  => "Product Damaged",
        6  => "Weather Conditions",
        7  => "Vehicle Breakdown",
        8  => "Contact Not Reachable",
        9  => "Address Not Found",
        10 => "Other",
        _  => "Unknown"
    };

    private static string NextActionLabel(byte? a) => a switch
    {
        1 => "Reschedule",
        2 => "Return to Warehouse",
        3 => "Retry Today",
        4 => "Customer Unavailable",
        _ => string.Empty
    };

    private static string IssueTypeLabel(byte t) => t switch
    {
        1 => "Delivery Failed",
        2 => "Product Damaged",
        3 => "Wrong Item",
        4 => "Late Delivery",
        5 => "Rider Behavior",
        6 => "Payment Issue",
        7 => "Access Issue",
        8 => "Other",
        _ => "Unknown"
    };

    private static string ReportedByLabel(byte b) => b switch
    {
        1 => "Rider",
        2 => "Admin",
        3 => "Customer",
        _ => "Unknown"
    };

    private static DeliveryAttemptDto MapAttempt(DeliveryAttempt a) => new()
    {
        Id                  = a.Id,
        AttemptNumber       = a.AttemptNumber,
        AttemptedAt         = a.AttemptedAt,
        RiderName           = a.RiderName,
        RiderPhone          = a.RiderPhone,
        WasSuccessful       = a.WasSuccessful,
        FailureReason       = a.FailureReason,
        FailureReasonLabel  = FailureReasonLabel(a.FailureReason),
        FailureNotes        = a.FailureNotes,
        NextAction          = a.NextAction,
        NextActionLabel     = NextActionLabel(a.NextAction),
        RescheduledDate     = a.RescheduledDate?.ToString("yyyy-MM-dd"),
        RescheduledTimeSlot = a.RescheduledTimeSlot
    };

    private static DeliveryIssueDto MapIssue(DeliveryIssue i) => new()
    {
        Id              = i.Id,
        IssueType       = i.IssueType,
        IssueTypeLabel  = IssueTypeLabel(i.IssueType),
        ReportedBy      = i.ReportedBy,
        ReportedByLabel = ReportedByLabel(i.ReportedBy),
        Description     = i.Description,
        ReportedAt      = i.ReportedAt,
        ResolvedAt      = i.ResolvedAt,
        ResolutionNotes = i.ResolutionNotes,
        IsResolved      = i.IsResolved
    };

    private static DeliverySummaryDto MapSummary(Delivery d) => new()
    {
        Id                = d.Id,
        OrderId           = d.OrderId,
        OrderNumber       = d.OrderNumber,
        Status            = (byte)d.Status,
        StatusLabel       = DeliveryStatusLabel((byte)d.Status),
        ScheduledDate     = d.ScheduledDate.ToString("yyyy-MM-dd"),
        ScheduledTimeSlot = d.ScheduledTimeSlot,
        RiderName         = d.RiderName,
        RiderPhone        = d.RiderPhone,
        AttemptCount      = d.AttemptCount,
        MaxAttempts       = d.MaxAttempts,
        CustomerName      = d.CustomerName,
        City              = d.City,
        FullAddress       = d.FullAddress,
        DeliveryPhone     = d.DeliveryPhone,
        TotalAmount       = d.TotalAmount,
        CreatedAt         = d.CreatedAt,
        AssignedAt        = d.AssignedAt,
        DeliveredAt       = d.DeliveredAt,
        FailedAt          = d.FailedAt
    };

    private static DeliveryDetailDto MapDetail(Delivery d) => new()
    {
        Id                = d.Id,
        OrderId           = d.OrderId,
        OrderNumber       = d.OrderNumber,
        Status            = (byte)d.Status,
        StatusLabel       = DeliveryStatusLabel((byte)d.Status),
        ScheduledDate     = d.ScheduledDate.ToString("yyyy-MM-dd"),
        ScheduledTimeSlot = d.ScheduledTimeSlot,
        RiderName         = d.RiderName,
        RiderPhone        = d.RiderPhone,
        AttemptCount      = d.AttemptCount,
        MaxAttempts       = d.MaxAttempts,
        CustomerName      = d.CustomerName,
        City              = d.City,
        FullAddress       = d.FullAddress,
        DeliveryPhone     = d.DeliveryPhone,
        TotalAmount       = d.TotalAmount,
        CreatedAt         = d.CreatedAt,
        AssignedAt        = d.AssignedAt,
        DeliveredAt       = d.DeliveredAt,
        FailedAt          = d.FailedAt,
        Landmark          = d.Landmark,
        OrderNotes        = d.OrderNotes,
        PaymentMethod     = d.PaymentMethod,
        PickedUpAt        = d.PickedUpAt,
        TrackingNotes     = d.TrackingNotes,
        Attempts          = d.Attempts.Select(MapAttempt).ToList(),
        Issues            = d.Issues.Select(MapIssue).ToList()
    };
}
