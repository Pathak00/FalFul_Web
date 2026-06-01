using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IDiscountRepository
{
    Task<IEnumerable<Discount>> GetAllAsync();
    Task<Discount?>             GetByCodeAsync(string code);
    Task<int>                   CreateAsync(Discount d);
    Task                        UpdateAsync(Discount d);
    Task                        DeleteAsync(int id);
    Task                        IncrementUsageAsync(string code);
}
