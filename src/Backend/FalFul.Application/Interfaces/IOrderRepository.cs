using FalFul.Application.DTOs.Order;
using FalFul.Application.DTOs.Receipt;
using FalFul.Domain.Entities;
using FalFul.Domain.Enums;

namespace FalFul.Application.Interfaces;

public interface IOrderRepository
{
    Task<IEnumerable<Order>> GetByUserAsync(int userId);
    Task<Order?>             GetByIdAsync(int id);
    Task<IEnumerable<Order>> GetAllAsync(byte? status = null);
    Task<(int Id, string OrderNumber)> CreateAsync(Order order);
    Task                     AddItemAsync(OrderItem item);
    Task                     UpdateStatusAsync(int id, OrderStatus status, string? reason = null);
    Task                     CancelAsync(int id, int userId, string reason);
    Task<OrderReportDto>     GetReportAsync(DateOnly? fromDate, DateOnly? toDate);
    Task<OrderReceiptDataDto?> GetReceiptDataAsync(int orderId);
}
