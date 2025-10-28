# Postman Clone - Full Documentation

A modern HTTP client application built with Angular and NestJS, similar to Postman. This application allows users to send HTTP requests, view responses, and maintain a history of all requests.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Component Details](#component-details)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Features](#features)

---

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Angular Frontend (Port 4200)                  │ │
│  │                                                          │ │
│  │  ┌────────────────┐  ┌─────────────────┐              │ │
│  │  │   Request      │  │    Request      │              │ │
│  │  │   Builder      │  │    History      │              │ │
│  │  │   Component    │  │    Component    │              │ │
│  │  └────────┬───────┘  └────────┬────────┘              │ │
│  │           │                   │                         │ │
│  │           └───────┬───────────┘                         │ │
│  │                   │                                     │ │
│  │           ┌───────▼────────┐                           │ │
│  │           │   API Service   │                           │ │
│  │           └───────┬────────┘                           │ │
│  │                   │                                     │ │
│  │           ┌───────▼────────────┐                       │ │
│  │           │ History Event Svc  │                       │ │
│  │           └────────────────────┘                       │ │
│  └────────────────────┬───────────────────────────────────┘ │
└────────────────────────┼───────────────────────────────────┘
                         │ HTTP Requests
                         │
          ┌──────────────▼──────────────┐
          │    NestJS Backend API       │
          │      (Port 3000)            │
          │                             │
          │  ┌────────────────────────┐ │
          │  │    Proxy Module        │ │
          │  │  ┌──────────────────┐  │ │
          │  │  │ ProxyController  │  │ │
          │  │  └────────┬─────────┘  │ │
          │  │           │             │ │
          │  │  ┌────────▼─────────┐  │ │
          │  │  │  ProxyService    │  │ │
          │  │  │  (Axios)         │  │ │
          │  │  └──────────────────┘  │ │
          │  └────────────────────────┘ │
          │                             │
          │  ┌────────────────────────┐ │
          │  │   History Module       │ │
          │  │  ┌──────────────────┐  │ │
          │  │  │HistoryController │  │ │
          │  │  └────────┬─────────┘  │ │
          │  │           │             │ │
          │  │  ┌────────▼─────────┐  │ │
          │  │  │ HistoryService   │  │ │
          │  │  │ (In-Memory)      │  │ │
          │  │  └──────────────────┘  │ │
          │  └────────────────────────┘ │
          └─────────────┬───────────────┘
                        │
                        │ Forwarded HTTP Requests
                        │
              ┌─────────▼──────────┐
              │   External APIs    │
              │ (jsonplaceholder,  │
              │  github, etc.)     │
              └────────────────────┘
```

---

## Technology Stack

### Frontend
- **Angular 18+** - Modern web framework with standalone components
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v3** - Utility-first CSS framework
- **RxJS** - Reactive programming with observables
- **Angular HttpClient** - HTTP communication

### Backend
- **NestJS 10+** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Axios** - HTTP client for forwarding requests
- **Express** - Underlying HTTP server
- **UUID** - Unique ID generation

---

## Project Structure

```
newone/
├── backend/                      # NestJS Backend
│   ├── src/
│   │   ├── main.ts              # Application entry point
│   │   ├── app.module.ts        # Root module
│   │   ├── app.controller.ts    # Root controller
│   │   ├── app.service.ts       # Root service
│   │   ├── proxy/               # Proxy Module
│   │   │   ├── proxy.module.ts
│   │   │   ├── proxy.controller.ts
│   │   │   └── proxy.service.ts
│   │   └── history/             # History Module
│   │       ├── history.module.ts
│   │       ├── history.controller.ts
│   │       ├── history.service.ts
│   │       └── history.entity.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── frontend/                     # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/      # UI Components
│   │   │   │   ├── request-builder.component.ts
│   │   │   │   ├── request-builder.component.html
│   │   │   │   ├── request-builder.component.css
│   │   │   │   ├── request-history.component.ts
│   │   │   │   ├── request-history.component.html
│   │   │   │   └── request-history.component.css
│   │   │   ├── services/        # Business Logic
│   │   │   │   ├── api.service.ts
│   │   │   │   └── history-event.service.ts
│   │   │   ├── models/          # TypeScript Interfaces
│   │   │   │   └── request.model.ts
│   │   │   ├── app.ts           # Root component
│   │   │   ├── app.html         # Root template
│   │   │   ├── app.config.ts    # App configuration
│   │   │   └── app.routes.ts    # Routing
│   │   ├── styles.css           # Global styles
│   │   └── main.ts              # Bootstrap
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── package.json
│   ├── angular.json
│   └── tsconfig.json
│
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

---

## Backend Architecture

### Main Entry Point (`main.ts`)

```typescript
// Location: backend/src/main.ts
```

**Purpose**: Bootstraps the NestJS application

**Key Features**:
- Creates NestJS application instance
- Enables CORS for frontend communication
- Starts HTTP server on port 3000

**CORS Configuration**:
- Origin: `http://localhost:4200` (Angular dev server)
- Methods: All HTTP methods allowed
- Credentials: Enabled

---

### App Module (`app.module.ts`)

```typescript
// Location: backend/src/app.module.ts
```

**Purpose**: Root module that imports all feature modules

**Imports**:
- `ProxyModule` - Handles HTTP request forwarding
- `HistoryModule` - Manages request history

---

### Proxy Module

#### Architecture

```
ProxyModule
├── ProxyController (@Controller('proxy'))
│   └── POST /proxy/send
│       └── Forwards HTTP requests
└── ProxyService
    └── forwardRequest(request)
        ├── Adds query parameters
        ├── Forwards to external API
        ├── Calculates response time
        └── Returns formatted response
```

#### ProxyController (`proxy.controller.ts`)

**Endpoint**: `POST /proxy/send`

**Request Body**:
```typescript
{
  method: string;        // GET, POST, PUT, etc.
  url: string;          // Target URL
  headers?: object;     // Request headers
  body?: any;           // Request body
  params?: object;      // Query parameters
}
```

**Response**:
```typescript
{
  status: number;       // HTTP status code
  statusText: string;   // Status message
  headers: object;      // Response headers
  data: any;           // Response body
  responseTime: number; // Time in milliseconds
  size: number;        // Response size in bytes
}
```

**Error Handling**:
- Catches all errors
- Returns error details in response
- Includes error status and message

#### ProxyService (`proxy.service.ts`)

**Key Methods**:

1. **forwardRequest(request: ProxyRequest)**
   - Adds query parameters to URL
   - Uses Axios to make HTTP request
   - Calculates response time
   - Calculates response size
   - Handles all status codes (including errors)

**Implementation Details**:
- Uses `HttpService` from `@nestjs/axios`
- Converts Observable to Promise with `firstValueFrom`
- `validateStatus: () => true` - Accepts all status codes
- Returns formatted response even on error

---

### History Module

#### Architecture

```
HistoryModule
├── HistoryController (@Controller('history'))
│   ├── POST /history              # Save request
│   ├── GET /history               # Get all history
│   ├── GET /history/:id           # Get specific request
│   ├── DELETE /history/:id        # Delete one request
│   └── DELETE /history            # Clear all history
└── HistoryService
    ├── In-memory storage (Array)
    ├── Max 100 requests
    └── UUID for unique IDs
```

#### HistoryController (`history.controller.ts`)

**Endpoints**:

1. **POST /history** - Add to history
   - Body: `{ request, response }`
   - Returns: Created history item with ID

2. **GET /history** - Get all history
   - Returns: Array of history items (newest first)

3. **GET /history/:id** - Get by ID
   - Returns: Single history item

4. **DELETE /history/:id** - Delete one
   - Returns: 204 No Content

5. **DELETE /history** - Clear all
   - Returns: 204 No Content

#### HistoryService (`history.service.ts`)

**Storage**: In-memory array

**Key Methods**:

1. **addToHistory(request, response)**
   - Generates UUID
   - Adds timestamp
   - Inserts at beginning (newest first)
   - Keeps only last 100 items

2. **getHistory()**
   - Returns all history items

3. **getHistoryById(id)**
   - Finds by UUID

4. **deleteHistoryItem(id)**
   - Removes from array

5. **clearHistory()**
   - Empties array

**Data Structure**:
```typescript
{
  id: string;           // UUID
  method: string;       // HTTP method
  url: string;          // Request URL
  headers?: object;     // Request headers
  body?: any;          // Request body
  params?: object;      // Query params
  response?: {         // Response data
    status: number;
    statusText: string;
    headers: object;
    data: any;
    responseTime: number;
    size: number;
  };
  timestamp: Date;      // Creation time
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App (Root)
├── RequestBuilderComponent
│   ├── Method Selector
│   ├── URL Input
│   ├── Tabs (Params, Headers, Body)
│   │   ├── Query Parameters Editor
│   │   ├── Headers Editor
│   │   └── Body Editor
│   └── Response Viewer
│       ├── Status & Metrics
│       └── Tabs (Body, Headers)
└── RequestHistoryComponent
    ├── History List
    ├── Refresh Button
    └── Clear All Button
```

---

### Models (`request.model.ts`)

#### HttpRequest
```typescript
{
  method: string;           // HTTP method
  url: string;             // Target URL
  headers?: KeyValue[];    // Array of key-value pairs
  body?: string;           // Request body (JSON string)
  params?: KeyValue[];     // Query parameters
}
```

#### KeyValue
```typescript
{
  key: string;      // Parameter/header name
  value: string;    // Parameter/header value
  enabled: boolean; // Toggle on/off
}
```

#### HttpResponse
```typescript
{
  status: number;
  statusText: string;
  headers: Record<string, any>;
  data: any;
  responseTime: number;
  size: number;
}
```

#### RequestHistory
```typescript
{
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  response?: HttpResponse;
  timestamp: Date;
}
```

---

### Services

#### API Service (`api.service.ts`)

**Base URL**: `http://localhost:3000`

**Methods**:

1. **sendRequest(request: HttpRequest)**
   - Converts KeyValue arrays to objects
   - Parses JSON body
   - Sends to `/proxy/send`
   - Returns Observable<HttpResponse>

2. **getHistory()**
   - Fetches all history from `/history`
   - Returns Observable<RequestHistory[]>

3. **addToHistory(request, response)**
   - Saves to `/history`
   - Returns Observable<RequestHistory>

4. **deleteHistoryItem(id)**
   - Deletes from `/history/:id`
   - Returns Observable<void>

5. **clearHistory()**
   - Clears all at `/history`
   - Returns Observable<void>

**Helper Methods**:
- `keyValueArrayToObject()` - Converts enabled KeyValue items to object
- `tryParseJSON()` - Safely parses JSON strings

---

#### History Event Service (`history-event.service.ts`)

**Purpose**: Inter-component communication

**Implementation**:
```typescript
private historyUpdated = new Subject<void>();
historyUpdated$ = this.historyUpdated.asObservable();

notifyHistoryUpdated(): void {
  this.historyUpdated.next();
}
```

**Usage**:
- RequestBuilderComponent calls `notifyHistoryUpdated()` after saving
- RequestHistoryComponent subscribes to `historyUpdated$`
- Automatically refreshes history list

---

### Components

#### Request Builder Component

**File**: `request-builder.component.ts`

**Purpose**: Main interface for creating and sending HTTP requests

**State**:
```typescript
request: HttpRequest = {
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  body: '',
  params: [{ key: '', value: '', enabled: true }],
};
response: HttpResponse | null = null;
loading: boolean = false;
error: string | null = null;
activeTab: 'params' | 'headers' | 'body' = 'params';
responseTab: 'body' | 'headers' = 'body';
```

**Key Methods**:

1. **sendRequest()**
   - Validates URL
   - Shows loading state
   - Calls ApiService.sendRequest()
   - Saves to history
   - Notifies history component
   - Displays response

2. **addKeyValue(type)**
   - Adds new header or param row

3. **removeKeyValue(type, index)**
   - Removes header or param row

4. **getStatusColor(status)**
   - Returns CSS class based on status code

5. **formatJSON(data)**
   - Pretty-prints JSON

6. **formatHeaders(headers)**
   - Formats headers as key: value lines

**UI Features**:
- Method dropdown (GET, POST, PUT, etc.)
- URL input with validation
- Tabbed interface (Params, Headers, Body)
- Enable/disable toggles for params and headers
- Response viewer with tabs
- Status color coding
- Response time and size display

---

#### Request History Component

**File**: `request-history.component.ts`

**Purpose**: Display and manage request history

**State**:
```typescript
history: RequestHistory[] = [];
loading: boolean = false;
```

**Lifecycle**:
- `ngOnInit()` - Loads history and subscribes to updates
- `ngOnDestroy()` - Unsubscribes from updates

**Key Methods**:

1. **loadHistory()**
   - Fetches all history from API
   - Updates local state

2. **selectRequest(item)**
   - Emits event to parent (future: load request)

3. **deleteRequest(id, event)**
   - Stops event propagation
   - Deletes from API
   - Refreshes list

4. **clearAllHistory()**
   - Shows confirmation
   - Clears all history
   - Refreshes list

5. **refresh()**
   - Manually reloads history

6. **getMethodColor(method)**
   - Returns CSS class for method badge

7. **getStatusColor(status)**
   - Returns CSS class for status

8. **formatDate(date)**
   - Formats timestamp

**UI Features**:
- Scrollable history list
- Method badges with colors
- Status codes with colors
- Response time display
- Timestamp display
- Delete button per item
- Clear all button
- Refresh button

---

### App Component (`app.ts`)

**Purpose**: Root component that combines all features

**Template Layout**:
- Header with title
- Grid layout (3 columns)
  - Request Builder (2 columns)
  - Request History (1 column)

---

## Data Flow

### Sending a Request

```
┌──────────────────────────────────────────────────────────┐
│ 1. User fills form in RequestBuilderComponent           │
│    - Selects method                                      │
│    - Enters URL                                          │
│    - Adds headers/params/body                            │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 2. User clicks "Send" button                             │
│    - sendRequest() method called                         │
│    - Validates URL                                       │
│    - Sets loading = true                                 │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 3. ApiService.sendRequest()                              │
│    - Converts KeyValue arrays to objects                 │
│    - Parses JSON body                                    │
│    - HTTP POST to http://localhost:3000/proxy/send       │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Backend: ProxyController receives request            │
│    - Validates request                                   │
│    - Calls ProxyService.forwardRequest()                 │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 5. ProxyService forwards to external API                │
│    - Builds URL with query params                        │
│    - Makes HTTP request with Axios                       │
│    - Starts timer                                        │
│    - Waits for response                                  │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 6. External API responds                                 │
│    - ProxyService receives response                      │
│    - Calculates response time                            │
│    - Calculates response size                            │
│    - Returns formatted response                          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 7. RequestBuilderComponent receives response            │
│    - Sets response state                                 │
│    - Sets loading = false                                │
│    - Displays response in UI                             │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 8. ApiService.addToHistory()                             │
│    - Sends request & response to backend                 │
│    - HTTP POST to http://localhost:3000/history          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 9. Backend: HistoryController.addToHistory()            │
│    - HistoryService adds to in-memory array              │
│    - Generates UUID                                      │
│    - Adds timestamp                                      │
│    - Returns created item                                │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 10. HistoryEventService.notifyHistoryUpdated()          │
│     - Emits event via Subject                            │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 11. RequestHistoryComponent receives event              │
│     - Subscribes to historyUpdated$                      │
│     - Calls loadHistory()                                │
│     - Fetches updated history from backend               │
│     - Updates UI                                         │
└──────────────────────────────────────────────────────────┘
```

---

## API Documentation

### Backend API Endpoints

#### Proxy Endpoints

**POST /proxy/send**

Send an HTTP request through the proxy.

Request:
```json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer token",
    "Content-Type": "application/json"
  },
  "body": {
    "key": "value"
  },
  "params": {
    "page": "1",
    "limit": "10"
  }
}
```

Response:
```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "content-length": "1234"
  },
  "data": {
    "result": "data"
  },
  "responseTime": 456,
  "size": 1234
}
```

---

#### History Endpoints

**GET /history**

Get all request history (newest first).

Response:
```json
[
  {
    "id": "uuid-here",
    "method": "GET",
    "url": "https://api.example.com/data",
    "headers": {...},
    "params": {...},
    "body": {...},
    "response": {...},
    "timestamp": "2025-10-28T13:30:00.000Z"
  }
]
```

**POST /history**

Add a request to history.

Request:
```json
{
  "request": {
    "method": "GET",
    "url": "https://api.example.com/data",
    "headers": {...},
    "params": {...},
    "body": {...}
  },
  "response": {
    "status": 200,
    "statusText": "OK",
    "headers": {...},
    "data": {...},
    "responseTime": 456,
    "size": 1234
  }
}
```

**GET /history/:id**

Get a specific history item.

**DELETE /history/:id**

Delete a specific history item.

**DELETE /history**

Clear all history.

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git (optional)

### Installation

1. **Clone or navigate to the project directory**
```bash
cd newone
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Backend**:
```bash
cd backend
npm run start:dev
```
Backend runs on: `http://localhost:3000`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm start
```
Frontend runs on: `http://localhost:4200`

### Access the Application

Open your browser and navigate to: `http://localhost:4200`

---

## Features

### Current Features

1. **HTTP Request Builder**
   - Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
   - URL input with validation
   - Query parameters editor with enable/disable toggles
   - Headers editor with enable/disable toggles
   - Request body editor for JSON/text
   - Tabbed interface for better organization

2. **Response Viewer**
   - HTTP status code with color coding
   - Response time in milliseconds
   - Response size in bytes
   - Formatted JSON body view
   - Response headers view
   - Tabbed interface

3. **Request History**
   - Automatic saving of all requests
   - View last 100 requests
   - Display method, URL, status, time
   - Click to reload previous requests (logs to console)
   - Delete individual requests
   - Clear all history
   - Manual refresh button
   - Real-time updates when new requests are sent

4. **CORS Proxy**
   - Bypass CORS restrictions
   - Forward requests to any API
   - Preserve all headers and parameters
   - Handle all HTTP methods
   - Error handling and reporting

5. **Modern UI**
   - Responsive design with Tailwind CSS
   - Color-coded HTTP methods
   - Color-coded status codes
   - Clean and intuitive interface
   - Loading states
   - Error messages

---

## Technical Details

### Design Patterns Used

1. **Module Pattern** (Backend)
   - Separation of concerns with NestJS modules
   - ProxyModule, HistoryModule

2. **Service Pattern** (Frontend & Backend)
   - Business logic in services
   - Components focus on presentation

3. **Observer Pattern** (Frontend)
   - RxJS Observables for async operations
   - Subject for inter-component communication

4. **Dependency Injection**
   - NestJS DI container
   - Angular DI system

5. **Standalone Components** (Frontend)
   - Modern Angular approach
   - Self-contained components

### State Management

**Frontend**:
- Local component state
- Service-based shared state (HistoryEventService)
- RxJS for reactive updates

**Backend**:
- In-memory storage (array)
- Stateless request handling
- No database (for simplicity)

### Error Handling

**Frontend**:
- Try-catch blocks for JSON parsing
- HTTP error handling with observables
- User-friendly error messages
- Loading states

**Backend**:
- Global exception filter
- Try-catch in service methods
- Graceful error responses
- Status code preservation

### Security Considerations

**Current Implementation**:
- CORS restricted to `localhost:4200`
- No authentication (demo app)
- No rate limiting

**Recommendations for Production**:
- Add authentication (JWT)
- Implement rate limiting
- Add request validation
- Sanitize inputs
- Add HTTPS
- Restrict CORS to specific domains
- Add logging and monitoring

---

## Future Enhancements

### High Priority
1. **Load Request from History**
   - Click history item to load into builder
   - Pre-fill all fields

2. **Collections**
   - Group related requests
   - Save/load collections
   - Import/export collections

3. **Environment Variables**
   - Define variables ({{baseUrl}})
   - Switch between environments
   - Variable substitution

4. **Persistent Storage**
   - Add database (PostgreSQL/MongoDB)
   - Save history permanently
   - User accounts

### Medium Priority
1. **Request Authentication**
   - Bearer tokens
   - Basic auth
   - OAuth 2.0

2. **Response Features**
   - Syntax highlighting
   - Copy response button
   - Download response
   - View as HTML

3. **Advanced Request Features**
   - Form data support
   - File uploads
   - Multiple file selection
   - Pre-request scripts

### Low Priority
1. **Testing Features**
   - Test assertions
   - Test scripts
   - Collection runner

2. **Documentation**
   - Auto-generate API docs
   - Request descriptions
   - Markdown support

3. **Collaboration**
   - Share requests
   - Team workspaces
   - Comments

---

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules .angular
npm install
npm start
```

### Backend won't start
```bash
cd backend
rm -rf node_modules dist
npm install
npm run start:dev
```

### Port already in use
- Kill process on port 3000: `npx kill-port 3000`
- Kill process on port 4200: `npx kill-port 4200`

### CORS errors
- Check backend CORS settings in `backend/src/main.ts`
- Ensure frontend is running on `http://localhost:4200`

### History not updating
- Check browser console for errors
- Verify backend is running
- Check network tab in browser DevTools

---

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow Angular style guide
- Use NestJS best practices
- Write descriptive commit messages

### Git Workflow
```bash
git checkout -b feature/your-feature
git add .
git commit -m "Add: Your feature description"
git push origin feature/your-feature
```

---

## License

MIT License - Feel free to use and modify as needed.

---

## Contact & Support

For questions or issues, please create an issue in the repository.

---

## Acknowledgments

- Built with Angular and NestJS
- Styled with Tailwind CSS
- Inspired by Postman
- Created as a learning project

---

**Last Updated**: October 28, 2025
**Version**: 1.0.0
