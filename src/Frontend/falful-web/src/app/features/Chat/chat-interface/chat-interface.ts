import { Component, ElementRef, ViewChild, AfterViewChecked, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { CartService } from '../../../core/services/cart.service';
import { ChatCartItem, ChatManualCartItem, ChatMessage } from '../../../core/models/chat.models';
import { CartItem } from '../../../core/models/order.models';
import { ToastService } from '../../../core/services/toast.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-interface.html',
  styleUrl: './chat-interface.scss',
})
export class ChatInterface implements AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd?: ElementRef<HTMLDivElement>;

  private chat = inject(ChatService);
  private cart = inject(CartService);
  private toast = inject(ToastService);

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  draft = signal('');
  isSending = signal(false);

  private shouldScroll = false;

  toggleOpen(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen() && this.messages().length === 0) {
      this.messages.set([
        {
          role: 'assistant',
          content:
            "Hi! I'm FalFul's assistant. Ask me about our fruits, prices, or nutrition facts.",
        },
      ]);
    }
    if (this.isOpen()) this.shouldScroll = true;
  }

  close(): void {
    this.isOpen.set(false);
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.isSending()) return;

    this.messages.update((list) => [...list, { role: 'user', content: text }]);
    this.draft.set('');
    this.isSending.set(true);
    this.shouldScroll = true;

    this.dispatch(text);
  }

  // Sends the message; if the assistant's own tool-routing decided this turn needs the
  // cart but this attempt didn't carry it yet (requiresCart), resend once with the
  // customer's current cart snapshot (both chat-origin and manually-added lines) — the
  // browser's own cart state is the one source of truth here, nothing is pushed to or
  // cached by the backend outside of this call.
  private dispatch(text: string, chatCartItems?: ChatCartItem[], manualCartItems?: ChatManualCartItem[]): void {
    this.chat.sendMessage(text, chatCartItems, manualCartItems).subscribe({
      next: (res) => {
        if (res.requiresCart) {
          this.dispatch(text, this.buildChatCartSnapshot(), this.buildManualCartSnapshot());
          return;
        }
        const content = res.response?.trim()
          ? res.response
          : "Sorry, I couldn't generate a response for that — please try again.";
        this.messages.update((list) => [...list, { role: 'assistant', content }]);
        // The assistant's cart is authoritative for anything it touched this turn —
        // mirror it into the real shopping cart so checkout reflects what was ordered
        // in chat, not just what the chat bubble says.
        if (res.cartTouched && res.cart) {
          this.cart.syncChatItems(res.cart.items.map((item) => this.toCartItem(item)));
        }
        this.isSending.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.isSending.set(false);
        this.toast.error("Sorry, I couldn't send that. Please try again.");
      },
    });
  }

  // Inverse of toCartItem() — rebuilds the assistant-facing shape from whatever the
  // client currently has tagged as chat-origin (kept in sync each turn by syncChatItems).
  private buildChatCartSnapshot(): ChatCartItem[] {
    return this.cart
      .items()
      .filter((i) => i.source === 'chat')
      .map((i) => ({
        fruitName: i.productName,
        orderType: i.unit === 'kg' ? 'whole' : 'cut',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.totalPrice,
        productId: i.productId,
        productSlug: i.productSlug,
        imageUrl: i.imageUrl,
      }));
  }

  private buildManualCartSnapshot(): ChatManualCartItem[] {
    return this.cart
      .items()
      .filter((i) => i.source !== 'chat')
      .map((i) => ({
        productName: i.productName,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.totalPrice,
        productId: i.productId,
        productSlug: i.productSlug,
        imageUrl: i.imageUrl,
      }));
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  private toCartItem(item: ChatCartItem): CartItem {
    return {
      itemType: 'PRODUCT',
      productId: item.productId,
      productName: item.fruitName,
      productSlug: item.productSlug,
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      unit: item.orderType === 'whole' ? 'kg' : 'g',
      totalPrice: item.lineTotal,
      isCustomBuild: false,
      source: 'chat',
    };
  }

  left = window.innerWidth - 380;
  top = 120;

  private dragging = false;
  private offsetX = 0;
  private offsetY = 0;

  startDrag(event: MouseEvent) {
    event.preventDefault();

    this.dragging = true;
    this.offsetX = event.clientX - this.left;
    this.offsetY = event.clientY - this.top;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.dragging) return;

    this.left = Math.max(0, Math.min(window.innerWidth - 360, event.clientX - this.offsetX));

    this.top = Math.max(0, Math.min(window.innerHeight - 56, event.clientY - this.offsetY));
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.dragging = false;
  }
}
