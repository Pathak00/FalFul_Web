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

    /// <summary>Returns sidebar items accessible to the current user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetForUser()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var items = await _nav.GetForUserAsync(userId.Value);
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
            Id           = id,
            Label        = dto.Label,
            Icon         = dto.Icon,
            GroupLabel   = dto.GroupLabel,
            DisplayOrder = dto.DisplayOrder,
            IsVisible    = dto.IsVisible
        });
        return NoContent();
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
        IsSystem           = m.IsSystem
    };

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub != null ? int.Parse(sub) : null;
    }
}
