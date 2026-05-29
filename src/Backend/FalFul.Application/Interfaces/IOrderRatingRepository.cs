using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IOrderRatingRepository
{
    Task<OrderRating?> GetByOrderAsync(int orderId);
    Task UpsertAsync(OrderRating rating);
}
