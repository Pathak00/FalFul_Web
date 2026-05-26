using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IOrganizationRepository
{
    Task<Organization?> GetByIdAsync(int id);
    Task<Organization?> GetByOwnerIdAsync(int ownerId);
    Task<int> CreateAsync(Organization organization);
    Task UpdateAsync(Organization organization);
    Task<bool> ExistsByNameAsync(string name);
}
