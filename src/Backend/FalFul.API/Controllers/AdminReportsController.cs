using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "Admin")]
public class AdminReportsController(IDeliveryService svc) : ControllerBase
{
    [HttpGet("deliveries")]
    public async Task<IActionResult> DeliverySummary([FromQuery] string? from, [FromQuery] string? to) =>
        Ok(await svc.GetDeliveryReportAsync(from, to));

    [HttpGet("orders")]
    public async Task<IActionResult> OrderSummary([FromQuery] string? from, [FromQuery] string? to) =>
        Ok(await svc.GetOrderReportAsync(from, to));
}
