export interface CartItem {
  productId?: number;
  productName: string;
  productSlug?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  totalPrice: number;
  isCustomBuild: boolean;
  customBuildDetails?: string;
}

export interface Address {
  id: number;
  userId: number;
  label: string;
  fullAddress: string;
  city: string;
  landmark?: string;
  phoneNumber: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressRequest {
  label: string;
  fullAddress: string;
  city: string;
  landmark?: string;
  phoneNumber: string;
  isDefault: boolean;
}

export interface PriceRule {
  id: number;
  ruleKey: string;
  ruleName: string;
  value: number;
  unit: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId?: number;
  productName: string;
  productSlug?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  totalPrice: number;
  isCustomBuild: boolean;
  customBuildDetails?: string;
}

export interface DeliveryStatus {
  id: number;
  status: number;
  statusLabel: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  deliveredAt?: string;
  riderName?: string;
  riderPhone?: string;
  trackingNotes?: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: number;
  statusLabel: string;
  subTotal: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  paymentMethod: number;
  paymentStatus: number;
  deliveryDate: string;
  deliveryTimeSlot: string;
  fullAddress: string;
  city: string;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  customerName: string;
  deliveryPhone: string;
  addressLabel?: string;
  landmark?: string;
  notes?: string;
  cancelReason?: string;
  updatedAt?: string;
  items: OrderItem[];
  delivery?: DeliveryStatus;
}

export interface PlaceOrderRequest {
  deliveryAddressId: number;
  fullAddress: string;
  city: string;
  deliveryPhone: string;
  addressLabel?: string;
  landmark?: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  paymentMethod: number;
  notes?: string;
  items: PlaceOrderItemRequest[];
}

export interface PlaceOrderItemRequest {
  productId?: number;
  productName: string;
  productSlug?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  totalPrice: number;
  isCustomBuild: boolean;
  customBuildDetails?: string;
}

export const ORDER_STATUSES: Record<number, { label: string; color: string }> = {
  1: { label: 'Pending',           color: '#f59e0b' },
  2: { label: 'Confirmed',         color: '#3b82f6' },
  3: { label: 'Processing',        color: '#8b5cf6' },
  4: { label: 'Out for Delivery',  color: '#06b6d4' },
  5: { label: 'Delivered',         color: '#22c55e' },
  6: { label: 'Cancelled',         color: '#ef4444' },
  7: { label: 'Refunded',          color: '#6b7280' },
};

export const PAYMENT_METHODS: Record<number, string> = {
  1: 'Cash on Delivery',
  2: 'eSewa',
  3: 'Khalti',
};

export const DELIVERY_TIME_SLOTS = [
  '9:00 AM – 12:00 PM',
  '12:00 PM – 3:00 PM',
  '3:00 PM – 6:00 PM',
  '6:00 PM – 9:00 PM',
];
