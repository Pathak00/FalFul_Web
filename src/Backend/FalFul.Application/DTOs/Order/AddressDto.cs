namespace FalFul.Application.DTOs.Order;

public class AddressDto
{
    public int      Id          { get; set; }
    public int      UserId      { get; set; }
    public string   Label       { get; set; } = string.Empty;
    public string   FullAddress { get; set; } = string.Empty;
    public string   City        { get; set; } = string.Empty;
    public string?  Landmark    { get; set; }
    public string   PhoneNumber { get; set; } = string.Empty;
    public bool     IsDefault   { get; set; }
    public DateTime CreatedAt   { get; set; }
}

public class CreateAddressDto
{
    public string   Label       { get; set; } = "Home";
    public string   FullAddress { get; set; } = string.Empty;
    public string   City        { get; set; } = string.Empty;
    public string?  Landmark    { get; set; }
    public string   PhoneNumber { get; set; } = string.Empty;
    public bool     IsDefault   { get; set; }
}

public class UpdateAddressDto
{
    public string   Label       { get; set; } = "Home";
    public string   FullAddress { get; set; } = string.Empty;
    public string   City        { get; set; } = string.Empty;
    public string?  Landmark    { get; set; }
    public string   PhoneNumber { get; set; } = string.Empty;
    public bool     IsDefault   { get; set; }
}
