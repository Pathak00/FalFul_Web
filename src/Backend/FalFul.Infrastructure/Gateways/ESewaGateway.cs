using FalFul.Application.DTOs.Payment;
using FalFul.Application.Interfaces;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace FalFul.Infrastructure.Gateways;

public class ESewaConfig
{
    public string MerchantCode { get; set; } = string.Empty;
    public string SecretKey    { get; set; } = string.Empty;
    public string PaymentUrl   { get; set; } = string.Empty;
}

/// <summary>
/// eSewa v2 payment gateway (Nepal).
/// Initiate: returns form fields for a browser POST to eSewa's payment page.
/// Verify: validates HMAC-SHA256 signature on the decoded callback data.
/// </summary>
public class ESewaGateway(IOptions<ESewaConfig> options) : IPaymentGateway
{
    private readonly ESewaConfig _cfg = options.Value;

    public string Code => "esewa";

    public Task<GatewayInitiateResult> InitiateAsync(GatewayInitiateRequest request)
    {
        // transaction_uuid encodes paymentId so we can resolve it on callback
        var uuid   = $"FF-{request.PaymentId}-{DateTime.Now:yyyyMMddHHmmss}";
        var amount = request.Amount.ToString("F2");
        var sig    = Sign($"total_amount={amount},transaction_uuid={uuid},product_code={_cfg.MerchantCode}");

        var fields = new Dictionary<string, string>
        {
            ["amount"]                  = amount,
            ["tax_amount"]              = "0",
            ["total_amount"]            = amount,
            ["transaction_uuid"]        = uuid,
            ["product_code"]            = _cfg.MerchantCode,
            ["product_service_charge"]  = "0",
            ["product_delivery_charge"] = "0",
            ["success_url"]             = request.ReturnUrl,
            ["failure_url"]             = request.FailureUrl,
            ["signed_field_names"]      = "total_amount,transaction_uuid,product_code",
            ["signature"]               = sig
        };

        return Task.FromResult(GatewayInitiateResult.Success(redirectUrl: _cfg.PaymentUrl, formFields: fields));
    }

    public Task<GatewayVerifyResult> VerifyAsync(Dictionary<string, string> data)
    {
        var raw = JsonSerializer.Serialize(data);

        if (!data.TryGetValue("status", out var status) || status != "COMPLETE")
            return Task.FromResult(GatewayVerifyResult.Failure("eSewa payment not completed.", raw));

        // Verify signature
        if (!data.TryGetValue("signed_field_names", out var signedNames) ||
            !data.TryGetValue("signature", out var receivedSig))
            return Task.FromResult(GatewayVerifyResult.Failure("Missing signature fields.", raw));

        var message = string.Join(",", signedNames.Split(',')
            .Select(f => $"{f}={data.GetValueOrDefault(f, "")}"));

        if (Sign(message) != receivedSig)
            return Task.FromResult(GatewayVerifyResult.Failure("Signature mismatch — possible tampering.", raw));

        var txId = data.GetValueOrDefault("transaction_code");
        return Task.FromResult(GatewayVerifyResult.Success(txId, raw));
    }

    private string Sign(string message)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_cfg.SecretKey));
        return Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(message)));
    }
}
