namespace FalFul.Domain.Entities;

public class Address
{
    public int      Id          { get; set; }
    public int      UserId      { get; set; }
    public string   Label       { get; set; } = "Home";
    public string   FullAddress { get; set; } = string.Empty;
    public string   City        { get; set; } = string.Empty;
    public string?  Landmark    { get; set; }
    public string   PhoneNumber { get; set; } = string.Empty;
    public bool     IsDefault   { get; set; }
    public DateTime CreatedAt   { get; set; }
}
