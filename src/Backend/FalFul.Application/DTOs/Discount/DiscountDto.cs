namespace FalFul.Application.DTOs.Discount;

public class DiscountDto
{
    public int      Id             { get; set; }
    public string   Code           { get; set; } = string.Empty;
    public string?  Description    { get; set; }
    public byte     DiscountType   { get; set; }
    public string   TypeLabel      { get; set; } = string.Empty;
    public decimal  Value          { get; set; }
    public decimal  MinOrderAmount { get; set; }
    public int?     MaxUses        { get; set; }
    public int      UsesCount      { get; set; }
    public DateOnly? StartDate     { get; set; }
    public DateOnly? EndDate       { get; set; }
    public bool     IsActive       { get; set; }
    public DateTime CreatedAt      { get; set; }
}

public class CreateDiscountDto
{
    public string   Code           { get; set; } = string.Empty;
    public string?  Description    { get; set; }
    public byte     DiscountType   { get; set; } = 1;
    public decimal  Value          { get; set; }
    public decimal  MinOrderAmount { get; set; }
    public int?     MaxUses        { get; set; }
    public DateOnly? StartDate     { get; set; }
    public DateOnly? EndDate       { get; set; }
    public bool     IsActive       { get; set; } = true;
}

public class UpdateDiscountDto : CreateDiscountDto { }

public class ValidateDiscountDto
{
    public string  Code        { get; set; } = string.Empty;
    public decimal OrderAmount { get; set; }
}

public class DiscountValidationResultDto
{
    public bool    IsValid        { get; set; }
    public decimal DiscountAmount { get; set; }
    public string  Message        { get; set; } = string.Empty;
}
