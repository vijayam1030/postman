export interface RequestHistory {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, any>;
    data: any;
    responseTime: number;
    size: number;
  };
  timestamp: Date;
}
