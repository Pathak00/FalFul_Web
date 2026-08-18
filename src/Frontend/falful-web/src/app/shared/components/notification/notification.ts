import { CommonModule } from '@angular/common';

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { Notification, NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class NotificationComponent implements OnInit, OnDestroy {
  showNotifications = false;

  notifications: Notification[] = [];

  unreadCount = 0;

  private notificationSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    /**
     * Subscribe to SignalR notifications
     */
    this.notificationSubscription = this.notificationService.notifications$.subscribe(
      (notification) => {
        this.addNotification(notification);
      },
    );

    this.notificationService.getUserNotification().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.updateUnreadCount();
        // notifications.forEach((notification) => {
        //   this.addNotification(notification);
        // });
      },
      error: (error) => {},
    });

    /**
     * Start SignalR connection
     */
    await this.notificationService.startConnection();
  }

  /**
   * Add notification to list
   */
  addNotification(notification: Notification): void {
    notification.isRead = false;
    this.notifications.unshift(notification);
    this.updateUnreadCount();
  }

  /**
   * Open / close notification dropdown
   */
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.notification-wrapper')) {
      this.showNotifications = false;
    }
  }

  /**
   * Open notification
   */
  openNotification(notification: Notification): void {
    /**
     * Mark as read
     */
    // this.notificationService.MarkNotificationRead(notification);

    this.notificationService.MarkNotificationRead(notification).subscribe({
      next: (response) => {},
      error: (error) => {},
    });

    if (!notification.isRead) {
      notification.isRead = true;

      this.updateUnreadCount();
    }

    /**
     * If this is an order notification,
     * navigate to order details.
     */
    if (notification.type === 'order' && notification.orderId) {
      this.showNotifications = false;

      this.router.navigate(['/admin/orders', notification.orderId]);

      return;
    }

    this.showNotifications = false;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach((notification) => {
      notification.isRead = true;
    });

    this.updateUnreadCount();
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter((notification) => !notification.isRead).length;
  }

  /**
   * View all notifications
   */
  viewAllNotifications(): void {
    this.showNotifications = false;

    this.router.navigate(['/admin/notifications']);
  }

  /**
   * Remove notification
   */
  removeNotification(id: number | string): void {
    this.notifications = this.notifications.filter((notification) => notification.id !== id);

    this.updateUnreadCount();
  }

  /**
   * Clear notifications
   */
  clearNotifications(): void {
    this.notifications = [];

    this.unreadCount = 0;
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }
}
