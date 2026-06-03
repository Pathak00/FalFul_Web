using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FalFul.API.HealthChecks;

public class DatabaseHealthCheck(IConfiguration config) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken  cancellationToken = default)
    {
        var cs = config.GetConnectionString("FalFulDb");
        if (string.IsNullOrWhiteSpace(cs))
            return HealthCheckResult.Unhealthy("Connection string 'FalFulDb' is not configured.");

        try
        {
            await using var conn = new SqlConnection(cs);
            await conn.OpenAsync(cancellationToken);
            await using var cmd = new SqlCommand("SELECT 1", conn);
            await cmd.ExecuteScalarAsync(cancellationToken);
            return HealthCheckResult.Healthy("Database connection OK.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database unreachable.", ex);
        }
    }
}
