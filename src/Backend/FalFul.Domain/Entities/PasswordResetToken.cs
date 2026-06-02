namespace FalFul.Domain.Entities;

public class PasswordResetToken
{
    public int      Id        { get; set; }
    public int      UserId    { get; set; }
    public string   TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool     IsUsed    { get; set; }
    public string?  IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}
