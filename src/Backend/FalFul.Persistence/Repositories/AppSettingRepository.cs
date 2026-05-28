using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class AppSettingRepository(DapperContext context) : IAppSettingRepository
{
    public async Task<IEnumerable<AppSetting>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<AppSetting>(
            "sp_AppSetting_GetAll",
            commandType: CommandType.StoredProcedure);
    }

    public async Task<AppSetting?> GetByKeyAsync(string key)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<AppSetting>(
            "sp_AppSetting_GetByKey",
            new { Key = key },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpsertAsync(string key, string value)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_AppSetting_Upsert",
            new { Key = key, Value = value },
            commandType: CommandType.StoredProcedure);
    }
}
