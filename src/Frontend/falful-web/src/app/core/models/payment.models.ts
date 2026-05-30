export interface PaymentDto {
  id: number;
  orderId: number;
  orderNumber?: string;
  customerName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  paymentMethodCode?: string;
  paymentType: number;
  paymentTypeLabel?: string;
  amount: number;
  status: number;
  statusLabel?: string;
  gatewayTransactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentMethodDto {
  id: number;
  name: string;
  code: string;
  isEnabled: boolean;
  displayOrder: number;
  iconUrl?: string;
  description?: string;
}

export interface PaymentSettingsDto {
  advanceEnabled: boolean;
  advancePercent: number;
  minAdvanceAmount: number;
}

export interface PaymentMethodUpdateDto {
  isEnabled?: boolean;
  displayOrder?: number;
  iconUrl?: string;
  description?: string;
}

export interface PaymentReport {
  totalTransactions: number;
  totalCollected: number;
  totalPending: number;
  totalRefunded: number;
  totalAdvance: number;
  totalBalance: number;
  methodBreakdown: PaymentMethodBreakdown[];
  statusBreakdown: PaymentStatusBreakdown[];
}

export interface PaymentMethodBreakdown {
  name: string;
  code: string;
  count: number;
  total: number;
}

export interface PaymentStatusBreakdown {
  status: number;
  label: string;
  count: number;
  total: number;
}

export interface InitiatePaymentDto {
  paymentMethodId: number;
  advanceMethodId?: number;
  returnUrl: string;
  failureUrl: string;
}

export interface InitiatePaymentResultDto {
  requiresRedirect: boolean;
  redirectUrl?: string;
  formFields?: Record<string, string>;
  advanceAmount?: number;
  balanceAmount?: number;
  message?: string;
}
