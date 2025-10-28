import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { RequestHistory } from '../models/request.model';

@Component({
  selector: 'app-request-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-history.component.html',
  styleUrl: './request-history.component.css'
})
export class RequestHistoryComponent implements OnInit {
  @Output() requestSelected = new EventEmitter<RequestHistory>();

  history: RequestHistory[] = [];
  loading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.apiService.getHistory().subscribe({
      next: (history) => {
        this.history = history;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load history:', error);
        this.loading = false;
      },
    });
  }

  selectRequest(item: RequestHistory): void {
    this.requestSelected.emit(item);
  }

  deleteRequest(id: string, event: Event): void {
    event.stopPropagation();
    this.apiService.deleteHistoryItem(id).subscribe({
      next: () => {
        this.loadHistory();
      },
      error: (error) => {
        console.error('Failed to delete history item:', error);
      },
    });
  }

  clearAllHistory(): void {
    if (confirm('Are you sure you want to clear all history?')) {
      this.apiService.clearHistory().subscribe({
        next: () => {
          this.loadHistory();
        },
        error: (error) => {
          console.error('Failed to clear history:', error);
        },
      });
    }
  }

  getMethodColor(method: string): string {
    const colors: Record<string, string> = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      PATCH: 'bg-orange-100 text-orange-800',
      DELETE: 'bg-red-100 text-red-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  }

  getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    return 'text-red-600';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  refresh(): void {
    this.loadHistory();
  }
}
