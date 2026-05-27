using System.Security.Claims;
using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/addresses")]
[Authorize]
public class AddressesController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await orderService.GetAddressesAsync(GetUserId()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAddressDto dto)
    {
        var result = await orderService.CreateAddressAsync(GetUserId(), dto);
        return result.IsSuccess ? Ok(new { id = result.Data }) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAddressDto dto)
    {
        var result = await orderService.UpdateAddressAsync(id, GetUserId(), dto);
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await orderService.DeleteAddressAsync(id, GetUserId());
        return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
    }

    private int GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(sub!);
    }
}
