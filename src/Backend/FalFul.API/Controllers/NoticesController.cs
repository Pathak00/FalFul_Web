using FalFul.Application.DTOs.Notice;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/notices")]
public class NoticesController(INoticeService noticeService) : ControllerBase
{
    // ── Public: active notices for current user ───────────────────────────────

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive()
    {
        byte? userType = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var typeClaim = User.FindFirstValue("user_type");
            if (byte.TryParse(typeClaim, out var t)) userType = t;
        }
        return Ok(await noticeService.GetActiveAsync(userType));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Policy = "Perm:notices")]
    public async Task<IActionResult> GetAll()
        => Ok(await noticeService.GetAllAsync());

    [HttpPost]
    [Authorize(Policy = "Perm:notices")]
    public async Task<IActionResult> Create([FromBody] CreateNoticeDto dto)
    {
        var result = await noticeService.CreateAsync(dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Perm:notices")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateNoticeDto dto)
    {
        var result = await noticeService.UpdateAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Perm:notices")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await noticeService.DeleteAsync(id);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
