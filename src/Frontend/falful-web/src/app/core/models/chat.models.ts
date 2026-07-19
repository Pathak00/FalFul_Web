export interface ChatRequest {
  message: string;
  sessionId?: string;
  chatCartItems?: ChatCartItem[];
  manualCartItems?: ChatManualCartItem[];
}

export type ChatOrderType = 'whole' | 'cut';

export interface ChatCartItem {
  productId?: number;
  fruitName: string;
  productSlug?: string;
  imageUrl?: string;
  orderType: ChatOrderType;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ChatCart {
  items: ChatCartItem[];
  grandTotal: number;
}

// The customer's live cart, supplied only when the assistant's own tool-routing decides
// a turn needs it (see ChatResponse.requiresCart) — the browser's own cart state is the
// one source of truth; nothing is pushed to or held by the backend outside of a single
// turn. Unit-agnostic (unlike ChatCartItem/ChatOrderType, which are tied to the chat
// ordering tools' whole-kg/cut-g pricing model).
export interface ChatManualCartItem {
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productId?: number;
  productSlug?: string;
  imageUrl?: string;
}

export interface ChatResponse {
  sessionId: string;
  response: string;
  cartTouched: boolean;
  // Non-null only when cartTouched is true — do not read as "cart is empty" otherwise.
  cart: ChatCart | null;
  // True when the assistant wanted to check/mutate the cart but this request didn't
  // carry chatCartItems/manualCartItems yet — resend the same message with both the
  // current chat-origin and manually-added cart snapshots attached.
  requiresCart: boolean;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}
