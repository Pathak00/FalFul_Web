namespace FalFul.Domain.Entities;

public class Product
{
    public int      Id               { get; set; }
    public int      CategoryId       { get; set; }
    public string   CategoryName     { get; set; } = string.Empty;
    public string   Name             { get; set; } = string.Empty;
    public string   Slug             { get; set; } = string.Empty;
    public string?  Description      { get; set; }
    public string?  ShortDescription { get; set; }
    public decimal  Price            { get; set; }
    public decimal? Mrp              { get; set; }
    public string   Unit             { get; set; } = "KG";
    public decimal  Stock            { get; set; }
    public bool     IsAvailable      { get; set; }
    public bool     IsFeatured       { get; set; }
    public string?  ImageUrl         { get; set; }
    public string?  Tags             { get; set; }
    public int      DisplayOrder     { get; set; }
    public int?     MinOrderGrams    { get; set; }
    public int?     GramStep         { get; set; }
    public decimal? CutFruitPrice    { get; set; }
    public bool     ShowInCatalog    { get; set; } = true;
    public DateTime CreatedAt        { get; set; }
    public DateTime? UpdatedAt       { get; set; }
}
