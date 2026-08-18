import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SignalRService } from './core/services/signalr.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  constructor(private signalRService: SignalRService) {}

  ngOnInit() {
    this.signalRService.startConnection();
  }
}
