using FalFul.Application.DTOs;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;

namespace FalFul.Application.Services;

public class AppSettingService(IAppSettingRepository repo) : IAppSettingService
{
    public async Task<IEnumerable<AppSettingDto>> GetAllAsync()
    {
        var list = await repo.GetAllAsync();
        return list.Select(s => new AppSettingDto
        {
            Key       = s.SettingKey,
            Value     = s.Value,
            UpdatedAt = s.UpdatedAt
        });
    }

    public async Task<string?> GetValueAsync(string key)
    {
        var s = await repo.GetByKeyAsync(key);
        return s?.Value;
    }

    public async Task<Result> UpsertAsync(string key, string value)
    {
        if (string.IsNullOrWhiteSpace(key))   return Result.Failure("Key is required.");
        if (string.IsNullOrWhiteSpace(value))  return Result.Failure("Value is required.");

        try { await repo.UpsertAsync(key.Trim(), value.Trim()); return Result.Success(); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }
}
