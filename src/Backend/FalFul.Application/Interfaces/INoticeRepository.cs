using FalFul.Domain.Entities;

namespace FalFul.Application.Interfaces;

public interface INoticeRepository
{
    Task<IEnumerable<Notice>> GetAllAsync();
    Task<IEnumerable<Notice>> GetActiveAsync(byte? userType = null);
    Task<int>                 CreateAsync(Notice n);
    Task                      UpdateAsync(Notice n);
    Task                      DeleteAsync(int id);
}
