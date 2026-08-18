using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace FalFul.Persistence.Repositories
{
    public class NotificationRepository(DapperContext Conn) : INotificationRepository
    {
        public async Task<Result<IEnumerable<NotificationModel>>> GetNotifications(int UserId)
        {
            using var conn = Conn.CreateConnection();
            var result = await conn.QueryAsync<NotificationModel>("SP_Notification", new { flag = 'V', userId = UserId }, commandType: CommandType.StoredProcedure);
            if (!result.Any())
            {
                return Result<IEnumerable<NotificationModel>>.Success(Enumerable.Empty<NotificationModel>(), "No notifications found.");

            }
            return Result<IEnumerable<NotificationModel>>.Success(
        result,
        "Notifications retrieved successfully."
    );

        }

        public async Task<Result> MarkNotificationRead(NotificationModel notificationModel, int UserId)
        {
            using var conn = Conn.CreateConnection();
            var result = await conn.QueryAsync<Result<NotificationModel>>("SP_Notification", new
            {
                flag = 'R',
                notificationModel.Id,
                notificationModel.Message,
                notificationModel.ReferenceId,
                notificationModel.Title,
                notificationModel.Type,
                notificationModel.ReferenceType,
                notificationModel.CreatedAt,
                UserId = UserId,

            }, commandType: CommandType.StoredProcedure);

     

            return Result.Success("Sucessfully Marked");
        }

        public async Task<Result<NotificationModel>> SaveNotification(NotificationModel notficationModel, int userId)
        {
            using var conn = Conn.CreateConnection();
            var result = await  conn.QueryAsync<Result<NotificationModel>>("SP_Notification", new
            {
                flag = 'I',
                notficationModel.Message,
                notficationModel.ReferenceId,
                notficationModel.Title,
                notficationModel.Type,
                notficationModel.ReferenceType,
                notficationModel.CreatedAt,
                UserId = userId,

            }, commandType: CommandType.StoredProcedure);

          


            var notification = result.FirstOrDefault();

            if (notification.IsSuccess)
            {
                return Result<NotificationModel>.Success(notification.Data, notification.Data.Message);

            }
            else
            {
                return Result<NotificationModel>.Failure( notification.Error);
            }


        }
    }
}
