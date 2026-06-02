using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;

namespace FalFul.Persistence.Repositories;

public class PasswordResetOtpRepository(DapperContext context) : IPasswordResetOtpRepository
{
    public async Task<int> CreateAsync(PasswordResetOtp otp)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_PasswordResetOtp_Create",
            new
            {
                otp.UserId,
                otp.OtpHash,
                otp.Channel,
                otp.Destination,
                otp.ExpiresAt,
                otp.IpAddress,
            },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<PasswordResetOtp?> GetActiveByUserIdAsync(int userId)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<PasswordResetOtp>(
            "sp_PasswordResetOtp_GetActive",
            new { UserId = userId },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task IncrementAttemptAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_PasswordResetOtp_IncrementAttempt",
            new { Id = id },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task MarkUsedAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_PasswordResetOtp_MarkUsed",
            new { Id = id },
            commandType: System.Data.CommandType.StoredProcedure);
    }

    public async Task<int> CountRecentAsync(int? userId, string? ipAddress, int windowMinutes = 15)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_PasswordResetOtp_CountRecent",
            new { UserId = userId, IpAddress = ipAddress, WindowMinutes = windowMinutes },
            commandType: System.Data.CommandType.StoredProcedure);
    }
}
