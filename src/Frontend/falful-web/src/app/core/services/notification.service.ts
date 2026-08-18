import { Injectable, NgZone, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';

export interface Notification {
  id: number | string;
  title: string;
  message: string;
  createdAt: string | Date;
  isRead: boolean;
  type?: string;
  orderId?: number | string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private hubConnection!: signalR.HubConnection;
  private readonly baseUrl = environment.apiUrl;
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private notificationSubject = new Subject<Notification>();

  private connectionStateSubject = new BehaviorSubject<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected,
  );

  /**
   * Observable that components can subscribe to
   */
  notifications$: Observable<Notification> = this.notificationSubject.asObservable();

  /**
   * Observable for SignalR connection state
   */
  connectionState$ = this.connectionStateSubject.asObservable();

  /**
   * Prevent multiple start attempts
   */
  private starting = false;

  constructor(private zone: NgZone) {}

  /**
   * Start SignalR connection
   */
  async startConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.starting) {
      return;
    }

    this.starting = true;

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.baseUrl}/hubs/notifications`, {
          accessTokenFactory: () => {
            return this.authService.getAccessToken() ?? '';
          },
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.registerEvents();

      this.registerConnectionEvents();

      await this.hubConnection.start();

      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
    } catch (error) {
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
    } finally {
      this.starting = false;
    }
  }

  /**
   * Register events coming from backend
   */
  private registerEvents(): void {
    /**
     * Backend should call:
     *
     * Clients.All.SendAsync(
     *     "NewOrder",
     *     notification
     * );
     */
    this.hubConnection.on('NewOrder', (notification: Notification) => {
      this.emitNotification(notification);
    });

    /**
     * General notification event
     */
    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      this.emitNotification(notification);
    });

    /**
     * Alternative event name if your backend
     * sends "OrderNotification"
     */
    this.hubConnection.on('OrderNotification', (notification: Notification) => {
      this.emitNotification(notification);
    });
  }

  /**
   * Send notification to subscribers
   */
  private emitNotification(notification: Notification): void {
    this.zone.run(() => {
      /**
       * Make sure the notification has
       * sensible default values.
       */
      const normalizedNotification: Notification = {
        id: notification?.id ?? Date.now(),

        title: notification?.title ?? 'New Notification',

        message: notification?.message ?? 'You have a new notification.',

        createdAt: notification?.createdAt ?? new Date(),

        isRead: notification?.isRead ?? false,

        type: notification?.type,

        orderId: notification?.orderId,
      };

      this.notificationSubject.next(normalizedNotification);
    });
  }

  /**
   * Connection lifecycle events
   */
  private registerConnectionEvents(): void {
    this.hubConnection.onreconnecting((error) => {
      this.connectionStateSubject.next(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected((connectionId) => {
      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
    });

    this.hubConnection.onclose((error) => {
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
    });
  }

  /**
   * Stop SignalR connection
   */
  async stopConnection(): Promise<void> {
    if (!this.hubConnection) {
      return;
    }

    try {
      await this.hubConnection.stop();

      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
    } catch (error) {}
  }

  /**
   * Get JWT access token
   *
   * Change this according to where your
   * Angular application stores the JWT.
   */
  private getAccessToken(): string {
    /**
     * Example:
     *
     * sessionStorage.setItem('token', jwt);
     */

    return sessionStorage.getItem('token') ?? localStorage.getItem('token') ?? '';
  }

  /**
   * Check if SignalR is connected
   */
  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): signalR.HubConnectionState {
    return this.hubConnection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  MarkNotificationRead(dto: Notification): Observable<void> {
    return this.api.post<void>('/api/notification/read', dto);
  }
  getUserNotification(): Observable<Notification[]> {
    return this.api.get<Notification[]>('/api/notification/GetNotification');
  }
}
