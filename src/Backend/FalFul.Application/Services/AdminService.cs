using FalFul.Application.DTOs.Admin;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;

namespace FalFul.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUserRepository _users;
    private readonly IAdminRepository _admin;
    private readonly IPasswordHasher _hasher;

    public AdminService(IUserRepository users, IAdminRepository admin, IPasswordHasher hasher)
    {
        _users = users;
        _admin = admin;
        _hasher = hasher;
    }

    public async Task<IEnumerable<AdminUserDto>> GetAllUsersAsync()
    {
        var users = await _users.GetAllAsync();
        return users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber,
            UserType = u.UserType.ToString(),
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt
        });
    }

    public async Task<AdminStatsDto> GetStatsAsync() =>
        await _admin.GetStatsAsync();

    public async Task<Result> SetUserActiveAsync(SetUserActiveDto dto, int? adminId)
    {
        try
        {
            await _users.SetActiveAsync(dto.UserId, dto.IsActive, adminId);
            return Result.Success();
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> SetUserTypeAsync(SetUserTypeDto dto, int? adminId)
    {
        try
        {
            await _users.SetUserTypeAsync(dto.UserId, dto.UserType, adminId);
            return Result.Success();
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> ResetPasswordAsync(AdminResetPasswordDto dto, int? adminId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
                return Result.Failure("Password must be at least 6 characters.");
            var hash = _hasher.Hash(dto.NewPassword);
            await _users.ResetPasswordAsync(dto.UserId, hash, adminId);
            return Result.Success();
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteUserAsync(int userId, int? adminId)
    {
        try
        {
            await _users.SoftDeleteAsync(userId, adminId);
            return Result.Success();
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }
}
