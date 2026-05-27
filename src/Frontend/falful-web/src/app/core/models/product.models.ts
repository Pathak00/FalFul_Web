export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductSummary {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  unit: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  tags?: string;
  displayOrder: number;
  minOrderGrams?: number;
  gramStep?: number;
  cutFruitPrice?: number;
}

export interface Product extends ProductSummary {
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  isActive: boolean;
}

export interface CreateProductRequest {
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  unit: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  tags?: string;
  displayOrder: number;
  minOrderGrams?: number;
  gramStep?: number;
  cutFruitPrice?: number;
}

export type UpdateProductRequest = CreateProductRequest;

export const PRODUCT_UNITS = ['KG', 'Piece', 'Box', 'Bowl', 'Pack'];
