using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly DapperContext _context;

    public RefreshTokenRepository(DapperContext context) => _context = context;

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<RefreshToken>(
            "sp_RefreshToken_Get",
            new { Token = token },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task SaveAsync(RefreshToken refreshToken)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_RefreshToken_Save",
            new
            {
                refreshToken.UserId,
                refreshToken.Token,
                refreshToken.ExpiresAt,
                refreshToken.DeviceInfo,
                refreshToken.IpAddress
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task RevokeAsync(string token)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_RefreshToken_Revoke",
            new { Token = token },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task RevokeAllByUserAsync(int userId)
    {
        using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_RefreshToken_RevokeAllByUser",
            new { UserId = userId },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
