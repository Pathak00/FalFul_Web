using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IPasswordResetOtpRepository
{
    Task<int> CreateAsync(PasswordResetOtp otp);
    Task<PasswordResetOtp?> GetActiveByUserIdAsync(int userId);
    Task IncrementAttemptAsync(int id);
    Task MarkUsedAsync(int id);
    Task<int> CountRecentAsync(int? userId, string? ipAddress, int windowMinutes = 15);
}
