using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IPageRepository
{
    Task<int> CreateAsync(Page page, int? createdBy);
    Task UpdateAsync(Page page, int? updatedBy);
    Task DeleteAsync(int id, int? deletedBy);
    Task<IEnumerable<Page>> GetAllAsync();
    Task<Page?> GetByIdAsync(int id);
    Task<Page?> GetBySlugAsync(string slug, bool adminMode = false);
}
