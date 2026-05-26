using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class ProductRepository(DapperContext context) : IProductRepository
{
    public async Task<IEnumerable<Product>> GetAllAsync(int? categoryId = null, string? searchTerm = null)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Product>(
            "sp_Product_GetAll",
            new { CategoryId = categoryId, SearchTerm = searchTerm },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Product>> GetPublicAsync(int? categoryId = null, string? searchTerm = null, bool featuredOnly = false)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Product>(
            "sp_Product_GetPublic",
            new { CategoryId = categoryId, SearchTerm = searchTerm, FeaturedOnly = featuredOnly },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Product>> GetFeaturedAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Product>("sp_Product_GetFeatured", commandType: CommandType.StoredProcedure);
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Product>(
            "sp_Product_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Product?> GetBySlugAsync(string slug)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Product>(
            "sp_Product_GetBySlug",
            new { Slug = slug },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(Product product)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Product_Create",
            new
            {
                product.CategoryId,
                product.Name,
                product.Slug,
                product.Description,
                product.ShortDescription,
                product.Price,
                product.Unit,
                product.Stock,
                product.IsAvailable,
                product.IsFeatured,
                product.ImageUrl,
                product.Tags,
                product.DisplayOrder
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(Product product)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Product_Update",
            new
            {
                product.Id,
                product.CategoryId,
                product.Name,
                product.Slug,
                product.Description,
                product.ShortDescription,
                product.Price,
                product.Unit,
                product.Stock,
                product.IsAvailable,
                product.IsFeatured,
                product.ImageUrl,
                product.Tags,
                product.DisplayOrder
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync("sp_Product_Delete", new { Id = id }, commandType: CommandType.StoredProcedure);
    }

    public async Task SetAvailabilityAsync(int id, bool isAvailable)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Product_SetAvailability",
            new { Id = id, IsAvailable = isAvailable },
            commandType: CommandType.StoredProcedure);
    }
}
