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
    Task                     UpdateStatusAsync(int id, OrderStatus status);
    Task                     CancelAsync(int id, int userId, string reason);
}
