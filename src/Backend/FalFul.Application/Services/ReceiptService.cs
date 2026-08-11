using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using FalFul.Application.DTOs.Receipt;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;

namespace FalFul.Application.Services;

public class ReceiptService(
    IReceiptTemplateRepository templates,
    IReceiptPrintLogRepository  printLogs,
    IOrderRepository            orders,
    IAppSettingRepository       settings) : IReceiptService
{
    // ── Template management ───────────────────────────────────────────────────

    public async Task<IEnumerable<ReceiptTemplateSummaryDto>> GetAllTemplatesAsync()
    {
        var list = await templates.GetAllAsync();
        return list.Select(MapSummary);
    }

    public async Task<ReceiptTemplateDto?> GetTemplateByIdAsync(int id)
    {
        var t = await templates.GetByIdAsync(id);
        return t is null ? null : MapFull(t);
    }

    public async Task<Result<int>> CreateTemplateAsync(CreateReceiptTemplateDto dto, int publishedByUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))        return Result<int>.Failure("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.HtmlContent)) return Result<int>.Failure("HTML content is required.");

        var entity = new ReceiptTemplate
        {
            Name        = dto.Name.Trim(),
            HtmlContent = dto.HtmlContent,
            IsDefault   = dto.IsDefault
        };

        try
        {
            var id = await templates.CreateAsync(entity, publishedByUserId);
            return Result<int>.Success(id,"");
        }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    public async Task<Result> UpdateTemplateAsync(int id, UpdateReceiptTemplateDto dto, int publishedByUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))        return Result.Failure("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.HtmlContent)) return Result.Failure("HTML content is required.");

        var existing = await templates.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Template not found.");

        existing.Name        = dto.Name.Trim();
        existing.HtmlContent = dto.HtmlContent;
        existing.IsDefault   = dto.IsDefault;
        existing.IsActive    = dto.IsActive;

        try
        {
            await templates.UpdateAsync(existing, saveVersion: true, dto.VersionLabel, publishedByUserId);
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteTemplateAsync(int id)
    {
        var existing = await templates.GetByIdAsync(id);
        if (existing is null) return Result.Failure("Template not found.");

        try { await templates.DeleteAsync(id); return Result.Success(""); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<IEnumerable<ReceiptTemplateVersionSummaryDto>> GetTemplateVersionsAsync(int templateId)
    {
        var versions = await templates.GetVersionsAsync(templateId);
        return versions.Select(v => new ReceiptTemplateVersionSummaryDto
        {
            Id = v.Id, TemplateId = v.TemplateId, VersionNumber = v.VersionNumber,
            Label = v.Label, CreatedAt = v.CreatedAt, CreatedByUserId = v.CreatedByUserId
        });
    }

    public async Task<Result> RestoreVersionAsync(int templateId, int versionId, int restoredByUserId)
    {
        var template = await templates.GetByIdAsync(templateId);
        if (template is null) return Result.Failure("Template not found.");

        var version = await templates.GetVersionByIdAsync(versionId);
        if (version is null || version.TemplateId != templateId)
            return Result.Failure("Version not found.");

        template.HtmlContent = version.HtmlContent;

        try
        {
            await templates.UpdateAsync(template, saveVersion: true,
                $"Restored from v{version.VersionNumber}", restoredByUserId);
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    // ── Receipt rendering ─────────────────────────────────────────────────────

    public async Task<RenderedReceiptDto?> RenderReceiptAsync(int orderId, int? templateId = null)
    {
        var data = await orders.GetReceiptDataAsync(orderId);
        if (data is null) return null;

        ReceiptTemplate? template = templateId.HasValue
            ? await templates.GetByIdAsync(templateId.Value)
            : await templates.GetDefaultAsync();

        if (template is null) return null;

        var allSettings = (await settings.GetAllAsync())
            .ToDictionary(s => s.SettingKey, s => s.Value);

        var html = await RenderHtml(template.HtmlContent, data, allSettings);

        return new RenderedReceiptDto
        {
            OrderId     = orderId,
            OrderNumber = data.OrderNumber,
            Html        = html,
            TemplateId  = template.Id
        };
    }

    // ── Print audit ───────────────────────────────────────────────────────────

    public async Task<Result<int>> LogPrintAsync(int orderId, int printedByUserId, LogPrintDto dto)
    {
        try
        {
            var id = await printLogs.CreateAsync(orderId, printedByUserId,
                dto.Role, dto.TemplateId, dto.TemplateVersionId);
            return Result<int>.Success(id,"");
        }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    public async Task<IEnumerable<ReceiptPrintLogDto>> GetPrintLogsAsync(int? orderId = null, int pageSize = 50, int pageOffset = 0)
    {
        var logs = await printLogs.GetAllAsync(orderId, pageSize, pageOffset);
        return logs.Select(l => new ReceiptPrintLogDto
        {
            Id = l.Id, OrderId = l.OrderId, OrderNumber = l.OrderNumber,
            PrintedByUserId = l.PrintedByUserId, PrintedByName = l.PrintedByName,
            PrintedByRole = l.PrintedByRole, PrintedAt = l.PrintedAt,
            TemplateId = l.TemplateId, TemplateName = l.TemplateName,
            TemplateVersionId = l.TemplateVersionId
        });
    }

    // ── Template rendering engine ─────────────────────────────────────────────

    private static Task<string> RenderHtml(
        string html,
        OrderReceiptDataDto data,
        Dictionary<string, string> appSettings)
    {
        var vars = BuildVariables(data, appSettings);

        // Replace simple {{variable}} placeholders
        foreach (var (key, value) in vars)
            html = html.Replace($"{{{{{key}}}}}", value);

        // Handle {{#if variable}}...{{/if}} conditional blocks
        html = ProcessConditionalBlocks(html, vars);

        return Task.FromResult(html);
    }

    private static Dictionary<string, string> BuildVariables(
        OrderReceiptDataDto data,
        Dictionary<string, string> s)
    {
        string Nepal(DateTime? dt) =>
            dt.HasValue ? dt.Value.ToString("dd MMM yyyy, hh:mm tt", CultureInfo.InvariantCulture) : "";
        string NepalDate(DateTime? dt) =>
            dt.HasValue ? dt.Value.ToString("dd MMM yyyy", CultureInfo.InvariantCulture) : "";
        string Money(decimal v) => v.ToString("N0", CultureInfo.InvariantCulture);

        static string OrderStatusLabel(byte s) => s switch
        {
            1 => "Pending", 2 => "Confirmed", 3 => "Preparing",
            4 => "Ready for Delivery", 5 => "Cancelled", 6 => "Rejected",
            7 => "Awaiting Payment", _ => s.ToString()
        };
        static string DeliveryStatusLabel(byte? s) => s switch
        {
            1 => "Awaiting Rider", 2 => "Rider Assigned", 3 => "Picked Up",
            4 => "Out for Delivery", 5 => "Delivered", 6 => "Delivery Failed",
            7 => "Customer Unavailable", 8 => "Rescheduled", 9 => "Returned",
            _ => s?.ToString() ?? ""
        };
        static string PaymentMethodLabel(byte m) => m switch
        {
            1 => "Cash on Delivery", 2 => "eSewa", 3 => "Khalti", _ => m.ToString()
        };
        static string PaymentStatusLabel(byte ps) => ps switch
        {
            1 => "Pending", 2 => "Completed", 3 => "Failed",
            4 => "Refunded", 5 => "Cancelled", _ => ps.ToString()
        };

        var deliveryAddress = string.Join(", ", new[]
        {
            data.AddressLabel, data.DeliveryFullAddress, data.Landmark, data.DeliveryCity
        }.Where(x => !string.IsNullOrWhiteSpace(x)));

        var balance = data.TotalAmount - data.AdvanceAmount;

        var vars = new Dictionary<string, string>
        {
            // AppSettings — static content
            ["company_name"]    = s.GetValueOrDefault("receipt_company_name",    "FalFul"),
            ["company_address"] = s.GetValueOrDefault("receipt_company_address", ""),
            ["company_phone"]   = s.GetValueOrDefault("receipt_company_phone",   ""),
            ["tax_id"]          = s.GetValueOrDefault("receipt_tax_id",          ""),
            ["header_text"]     = s.GetValueOrDefault("receipt_header_text",     ""),
            ["footer_text"]     = s.GetValueOrDefault("receipt_footer_text",     ""),
            ["terms_text"]      = s.GetValueOrDefault("receipt_terms_text",      ""),
            ["thank_you_message"] = s.GetValueOrDefault("receipt_thank_you_message", "Thank you!"),
            ["refund_policy"]   = s.GetValueOrDefault("receipt_refund_policy",   ""),

            // Order
            ["order_number"]    = data.OrderNumber,
            ["order_date"]      = Nepal(data.OrderDate),
            ["order_status"]    = OrderStatusLabel(data.OrderStatus),
            ["payment_method"]  = PaymentMethodLabel(data.PaymentMethod),
            ["payment_status"]  = PaymentStatusLabel(data.PaymentStatus),

            // Customer
            ["customer_name"]   = data.CustomerName,
            ["customer_email"]  = data.CustomerEmail,
            ["customer_phone"]  = data.CustomerPhone,

            // Delivery
            ["delivery_address"]    = deliveryAddress,
            ["delivery_date"]       = NepalDate(data.DeliveryDate),
            ["delivery_time_slot"]  = data.DeliveryTimeSlot ?? "",
            ["delivery_status"]     = DeliveryStatusLabel(data.DeliveryStatus),
            ["rider_name"]          = data.RiderName ?? "",
            ["rider_phone"]         = data.RiderPhone ?? "",
            ["delivered_at"]        = Nepal(data.DeliveredAt),

            // Pricing
            ["subtotal"]        = Money(data.SubTotal),
            ["delivery_fee"]    = Money(data.DeliveryFee),
            ["service_fee"]     = Money(data.ServiceFee),
            ["discount_amount"] = Money(data.DiscountAmount),
            ["discount_code"]   = data.DiscountCode ?? "",
            ["total_amount"]    = Money(data.TotalAmount),
            ["advance_amount"]  = Money(data.AdvanceAmount),
            ["balance_due"]     = Money(balance > 0 ? balance : 0),

            // Notes
            ["customer_notes"]  = data.CustomerNotes ?? "",

            // Meta
            ["printed_at"]      = DateTime.Now.ToString("dd MMM yyyy, hh:mm tt", CultureInfo.InvariantCulture),

            // Items table — built inline
            ["order_items_rows"] = BuildItemsRows(data.Items)
        };

        return vars;
    }

    private static string BuildItemsRows(List<OrderReceiptItemDto> items)
    {
        var sb = new StringBuilder();
        foreach (var item in items)
        {
            var name = item.IsCustomBuild ? $"{item.ProductName} <small style='color:#94a3b8'>(Custom Build)</small>" : item.ProductName;
            sb.AppendLine($"""
                <tr>
                  <td>{name}</td>
                  <td style="text-align:right">{item.Quantity:N1} {item.Unit}</td>
                  <td style="text-align:right">Rs. {item.UnitPrice:N0}</td>
                  <td style="text-align:right">Rs. {item.TotalPrice:N0}</td>
                </tr>
                """);
        }
        return sb.ToString();
    }

    // Processes {{#if variable}}content{{/if}} — shows content only when variable is non-empty
    private static string ProcessConditionalBlocks(string html, Dictionary<string, string> vars)
    {
        return Regex.Replace(html, @"\{\{#if (\w+)\}\}(.*?)\{\{/if\}\}",
            m =>
            {
                var key = m.Groups[1].Value;
                var content = m.Groups[2].Value;
                var hasValue = vars.TryGetValue(key, out var val) && !string.IsNullOrWhiteSpace(val);
                return hasValue ? content : string.Empty;
            },
            RegexOptions.Singleline);
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    private static ReceiptTemplateSummaryDto MapSummary(ReceiptTemplate t) => new()
    {
        Id = t.Id, Name = t.Name, IsDefault = t.IsDefault, IsActive = t.IsActive,
        CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt, PublishedAt = t.PublishedAt
    };

    private static ReceiptTemplateDto MapFull(ReceiptTemplate t) => new()
    {
        Id = t.Id, Name = t.Name, HtmlContent = t.HtmlContent,
        IsDefault = t.IsDefault, IsActive = t.IsActive,
        CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt,
        PublishedAt = t.PublishedAt, PublishedByUserId = t.PublishedByUserId
    };
}
