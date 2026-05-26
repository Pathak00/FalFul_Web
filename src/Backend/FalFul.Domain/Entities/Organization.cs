using FalFul.Domain.Common;

namespace FalFul.Domain.Entities;

public class Organization : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string OrganizationType { get; set; } = string.Empty;
    public bool IsVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int OwnerId { get; set; }
}
