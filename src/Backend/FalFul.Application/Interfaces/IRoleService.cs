using FalFul.Application.DTOs;
using FalFul.Application.DTOs.Auth;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IRoleService
{
    Task<IEnumerable<RoleDto>> GetAllAsync();
    Task<RoleDto?> GetUserRoleAsync(int userId);
    Task<Result> AssignRoleAsync(int userId, int roleId, int adminId);
    Task<Result<RoleDto>> CreateAsync(CreateRoleDto dto);
    Task<Result> UpdateAsync(int id, UpdateRoleDto dto);
    Task<IEnumerable<PermissionDto>> GetRolePermissionsAsync(int roleId);
    Task<Result> SetRolePermissionsAsync(int roleId, SetRolePermissionsDto dto);
    Task<Result> SetDefaultAsync(int roleId);
    Task<Result> DeleteAsync(int roleId);
}
