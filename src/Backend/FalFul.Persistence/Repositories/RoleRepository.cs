using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class RoleRepository(DapperContext context) : IRoleRepository
{
    public async Task<IEnumerable<Role>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Role>(
            "sp_Role_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<Role?> GetByIdAsync(int id)
    {
        var all = await GetAllAsync();
        return all.FirstOrDefault(r => r.Id == id);
    }

    public async Task<Role?> GetUserRoleAsync(int userId)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Role>(
            "sp_UserRole_GetByUser",
            new { UserId = userId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task AssignRoleAsync(int userId, int roleId, int? assignedBy = null)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_UserRole_Assign",
            new { UserId = userId, RoleId = roleId, AssignedBy = assignedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(string name, string? description, string portalType = "admin")
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Role_Create",
            new { Name = name, Description = description, PortalType = portalType },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(int id, string name, string? description, string portalType = "admin")
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Role_Update",
            new { Id = id, Name = name, Description = description, PortalType = portalType },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Permission>> GetRolePermissionsAsync(int roleId)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Permission>(
            "sp_RolePermission_GetForRole",
            new { RoleId = roleId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SetRolePermissionsAsync(int roleId, IEnumerable<int> permissionIds)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_RolePermission_SetForRole",
            new { RoleId = roleId, PermissionIds = string.Join(",", permissionIds) },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<Role?> GetDefaultAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Role>(
            "sp_Role_GetDefault",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SetDefaultAsync(int roleId)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Role_SetDefault",
            new { RoleId = roleId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int roleId)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Role_Delete",
            new { RoleId = roleId },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
