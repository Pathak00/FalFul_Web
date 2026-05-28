using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Policy = "Perm:orders")]
public class AdminOrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] byte? status) =>
        Ok(await orderService.GetAllOrdersAsync(status));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await orderService.GetOrderByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var result = await orderService.UpdateOrderStatusAsync(id, dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }
}
