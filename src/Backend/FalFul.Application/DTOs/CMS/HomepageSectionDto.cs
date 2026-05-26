namespace FalFul.Application.DTOs.CMS;

public class HomepageSectionDto
{
    public int Id { get; set; }
    public string SectionKey { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Content { get; set; }
    public bool IsVisible { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpsertSectionDto
{
    public string SectionKey { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Content { get; set; }
    public bool IsVisible { get; set; } = true;
    public int DisplayOrder { get; set; }
}
