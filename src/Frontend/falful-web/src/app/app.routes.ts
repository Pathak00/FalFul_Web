import { Routes } from '@angular/router';
import { anyPermGuard, authGuard, dynamicNavGuard, guestGuard, riderGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout';

export const routes: Routes = [

  /* ── /home: redirect authenticated users to their correct dashboard ──────── */
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home-redirect/home-redirect').then(m => m.HomeRedirectComponent)
  },

  /* ── Main (public) site ──────────────────────────────────────────────────── */
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'pages/:slug',
        loadComponent: () => import('./features/pages/page-view/page-view').then(m => m.PageViewComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/product-list/product-list').then(m => m.ProductListComponent)
      },
      {
        path: 'products/:slug',
        loadComponent: () => import('./features/products/product-detail/product-detail').then(m => m.ProductDetailComponent)
      },
      {
        path: 'build-your-bowl',
        loadComponent: () => import('./features/build-your-bowl/build-your-bowl').then(m => m.BuildYourBowlComponent)
      },
      {
        /* Everyone can browse checkout; auth + role enforced at "Place Order" by the API */
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout').then(m => m.CheckoutComponent)
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/order-list/order-list').then(m => m.OrderListComponent)
      },
      {
        path: 'orders/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/order-detail/order-detail').then(m => m.OrderDetailComponent)
      }
    ]
  },

  /* ── Admin panel ─────────────────────────────────────────────────────────── */
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, anyPermGuard],  // anyPermGuard now requires canEnterAdmin()
    children: [
      { path: 'roles',        canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/roles/admin-roles').then(m => m.AdminRolesComponent) },
      { path: 'menus',        canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/menus/admin-menus').then(m => m.AdminMenusComponent) },
      { path: 'pages',        canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/pages/admin-pages').then(m => m.AdminPagesComponent) },
      { path: 'banners',      canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/banners/admin-banners').then(m => m.AdminBannersComponent) },
      { path: 'sections',     canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/sections/admin-sections').then(m => m.AdminSectionsComponent) },
      { path: 'users',        canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/users/admin-users').then(m => m.AdminUsersComponent) },
      { path: 'categories',   canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/categories/admin-categories').then(m => m.AdminCategoriesComponent) },
      { path: 'products',     canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/products/admin-products').then(m => m.AdminProductsComponent) },
      { path: 'orders',       canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/orders/admin-orders').then(m => m.AdminOrdersComponent) },
      { path: 'deliveries',   canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/deliveries/admin-deliveries').then(m => m.AdminDeliveriesComponent) },
      { path: 'reports',      canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/reports/admin-reports').then(m => m.AdminReportsComponent) },
      { path: 'price-config', canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/price-config/admin-price-config').then(m => m.AdminPriceConfigComponent) },
      { path: 'settings',     canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/settings/admin-settings').then(m => m.AdminSettingsComponent) },
      { path: 'nav',          canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/nav/admin-nav').then(m => m.AdminNavComponent) },
      { path: '', loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then(m => m.AdminDashboardComponent) }
    ]
  },

  /* ── Rider portal ────────────────────────────────────────────────────────── */
  {
    path: 'rider',
    canActivate: [authGuard, riderGuard],
    loadComponent: () => import('./features/rider/rider-layout').then(m => m.RiderLayoutComponent),
    children: [
      { path: 'deliveries',   loadComponent: () => import('./features/rider/rider-deliveries').then(m => m.RiderDeliveriesComponent) },
      { path: 'orders',       canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/orders/admin-orders').then(m => m.AdminOrdersComponent) },
      { path: 'products',     canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/products/admin-products').then(m => m.AdminProductsComponent) },
      { path: 'categories',   canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/categories/admin-categories').then(m => m.AdminCategoriesComponent) },
      { path: 'reports',      canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/reports/admin-reports').then(m => m.AdminReportsComponent) },
      { path: 'users',        canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/users/admin-users').then(m => m.AdminUsersComponent) },
      { path: 'settings',     canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/settings/admin-settings').then(m => m.AdminSettingsComponent) },
      { path: 'price-config', canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/price-config/admin-price-config').then(m => m.AdminPriceConfigComponent) },
      { path: 'menus',        canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/menus/admin-menus').then(m => m.AdminMenusComponent) },
      { path: 'pages',        canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/pages/admin-pages').then(m => m.AdminPagesComponent) },
      { path: 'banners',      canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/banners/admin-banners').then(m => m.AdminBannersComponent) },
      { path: 'sections',     canActivate: [dynamicNavGuard], loadComponent: () => import('./features/admin/sections/admin-sections').then(m => m.AdminSectionsComponent) },
      { path: '', redirectTo: 'deliveries', pathMatch: 'full' }
    ]
  },

  /* ── Auth ────────────────────────────────────────────────────────────────── */
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: 'login',                 loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
      { path: 'register',              loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },
      { path: 'register-organization', loadComponent: () => import('./features/auth/register-organization/register-organization').then(m => m.RegisterOrganizationComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
