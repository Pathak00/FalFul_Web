using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IPaymentMethodRepository
{
    Task<IEnumerable<PaymentOption>> GetEnabledAsync();
    Task<IEnumerable<PaymentOption>> GetAllAsync();
    Task UpdateAsync(byte id, bool? isEnabled, byte? displayOrder, string? iconUrl, string? description);
}
