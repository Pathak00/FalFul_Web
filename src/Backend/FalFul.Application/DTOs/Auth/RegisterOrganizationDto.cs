namespace FalFul.Application.DTOs.Auth;

public class RegisterOrganizationDto
{
    public string OwnerFullName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string OrganizationType { get; set; } = string.Empty;
    public string? OrganizationDescription { get; set; }
    public string? Address { get; set; }
}
