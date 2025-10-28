import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProxyRequest, ProxyResponse } from './proxy.controller';

@Injectable()
export class ProxyService {
  constructor(private readonly httpService: HttpService) {}

  async forwardRequest(request: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      // Add query parameters to URL if provided
      let url = request.url;
      if (request.params && Object.keys(request.params).length > 0) {
        const queryString = new URLSearchParams(request.params).toString();
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }

      const response = await firstValueFrom(
        this.httpService.request({
          method: request.method,
          url: url,
          headers: request.headers || {},
          data: request.body,
          validateStatus: () => true, // Accept all status codes
        }),
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Calculate response size
      const size = JSON.stringify(response.data).length;

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime,
        size,
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Return error response
      return {
        status: error.response?.status || 500,
        statusText: error.response?.statusText || 'Error',
        headers: error.response?.headers || {},
        data: {
          error: error.message,
          details: error.response?.data,
        },
        responseTime,
        size: 0,
      };
    }
  }
}
