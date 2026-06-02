using FalFul.Application.DTOs.Discount;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/discounts")]
public class DiscountsController(IDiscountService discountService) : ControllerBase
{
    // ── Public: validate a code at checkout ───────────────────────────────────

    [HttpGet("validate")]
    [AllowAnonymous]
    public async Task<IActionResult> Validate([FromQuery] string code, [FromQuery] decimal orderAmount)
    {
        if (string.IsNullOrWhiteSpace(code) || orderAmount <= 0)
            return BadRequest(new { message = "Code and orderAmount are required." });

        var result = await discountService.ValidateAsync(code, orderAmount);
        return Ok(result);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Policy = "Perm:discounts")]
    public async Task<IActionResult> GetAll()
        => Ok(await discountService.GetAllAsync());

    [HttpPost]
    [Authorize(Policy = "Perm:discounts")]
    public async Task<IActionResult> Create([FromBody] CreateDiscountDto dto)
    {
        var result = await discountService.CreateAsync(dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "Perm:discounts")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDiscountDto dto)
    {
        var result = await discountService.UpdateAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Perm:discounts")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await discountService.DeleteAsync(id);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
