using FalFul.Application.DTOs.Payment;
using FalFul.Application.Interfaces;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FalFul.Infrastructure.Gateways;

public class KhaltiConfig
{
    public string SecretKey  { get; set; } = string.Empty;
    public string InitiateUrl { get; set; } = string.Empty;
    public string LookupUrl  { get; set; } = string.Empty;
    public string ReturnUrl  { get; set; } = string.Empty;
}

/// <summary>
/// Khalti payment gateway (Nepal).
/// Initiate: server-to-server POST to Khalti API → returns payment_url for redirect.
/// Verify: server-to-server POST to lookup endpoint using pidx from callback.
/// </summary>
public class KhaltiGateway(IOptions<KhaltiConfig> options, IHttpClientFactory httpClientFactory) : IPaymentGateway
{
    private readonly KhaltiConfig _cfg = options.Value;

    public string Code => "khalti";

    public async Task<GatewayInitiateResult> InitiateAsync(GatewayInitiateRequest request)
    {
        var client = httpClientFactory.CreateClient("Khalti");

        var body = new
        {
            return_url    = request.ReturnUrl,
            website_url   = "http://localhost:4200",
            amount        = (int)(request.Amount * 100), // Khalti uses paisa (1 NPR = 100 paisa)
            purchase_order_id   = $"FF-{request.PaymentId}",
            purchase_order_name = $"FalFul Order #{request.OrderNumber}",
            customer_info       = new { },
        };

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsJsonAsync(_cfg.InitiateUrl, body);
        }
        catch (Exception ex)
        {
            return GatewayInitiateResult.Failure($"Khalti initiation failed: {ex.Message}");
        }

        var raw = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return GatewayInitiateResult.Failure($"Khalti API error {(int)response.StatusCode}: {raw}");

        using var doc = JsonDocument.Parse(raw);
        if (!doc.RootElement.TryGetProperty("payment_url", out var urlEl))
            return GatewayInitiateResult.Failure("Khalti response missing payment_url.");

        return GatewayInitiateResult.Success(redirectUrl: urlEl.GetString()!, formFields: null);
    }

    public async Task<GatewayVerifyResult> VerifyAsync(Dictionary<string, string> data)
    {
        if (!data.TryGetValue("pidx", out var pidx))
            return GatewayVerifyResult.Failure("Missing Khalti pidx.", JsonSerializer.Serialize(data));

        var client = httpClientFactory.CreateClient("Khalti");

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsJsonAsync(_cfg.LookupUrl, new { pidx });
        }
        catch (Exception ex)
        {
            return GatewayVerifyResult.Failure($"Khalti lookup failed: {ex.Message}", JsonSerializer.Serialize(data));
        }

        var raw = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return GatewayVerifyResult.Failure($"Khalti lookup error {(int)response.StatusCode}: {raw}", raw);

        using var doc = JsonDocument.Parse(raw);
        var root   = doc.RootElement;
        var status = root.TryGetProperty("status", out var statusEl) ? statusEl.GetString() : null;

        if (status != "Completed")
            return GatewayVerifyResult.Failure($"Khalti payment not completed (status: {status}).", raw);

        var txId = root.TryGetProperty("transaction_id", out var txEl) ? txEl.GetString() : pidx;
        return GatewayVerifyResult.Success(txId, raw);
    }
}
