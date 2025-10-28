import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpRequest, HttpResponse, KeyValue } from '../models/request.model';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-request-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-builder.component.html',
  styleUrl: './request-builder.component.css'
})
export class RequestBuilderComponent {
  request: HttpRequest = {
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '', enabled: true }],
    body: '',
    params: [{ key: '', value: '', enabled: true }],
  };

  response: HttpResponse | null = null;
  loading = false;
  error: string | null = null;
  activeTab: 'params' | 'headers' | 'body' = 'params';
  responseTab: 'body' | 'headers' = 'body';

  httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  constructor(private apiService: ApiService) {}

  addKeyValue(type: 'headers' | 'params'): void {
    this.request[type]?.push({ key: '', value: '', enabled: true });
  }

  removeKeyValue(type: 'headers' | 'params', index: number): void {
    this.request[type]?.splice(index, 1);
  }

  async sendRequest(): Promise<void> {
    if (!this.request.url) {
      this.error = 'URL is required';
      return;
    }

    this.loading = true;
    this.error = null;
    this.response = null;

    this.apiService.sendRequest(this.request).subscribe({
      next: (response) => {
        this.response = response;
        this.loading = false;

        // Save to history
        const headers = this.keyValueArrayToObject(this.request.headers);
        const params = this.keyValueArrayToObject(this.request.params);

        this.apiService.addToHistory(
          {
            method: this.request.method,
            url: this.request.url,
            headers,
            body: this.request.body ? this.tryParseJSON(this.request.body) : undefined,
            params,
          },
          response
        ).subscribe();
      },
      error: (error) => {
        this.error = error.message || 'Request failed';
        this.loading = false;
      },
    });
  }

  getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    return 'text-red-600';
  }

  formatJSON(data: any): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  formatHeaders(headers: Record<string, any>): string {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  private keyValueArrayToObject(arr?: KeyValue[]): Record<string, string> {
    if (!arr) return {};
    return arr
      .filter(item => item.enabled && item.key)
      .reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
  }

  private tryParseJSON(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }
}
