import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout';

export const routes: Routes = [
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
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'menus',
        loadComponent: () => import('./features/admin/menus/admin-menus').then(m => m.AdminMenusComponent)
      },
      {
        path: 'pages',
        loadComponent: () => import('./features/admin/pages/admin-pages').then(m => m.AdminPagesComponent)
      },
      {
        path: 'banners',
        loadComponent: () => import('./features/admin/banners/admin-banners').then(m => m.AdminBannersComponent)
      },
      {
        path: 'sections',
        loadComponent: () => import('./features/admin/sections/admin-sections').then(m => m.AdminSectionsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/admin-users').then(m => m.AdminUsersComponent)
      },
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then(m => m.AdminDashboardComponent)
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
      },
      {
        path: 'register-organization',
        loadComponent: () => import('./features/auth/register-organization/register-organization').then(m => m.RegisterOrganizationComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
