namespace FalFul.Domain.Entities;

public class PasswordResetOtp
{
    public int      Id           { get; set; }
    public int      UserId       { get; set; }
    public string   OtpHash      { get; set; } = string.Empty;
    public byte     Channel      { get; set; }     // 1 = Email, 2 = SMS
    public string   Destination  { get; set; } = string.Empty;
    public DateTime ExpiresAt    { get; set; }
    public bool     IsUsed       { get; set; }
    public int      AttemptCount { get; set; }
    public string?  IpAddress    { get; set; }
    public DateTime CreatedAt    { get; set; }
}
