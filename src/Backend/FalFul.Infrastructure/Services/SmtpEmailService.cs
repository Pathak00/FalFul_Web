using System.Net;
using System.Net.Mail;
using FalFul.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

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
        var from    = section["FromAddress"] ?? user ?? "noreply@falfulfresh.com";
        var name    = section["FromName"]    ?? "FalFul Fresh Fruits";

        // Dev fallback: if no SMTP credentials configured, just log the OTP
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user))
        {
            logger.LogWarning(
                "[DEV] Email not configured. Would have sent to {To} | Subject: {Subject} | Body: {Body}",
                to, subject, htmlBody);
            return;
        }

        using var client  = new SmtpClient(host, port);
        client.EnableSsl   = true;
        client.Credentials = new NetworkCredential(user, pass);

        using var message     = new MailMessage();
        message.From          = new MailAddress(from, name);
        message.To.Add(to);
        message.Subject       = subject;
        message.Body          = htmlBody;
        message.IsBodyHtml    = true;

        await client.SendMailAsync(message);
        logger.LogInformation("Email sent to {To} — {Subject}", to, subject);
    }
}
