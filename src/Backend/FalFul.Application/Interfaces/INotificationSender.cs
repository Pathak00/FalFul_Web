using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace FalFul.Application.Interfaces
{
    public interface INotificationSender
    {
        Task SendToUserAsync(
       string userId,
       NotificationModel notification);

        Task SendToAdminsAsync(
            NotificationModel notification);


       
    }
}
