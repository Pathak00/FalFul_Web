using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IRoleRepository
{
    Task<IEnumerable<Role>> GetAllAsync();
    Task<Role?> GetByIdAsync(int id);
    Task<Role?> GetUserRoleAsync(int userId);
    Task AssignRoleAsync(int userId, int roleId, int? assignedBy = null);
    Task<int> CreateAsync(string name, string? description);
    Task UpdateAsync(int id, string name, string? description);
    Task<IEnumerable<Permission>> GetRolePermissionsAsync(int roleId);
    Task SetRolePermissionsAsync(int roleId, IEnumerable<int> permissionIds);
    Task<Role?> GetDefaultAsync();
    Task SetDefaultAsync(int roleId);
    Task DeleteAsync(int roleId);
}
