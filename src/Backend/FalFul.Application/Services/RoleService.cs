using FalFul.Application.DTOs;
using FalFul.Application.DTOs.Auth;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;

namespace FalFul.Application.Services;

public class RoleService(IRoleRepository roleRepo) : IRoleService
{
    public async Task<IEnumerable<RoleDto>> GetAllAsync()
    {
        var roles = await roleRepo.GetAllAsync();
        return roles.Select(MapDto);
    }

    public async Task<RoleDto?> GetUserRoleAsync(int userId)
    {
        var role = await roleRepo.GetUserRoleAsync(userId);
        return role is null ? null : MapDto(role);
    }

    public async Task<Result> AssignRoleAsync(int userId, int roleId, int adminId)
    {
        var roles = await roleRepo.GetAllAsync();
        if (!roles.Any(r => r.Id == roleId))
            return Result.Failure("Role not found.");

        await roleRepo.AssignRoleAsync(userId, roleId, adminId);
        return Result.Success("");
    }

    public async Task<Result<RoleDto>> CreateAsync(CreateRoleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return Result<RoleDto>.Failure("Role name is required.");

        try
        {
            var portalType = NormalisePortalType(dto.PortalType);
            var id = await roleRepo.CreateAsync(dto.Name.Trim(), dto.Description?.Trim(), portalType);
            return Result<RoleDto>.Success(new RoleDto { Id = id, Name = dto.Name.Trim(), Description = dto.Description, PortalType = portalType }, "");
        }
        catch (Exception ex)
        {
            return Result<RoleDto>.Failure(ex.Message);
        }
    }

    public async Task<Result> UpdateAsync(int id, UpdateRoleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return Result.Failure("Role name is required.");

        try
        {
            await roleRepo.UpdateAsync(id, dto.Name.Trim(), dto.Description?.Trim(), NormalisePortalType(dto.PortalType));
            return Result.Success("");
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    private static string NormalisePortalType(string? raw) =>
        raw?.ToLower() switch { "rider" => "rider", "customer" => "customer", _ => "admin" };

    public async Task<IEnumerable<PermissionDto>> GetRolePermissionsAsync(int roleId)
    {
        var perms = await roleRepo.GetRolePermissionsAsync(roleId);
        return perms.Select(p => new PermissionDto
        {
            Id          = p.Id,
            Name        = p.Name,
            DisplayName = p.DisplayName,
            Category    = p.Category,
            SortOrder   = p.SortOrder
        });
    }

    public async Task<Result> SetRolePermissionsAsync(int roleId, SetRolePermissionsDto dto)
    {
        await roleRepo.SetRolePermissionsAsync(roleId, dto.PermissionIds);
        return Result.Success("");
    }

    public async Task<Result> SetDefaultAsync(int roleId)
    {
        var roles = await roleRepo.GetAllAsync();
        if (!roles.Any(r => r.Id == roleId))
            return Result.Failure("Role not found.");

        await roleRepo.SetDefaultAsync(roleId);
        return Result.Success("");
    }

    public async Task<Result> DeleteAsync(int roleId)
    {
        try
        {
            await roleRepo.DeleteAsync(roleId);
            return Result.Success("");
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    private static RoleDto MapDto(Domain.Entities.Role r) =>
        new() { Id = r.Id, Name = r.Name, Description = r.Description, IsDefault = r.IsDefault, PortalType = r.PortalType };
}
