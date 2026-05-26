using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class PageRepository : IPageRepository
{
    private readonly DapperContext _context;

    public PageRepository(DapperContext context) => _context = context;

    public async Task<int> CreateAsync(Page page, int? createdBy)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Page_Create",
            new { page.Title, page.Slug, page.Content, page.MetaTitle, page.MetaDescription, page.IsPublished, CreatedBy = createdBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Page page, int? updatedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Page_Update",
            new { page.Id, page.Title, page.Slug, page.Content, page.MetaTitle, page.MetaDescription, page.IsPublished, UpdatedBy = updatedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id, int? deletedBy)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Page_Delete",
            new { Id = id, DeletedBy = deletedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Page>> GetAllAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<Page>(
            "sp_Page_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<Page?> GetByIdAsync(int id)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Page>(
            "sp_Page_GetById",
            new { Id = id },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<Page?> GetBySlugAsync(string slug, bool adminMode)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Page>(
            "sp_Page_GetBySlug",
            new { Slug = slug, AdminMode = adminMode },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
