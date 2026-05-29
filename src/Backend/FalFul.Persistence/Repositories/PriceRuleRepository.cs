using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class PriceRuleRepository(DapperContext context) : IPriceRuleRepository
{
    public async Task<IEnumerable<PriceRule>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<PriceRule>("sp_PriceRule_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task UpsertAsync(string ruleKey, decimal value, bool isActive)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_PriceRule_Upsert",
            new { RuleKey = ruleKey, Value = value, IsActive = isActive },
            commandType: CommandType.StoredProcedure);
    }
}
