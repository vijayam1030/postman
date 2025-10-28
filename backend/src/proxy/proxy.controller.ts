import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ProxyService } from './proxy.service';

export interface ProxyRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, any>;
  data: any;
  responseTime: number;
  size: number;
}

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('send')
  async sendRequest(@Body() request: ProxyRequest): Promise<ProxyResponse> {
    try {
      return await this.proxyService.forwardRequest(request);
    } catch (error) {
      throw new HttpException(
        error.message || 'Request failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
