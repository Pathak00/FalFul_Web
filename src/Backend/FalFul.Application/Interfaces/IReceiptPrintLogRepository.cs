using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface IReceiptPrintLogRepository
{
    Task<int> CreateAsync(int orderId, int printedByUserId, string role, int? templateId, int? templateVersionId);
    Task<IEnumerable<ReceiptPrintLog>> GetAllAsync(int? orderId = null, int pageSize = 50, int pageOffset = 0);
}
