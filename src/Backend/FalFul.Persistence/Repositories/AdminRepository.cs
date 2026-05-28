using Dapper;
using FalFul.Application.DTOs.Admin;
using FalFul.Application.Interfaces;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly DapperContext _context;

    public AdminRepository(DapperContext context) => _context = context;

    public async Task<AdminStatsDto> GetStatsAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstAsync<AdminStatsDto>(
            "sp_Admin_GetStats",
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<AdminUserDto>> GetUsersAsync()
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<AdminUserDto>(
            "sp_User_GetAll",
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
