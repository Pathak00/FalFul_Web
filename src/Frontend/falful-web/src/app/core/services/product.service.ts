import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Category,
  Product,
  ProductSummary,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateProductRequest,
  UpdateProductRequest,
} from '../models/product.models';
import { ApiService } from './api.service';
import { SubscriptionProduct } from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) {}

  // ── Categories (public) ────────────────────────────────────────────────────
  getActiveCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/api/categories');
  }

  // ── Categories (admin) ─────────────────────────────────────────────────────
  getAllCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/api/categories/all');
  }

  createCategory(dto: CreateCategoryRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/categories', dto);
  }

  updateCategory(id: number, dto: UpdateCategoryRequest): Observable<void> {
    return this.api.put<void>(`/api/categories/${id}`, dto);
  }

  deleteCategory(id: number): Observable<void> {
    return this.api.delete<void>(`/api/categories/${id}`);
  }

  // ── Products (public) ──────────────────────────────────────────────────────
  getPublicProducts(
    categoryId?: number,
    search?: string,
    featured = false,
  ): Observable<ProductSummary[]> {
    let url = '/api/products';
    const params: string[] = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (featured) params.push(`featured=true`);
    if (params.length) url += '?' + params.join('&');
    return this.api.get<ProductSummary[]>(url);
  }

  getFeaturedProducts(): Observable<ProductSummary[]> {
    return this.api.get<ProductSummary[]>('/api/products/featured');
  }

  getSubscriptionProducts(): Observable<SubscriptionProduct[]> {
    return this.api.get<SubscriptionProduct[]>('/api/products/SubscriptionProduct');
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.api.get<Product>(`/api/products/${slug}`);
  }

  // ── Products (admin) ───────────────────────────────────────────────────────
  getAllProducts(categoryId?: number, search?: string): Observable<Product[]> {
    let url = '/api/products/all';
    const params: string[] = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += '?' + params.join('&');
    return this.api.get<Product[]>(url);
  }

  getProductById(id: number): Observable<Product> {
    return this.api.get<Product>(`/api/products/admin/${id}`);
  }

  createProduct(dto: CreateProductRequest): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('/api/products', dto);
  }

  updateProduct(id: number, dto: UpdateProductRequest): Observable<void> {
    return this.api.put<void>(`/api/products/${id}`, dto);
  }

  deleteProduct(id: number): Observable<void> {
    return this.api.delete<void>(`/api/products/${id}`);
  }

  setProductAvailability(id: number, isAvailable: boolean): Observable<void> {
    return this.api.post<void>(`/api/products/${id}/availability`, { isAvailable });
  }
}
