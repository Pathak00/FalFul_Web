using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class DiscountRepository(DapperContext context) : IDiscountRepository
{
    public async Task<IEnumerable<Discount>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Discount>("sp_Discount_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<Discount?> GetByCodeAsync(string code)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Discount>(
            "sp_Discount_GetByCode", new { Code = code }, commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(Discount d)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Discount_Create",
            new { d.Code, d.Description, d.DiscountType, d.Value, d.MinOrderAmount, d.MaxUses, d.StartDate, d.EndDate, d.IsActive },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Discount d)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Discount_Update",
            new { d.Id, d.Code, d.Description, d.DiscountType, d.Value, d.MinOrderAmount, d.MaxUses, d.StartDate, d.EndDate, d.IsActive },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync("sp_Discount_Delete", new { Id = id }, commandType: CommandType.StoredProcedure);
    }

    public async Task IncrementUsageAsync(string code)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync("sp_Discount_IncrementUsage", new { Code = code }, commandType: CommandType.StoredProcedure);
    }
}
