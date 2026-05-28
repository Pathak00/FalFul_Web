namespace FalFul.Domain.Entities;

public class AppSetting
{
    public int       Id         { get; set; }
    public string    SettingKey { get; set; } = string.Empty;
    public string    Value      { get; set; } = string.Empty;
    public DateTime  UpdatedAt  { get; set; }
}
