using System.Security.Claims;
using FalFul.Application.DTOs.Admin;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "Perm:system")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats() =>
        Ok(await _admin.GetStatsAsync());

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() =>
        Ok(await _admin.GetAllUsersAsync());

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserDto dto)
    {
        var result = await _admin.CreateUserAsync(dto, GetUserId());
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    [HttpPost("users/set-active")]
    public async Task<IActionResult> SetActive([FromBody] SetUserActiveDto dto)
    {
        var result = await _admin.SetUserActiveAsync(dto, GetUserId());
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPost("users/set-type")]
    public async Task<IActionResult> SetType([FromBody] SetUserTypeDto dto)
    {
        var result = await _admin.SetUserTypeAsync(dto, GetUserId());
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPost("users/reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] AdminResetPasswordDto dto)
    {
        var result = await _admin.ResetPasswordAsync(dto, GetUserId());
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var result = await _admin.DeleteUserAsync(id, GetUserId());
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    private int? GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return sub != null ? int.Parse(sub) : null;
    }
}
