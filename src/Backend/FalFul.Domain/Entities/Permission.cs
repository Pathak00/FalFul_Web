namespace FalFul.Domain.Entities;

public class Permission
{
    public int     Id          { get; set; }
    public string  Name        { get; set; } = string.Empty;
    public string  DisplayName { get; set; } = string.Empty;
    public string  Category    { get; set; } = string.Empty;
    public int     SortOrder   { get; set; }
}
