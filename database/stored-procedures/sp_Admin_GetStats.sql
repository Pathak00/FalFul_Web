USE FalFulDb;
GO
SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;
GO
CREATE OR ALTER PROCEDURE sp_Admin_GetStats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM Users           WHERE IsDeleted = 0)                           AS TotalUsers,
        (SELECT COUNT(*) FROM Users           WHERE IsDeleted = 0 AND IsActive = 1)          AS ActiveUsers,
        (SELECT COUNT(*) FROM Users           WHERE IsDeleted = 0 AND UserType = 3)          AS AdminUsers,
        (SELECT COUNT(*) FROM Pages           WHERE IsDeleted = 0)                           AS TotalPages,
        (SELECT COUNT(*) FROM Pages           WHERE IsDeleted = 0 AND IsPublished = 1)       AS PublishedPages,
        (SELECT COUNT(*) FROM Banners         WHERE IsDeleted = 0)                           AS TotalBanners,
        (SELECT COUNT(*) FROM Banners         WHERE IsDeleted = 0 AND IsActive = 1)          AS ActiveBanners,
        (SELECT COUNT(*) FROM HomepageSections WHERE IsVisible = 1)                          AS VisibleSections;
END
GO
