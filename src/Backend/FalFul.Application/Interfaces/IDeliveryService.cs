using FalFul.Application.DTOs.Order;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IDeliveryService
{
    // Admin delivery management
    Task<IEnumerable<DeliverySummaryDto>> GetAllAsync(byte? status = null, string? fromDate = null, string? toDate = null);
    Task<DeliveryDetailDto?> GetByIdAsync(int id);
    Task<Result> AssignRiderAsync(int id, AssignRiderDto dto);
    Task<Result> UpdateStatusAsync(int id, UpdateDeliveryStatusDto dto);
    Task<Result> LogAttemptAsync(int deliveryId, LogDeliveryAttemptDto dto);
    Task<Result> ReportIssueAsync(int deliveryId, ReportIssueDto dto);
    Task<Result> ResolveIssueAsync(int issueId, ResolveIssueDto dto);

    // Reports
    Task<DeliveryReportDto> GetDeliveryReportAsync(string? fromDate = null, string? toDate = null);
    Task<OrderReportDto>    GetOrderReportAsync(string? fromDate = null, string? toDate = null);

    // Rider management
    Task<IEnumerable<RiderUserDto>>       GetRidersAsync();

    // Rider portal
    Task<IEnumerable<DeliverySummaryDto>> GetRiderDeliveriesAsync(int riderUserId);

    // Customer rating
    Task<Result>               SubmitRatingAsync(int orderId, int userId, SubmitRatingDto dto);
    Task<OrderRatingResponseDto?> GetRatingAsync(int orderId);
}
