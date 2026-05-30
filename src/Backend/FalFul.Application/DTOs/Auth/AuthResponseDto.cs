namespace FalFul.Application.DTOs.Auth;

public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserInfoDto User { get; set; } = new();
}

public class UserInfoDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string UserType { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = [];
    public string       PortalType  { get; set; } = "customer";
}
