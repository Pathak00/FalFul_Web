using System.Security.Claims;
using FalFul.Application.DTOs.Admin;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/nav")]
[Authorize]
public class AdminNavController : ControllerBase
{
    private readonly IAdminNavRepository _nav;
    public AdminNavController(IAdminNavRepository nav) => _nav = nav;

    /// <summary>Returns sidebar items accessible to the current user (IsVisible=1 and has permission).</summary>
    [HttpGet]
    public async Task<IActionResult> GetForUser()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var items = await _nav.GetForUserAsync(userId.Value);
        return Ok(items.Select(ToDto));
    }

    /// <summary>
    /// Returns all items the user has permission to access, regardless of IsVisible.
    /// Used by the client-side route guard to enforce permissions even on hidden nav items.
    /// </summary>
    [HttpGet("permitted")]
    public async Task<IActionResult> GetPermittedForUser()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var items = await _nav.GetPermittedForUserAsync(userId.Value);
        return Ok(items.Select(ToDto));
    }

    /// <summary>Returns all items (for the Navigation management screen).</summary>
    [HttpGet("all")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> GetAll()
    {
        var items = await _nav.GetAllAsync();
        return Ok(items.Select(ToDto));
    }

    /// <summary>Updates an item's label, icon, group, order, or visibility.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAdminNavItemDto dto)
    {
        await _nav.UpdateAsync(new AdminNavItem
        {
            Id                 = id,
            Label              = dto.Label,
            Icon               = dto.Icon,
            GroupLabel         = dto.GroupLabel,
            DisplayOrder       = dto.DisplayOrder,
            IsVisible          = dto.IsVisible,
            RequiredPermission = dto.RequiredPermission,
            PortalScope        = dto.PortalScope
        });
        return NoContent();
    }

    /// <summary>Creates a new non-system nav item.</summary>
    [HttpPost]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> Create([FromBody] CreateAdminNavItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Label)) return BadRequest(new { message = "Label is required." });
        if (string.IsNullOrWhiteSpace(dto.Route)) return BadRequest(new { message = "Route is required." });

        var id = await _nav.CreateAsync(new AdminNavItem
        {
            Label              = dto.Label.Trim(),
            Route              = dto.Route.Trim(),
            Icon               = dto.Icon,
            GroupLabel         = dto.GroupLabel,
            DisplayOrder       = dto.DisplayOrder,
            IsVisible          = dto.IsVisible,
            RequiredPermission = dto.RequiredPermission,
            PortalScope        = dto.PortalScope
        });
        return Ok(new { id });
    }

    /// <summary>Deletes a non-system nav item.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Perm:system")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _nav.DeleteAsync(id);
        return deleted ? NoContent() : BadRequest(new { message = "System items cannot be deleted." });
    }

    private static AdminNavItemDto ToDto(AdminNavItem m) => new()
    {
        Id                 = m.Id,
        Label              = m.Label,
        Route              = m.Route,
        Icon               = m.Icon,
        ParentId           = m.ParentId,
        GroupLabel         = m.GroupLabel,
        DisplayOrder       = m.DisplayOrder,
        IsVisible          = m.IsVisible,
        RequiredPermission = m.RequiredPermission,
        IsSystem           = m.IsSystem,
        PortalScope        = m.PortalScope
    };

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub != null ? int.Parse(sub) : null;
    }
}
