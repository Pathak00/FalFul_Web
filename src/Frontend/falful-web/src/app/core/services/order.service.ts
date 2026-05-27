import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Address, CreateAddressRequest, PriceRule,
  OrderSummary, OrderDetail, PlaceOrderRequest,
  DeliverySummary, DeliveryDetail, DeliveryReport, OrderReport, OrderRating,
} from '../models/order.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  // ── Addresses ────────────────────────────────────────────────────────────────
  getAddresses(): Observable<Address[]> {
    return this.api.get<Address[]>('/api/addresses');
  }

  createAddress(dto: CreateAddressRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/addresses', dto);
  }

  updateAddress(id: number, dto: CreateAddressRequest): Observable<void> {
    return this.api.put<void>(`/api/addresses/${id}`, dto);
  }

  deleteAddress(id: number): Observable<void> {
    return this.api.delete<void>(`/api/addresses/${id}`);
  }

  // ── Price Rules ───────────────────────────────────────────────────────────────
  getPriceRules(): Observable<PriceRule[]> {
    return this.api.get<PriceRule[]>('/api/orders/price-rules');
  }

  // ── Orders ────────────────────────────────────────────────────────────────────
  placeOrder(dto: PlaceOrderRequest): Observable<{ orderNumber: string }> {
    return this.api.post<{ orderNumber: string }>('/api/orders', dto);
  }

  getMyOrders(): Observable<OrderSummary[]> {
    return this.api.get<OrderSummary[]>('/api/orders');
  }

  getOrderById(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/api/orders/${id}`);
  }

  cancelOrder(id: number, cancelReason: string): Observable<void> {
    return this.api.post<void>(`/api/orders/${id}/cancel`, { cancelReason });
  }

  // ── Ratings ───────────────────────────────────────────────────────────────────
  getRating(orderId: number): Observable<OrderRating | null> {
    return this.api.get<OrderRating | null>(`/api/orders/${orderId}/rating`);
  }

  submitRating(orderId: number, dto: { deliveryRating?: number; productQualityRating?: number; overallRating: number; comment?: string }): Observable<void> {
    return this.api.post<void>(`/api/orders/${orderId}/rating`, dto);
  }

  // ── Admin Orders ──────────────────────────────────────────────────────────────
  getAllOrders(status?: number): Observable<OrderSummary[]> {
    const params = status != null ? `?status=${status}` : '';
    return this.api.get<OrderSummary[]>(`/api/admin/orders${params}`);
  }

  adminGetOrderById(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/api/admin/orders/${id}`);
  }

  updateOrderStatus(id: number, status: number, reason?: string): Observable<void> {
    return this.api.put<void>(`/api/admin/orders/${id}/status`, { status, reason });
  }

  getPriceRulesAdmin(): Observable<PriceRule[]> {
    return this.api.get<PriceRule[]>('/api/admin/price-rules');
  }

  upsertPriceRule(ruleKey: string, value: number, isActive: boolean): Observable<void> {
    return this.api.put<void>('/api/admin/price-rules', { ruleKey, value, isActive });
  }

  // ── Admin Deliveries ──────────────────────────────────────────────────────────
  getAllDeliveries(status?: number, from?: string, to?: string): Observable<DeliverySummary[]> {
    const p = new URLSearchParams();
    if (status != null) p.set('status', String(status));
    if (from) p.set('from', from);
    if (to)   p.set('to', to);
    const q = p.toString() ? `?${p}` : '';
    return this.api.get<DeliverySummary[]>(`/api/admin/deliveries${q}`);
  }

  getDeliveryById(id: number): Observable<DeliveryDetail> {
    return this.api.get<DeliveryDetail>(`/api/admin/deliveries/${id}`);
  }

  assignRider(id: number, riderName: string, riderPhone: string): Observable<void> {
    return this.api.put<void>(`/api/admin/deliveries/${id}/assign`, { riderName, riderPhone });
  }

  updateDeliveryStatus(id: number, status: number, trackingNotes?: string): Observable<void> {
    return this.api.put<void>(`/api/admin/deliveries/${id}/status`, { status, trackingNotes });
  }

  logDeliveryAttempt(id: number, dto: object): Observable<void> {
    return this.api.post<void>(`/api/admin/deliveries/${id}/attempts`, dto);
  }

  reportDeliveryIssue(id: number, dto: object): Observable<void> {
    return this.api.post<void>(`/api/admin/deliveries/${id}/issues`, dto);
  }

  resolveDeliveryIssue(issueId: number, resolutionNotes?: string): Observable<void> {
    return this.api.put<void>(`/api/admin/deliveries/issues/${issueId}/resolve`, { resolutionNotes });
  }

  // ── Admin Reports ─────────────────────────────────────────────────────────────
  getDeliveryReport(from?: string, to?: string): Observable<DeliveryReport> {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to)   p.set('to', to);
    const q = p.toString() ? `?${p}` : '';
    return this.api.get<DeliveryReport>(`/api/admin/reports/deliveries${q}`);
  }

  getOrderReport(from?: string, to?: string): Observable<OrderReport> {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to)   p.set('to', to);
    const q = p.toString() ? `?${p}` : '';
    return this.api.get<OrderReport>(`/api/admin/reports/orders${q}`);
  }
}
