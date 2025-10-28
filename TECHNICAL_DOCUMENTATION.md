# Technical Documentation - Deep Dive

This document provides detailed technical explanations of the codebase, including code walkthroughs, design decisions, and implementation details.

## Table of Contents
- [Backend Deep Dive](#backend-deep-dive)
- [Frontend Deep Dive](#frontend-deep-dive)
- [Communication Flow](#communication-flow)
- [Code Walkthroughs](#code-walkthroughs)
- [Design Decisions](#design-decisions)

---

## Backend Deep Dive

### NestJS Application Bootstrap

**File**: `backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend is running on: http://localhost:3000`);
}
bootstrap();
```

**Explanation**:
1. `NestFactory.create(AppModule)` - Creates the application instance
2. `enableCors()` - Configures Cross-Origin Resource Sharing
   - `origin: 'http://localhost:4200'` - Only allows requests from Angular dev server
   - `methods` - Allows all standard HTTP methods
   - `credentials: true` - Allows cookies and authentication headers
3. `listen(3000)` - Starts the HTTP server on port 3000

**Why CORS is needed**:
- Frontend (port 4200) and Backend (port 3000) are on different ports
- Browsers block cross-origin requests by default
- CORS configuration tells the browser to allow these requests

---

### Proxy Module Implementation

#### ProxyController

**File**: `backend/src/proxy/proxy.controller.ts`

```typescript
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
```

**Decorators Explained**:
- `@Controller('proxy')` - Defines the base route as `/proxy`
- `@Post('send')` - Creates a POST endpoint at `/proxy/send`
- `@Body()` - Extracts the request body and validates it

**Error Handling**:
- Wraps service call in try-catch
- Converts any error to HTTP exception
- Preserves error message and status code
- Falls back to 500 if status not available

---

#### ProxyService

**File**: `backend/src/proxy/proxy.service.ts`

```typescript
async forwardRequest(request: ProxyRequest): Promise<ProxyResponse> {
  const startTime = Date.now();

  try {
    // Build URL with query parameters
    let url = request.url;
    if (request.params && Object.keys(request.params).length > 0) {
      const queryString = new URLSearchParams(request.params).toString();
      url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }

    // Make HTTP request
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
    // Handle errors gracefully
    const endTime = Date.now();
    const responseTime = endTime - startTime;

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
```

**Key Implementation Details**:

1. **Query Parameter Handling**:
   ```typescript
   const queryString = new URLSearchParams(request.params).toString();
   url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
   ```
   - Uses URLSearchParams to properly encode parameters
   - Checks if URL already has query string
   - Appends with `?` or `&` accordingly

2. **Response Time Calculation**:
   ```typescript
   const startTime = Date.now();
   // ... make request ...
   const endTime = Date.now();
   const responseTime = endTime - startTime;
   ```
   - Records start time before request
   - Records end time after response
   - Calculates difference in milliseconds

3. **Response Size Calculation**:
   ```typescript
   const size = JSON.stringify(response.data).length;
   ```
   - Converts response data to JSON string
   - Counts characters to estimate size in bytes

4. **Status Code Handling**:
   ```typescript
   validateStatus: () => true
   ```
   - Normally Axios throws errors for 4xx and 5xx
   - This tells Axios to accept ALL status codes
   - Allows us to return error responses to the client

5. **Error Handling**:
   - Catches network errors, timeouts, etc.
   - Still returns a formatted response
   - Includes error message and details
   - Preserves response time even on error

---

### History Module Implementation

#### HistoryService

**File**: `backend/src/history/history.service.ts`

```typescript
@Injectable()
export class HistoryService {
  private history: RequestHistory[] = [];

  addToHistory(request: any, response: any): RequestHistory {
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
```

**Implementation Details**:

1. **In-Memory Storage**:
   ```typescript
   private history: RequestHistory[] = [];
   ```
   - Simple array to store history
   - Data persists during application lifetime
   - Lost when server restarts
   - Fast and simple for demo purposes

2. **UUID Generation**:
   ```typescript
   id: uuidv4()
   ```
   - Generates unique identifier
   - Uses UUID v4 (random)
   - Prevents ID collisions

3. **Newest First**:
   ```typescript
   this.history.unshift(historyItem);
   ```
   - `unshift()` adds to beginning of array
   - Newest requests appear first
   - Alternative: `push()` would add to end

4. **Size Limit**:
   ```typescript
   if (this.history.length > 100) {
     this.history = this.history.slice(0, 100);
   }
   ```
   - Keeps only 100 most recent requests
   - Prevents memory issues
   - `slice(0, 100)` keeps first 100 items

5. **Find by ID**:
   ```typescript
   return this.history.find((item) => item.id === id);
   ```
   - Uses array `find()` method
   - Returns first matching item
   - Returns `undefined` if not found

---

## Frontend Deep Dive

### Angular Application Bootstrap

**File**: `frontend/src/main.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

**Explanation**:
- `bootstrapApplication()` - Modern Angular standalone bootstrapping
- `App` - Root component (no NgModule needed)
- `appConfig` - Application configuration (providers, routes, etc.)

---

### App Configuration

**File**: `frontend/src/app/app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

**Providers Explained**:

1. **provideBrowserGlobalErrorListeners()**:
   - Catches global errors
   - Logs errors to console
   - Helps debugging

2. **provideZoneChangeDetection({ eventCoalescing: true })**:
   - Enables Angular change detection
   - `eventCoalescing` - Optimizes performance
   - Batches multiple events together

3. **provideRouter(routes)**:
   - Sets up Angular routing
   - Currently no routes defined
   - Future: Add route navigation

4. **provideHttpClient()**:
   - Provides HttpClient service
   - Enables HTTP requests
   - Required for API calls

---

### API Service Implementation

**File**: `frontend/src/app/services/api.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  sendRequest(request: HttpRequest): Observable<HttpResponse> {
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
```

**Implementation Details**:

1. **Dependency Injection**:
   ```typescript
   @Injectable({
     providedIn: 'root'
   })
   ```
   - `providedIn: 'root'` - Creates singleton instance
   - Available throughout the application
   - No need to add to providers array

2. **Constructor Injection**:
   ```typescript
   constructor(private http: HttpClient) {}
   ```
   - Angular automatically injects HttpClient
   - `private` creates a class property
   - TypeScript shorthand syntax

3. **KeyValue to Object Conversion**:
   ```typescript
   return arr
     .filter(item => item.enabled && item.key)
     .reduce((acc, item) => {
       acc[item.key] = item.value;
       return acc;
     }, {} as Record<string, string>);
   ```
   - Filters only enabled items with keys
   - Reduces array to object
   - Example: `[{key: 'a', value: '1', enabled: true}]` → `{a: '1'}`

4. **Safe JSON Parsing**:
   ```typescript
   try {
     return JSON.parse(str);
   } catch {
     return str;
   }
   ```
   - Attempts to parse as JSON
   - Returns original string if parsing fails
   - Allows both JSON and plain text

5. **Observable Pattern**:
   ```typescript
   return this.http.post<HttpResponse>(...)
   ```
   - Returns RxJS Observable
   - Allows async handling with subscribe()
   - Supports operators (map, filter, etc.)

---

### History Event Service

**File**: `frontend/src/app/services/history-event.service.ts`

```typescript
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
```

**RxJS Patterns**:

1. **Subject**:
   ```typescript
   private historyUpdated = new Subject<void>();
   ```
   - Like an EventEmitter
   - Can emit values
   - Multiple subscribers possible

2. **Observable Exposure**:
   ```typescript
   historyUpdated$ = this.historyUpdated.asObservable();
   ```
   - Convention: `$` suffix for observables
   - Prevents external code from calling `next()`
   - Read-only for consumers

3. **Emit Event**:
   ```typescript
   this.historyUpdated.next();
   ```
   - Triggers all subscribers
   - No value passed (void)
   - Used as signal only

**Usage Pattern**:
```typescript
// Producer (RequestBuilderComponent)
this.historyEventService.notifyHistoryUpdated();

// Consumer (RequestHistoryComponent)
this.historyEventService.historyUpdated$.subscribe(() => {
  this.loadHistory();
});
```

---

### Request Builder Component

**File**: `frontend/src/app/components/request-builder.component.ts`

#### Component State

```typescript
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
}
```

**State Design**:
- `request` - Current request being built
- `response` - Last response received (null if none)
- `loading` - Shows loading spinner
- `error` - Error message to display
- `activeTab` - Which tab is active in request section
- `responseTab` - Which tab is active in response section
- `httpMethods` - Available HTTP methods

#### Send Request Method

```typescript
async sendRequest(): Promise<void> {
  // 1. Validation
  if (!this.request.url) {
    this.error = 'URL is required';
    return;
  }

  // 2. Set loading state
  this.loading = true;
  this.error = null;
  this.response = null;

  // 3. Call API service
  this.apiService.sendRequest(this.request).subscribe({
    next: (response) => {
      // 4. Handle success
      this.response = response;
      this.loading = false;

      // 5. Save to history
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
      ).subscribe({
        next: () => {
          // 6. Notify history component
          this.historyEventService.notifyHistoryUpdated();
        },
        error: (err) => {
          console.error('Failed to save to history:', err);
        }
      });
    },
    error: (error) => {
      // 7. Handle error
      this.error = error.message || 'Request failed';
      this.loading = false;
    },
  });
}
```

**Flow Explanation**:

1. **Validation** - Check if URL is provided
2. **Loading State** - Show loading spinner, clear errors
3. **API Call** - Send request through backend proxy
4. **Success Handler** - Display response, stop loading
5. **History Save** - Save request and response to backend
6. **Notify** - Tell history component to refresh
7. **Error Handler** - Display error message, stop loading

**Why Nested Subscribes?**:
- First subscribe: Wait for request to complete
- Second subscribe: Wait for history save to complete
- Could be refactored with RxJS operators (switchMap, tap)

#### Template Binding

**File**: `frontend/src/app/components/request-builder.component.html`

```html
<!-- Method and URL -->
<select [(ngModel)]="request.method">
  <option *ngFor="let method of httpMethods" [value]="method">
    {{ method }}
  </option>
</select>

<input
  type="text"
  [(ngModel)]="request.url"
  placeholder="Enter request URL">

<button
  (click)="sendRequest()"
  [disabled]="loading">
  {{ loading ? 'Sending...' : 'Send' }}
</button>
```

**Angular Directives**:

1. **[(ngModel)]** - Two-way data binding
   - Updates model when user types
   - Updates view when model changes
   - Requires FormsModule

2. ***ngFor** - Repeat elements
   ```html
   *ngFor="let method of httpMethods"
   ```
   - Loops through array
   - Creates option for each method

3. **[value]** - Property binding
   - Sets HTML attribute
   - One-way: component → template

4. **(click)** - Event binding
   - Listens for click event
   - Calls component method

5. **[disabled]** - Property binding
   - Disables button when loading
   - Boolean value

6. **{{ }}** - Interpolation
   - Displays component values
   - Ternary operator: `loading ? 'A' : 'B'`

---

### Request History Component

**File**: `frontend/src/app/components/request-history.component.ts`

#### Component Lifecycle

```typescript
export class RequestHistoryComponent implements OnInit, OnDestroy {
  private historySubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private historyEventService: HistoryEventService
  ) {}

  ngOnInit(): void {
    // Load initial history
    this.loadHistory();

    // Subscribe to updates
    this.historySubscription = this.historyEventService.historyUpdated$
      .subscribe(() => {
        this.loadHistory();
      });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.historySubscription?.unsubscribe();
  }
}
```

**Lifecycle Hooks**:

1. **ngOnInit()**:
   - Called after component initialization
   - Good place for data fetching
   - Sets up subscriptions

2. **ngOnDestroy()**:
   - Called before component destruction
   - Clean up subscriptions
   - Prevents memory leaks

**Memory Management**:
- Store subscription reference
- Unsubscribe in ngOnDestroy
- `?.unsubscribe()` - Safe navigation operator

#### Load History Method

```typescript
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
```

**Pattern**: Standard async loading
- Set loading flag
- Call API
- Handle success and error
- Clear loading flag in both cases

---

## Communication Flow

### Component Communication Diagram

```
┌─────────────────────────────────────────────────┐
│           RequestBuilderComponent               │
│                                                  │
│  User Action: Click "Send"                      │
│       │                                          │
│       ▼                                          │
│  sendRequest()                                  │
│       │                                          │
│       ├──────────────────┐                      │
│       │                  │                      │
│       ▼                  ▼                      │
│  ApiService.sendRequest()                       │
│       │                  │                      │
└───────┼──────────────────┼──────────────────────┘
        │                  │
        │                  │
        ▼                  ▼
   HTTP POST          (wait for response)
   to backend              │
        │                  │
        ▼                  │
   Response received       │
        │                  │
        └──────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│  ApiService.addToHistory()                      │
│       │                                          │
│       ▼                                          │
│  HTTP POST to /history                          │
│       │                                          │
│       ▼                                          │
│  History saved                                  │
│       │                                          │
│       ▼                                          │
│  HistoryEventService.notifyHistoryUpdated()    │
│       │                                          │
└───────┼──────────────────────────────────────────┘
        │
        │ Event Emission
        │
        ▼
┌─────────────────────────────────────────────────┐
│      RequestHistoryComponent                    │
│                                                  │
│  Subscribed to: historyUpdated$                 │
│       │                                          │
│       ▼                                          │
│  Event received                                 │
│       │                                          │
│       ▼                                          │
│  loadHistory()                                  │
│       │                                          │
│       ▼                                          │
│  ApiService.getHistory()                        │
│       │                                          │
│       ▼                                          │
│  Update UI with new history                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Design Decisions

### Why NestJS for Backend?

**Advantages**:
1. TypeScript native
2. Modular architecture
3. Dependency injection
4. Similar to Angular (easy to learn both)
5. Built-in features (validation, middleware, etc.)

**Alternative Considered**: Express.js
- NestJS provides better structure
- Easier to maintain as project grows

### Why Angular for Frontend?

**Advantages**:
1. TypeScript native
2. Comprehensive framework
3. Strong typing
4. Dependency injection
5. Good for large applications

**Alternative Considered**: React
- Angular provides more structure
- Better for complex applications

### Why In-Memory Storage?

**Reasoning**:
1. Simplicity for demo
2. No database setup required
3. Fast read/write operations
4. Sufficient for learning/demo purposes

**Production Alternative**: PostgreSQL or MongoDB
- Persistent storage
- Better for real applications
- More scalable

### Why Tailwind CSS?

**Advantages**:
1. Utility-first approach
2. Fast development
3. Small bundle size (with purging)
4. No custom CSS needed
5. Consistent design

**Alternative Considered**: Angular Material
- Tailwind provides more flexibility
- Easier to customize

### Why Standalone Components?

**Reasoning**:
1. Modern Angular approach
2. Simpler than NgModules
3. Better tree-shaking
4. Easier to understand
5. Future-proof

---

## Performance Considerations

### Backend Performance

1. **Axios Connection Pooling**:
   - Reuses HTTP connections
   - Faster subsequent requests
   - Automatic in Axios

2. **In-Memory Storage**:
   - Fast read/write (O(1) for most operations)
   - No database latency
   - Limited by RAM

3. **Async/Await**:
   - Non-blocking I/O
   - Handles concurrent requests
   - Efficient resource usage

### Frontend Performance

1. **Lazy Loading** (Future):
   - Load components on demand
   - Smaller initial bundle
   - Faster first load

2. **Change Detection**:
   - OnPush strategy possible
   - Event coalescing enabled
   - Efficient updates

3. **HTTP Caching** (Future):
   - Cache GET requests
   - Reduce server load
   - Faster responses

---

## Testing Strategy (Future Implementation)

### Backend Testing

1. **Unit Tests**:
   - Test services in isolation
   - Mock dependencies
   - Test error handling

2. **Integration Tests**:
   - Test controllers with services
   - Test HTTP endpoints
   - Test database operations

3. **E2E Tests**:
   - Test full request flow
   - Test API endpoints
   - Test error scenarios

### Frontend Testing

1. **Unit Tests**:
   - Test components
   - Test services
   - Mock HTTP requests

2. **Integration Tests**:
   - Test component interactions
   - Test form submissions
   - Test routing

3. **E2E Tests**:
   - Test user workflows
   - Test full application
   - Use Cypress or Playwright

---

## Security Best Practices (Production)

### Backend Security

1. **Input Validation**:
   ```typescript
   @IsUrl()
   @IsNotEmpty()
   url: string;
   ```

2. **Rate Limiting**:
   ```typescript
   @UseGuards(ThrottlerGuard)
   @Throttle(10, 60) // 10 requests per 60 seconds
   ```

3. **Helmet.js**:
   ```typescript
   app.use(helmet());
   ```

4. **CORS Restrictions**:
   ```typescript
   origin: process.env.FRONTEND_URL
   ```

### Frontend Security

1. **Sanitize Inputs**:
   - Use Angular's built-in sanitization
   - Prevent XSS attacks

2. **HTTPS Only**:
   - Encrypt communication
   - Prevent MITM attacks

3. **Content Security Policy**:
   - Restrict resource loading
   - Prevent XSS

---

## Conclusion

This application demonstrates modern web development practices with Angular and NestJS. It provides a solid foundation for building more complex API testing tools and can be extended with additional features as needed.

The modular architecture makes it easy to add new features without affecting existing code. The use of TypeScript throughout provides type safety and better developer experience.

---

**Document Version**: 1.0.0
**Last Updated**: October 28, 2025
