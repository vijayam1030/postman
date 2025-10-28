# AI Coding Agent Instructions - Postman Clone

## Architecture Overview

This is a **full-stack HTTP API client** (Postman clone) with:
- **Backend**: NestJS (TypeScript) on port 3000 - acts as CORS proxy with in-memory history
- **Frontend**: Angular 20 (standalone components) on port 4200 - UI for building/sending requests

**Data Flow**: Frontend → Backend Proxy → External APIs, with automatic history persistence

## Project Structure

```
backend/src/
  ├── proxy/          # Forwards HTTP requests to external APIs
  └── history/        # In-memory storage (max 100 requests)
frontend/src/app/
  ├── components/     # RequestBuilder + RequestHistory
  ├── services/       # ApiService (HTTP) + HistoryEventService (RxJS Subject)
  └── models/         # TypeScript interfaces
```

## Development Workflow

### Starting the Application
**Always run both servers concurrently** (different terminals):
```bash
# Backend (port 3000)
cd backend && npm run start:dev

# Frontend (port 4200)
cd frontend && npm start
```

### Key Scripts
- Backend: `npm run start:dev` (watch mode), `npm run build`, `npm test`
- Frontend: `npm start`, `npm run build`, `npm test`

## Critical Patterns

### Backend: NestJS Module Architecture
- **Use decorators**: `@Controller()`, `@Injectable()`, `@Post()`, `@Body()`
- **Module structure**: Each feature has `*.module.ts`, `*.controller.ts`, `*.service.ts`
- **CORS config in `main.ts`**: Hardcoded to `http://localhost:4200` - update if frontend port changes
- **Axios via `@nestjs/axios`**: Use `HttpService` with `firstValueFrom()` to convert Observables to Promises

Example controller pattern:
```typescript
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}
  
  @Post('send')
  async sendRequest(@Body() request: ProxyRequest): Promise<ProxyResponse> {
    return await this.proxyService.forwardRequest(request);
  }
}
```

### Frontend: Angular Standalone Components
- **No NgModules** - use standalone components with `imports` array
- **Dependency injection**: Services use `providedIn: 'root'` for singleton pattern
- **Two-way binding**: Use `[(ngModel)]` for form inputs (requires `FormsModule`)
- **KeyValue pattern**: Headers/params use `{key: string, value: string, enabled: boolean}[]` with toggles

### Inter-Component Communication
**Use `HistoryEventService` (RxJS Subject) for sibling communication**:
```typescript
// Producer (RequestBuilder)
this.historyEventService.notifyHistoryUpdated();

// Consumer (RequestHistory) 
this.historyEventService.historyUpdated$.subscribe(() => this.loadHistory());
```
**Do NOT** use `@Input()/@Output()` here - components are siblings, not parent-child.

### Data Transformation Convention
**Frontend KeyValue arrays → Backend objects**:
```typescript
// Frontend: [{key: 'Authorization', value: 'Bearer token', enabled: true}]
// Backend expects: {Authorization: 'Bearer token'}
// Use keyValueArrayToObject() helper (see api.service.ts)
```

### In-Memory Storage Limitations
- History persists **only during backend runtime** (lost on restart)
- **Max 100 requests** - uses `array.unshift()` for newest-first ordering
- When adding persistence (DB), keep the 100-item limit logic in the service layer

## Styling & UI Patterns

- **Tailwind CSS**: Utility-first classes (e.g., `bg-blue-500 hover:bg-blue-600`)
- **Status color coding**: 2xx=green, 3xx=blue, 4xx=yellow, 5xx=red (see `getStatusColor()` in components)
- **HTTP method badges**: Color-coded (GET=blue, POST=green, DELETE=red, etc.)

## Common Tasks

### Adding New Backend Endpoints
1. Create/update controller with `@Get()/@Post()/@Delete()` decorators
2. Implement logic in service
3. Update frontend `ApiService` with matching method
4. Both use **shared interfaces** - define in backend controller, mirror in frontend models

### Adding New Form Fields
1. Update `HttpRequest` interface in `frontend/src/app/models/request.model.ts`
2. Add corresponding UI in `request-builder.component.html`
3. Update `keyValueArrayToObject()` or add new transformation logic if needed

### Testing External APIs
Use the UI at `http://localhost:4200` or call backend directly:
```bash
curl -X POST http://localhost:3000/proxy/send \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","url":"https://jsonplaceholder.typicode.com/posts/1"}'
```

## TypeScript & Type Safety

- **Strict mode enabled** on both frontend/backend
- **Shared interfaces**: Backend exports `ProxyRequest/ProxyResponse`, frontend mirrors as `HttpRequest/HttpResponse`
- **Any types only for**: `response.data` (unknown external API shapes) and JSON parsing fallbacks

## Known Gotchas

1. **CORS errors**: Ensure backend CORS origin matches frontend dev server URL
2. **Port conflicts**: Backend must be on 3000, frontend on 4200 (hardcoded in `api.service.ts`)
3. **JSON body handling**: Frontend sends as string, backend parses via `tryParseJSON()` helper
4. **Nested subscriptions**: `sendRequest()` has nested subscribe blocks (request → save history) - could be refactored with RxJS `switchMap`
5. **Memory leaks**: Always unsubscribe in `ngOnDestroy()` (see `RequestHistoryComponent`)

## File Naming Conventions

- Backend: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`
- Frontend: `*.component.ts/html/css`, `*.service.ts`, `*.model.ts`
- Use **kebab-case** for filenames: `request-builder.component.ts`

## Dependencies to Note

- **Backend**: `@nestjs/axios` (not plain axios), `uuid` for IDs, `rxjs` for observables
- **Frontend**: Angular 20 (latest), Tailwind CSS 3, FormsModule for `ngModel`

## Future Architecture Considerations

When adding features:
- **Database**: Replace `HistoryService.history` array with TypeORM/Prisma entities
- **Authentication**: Add NestJS Guards and Angular AuthService with JWT
- **Environment configs**: Replace hardcoded URLs with `environment.ts` (frontend) and `.env` (backend)
- **Request collections**: Add new backend module + frontend component (follow existing patterns)
