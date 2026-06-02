namespace FalFul.Application.DTOs.Admin;

public class AdminNavItemDto
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
    /// <summary>null=all portals, 'admin'=admin only, 'rider'=rider only.</summary>
    public string? PortalScope        { get; set; }
}

public class UpdateAdminNavItemDto
{
    public int     Id                 { get; set; }
    public string  Label              { get; set; } = string.Empty;
    public string? Icon               { get; set; }
    public string? GroupLabel         { get; set; }
    public int     DisplayOrder       { get; set; }
    public bool    IsVisible          { get; set; }
    /// <summary>Only applied when the item is not a system item (IsSystem = false).</summary>
    public string? RequiredPermission { get; set; }
    /// <summary>Only applied when the item is not a system item (IsSystem = false).</summary>
    public string? PortalScope        { get; set; }
}

public class CreateAdminNavItemDto
{
    public string  Label              { get; set; } = string.Empty;
    public string  Route              { get; set; } = string.Empty;
    public string? Icon               { get; set; }
    public string? GroupLabel         { get; set; }
    public int     DisplayOrder       { get; set; }
    public bool    IsVisible          { get; set; } = true;
    public string? RequiredPermission { get; set; }
    /// <summary>null=all portals, 'admin'=admin only, 'rider'=rider only.</summary>
    public string  PortalScope        { get; set; } = "admin";
}
