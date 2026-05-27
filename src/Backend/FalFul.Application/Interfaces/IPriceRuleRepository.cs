using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IPriceRuleRepository
{
    Task<IEnumerable<PriceRule>> GetAllAsync();
    Task                         UpsertAsync(string ruleKey, decimal value, bool isActive);
}
