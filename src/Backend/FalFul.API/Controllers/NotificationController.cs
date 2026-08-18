using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FalFul.API.Controllers
{
    [ApiController]
    [Route("api/notification")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationSender _notificationSender;

        private readonly INotificationService _notificationService;

        public NotificationController(
            INotificationSender notificationSender,INotificationService notificationService)
        {
            _notificationSender = notificationSender;
            _notificationService = notificationService;
        }

        [HttpGet("GetNotification")]
        public async Task<IActionResult> GetNotification()
        {

            var result = await _notificationService.GetNotification(int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)));
            return Ok(result.Data);
           
        }

        [HttpPost("read")]
        public async Task<IActionResult> markRead([FromBody] NotificationModel notificationModel)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var result = await _notificationService.MarkNotificationRead(notificationModel, int.Parse(UserId));

            return Ok(result);


        }
    }
}
