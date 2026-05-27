namespace FalFul.Domain.Entities;

public class PriceRule
{
    public int      Id        { get; set; }
    public string   RuleKey   { get; set; } = string.Empty;
    public string   RuleName  { get; set; } = string.Empty;
    public decimal  Value     { get; set; }
    public string   Unit      { get; set; } = "flat";
    public bool     IsActive  { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
