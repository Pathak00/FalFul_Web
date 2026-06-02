using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class PasswordResetTokenRepository(DapperContext context) : IPasswordResetTokenRepository
{
    public async Task<int> CreateAsync(PasswordResetToken token)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_PasswordResetToken_Create",
            new
            {
                token.UserId,
                token.TokenHash,
                token.ExpiresAt,
                token.IpAddress,
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<PasswordResetToken?> GetActiveByHashAsync(string tokenHash)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<PasswordResetToken>(
            "sp_PasswordResetToken_GetActive",
            new { TokenHash = tokenHash },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task MarkUsedAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_PasswordResetToken_MarkUsed",
            new { Id = id },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
