namespace FalFul.Domain.Entities;

public class HomepageSection
{
    public int Id { get; set; }
    public string SectionKey { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Content { get; set; }
    public bool IsVisible { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
