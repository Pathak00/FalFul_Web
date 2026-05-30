namespace FalFul.Application.DTOs;

public class RoleDto
{
    public int     Id          { get; set; }
    public string  Name        { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool    IsDefault   { get; set; }
    public string  PortalType  { get; set; } = "admin";
}
