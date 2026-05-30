using Dapper;
using FalFul.Application.DTOs.Payment;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;
using FalFul.Domain.Enums;
using FalFul.Persistence.Context;
using System.Data;

namespace FalFul.Persistence.Repositories;

public class PaymentRepository(DapperContext context) : IPaymentRepository
{
    public async Task<int> CreateAsync(int orderId, byte paymentMethodId, PaymentType paymentType, decimal amount)
    {
        using var conn = context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "sp_Payment_Create",
            new { OrderId = orderId, PaymentMethodId = paymentMethodId, PaymentType = (byte)paymentType, Amount = amount },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateStatusAsync(int id, PaymentStatus status, string? gatewayTransactionId = null, string? gatewayResponse = null)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Payment_UpdateStatus",
            new { Id = id, Status = (byte)status, GatewayTransactionId = gatewayTransactionId, GatewayResponse = gatewayResponse },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Payment>> GetByOrderAsync(int orderId)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Payment>(
            "sp_Payment_GetByOrder",
            new { OrderId = orderId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<Payment>> GetAllAsync(
        byte? paymentMethodId = null,
        PaymentStatus? status = null,
        PaymentType? paymentType = null,
        DateOnly? fromDate = null,
        DateOnly? toDate = null,
        int? orderId = null)
    {
        using var conn = context.CreateConnection();
        return await conn.QueryAsync<Payment>(
            "sp_Payment_GetAll",
            new
            {
                PaymentMethodId = paymentMethodId,
                Status          = status.HasValue ? (byte?)status.Value : null,
                PaymentType     = paymentType.HasValue ? (byte?)paymentType.Value : null,
                FromDate        = fromDate,
                ToDate          = toDate,
                OrderId         = orderId
            },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        using var conn = context.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Payment>(
            "sp_Payment_GetById",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
    }

    public async Task UpdateOrderPaymentStatusAsync(int orderId, PaymentStatus status, decimal? advanceAmount = null)
    {
        using var conn = context.CreateConnection();
        await conn.ExecuteAsync(
            "sp_Order_UpdatePaymentStatus",
            new { Id = orderId, PaymentStatus = (byte)status, AdvanceAmount = advanceAmount },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<PaymentSettings> GetSettingsAsync()
    {
        using var conn = context.CreateConnection();
        var rows = await conn.QueryAsync<(string Key, string Value)>(
            "sp_PaymentSetting_Get",
            commandType: CommandType.StoredProcedure);

        var map = rows.ToDictionary(r => r.Key, r => r.Value);

        return new PaymentSettings
        {
            AdvanceEnabled   = map.TryGetValue("payment:advance:enabled",    out var e) && e == "1",
            AdvancePercent   = map.TryGetValue("payment:advance:percent",    out var p) && decimal.TryParse(p, out var pv) ? pv : 30m,
            MinAdvanceAmount = map.TryGetValue("payment:advance:min_amount", out var m) && decimal.TryParse(m, out var mv) ? mv : 100m
        };
    }

    public async Task<PaymentReportData> GetReportAsync(DateOnly? fromDate, DateOnly? toDate)
    {
        using var conn  = context.CreateConnection();
        using var multi = await conn.QueryMultipleAsync(
            "sp_Report_PaymentSummary",
            new { FromDate = fromDate, ToDate = toDate },
            commandType: CommandType.StoredProcedure);

        var summary  = await multi.ReadSingleAsync<PaymentReportData>();
        summary.MethodBreakdown = (await multi.ReadAsync<PaymentMethodBreakdownDto>()).ToList();
        summary.StatusBreakdown = (await multi.ReadAsync<RawStatusBreakdown>()).ToList();
        return summary;
    }
}
