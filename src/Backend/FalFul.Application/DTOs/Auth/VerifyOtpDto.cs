namespace FalFul.Application.DTOs.Auth;

public class VerifyOtpDto
{
    public string Identifier { get; set; } = string.Empty;
    public string Otp        { get; set; } = string.Empty;
}

public class VerifyOtpResponseDto
{
    public string ResetToken       { get; set; } = string.Empty;
    public int    ExpiresInMinutes { get; set; }
}
