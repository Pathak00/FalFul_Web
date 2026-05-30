using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using FalFul.Domain.Enums;

namespace FalFul.Application.Interfaces;

public interface IPaymentRepository
{
    Task<int> CreateAsync(int orderId, byte paymentMethodId, PaymentType paymentType, decimal amount);
    Task UpdateStatusAsync(int id, PaymentStatus status, string? gatewayTransactionId = null, string? gatewayResponse = null);
    Task<IEnumerable<Payment>> GetByOrderAsync(int orderId);
    Task<IEnumerable<Payment>> GetAllAsync(byte? paymentMethodId = null, PaymentStatus? status = null, PaymentType? paymentType = null, DateOnly? fromDate = null, DateOnly? toDate = null, int? orderId = null);
    Task<PaymentSettings> GetSettingsAsync();
}
