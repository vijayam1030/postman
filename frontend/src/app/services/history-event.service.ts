import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoryEventService {
  private historyUpdated = new Subject<void>();

  historyUpdated$ = this.historyUpdated.asObservable();

  notifyHistoryUpdated(): void {
    this.historyUpdated.next();
  }
}
