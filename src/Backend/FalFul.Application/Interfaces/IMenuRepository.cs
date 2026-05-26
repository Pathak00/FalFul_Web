using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IMenuRepository
{
    Task<IEnumerable<MenuItem>> GetAllAsync();
    Task<IEnumerable<MenuItem>> GetVisibleAsync(int? userType);
    Task<int> CreateAsync(MenuItem item, int? createdBy);
    Task UpdateAsync(MenuItem item, int? updatedBy);
    Task DeleteAsync(int id, int? deletedBy);
}
