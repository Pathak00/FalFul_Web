namespace FalFul.Application.DTOs.Order;

public class SubmitRatingDto
{
    public byte?   DeliveryRating          { get; set; }
    public byte?   ProductQualityRating    { get; set; }
    public byte    OverallRating           { get; set; }
    public string? Comment                 { get; set; }
    public bool    ReceiptAcknowledged     { get; set; }
}

public class OrderRatingResponseDto
{
    public int       Id                      { get; set; }
    public byte?     DeliveryRating          { get; set; }
    public byte?     ProductQualityRating    { get; set; }
    public byte      OverallRating           { get; set; }
    public string?   Comment                 { get; set; }
    public bool      ReceiptAcknowledged     { get; set; }
    public DateTime? ReceiptAcknowledgedAt   { get; set; }
    public DateTime  CreatedAt               { get; set; }
}
