using FalFul.Application.DTOs;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IAppSettingService
{
    Task<IEnumerable<AppSettingDto>> GetAllAsync();
    Task<string?> GetValueAsync(string key);
    Task<Result> UpsertAsync(string key, string value);
}
