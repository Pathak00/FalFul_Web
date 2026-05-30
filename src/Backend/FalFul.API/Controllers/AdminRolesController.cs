using System.IdentityModel.Tokens.Jwt;
using FalFul.Application.DTOs.Auth;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Authorize]
public class AdminRolesController(IRoleService roleService) : ControllerBase
{
    private int CallerId => int.Parse(
        User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
        ?? User.FindFirst("sub")?.Value ?? "0");

    // ── Role CRUD (system-only) ───────────────────────────────────────────────

    [HttpGet("api/admin/roles")]
    [Authorize(Policy = "Perm:users")]   // also needed by Users page for role dropdown
    public async Task<IActionResult> GetAll() =>
        Ok(await roleService.GetAllAsync());

    [HttpPost("api/admin/roles")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> Create([FromBody] CreateRoleDto dto)
    {
        var result = await roleService.CreateAsync(dto);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetAll), new { }, result.Data)
            : BadRequest(new { message = result.Error });
    }

    [HttpPut("api/admin/roles/{id:int}")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleDto dto)
    {
        var result = await roleService.UpdateAsync(id, dto);
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpPut("api/admin/roles/{id:int}/default")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> SetDefault(int id)
    {
        var result = await roleService.SetDefaultAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("api/admin/roles/{id:int}")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await roleService.DeleteAsync(id);
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    // ── Role → Permission assignment (system-only) ────────────────────────────

    [HttpGet("api/admin/roles/{id:int}/permissions")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> GetRolePermissions(int id) =>
        Ok(await roleService.GetRolePermissionsAsync(id));

    [HttpPut("api/admin/roles/{id:int}/permissions")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> SetRolePermissions(int id, [FromBody] SetRolePermissionsDto dto)
    {
        var result = await roleService.SetRolePermissionsAsync(id, dto);
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    // ── User → Role assignment (users permission) ─────────────────────────────

    [HttpGet("api/admin/users/{id:int}/role")]
    [Authorize(Policy = "Perm:users")]
    public async Task<IActionResult> GetUserRole(int id)
    {
        var role = await roleService.GetUserRoleAsync(id);
        return role == null ? NotFound() : Ok(role);
    }

    [HttpPut("api/admin/users/{id:int}/role")]
    [Authorize(Policy = "Perm:users")]
    public async Task<IActionResult> AssignRole(int id, [FromBody] AssignRoleDto dto)
    {
        var result = await roleService.AssignRoleAsync(id, dto.RoleId, CallerId);
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }
}
