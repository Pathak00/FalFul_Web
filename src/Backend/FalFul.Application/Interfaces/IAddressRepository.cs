using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IAddressRepository
{
    Task<IEnumerable<Address>> GetByUserAsync(int userId);
    Task<Address?>             GetByIdAsync(int id);
    Task<int>                  CreateAsync(Address address);
    Task                       UpdateAsync(Address address);
    Task                       DeleteAsync(int id, int userId);
}
