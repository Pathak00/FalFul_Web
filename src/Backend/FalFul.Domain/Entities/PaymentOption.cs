namespace FalFul.Domain.Entities;

/// <summary>
/// Row in PaymentMethods table — admin-managed, fetched from DB, not hardcoded.
/// </summary>
public class PaymentOption
{
    public byte    Id           { get; set; }
    public string  Name         { get; set; } = string.Empty;
    public string  Code         { get; set; } = string.Empty;  // "cod" | "esewa" | "khalti"
    public bool    IsEnabled    { get; set; }
    public byte    DisplayOrder { get; set; }
    public string? IconUrl      { get; set; }
    public string? Description  { get; set; }
    public DateTime  CreatedAt  { get; set; }
    public DateTime? UpdatedAt  { get; set; }
}
