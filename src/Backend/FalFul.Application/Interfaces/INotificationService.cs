using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace FalFul.Application.Interfaces
{
    public interface INotificationService
    {

        Task NotifyUserAsync(long userId, NotificationModel notification);


        Task NotifyAdminsAsync(NotificationModel notification);

        Task<Result<NotificationModel>> SaveNotification(NotificationModel notificationRequest, int userId);

        Task<Result> MarkNotificationRead(NotificationModel notificationModel, int UserId);

        Task<Result<IEnumerable<NotificationModel>>> GetNotification(int userId);
    }
}
