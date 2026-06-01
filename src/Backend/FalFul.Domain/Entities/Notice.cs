namespace FalFul.Domain.Entities;

public class Notice
{
    public int       Id         { get; set; }
    public string    Title      { get; set; } = string.Empty;
    public string    Message    { get; set; } = string.Empty;
    public byte      NoticeType { get; set; } // 1=Info 2=Warning 3=Success 4=Error
    public byte      Target     { get; set; } // 1=All 2=Customers 3=Organizations
    public DateOnly? StartDate  { get; set; }
    public DateOnly? EndDate    { get; set; }
    public bool      IsActive   { get; set; }
    public string?   ImageUrl   { get; set; }
    public DateTime  CreatedAt  { get; set; }
}
