using FalFul.Application.DTOs.Order;
using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IDeliveryRepository
{
    Task CreateAsync(Delivery delivery);
    Task<Delivery?> GetByIdAsync(int id);
    Task<IEnumerable<Delivery>> GetAllAsync(byte? status = null, DateOnly? fromDate = null, DateOnly? toDate = null);
    Task AssignRiderAsync(int id, string riderName, string riderPhone);
    Task UpdateStatusAsync(int id, byte status, string? trackingNotes = null);
    Task<DeliveryReportDto> GetReportAsync(DateOnly? fromDate, DateOnly? toDate);
}
