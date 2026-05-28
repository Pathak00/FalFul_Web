using FalFul.Application.DTOs;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IPermissionService
{
    Task<IEnumerable<PermissionDto>> GetAllAsync();
    Task<IEnumerable<string>> GetUserPermissionsAsync(int userId);
    Task<Result> SetUserPermissionsAsync(int userId, IEnumerable<string> permissions, int adminId);
}
