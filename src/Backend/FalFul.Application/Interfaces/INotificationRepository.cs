using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace FalFul.Application.Interfaces
{
    public interface INotificationRepository
    {

        public Task<Result<NotificationModel>> SaveNotification(NotificationModel notficationModel,int userId);

        Task<Result> MarkNotificationRead(NotificationModel notificationModel, int UserId);

        Task<Result<IEnumerable<NotificationModel>>> GetNotifications(int UserId);
    }
}
