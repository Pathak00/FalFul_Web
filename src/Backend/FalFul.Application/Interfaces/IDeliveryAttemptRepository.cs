using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IDeliveryAttemptRepository
{
    Task LogAsync(DeliveryAttempt attempt);
}
