import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Address, CreateAddressRequest, PriceRule,
  OrderSummary, OrderDetail, PlaceOrderRequest,
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

  // ── Admin ─────────────────────────────────────────────────────────────────────
  getAllOrders(status?: number): Observable<OrderSummary[]> {
    const params = status != null ? `?status=${status}` : '';
    return this.api.get<OrderSummary[]>(`/api/admin/orders${params}`);
  }

  adminGetOrderById(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/api/admin/orders/${id}`);
  }

  updateOrderStatus(id: number, status: number): Observable<void> {
    return this.api.put<void>(`/api/admin/orders/${id}/status`, { status });
  }

  getPriceRulesAdmin(): Observable<PriceRule[]> {
    return this.api.get<PriceRule[]>('/api/admin/price-rules');
  }

  upsertPriceRule(ruleKey: string, value: number, isActive: boolean): Observable<void> {
    return this.api.put<void>('/api/admin/price-rules', { ruleKey, value, isActive });
  }
}
