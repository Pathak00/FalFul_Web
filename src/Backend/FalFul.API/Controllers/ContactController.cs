using System.Net;
using FalFul.Application.DTOs.Contact;
using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController(
    IEmailService email,
    IAppSettingService settings,
    IConfiguration config) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] ContactFormDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Recipient: DB setting → config fallback
        var recipient = await settings.GetValueAsync("contact_email");
        if (string.IsNullOrWhiteSpace(recipient))
            recipient = config["Email:FromAddress"] ?? config["Email:Username"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(recipient))
            return StatusCode(503, new { message = "Contact email is not configured." });

        var name        = WebUtility.HtmlEncode(dto.Name);
        var senderEmail = WebUtility.HtmlEncode(dto.Email);
        var phone       = string.IsNullOrWhiteSpace(dto.Phone) ? null : WebUtility.HtmlEncode(dto.Phone.Trim());
        var subject     = WebUtility.HtmlEncode(dto.Subject);
        var message     = WebUtility.HtmlEncode(dto.Message);

        var adminHtml = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:28px;">
              <div style="background:#1a2e1a;border-radius:10px 10px 0 0;padding:20px 24px;">
                <h2 style="color:#fff;margin:0;font-size:20px;">🌿 New Contact Form Submission</h2>
                <p style="color:rgba(255,255,255,.6);font-size:13px;margin:4px 0 0;">Received via falfulfresh.com</p>
              </div>
              <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:24px;">
                <table style="width:100%;border-collapse:collapse;font-size:15px;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;width:90px;font-weight:600;vertical-align:top;">Name</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111;">{name}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-weight:600;vertical-align:top;">Email</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;"><a href="mailto:{senderEmail}" style="color:#16a34a;">{senderEmail}</a></td>
                  </tr>
                  {(phone is not null ? $"""
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-weight:600;vertical-align:top;">Phone</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;"><a href="tel:{phone}" style="color:#16a34a;">{phone}</a></td>
                  </tr>
""" : "")}                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-weight:600;vertical-align:top;">Subject</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111;">{subject}</td>
                  </tr>
                </table>
                <div style="margin-top:20px;">
                  <p style="color:#9ca3af;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin:0 0 8px;">Message</p>
                  <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:15px;color:#374151;line-height:1.65;white-space:pre-wrap;">{message}</div>
                </div>
                <p style="margin-top:20px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px;">
                  Reply to this email to respond directly to {name} at {senderEmail}.
                </p>
              </div>
            </div>
            """;

        var autoReplyHtml = $"""
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:28px;">
              <div style="background:#1a2e1a;border-radius:10px 10px 0 0;padding:20px 24px;">
                <h2 style="color:#fff;margin:0;font-size:20px;">🌿 FalFul Fresh Fruits</h2>
              </div>
              <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:28px;">
                <h3 style="color:#1a2e1a;margin:0 0 12px;">Thanks for reaching out, {name}!</h3>
                <p style="color:#374151;line-height:1.7;margin:0 0 20px;">
                  We've received your message and our team will get back to you as soon as possible — usually within 24 hours.
                </p>
                <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:20px;">
                  <p style="margin:0;font-size:14px;color:#374151;"><strong>Subject:</strong> {subject}</p>
                </div>
                <p style="color:#374151;line-height:1.7;margin:0 0 24px;">
                  While you wait, feel free to browse our fresh fruit selection at
                  <a href="https://falfulfresh.com/products" style="color:#16a34a;">falfulfresh.com/products</a>.
                </p>
                <p style="color:#9ca3af;font-size:13px;margin:0;border-top:1px solid #f3f4f6;padding-top:16px;">
                  — The FalFul Team &nbsp;🌿
                </p>
              </div>
            </div>
            """;

        await email.SendAsync(recipient, $"[Contact] {dto.Subject} — from {dto.Name}", adminHtml);

        // Auto-reply is best-effort; don't surface its failure to the user
        try { await email.SendAsync(dto.Email, "We received your message — FalFul Fresh Fruits", autoReplyHtml); }
        catch { /* intentionally swallowed */ }

        return Ok(new { message = "Message sent successfully." });
    }
}
