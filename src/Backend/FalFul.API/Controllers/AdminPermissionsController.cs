using System.IdentityModel.Tokens.Jwt;
using FalFul.Application.DTOs.Auth;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminPermissionsController(IPermissionService permService) : ControllerBase
{
    // Read-only metadata needed by multiple admin pages (roles, users).
    // Any authenticated admin can list permissions; writes remain restricted.
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions() =>
        Ok(await permService.GetAllAsync());

    [HttpGet("users/{id:int}/permissions")]
    [Authorize(Policy = "Perm:users")]
    public async Task<IActionResult> GetUserPermissions(int id) =>
        Ok(await permService.GetUserPermissionsAsync(id));

    // Writing per-user permission overrides is a system-level operation.
    [HttpPut("users/{id:int}/permissions")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> SetUserPermissions(int id, [FromBody] SetUserPermissionsDto dto)
    {
        var adminId = int.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                      ?? User.FindFirst("sub")?.Value ?? "0");
        var result = await permService.SetUserPermissionsAsync(id, dto.Permissions, adminId);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
