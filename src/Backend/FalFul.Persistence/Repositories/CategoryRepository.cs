using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class CategoryRepository(DapperContext context) : ICategoryRepository
{
    public async Task<IEnumerable<Category>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Category>("sp_Category_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Category>> GetActiveAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Category>("sp_Category_GetActive", commandType: CommandType.StoredProcedure);
    }

    public async Task<Category?> GetByIdAsync(int id)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Category>(
            "sp_Category_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(Category category)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Category_Create",
            new
            {
                category.Name,
                category.Slug,
                category.Description,
                category.Icon,
                category.ImageUrl,
                category.DisplayOrder
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Category category)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Category_Update",
            new
            {
                category.Id,
                category.Name,
                category.Slug,
                category.Description,
                category.Icon,
                category.ImageUrl,
                category.DisplayOrder,
                category.IsActive
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync("sp_Category_Delete", new { Id = id }, commandType: CommandType.StoredProcedure);
    }
}
