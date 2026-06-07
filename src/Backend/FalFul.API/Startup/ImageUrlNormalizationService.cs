using System.Data;
using Dapper;
using FalFul.Persistence.Context;

namespace FalFul.API.Startup;

/// <summary>
/// Runs once at startup to strip any environment-specific base URLs from image paths
/// stored in the database, converting them to portable relative paths.
///
/// Example:  http://localhost:5287/uploads/abc.jpg  →  uploads/abc.jpg
/// </summary>
public class ImageUrlNormalizationService(DapperContext db, ILogger<ImageUrlNormalizationService> logger)
    : IHostedService
{
    // Tables and columns that may contain image URLs uploaded through the API.
    private static readonly (string Table, string Column)[] ImageColumns =
    [
        ("Products",   "ImageUrl"),
        ("Categories", "ImageUrl"),
        ("Banners",    "ImageUrl"),
        ("Notices",    "ImageUrl"),
    ];

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var conn = db.CreateConnection();
        conn.Open();

        int totalFixed = 0;

        foreach (var (table, column) in ImageColumns)
        {
            // Find how many rows have a full URL pointing at /uploads/
            int dirty = await conn.ExecuteScalarAsync<int>(
                $"SELECT COUNT(*) FROM [{table}] WHERE [{column}] LIKE 'http%/uploads/%'");

            if (dirty == 0) continue;

            // Strip everything up to and including the last occurrence of "/uploads/"
            // e.g.  http://localhost:5287/uploads/abc.jpg  →  uploads/abc.jpg
            int rows = await conn.ExecuteAsync(
                $"""
                UPDATE [{table}]
                SET [{column}] = SUBSTRING(
                    [{column}],
                    CHARINDEX('/uploads/', [{column}]) + 1,
                    LEN([{column}])
                )
                WHERE [{column}] LIKE 'http%/uploads/%'
                """);

            totalFixed += rows;
            logger.LogInformation(
                "ImageUrlNormalization: fixed {Rows} row(s) in {Table}.{Column}", rows, table, column);
        }

        if (totalFixed > 0)
            logger.LogInformation("ImageUrlNormalization: {Total} image URL(s) normalized to relative paths.", totalFixed);
        else
            logger.LogDebug("ImageUrlNormalization: all image URLs are already in relative-path format.");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
