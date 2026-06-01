export interface DiscountDto {
  id: number;
  code: string;
  description?: string;
  discountType: number;    // 1=Percent 2=Flat
  typeLabel: string;
  value: number;
  minOrderAmount: number;
  maxUses?: number;
  usesCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDiscountDto {
  code: string;
  description?: string;
  discountType: number;
  value: number;
  minOrderAmount: number;
  maxUses?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface DiscountValidationResult {
  isValid: boolean;
  discountAmount: number;
  message: string;
}

export interface NoticeDto {
  id: number;
  title: string;
  message: string;
  noticeType: number;       // 1=Info 2=Warning 3=Success 4=Error
  noticeTypeLabel: string;
  target: number;           // 1=All 2=Customers 3=Organizations
  targetLabel: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface CreateNoticeDto {
  title: string;
  message: string;
  noticeType: number;
  target: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  imageUrl?: string;
}
