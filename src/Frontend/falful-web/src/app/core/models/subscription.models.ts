export interface CreateSubscriptionRequest {
  planId: number;
  quantity: number;
  startDate?: string; // ISO date string
  deliveryAddressId?: number;
  paymentMethodId?: string;
}

export interface SubscriptionProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  billingInterval: string;
  subsType?: string;
  createdAt?: string | Date; // APIs typically return dates as ISO strings
}

export type SubscriptionStatus = 'ACTIVE' | 'PENDING' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

export interface UserSubscription {
  id: number;
  userId: string;
  plan: string;
  plan_name: string;
  status: string;
  currentPeriodStart: string; // ISO string date
  currentPeriodEnd: string; // ISO string date
  nextBillingDate: string; // ISO string date
  autoRenew: boolean;
  createdAt: string;
}

export enum DialogAction {
  None,
  CreateSubscription,
  ChangePlan,
  LoginRequired,
  Success,
  CancelSubscription,
}
