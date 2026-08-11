using FalFul.Application.DTOs.Product;
using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync(int? categoryId = null, string? searchTerm = null);
    Task<IEnumerable<Product>> GetPublicAsync(int? categoryId = null, string? searchTerm = null, bool featuredOnly = false);
    Task<IEnumerable<Product>> GetFeaturedAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product?> GetBySlugAsync(string slug);
    Task<int> CreateAsync(Product product);
    Task UpdateAsync(Product product);
    Task DeleteAsync(int id);
    Task SetAvailabilityAsync(int id, bool isAvailable);

    Task<IEnumerable<SubscriptionProduct>> GetAllSubProduct();
}
