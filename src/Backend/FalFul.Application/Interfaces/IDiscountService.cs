using FalFul.Application.DTOs.Discount;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IDiscountService
{
    Task<IEnumerable<DiscountDto>>      GetAllAsync();
    Task<DiscountValidationResultDto>   ValidateAsync(string code, decimal orderAmount);
    Task<Result>                        CreateAsync(CreateDiscountDto dto);
    Task<Result>                        UpdateAsync(int id, UpdateDiscountDto dto);
    Task<Result>                        DeleteAsync(int id);
}
