namespace FalFul.Domain.Common;

public static class NepalTime
{
    public static readonly TimeSpan Offset = TimeSpan.FromMinutes(345); // UTC+05:45

    private static readonly TimeZoneInfo Tz = LoadTz();

    private static TimeZoneInfo LoadTz()
    {
        foreach (var id in new[] { "Nepal Standard Time", "Asia/Kathmandu" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch { /* try next */ }
        }
        // Fallback: fixed +05:45 offset
        return TimeZoneInfo.CreateCustomTimeZone("NST", Offset, "Nepal Standard Time", "NST");
    }

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Tz);
}
