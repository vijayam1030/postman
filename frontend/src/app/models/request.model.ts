export interface HttpRequest {
  method: string;
  url: string;
  headers?: KeyValue[];
  body?: string;
  params?: KeyValue[];
}

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, any>;
  data: any;
  responseTime: number;
  size: number;
}

export interface RequestHistory {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  response?: HttpResponse;
  timestamp: Date;
}
