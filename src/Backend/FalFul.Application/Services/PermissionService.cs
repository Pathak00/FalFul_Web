using FalFul.Application.DTOs;
using FalFul.Application.Interfaces;

namespace FalFul.Application.Services;

public class PermissionService(IPermissionRepository permRepo) : IPermissionService
{
    public async Task<IEnumerable<PermissionDto>> GetAllAsync()
    {
        var perms = await permRepo.GetAllAsync();
        return perms.Select(p => new PermissionDto
        {
            Id          = p.Id,
            Name        = p.Name,
            DisplayName = p.DisplayName,
            Category    = p.Category,
            SortOrder   = p.SortOrder
        });
    }
}
