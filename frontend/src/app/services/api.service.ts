import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, RequestHistory, KeyValue } from '../models/request.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  sendRequest(request: HttpRequest): Observable<HttpResponse> {
    // Convert KeyValue arrays to objects
    const headers = this.keyValueArrayToObject(request.headers);
    const params = this.keyValueArrayToObject(request.params);

    const payload = {
      method: request.method,
      url: request.url,
      headers,
      body: request.body ? this.tryParseJSON(request.body) : undefined,
      params,
    };

    return this.http.post<HttpResponse>(`${this.baseUrl}/proxy/send`, payload);
  }

  getHistory(): Observable<RequestHistory[]> {
    return this.http.get<RequestHistory[]>(`${this.baseUrl}/history`);
  }

  addToHistory(request: any, response: any): Observable<RequestHistory> {
    return this.http.post<RequestHistory>(`${this.baseUrl}/history`, {
      request,
      response,
    });
  }

  deleteHistoryItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/history/${id}`);
  }

  clearHistory(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/history`);
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
