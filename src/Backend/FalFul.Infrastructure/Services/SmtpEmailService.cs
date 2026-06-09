using FalFul.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace FalFul.Infrastructure.Services;

public class SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var section = config.GetSection("Email");
        var host    = section["SmtpHost"];
        var port    = int.TryParse(section["SmtpPort"], out var p) ? p : 587;
        var user    = section["Username"];
        var pass    = section["Password"];
        var from    = section["FromAddress"] is { Length: > 0 } fa ? fa : (user ?? "noreply@falfulfresh.com");
        var name    = section["FromName"] ?? "FalFul Fresh Fruits";

        // Dev fallback — log OTP to console if SMTP is not configured
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user))
        {
            logger.LogWarning("[DEV-EMAIL] To: {To} | Subject: {Subject} | Body: {Body}",
                to, subject, htmlBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(name, from));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body    = new TextPart("html") { Text = htmlBody };

        logger.LogDebug("SMTP connecting to {Host}:{Port} as {User}, From={From}", host, port, user, from);

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(user, pass ?? string.Empty);
        await client.SendAsync(message);
        await client.DisconnectAsync(quit: true);

        logger.LogInformation("Email delivered to {To}", to);
    }
}
