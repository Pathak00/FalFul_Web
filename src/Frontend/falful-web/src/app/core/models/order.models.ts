export type CartItemType = 'PRODUCT' | 'BUILD_BOWL';

export interface CartItem {
  itemType: CartItemType;
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
  bowlSignature?: string;
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

export interface DeliveryAttempt {
  id: number;
  attemptNumber: number;
  attemptedAt: string;
  riderName?: string;
  riderPhone?: string;
  wasSuccessful: boolean;
  failureReason?: number;
  failureReasonLabel?: string;
  failureNotes?: string;
  nextAction?: number;
  nextActionLabel?: string;
  rescheduledDate?: string;
  rescheduledTimeSlot?: string;
}

export interface DeliveryIssue {
  id: number;
  issueType: number;
  issueTypeLabel: string;
  reportedBy: number;
  reportedByLabel: string;
  description: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  isResolved: boolean;
}

export interface DeliveryStatus {
  id: number;
  status: number;
  statusLabel: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  riderName?: string;
  riderPhone?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  attemptCount: number;
  maxAttempts: number;
  trackingNotes?: string;
  attempts: DeliveryAttempt[];
}

export interface OrderRating {
  id: number;
  deliveryRating?: number;
  productQualityRating?: number;
  overallRating: number;
  comment?: string;
  createdAt: string;
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
  advanceAmount: number;
  paymentMethod: number;
  paymentStatus: number;
  deliveryDate: string;
  deliveryTimeSlot: string;
  fullAddress: string;
  city: string;
  itemCount: number;
  createdAt: string;
  deliveryStatus?: number;
  deliveryStatusLabel?: string;
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
  rating?: OrderRating;
}

export interface RiderUser {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
}

export interface DeliverySummary {
  id: number;
  orderId: number;
  orderNumber: string;
  status: number;
  statusLabel: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  riderUserId?: number;
  riderName?: string;
  riderPhone?: string;
  attemptCount: number;
  maxAttempts: number;
  customerName: string;
  city: string;
  fullAddress: string;
  deliveryPhone: string;
  totalAmount: number;
  advanceAmount: number;
  remainingBalance: number;
  collectedAmount?: number;
  proofPhotoUrl?: string;
  collectionRemarks?: string;
  createdAt: string;
  assignedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
}

export interface DeliveryDetail extends DeliverySummary {
  landmark?: string;
  orderNotes?: string;
  paymentMethod: number;
  pickedUpAt?: string;
  trackingNotes?: string;
  attempts: DeliveryAttempt[];
  issues: DeliveryIssue[];
}

export interface DeliveryReport {
  totalDeliveries: number;
  delivered: number;
  failed: number;
  inProgress: number;
  successRate: number;
  avgAttempts: number;
  avgRating?: number;
  failureBreakdown: { failureReason: number; failureReasonLabel: string; count: number }[];
  statusBreakdown:  { status: number; statusLabel: string; count: number }[];
}

export interface OrderReport {
  totalOrders: number;
  delivered: number;
  cancelled: number;
  active: number;
  totalRevenue: number;
  avgOrderValue: number;
  deliveredRevenue: number;
  statusBreakdown:  { status: number; statusLabel: string; count: number; revenue: number }[];
  paymentBreakdown: { paymentMethod: number; paymentMethodLabel: string; count: number; revenue: number }[];
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
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  items: PlaceOrderItemRequest[];
}

export interface CheckoutConfig {
  leadTimeHours: number;
  cutFruitLeadTimeHours: number;
  slotStartHour: number;
  slotEndHour: number;
  slotIntervalMinutes: number;
  storeLatitude: number;
  storeLongitude: number;
  cutFruitRadiusKm: number;
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
  7: { label: 'Awaiting Payment',     color: '#f97316' },
  1: { label: 'Pending',              color: '#f59e0b' },
  2: { label: 'Confirmed',            color: '#3b82f6' },
  3: { label: 'Preparing',            color: '#8b5cf6' },
  4: { label: 'Ready for Delivery',   color: '#06b6d4' },
  5: { label: 'Cancelled',            color: '#ef4444' },
  6: { label: 'Rejected',             color: '#dc2626' },
};

export const DELIVERY_STATUSES: Record<number, { label: string; color: string; icon: string }> = {
  1: { label: 'Awaiting Rider',       color: '#94a3b8', icon: 'bi-calendar-check'       },
  2: { label: 'Rider Assigned',       color: '#3b82f6', icon: 'bi-person-check'         },
  3: { label: 'Picked Up',            color: '#8b5cf6', icon: 'bi-box-seam'             },
  4: { label: 'Out for Delivery',     color: '#06b6d4', icon: 'bi-bicycle'              },
  5: { label: 'Delivered',            color: '#22c55e', icon: 'bi-house-check'          },
  6: { label: 'Delivery Failed',      color: '#f59e0b', icon: 'bi-exclamation-triangle' },
  7: { label: 'Customer Unavailable', color: '#fb923c', icon: 'bi-person-dash'          },
  8: { label: 'Rescheduled',          color: '#a78bfa', icon: 'bi-calendar-plus'        },
  9: { label: 'Returned',             color: '#ef4444', icon: 'bi-box-arrow-left'       },
};

export const DELIVERY_FAILURE_REASONS: Record<number, string> = {
  1:  'Customer Not Home',
  2:  'Wrong Address',
  3:  'Customer Refused',
  4:  'Payment Refused',
  5:  'Product Damaged',
  6:  'Weather Conditions',
  7:  'Vehicle Breakdown',
  8:  'Contact Not Reachable',
  9:  'Address Not Found',
  10: 'Other',
};

export const DELIVERY_ISSUE_TYPES: Record<number, string> = {
  1: 'Delivery Failed',
  2: 'Product Damaged',
  3: 'Wrong Item',
  4: 'Late Delivery',
  5: 'Rider Behavior',
  6: 'Payment Issue',
  7: 'Access Issue',
  8: 'Other',
};

export const PAYMENT_METHODS: Record<number, string> = {
  1: 'Cash on Delivery',
  2: 'eSewa',
  3: 'Khalti',
};

;
