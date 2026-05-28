using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController(IAppSettingService settings) : ControllerBase
{
    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
    {
        var value = await settings.GetValueAsync(key);
        return value is null ? NotFound() : Ok(new { key, value });
    }
}
