using FalFul.Application.DTOs.Payment;

namespace FalFul.Application.Interfaces;

public interface IPaymentGateway
{
    /// <summary>Gateway code matching PaymentMethods.Code — "cod" | "esewa" | "khalti"</summary>
    string Code { get; }

    /// <summary>
    /// Initiates a payment. Online gateways return a redirect URL or form fields.
    /// COD returns success with no redirect — payment stays Pending until delivery.
    /// </summary>
    Task<GatewayInitiateResult> InitiateAsync(GatewayInitiateRequest request);

    /// <summary>
    /// Verifies a callback or manual confirmation from the gateway.
    /// callbackData is the raw query-string / form values from the gateway redirect.
    /// For COD, callbackData is empty — called when admin confirms cash collected.
    /// </summary>
    Task<GatewayVerifyResult> VerifyAsync(Dictionary<string, string> callbackData);
}
