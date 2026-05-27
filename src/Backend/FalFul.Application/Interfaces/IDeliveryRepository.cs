using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IDeliveryRepository
{
    Task CreateAsync(Delivery delivery);
}
