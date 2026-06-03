using FalFul.Application.DTOs.Product;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;

namespace FalFul.Application.Services;

public class ProductService(
    ICategoryRepository categories,
    IProductRepository  products,
    IMemoryCache        cache) : IProductService
{
    // ── Cache TTLs ────────────────────────────────────────────────────────────
    private static readonly TimeSpan ProductTtl  = TimeSpan.FromSeconds(45);
    private static readonly TimeSpan CategoryTtl = TimeSpan.FromMinutes(5);

    // ── Shared eviction token — cancelled to flush all product/category entries
    private static CancellationTokenSource _productEvict  = new();
    private static CancellationTokenSource _categoryEvict = new();

    private static MemoryCacheEntryOptions ProductOpts() =>
        new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = ProductTtl }
            .AddExpirationToken(new CancellationChangeToken(_productEvict.Token));

    private static MemoryCacheEntryOptions CategoryOpts() =>
        new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = CategoryTtl }
            .AddExpirationToken(new CancellationChangeToken(_categoryEvict.Token));

    private static void EvictProducts()
    {
        var old = Interlocked.Exchange(ref _productEvict, new CancellationTokenSource());
        old.Cancel();
        old.Dispose();
    }

    private static void EvictCategories()
    {
        var old = Interlocked.Exchange(ref _categoryEvict, new CancellationTokenSource());
        old.Cancel();
        old.Dispose();
    }

    // ── Categories ────────────────────────────────────────────────────────────

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        var list = await categories.GetAllAsync();
        return list.Select(MapCategory);
    }

    public async Task<IEnumerable<CategoryDto>> GetActiveCategoriesAsync()
    {
        const string key = "categories:active";
        if (cache.TryGetValue(key, out IEnumerable<CategoryDto>? cached) && cached is not null)
            return cached;

        var list = await categories.GetActiveAsync();
        var dto  = list.Select(MapCategory).ToList();
        cache.Set(key, (IEnumerable<CategoryDto>)dto, CategoryOpts());
        return dto;
    }

    public async Task<Result<int>> CreateCategoryAsync(CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return Result<int>.Failure("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Slug)) return Result<int>.Failure("Slug is required.");

        var entity = new Category
        {
            Name         = dto.Name.Trim(),
            Slug         = dto.Slug.Trim().ToLower(),
            Description  = dto.Description?.Trim(),
            Icon         = dto.Icon?.Trim(),
            ImageUrl     = dto.ImageUrl?.Trim(),
            DisplayOrder = dto.DisplayOrder,
            IsActive     = true
        };

        try
        {
            var id = await categories.CreateAsync(entity);
            EvictCategories();
            return Result<int>.Success(id);
        }
        catch (Exception ex)
        {
            return Result<int>.Failure(ex.Message);
        }
    }

    public async Task<Result> UpdateCategoryAsync(int id, UpdateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return Result.Failure("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Slug)) return Result.Failure("Slug is required.");

        var existing = await categories.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Category not found.");

        existing.Name         = dto.Name.Trim();
        existing.Slug         = dto.Slug.Trim().ToLower();
        existing.Description  = dto.Description?.Trim();
        existing.Icon         = dto.Icon?.Trim();
        existing.ImageUrl     = dto.ImageUrl?.Trim();
        existing.DisplayOrder = dto.DisplayOrder;
        existing.IsActive     = dto.IsActive;

        try
        {
            await categories.UpdateAsync(existing);
            EvictCategories();
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result> DeleteCategoryAsync(int id)
    {
        var existing = await categories.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Category not found.");

        try
        {
            await categories.DeleteAsync(id);
            EvictCategories();
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    // ── Products ──────────────────────────────────────────────────────────────

    public async Task<IEnumerable<ProductDto>> GetAllProductsAsync(
        int? categoryId = null, string? searchTerm = null)
    {
        // Admin endpoint — no caching (always fresh data)
        var list = await products.GetAllAsync(categoryId, searchTerm);
        return list.Select(MapProduct);
    }

    public async Task<IEnumerable<ProductSummaryDto>> GetPublicProductsAsync(
        int? categoryId = null, string? searchTerm = null, bool featuredOnly = false)
    {
        // Cache key encodes all query parameters
        var key = $"products:public:{categoryId}:{searchTerm?.ToLowerInvariant() ?? ""}:{featuredOnly}";

        if (cache.TryGetValue(key, out IEnumerable<ProductSummaryDto>? cached) && cached is not null)
            return cached;

        var list = await products.GetPublicAsync(categoryId, searchTerm, featuredOnly);
        var dto  = list.Select(MapSummary).ToList();
        cache.Set(key, (IEnumerable<ProductSummaryDto>)dto, ProductOpts());
        return dto;
    }

    public async Task<IEnumerable<ProductSummaryDto>> GetFeaturedProductsAsync()
    {
        const string key = "products:featured";

        if (cache.TryGetValue(key, out IEnumerable<ProductSummaryDto>? cached) && cached is not null)
            return cached;

        var list = await products.GetFeaturedAsync();
        var dto  = list.Select(MapSummary).ToList();
        cache.Set(key, (IEnumerable<ProductSummaryDto>)dto, ProductOpts());
        return dto;
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        // Admin endpoint — no caching
        var p = await products.GetByIdAsync(id);
        return p is null ? null : MapProduct(p);
    }

    public async Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var key = $"product:slug:{slug.ToLowerInvariant()}";

        if (cache.TryGetValue(key, out ProductDto? cached) && cached is not null)
            return cached;

        var p = await products.GetBySlugAsync(slug);
        if (p is null) return null;

        var dto = MapProduct(p);
        cache.Set(key, dto, ProductOpts());
        return dto;
    }

    public async Task<Result<int>> CreateProductAsync(CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))  return Result<int>.Failure("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Slug))  return Result<int>.Failure("Slug is required.");
        if (dto.Price <= 0)                        return Result<int>.Failure("Price must be greater than zero.");
        if (dto.CategoryId <= 0)                   return Result<int>.Failure("Category is required.");

        var entity = new Product
        {
            CategoryId       = dto.CategoryId,
            Name             = dto.Name.Trim(),
            Slug             = dto.Slug.Trim().ToLower(),
            Description      = dto.Description?.Trim(),
            ShortDescription = dto.ShortDescription?.Trim(),
            Price            = dto.Price,
            Unit             = dto.Unit.Trim(),
            Stock            = dto.Stock,
            IsAvailable      = dto.IsAvailable,
            IsFeatured       = dto.IsFeatured,
            ImageUrl         = dto.ImageUrl?.Trim(),
            Tags             = dto.Tags?.Trim(),
            DisplayOrder     = dto.DisplayOrder
        };

        try
        {
            var id = await products.CreateAsync(entity);
            EvictProducts();
            return Result<int>.Success(id);
        }
        catch (Exception ex)
        {
            return Result<int>.Failure(ex.Message);
        }
    }

    public async Task<Result> UpdateProductAsync(int id, UpdateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))  return Result.Failure("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Slug))  return Result.Failure("Slug is required.");
        if (dto.Price <= 0)                        return Result.Failure("Price must be greater than zero.");
        if (dto.CategoryId <= 0)                   return Result.Failure("Category is required.");

        var existing = await products.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Product not found.");

        existing.CategoryId       = dto.CategoryId;
        existing.Name             = dto.Name.Trim();
        existing.Slug             = dto.Slug.Trim().ToLower();
        existing.Description      = dto.Description?.Trim();
        existing.ShortDescription = dto.ShortDescription?.Trim();
        existing.Price            = dto.Price;
        existing.Unit             = dto.Unit.Trim();
        existing.Stock            = dto.Stock;
        existing.IsAvailable      = dto.IsAvailable;
        existing.IsFeatured       = dto.IsFeatured;
        existing.ImageUrl         = dto.ImageUrl?.Trim();
        existing.Tags             = dto.Tags?.Trim();
        existing.DisplayOrder     = dto.DisplayOrder;

        try
        {
            await products.UpdateAsync(existing);
            EvictProducts();
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result> DeleteProductAsync(int id)
    {
        var existing = await products.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Product not found.");

        await products.DeleteAsync(id);
        EvictProducts();
        return Result.Success();
    }

    public async Task<Result> SetProductAvailabilityAsync(int id, bool isAvailable)
    {
        var existing = await products.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Product not found.");

        await products.SetAvailabilityAsync(id, isAvailable);
        EvictProducts();
        return Result.Success();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static CategoryDto MapCategory(Category c) => new()
    {
        Id = c.Id, Name = c.Name, Slug = c.Slug, Description = c.Description,
        Icon = c.Icon, ImageUrl = c.ImageUrl, DisplayOrder = c.DisplayOrder,
        IsActive = c.IsActive, CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt
    };

    private static ProductDto MapProduct(Product p) => new()
    {
        Id = p.Id, CategoryId = p.CategoryId, CategoryName = p.CategoryName,
        Name = p.Name, Slug = p.Slug, Description = p.Description,
        ShortDescription = p.ShortDescription, Price = p.Price, Unit = p.Unit,
        Stock = p.Stock, IsAvailable = p.IsAvailable, IsFeatured = p.IsFeatured,
        ImageUrl = p.ImageUrl, Tags = p.Tags, DisplayOrder = p.DisplayOrder,
        CreatedAt = p.CreatedAt, UpdatedAt = p.UpdatedAt
    };

    private static ProductSummaryDto MapSummary(Product p) => new()
    {
        Id = p.Id, CategoryId = p.CategoryId, CategoryName = p.CategoryName,
        Name = p.Name, Slug = p.Slug, ShortDescription = p.ShortDescription,
        Price = p.Price, Unit = p.Unit, Stock = p.Stock,
        IsAvailable = p.IsAvailable, IsFeatured = p.IsFeatured,
        ImageUrl = p.ImageUrl, Tags = p.Tags, DisplayOrder = p.DisplayOrder
    };
}
