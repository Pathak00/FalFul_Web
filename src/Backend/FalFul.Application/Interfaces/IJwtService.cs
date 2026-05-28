using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user, string role, IEnumerable<string> permissions);
    string GenerateRefreshToken();
    int? GetUserIdFromToken(string token);
}
