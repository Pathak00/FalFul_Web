using FalFul.Application.DTOs.Payment;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    // ── Public: payment methods for checkout ──────────────────────────────────

    [HttpGet("methods")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEnabledMethods()
        => Ok(await paymentService.GetEnabledMethodsAsync());

    // ── Customer: initiate payment ────────────────────────────────────────────

    [HttpPost("initiate/{orderId:int}")]
    [Authorize]
    public async Task<IActionResult> Initiate(int orderId, [FromBody] InitiatePaymentDto dto)
    {
        var userId = GetUserId();
        var result = await paymentService.InitiateAsync(orderId, userId, dto);
        return result.IsSuccess
            ? Ok(result.Data)
            : BadRequest(new { message = result.Error });
    }

    // ── Customer: view payments for their order ───────────────────────────────

    [HttpGet("order/{orderId:int}")]
    [Authorize]
    public async Task<IActionResult> GetByOrder(int orderId)
        => Ok(await paymentService.GetByOrderAsync(orderId));

    // ── Gateway callbacks (public — gateway POSTs/redirects here) ────────────

    [HttpPost("verify/esewa")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEsewa([FromQuery] Dictionary<string, string> query, [FromForm] Dictionary<string, string> form)
    {
        var data = new Dictionary<string, string>(query);
        foreach (var kv in form) data[kv.Key] = kv.Value;
        var result = await paymentService.HandleCallbackAsync("esewa", data);
        return result.IsSuccess ? Ok(new { message = "Payment verified." }) : BadRequest(new { message = result.Error });
    }

    [HttpGet("verify/esewa")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEsewaGet([FromQuery] Dictionary<string, string> query)
    {
        var result = await paymentService.HandleCallbackAsync("esewa", query);
        return result.IsSuccess ? Ok(new { message = "Payment verified." }) : BadRequest(new { message = result.Error });
    }

    [HttpPost("verify/khalti")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyKhalti([FromBody] Dictionary<string, string> body)
    {
        var result = await paymentService.HandleCallbackAsync("khalti", body);
        return result.IsSuccess ? Ok(new { message = "Payment verified." }) : BadRequest(new { message = result.Error });
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(
        [FromQuery] byte?   methodId  = null,
        [FromQuery] byte?   status    = null,
        [FromQuery] string? fromDate  = null,
        [FromQuery] string? toDate    = null)
        => Ok(await paymentService.GetAllAsync(methodId, status, fromDate, toDate));

    [HttpPost("{paymentId:int}/confirm-cod")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConfirmCod(int paymentId)
    {
        var result = await paymentService.ConfirmCodBalanceAsync(paymentId);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpGet("settings")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSettings()
        => Ok(await paymentService.GetSettingsAsync());

    [HttpPut("settings")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSettings([FromBody] PaymentSettingsDto dto)
    {
        var result = await paymentService.UpdateSettingsAsync(dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpGet("methods/all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllMethods()
        => Ok(await paymentService.GetAllMethodsAsync());

    [HttpPatch("methods/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateMethod(byte id, [FromBody] PaymentMethodUpdateDto dto)
    {
        var result = await paymentService.UpdateMethodAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpGet("report")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetReport([FromQuery] string? fromDate = null, [FromQuery] string? toDate = null)
        => Ok(await paymentService.GetReportAsync(fromDate, toDate));

    // ── Helper ────────────────────────────────────────────────────────────────

    private int GetUserId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
}
