using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class ReceiptTemplateRepository(DapperContext context) : IReceiptTemplateRepository
{
    public async Task<IEnumerable<ReceiptTemplate>> GetAllAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<ReceiptTemplate>(
            "sp_ReceiptTemplate_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<ReceiptTemplate?> GetByIdAsync(int id)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<ReceiptTemplate>(
            "sp_ReceiptTemplate_GetById", new { Id = id }, commandType: CommandType.StoredProcedure);
    }

    public async Task<ReceiptTemplate?> GetDefaultAsync()
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<ReceiptTemplate>(
            "sp_ReceiptTemplate_GetDefault", commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(ReceiptTemplate template, int? publishedByUserId = null)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_ReceiptTemplate_Create",
            new { template.Name, template.HtmlContent, template.IsDefault, PublishedByUserId = publishedByUserId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateAsync(ReceiptTemplate template, bool saveVersion, string? versionLabel, int? publishedByUserId)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_ReceiptTemplate_Update",
            new
            {
                template.Id,
                template.Name,
                template.HtmlContent,
                template.IsDefault,
                template.IsActive,
                PublishedByUserId = publishedByUserId,
                SaveVersion       = saveVersion,
                VersionLabel      = versionLabel
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_ReceiptTemplate_Delete", new { Id = id }, commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<ReceiptTemplateVersion>> GetVersionsAsync(int templateId)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<ReceiptTemplateVersion>(
            "sp_ReceiptTemplateVersion_GetAll",
            new { TemplateId = templateId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<ReceiptTemplateVersion?> GetVersionByIdAsync(int versionId)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<ReceiptTemplateVersion>(
            "sp_ReceiptTemplateVersion_GetById",
            new { Id = versionId },
            commandType: CommandType.StoredProcedure);
    }
}
