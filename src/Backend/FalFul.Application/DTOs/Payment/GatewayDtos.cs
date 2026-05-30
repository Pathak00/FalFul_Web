namespace FalFul.Application.DTOs.Payment;

public class GatewayInitiateRequest
{
    public int     PaymentId   { get; set; }   // Payments.Id — already persisted before calling gateway
    public int     OrderId     { get; set; }
    public string  OrderNumber { get; set; } = string.Empty;
    public decimal Amount      { get; set; }
    public string  ReturnUrl   { get; set; } = string.Empty;  // gateway redirects here on success
    public string  FailureUrl  { get; set; } = string.Empty;  // gateway redirects here on failure
}

public class GatewayInitiateResult
{
    public bool    IsSuccess   { get; set; }
    public string? RedirectUrl { get; set; }                  // null for COD (no redirect needed)
    public Dictionary<string, string>? FormFields { get; set; }  // eSewa uses a form POST
    public string? ErrorMessage { get; set; }

    public static GatewayInitiateResult Success(string? redirectUrl = null, Dictionary<string, string>? formFields = null)
        => new() { IsSuccess = true, RedirectUrl = redirectUrl, FormFields = formFields };

    public static GatewayInitiateResult Failure(string message)
        => new() { IsSuccess = false, ErrorMessage = message };
}

public class GatewayVerifyResult
{
    public bool    IsSuccess             { get; set; }
    public string? GatewayTransactionId  { get; set; }
    public string? RawResponse           { get; set; }   // JSON stored in Payments.GatewayResponse
    public string? ErrorMessage          { get; set; }

    public static GatewayVerifyResult Success(string? transactionId = null, string? raw = null)
        => new() { IsSuccess = true, GatewayTransactionId = transactionId, RawResponse = raw };

    public static GatewayVerifyResult Failure(string message, string? raw = null)
        => new() { IsSuccess = false, ErrorMessage = message, RawResponse = raw };
}
