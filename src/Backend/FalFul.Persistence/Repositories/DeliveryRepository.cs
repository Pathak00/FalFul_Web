using Dapper;
using FalFul.Application.DTOs.Order;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class DeliveryRepository(DapperContext context) : IDeliveryRepository
{
    public async Task CreateAsync(Delivery delivery)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Delivery_Create",
            new { delivery.OrderId, delivery.ScheduledDate, delivery.ScheduledTimeSlot },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Delivery>> GetAllAsync(byte? status = null, DateOnly? fromDate = null, DateOnly? toDate = null)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Delivery>(
            "sp_Delivery_GetAll",
            new { Status = status, FromDate = fromDate, ToDate = toDate },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Delivery?> GetByIdAsync(int id)
    {
        using var conn  = context.CreateConnection();
        using var multi = await conn.QueryMultipleAsync(
            "sp_Delivery_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure);

        var delivery = await multi.ReadSingleOrDefaultAsync<Delivery>();
        if (delivery is null) return null;

        delivery.Attempts = (await multi.ReadAsync<DeliveryAttempt>()).ToList();
        delivery.Issues   = (await multi.ReadAsync<DeliveryIssue>()).ToList();
        return delivery;
    }

    public async Task AssignRiderAsync(int id, string riderName, string riderPhone)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Delivery_Assign",
            new { Id = id, RiderName = riderName, RiderPhone = riderPhone },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateStatusAsync(int id, byte status, string? trackingNotes = null)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Delivery_UpdateStatus",
            new { Id = id, Status = status, TrackingNotes = trackingNotes },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<DeliveryReportDto> GetReportAsync(DateOnly? fromDate, DateOnly? toDate)
    {
        using var conn  = context.CreateConnection();
        using var multi = await conn.QueryMultipleAsync(
            "sp_Report_DeliverySummary",
            new { FromDate = fromDate, ToDate = toDate },
            commandType: CommandType.StoredProcedure);

        var summary  = await multi.ReadSingleAsync<DeliveryReportDto>();
        var failures = (await multi.ReadAsync<FailureReasonBreakdownDto>()).ToList();
        var statuses = (await multi.ReadAsync<StatusBreakdownDto>()).ToList();

        summary.FailureBreakdown = failures;
        summary.StatusBreakdown  = statuses;
        return summary;
    }
}
