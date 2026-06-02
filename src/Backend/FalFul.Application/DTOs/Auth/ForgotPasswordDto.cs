namespace FalFul.Application.DTOs.Auth;

public class ForgotPasswordDto
{
    public string Identifier { get; set; } = string.Empty;  // email or phone
}

public class ForgotPasswordResponseDto
{
    public string MaskedDestination { get; set; } = string.Empty;
    public string Channel           { get; set; } = string.Empty;  // "email" | "sms"
    public int    ExpiresInMinutes  { get; set; }
}
