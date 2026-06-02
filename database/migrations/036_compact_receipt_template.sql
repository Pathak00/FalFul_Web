-- =============================================================================
-- Migration 036: Compact Thermal-Style Receipt Template
--
-- Replaces the default A4 receipt with a compact mart/thermal receipt that
-- fits ~300 px wide, uses monospace font, and is optimised for both digital
-- viewing and thermal/receipt-style printing.
-- =============================================================================

BEGIN TRANSACTION;

UPDATE ReceiptTemplates
SET
    Name        = 'Compact Receipt',
    HtmlContent = N'<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; }
    .rcpt {
      font-family: ''Courier New'', Courier, monospace;
      font-size: 12px;
      color: #111;
      width: 300px;
      margin: 0 auto;
      padding: 14px 12px;
    }
    .center { text-align: center; }
    .co-name { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .co-info { font-size: 10px; color: #555; margin-top: 2px; line-height: 1.4; }
    .dashed { border: none; border-top: 1px dashed #999; margin: 7px 0; }
    .solid  { border: none; border-top: 2px solid #333; margin: 7px 0; }
    .double { border: none; border-top: 3px double #333; margin: 7px 0; }
    .lbl {
      font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .08em;
      color: #777; margin-bottom: 3px;
    }
    .kv { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; line-height: 1.4; }
    .kv .k { color: #555; flex-shrink: 0; margin-right: 6px; }
    .kv .v { font-weight: 600; text-align: right; word-break: break-word; }
    .addr { font-size: 11px; color: #333; margin: 2px 0; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items th {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .05em; color: #777;
      border-bottom: 1px dashed #bbb;
      padding: 3px 0; text-align: left;
    }
    table.items th:nth-child(2) { text-align: right; width: 52px; }
    table.items th:nth-child(3) { text-align: right; width: 48px; }
    table.items th:nth-child(4) { text-align: right; width: 52px; }
    table.items td {
      font-size: 11px; padding: 3px 0;
      border-bottom: 1px dotted #ddd;
      vertical-align: top;
    }
    table.items td:nth-child(2) { text-align: right; width: 52px; }
    table.items td:nth-child(3) { text-align: right; width: 48px; }
    table.items td:nth-child(4) { text-align: right; width: 52px; font-weight: 600; }
    table.items tr:last-child td { border-bottom: none; }
    .trow { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
    .trow.grand { font-size: 14px; font-weight: 700; margin: 4px 0; }
    .discount { color: #15803d; }
    .footer { text-align: center; margin-top: 6px; }
    .thanks { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
    .fine { font-size: 9px; color: #888; line-height: 1.5; }
    @media print {
      body { background: none; }
      .rcpt { width: 100%; padding: 2px; }
    }
  </style>
</head>
<body>
<div class="rcpt">

  <!-- Company header -->
  <div class="center">
    <div class="co-name">{{company_name}}</div>
    <div class="co-info">{{company_address}}</div>
    <div class="co-info">Tel: {{company_phone}}</div>
    {{#if tax_id}}<div class="co-info">{{tax_id}}</div>{{/if}}
  </div>

  <hr class="solid" />

  <!-- Receipt meta -->
  <div class="kv"><span class="k">Receipt #</span><span class="v">{{order_number}}</span></div>
  <div class="kv"><span class="k">Date</span><span class="v">{{order_date}}</span></div>
  <div class="kv"><span class="k">Payment</span><span class="v">{{payment_method}}</span></div>
  <div class="kv"><span class="k">Status</span><span class="v">{{payment_status}}</span></div>

  <hr class="dashed" />

  <!-- Customer -->
  <div class="lbl">Customer</div>
  <div class="kv"><span class="k">Name</span><span class="v">{{customer_name}}</span></div>
  <div class="kv"><span class="k">Phone</span><span class="v">{{customer_phone}}</span></div>

  <hr class="dashed" />

  <!-- Delivery -->
  <div class="lbl">Delivery</div>
  <div class="addr">{{delivery_address}}</div>
  <div class="kv"><span class="k">Date</span><span class="v">{{delivery_date}}{{#if delivery_time_slot}} &middot; {{delivery_time_slot}}{{/if}}</span></div>
  <div class="kv"><span class="k">Status</span><span class="v">{{delivery_status}}</span></div>
  {{#if rider_name}}<div class="kv"><span class="k">Rider</span><span class="v">{{rider_name}}</span></div>{{/if}}
  {{#if delivered_at}}<div class="kv"><span class="k">Delivered</span><span class="v">{{delivered_at}}</span></div>{{/if}}

  <hr class="dashed" />

  <!-- Items -->
  <div class="lbl">Items</div>
  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amt</th>
      </tr>
    </thead>
    <tbody>
      {{order_items_rows}}
    </tbody>
  </table>

  <hr class="dashed" />

  <!-- Totals -->
  <div class="trow"><span>Subtotal</span><span>Rs. {{subtotal}}</span></div>
  {{#if delivery_fee}}<div class="trow"><span>Delivery Fee</span><span>Rs. {{delivery_fee}}</span></div>{{/if}}
  {{#if service_fee}}<div class="trow"><span>Service Fee</span><span>Rs. {{service_fee}}</span></div>{{/if}}
  {{#if discount_amount}}<div class="trow discount"><span>Discount</span><span>-Rs. {{discount_amount}}</span></div>{{/if}}

  <hr class="solid" />

  <div class="trow grand"><span>TOTAL</span><span>Rs. {{total_amount}}</span></div>
  {{#if advance_amount}}<div class="trow"><span>Advance Paid</span><span>Rs. {{advance_amount}}</span></div>{{/if}}
  <div class="trow"><span>Collected</span><span>Rs. {{total_amount}}</span></div>

  <hr class="double" />

  <!-- Footer -->
  <div class="footer">
    <div class="thanks">{{thank_you_message}}</div>
    {{#if terms_text}}<div class="fine" style="margin-top:4px">{{terms_text}}</div>{{/if}}
    {{#if refund_policy}}<div class="fine" style="margin-top:3px">{{refund_policy}}</div>{{/if}}
    <div class="fine" style="margin-top:6px; color:#bbb">Printed: {{printed_at}}</div>
  </div>

</div>
</body>
</html>',
    UpdatedAt   = DATEADD(MINUTE, 345, GETUTCDATE()),
    PublishedAt = DATEADD(MINUTE, 345, GETUTCDATE())
WHERE IsDefault = 1;

COMMIT TRANSACTION;
