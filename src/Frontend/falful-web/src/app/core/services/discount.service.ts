import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DiscountDto, CreateDiscountDto, DiscountValidationResult, NoticeDto, CreateNoticeDto } from '../models/discount.models';

@Injectable({ providedIn: 'root' })
export class DiscountService {
  constructor(private api: ApiService) {}

  // ── Discounts ──────────────────────────────────────────────────────────────
  validateCode(code: string, orderAmount: number): Observable<DiscountValidationResult> {
    return this.api.get<DiscountValidationResult>(
      `/api/discounts/validate?code=${encodeURIComponent(code)}&orderAmount=${orderAmount}`);
  }

  getAllDiscounts(): Observable<DiscountDto[]> {
    return this.api.get<DiscountDto[]>('/api/discounts');
  }

  createDiscount(dto: CreateDiscountDto): Observable<void> {
    return this.api.post<void>('/api/discounts', dto);
  }

  updateDiscount(id: number, dto: CreateDiscountDto): Observable<void> {
    return this.api.put<void>(`/api/discounts/${id}`, dto);
  }

  deleteDiscount(id: number): Observable<void> {
    return this.api.delete<void>(`/api/discounts/${id}`);
  }

  // ── Notices ────────────────────────────────────────────────────────────────
  getActiveNotices(): Observable<NoticeDto[]> {
    return this.api.get<NoticeDto[]>('/api/notices/active');
  }

  getAllNotices(): Observable<NoticeDto[]> {
    return this.api.get<NoticeDto[]>('/api/notices');
  }

  createNotice(dto: CreateNoticeDto): Observable<void> {
    return this.api.post<void>('/api/notices', dto);
  }

  updateNotice(id: number, dto: CreateNoticeDto): Observable<void> {
    return this.api.put<void>(`/api/notices/${id}`, dto);
  }

  deleteNotice(id: number): Observable<void> {
    return this.api.delete<void>(`/api/notices/${id}`);
  }

  // ── Shared upload ──────────────────────────────────────────────────────────
  uploadImage(file: File): Observable<{ url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.api.upload<{ url: string }>('/api/upload', fd);
  }
}
