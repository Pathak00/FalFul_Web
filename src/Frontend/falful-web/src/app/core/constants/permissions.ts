export const Perm = {
  // Administration
  System:      'system',
  Users:       'users',
  Reports:     'reports',
  Settings:    'settings',
  // Operations
  Orders:      'orders',
  Deliveries:  'deliveries',
  Payments:    'payments',
  Receipts:    'receipts',
  PriceConfig: 'price_config',
  // Catalog
  Categories:  'categories',
  Products:    'products',
  Discounts:   'discounts',
  // Content
  Menus:       'menus',
  Pages:       'pages',
  Banners:     'banners',
  Sections:    'sections',
  Notices:     'notices',
  // Customer portal
  Shop:        'shop',
} as const;

export type PermKey = typeof Perm[keyof typeof Perm];
