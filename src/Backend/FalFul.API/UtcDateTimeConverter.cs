using System.Text.Json;
using System.Text.Json.Serialization;

namespace FalFul.API;

// All DateTime values in the DB are stored as Nepal Standard Time (UTC+05:45).
// Serializing with the +05:45 offset lets JavaScript (and Angular) parse the
// correct local moment regardless of the client's browser timezone.
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    private static readonly TimeSpan NepalOffset = TimeSpan.FromMinutes(345);

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.GetDateTime();

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // DateTime.MinValue with a positive offset underflows DateTimeOffset; write ISO 8601 fallback.
        try { writer.WriteStringValue(new DateTimeOffset(value, NepalOffset)); }
        catch (ArgumentOutOfRangeException) { writer.WriteStringValue(value.ToString("o")); }
    }
}

public class NullableUtcDateTimeConverter : JsonConverter<DateTime?>
{
    private static readonly TimeSpan NepalOffset = TimeSpan.FromMinutes(345);

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.Null ? null : reader.GetDateTime();

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value is null) { writer.WriteNullValue(); return; }
        try { writer.WriteStringValue(new DateTimeOffset(value.Value, NepalOffset)); }
        catch (ArgumentOutOfRangeException) { writer.WriteStringValue(value.Value.ToString("o")); }
    }
}
