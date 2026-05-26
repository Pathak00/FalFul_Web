using System.Security.Claims;
using FalFul.Application.DTOs.CMS;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BannersController : ControllerBase
{
    private readonly ICmsService _cms;

    public BannersController(ICmsService cms) => _cms = cms;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _cms.GetAllBannersAsync());

    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] string? position) =>
        Ok(await _cms.GetActiveBannersAsync(position));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateBannerDto dto)
    {
        var result = await _cms.CreateBannerAsync(dto, GetUserId());
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update([FromBody] UpdateBannerDto dto)
    {
        var result = await _cms.UpdateBannerAsync(dto, GetUserId());
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _cms.DeleteBannerAsync(id, GetUserId());
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub != null ? int.Parse(sub) : null;
    }
}
