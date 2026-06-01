namespace FalFul.Application.DTOs.Notice;

public class NoticeDto
{
    public int       Id             { get; set; }
    public string    Title          { get; set; } = string.Empty;
    public string    Message        { get; set; } = string.Empty;
    public byte      NoticeType     { get; set; }
    public string    NoticeTypeLabel { get; set; } = string.Empty;
    public byte      Target         { get; set; }
    public string    TargetLabel    { get; set; } = string.Empty;
    public DateOnly? StartDate      { get; set; }
    public DateOnly? EndDate        { get; set; }
    public bool      IsActive       { get; set; }
    public string?   ImageUrl       { get; set; }
    public DateTime  CreatedAt      { get; set; }
}

public class CreateNoticeDto
{
    public string    Title      { get; set; } = string.Empty;
    public string    Message    { get; set; } = string.Empty;
    public byte      NoticeType { get; set; } = 1;
    public byte      Target     { get; set; } = 1;
    public DateOnly? StartDate  { get; set; }
    public DateOnly? EndDate    { get; set; }
    public bool      IsActive   { get; set; } = true;
    public string?   ImageUrl   { get; set; }
}

public class UpdateNoticeDto : CreateNoticeDto { }
