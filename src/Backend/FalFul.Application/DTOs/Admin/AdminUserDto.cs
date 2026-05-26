namespace FalFul.Application.DTOs.Admin;

public class AdminUserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string UserType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int AdminUsers { get; set; }
    public int TotalPages { get; set; }
    public int PublishedPages { get; set; }
    public int TotalBanners { get; set; }
    public int ActiveBanners { get; set; }
    public int VisibleSections { get; set; }
}

public class SetUserActiveDto
{
    public int UserId { get; set; }
    public bool IsActive { get; set; }
}

public class SetUserTypeDto
{
    public int UserId { get; set; }
    public int UserType { get; set; }
}

public class AdminResetPasswordDto
{
    public int UserId { get; set; }
    public string NewPassword { get; set; } = string.Empty;
}
