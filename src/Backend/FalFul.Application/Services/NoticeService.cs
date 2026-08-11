using FalFul.Application.DTOs.Notice;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;

namespace FalFul.Application.Services;

public class NoticeService(INoticeRepository notices) : INoticeService
{
    public async Task<IEnumerable<NoticeDto>> GetAllAsync()
        => (await notices.GetAllAsync()).Select(Map);

    public async Task<IEnumerable<NoticeDto>> GetActiveAsync(byte? userType = null)
        => (await notices.GetActiveAsync(userType)).Select(Map);

    public async Task<Result> CreateAsync(CreateNoticeDto dto)
    {
        var err = Validate(dto);
        if (err is not null) return Result.Failure(err);
        try
        {
            await notices.CreateAsync(new Notice
            {
                Title      = dto.Title.Trim(),
                Message    = dto.Message.Trim(),
                NoticeType = dto.NoticeType,
                Target     = dto.Target,
                StartDate  = dto.StartDate,
                EndDate    = dto.EndDate,
                IsActive   = dto.IsActive,
                ImageUrl   = dto.ImageUrl
            });
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> UpdateAsync(int id, UpdateNoticeDto dto)
    {
        var err = Validate(dto);
        if (err is not null) return Result.Failure(err);
        try
        {
            await notices.UpdateAsync(new Notice
            {
                Id         = id,
                Title      = dto.Title.Trim(),
                Message    = dto.Message.Trim(),
                NoticeType = dto.NoticeType,
                Target     = dto.Target,
                StartDate  = dto.StartDate,
                EndDate    = dto.EndDate,
                IsActive   = dto.IsActive,
                ImageUrl   = dto.ImageUrl
            });
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteAsync(int id)
    {
        try { await notices.DeleteAsync(id); return Result.Success(""); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    private static string? Validate(CreateNoticeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))   return "Title is required.";
        if (string.IsNullOrWhiteSpace(dto.Message)) return "Message is required.";
        if (dto.NoticeType < 1 || dto.NoticeType > 4) return "Invalid notice type.";
        if (dto.Target < 1 || dto.Target > 3)         return "Invalid target.";
        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.EndDate < dto.StartDate)
            return "End date must be after start date.";
        return null;
    }

    private static NoticeDto Map(Notice n) => new()
    {
        Id              = n.Id,
        Title           = n.Title,
        Message         = n.Message,
        NoticeType      = n.NoticeType,
        NoticeTypeLabel = n.NoticeType switch { 1 => "Info", 2 => "Warning", 3 => "Success", 4 => "Error", _ => "Info" },
        Target          = n.Target,
        TargetLabel     = n.Target switch { 1 => "All Users", 2 => "Customers", 3 => "Organizations", _ => "All Users" },
        StartDate       = n.StartDate,
        EndDate         = n.EndDate,
        IsActive        = n.IsActive,
        ImageUrl        = n.ImageUrl,
        CreatedAt       = n.CreatedAt
    };
}
