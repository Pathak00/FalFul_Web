using System;
using System.Collections.Generic;
using System.Text;

namespace FalFul.Domain.Entities
{
    public class NotificationModel
    {
    
            public long Id { get; set; }

            public string Type { get; set; } = string.Empty;

            public string Title { get; set; } = string.Empty;

            public string Message { get; set; } = string.Empty;

            public long? ReferenceId { get; set; }

            public bool IsRead { get; set; }

            public string? ReferenceType { get; set; }

            public DateTime CreatedAt { get; set; }
        
    }
}
