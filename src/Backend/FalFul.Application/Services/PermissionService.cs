using FalFul.Application.DTOs;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;

namespace FalFul.Application.Services;

public class PermissionService : IPermissionService
{
    private readonly IPermissionRepository _permRepo;

    public PermissionService(IPermissionRepository permRepo)
    {
        _permRepo = permRepo;
    }

    public async Task<IEnumerable<PermissionDto>> GetAllAsync()
    {
        var perms = await _permRepo.GetAllAsync();
        return perms.Select(p => new PermissionDto
        {
            Id          = p.Id,
            Name        = p.Name,
            DisplayName = p.DisplayName,
            Category    = p.Category,
            SortOrder   = p.SortOrder
        });
    }

    public async Task<IEnumerable<string>> GetUserPermissionsAsync(int userId)
    {
        return await _permRepo.GetEffectivePermissionsAsync(userId);
    }

    public async Task<Result> SetUserPermissionsAsync(int userId, IEnumerable<string> permissions, int adminId)
    {
        await _permRepo.SetUserPermissionsAsync(userId, permissions, adminId);
        return Result.Success();
    }
}
