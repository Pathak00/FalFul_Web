using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Domain.Enums;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class OrderRepository(DapperContext context) : IOrderRepository
{
    public async Task<IEnumerable<Order>> GetByUserAsync(int userId)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Order>(
            "sp_Order_GetAll",
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Order?> GetByIdAsync(int id)
    {
        using var conn = context.CreateConnection();
        using var multi = await conn.QueryMultipleAsync(
            "sp_Order_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure);

        var order = await multi.ReadSingleOrDefaultAsync<Order>();
        if (order is null) return null;

        order.Items    = (await multi.ReadAsync<OrderItem>()).ToList();
        order.Delivery = await multi.ReadSingleOrDefaultAsync<Delivery>();
        return order;
    }

    public async Task<IEnumerable<Order>> GetAllAsync(byte? status = null)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Order>(
            "sp_Order_GetAll",
            new { Status = status },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<(int Id, string OrderNumber)> CreateAsync(Order order)
    {
        using var conn = context.CreateConnection();
        var result = await conn.QuerySingleAsync(
            "sp_Order_Create",
            new
            {
                order.UserId,
                order.SubTotal,
                order.DeliveryFee,
                order.ServiceFee,
                order.TotalAmount,
                PaymentMethod     = (byte)order.PaymentMethod,
                order.DeliveryAddressId,
                order.DeliveryDate,
                order.DeliveryTimeSlot,
                order.Notes
            },
            commandType: CommandType.StoredProcedure);

        return ((int)result.Id, (string)result.OrderNumber);
    }

    public async Task AddItemAsync(OrderItem item)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_OrderItem_Create",
            new
            {
                item.OrderId,
                item.ProductId,
                item.ProductName,
                item.ProductSlug,
                item.ImageUrl,
                item.UnitPrice,
                item.Quantity,
                item.Unit,
                item.TotalPrice,
                item.IsCustomBuild,
                item.CustomBuildDetails
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateStatusAsync(int id, OrderStatus status)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Order_UpdateStatus",
            new { Id = id, Status = (byte)status },
            commandType: CommandType.StoredProcedure);
    }

    public async Task CancelAsync(int id, int userId, string reason)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Order_Cancel",
            new { Id = id, UserId = userId, CancelReason = reason },
            commandType: CommandType.StoredProcedure);
    }
}
