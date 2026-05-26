using FalFul.Domain.Common;
using FalFul.Domain.Enums;

namespace FalFul.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? PasswordHash { get; set; }
    public UserType UserType { get; set; } = UserType.Individual;
    public bool IsActive { get; set; } = true;
    public bool IsEmailVerified { get; set; } = false;
    public bool IsPhoneVerified { get; set; } = false;
    public string? ProfileImageUrl { get; set; }
    public string? GoogleId { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
