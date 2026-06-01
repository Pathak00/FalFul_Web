namespace FalFul.Application.DTOs.Receipt;

public class ReceiptTemplateDto
{
    public int       Id                  { get; set; }
    public string    Name                { get; set; } = string.Empty;
    public string    HtmlContent         { get; set; } = string.Empty;
    public bool      IsDefault           { get; set; }
    public bool      IsActive            { get; set; }
    public DateTime  CreatedAt           { get; set; }
    public DateTime? UpdatedAt           { get; set; }
    public DateTime? PublishedAt         { get; set; }
    public int?      PublishedByUserId   { get; set; }
}

public class ReceiptTemplateSummaryDto
{
    public int       Id                  { get; set; }
    public string    Name                { get; set; } = string.Empty;
    public bool      IsDefault           { get; set; }
    public bool      IsActive            { get; set; }
    public DateTime  CreatedAt           { get; set; }
    public DateTime? UpdatedAt           { get; set; }
    public DateTime? PublishedAt         { get; set; }
}

public class ReceiptTemplateVersionDto
{
    public int       Id                  { get; set; }
    public int       TemplateId          { get; set; }
    public int       VersionNumber       { get; set; }
    public string    HtmlContent         { get; set; } = string.Empty;
    public string?   Label               { get; set; }
    public DateTime  CreatedAt           { get; set; }
    public int?      CreatedByUserId     { get; set; }
}

public class ReceiptTemplateVersionSummaryDto
{
    public int       Id                  { get; set; }
    public int       TemplateId          { get; set; }
    public int       VersionNumber       { get; set; }
    public string?   Label               { get; set; }
    public DateTime  CreatedAt           { get; set; }
    public int?      CreatedByUserId     { get; set; }
}

public class CreateReceiptTemplateDto
{
    public string Name        { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public bool   IsDefault   { get; set; }
}

public class UpdateReceiptTemplateDto
{
    public string  Name          { get; set; } = string.Empty;
    public string  HtmlContent   { get; set; } = string.Empty;
    public bool    IsDefault     { get; set; }
    public bool    IsActive      { get; set; }
    public string? VersionLabel  { get; set; }
}
