namespace FalFul.Domain.Entities;

public class Discount
{
    public int      Id             { get; set; }
    public string   Code           { get; set; } = string.Empty;
    public string?  Description    { get; set; }
    public byte     DiscountType   { get; set; } // 1=Percent 2=Flat
    public decimal  Value          { get; set; }
    public decimal  MinOrderAmount { get; set; }
    public int?     MaxUses        { get; set; }
    public int      UsesCount      { get; set; }
    public DateOnly? StartDate     { get; set; }
    public DateOnly? EndDate       { get; set; }
    public bool     IsActive       { get; set; }
    public DateTime CreatedAt      { get; set; }
}
