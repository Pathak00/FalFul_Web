using FalFul.Application.DTOs.Order;
using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IDeliveryRepository
{
    Task CreateAsync(Delivery delivery);
    Task<Delivery?> GetByIdAsync(int id);
    Task<IEnumerable<Delivery>> GetAllAsync(byte? status = null, DateOnly? fromDate = null, DateOnly? toDate = null);
    Task AssignRiderAsync(int id, int riderUserId);
    Task UpdateStatusAsync(int id, byte status, string? trackingNotes = null, DateOnly? scheduledDate = null, string? scheduledTimeSlot = null);
    Task<DeliveryReportDto> GetReportAsync(DateOnly? fromDate, DateOnly? toDate);
    Task<IEnumerable<DeliverySummaryDto>> GetRiderDeliveriesAsync(int riderUserId);
    Task<IEnumerable<RiderUserDto>> GetRidersAsync();
    Task CompleteAsync(int id, decimal collectedAmount, string? proofPhotoUrl, string? collectionRemarks);
}
