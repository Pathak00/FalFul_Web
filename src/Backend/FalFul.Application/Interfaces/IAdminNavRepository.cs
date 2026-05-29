using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IAdminNavRepository
{
    Task<IEnumerable<AdminNavItem>> GetAllAsync();
    Task<IEnumerable<AdminNavItem>> GetForUserAsync(int userId);
    Task UpdateAsync(AdminNavItem item);
}
