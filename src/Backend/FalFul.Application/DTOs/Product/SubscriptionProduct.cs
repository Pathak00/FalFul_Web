using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace FalFul.Application.DTOs.Product
{
    public class SubscriptionProduct
    {
            public int Id { get; set; }
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public decimal Price { get; set; }
            public string BillingInterval { get; set; } = string.Empty;
            public string? SubsType { get; set; }

            public DateTime? CreatedAt { get; set; }
        
    }

    public enum SubscriptionStatus
    {
        Activated = 1,
        Pending = 2,
        Paused = 3,
        Cancelled = 4,
        Expired = 5
    }

    public class UserSubscriptionResponse
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;


        public int Plan { get; set; }

        public  string Plan_name { get; set; }

        //public SubscriptionProduct SubscriptionPlan { get; set; } = null!;

        public SubscriptionStatus Status { get; set; }

        public DateTime CurrentPeriodStart { get; set; }

        public DateTime CurrentPeriodEnd { get; set; }

        public DateTime NextBillingDate { get; set; }

        public bool AutoRenew { get; set; } = true;

        public DateTime CreatedAt { get; set; }
    }
}
