using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FalFul.Application.DTOs.Receipt;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/receipts")]
[Authorize(Policy = "Perm:receipts")]
public class AdminReceiptController(IReceiptService receiptService) : ControllerBase
{
    // ── Templates ─────────────────────────────────────────────────────────────

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates() =>
        Ok(await receiptService.GetAllTemplatesAsync());

    [HttpGet("templates/{id:int}")]
    public async Task<IActionResult> GetTemplate(int id)
    {
        var template = await receiptService.GetTemplateByIdAsync(id);
        return template is null ? NotFound() : Ok(template);
    }

    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateReceiptTemplateDto dto)
    {
        var result = await receiptService.CreateTemplateAsync(dto, GetUserId());
        return result.IsSuccess
            ? Ok(new { id = result.Data })
            : BadRequest(new { message = result.Error });
    }

    [HttpPut("templates/{id:int}")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateReceiptTemplateDto dto)
    {
        var result = await receiptService.UpdateTemplateAsync(id, dto, GetUserId());
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("templates/{id:int}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var result = await receiptService.DeleteTemplateAsync(id);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    // ── Version history ───────────────────────────────────────────────────────

    [HttpGet("templates/{templateId:int}/versions")]
    public async Task<IActionResult> GetVersions(int templateId) =>
        Ok(await receiptService.GetTemplateVersionsAsync(templateId));

    [HttpPost("templates/{templateId:int}/versions/{versionId:int}/restore")]
    public async Task<IActionResult> RestoreVersion(int templateId, int versionId)
    {
        var result = await receiptService.RestoreVersionAsync(templateId, versionId, GetUserId());
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    // ── Render (admin preview / admin print) ──────────────────────────────────

    [HttpGet("orders/{orderId:int}")]
    public async Task<IActionResult> RenderReceipt(int orderId, [FromQuery] int? templateId)
    {
        var result = await receiptService.RenderReceiptAsync(orderId, templateId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("orders/{orderId:int}/log-print")]
    public async Task<IActionResult> LogPrint(int orderId, [FromBody] LogPrintDto dto)
    {
        var result = await receiptService.LogPrintAsync(orderId, GetUserId(), dto);
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    // ── Print logs ────────────────────────────────────────────────────────────

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int? orderId,
        [FromQuery] int pageSize   = 50,
        [FromQuery] int pageOffset = 0) =>
        Ok(await receiptService.GetPrintLogsAsync(orderId, pageSize, pageOffset));

    private int GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.Parse(sub!);
    }
}
