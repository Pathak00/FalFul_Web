using FalFul.Application.DTOs.Discount;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;

namespace FalFul.Application.Services;

public class DiscountService(IDiscountRepository discounts) : IDiscountService
{
    public async Task<IEnumerable<DiscountDto>> GetAllAsync()
        => (await discounts.GetAllAsync()).Select(Map);

    public async Task<DiscountValidationResultDto> ValidateAsync(string code, decimal orderAmount)
    {
        if (string.IsNullOrWhiteSpace(code))
            return Invalid("Discount code is required.");

        var d = await discounts.GetByCodeAsync(code.Trim().ToUpper());
        if (d is null || !d.IsActive)
            return Invalid("Invalid or inactive discount code.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (d.StartDate.HasValue && today < d.StartDate.Value)
            return Invalid("This discount is not yet active.");
        if (d.EndDate.HasValue && today > d.EndDate.Value)
            return Invalid("This discount has expired.");
        if (d.MaxUses.HasValue && d.UsesCount >= d.MaxUses.Value)
            return Invalid("This discount code has reached its usage limit.");
        if (orderAmount < d.MinOrderAmount)
            return Invalid($"Minimum order amount of Rs. {d.MinOrderAmount:F0} required for this discount.");

        var discountAmount = d.DiscountType == 1
            ? Math.Round(orderAmount * d.Value / 100, 2)   // Percent
            : Math.Min(d.Value, orderAmount);               // Flat — can't exceed order amount

        return new DiscountValidationResultDto
        {
            IsValid        = true,
            DiscountAmount = discountAmount,
            Message        = d.DiscountType == 1
                ? $"{d.Value:F0}% off applied! You save Rs. {discountAmount:F0}."
                : $"Rs. {discountAmount:F0} off applied!"
        };
    }

    public async Task<Result> CreateAsync(CreateDiscountDto dto)
    {
        var err = Validate(dto);
        if (err is not null) return Result.Failure(err);

        var existing = await discounts.GetByCodeAsync(dto.Code.Trim().ToUpper());
        if (existing is not null) return Result.Failure("A discount with this code already exists.");

        try
        {
            await discounts.CreateAsync(new Discount
            {
                Code           = dto.Code.Trim().ToUpper(),
                Description    = dto.Description?.Trim(),
                DiscountType   = dto.DiscountType,
                Value          = dto.Value,
                MinOrderAmount = dto.MinOrderAmount,
                MaxUses        = dto.MaxUses,
                StartDate      = dto.StartDate,
                EndDate        = dto.EndDate,
                IsActive       = dto.IsActive
            });
            return Result.Success();
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> UpdateAsync(int id, UpdateDiscountDto dto)
    {
        var err = Validate(dto);
        if (err is not null) return Result.Failure(err);

        var existing = await discounts.GetByCodeAsync(dto.Code.Trim().ToUpper());
        if (existing is not null && existing.Id != id)
            return Result.Failure("Another discount with this code already exists.");

        try
        {
            await discounts.UpdateAsync(new Discount
            {
                Id             = id,
                Code           = dto.Code.Trim().ToUpper(),
                Description    = dto.Description?.Trim(),
                DiscountType   = dto.DiscountType,
                Value          = dto.Value,
                MinOrderAmount = dto.MinOrderAmount,
                MaxUses        = dto.MaxUses,
                StartDate      = dto.StartDate,
                EndDate        = dto.EndDate,
                IsActive       = dto.IsActive
            });
            return Result.Success();
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteAsync(int id)
    {
        try { await discounts.DeleteAsync(id); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    private static string? Validate(CreateDiscountDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))    return "Code is required.";
        if (dto.Value <= 0)                          return "Value must be greater than 0.";
        if (dto.DiscountType == 1 && dto.Value > 100) return "Percent discount cannot exceed 100.";
        if (dto.DiscountType != 1 && dto.DiscountType != 2) return "Invalid discount type.";
        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.EndDate < dto.StartDate)
            return "End date must be after start date.";
        return null;
    }

    private static DiscountValidationResultDto Invalid(string msg) =>
        new() { IsValid = false, Message = msg };

    private static DiscountDto Map(Discount d) => new()
    {
        Id             = d.Id,
        Code           = d.Code,
        Description    = d.Description,
        DiscountType   = d.DiscountType,
        TypeLabel      = d.DiscountType == 1 ? "Percent" : "Flat",
        Value          = d.Value,
        MinOrderAmount = d.MinOrderAmount,
        MaxUses        = d.MaxUses,
        UsesCount      = d.UsesCount,
        StartDate      = d.StartDate,
        EndDate        = d.EndDate,
        IsActive       = d.IsActive,
        CreatedAt      = d.CreatedAt
    };
}
