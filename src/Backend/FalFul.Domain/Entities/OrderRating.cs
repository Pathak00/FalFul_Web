namespace FalFul.Domain.Entities;

public class OrderRating
{
    public int      Id                   { get; set; }
    public int      OrderId              { get; set; }
    public int      UserId               { get; set; }
    public byte?    DeliveryRating       { get; set; }
    public byte?    ProductQualityRating { get; set; }
    public byte     OverallRating        { get; set; }
    public string?  Comment              { get; set; }
    public DateTime CreatedAt            { get; set; }
}
