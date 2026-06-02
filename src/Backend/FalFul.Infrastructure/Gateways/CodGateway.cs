using FalFul.Application.DTOs.Payment;
using FalFul.Application.Interfaces;

namespace FalFul.Infrastructure.Gateways;

/// <summary>
/// Cash on Delivery — no external redirect. Payment stays Pending until
/// admin/rider confirms cash collected via the confirm-balance endpoint.
/// </summary>
public class CodGateway : IPaymentGateway
{
    public string Code => "cod";

    public Task<GatewayInitiateResult> InitiateAsync(GatewayInitiateRequest request)
        => Task.FromResult(GatewayInitiateResult.Success());   // no redirect needed

    public Task<GatewayVerifyResult> VerifyAsync(Dictionary<string, string> callbackData)
        => Task.FromResult(GatewayVerifyResult.Success(transactionId: $"COD-{DateTime.UtcNow:yyyyMMddHHmmss}"));
}
