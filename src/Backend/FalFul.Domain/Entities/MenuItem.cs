namespace FalFul.Domain.Entities;

public class MenuItem
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    // 0=Everyone 1=AnyLoggedIn 2=GuestOnly 3=SpecificRoles (junction table)
    public int VisibleTo { get; set; }
    public string? RequiredRoleIds { get; set; }  // comma-separated from STRING_AGG
    public bool OpenInNewTab { get; set; }
    /// <summary>When set, this portal shortcut is visible only to users whose role's PortalType matches.
    /// Replaces the MenuItemRoles role-ID approach for portal shortcuts, so new roles with the matching
    /// PortalType automatically see the shortcut without any manual MenuItemRoles maintenance.</summary>
    public string? RequiredPortalType { get; set; }
}
