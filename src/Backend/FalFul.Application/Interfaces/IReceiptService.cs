using FalFul.Application.DTOs.Receipt;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface IReceiptService
{
    // Template management
    Task<IEnumerable<ReceiptTemplateSummaryDto>> GetAllTemplatesAsync();
    Task<ReceiptTemplateDto?> GetTemplateByIdAsync(int id);
    Task<Result<int>> CreateTemplateAsync(CreateReceiptTemplateDto dto, int publishedByUserId);
    Task<Result> UpdateTemplateAsync(int id, UpdateReceiptTemplateDto dto, int publishedByUserId);
    Task<Result> DeleteTemplateAsync(int id);
    Task<IEnumerable<ReceiptTemplateVersionSummaryDto>> GetTemplateVersionsAsync(int templateId);
    Task<Result> RestoreVersionAsync(int templateId, int versionId, int restoredByUserId);

    // Receipt rendering
    Task<RenderedReceiptDto?> RenderReceiptAsync(int orderId, int? templateId = null);

    // Print audit
    Task<Result<int>> LogPrintAsync(int orderId, int printedByUserId, LogPrintDto dto);
    Task<IEnumerable<ReceiptPrintLogDto>> GetPrintLogsAsync(int? orderId = null, int pageSize = 50, int pageOffset = 0);
}
