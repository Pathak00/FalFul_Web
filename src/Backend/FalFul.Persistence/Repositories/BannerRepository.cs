using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class BannerRepository : IBannerRepository
{
    private readonly DapperContext _context;

    public BannerRepository(DapperContext context) => _context = context;

    public async Task<int> CreateAsync(Banner banner, int? createdBy)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Banner_Create",
            new
            {
                banner.Title, banner.Subtitle, banner.ButtonText, banner.ButtonLink,
                banner.ImageUrl, banner.Position, banner.IsActive, banner.DisplayOrder,
                banner.StartDate, banner.EndDate, CreatedBy = createdBy
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Banner banner, int? updatedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Banner_Update",
            new
            {
                banner.Id, banner.Title, banner.Subtitle, banner.ButtonText, banner.ButtonLink,
                banner.ImageUrl, banner.Position, banner.IsActive, banner.DisplayOrder,
                banner.StartDate, banner.EndDate, UpdatedBy = updatedBy
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id, int? deletedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Banner_Delete",
            new { Id = id, DeletedBy = deletedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Banner>> GetAllAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<Banner>(
            "sp_Banner_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Banner>> GetActiveAsync(string? position)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<Banner>(
            "sp_Banner_GetActive",
            new { Position = position },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
