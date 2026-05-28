using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/deliveries")]
[Authorize(Policy = "Perm:deliveries")]
public class AdminDeliveriesController(IDeliveryService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] byte? status, [FromQuery] string? from, [FromQuery] string? to) =>
        Ok(await svc.GetAllAsync(status, from, to));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await svc.GetByIdAsync(id);
        return d is null ? NotFound() : Ok(d);
    }

    [HttpPut("{id:int}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignRiderDto dto)
    {
        var result = await svc.AssignRiderAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateDeliveryStatusDto dto)
    {
        var result = await svc.UpdateStatusAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPost("{id:int}/attempts")]
    public async Task<IActionResult> LogAttempt(int id, [FromBody] LogDeliveryAttemptDto dto)
    {
        var result = await svc.LogAttemptAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPost("{id:int}/issues")]
    public async Task<IActionResult> ReportIssue(int id, [FromBody] ReportIssueDto dto)
    {
        var result = await svc.ReportIssueAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPut("issues/{issueId:int}/resolve")]
    public async Task<IActionResult> ResolveIssue(int issueId, [FromBody] ResolveIssueDto dto)
    {
        var result = await svc.ResolveIssueAsync(issueId, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
