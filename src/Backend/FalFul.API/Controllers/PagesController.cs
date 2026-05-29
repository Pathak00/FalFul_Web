using System.Security.Claims;
using FalFul.Application.DTOs.CMS;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PagesController : ControllerBase
{
    private readonly ICmsService _cms;

    public PagesController(ICmsService cms) => _cms = cms;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _cms.GetAllPagesAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _cms.GetPageByIdAsync(id);
        return result.IsSuccess ? Ok(result.Data) : NotFound(new { message = result.Error });
    }

    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, [FromQuery] bool adminMode = false)
    {
        var result = await _cms.GetPageBySlugAsync(slug, adminMode);
        return result.IsSuccess ? Ok(result.Data) : NotFound(new { message = result.Error });
    }

    [HttpPost]
    [Authorize(Policy = "Perm:pages")]
    public async Task<IActionResult> Create([FromBody] CreatePageDto dto)
    {
        var result = await _cms.CreatePageAsync(dto, GetUserId());
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    [HttpPut]
    [Authorize(Policy = "Perm:pages")]
    public async Task<IActionResult> Update([FromBody] UpdatePageDto dto)
    {
        var result = await _cms.UpdatePageAsync(dto, GetUserId());
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Perm:pages")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _cms.DeletePageAsync(id, GetUserId());
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub != null ? int.Parse(sub) : null;
    }
}
