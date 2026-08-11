using FalFul.Application.DTOs.Product;
using FalFul.Domain.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace FalFul.Application.Interfaces
{
    public interface ISubscriptionService
    {
        Task<IEnumerable<SubscriptionProduct>> GetSubscriptionProductsAsync();

        Task<Result<UserSubscriptionResponse>> CreateSubscription(int UserId, SubscriptionProduct SubcriptionPlan );

        Task<Result<UserSubscriptionResponse>> getUserSubscription(int UserId);
        Task<Result> CancelSubscription(int UserId);

        Task<Result<UserSubscriptionResponse>> RenewUserSubscription(int UserId,DateTime ExpiryDate);

        Task<Result<UserSubscriptionResponse>> ChangeUserSubscription(int Userid, SubscriptionProduct changedPlan);

    }
}
