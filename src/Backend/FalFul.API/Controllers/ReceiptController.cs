using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FalFul.Application.DTOs.Receipt;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/orders/{orderId:int}/receipt")]
[Authorize(Policy = "Perm:shop")]
public class ReceiptController(IReceiptService receiptService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetReceipt(int orderId, [FromQuery] int? templateId)
    {
        var result = await receiptService.RenderReceiptAsync(orderId, templateId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("log-print")]
    public async Task<IActionResult> LogPrint(int orderId, [FromBody] LogPrintDto dto)
    {
        var result = await receiptService.LogPrintAsync(orderId, GetUserId(), dto);
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    private int GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.Parse(sub!);
    }
}
