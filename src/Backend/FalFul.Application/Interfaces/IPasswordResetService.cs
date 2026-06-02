using FalFul.Application.DTOs.Auth;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IPasswordResetService
{
    Task<Result<ForgotPasswordResponseDto>> ForgotPasswordAsync(string identifier, string? ipAddress);
    Task<Result<VerifyOtpResponseDto>>      VerifyOtpAsync(string identifier, string otp, string? ipAddress);
    Task<Result>                            ResetPasswordAsync(string resetToken, string newPassword);
}
