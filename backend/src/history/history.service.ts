import { Injectable } from '@nestjs/common';
import { RequestHistory } from './history.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HistoryService {
  private history: RequestHistory[] = [];

  addToHistory(
    request: any,
    response: any,
  ): RequestHistory {
    const historyItem: RequestHistory = {
      id: uuidv4(),
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      params: request.params,
      response: response,
      timestamp: new Date(),
    };

    this.history.unshift(historyItem);

    // Keep only last 100 requests
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    return historyItem;
  }

  getHistory(): RequestHistory[] {
    return this.history;
  }

  getHistoryById(id: string): RequestHistory | undefined {
    return this.history.find((item) => item.id === id);
  }

  deleteHistoryItem(id: string): boolean {
    const index = this.history.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.history.splice(index, 1);
      return true;
    }
    return false;
  }

  clearHistory(): void {
    this.history = [];
  }
}
