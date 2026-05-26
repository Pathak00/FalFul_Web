using FalFul.Application.Interfaces;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FalFul.Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly string _clientId;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(IConfiguration config, ILogger<GoogleAuthService> logger)
    {
        _clientId = config["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId is not configured.");
        _logger = logger;
    }

    public async Task<GoogleUserInfo> ValidateIdTokenAsync(string idToken)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_clientId]
            };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            _logger.LogInformation("Google token validated for {Email}", payload.Email);

            return new GoogleUserInfo(
                payload.Subject,
                payload.Email,
                payload.Name,
                payload.Picture
            );
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning("Google JWT validation failed: {Message}", ex.Message);
            throw new Exception($"Google token validation failed: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error validating Google token");
            throw new Exception($"Google authentication error: {ex.Message}", ex);
        }
    }
}
