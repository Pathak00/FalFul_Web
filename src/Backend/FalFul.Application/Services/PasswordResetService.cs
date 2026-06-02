using System.Security.Cryptography;
using System.Text;
using FalFul.Application.DTOs.Auth;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;

namespace FalFul.Application.Services;

public class PasswordResetService(
    IUserRepository               users,
    IPasswordResetOtpRepository   otpRepo,
    IPasswordResetTokenRepository tokenRepo,
    IRefreshTokenRepository       refreshTokens,
    IPasswordHasher               hasher,
    IEmailService                 email,
    ISmsService                   sms) : IPasswordResetService
{
    private const int OtpExpiryMinutes   = 10;
    private const int TokenExpiryMinutes = 15;
    private const int MaxOtpAttempts     = 5;
    private const int RateLimitWindow    = 15;
    private const int RateLimitMax       = 3;

    // ── Step 1: request OTP ───────────────────────────────────────────────────

    public async Task<Result<ForgotPasswordResponseDto>> ForgotPasswordAsync(
        string identifier, string? ipAddress)
    {
        identifier = identifier.Trim();
        bool isEmail  = identifier.Contains('@');
        var  user     = isEmail
            ? await users.GetByEmailAsync(identifier)
            : await users.GetByPhoneAsync(identifier);

        // Always succeed to prevent user enumeration
        if (user is null || !user.IsActive)
            return Result<ForgotPasswordResponseDto>.Success(BuildFakeResponse(isEmail, identifier));

        // Rate-limit: max 3 OTPs per user / IP in 15 minutes
        var recentUser = await otpRepo.CountRecentAsync(user.Id, null, RateLimitWindow);
        var recentIp   = ipAddress is not null
            ? await otpRepo.CountRecentAsync(null, ipAddress, RateLimitWindow)
            : 0;

        if (recentUser >= RateLimitMax || recentIp >= RateLimitMax)
            return Result<ForgotPasswordResponseDto>.Success(BuildFakeResponse(isEmail, identifier));

        // Generate + hash OTP
        var plainOtp = Random.Shared.Next(100_000, 1_000_000).ToString();
        var otpHash  = BCrypt.Net.BCrypt.HashPassword(plainOtp, workFactor: 8);

        var record = new PasswordResetOtp
        {
            UserId      = user.Id,
            OtpHash     = otpHash,
            Channel     = isEmail ? (byte)1 : (byte)2,
            Destination = isEmail ? user.Email! : user.PhoneNumber!,
            ExpiresAt   = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes + 345 / 60.0), // Nepal offset stored
            IpAddress   = ipAddress,
        };
        // Correct Nepal time: use same pattern as DB (UTC + 345 min)
        record.ExpiresAt = DateTime.UtcNow.AddMinutes(345).AddMinutes(OtpExpiryMinutes);

        await otpRepo.CreateAsync(record);

        // Send OTP
        if (isEmail)
            await SendEmailOtp(user.Email!, user.FullName, plainOtp);
        else
            await SendSmsOtp(user.PhoneNumber!, plainOtp);

        var masked = isEmail ? MaskEmail(user.Email!) : MaskPhone(user.PhoneNumber!);
        return Result<ForgotPasswordResponseDto>.Success(new ForgotPasswordResponseDto
        {
            MaskedDestination = masked,
            Channel           = isEmail ? "email" : "sms",
            ExpiresInMinutes  = OtpExpiryMinutes,
        });
    }

    // ── Step 2: verify OTP → return reset token ───────────────────────────────

    public async Task<Result<VerifyOtpResponseDto>> VerifyOtpAsync(
        string identifier, string otp, string? ipAddress)
    {
        identifier = identifier.Trim();
        bool isEmail = identifier.Contains('@');
        var  user    = isEmail
            ? await users.GetByEmailAsync(identifier)
            : await users.GetByPhoneAsync(identifier);

        if (user is null)
            return Result<VerifyOtpResponseDto>.Failure("Invalid or expired OTP.");

        var record = await otpRepo.GetActiveByUserIdAsync(user.Id);
        if (record is null)
            return Result<VerifyOtpResponseDto>.Failure("OTP has expired or has already been used. Please request a new one.");

        if (record.AttemptCount >= MaxOtpAttempts)
        {
            await otpRepo.MarkUsedAsync(record.Id);
            return Result<VerifyOtpResponseDto>.Failure("Too many incorrect attempts. Please request a new OTP.");
        }

        if (!BCrypt.Net.BCrypt.Verify(otp.Trim(), record.OtpHash))
        {
            await otpRepo.IncrementAttemptAsync(record.Id);
            var remaining = MaxOtpAttempts - (record.AttemptCount + 1);
            return Result<VerifyOtpResponseDto>.Failure(
                remaining > 0
                    ? $"Incorrect OTP. {remaining} attempt(s) remaining."
                    : "Too many incorrect attempts. Please request a new OTP.");
        }

        await otpRepo.MarkUsedAsync(record.Id);

        // Issue a short-lived reset token (raw → return to client; hash → store)
        var rawToken  = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var tokenHash = HashToken(rawToken);

        await tokenRepo.CreateAsync(new PasswordResetToken
        {
            UserId    = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(345).AddMinutes(TokenExpiryMinutes),
            IpAddress = ipAddress,
        });

        return Result<VerifyOtpResponseDto>.Success(new VerifyOtpResponseDto
        {
            ResetToken       = rawToken,
            ExpiresInMinutes = TokenExpiryMinutes,
        });
    }

    // ── Step 3: set new password ──────────────────────────────────────────────

    public async Task<Result> ResetPasswordAsync(string resetToken, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
            return Result.Failure("Password must be at least 8 characters.");

        var tokenHash = HashToken(resetToken);
        var record    = await tokenRepo.GetActiveByHashAsync(tokenHash);

        if (record is null)
            return Result.Failure("Reset link has expired or is invalid. Please request a new one.");

        var passwordHash = hasher.Hash(newPassword);
        await users.UpdatePasswordAsync(record.UserId, passwordHash);
        await tokenRepo.MarkUsedAsync(record.Id);
        await refreshTokens.RevokeAllByUserAsync(record.UserId);

        return Result.Success();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string HashToken(string raw)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string MaskEmail(string e)
    {
        var at  = e.IndexOf('@');
        if (at <= 1) return "***@***";
        var local  = e[..at];
        var domain = e[at..];
        var visible = local.Length > 2 ? local[..2] : local[..1];
        return visible + new string('*', Math.Min(local.Length - visible.Length, 4)) + domain;
    }

    private static string MaskPhone(string p)
    {
        if (p.Length < 6) return "****";
        return p[..2] + new string('*', p.Length - 4) + p[^2..];
    }

    private static ForgotPasswordResponseDto BuildFakeResponse(bool isEmail, string identifier)
    {
        var masked = isEmail ? MaskEmail(identifier) : MaskPhone(identifier);
        return new ForgotPasswordResponseDto
        {
            MaskedDestination = masked,
            Channel           = isEmail ? "email" : "sms",
            ExpiresInMinutes  = OtpExpiryMinutes,
        };
    }

    private async Task SendEmailOtp(string to, string name, string otp)
    {
        var subject = "FalFul — Your Password Reset OTP";
        var body    = $"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
              <h2 style="color:#16a34a;margin-top:0">Password Reset</h2>
              <p>Hi {name},</p>
              <p>Use the OTP below to reset your FalFul password. It expires in <strong>{OtpExpiryMinutes} minutes</strong>.</p>
              <div style="font-size:2rem;font-weight:800;letter-spacing:0.25em;text-align:center;padding:16px;background:#f0fdf4;border-radius:8px;color:#15803d;margin:20px 0">
                {otp}
              </div>
              <p style="color:#64748b;font-size:0.85rem">If you did not request this, you can safely ignore this email.</p>
            </div>
            """;
        await email.SendAsync(to, subject, body);
    }

    private async Task SendSmsOtp(string phone, string otp)
    {
        var message = $"Your FalFul password reset OTP is: {otp}. Valid for {OtpExpiryMinutes} minutes. Do not share this code.";
        await sms.SendAsync(phone, message);
    }
}
