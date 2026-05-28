using System.Security.Claims;
using FalFul.Application.DTOs.CMS;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/menus")]
public class MenuController : ControllerBase
{
    private readonly ICmsService _cms;

    public MenuController(ICmsService cms) => _cms = cms;

    [HttpGet]
    [Authorize(Policy = "Perm:menus")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _cms.GetAllMenuItemsAsync());

    [HttpGet("visible")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVisible()
    {
        int? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (sub != null) userId = int.Parse(sub);
        }
        return Ok(await _cms.GetVisibleMenuItemsAsync(userId));
    }

    [HttpPost]
    [Authorize(Policy = "Perm:menus")]
    public async Task<IActionResult> Create([FromBody] CreateMenuItemDto dto)
    {
        var result = await _cms.CreateMenuItemAsync(dto, GetUserId());
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    [HttpPut]
    [Authorize(Policy = "Perm:menus")]
    public async Task<IActionResult> Update([FromBody] UpdateMenuItemDto dto)
    {
        var result = await _cms.UpdateMenuItemAsync(dto, GetUserId());
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Perm:menus")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _cms.DeleteMenuItemAsync(id, GetUserId());
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub != null ? int.Parse(sub) : null;
    }
}
