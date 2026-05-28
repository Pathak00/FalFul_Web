using FalFul.Application.DTOs;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Policy = "Perm:settings")]
public class AdminSettingsController(IAppSettingService settings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await settings.GetAllAsync());

    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
    {
        var value = await settings.GetValueAsync(key);
        return value is null ? NotFound() : Ok(new { key, value });
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Upsert(string key, [FromBody] UpsertAppSettingDto dto)
    {
        var result = await settings.UpsertAsync(key, dto.Value);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
