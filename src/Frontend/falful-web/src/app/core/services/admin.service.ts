import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminResetPasswordRequest, AdminStats, AdminUser,
  SetUserActiveRequest, SetUserTypeRequest
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

  deleteUser(id: number): Observable<void> {
    return this.api.delete<void>(`/api/admin/users/${id}`);
  }
}
