[Home](../README.md)

# Preferences Controller

The Preferences Controller manages account-level preferences for the KeepWatching application. This controller handles
user preferences organized by preference types and provides both individual and bulk update capabilities.

## Overview

The preferences system allows users to configure account-level settings organized by type, such as:

- Content filtering preferences
- Notification settings
- Display preferences
- Privacy settings
- Other customizable account settings

## Controller Functions

### `getAccountPreferences`

Retrieves all preferences for an account across all preference types.

**Route:** `GET /api/v1/accounts/:accountId/preferences`

```typescript
export const getAccountPreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as unknown as AccountIdParam;
    const preferences = await preferencesService.getAccountPreferences(accountId);

    res.status(200).json({
      message: 'Account preferences retrieved successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});
```

### `getAccountPreferencesByType`

Retrieves preferences for a specific preference type within an account.

**Route:** `GET /api/v1/accounts/:accountId/preferences/:preferenceType`

```typescript
export const getAccountPreferencesByType = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, preferenceType } = req.params as unknown as PreferenceRouteParams;
    const preferences = await preferencesService.getPreferencesByType(accountId, preferenceType);

    res.status(200).json({
      message: 'Account preferences retrieved successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});
```

### `updatePreferences`

Updates preferences for a specific preference type within an account.

**Route:** `PUT /api/v1/accounts/:accountId/preferences/:preferenceType`

```typescript
export const updatePreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, preferenceType } = req.params as unknown as PreferenceRouteParams;
    const bodySchema = getPreferenceBodySchema(preferenceType);
    const validatedUpdates = bodySchema.parse(req.body);
    const preferences = await preferencesService.updatePreferences(accountId, preferenceType, validatedUpdates);

    res.status(200).json({
      message: 'Account preferences updated successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});
```

### `updateMultiplePreferences`

Updates multiple preferences across different preference types in a single request.

**Route:** `PUT /api/v1/accounts/:accountId/preferences`

```typescript
export const updateMultiplePreferences = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params as unknown as AccountIdParam;
    const updates = req.body as Partial<TypedPreferenceUpdate>;
    const preferences = await preferencesService.updateMultiplePreferences(accountId, updates);

    res.status(200).json({
      message: 'Account preferences updated successfully',
      preferences,
    });
  } catch (error) {
    next(error);
  }
});
```

## Route Configuration

The preferences routes are configured in `src/routes/preferencesRouter.ts`:

```typescript
import {
  getAccountPreferences,
  getAccountPreferencesByType,
  updateMultiplePreferences,
  updatePreferences,
} from '../controllers/preferencesController';
import { authorizeAccountAccess } from '../middleware/authorizationMiddleware';
import { validateSchema } from '@ajgifford/keepwatching-common-server';
import { accountIdParamSchema, preferenceRouteParamsSchema } from '@ajgifford/keepwatching-common-server/schema';
import express from 'express';

const router = express.Router();

router.get(
  '/api/v1/accounts/:accountId/preferences',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  getAccountPreferences,
);

router.get(
  '/api/v1/accounts/:accountId/preferences/:preferenceType',
  validateSchema(preferenceRouteParamsSchema, 'params'),
  authorizeAccountAccess,
  getAccountPreferencesByType,
);

router.put(
  '/api/v1/accounts/:accountId/preferences/:preferenceType',
  validateSchema(preferenceRouteParamsSchema, 'params'),
  authorizeAccountAccess,
  updatePreferences,
);

router.put(
  '/api/v1/accounts/:accountId/preferences',
  validateSchema(accountIdParamSchema, 'params'),
  authorizeAccountAccess,
  updateMultiplePreferences,
);

export default router;
```

## Data Types

### Request Parameters

```typescript
interface AccountIdParam {
  accountId: number;
}

interface PreferenceRouteParams {
  accountId: number;
  preferenceType: string;
}
```

### Request/Response Bodies

```typescript
// Used in updateMultiplePreferences
interface TypedPreferenceUpdate {
  // Structure depends on the specific preference types in your system
  // This would be defined in @ajgifford/keepwatching-types
}
```

## Validation & Schema

The controller uses schema validation from the common server package:

- **Parameter validation:** Uses `accountIdParamSchema` and `preferenceRouteParamsSchema`
- **Body validation:** Uses `getPreferenceBodySchema(preferenceType)` which returns appropriate schema based on
  preference type
- **Type safety:** All updates are validated using Zod schemas before processing

## Middleware Integration

All routes include:

- **Schema validation:** Validates request parameters using `validateSchema` middleware
- **Authorization:** Uses `authorizeAccountAccess` to ensure users can only access their own account preferences
- **Error handling:** Uses `asyncHandler` for consistent async error handling

## Request/Response Examples

### Get All Account Preferences

```bash
curl -H "Authorization: Bearer token" \
  https://api.example.com/api/v1/accounts/123/preferences
```

**Response:**

```json
{
  "message": "Account preferences retrieved successfully",
  "preferences": {
    "notifications": {
      "email": true,
      "push": false,
      "marketing": false
    },
    "privacy": {
      "profileVisibility": "private",
      "shareWatchHistory": false
    },
    "display": {
      "theme": "dark",
      "language": "en-US"
    }
  }
}
```

### Get Preferences by Type

```bash
curl -H "Authorization: Bearer token" \
  https://api.example.com/api/v1/accounts/123/preferences/notifications
```

**Response:**

```json
{
  "message": "Account preferences retrieved successfully",
  "preferences": {
    "email": true,
    "push": false,
    "marketing": false,
    "newEpisodes": true,
    "recommendations": true
  }
}
```

### Update Single Preference Type

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "email": false,
    "push": true,
    "marketing": false
  }' \
  https://api.example.com/api/v1/accounts/123/preferences/notifications
```

**Response:**

```json
{
  "message": "Account preferences updated successfully",
  "preferences": {
    "email": false,
    "push": true,
    "marketing": false,
    "newEpisodes": true,
    "recommendations": true
  }
}
```

### Update Multiple Preference Types

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "notifications": {
      "email": false,
      "push": true
    },
    "display": {
      "theme": "light"
    }
  }' \
  https://api.example.com/api/v1/accounts/123/preferences
```

**Response:**

```json
{
  "message": "Account preferences updated successfully",
  "preferences": {
    "notifications": {
      "email": false,
      "push": true,
      "marketing": false,
      "newEpisodes": true,
      "recommendations": true
    },
    "display": {
      "theme": "light",
      "language": "en-US"
    },
    "privacy": {
      "profileVisibility": "private",
      "shareWatchHistory": false
    }
  }
}
```

## Error Handling

The controller follows standard error handling patterns consistent with other controllers in the codebase:

```typescript
// Invalid preference type
{
  "error": "Invalid preference type 'invalidType'"
}

// Unauthorized access
{
  "error": "You do not have permission to access this account"
}

// Validation errors
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email preference must be a boolean"
    }
  ]
}
```

## Service Integration

The controller delegates business logic to the `preferencesService` from the common server package:

- `preferencesService.getAccountPreferences(accountId)`
- `preferencesService.getPreferencesByType(accountId, preferenceType)`
- `preferencesService.updatePreferences(accountId, preferenceType, validatedUpdates)`
- `preferencesService.updateMultiplePreferences(accountId, updates)`

## Security & Authorization

- All routes require authentication via Bearer token
- Users can only access preferences for accounts they're authorized to manage
- Authorization is handled by the `authorizeAccountAccess` middleware
- All input is validated using Zod schemas before processing

## Architecture Notes

- **Type-based organization:** Preferences are organized by type (notifications, privacy, display, etc.)
- **Dynamic validation:** Schema validation adapts based on preference type using `getPreferenceBodySchema()`
- **Bulk operations:** Supports both single-type and multi-type preference updates
- **Consistent patterns:** Follows the same controller patterns as movies and shows controllers
- **Error handling:** Uses `asyncHandler` for consistent async error handling across all methods

## Integration with Common Packages

The controller leverages shared packages for:

- **Schema validation:** `@ajgifford/keepwatching-common-server/schema`
- **Business logic:** `@ajgifford/keepwatching-common-server/services`
- **Type definitions:** `@ajgifford/keepwatching-types`

This ensures consistency across the KeepWatching service ecosystem and reduces code duplication.
