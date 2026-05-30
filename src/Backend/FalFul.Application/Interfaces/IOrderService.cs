using FalFul.Application.DTOs.Order;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IOrderService
{
    // Addresses
    Task<IEnumerable<AddressDto>> GetAddressesAsync(int userId);
    Task<Result<int>>             CreateAddressAsync(int userId, CreateAddressDto dto);
    Task<Result>                  UpdateAddressAsync(int id, int userId, UpdateAddressDto dto);
    Task<Result>                  DeleteAddressAsync(int id, int userId);

    // Price rules
    Task<IEnumerable<PriceRuleDto>> GetPriceRulesAsync();
    Task<Result>                    UpsertPriceRuleAsync(UpsertPriceRuleDto dto);

    // Orders (customer)
    Task<Result<PlaceOrderResultDto>>  PlaceOrderAsync(int userId, string customerName, PlaceOrderDto dto);
    Task<IEnumerable<OrderSummaryDto>> GetUserOrdersAsync(int userId);
    Task<OrderDetailDto?>             GetOrderByIdAsync(int id, int? userId = null);
    Task<Result>                      CancelOrderAsync(int id, int userId, CancelOrderDto dto);

    // Orders (admin)
    Task<IEnumerable<OrderSummaryDto>> GetAllOrdersAsync(byte? status = null);
    Task<Result>                        UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto);
}
