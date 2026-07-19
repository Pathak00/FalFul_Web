import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatCartItem, ChatManualCartItem, ChatRequest, ChatResponse } from '../models/chat.models';
import { ApiService } from './api.service';

const SESSION_STORAGE_KEY = 'falful_chat_session_id';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private api: ApiService) {}

  getSessionId(): string {
    let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  }

  // chatCartItems/manualCartItems are only attached on the retry of a turn the assistant
  // already flagged as needing the cart (ChatResponse.requiresCart) — see chat-interface.ts.
  sendMessage(
    message: string,
    chatCartItems?: ChatCartItem[],
    manualCartItems?: ChatManualCartItem[],
    sessionId?: string,
  ): Observable<ChatResponse> {
    const dto: ChatRequest = {
      message,
      sessionId: sessionId ?? this.getSessionId(),
      chatCartItems,
      manualCartItems,
    };
    return this.api.post<ChatResponse>('/api/chat', dto);
  }
}
