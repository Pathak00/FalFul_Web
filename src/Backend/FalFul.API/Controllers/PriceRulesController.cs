using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/price-rules")]
[Authorize(Policy = "Perm:price_config")]
public class PriceRulesController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await orderService.GetPriceRulesAsync());

    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] UpsertPriceRuleDto dto)
    {
        var result = await orderService.UpsertPriceRuleAsync(dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
