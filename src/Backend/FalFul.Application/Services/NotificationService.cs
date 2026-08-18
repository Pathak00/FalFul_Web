using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Text;


namespace FalFul.Application.Services
{
    public class NotificationService : INotificationService
    {

        private readonly INotificationSender _notificationSender;
        private readonly INotificationRepository _notificationRepo;

        public NotificationService(
  INotificationSender notificationSender, INotificationRepository notificationRepo)
        {
            _notificationSender = notificationSender;
            _notificationRepo = notificationRepo;
             
        }

        public async Task<Result<IEnumerable<NotificationModel>>> GetNotification(int userId)
        {
            var result = await _notificationRepo.GetNotifications(userId);
            if (result.IsSuccess)
            {
                return result;

            }
            return Result<IEnumerable<NotificationModel>>.Failure("No notification found");
            
        }

        public Task<Result> MarkNotificationRead(NotificationModel notificationModel, int UserId)
        {
           return  _notificationRepo.MarkNotificationRead(notificationModel, UserId);

        }

        public async Task NotifyAdminsAsync(NotificationModel notification)
        {
            await _notificationSender
        .SendToAdminsAsync(notification);
        }

        public async Task NotifyUserAsync(long userId, NotificationModel notification)
        {
            await _notificationSender
      .SendToUserAsync(userId.ToString(),notification);
        }

        public Task<Result<NotificationModel>> SaveNotification(NotificationModel notificationRequest, int userId)
        {
            return _notificationRepo.SaveNotification(notificationRequest, userId);
        }
    }
}
