export interface ReceiptTemplateSummary {
  id: number;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface ReceiptTemplate extends ReceiptTemplateSummary {
  htmlContent: string;
  publishedByUserId?: number;
}

export interface ReceiptTemplateVersionSummary {
  id: number;
  templateId: number;
  versionNumber: number;
  label?: string;
  createdAt: string;
  createdByUserId?: number;
}

export interface CreateReceiptTemplateRequest {
  name: string;
  htmlContent: string;
  isDefault: boolean;
}

export interface UpdateReceiptTemplateRequest {
  name: string;
  htmlContent: string;
  isDefault: boolean;
  isActive: boolean;
  versionLabel?: string;
}

export interface RenderedReceipt {
  orderId: number;
  orderNumber: string;
  html: string;
  templateId: number;
}

export interface LogPrintRequest {
  role: string;
  templateId?: number;
  templateVersionId?: number;
}

export interface ReceiptPrintLog {
  id: number;
  orderId: number;
  orderNumber: string;
  printedByUserId: number;
  printedByName: string;
  printedByRole: string;
  printedAt: string;
  templateId?: number;
  templateName?: string;
  templateVersionId?: number;
}
