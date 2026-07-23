import { Component, OnInit, Type, ViewChild, ViewContainerRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Dynamic feature host for the rider portal.
 *
 * The rider sidebar maps AdminNavItem routes (/admin/xxx → /rider/xxx). The router
 * matches /rider/:feature → this component. On init it looks up the feature name in
 * ADMIN_FEATURE_REGISTRY, lazily imports the corresponding admin component, and mounts
 * it using ViewContainerRef — no additional route definitions needed.
 *
 * To make a new admin page accessible in the rider portal:
 *   1. Add the new component to ADMIN_FEATURE_REGISTRY below (same lazy import as the
 *      admin route).
 *   2. Set the nav item's PortalScope to include 'rider' via /admin/nav.
 *
 * That's it — app.routes.ts never needs to be touched for rider route additions.
 */

type LazyLoader = () => Promise<Type<unknown>>;

const ADMIN_FEATURE_REGISTRY: Record<string, LazyLoader> = {
  orders:              () => import('../admin/orders/admin-orders').then(m => m.AdminOrdersComponent),
  products:            () => import('../admin/products/admin-products').then(m => m.AdminProductsComponent),
  categories:          () => import('../admin/categories/admin-categories').then(m => m.AdminCategoriesComponent),
  reports:             () => import('../admin/reports/admin-reports').then(m => m.AdminReportsComponent),
  payments:            () => import('../admin/payments/admin-payments').then(m => m.AdminPaymentsComponent),
  discounts:           () => import('../admin/discounts/admin-discounts').then(m => m.AdminDiscountsComponent),
  notices:             () => import('../admin/notices/admin-notices').then(m => m.AdminNoticesComponent),
  users:               () => import('../admin/users/admin-users').then(m => m.AdminUsersComponent),
  roles:               () => import('../admin/roles/admin-roles').then(m => m.AdminRolesComponent),
  settings:            () => import('../admin/settings/admin-settings').then(m => m.AdminSettingsComponent),
  'price-config':      () => import('../admin/price-config/admin-price-config').then(m => m.AdminPriceConfigComponent),
  menus:               () => import('../admin/menus/admin-menus').then(m => m.AdminMenusComponent),
  pages:               () => import('../admin/pages/admin-pages').then(m => m.AdminPagesComponent),
  banners:             () => import('../admin/banners/admin-banners').then(m => m.AdminBannersComponent),
  sections:            () => import('../admin/sections/admin-sections').then(m => m.AdminSectionsComponent),
  nav:                 () => import('../admin/nav/admin-nav').then(m => m.AdminNavComponent),
  'receipt-templates': () => import('../admin/receipts/admin-receipt-templates').then(m => m.AdminReceiptTemplatesComponent),
  'receipt-logs':      () => import('../admin/receipts/admin-receipt-logs').then(m => m.AdminReceiptLogsComponent),
};

@Component({
  selector: 'app-rider-feature-host',
  standalone: true,
  imports: [],
  templateUrl: './rider-feature-host.html'
})
export class RiderFeatureHostComponent implements OnInit {
  @ViewChild('host', { read: ViewContainerRef, static: true })
  private host!: ViewContainerRef;

  private route = inject(ActivatedRoute);

  readonly notFound = signal(false);

  async ngOnInit(): Promise<void> {
    const feature = this.route.snapshot.params['feature'] as string;
    const loader  = ADMIN_FEATURE_REGISTRY[feature];

    if (!loader) {
      this.notFound.set(true);
      return;
    }

    try {
      const componentType = await loader();
      this.host.clear();
      this.host.createComponent(componentType as Type<unknown>);
    } catch {
      this.notFound.set(true);
    }
  }
}
