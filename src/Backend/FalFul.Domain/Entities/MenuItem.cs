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
    // 0=Everyone 1=AnyLoggedIn 2=GuestOnly 3=Admin 4=Organisation 5=Individual
    public int VisibleTo { get; set; }
    public bool OpenInNewTab { get; set; }
}
