# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KeepWatching API Server is a Node.js/TypeScript Express API for a comprehensive media tracking platform. It manages TV
shows, movies, user profiles, and notifications with Firebase authentication, MySQL storage, and WebSocket real-time
updates.

## Common Commands

### Development

```bash
yarn dev                # Run development server with auto-reload (tsx watch)
yarn build              # Compile TypeScript to dist/
yarn rebuild            # Clean and rebuild (rimraf + tsc)
yarn type-check         # TypeScript type checking without emitting files
```

### Testing

```bash
yarn test               # Run all Jest tests
yarn test:watch         # Run tests in watch mode
yarn test:coverage      # Run tests with coverage report
yarn test:ci            # Run tests in CI mode with coverage
```

### Code Quality

```bash
yarn lint               # Run ESLint
yarn lint:fix           # Auto-fix ESLint issues
yarn format             # Format code with Prettier
yarn format:check       # Check formatting without writing
```

### Production

```bash
yarn serve              # Build and start with PM2 (production mode)
yarn start              # Run built application from dist/
```

## Architecture

### Core Dependencies

- **Common Package**: `@ajgifford/keepwatching-common-server` - Shared utilities, services, middleware, and schemas
  across KeepWatching projects
  - Database service (MySQL connection pooling)
  - Email service (notification emails)
  - Socket service (WebSocket management)
  - Logging utilities (Winston with daily rotation)
  - Error handling middleware
  - Validation schemas (Zod)
  - Configuration management
- **Types Package**: `@ajgifford/keepwatching-types` - Shared TypeScript type definitions

### Application Structure

The application follows a standard MVC-like pattern with clear separation of concerns:

**Routers → Middleware → Controllers → Services (from common package)**

- **Routers** (`src/routes/`): Define API endpoints, apply middleware, and route to controllers

  - Use schema validation via `validateSchema` and `validateRequest` from common package
  - Authentication via `authenticateUser` middleware (Firebase JWT verification)
  - Authorization via `authorizeAccountAccess` and similar middleware

- **Controllers** (`src/controllers/`): Handle HTTP request/response logic

  - Wrapped with `asyncHandler` for automatic error handling
  - Extract validated data from request (body, params, query)
  - Call service methods from `@ajgifford/keepwatching-common-server/services`
  - Return structured JSON responses

- **Middleware** (`src/middleware/`):

  - `authenticationMiddleware.ts`: Firebase token verification
  - `authorizationMiddleware.ts`: Resource access control (account/profile ownership)
  - `uploadMiddleware.ts`: Multer configuration for file uploads

- **Services** (in common package): Business logic and data access
  - `accountService`, `profileService`, `showService`, `movieService`, etc.
  - Database interactions via `databaseService`
  - External API calls (TMDB for content discovery)

### Path Aliases

Use TypeScript path aliases defined in `tsconfig.json`:

```typescript
import { SomeController } from '@controllers/someController';
import { authMiddleware } from '@middleware/authMiddleware';
import { someRouter } from '@routes/someRouter';
import { someUtil } from '@utils/someUtil';
```

### Security & Middleware Stack

The Express app applies middleware in this order:

1. Helmet (security headers)
2. Host validation (only approved hostnames: localhost, 127.0.0.1, keepwatching.giffordfamilydev.us)
3. Suspicious request blocking (PHP files, path traversal, code injection patterns)
4. CORS
5. Body parser (JSON and URL-encoded)
6. Response interceptor (from common package)
7. Cookie parser
8. Static file serving (`/uploads`)
9. HTTPS redirect
10. Rate limiting (100 req/min per IP, configurable via env)

### Authentication Flow

1. Client sends Firebase ID token in `Authorization: Bearer <token>` header
2. `authenticateUser` middleware verifies token with Firebase Admin SDK
3. Decoded token attached to `req.user` (type: `admin.auth.DecodedIdToken`)
4. Authorization middleware checks resource ownership (accountId/profileId)

### WebSocket (Socket.IO)

- Initialized in `src/index.ts` with Socket.IO server
- Authentication: Clients must provide `token` and `account_id` in handshake
- Managed by `socketService` from common package
- Used for real-time notifications (new episodes, movies, content updates)
- Scheduled jobs trigger socket notifications via cron

### Database

- MySQL with connection pooling via `databaseService` from common package
- Connection details configured through environment variables
- Database service handles connection lifecycle and graceful shutdown

### Scheduled Jobs

- Initialized via `initScheduledJobs` from common package
- Jobs update show/movie data and trigger socket notifications
- Managed by node-cron, configured through environment variables

### Error Handling

- Global error handler from `@ajgifford/keepwatching-common-server`
- Controllers wrapped with `express-async-handler`
- `GlobalErrorHandler` provides centralized error logging
- Graceful shutdown handles cleanup of database, Firebase, sockets, and cron jobs

### Configuration

- Environment-based configuration via `.env` file
- Config helpers from `@ajgifford/keepwatching-common-server/config`:
  - `getPort()`, `getUploadDirectory()`, `getLogDirectory()`
  - `getServiceAccountPath()`, `getCertsKeyPath()`, `getCertsServerPath()`
  - `isEmailEnabled()`, `validateEmailConfig()`
  - `getRateLimitMax()`, `getRateLimitTimeWindow()`

### Firebase Setup

- Service account JSON must be in `certs/keepwatching-service-account.json`
- Initialized via `initializeFirebase` utility from common package
- Shutdown handled via `shutdownFirebase` during graceful shutdown

### File Uploads

- Multer middleware for handling multipart/form-data
- Uploads stored in configurable directory (default: `uploads/`)
- Endpoints: account images, profile images
- 2MB file size limit

## Testing

### Test Structure

- Tests located in `tests/unit/`
- Organized by layer: `controllers/`, `routes/`
- Jest configuration in `jest.config.js`
- Setup file: `tests/setup.ts` (sets 10s timeout)
- Mock utilities: `jest-mock-extended`, `mock-socket`, `supertest`

### Running Specific Tests

```bash
# Run tests for a specific file
yarn test accountController.test.ts

# Run tests matching a pattern
yarn test register

# Run a single test file with watch
yarn test:watch accountController.test.ts
```

### Writing Tests

- Controllers should mock services from common package
- Use `supertest` for integration testing routes
- Mock Firebase auth for authentication tests
- Mock database service for data layer tests

## Code Style

### Prettier Configuration

- Single quotes
- 120 character line width
- 2 space indentation
- Import sorting via `@trivago/prettier-plugin-sort-imports`
- Import order: module-alias, dotenv, react, third-party modules

### ESLint

- TypeScript ESLint recommended rules
- React plugin (despite being API-only project)
- Test files allow `@typescript-eslint/no-explicit-any`

## Adding New Endpoints

1. **Define schema** in common package (`@ajgifford/keepwatching-common-server/schema`) using Zod
2. **Create/update controller** in `src/controllers/` with `asyncHandler` wrapper
3. **Add route** in appropriate router in `src/routes/`:
   - Apply `validateSchema` or `validateRequest` middleware
   - Apply `authenticateUser` if authentication required
   - Apply authorization middleware if needed
   - Connect to controller function
4. **Add service method** in common package if needed
5. **Write tests** in `tests/unit/controllers/` or `tests/unit/routes/`

## PM2 Deployment

PM2 configuration in `ecosystem.config.js`:

- **Production**: `keepwatching-api-server` - runs built code from `dist/`
- **Development**: `keepwatching-api-server-dev` - runs `yarn dev` with file watching

## Logging

- Winston logger from common package
- Two loggers: `appLogger` (structured JSON logs), `cliLogger` (console output)
- Daily rotating log files in configured log directory
- Log levels: error, warn, info, debug

## Common Patterns

### Controller Structure

```typescript
export const controllerFunction = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { param }: SchemaType = req.body; // or req.params, req.query
    const result = await someService.method(param);
    res.status(200).json({ message: 'Success', result });
  } catch (error) {
    next(error);
  }
});
```

### Router Structure

```typescript
router.post(
  '/api/v1/resource',
  validateSchema(bodySchema),
  authenticateUser,
  authorizeResourceAccess,
  controllerFunction,
);
```

### Response Format

```typescript
{
  message: 'Description of action',
  result: { /* data object */ }
}
```

## Graceful Shutdown

The application handles `SIGTERM`, `SIGINT`, and `SIGUSR2` signals:

1. Close HTTP/HTTPS server
2. Shutdown WebSocket connections
3. Stop scheduled jobs
4. Close database connections
5. Shutdown Firebase app
6. Exit process (10s timeout for force shutdown)
