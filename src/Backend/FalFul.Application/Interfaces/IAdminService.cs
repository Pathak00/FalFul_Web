using FalFul.Application.DTOs.Admin;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IAdminService
{
    Task<IEnumerable<AdminUserDto>> GetAllUsersAsync();
    Task<AdminStatsDto> GetStatsAsync();
    Task<Result> SetUserActiveAsync(SetUserActiveDto dto, int? adminId);
    Task<Result> SetUserTypeAsync(SetUserTypeDto dto, int? adminId);
    Task<Result> ResetPasswordAsync(AdminResetPasswordDto dto, int? adminId);
    Task<Result> DeleteUserAsync(int userId, int? adminId);
}
