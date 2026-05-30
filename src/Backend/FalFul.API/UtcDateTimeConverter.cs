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
        => writer.WriteStringValue(new DateTimeOffset(value, NepalOffset));
}

public class NullableUtcDateTimeConverter : JsonConverter<DateTime?>
{
    private static readonly TimeSpan NepalOffset = TimeSpan.FromMinutes(345);

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.TokenType == JsonTokenType.Null ? null : reader.GetDateTime();

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value is null) writer.WriteNullValue();
        else writer.WriteStringValue(new DateTimeOffset(value.Value, NepalOffset));
    }
}
