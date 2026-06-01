namespace FalFul.Application.DTOs.CMS;

public class MenuItemDto
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; }
    public int VisibleTo { get; set; }
    public int[] RequiredRoleIds { get; set; } = [];
    public bool OpenInNewTab { get; set; }
    public bool IsPortalShortcut { get; set; }
}

public class CreateMenuItemDto
{
    public int? ParentId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public int VisibleTo { get; set; }
    public int[] RequiredRoleIds { get; set; } = [];
    public bool OpenInNewTab { get; set; }
}

public class UpdateMenuItemDto : CreateMenuItemDto
{
    public int Id { get; set; }
}
