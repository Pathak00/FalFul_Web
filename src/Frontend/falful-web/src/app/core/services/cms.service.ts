import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Banner, CreateBannerRequest, CreatePageRequest,
  HomepageSection, PageDetail, PageListItem,
  UpdateBannerRequest, UpdatePageRequest, UpsertSectionRequest
} from '../models/cms.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CmsService {
  constructor(private api: ApiService) {}

  /* Pages */
  getPages(): Observable<PageListItem[]> {
    return this.api.get<PageListItem[]>('/api/pages');
  }

  getPageById(id: number): Observable<PageDetail> {
    return this.api.get<PageDetail>(`/api/pages/${id}`);
  }

  getPageBySlug(slug: string): Observable<PageDetail> {
    return this.api.get<PageDetail>(`/api/pages/slug/${slug}`);
  }

  createPage(dto: CreatePageRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/pages', dto);
  }

  updatePage(dto: UpdatePageRequest): Observable<void> {
    return this.api.put<void>('/api/pages', dto);
  }

  deletePage(id: number): Observable<void> {
    return this.api.delete<void>(`/api/pages/${id}`);
  }

  /* Banners */
  getBanners(): Observable<Banner[]> {
    return this.api.get<Banner[]>('/api/banners');
  }

  getActiveBanners(position?: string): Observable<Banner[]> {
    const q = position ? `?position=${position}` : '';
    return this.api.get<Banner[]>(`/api/banners/active${q}`);
  }

  createBanner(dto: CreateBannerRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/banners', dto);
  }

  updateBanner(dto: UpdateBannerRequest): Observable<void> {
    return this.api.put<void>('/api/banners', dto);
  }

  deleteBanner(id: number): Observable<void> {
    return this.api.delete<void>(`/api/banners/${id}`);
  }

  /* Homepage Sections */
  getSections(): Observable<HomepageSection[]> {
    return this.api.get<HomepageSection[]>('/api/homepagesections');
  }

  getVisibleSections(): Observable<HomepageSection[]> {
    return this.api.get<HomepageSection[]>('/api/homepagesections/visible');
  }

  upsertSection(dto: UpsertSectionRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/homepagesections/upsert', dto);
  }
}
