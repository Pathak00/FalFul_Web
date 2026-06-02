using FalFul.Application.DTOs.Product;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;

namespace FalFul.Application.Services;

public class ProductService(ICategoryRepository categories, IProductRepository products) : IProductService
{
    // ── Categories ──────────────────────────────────────────────────────────

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        var list = await categories.GetAllAsync();
        return list.Select(MapCategory);
    }

    public async Task<IEnumerable<CategoryDto>> GetActiveCategoriesAsync()
    {
        var list = await categories.GetActiveAsync();
        return list.Select(MapCategory);
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

        try { var id = await categories.CreateAsync(entity); return Result<int>.Success(id); }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
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

        try { await categories.UpdateAsync(existing); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteCategoryAsync(int id)
    {
        var existing = await categories.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Category not found.");

        try { await categories.DeleteAsync(id); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    // ── Products ─────────────────────────────────────────────────────────────

    public async Task<IEnumerable<ProductDto>> GetAllProductsAsync(int? categoryId = null, string? searchTerm = null)
    {
        var list = await products.GetAllAsync(categoryId, searchTerm);
        return list.Select(MapProduct);
    }

    public async Task<IEnumerable<ProductSummaryDto>> GetPublicProductsAsync(int? categoryId = null, string? searchTerm = null, bool featuredOnly = false)
    {
        var list = await products.GetPublicAsync(categoryId, searchTerm, featuredOnly);
        return list.Select(MapSummary);
    }

    public async Task<IEnumerable<ProductSummaryDto>> GetFeaturedProductsAsync()
    {
        var list = await products.GetFeaturedAsync();
        return list.Select(MapSummary);
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var p = await products.GetByIdAsync(id);
        return p is null ? null : MapProduct(p);
    }

    public async Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var p = await products.GetBySlugAsync(slug);
        return p is null ? null : MapProduct(p);
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
            Mrp              = dto.Mrp > 0 ? dto.Mrp : null,
            Unit             = dto.Unit.Trim(),
            Stock            = dto.Stock,
            IsAvailable      = dto.IsAvailable,
            IsFeatured       = dto.IsFeatured,
            ImageUrl         = dto.ImageUrl?.Trim(),
            Tags             = dto.Tags?.Trim(),
            DisplayOrder     = dto.DisplayOrder,
            MinOrderGrams    = dto.MinOrderGrams > 0 ? dto.MinOrderGrams : null,
            GramStep         = dto.GramStep > 0 ? dto.GramStep : null,
            CutFruitPrice    = dto.CutFruitPrice > 0 ? dto.CutFruitPrice : null,
            ShowInCatalog    = dto.ShowInCatalog
        };

        try { var id = await products.CreateAsync(entity); return Result<int>.Success(id); }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
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
        existing.Mrp              = dto.Mrp > 0 ? dto.Mrp : null;
        existing.Unit             = dto.Unit.Trim();
        existing.Stock            = dto.Stock;
        existing.IsAvailable      = dto.IsAvailable;
        existing.IsFeatured       = dto.IsFeatured;
        existing.ImageUrl         = dto.ImageUrl?.Trim();
        existing.Tags             = dto.Tags?.Trim();
        existing.DisplayOrder     = dto.DisplayOrder;
        existing.MinOrderGrams    = dto.MinOrderGrams > 0 ? dto.MinOrderGrams : null;
        existing.GramStep         = dto.GramStep > 0 ? dto.GramStep : null;
        existing.CutFruitPrice    = dto.CutFruitPrice > 0 ? dto.CutFruitPrice : null;
        existing.ShowInCatalog    = dto.ShowInCatalog;

        try { await products.UpdateAsync(existing); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteProductAsync(int id)
    {
        var existing = await products.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Product not found.");

        await products.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> SetProductAvailabilityAsync(int id, bool isAvailable)
    {
        var existing = await products.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Product not found.");

        await products.SetAvailabilityAsync(id, isAvailable);
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
        ShortDescription = p.ShortDescription, Price = p.Price, Mrp = p.Mrp, Unit = p.Unit,
        Stock = p.Stock, IsAvailable = p.IsAvailable, IsFeatured = p.IsFeatured,
        ImageUrl = p.ImageUrl, Tags = p.Tags, DisplayOrder = p.DisplayOrder,
        MinOrderGrams = p.MinOrderGrams, GramStep = p.GramStep, CutFruitPrice = p.CutFruitPrice,
        ShowInCatalog = p.ShowInCatalog, CreatedAt = p.CreatedAt, UpdatedAt = p.UpdatedAt
    };

    private static ProductSummaryDto MapSummary(Product p) => new()
    {
        Id = p.Id, CategoryId = p.CategoryId, CategoryName = p.CategoryName,
        Name = p.Name, Slug = p.Slug, ShortDescription = p.ShortDescription,
        Price = p.Price, Mrp = p.Mrp, Unit = p.Unit, Stock = p.Stock,
        IsAvailable = p.IsAvailable, IsFeatured = p.IsFeatured,
        ImageUrl = p.ImageUrl, Tags = p.Tags, DisplayOrder = p.DisplayOrder,
        MinOrderGrams = p.MinOrderGrams, GramStep = p.GramStep, CutFruitPrice = p.CutFruitPrice,
        ShowInCatalog = p.ShowInCatalog
    };
}
