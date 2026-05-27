using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class DeliveryIssueRepository(DapperContext context) : IDeliveryIssueRepository
{
    public async Task<int> CreateAsync(DeliveryIssue issue)
    {
        using var conn = context.CreateConnection();
        var result = await conn.QuerySingleAsync(
            "sp_DeliveryIssue_Create",
            new { issue.DeliveryId, issue.IssueType, issue.ReportedBy, issue.Description },
            commandType: CommandType.StoredProcedure);
        return (int)result.Id;
    }

    public async Task ResolveAsync(int id, string? resolutionNotes)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_DeliveryIssue_Resolve",
            new { Id = id, ResolutionNotes = resolutionNotes },
            commandType: CommandType.StoredProcedure);
    }
}
