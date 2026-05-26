using System.Security.Claims;
using FalFul.Application.DTOs.CMS;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomepageSectionsController : ControllerBase
{
    private readonly ICmsService _cms;

    public HomepageSectionsController(ICmsService cms) => _cms = cms;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _cms.GetAllSectionsAsync());

    [HttpGet("visible")]
    public async Task<IActionResult> GetVisible() =>
        Ok(await _cms.GetVisibleSectionsAsync());

    [HttpPost("upsert")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Upsert([FromBody] UpsertSectionDto dto)
    {
        var result = await _cms.UpsertSectionAsync(dto, GetUserId());
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub != null ? int.Parse(sub) : null;
    }
}
