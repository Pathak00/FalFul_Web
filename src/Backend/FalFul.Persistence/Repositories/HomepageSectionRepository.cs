using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class HomepageSectionRepository : IHomepageSectionRepository
{
    private readonly DapperContext _context;

    public HomepageSectionRepository(DapperContext context) => _context = context;

    public async Task<IEnumerable<HomepageSection>> GetAllAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<HomepageSection>(
            "sp_HomepageSection_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<HomepageSection>> GetVisibleAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<HomepageSection>(
            "sp_HomepageSection_GetVisible",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<int> UpsertAsync(HomepageSection section, int? updatedBy)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_HomepageSection_Upsert",
            new
            {
                section.SectionKey, section.Title, section.Subtitle,
                section.Content, section.IsVisible, section.DisplayOrder, UpdatedBy = updatedBy
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
