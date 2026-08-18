export interface NotificationModel {
  id: number | string;
  title: string;
  message: string;
  createdAt: string | Date;
  isRead: boolean;
  type?: string;
  orderId?: number | string;
}
