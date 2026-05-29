export const Perm = {
  System:      'system',
  Orders:      'orders',
  Deliveries:  'deliveries',
  Categories:  'categories',
  Products:    'products',
  Users:       'users',
  Reports:     'reports',
  Settings:    'settings',
  PriceConfig: 'price_config',
  Menus:       'menus',
  Pages:       'pages',
  Banners:     'banners',
  Sections:    'sections',
  Shop:        'shop',
} as const;

export type PermKey = typeof Perm[keyof typeof Perm];
