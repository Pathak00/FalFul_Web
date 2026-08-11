using Dapper;
using FalFul.Application.DTOs.Product;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Reflection.Metadata.Ecma335;
using System.Text;

namespace FalFul.Persistence.Repositories
{
    public class SubscriptionRepository : ISubscriptionRepository
    {
        private readonly DapperContext _context;
        public SubscriptionRepository(DapperContext context) {
            _context = context;
        }
        public async Task<Result> CancelSubscription(int UserId)
        {
            using var conn = _context.CreateConnection();

            var result = await conn.QueryFirstAsync<Result>("sp_GetSubscriptionProduct",
                new {flag='D',user_id=UserId},commandType:CommandType.StoredProcedure);

            return result;
        }

        public async Task<Result<UserSubscriptionResponse>> ChangeUserSubscription(int userid, SubscriptionProduct changedPlan)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryAsync<UserSubscriptionResponse>("sp_GetSubscriptionProduct", new
            {
                flag = 'X',
                user_id = userid,
                plan_id = changedPlan.Id
            }, commandType: CommandType.StoredProcedure);

            if (result.FirstOrDefault() is null)
            {
                return Result<UserSubscriptionResponse>.Failure("Unabale to change the user Subscription");
            }
            return Result<UserSubscriptionResponse>.Success(result.FirstOrDefault(),"");
        }

        public async Task<Result<UserSubscriptionResponse>> CreateSubscription(int UserId, SubscriptionProduct SubcriptionPlan)
        {
            try
            {
                using var conn = _context.CreateConnection();
                var products = await conn.QueryAsync<UserSubscriptionResponse>("sp_GetSubscriptionProduct",
                    new { flag = 'C', user_id = UserId, plan_id = SubcriptionPlan.Id }
                    , commandType: CommandType.StoredProcedure);


                if (products == null || !products.Any())
                {
                    return Result<UserSubscriptionResponse>.Failure("Subscription product not found or unavailable.");
                }
                if (products == null || !products.Any())
                {
                    return Result<UserSubscriptionResponse>.Failure("Subscription product not found or unavailable.");
                }


                var subscription = products.First();



                return Result<UserSubscriptionResponse>.Success(subscription,"");

            }
            catch (SqlException ex)
            {

                return Result<UserSubscriptionResponse>.Failure(ex.Message);
            }
            




        }

        public async Task<IEnumerable<SubscriptionProduct>> GetSubscriptionProductsAsync()
        {
            var conn = _context.CreateConnection();
            var result = await  conn.QueryAsync<SubscriptionProduct>("sp_GetSubscriptionProduct",
                new { flag = 'A' }, commandType: CommandType.StoredProcedure);

            return result;
        }

        public async Task<Result<UserSubscriptionResponse>> getUserSubscription(int UserId)
        {

            try
            {
                using var con = _context.CreateConnection();
                var result = await con.QueryFirstOrDefaultAsync<UserSubscriptionResponse>("sp_GetSubscriptionProduct",
                    new { flag = 'T', user_id = UserId }, commandType: CommandType.StoredProcedure);

                if (result is not null)
                {
                    return Result<UserSubscriptionResponse>.Success(result,"");


                }
               
                    return Result<UserSubscriptionResponse>.Failure("No Any subscription found for the user");
               
            }
            catch (Exception ex ) 
            {
                return Result<UserSubscriptionResponse>.Failure("Errro Occured");
               
            }
           
        


        }

        public async Task<Result<UserSubscriptionResponse>> RenewUserSubscription(int UserId,int SubId,DateTime ExpiryDate)
        {

            try
            {
                using var con = _context.CreateConnection();
                var result = await con.QueryFirstOrDefaultAsync<UserSubscriptionResponse>("sp_GetSubscriptionProduct", new
                {
                    User_id = UserId,flag='R',id=SubId,Expirydate=ExpiryDate
                }, commandType: CommandType.StoredProcedure);

                if (result is not null)
                {
                    return Result<UserSubscriptionResponse>.Success(result, "");

                }
                else
                {
                    return Result<UserSubscriptionResponse>.Failure("Result is null");
                }
            }
            catch (SqlException ex)
            {
                //return Result<UserSubscriptionResponse>.Failure($"A database error occurred: {ex.Message}");
                return Result<UserSubscriptionResponse>.Failure($"A Database failure Occured:{ex.Message}");
            }
           
        }
    }
}
