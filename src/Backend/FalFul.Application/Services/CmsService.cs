using FalFul.Application.DTOs.CMS;
using FalFul.Application.Interfaces;
using FalFul.Domain.Common;
using FalFul.Domain.Entities;

namespace FalFul.Application.Services;

public class CmsService : ICmsService
{
    private readonly IPageRepository _pages;
    private readonly IBannerRepository _banners;
    private readonly IHomepageSectionRepository _sections;
    private readonly IMenuRepository _menus;

    public CmsService(IPageRepository pages, IBannerRepository banners, IHomepageSectionRepository sections, IMenuRepository menus)
    {
        _pages = pages;
        _banners = banners;
        _sections = sections;
        _menus = menus;
    }

    /* ---- Menu Items ---- */

    public async Task<IEnumerable<MenuItemDto>> GetAllMenuItemsAsync()
    {
        var items = await _menus.GetAllAsync();
        return items.Select(MapMenuDto);
    }

    public async Task<IEnumerable<MenuItemDto>> GetVisibleMenuItemsAsync(int? userId)
    {
        var items = await _menus.GetVisibleAsync(userId);
        return items.Select(MapMenuDto);
    }

    public async Task<Result<int>> CreateMenuItemAsync(CreateMenuItemDto dto, int? adminId)
    {
        try
        {
            var item = new MenuItem { ParentId = dto.ParentId, Label = dto.Label, Url = dto.Url, Icon = dto.Icon, DisplayOrder = dto.DisplayOrder, IsVisible = dto.IsVisible, VisibleTo = dto.VisibleTo, OpenInNewTab = dto.OpenInNewTab, RequiredPortalType = dto.RequiredPortalType };
            var id = await _menus.CreateAsync(item, adminId);
            await _menus.SetRolesAsync(id, dto.RequiredRoleIds);
            return Result<int>.Success(id, "");
        }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    public async Task<Result> UpdateMenuItemAsync(UpdateMenuItemDto dto, int? adminId)
    {
        try
        {
            var item = new MenuItem { Id = dto.Id, ParentId = dto.ParentId, Label = dto.Label, Url = dto.Url, Icon = dto.Icon, DisplayOrder = dto.DisplayOrder, IsVisible = dto.IsVisible, VisibleTo = dto.VisibleTo, OpenInNewTab = dto.OpenInNewTab, RequiredPortalType = dto.RequiredPortalType };
            await _menus.UpdateAsync(item, adminId);
            await _menus.SetRolesAsync(dto.Id, dto.RequiredRoleIds);
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteMenuItemAsync(int id, int? adminId)
    {
        try { 
             await _menus.DeleteAsync(id, adminId); 
            return Result.Success("Deleted Sucessfully"); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    private static MenuItemDto MapMenuDto(MenuItem m) => new()
    {
        Id = m.Id, ParentId = m.ParentId, Label = m.Label, Url = m.Url, Icon = m.Icon,
        DisplayOrder = m.DisplayOrder, IsVisible = m.IsVisible, VisibleTo = m.VisibleTo,
        RequiredRoleIds = string.IsNullOrEmpty(m.RequiredRoleIds)
            ? []
            : m.RequiredRoleIds.Split(',').Select(int.Parse).ToArray(),
        OpenInNewTab = m.OpenInNewTab,
        RequiredPortalType = m.RequiredPortalType
    };

    /* ---- Pages ---- */

    public async Task<Result<int>> CreatePageAsync(CreatePageDto dto, int? adminId)
    {
        try
        {
            var page = new Page
            {
                Title = dto.Title, Slug = dto.Slug, Content = dto.Content,
                MetaTitle = dto.MetaTitle, MetaDescription = dto.MetaDescription,
                IsPublished = dto.IsPublished
            };
            var id = await _pages.CreateAsync(page, adminId);
            return Result<int>.Success(id,"");
        }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    public async Task<Result> UpdatePageAsync(UpdatePageDto dto, int? adminId)
    {
        try
        {
            var page = new Page
            {
                Id = dto.Id, Title = dto.Title, Slug = dto.Slug, Content = dto.Content,
                MetaTitle = dto.MetaTitle, MetaDescription = dto.MetaDescription,
                IsPublished = dto.IsPublished
            };
            await _pages.UpdateAsync(page, adminId);
            return Result.Success("Updated sucessfully");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeletePageAsync(int id, int? adminId)
    {
        try { await _pages.DeleteAsync(id, adminId); return Result.Success(""); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<IEnumerable<PageListItemDto>> GetAllPagesAsync()
    {
        var pages = await _pages.GetAllAsync();
        return pages.Select(p => new PageListItemDto
        {
            Id = p.Id, Title = p.Title, Slug = p.Slug,
            IsPublished = p.IsPublished, CreatedAt = p.CreatedAt, UpdatedAt = p.UpdatedAt
        });
    }

    public async Task<Result<PageDetailDto>> GetPageByIdAsync(int id)
    {
        var p = await _pages.GetByIdAsync(id);
        if (p == null) return Result<PageDetailDto>.Failure("Page not found.");
        return Result<PageDetailDto>.Success(MapDetail(p),"");
    }

    public async Task<Result<PageDetailDto>> GetPageBySlugAsync(string slug, bool adminMode = false)
    {
        var p = await _pages.GetBySlugAsync(slug, adminMode);
        if (p == null) return Result<PageDetailDto>.Failure("Page not found.");
        return Result<PageDetailDto>.Success(MapDetail(p),"");
    }

    private static PageDetailDto MapDetail(Page p) => new()
    {
        Id = p.Id, Title = p.Title, Slug = p.Slug, Content = p.Content,
        MetaTitle = p.MetaTitle, MetaDescription = p.MetaDescription,
        IsPublished = p.IsPublished, CreatedAt = p.CreatedAt, UpdatedAt = p.UpdatedAt
    };

    /* ---- Banners ---- */

    public async Task<Result<int>> CreateBannerAsync(CreateBannerDto dto, int? adminId)
    {
        try
        {
            var banner = MapBannerFromCreate(dto);
            var id = await _banners.CreateAsync(banner, adminId);
            return Result<int>.Success(id, "");
        }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    public async Task<Result> UpdateBannerAsync(UpdateBannerDto dto, int? adminId)
    {
        try
        {
            var banner = MapBannerFromCreate(dto);
            banner.Id = dto.Id;
            await _banners.UpdateAsync(banner, adminId);
            return Result.Success("");
        }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<Result> DeleteBannerAsync(int id, int? adminId)
    {
        try { await _banners.DeleteAsync(id, adminId); return Result.Success(""); }
        catch (Exception ex) { return Result.Failure(ex.Message); }
    }

    public async Task<IEnumerable<BannerDto>> GetAllBannersAsync()
    {
        var banners = await _banners.GetAllAsync();
        return banners.Select(MapBannerDto);
    }

    public async Task<IEnumerable<BannerDto>> GetActiveBannersAsync(string? position)
    {
        var banners = await _banners.GetActiveAsync(position);
        return banners.Select(MapBannerDto);
    }

    private static Banner MapBannerFromCreate(CreateBannerDto dto) => new()
    {
        Title = dto.Title, Subtitle = dto.Subtitle, ButtonText = dto.ButtonText,
        ButtonLink = dto.ButtonLink, ImageUrl = dto.ImageUrl, Position = dto.Position,
        IsActive = dto.IsActive, DisplayOrder = dto.DisplayOrder,
        StartDate = dto.StartDate, EndDate = dto.EndDate
    };

    private static BannerDto MapBannerDto(Banner b) => new()
    {
        Id = b.Id, Title = b.Title, Subtitle = b.Subtitle, ButtonText = b.ButtonText,
        ButtonLink = b.ButtonLink, ImageUrl = b.ImageUrl, Position = b.Position,
        IsActive = b.IsActive, DisplayOrder = b.DisplayOrder,
        StartDate = b.StartDate, EndDate = b.EndDate
    };

    /* ---- Homepage Sections ---- */

    public async Task<IEnumerable<HomepageSectionDto>> GetAllSectionsAsync()
    {
        var sections = await _sections.GetAllAsync();
        return sections.Select(MapSectionDto);
    }

    public async Task<IEnumerable<HomepageSectionDto>> GetVisibleSectionsAsync()
    {
        var sections = await _sections.GetVisibleAsync();
        return sections.Select(MapSectionDto);
    }

    public async Task<Result<int>> UpsertSectionAsync(UpsertSectionDto dto, int? adminId)
    {
        try
        {
            var section = new HomepageSection
            {
                SectionKey = dto.SectionKey, Title = dto.Title, Subtitle = dto.Subtitle,
                Content = dto.Content, IsVisible = dto.IsVisible, DisplayOrder = dto.DisplayOrder
            };
            var id = await _sections.UpsertAsync(section, adminId);
            return Result<int>.Success(id,"");
        }
        catch (Exception ex) { return Result<int>.Failure(ex.Message); }
    }

    private static HomepageSectionDto MapSectionDto(HomepageSection s) => new()
    {
        Id = s.Id, SectionKey = s.SectionKey, Title = s.Title, Subtitle = s.Subtitle,
        Content = s.Content, IsVisible = s.IsVisible, DisplayOrder = s.DisplayOrder
    };
}
