using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task SaveAsync(RefreshToken refreshToken);
    Task RevokeAsync(string token);
    Task RevokeAllByUserAsync(int userId);
}
