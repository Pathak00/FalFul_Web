using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class AdminNavRepository : IAdminNavRepository
{
    private readonly DapperContext _context;
    public AdminNavRepository(DapperContext context) => _context = context;

    public async Task<IEnumerable<AdminNavItem>> GetAllAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<AdminNavItem>(
            "sp_AdminNavItem_GetAll",
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<AdminNavItem>> GetForUserAsync(int userId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<AdminNavItem>(
            "sp_AdminNavItem_GetForUser",
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<AdminNavItem>> GetPermittedForUserAsync(int userId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<AdminNavItem>(
            "sp_AdminNavItem_GetPermittedForUser",
            new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(AdminNavItem item)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_AdminNavItem_Update",
            new { item.Id, item.Label, item.Icon, item.GroupLabel, item.DisplayOrder, item.IsVisible },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(AdminNavItem item)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_AdminNavItem_Create",
            new
            {
                item.Label, item.Route, item.Icon, item.GroupLabel,
                item.DisplayOrder, item.IsVisible, item.RequiredPermission,
                item.PortalScope
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _context.CreateConnection();
        var result = await conn.ExecuteScalarAsync<int>(
            "sp_AdminNavItem_Delete",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
        return result == 0;
    }
}
