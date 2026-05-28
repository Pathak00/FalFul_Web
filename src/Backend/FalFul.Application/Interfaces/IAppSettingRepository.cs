using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IAppSettingRepository
{
    Task<IEnumerable<AppSetting>> GetAllAsync();
    Task<AppSetting?> GetByKeyAsync(string key);
    Task UpsertAsync(string key, string value);
}
