using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IReceiptTemplateRepository
{
    Task<IEnumerable<ReceiptTemplate>> GetAllAsync();
    Task<ReceiptTemplate?> GetByIdAsync(int id);
    Task<ReceiptTemplate?> GetDefaultAsync();
    Task<int> CreateAsync(ReceiptTemplate template, int? publishedByUserId = null);
    Task UpdateAsync(ReceiptTemplate template, bool saveVersion, string? versionLabel, int? publishedByUserId);
    Task DeleteAsync(int id);
    Task<IEnumerable<ReceiptTemplateVersion>> GetVersionsAsync(int templateId);
    Task<ReceiptTemplateVersion?> GetVersionByIdAsync(int versionId);
}
