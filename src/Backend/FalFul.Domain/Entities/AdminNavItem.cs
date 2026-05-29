namespace FalFul.Domain.Entities;

public class AdminNavItem
{
    public int     Id                 { get; set; }
    public string  Label              { get; set; } = string.Empty;
    public string  Route              { get; set; } = string.Empty;
    public string? Icon               { get; set; }
    public int?    ParentId           { get; set; }
    public string? GroupLabel         { get; set; }
    public int     DisplayOrder       { get; set; }
    public bool    IsVisible          { get; set; }
    public string? RequiredPermission { get; set; }
    public bool    IsSystem           { get; set; }
}
