using FalFul.Application.DTOs.Product;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace FalFul.Application.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        readonly ISubscriptionRepository _subsRepo;

        public SubscriptionService(ISubscriptionRepository subsRepo) {
        
        _subsRepo= subsRepo;
        }    

        public async Task<Result> CancelSubscription(int UserId)
        {
            var result = await _subsRepo.CancelSubscription(UserId);

            return result;
        }

        public async Task<Result<UserSubscriptionResponse>> ChangeUserSubscription(int Userid, SubscriptionProduct changedPlan)
        {
            var result = await _subsRepo.ChangeUserSubscription(Userid,changedPlan);
            if (result.IsSuccess)
            {
                return result;

            }
            else
            {
                return Result<UserSubscriptionResponse>.Failure(result.Error);
            }
        }

        public async Task<Result<UserSubscriptionResponse>> CreateSubscription(int UserId, SubscriptionProduct SubcriptionPlan)
        {

            
            var result= await _subsRepo.CreateSubscription(UserId, SubcriptionPlan);
            return result;
          
        }

        public async Task<IEnumerable<SubscriptionProduct>> GetSubscriptionProductsAsync()
        {
         var result = await _subsRepo.GetSubscriptionProductsAsync();

            return result;
        }

        public async Task<Result<UserSubscriptionResponse>> getUserSubscription(int UserId)
        {
            var result = await _subsRepo.getUserSubscription(UserId);
            return result;
        }

        public async Task<Result<UserSubscriptionResponse>> RenewUserSubscription(int UserId,DateTime ExpiryDate)
        {
            var GetSubDetails = await _subsRepo.getUserSubscription(UserId);


            var responsse = await _subsRepo.RenewUserSubscription(UserId,GetSubDetails.Data.Id,ExpiryDate);
            return responsse;
        }

      
    }
}
