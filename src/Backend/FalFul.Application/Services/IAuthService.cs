using FalFul.Application.DTOs.Auth;
using FalFul.Domain.Common;

namespace FalFul.Application.Services;

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegisterUserAsync(RegisterUserDto dto);
    Task<Result<AuthResponseDto>> RegisterOrganizationAsync(RegisterOrganizationDto dto);
    Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<Result<AuthResponseDto>> RefreshTokenAsync(string refreshToken);
    Task<Result<AuthResponseDto>> GoogleLoginAsync(string idToken);
    Task<Result> LogoutAsync(string refreshToken);
}
