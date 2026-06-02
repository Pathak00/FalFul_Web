using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class ReceiptPrintLogRepository(DapperContext context) : IReceiptPrintLogRepository
{
    public async Task<int> CreateAsync(int orderId, int printedByUserId, string role, int? templateId, int? templateVersionId)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_ReceiptPrintLog_Create",
            new { OrderId = orderId, PrintedByUserId = printedByUserId, PrintedByRole = role,
                  TemplateId = templateId, TemplateVersionId = templateVersionId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<ReceiptPrintLog>> GetAllAsync(int? orderId = null, int pageSize = 50, int pageOffset = 0)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<ReceiptPrintLog>(
            "sp_ReceiptPrintLog_GetAll",
            new { OrderId = orderId, PageSize = pageSize, PageOffset = pageOffset },
            commandType: CommandType.StoredProcedure);
    }
}
