import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private readonly baseUrl = environment.apiUrl;
  private connection!: signalR.HubConnection;

  startConnection() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/notifications`)
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveNotification', (notification) => {});

    this.connection
      .start()
      .then(() => {})
      .catch((err) => {});
  }
}
