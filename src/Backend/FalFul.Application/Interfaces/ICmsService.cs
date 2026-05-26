using FalFul.Application.DTOs.CMS;
using FalFul.Domain.Common;

namespace FalFul.Application.Interfaces;

public interface ICmsService
{
    /* Pages */
    Task<Result<int>> CreatePageAsync(CreatePageDto dto, int? adminId);
    Task<Result> UpdatePageAsync(UpdatePageDto dto, int? adminId);
    Task<Result> DeletePageAsync(int id, int? adminId);
    Task<IEnumerable<PageListItemDto>> GetAllPagesAsync();
    Task<Result<PageDetailDto>> GetPageByIdAsync(int id);
    Task<Result<PageDetailDto>> GetPageBySlugAsync(string slug, bool adminMode = false);

    /* Banners */
    Task<Result<int>> CreateBannerAsync(CreateBannerDto dto, int? adminId);
    Task<Result> UpdateBannerAsync(UpdateBannerDto dto, int? adminId);
    Task<Result> DeleteBannerAsync(int id, int? adminId);
    Task<IEnumerable<BannerDto>> GetAllBannersAsync();
    Task<IEnumerable<BannerDto>> GetActiveBannersAsync(string? position);

    /* Homepage Sections */
    Task<IEnumerable<HomepageSectionDto>> GetAllSectionsAsync();
    Task<IEnumerable<HomepageSectionDto>> GetVisibleSectionsAsync();
    Task<Result<int>> UpsertSectionAsync(UpsertSectionDto dto, int? adminId);
}
