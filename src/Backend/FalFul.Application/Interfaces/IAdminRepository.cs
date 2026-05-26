using FalFul.Application.DTOs.Admin;

namespace FalFul.Application.Interfaces;

public interface IAdminRepository
{
    Task<AdminStatsDto> GetStatsAsync();
}
