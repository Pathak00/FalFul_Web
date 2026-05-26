using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IHomepageSectionRepository
{
    Task<IEnumerable<HomepageSection>> GetAllAsync();
    Task<IEnumerable<HomepageSection>> GetVisibleAsync();
    Task<int> UpsertAsync(HomepageSection section, int? updatedBy);
}
