using FalFul.Application.DTOs.Product;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IProductService
{
    // Categories
    Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
    Task<IEnumerable<CategoryDto>> GetActiveCategoriesAsync();
    Task<Result<int>> CreateCategoryAsync(CreateCategoryDto dto);
    Task<Result> UpdateCategoryAsync(int id, UpdateCategoryDto dto);
    Task<Result> DeleteCategoryAsync(int id);

    // Products
    Task<IEnumerable<ProductDto>> GetAllProductsAsync(int? categoryId = null, string? searchTerm = null);
    Task<IEnumerable<ProductSummaryDto>> GetPublicProductsAsync(int? categoryId = null, string? searchTerm = null, bool featuredOnly = false);
    Task<IEnumerable<ProductSummaryDto>> GetFeaturedProductsAsync();
    Task<ProductDto?> GetProductByIdAsync(int id);
    Task<ProductDto?> GetProductBySlugAsync(string slug);
    Task<Result<int>> CreateProductAsync(CreateProductDto dto);
    Task<Result> UpdateProductAsync(int id, UpdateProductDto dto);
    Task<Result> DeleteProductAsync(int id);
    Task<Result> SetProductAvailabilityAsync(int id, bool isAvailable);

    Task<IEnumerable<SubscriptionProduct>> GetSubProduct();
}
