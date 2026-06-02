using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class NoticeRepository(DapperContext context) : INoticeRepository
{
    public async Task<IEnumerable<Notice>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Notice>("sp_Notice_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Notice>> GetActiveAsync(byte? userType = null)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Notice>(
            "sp_Notice_GetActive", new { UserType = userType }, commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(Notice n)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Notice_Create",
            new { n.Title, n.Message, n.NoticeType, n.Target, n.StartDate, n.EndDate, n.IsActive, n.ImageUrl },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Notice n)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Notice_Update",
            new { n.Id, n.Title, n.Message, n.NoticeType, n.Target, n.StartDate, n.EndDate, n.IsActive, n.ImageUrl },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync("sp_Notice_Delete", new { Id = id }, commandType: CommandType.StoredProcedure);
    }
}
