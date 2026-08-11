using FalFul.Application.DTOs.Product;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace FalFul.API.Controllers
{
    [ApiController]
    [Route("api/subscription")]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly ISubscriptionService _subs;

        public SubscriptionController(ISubscriptionService subs)
        {
            _subs = subs;
        }

        [HttpPost("Create")]
        [Authorize(Policy= "Perm:Subscription")]
        
        public async  Task<IActionResult> CreateSubscription([FromBody]  SubscriptionProduct Sub)
        {
            try
            {
                var userId = User.FindFirst("sub")?.Value;

                var result = await _subs.CreateSubscription(int.Parse(userId), Sub);


                if (result.IsSuccess)
                {
                    return Ok(result);
                }
                else
                {

                    return BadRequest(result);

                }
            }
            catch (Exception ex)
            {

                throw ex;
            }
           
            
           

        }


        [HttpGet("SubscriptionPlans")]
        public  async Task<IActionResult> getSubscription()
        {
            var result = await _subs.GetSubscriptionProductsAsync();

            return Ok(result);
        }

        [HttpGet("GetUserSubsPlan")]
        public async Task<IActionResult> getUserSubsPlan(int userId)
        {
            var userid = User.FindFirst("sub")?.Value;



            if (string.IsNullOrEmpty(userid))
                return Unauthorized();

            var result=  await _subs.getUserSubscription(int.Parse(userid));

            if (result.IsSuccess)
            {
                return Ok(result);

            }
            else
            {
                return Ok(result);
            }

            return BadRequest(result);

        }



        [HttpDelete("SubsDelete")]
        public async Task<IActionResult> CancelSubs(int userid)
        {
            var result = await _subs.CancelSubscription(userid);
            if (result.IsSuccess)
            {
                return Ok(
                   result
                    );

             
            }

            return BadRequest(new {error=result.Error});
        }

        [HttpPost("SubscriptionRenew")]
        public async Task<IActionResult> SubRenew()
        {
            var Userid = User.FindFirst("sub").Value;

            if (Userid is not null)
            {
                var SubscriptionDetails = await _subs.getUserSubscription(int.Parse(Userid));


                var result = await _subs.RenewUserSubscription(int.Parse(Userid),SubscriptionDetails.Data.CurrentPeriodEnd.AddMonths(1));
                return Ok(result);

            }
            else
            {
                return BadRequest();
            }
        }


        [HttpPost("Change")]
        [Authorize(Policy = "Perm:Subscription")]
        public async Task<IActionResult> ChangePlan(SubscriptionProduct changedTo)
        {

            var itmes = changedTo;
            var UserId = User.FindFirst("sub").Value;


            if (UserId is not null)
            {
                var SubscriptionDetails = await _subs.getUserSubscription(int.Parse(UserId));


                var result = await _subs.ChangeUserSubscription(int.Parse(UserId),changedTo);
                return Ok(result);

            }
            else
            {
                return BadRequest();
            }






        }

    }
}
