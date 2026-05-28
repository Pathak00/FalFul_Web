using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class PermissionRepository : IPermissionRepository
{
    private readonly DapperContext _context;

    public PermissionRepository(DapperContext context) => _context = context;

    public async Task<IEnumerable<Permission>> GetAllAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<Permission>(
            "sp_Permission_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<string>> GetEffectivePermissionsAsync(int userId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<string>(
            "sp_UserPermission_GetEffective",
            new { UserId = userId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<string>> GetUserSpecificPermissionsAsync(int userId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<string>(
            "sp_UserPermission_GetUserSpecific",
            new { UserId = userId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SetUserPermissionsAsync(int userId, IEnumerable<string> permissions, int? grantedBy = null)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_UserPermission_SetForStaff",
            new { UserId = userId, Permissions = string.Join(",", permissions), GrantedBy = grantedBy },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
