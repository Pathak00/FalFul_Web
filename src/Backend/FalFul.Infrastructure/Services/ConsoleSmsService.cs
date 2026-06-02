using FalFul.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace FalFul.Infrastructure.Services;

/// <summary>
/// Development stub — logs SMS messages to the console instead of sending them.
/// Swap for TwilioSmsService (or Sparrow SMS) before going to production.
/// </summary>
public class ConsoleSmsService(ILogger<ConsoleSmsService> logger) : ISmsService
{
    public Task SendAsync(string toPhone, string message)
    {
        logger.LogWarning("[DEV-SMS] To: {Phone} | Message: {Message}", toPhone, message);
        return Task.CompletedTask;
    }
}
