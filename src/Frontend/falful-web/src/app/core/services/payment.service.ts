import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  PaymentDto, PaymentMethodDto, PaymentSettingsDto,
  PaymentMethodUpdateDto, PaymentReport,
  InitiatePaymentDto, InitiatePaymentResultDto,
} from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private api: ApiService) {}

  // ── Customer ──────────────────────────────────────────────────────────────────
  getEnabledMethods(): Observable<PaymentMethodDto[]> {
    return this.api.get<PaymentMethodDto[]>('/api/payments/methods');
  }

  initiatePayment(orderId: number, dto: InitiatePaymentDto): Observable<InitiatePaymentResultDto> {
    return this.api.post<InitiatePaymentResultDto>(`/api/payments/initiate/${orderId}`, dto);
  }

  getPaymentsByOrder(orderId: number): Observable<PaymentDto[]> {
    return this.api.get<PaymentDto[]>(`/api/payments/order/${orderId}`);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────────
  getAllPayments(methodId?: number, status?: number, fromDate?: string, toDate?: string): Observable<PaymentDto[]> {
    const p = new URLSearchParams();
    if (methodId != null) p.set('methodId',  String(methodId));
    if (status  != null) p.set('status',    String(status));
    if (fromDate)        p.set('fromDate',  fromDate);
    if (toDate)          p.set('toDate',    toDate);
    const q = p.toString() ? `?${p}` : '';
    return this.api.get<PaymentDto[]>(`/api/payments${q}`);
  }

  confirmCod(paymentId: number): Observable<void> {
    return this.api.post<void>(`/api/payments/${paymentId}/confirm-cod`, {});
  }

  getPaymentReport(fromDate?: string, toDate?: string): Observable<PaymentReport> {
    const p = new URLSearchParams();
    if (fromDate) p.set('fromDate', fromDate);
    if (toDate)   p.set('toDate',   toDate);
    const q = p.toString() ? `?${p}` : '';
    return this.api.get<PaymentReport>(`/api/payments/report${q}`);
  }

  getPaymentSettings(): Observable<PaymentSettingsDto> {
    return this.api.get<PaymentSettingsDto>('/api/payments/settings');
  }

  updatePaymentSettings(dto: PaymentSettingsDto): Observable<void> {
    return this.api.put<void>('/api/payments/settings', dto);
  }

  getAllMethods(): Observable<PaymentMethodDto[]> {
    return this.api.get<PaymentMethodDto[]>('/api/payments/methods/all');
  }

  updateMethod(id: number, dto: PaymentMethodUpdateDto): Observable<void> {
    return this.api.patch<void>(`/api/payments/methods/${id}`, dto);
  }
}
