namespace FalFul.Domain.Entities;

public class ReceiptTemplate
{
    public int       Id                  { get; set; }
    public string    Name                { get; set; } = string.Empty;
    public string    HtmlContent         { get; set; } = string.Empty;
    public bool      IsDefault           { get; set; }
    public bool      IsActive            { get; set; } = true;
    public DateTime  CreatedAt           { get; set; }
    public DateTime? UpdatedAt           { get; set; }
    public DateTime? PublishedAt         { get; set; }
    public int?      PublishedByUserId   { get; set; }
}

public class ReceiptTemplateVersion
{
    public int       Id                  { get; set; }
    public int       TemplateId          { get; set; }
    public int       VersionNumber       { get; set; }
    public string    HtmlContent         { get; set; } = string.Empty;
    public string?   Label               { get; set; }
    public DateTime  CreatedAt           { get; set; }
    public int?      CreatedByUserId     { get; set; }
}
