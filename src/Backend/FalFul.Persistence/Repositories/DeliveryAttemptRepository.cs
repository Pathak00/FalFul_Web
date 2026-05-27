using Dapper;
using FalFul.Application.Interfaces;
using FalFul.Domain.Entities;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class DeliveryAttemptRepository(DapperContext context) : IDeliveryAttemptRepository
{
    public async Task LogAsync(DeliveryAttempt attempt)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_DeliveryAttempt_Create",
            new
            {
                attempt.DeliveryId,
                attempt.RiderName,
                attempt.RiderPhone,
                attempt.WasSuccessful,
                attempt.FailureReason,
                attempt.FailureNotes,
                attempt.NextAction,
                RescheduledDate     = attempt.RescheduledDate.HasValue
                    ? DateOnly.FromDateTime(attempt.RescheduledDate.Value)
                    : (DateOnly?)null,
                attempt.RescheduledTimeSlot
            },
            commandType: CommandType.StoredProcedure);
    }
}
