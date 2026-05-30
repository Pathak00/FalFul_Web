using FalFul.Application.DTOs.Payment;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

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

    // ── Gateway callbacks (public — called by Angular after redirect) ─────────

    /// <summary>
    /// eSewa sends ?data=base64JSON on redirect to success_url.
    /// Angular's /payment/callback page forwards it here.
    /// Accepts both GET (Angular query param) and POST (direct form POST fallback).
    /// </summary>
    [HttpGet("verify/esewa")]
    [HttpPost("verify/esewa")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEsewa([FromQuery] string? data = null)
    {
        if (string.IsNullOrEmpty(data))
            return BadRequest(new { message = "Missing eSewa data parameter." });

        Dictionary<string, string> decoded;
        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(data));
            decoded  = JsonSerializer.Deserialize<Dictionary<string, string>>(json)
                       ?? throw new Exception();
        }
        catch { return BadRequest(new { message = "Invalid eSewa callback data." }); }

        // Extract payment_id from transaction_uuid (encoded as FF-{paymentId}-{timestamp})
        if (decoded.TryGetValue("transaction_uuid", out var uuid))
        {
            var parts = uuid.Split('-');
            if (parts.Length >= 2 && int.TryParse(parts[1], out var pid))
                decoded["payment_id"] = pid.ToString();
        }

        var result = await paymentService.HandleCallbackAsync("esewa", decoded);
        return result.IsSuccess
            ? Ok(new { message = "Payment verified." })
            : BadRequest(new { message = result.Error });
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
