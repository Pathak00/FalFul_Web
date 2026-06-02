using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IPasswordResetTokenRepository
{
    Task<int> CreateAsync(PasswordResetToken token);
    Task<PasswordResetToken?> GetActiveByHashAsync(string tokenHash);
    Task MarkUsedAsync(int id);
}
