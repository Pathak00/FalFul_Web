using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController(IOrderService orderService, IDeliveryService deliveryService) : ControllerBase
{
    [HttpGet("price-rules")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPriceRules() =>
        Ok(await orderService.GetPriceRulesAsync());

    [HttpPost]
    [Authorize(Policy = "Perm:shop")]
    public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderDto dto)
    {
        var customerName = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        var result = await orderService.PlaceOrderAsync(GetUserId(), customerName, dto);
        return result.IsSuccess
            ? Ok(new { orderId = result.Data!.OrderId, orderNumber = result.Data.OrderNumber })
            : BadRequest(new { message = result.Error });
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetMyOrders() =>
        Ok(await orderService.GetUserOrdersAsync(GetUserId()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await orderService.GetOrderByIdAsync(id, GetUserId());
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelOrderDto dto)
    {
        var result = await orderService.CancelOrderAsync(id, GetUserId(), dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpGet("{id:int}/rating")]
    public async Task<IActionResult> GetRating(int id) =>
        Ok(await deliveryService.GetRatingAsync(id));

    [HttpPost("{id:int}/rating")]
    public async Task<IActionResult> SubmitRating(int id, [FromBody] SubmitRatingDto dto)
    {
        var result = await deliveryService.SubmitRatingAsync(id, GetUserId(), dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    private int GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.Parse(sub!);
    }
}
