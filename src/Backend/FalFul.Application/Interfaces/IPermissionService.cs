using FalFul.Application.DTOs;

namespace FalFul.Application.Interfaces;

public interface IPermissionService
{
    Task<IEnumerable<PermissionDto>> GetAllAsync();
}
