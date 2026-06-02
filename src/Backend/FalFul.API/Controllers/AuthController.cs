using FalFul.Application.DTOs.Auth;
using FalFul.Application.Interfaces;
using FalFul.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService, IPasswordResetService passwordReset) : ControllerBase
{
    private readonly IAuthService _authService = authService;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
    {
        var result = await _authService.RegisterUserAsync(dto);
        if (!result.IsSuccess)
            return BadRequest(new { message = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("register-organization")]
    public async Task<IActionResult> RegisterOrganization([FromBody] RegisterOrganizationDto dto)
    {
        var result = await _authService.RegisterOrganizationAsync(dto);
        if (!result.IsSuccess)
            return BadRequest(new { message = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (!result.IsSuccess)
            return Unauthorized(new { message = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
        if (!result.IsSuccess)
            return Unauthorized(new { message = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        var result = await _authService.GoogleLoginAsync(dto.IdToken);
        if (!result.IsSuccess)
            return Unauthorized(new { message = result.Error });
        return Ok(result.Data);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenDto dto)
    {
        await _authService.LogoutAsync(dto.RefreshToken);
        return Ok(new { message = "Logged out successfully." });
    }

    // ── Password reset ────────────────────────────────────────────────────────

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Identifier))
            return BadRequest(new { message = "Email or phone number is required." });

        var ip     = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await passwordReset.ForgotPasswordAsync(dto.Identifier, ip);

        // Always 200 to prevent user enumeration
        return result.IsSuccess
            ? Ok(result.Data)
            : Ok(new { maskedDestination = "", channel = "", expiresInMinutes = 10 });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Identifier) || string.IsNullOrWhiteSpace(dto.Otp))
            return BadRequest(new { message = "Identifier and OTP are required." });

        var ip     = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await passwordReset.VerifyOtpAsync(dto.Identifier, dto.Otp, ip);

        return result.IsSuccess
            ? Ok(result.Data)
            : BadRequest(new { message = result.Error });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ResetToken))
            return BadRequest(new { message = "Reset token is required." });

        if (dto.NewPassword != dto.ConfirmPassword)
            return BadRequest(new { message = "Passwords do not match." });

        var result = await passwordReset.ResetPasswordAsync(dto.ResetToken, dto.NewPassword);
        return result.IsSuccess
            ? Ok(new { message = "Password reset successfully. Please log in." })
            : BadRequest(new { message = result.Error });
    }
}
