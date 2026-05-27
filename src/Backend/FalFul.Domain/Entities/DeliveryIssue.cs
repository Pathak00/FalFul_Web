namespace FalFul.Domain.Entities;

public class DeliveryIssue
{
    public int       Id              { get; set; }
    public int       DeliveryId      { get; set; }
    public byte      IssueType       { get; set; }
    public byte      ReportedBy      { get; set; }
    public string    Description     { get; set; } = string.Empty;
    public DateTime  ReportedAt      { get; set; }
    public DateTime? ResolvedAt      { get; set; }
    public string?   ResolutionNotes { get; set; }
    public bool      IsResolved      { get; set; }
}
