import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminCreateUserRequest, AdminNavItem, AdminResetPasswordRequest, AdminStats, AdminUser,
  SetUserActiveRequest, SetUserTypeRequest, UpdateAdminNavItemRequest
} from '../models/admin.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  getStats(): Observable<AdminStats> {
    return this.api.get<AdminStats>('/api/admin/stats');
  }

  getUsers(): Observable<AdminUser[]> {
    return this.api.get<AdminUser[]>('/api/admin/users');
  }

  setUserActive(dto: SetUserActiveRequest): Observable<void> {
    return this.api.post<void>('/api/admin/users/set-active', dto);
  }

  setUserType(dto: SetUserTypeRequest): Observable<void> {
    return this.api.post<void>('/api/admin/users/set-type', dto);
  }

  resetPassword(dto: AdminResetPasswordRequest): Observable<void> {
    return this.api.post<void>('/api/admin/users/reset-password', dto);
  }

  createUser(dto: AdminCreateUserRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/admin/users', dto);
  }


  deleteUser(id: number): Observable<void> {
    return this.api.delete<void>(`/api/admin/users/${id}`);
  }

  getRoles(): Observable<{ id: number; name: string; description?: string; isDefault: boolean }[]> {
    return this.api.get('/api/admin/roles');
  }

  createRole(name: string, description?: string): Observable<{ id: number; name: string }> {
    return this.api.post('/api/admin/roles', { name, description });
  }

  updateRole(id: number, name: string, description?: string): Observable<void> {
    return this.api.put<void>(`/api/admin/roles/${id}`, { name, description });
  }

  deleteRole(id: number): Observable<void> {
    return this.api.delete<void>(`/api/admin/roles/${id}`);
  }

  setDefaultRole(id: number): Observable<void> {
    return this.api.put<void>(`/api/admin/roles/${id}/default`, {});
  }

  getRolePermissions(roleId: number): Observable<{ id: number; name: string; displayName: string; category: string }[]> {
    return this.api.get(`/api/admin/roles/${roleId}/permissions`);
  }

  setRolePermissions(roleId: number, permissionIds: number[]): Observable<void> {
    return this.api.put<void>(`/api/admin/roles/${roleId}/permissions`, { permissionIds });
  }

  getUserRole(userId: number): Observable<{ id: number; name: string }> {
    return this.api.get(`/api/admin/users/${userId}/role`);
  }

  assignRole(userId: number, roleId: number): Observable<void> {
    return this.api.put<void>(`/api/admin/users/${userId}/role`, { roleId });
  }

  getPermissions(): Observable<{ id: number; name: string; displayName: string; category: string }[]> {
    return this.api.get('/api/admin/permissions');
  }

  getUserPermissions(userId: number): Observable<string[]> {
    return this.api.get(`/api/admin/users/${userId}/permissions`);
  }

  setUserPermissions(userId: number, permissions: string[]): Observable<void> {
    return this.api.put<void>(`/api/admin/users/${userId}/permissions`, { permissions });
  }

  /* ── Admin navigation items ──────────────────────────────────────────── */

  /** Returns sidebar items accessible to the current user. */
  getAdminNav(): Observable<AdminNavItem[]> {
    return this.api.get<AdminNavItem[]>('/api/admin/nav');
  }

  /** Returns ALL items — for the Navigation management screen (system only). */
  getAllAdminNav(): Observable<AdminNavItem[]> {
    return this.api.get<AdminNavItem[]>('/api/admin/nav/all');
  }

  updateAdminNavItem(id: number, dto: UpdateAdminNavItemRequest): Observable<void> {
    return this.api.put<void>(`/api/admin/nav/${id}`, dto);
  }
}
