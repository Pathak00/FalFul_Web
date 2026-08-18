using FalFul.API.Hubs;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using Microsoft.AspNetCore.SignalR;

namespace FalFul.API.Services
{
    public class SignalRNotificationSender : INotificationSender
    {


        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly INotificationService _notificationService;
        public SignalRNotificationSender(
      IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

       

        public  async Task SendToAdminsAsync(NotificationModel notification)
        {
            //         await _hubContext.Clients
            //.Group("Admins")
            //.SendAsync(
            //    "ReceiveNotification",
            //    notification);

            await _hubContext.Clients.All
    .SendAsync(
        "ReceiveNotification",
        notification);
        }

        public async Task SendToUserAsync(string userId, NotificationModel notification)
        {
            await _hubContext.Clients.User(userId)
               .SendAsync(
                   "ReceiveNotification",
                   notification);
        }
    }
}
