namespace FalFul.Domain.Entities;

public class ReceiptPrintLog
{
    public int      Id                  { get; set; }
    public int      OrderId             { get; set; }
    public string   OrderNumber         { get; set; } = string.Empty;
    public int      PrintedByUserId     { get; set; }
    public string   PrintedByName       { get; set; } = string.Empty;
    public string   PrintedByRole       { get; set; } = string.Empty;
    public DateTime PrintedAt           { get; set; }
    public int?     TemplateId          { get; set; }
    public string?  TemplateName        { get; set; }
    public int?     TemplateVersionId   { get; set; }
}
