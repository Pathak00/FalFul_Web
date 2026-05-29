using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

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
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<AdminNavItem>> GetForUserAsync(int userId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<AdminNavItem>(
            "sp_AdminNavItem_GetForUser",
            new { UserId = userId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(AdminNavItem item)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_AdminNavItem_Update",
            new { item.Id, item.Label, item.Icon, item.GroupLabel, item.DisplayOrder, item.IsVisible },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
