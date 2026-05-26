using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class MenuRepository : IMenuRepository
{
    private readonly DapperContext _context;
    public MenuRepository(DapperContext context) => _context = context;

    public async Task<IEnumerable<MenuItem>> GetAllAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<MenuItem>(
            "sp_MenuItem_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<MenuItem>> GetVisibleAsync(int? userType)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<MenuItem>(
            "sp_MenuItem_GetVisible",
            new { UserType = userType },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(MenuItem item, int? createdBy)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_MenuItem_Create",
            new { item.ParentId, item.Label, item.Url, item.Icon, item.DisplayOrder, item.IsVisible, item.VisibleTo, item.OpenInNewTab, CreatedBy = createdBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(MenuItem item, int? updatedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_MenuItem_Update",
            new { item.Id, item.ParentId, item.Label, item.Url, item.Icon, item.DisplayOrder, item.IsVisible, item.VisibleTo, item.OpenInNewTab, UpdatedBy = updatedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id, int? deletedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_MenuItem_Delete",
            new { Id = id, DeletedBy = deletedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
