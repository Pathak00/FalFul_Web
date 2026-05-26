using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IBannerRepository
{
    Task<int> CreateAsync(Banner banner, int? createdBy);
    Task UpdateAsync(Banner banner, int? updatedBy);
    Task DeleteAsync(int id, int? deletedBy);
    Task<IEnumerable<Banner>> GetAllAsync();
    Task<IEnumerable<Banner>> GetActiveAsync(string? position = null);
}
