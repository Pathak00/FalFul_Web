using FalFul.Application.DTOs.Notice;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface INoticeService
{
    Task<IEnumerable<NoticeDto>> GetAllAsync();
    Task<IEnumerable<NoticeDto>> GetActiveAsync(byte? userType = null);
    Task<Result>                 CreateAsync(CreateNoticeDto dto);
    Task<Result>                 UpdateAsync(int id, UpdateNoticeDto dto);
    Task<Result>                 DeleteAsync(int id);
}
