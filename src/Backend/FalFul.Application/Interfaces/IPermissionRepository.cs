using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IPermissionRepository
{
    Task<IEnumerable<Permission>> GetAllAsync();
    Task<IEnumerable<string>> GetEffectivePermissionsAsync(int userId);
}
