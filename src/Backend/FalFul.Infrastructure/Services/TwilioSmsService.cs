using FalFul.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace FalFul.Infrastructure.Services;

public class TwilioSmsService(IConfiguration config, ILogger<TwilioSmsService> logger) : ISmsService
{
    public async Task SendAsync(string toPhone, string message)
    {
        var section    = config.GetSection("Sms:Twilio");
        var accountSid = section["AccountSid"];
        var authToken  = section["AuthToken"];
        var fromNumber = section["FromNumber"];

        if (string.IsNullOrWhiteSpace(accountSid) ||
            string.IsNullOrWhiteSpace(authToken)  ||
            string.IsNullOrWhiteSpace(fromNumber))
        {
            logger.LogWarning("[DEV-SMS] Twilio not configured. To: {Phone} | Message: {Message}",
                toPhone, message);
            return;
        }

        // Ensure E.164 format for Nepal numbers: 98XXXXXXXX → +9779XXXXXXXX
        var to = NormaliseNepalPhone(toPhone);

        TwilioClient.Init(accountSid, authToken);

        var result = await MessageResource.CreateAsync(
            body: message,
            from: new Twilio.Types.PhoneNumber(fromNumber),
            to:   new Twilio.Types.PhoneNumber(to));

        if (result.ErrorCode is not null)
        {
            logger.LogError("Twilio send failed to {Phone}: [{Code}] {Error}",
                to, result.ErrorCode, result.ErrorMessage);
        }
        else
        {
            logger.LogInformation("SMS sent to {Phone} (SID: {Sid})", to, result.Sid);
        }
    }

    // Converts 98XXXXXXXX or 9841234567 → +9779841234567
    private static string NormaliseNepalPhone(string phone)
    {
        phone = phone.Trim().Replace(" ", "").Replace("-", "");

        if (phone.StartsWith('+'))  return phone;              // already E.164
        if (phone.StartsWith("977")) return '+' + phone;       // 977XXXXXXXXX
        if (phone.Length == 10)     return "+977" + phone;     // 98XXXXXXXX
        if (phone.Length == 9)      return "+9779" + phone[1..]; // 8XXXXXXXX (rare)

        return phone; // pass through unchanged; Twilio will reject if invalid
    }
}
