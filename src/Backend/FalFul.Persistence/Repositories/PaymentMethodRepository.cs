using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class PaymentMethodRepository(DapperContext context) : IPaymentMethodRepository
{
    public async Task<IEnumerable<PaymentOption>> GetEnabledAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<PaymentOption>(
            "sp_PaymentMethod_GetEnabled",
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<PaymentOption>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<PaymentOption>(
            "sp_PaymentMethod_GetAll",
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(byte id, bool? isEnabled, byte? displayOrder, string? iconUrl, string? description)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_PaymentMethod_Update",
            new { Id = id, IsEnabled = isEnabled, DisplayOrder = displayOrder, IconUrl = iconUrl, Description = description },
            commandType: CommandType.StoredProcedure);
    }
}
