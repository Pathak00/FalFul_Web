import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ReceiptTemplate, ReceiptTemplateSummary, ReceiptTemplateVersionSummary,
  CreateReceiptTemplateRequest, UpdateReceiptTemplateRequest,
  RenderedReceipt, LogPrintRequest, ReceiptPrintLog,
} from '../models/receipt.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  constructor(private api: ApiService) {}

  // ── Customer receipt ──────────────────────────────────────────────────────

  getReceipt(orderId: number, templateId?: number): Observable<RenderedReceipt> {
    const q = templateId != null ? `?templateId=${templateId}` : '';
    return this.api.get<RenderedReceipt>(`/api/orders/${orderId}/receipt${q}`);
  }

  logPrint(orderId: number, dto: LogPrintRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>(`/api/orders/${orderId}/receipt/log-print`, dto);
  }

  // ── Admin receipt render & logs ───────────────────────────────────────────

  adminGetReceipt(orderId: number, templateId?: number): Observable<RenderedReceipt> {
    const q = templateId != null ? `?templateId=${templateId}` : '';
    return this.api.get<RenderedReceipt>(`/api/admin/receipts/orders/${orderId}${q}`);
  }

  adminLogPrint(orderId: number, dto: LogPrintRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>(`/api/admin/receipts/orders/${orderId}/log-print`, dto);
  }

  getPrintLogs(orderId?: number, pageSize = 50, pageOffset = 0): Observable<ReceiptPrintLog[]> {
    const p = new URLSearchParams();
    if (orderId != null) p.set('orderId', String(orderId));
    p.set('pageSize',   String(pageSize));
    p.set('pageOffset', String(pageOffset));
    return this.api.get<ReceiptPrintLog[]>(`/api/admin/receipts/logs?${p}`);
  }

  // ── Template management ───────────────────────────────────────────────────

  getTemplates(): Observable<ReceiptTemplateSummary[]> {
    return this.api.get<ReceiptTemplateSummary[]>('/api/admin/receipts/templates');
  }

  getTemplateById(id: number): Observable<ReceiptTemplate> {
    return this.api.get<ReceiptTemplate>(`/api/admin/receipts/templates/${id}`);
  }

  createTemplate(dto: CreateReceiptTemplateRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/admin/receipts/templates', dto);
  }

  updateTemplate(id: number, dto: UpdateReceiptTemplateRequest): Observable<void> {
    return this.api.put<void>(`/api/admin/receipts/templates/${id}`, dto);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.api.delete<void>(`/api/admin/receipts/templates/${id}`);
  }

  // ── Version history ───────────────────────────────────────────────────────

  getVersions(templateId: number): Observable<ReceiptTemplateVersionSummary[]> {
    return this.api.get<ReceiptTemplateVersionSummary[]>(`/api/admin/receipts/templates/${templateId}/versions`);
  }

  restoreVersion(templateId: number, versionId: number): Observable<void> {
    return this.api.post<void>(`/api/admin/receipts/templates/${templateId}/versions/${versionId}/restore`, {});
  }
}
