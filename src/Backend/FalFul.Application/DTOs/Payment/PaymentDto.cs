namespace FalFul.Application.DTOs.Payment;

// ── Inbound ───────────────────────────────────────────────────────────────────

public class InitiatePaymentDto
{
    public byte   PaymentMethodId { get; set; }          // chosen method for full/balance
    public byte?  AdvanceMethodId { get; set; }          // online method for advance when COD chosen
    public string ReturnUrl       { get; set; } = string.Empty;
    public string FailureUrl      { get; set; } = string.Empty;
}

public class PaymentMethodUpdateDto
{
    public bool?   IsEnabled    { get; set; }
    public byte?   DisplayOrder { get; set; }
    public string? IconUrl      { get; set; }
    public string? Description  { get; set; }
}

public class PaymentSettingsDto
{
    public bool    AdvanceEnabled   { get; set; }
    public decimal AdvancePercent   { get; set; }
    public decimal MinAdvanceAmount { get; set; }
}

// ── Outbound ──────────────────────────────────────────────────────────────────

public class PaymentMethodDto
{
    public byte    Id           { get; set; }
    public string  Name         { get; set; } = string.Empty;
    public string  Code         { get; set; } = string.Empty;
    public bool    IsEnabled    { get; set; }
    public byte    DisplayOrder { get; set; }
    public string? IconUrl      { get; set; }
    public string? Description  { get; set; }
}

public class InitiatePaymentResultDto
{
    public bool    RequiresRedirect { get; set; }
    public string? RedirectUrl      { get; set; }
    public Dictionary<string, string>? FormFields { get; set; }
    public decimal? AdvanceAmount   { get; set; }
    public decimal? BalanceAmount   { get; set; }
    public string?  Message         { get; set; }
}

public class PaymentDto
{
    public int      Id                   { get; set; }
    public int      OrderId              { get; set; }
    public string?  OrderNumber          { get; set; }
    public string?  CustomerName         { get; set; }
    public byte     PaymentMethodId      { get; set; }
    public string?  PaymentMethodName    { get; set; }
    public string?  PaymentMethodCode    { get; set; }
    public byte     PaymentType          { get; set; }
    public string   PaymentTypeLabel     { get; set; } = string.Empty;
    public decimal  Amount               { get; set; }
    public byte     Status               { get; set; }
    public string   StatusLabel          { get; set; } = string.Empty;
    public string?  GatewayTransactionId { get; set; }
    public DateTime? PaidAt              { get; set; }
    public DateTime  CreatedAt           { get; set; }
}

public class PaymentReportDto
{
    public int     TotalTransactions { get; set; }
    public decimal TotalCollected    { get; set; }
    public decimal TotalPending      { get; set; }
    public decimal TotalRefunded     { get; set; }
    public decimal TotalAdvance      { get; set; }
    public decimal TotalBalance      { get; set; }
    public List<PaymentMethodBreakdownDto> MethodBreakdown { get; set; } = [];
    public List<PaymentStatusBreakdownDto> StatusBreakdown { get; set; } = [];
}

public class PaymentMethodBreakdownDto
{
    public byte    Id               { get; set; }
    public string  Name             { get; set; } = string.Empty;
    public string  Code             { get; set; } = string.Empty;
    public int     TransactionCount { get; set; }
    public decimal Collected        { get; set; }
    public decimal Pending          { get; set; }
}

public class PaymentStatusBreakdownDto
{
    public byte    Status { get; set; }
    public string  Label  { get; set; } = string.Empty;
    public int     Count  { get; set; }
    public decimal Total  { get; set; }
}

// Raw result from sp_Report_PaymentSummary (3 result sets mapped by repository)
public class PaymentReportData
{
    public int     TotalTransactions { get; set; }
    public decimal TotalCollected    { get; set; }
    public decimal TotalPending      { get; set; }
    public decimal TotalRefunded     { get; set; }
    public decimal TotalAdvance      { get; set; }
    public decimal TotalBalance      { get; set; }
    public List<PaymentMethodBreakdownDto> MethodBreakdown { get; set; } = [];
    public List<RawStatusBreakdown>        StatusBreakdown { get; set; } = [];
}

public class RawStatusBreakdown
{
    public byte    Status { get; set; }
    public int     Count  { get; set; }
    public decimal Total  { get; set; }
}
