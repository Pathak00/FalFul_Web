-- ── Migration 028: Discounts & Notices ───────────────────────────────────────

-- Discounts table
-- DiscountType: 1=Percent, 2=Flat
CREATE TABLE Discounts (
    Id             INT           IDENTITY(1,1) PRIMARY KEY,
    Code           NVARCHAR(50)  NOT NULL,
    Description    NVARCHAR(200) NULL,
    DiscountType   TINYINT       NOT NULL DEFAULT 1,
    Value          DECIMAL(10,2) NOT NULL,
    MinOrderAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
    MaxUses        INT           NULL,          -- NULL = unlimited
    UsesCount      INT           NOT NULL DEFAULT 0,
    StartDate      DATE          NULL,
    EndDate        DATE          NULL,
    IsActive       BIT           NOT NULL DEFAULT 1,
    CreatedAt      DATETIME2     NOT NULL DEFAULT dbo.fn_NepalNow()
);
CREATE UNIQUE INDEX UX_Discounts_Code ON Discounts (Code);

-- Notices table
-- NoticeType: 1=Info, 2=Warning, 3=Success, 4=Error
-- Target:     1=All, 2=Customers, 3=Organizations
CREATE TABLE Notices (
    Id          INT            IDENTITY(1,1) PRIMARY KEY,
    Title       NVARCHAR(200)  NOT NULL,
    Message     NVARCHAR(1000) NOT NULL,
    NoticeType  TINYINT        NOT NULL DEFAULT 1,
    Target      TINYINT        NOT NULL DEFAULT 1,
    StartDate   DATE           NULL,
    EndDate     DATE           NULL,
    IsActive    BIT            NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2      NOT NULL DEFAULT dbo.fn_NepalNow()
);

-- Add discount tracking columns to Orders
ALTER TABLE Orders
    ADD DiscountCode   NVARCHAR(50)  NULL,
        DiscountAmount DECIMAL(10,2) NOT NULL DEFAULT 0;
