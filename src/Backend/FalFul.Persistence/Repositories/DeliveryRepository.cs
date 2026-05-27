using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class DeliveryRepository(DapperContext context) : IDeliveryRepository
{
    public async Task CreateAsync(Delivery delivery)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Delivery_Create",
            new
            {
                delivery.OrderId,
                delivery.Status,
                delivery.ScheduledDate,
                delivery.ScheduledTimeSlot
            },
            commandType: CommandType.StoredProcedure);
    }
}
