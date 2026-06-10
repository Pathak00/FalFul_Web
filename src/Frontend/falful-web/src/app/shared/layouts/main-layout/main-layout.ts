import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { FooterComponent } from '../../components/footer/footer';
import { CartSidebarComponent } from '../../components/cart-sidebar/cart-sidebar';
import { ToastComponent } from '../../components/toast/toast';
import { NoticesBannerComponent } from '../../components/notices-banner/notices-banner';
import { CursorComponent } from '../../components/cursor/cursor';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CartSidebarComponent, ToastComponent, NoticesBannerComponent, CursorComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  cartVisible = signal(false);
}
