-- =============================================================================
-- Migration 032: Receipt Management System
--
-- Adds:
--   1. ReceiptTemplates         — HTML templates with {{placeholder}} variables
--   2. ReceiptTemplateVersions  — snapshot-on-save version history
--   3. ReceiptPrintLogs         — audit trail for every print action
--   4. OrderRatings.ReceiptAcknowledged / ReceiptAcknowledgedAt — optional
--      "I received the receipt" confirmation captured during rating submission
--   5. 'receipts' Permission row — gates receipt printing for staff/admin/rider
--   6. Receipt AppSettings      — static configurable text sections
--   7. AdminNavItems            — Receipt Templates + Receipt Logs sidebar entries
-- =============================================================================

BEGIN TRANSACTION;

-- ── 1. ReceiptTemplates ───────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ReceiptTemplates')
BEGIN
    CREATE TABLE ReceiptTemplates (
        Id              INT             IDENTITY(1,1) PRIMARY KEY,
        Name            NVARCHAR(100)   NOT NULL,
        HtmlContent     NVARCHAR(MAX)   NOT NULL,
        IsDefault       BIT             NOT NULL DEFAULT 0,
        IsActive        BIT             NOT NULL DEFAULT 1,
        CreatedAt       DATETIME2       NOT NULL DEFAULT (DATEADD(MINUTE, 345, GETUTCDATE())),
        UpdatedAt       DATETIME2       NULL,
        PublishedAt     DATETIME2       NULL,
        PublishedByUserId INT           NULL
    );
END

-- ── 2. ReceiptTemplateVersions ────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ReceiptTemplateVersions')
BEGIN
    CREATE TABLE ReceiptTemplateVersions (
        Id              INT             IDENTITY(1,1) PRIMARY KEY,
        TemplateId      INT             NOT NULL REFERENCES ReceiptTemplates(Id) ON DELETE CASCADE,
        VersionNumber   INT             NOT NULL,
        HtmlContent     NVARCHAR(MAX)   NOT NULL,
        Label           NVARCHAR(200)   NULL,      -- optional description, e.g. "Before footer redesign"
        CreatedAt       DATETIME2       NOT NULL DEFAULT (DATEADD(MINUTE, 345, GETUTCDATE())),
        CreatedByUserId INT             NULL
    );
END

-- ── 3. ReceiptPrintLogs ───────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ReceiptPrintLogs')
BEGIN
    CREATE TABLE ReceiptPrintLogs (
        Id                  INT         IDENTITY(1,1) PRIMARY KEY,
        OrderId             INT         NOT NULL,
        PrintedByUserId     INT         NOT NULL,
        PrintedByRole       NVARCHAR(50) NOT NULL,
        PrintedAt           DATETIME2   NOT NULL DEFAULT (DATEADD(MINUTE, 345, GETUTCDATE())),
        TemplateId          INT         NULL,
        TemplateVersionId   INT         NULL
    );
END

-- ── 4. OrderRatings acknowledgement columns ───────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'OrderRatings' AND COLUMN_NAME = 'ReceiptAcknowledged'
)
BEGIN
    ALTER TABLE OrderRatings ADD ReceiptAcknowledged BIT NOT NULL DEFAULT 0;
    ALTER TABLE OrderRatings ADD ReceiptAcknowledgedAt DATETIME2 NULL;
END

-- ── 5. receipts Permission ────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM Permissions WHERE Name = 'receipts')
BEGIN
    INSERT INTO Permissions (Name, DisplayName, Category, SortOrder)
    VALUES ('receipts', 'Print & View Receipts', 'Operations', 55);
END

-- Assign receipts permission to Admin and Staff roles by default
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT r.Id, p.Id
FROM Roles r
CROSS JOIN Permissions p
WHERE r.NormalizedName IN ('ADMIN', 'STAFF')
  AND p.Name = 'receipts'
  AND NOT EXISTS (
      SELECT 1 FROM RolePermissions rp
      WHERE rp.RoleId = r.Id AND rp.PermissionId = p.Id
  );

-- ── 6. Receipt AppSettings ────────────────────────────────────────────────────
MERGE AppSettings AS target
USING (VALUES
    ('receipt_company_name',    'FalFul Fresh Fruits'),
    ('receipt_company_address', '123 Farmers Market Road, Kathmandu'),
    ('receipt_company_phone',   '+977-1-4XXXXXX'),
    ('receipt_tax_id',          'PAN: XXXXXXXXX'),
    ('receipt_header_text',     'Thank you for choosing FalFul! We deliver farm-fresh fruits straight to your door.'),
    ('receipt_footer_text',     'This is your official delivery receipt. Please keep it for your records.'),
    ('receipt_terms_text',      'Goods once delivered cannot be returned unless damaged or incorrect. Please inspect your order at the time of delivery.'),
    ('receipt_thank_you_message', 'We appreciate your trust in FalFul. See you again soon!'),
    ('receipt_refund_policy',   'Refunds are processed within 3-5 business days for eligible orders. Contact support@falfulfresh.com for assistance.')
) AS src (SettingKey, Value)
ON target.SettingKey = src.SettingKey
WHEN NOT MATCHED THEN
    INSERT (SettingKey, Value, UpdatedAt)
    VALUES (src.SettingKey, src.Value, DATEADD(MINUTE, 345, GETUTCDATE()));

-- ── 7. Default receipt template seed ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM ReceiptTemplates WHERE IsDefault = 1)
BEGIN
    INSERT INTO ReceiptTemplates (Name, HtmlContent, IsDefault, IsActive, PublishedAt)
    VALUES (
        'Standard Receipt', N'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 0; padding: 0; }
    .receipt { max-width: 680px; margin: 0 auto; padding: 2rem; }
    .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .header h1 { margin: 0; font-size: 1.6rem; color: #16a34a; }
    .header p { margin: .25rem 0; font-size: .85rem; color: #555; }
    .section { margin-bottom: 1.25rem; }
    .section-title { font-weight: 700; font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: #16a34a; border-bottom: 1px solid #e2e8f0; padding-bottom: .25rem; margin-bottom: .5rem; }
    .row { display: flex; justify-content: space-between; padding: .2rem 0; }
    .row.bold { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0fdf4; text-align: left; padding: .4rem .5rem; font-size: .78rem; }
    td { padding: .35rem .5rem; border-bottom: 1px solid #f1f5f9; font-size: .82rem; }
    .total-row td { font-weight: 700; border-top: 2px solid #16a34a; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: .72rem; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-blue  { background: #dbeafe; color: #1d4ed8; }
    .badge-red   { background: #fee2e2; color: #b91c1c; }
    .footer { text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: .78rem; color: #64748b; }
    .terms { font-size: .75rem; color: #94a3b8; margin-top: .75rem; }
    @media print { .receipt { padding: 0; } }
  </style>
</head>
<body>
<div class="receipt">

  <div class="header">
    <h1>{{company_name}}</h1>
    <p>{{company_address}}</p>
    <p>{{company_phone}} &nbsp;|&nbsp; {{tax_id}}</p>
    <p style="margin-top:.75rem; font-style:italic; font-size:.8rem;">{{header_text}}</p>
  </div>

  <div class="section">
    <div class="section-title">Order Summary</div>
    <div class="row"><span>Order #</span><span><strong>{{order_number}}</strong></span></div>
    <div class="row"><span>Order Date</span><span>{{order_date}}</span></div>
    <div class="row"><span>Order Status</span><span><span class="badge badge-green">{{order_status}}</span></span></div>
    <div class="row"><span>Payment Method</span><span>{{payment_method}}</span></div>
    <div class="row"><span>Payment Status</span><span>{{payment_status}}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="row"><span>Name</span><span>{{customer_name}}</span></div>
    <div class="row"><span>Phone</span><span>{{customer_phone}}</span></div>
    <div class="row"><span>Email</span><span>{{customer_email}}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Delivery Information</div>
    <div class="row"><span>Address</span><span>{{delivery_address}}</span></div>
    <div class="row"><span>Delivery Date</span><span>{{delivery_date}}</span></div>
    <div class="row"><span>Time Slot</span><span>{{delivery_time_slot}}</span></div>
    <div class="row"><span>Delivery Status</span><span>{{delivery_status}}</span></div>
    {{#if rider_name}}<div class="row"><span>Rider</span><span>{{rider_name}}</span></div>{{/if}}
    {{#if delivered_at}}<div class="row"><span>Delivered At</span><span>{{delivered_at}}</span></div>{{/if}}
  </div>

  <div class="section">
    <div class="section-title">Items Ordered</div>
    <table>
      <thead>
        <tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr>
      </thead>
      <tbody>
        {{order_items_rows}}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Pricing Breakdown</div>
    <div class="row"><span>Subtotal</span><span>Rs. {{subtotal}}</span></div>
    <div class="row"><span>Delivery Fee</span><span>Rs. {{delivery_fee}}</span></div>
    {{#if service_fee}}<div class="row"><span>Service Fee</span><span>Rs. {{service_fee}}</span></div>{{/if}}
    {{#if discount_amount}}<div class="row"><span>Discount ({{discount_code}})</span><span style="color:#16a34a">-Rs. {{discount_amount}}</span></div>{{/if}}
    <div class="row bold" style="border-top:2px solid #e2e8f0; margin-top:.4rem; padding-top:.4rem;">
      <span>Total Amount</span><span>Rs. {{total_amount}}</span>
    </div>
    {{#if advance_amount}}<div class="row"><span>Advance Paid</span><span>Rs. {{advance_amount}}</span></div>{{/if}}
    {{#if balance_due}}<div class="row"><span>Balance Due</span><span>Rs. {{balance_due}}</span></div>{{/if}}
  </div>

  {{#if customer_notes}}
  <div class="section">
    <div class="section-title">Customer Notes</div>
    <p style="margin:0; color:#475569; font-size:.85rem;">{{customer_notes}}</p>
  </div>
  {{/if}}

  <div class="footer">
    <p><strong>{{thank_you_message}}</strong></p>
    <div class="terms">{{terms_text}}</div>
    <div class="terms" style="margin-top:.4rem;">{{refund_policy}}</div>
    <p style="margin-top:.75rem; font-size:.7rem; color:#cbd5e1;">{{footer_text}} &nbsp;·&nbsp; Printed: {{printed_at}}</p>
  </div>

</div>
</body>
</html>', 1, 1, DATEADD(MINUTE, 345, GETUTCDATE()));
END

-- ── 8. Admin nav items ─────────────────────────────────────────────────────────
-- Find the max DisplayOrder in the Operations group to insert after it
DECLARE @OpsMaxOrder INT;
SELECT @OpsMaxOrder = ISNULL(MAX(DisplayOrder), 60)
FROM AdminNavItems WHERE GroupLabel = 'Operations';

IF NOT EXISTS (SELECT 1 FROM AdminNavItems WHERE Route = '/admin/receipt-templates')
BEGIN
    INSERT INTO AdminNavItems (Label, Route, Icon, GroupLabel, DisplayOrder, IsVisible, RequiredPermission, IsSystem)
    VALUES ('Receipt Templates', '/admin/receipt-templates', 'bi-receipt', 'Operations', @OpsMaxOrder + 1, 1, 'receipts', 1);
END

IF NOT EXISTS (SELECT 1 FROM AdminNavItems WHERE Route = '/admin/receipt-logs')
BEGIN
    INSERT INTO AdminNavItems (Label, Route, Icon, GroupLabel, DisplayOrder, IsVisible, RequiredPermission, IsSystem)
    VALUES ('Receipt Logs', '/admin/receipt-logs', 'bi-printer', 'Operations', @OpsMaxOrder + 2, 1, 'receipts', 1);
END

COMMIT TRANSACTION;
