namespace FalFul.Application.Interfaces;

public record GoogleUserInfo(
    string GoogleId,
    string Email,
    string FullName,
    string? ProfileImageUrl
);

public interface IGoogleAuthService
{
    /// <summary>
    /// Validates the Google ID token. Throws <see cref="Exception"/> with a descriptive message on failure.
    /// </summary>
    Task<GoogleUserInfo> ValidateIdTokenAsync(string idToken);
}
