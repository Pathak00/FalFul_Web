using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IAdminNavRepository
{
    Task<IEnumerable<AdminNavItem>> GetAllAsync();
    Task<IEnumerable<AdminNavItem>> GetForUserAsync(int userId);
    /// <summary>Returns items the user has permission to access, regardless of IsVisible. Used for route guard checks.</summary>
    Task<IEnumerable<AdminNavItem>> GetPermittedForUserAsync(int userId);
    Task UpdateAsync(AdminNavItem item);
    Task<int> CreateAsync(AdminNavItem item);
    /// <summary>Deletes a non-system item. Returns false if the item is a system item.</summary>
    Task<bool> DeleteAsync(int id);
}
