using System.IdentityModel.Tokens.Jwt;
using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/rider")]
[Authorize]
public class RiderController(IDeliveryService deliveryService) : ControllerBase
{
    private int RiderUserId => int.Parse(
        User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
        ?? User.FindFirst("sub")?.Value ?? "0");

    [HttpGet("deliveries")]
    public async Task<IActionResult> GetMyDeliveries() =>
        Ok(await deliveryService.GetRiderDeliveriesAsync(RiderUserId));

    [HttpGet("deliveries/{id:int}")]
    public async Task<IActionResult> GetDelivery(int id)
    {
        var d = await deliveryService.GetByIdAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    [HttpPut("deliveries/{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateDeliveryStatusDto dto)
    {
        var result = await deliveryService.UpdateStatusAsync(id, dto);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("deliveries/{id:int}/attempts")]
    public async Task<IActionResult> LogAttempt(int id, [FromBody] LogDeliveryAttemptDto dto)
    {
        var result = await deliveryService.LogAttemptAsync(id, dto);
        return result.IsSuccess ? CreatedAtAction(nameof(GetDelivery), new { id }, null) : BadRequest(result.Error);
    }

    [HttpPost("deliveries/{id:int}/complete")]
    public async Task<IActionResult> CompleteDelivery(int id, [FromBody] CompleteDeliveryDto dto)
    {
        var result = await deliveryService.CompleteDeliveryAsync(id, dto);
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }
}
