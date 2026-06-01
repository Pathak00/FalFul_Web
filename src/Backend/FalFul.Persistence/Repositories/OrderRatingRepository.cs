using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class OrderRatingRepository(DapperContext context) : IOrderRatingRepository
{
    public async Task<OrderRating?> GetByOrderAsync(int orderId)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<OrderRating>(
            "sp_OrderRating_GetByOrder",
            new { OrderId = orderId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpsertAsync(OrderRating rating)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_OrderRating_Create",
            new
            {
                rating.OrderId,
                rating.UserId,
                rating.DeliveryRating,
                rating.ProductQualityRating,
                rating.OverallRating,
                rating.Comment,
                rating.ReceiptAcknowledged,
                rating.ReceiptAcknowledgedAt
            },
            commandType: CommandType.StoredProcedure);
    }
}
