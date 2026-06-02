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

        logger.LogInformation("Twilio → sending to {To} from {From}", to, fromNumber);

        var result = await MessageResource.CreateAsync(
            body: message,
            from: new Twilio.Types.PhoneNumber(fromNumber),
            to:   new Twilio.Types.PhoneNumber(to));

        // Log everything useful for diagnosing delivery issues
        logger.LogInformation(
            "Twilio response — SID: {Sid} | Status: {Status} | ErrorCode: {ErrorCode} | ErrorMessage: {ErrorMessage} | To: {To}",
            result.Sid, result.Status, result.ErrorCode, result.ErrorMessage, result.To);

        if (result.ErrorCode is not null)
        {
            var hint = result.ErrorCode == 21608
                ? " (Trial account: recipient number must be verified in Twilio console → Verified Caller IDs)"
                : string.Empty;
            logger.LogError("Twilio error [{Code}] {Error}{Hint}", result.ErrorCode, result.ErrorMessage, hint);
            return;
        }

        var failedStatuses = new[]
        {
            MessageResource.StatusEnum.Failed,
            MessageResource.StatusEnum.Undelivered,
            MessageResource.StatusEnum.Canceled,
        };

        if (Array.Exists(failedStatuses, s => s == result.Status))
        {
            logger.LogError("Twilio message {Sid} ended with status {Status} — check https://console.twilio.com/us1/monitor/logs/sms",
                result.Sid, result.Status);
        }
        else
        {
            logger.LogInformation("Twilio message {Sid} accepted with status {Status} → check console for delivery confirmation",
                result.Sid, result.Status);
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
