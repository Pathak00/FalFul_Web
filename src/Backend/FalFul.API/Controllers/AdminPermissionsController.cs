using System.IdentityModel.Tokens.Jwt;
using FalFul.Application.DTOs.Auth;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "Perm:system")]
public class AdminPermissionsController(IPermissionService permService) : ControllerBase
{
    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions() =>
        Ok(await permService.GetAllAsync());

    [HttpGet("users/{id:int}/permissions")]
    public async Task<IActionResult> GetUserPermissions(int id) =>
        Ok(await permService.GetUserPermissionsAsync(id));

    [HttpPut("users/{id:int}/permissions")]
    public async Task<IActionResult> SetUserPermissions(int id, [FromBody] SetUserPermissionsDto dto)
    {
        var adminId = int.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                      ?? User.FindFirst("sub")?.Value ?? "0");
        var result = await permService.SetUserPermissionsAsync(id, dto.Permissions, adminId);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
