using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Policy = "Perm:orders")]
public class AdminOrdersController(IOrderService orderService, INotificationSender Notification,INotificationService notificationService) : ControllerBase
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

        try
        {
            var result = await orderService.UpdateOrderStatusAsync(id, dto);
           


            if (!string.IsNullOrEmpty(result.Data.UserId.ToString()))
            {
                var notification = new NotificationModel
                {   
                    Id=id,
                    Type = "Order",
                    Title = "New Order",
                    Message = $"New order #{id} has been confirmed.",
                    ReferenceId = id,
                    ReferenceType = "Order",
                    CreatedAt = DateTime.UtcNow
                };


                await notificationService.SaveNotification(notification,result.Data.UserId);

                await Notification.SendToUserAsync(result.Data.UserId.ToString(), notification);

            }
            return result.IsSuccess ? Ok() : BadRequest(new { message = result.Error });
        }
        catch (Exception ex)
        {

            return BadRequest();
        }
       
       
    }
}
