[Home](../README.md)

# Preferences Controller

The Preferences Controller manages account-level preferences for the KeepWatching application. This controller handles
user preferences organized by preference types and provides both individual and bulk update capabilities.

## Overview

The preferences system allows users to configure account-level settings organized into four fixed types (`email`,
`notification`, `display`, `privacy`):

- `email` - Weekly digest and marketing email settings
- `notification` - New season and new episode alert settings
- `display` - Theme, date format, relative-date behavior, and time format settings
- `privacy` - Recommendation personalization and data collection settings

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
  preferenceType: 'email' | 'notification' | 'display' | 'privacy';
}
```

### Request/Response Bodies

```typescript
// Defined in @ajgifford/keepwatching-types (preferenceTypes.ts)

interface EmailPreferences {
  weeklyDigest?: boolean;
  marketingEmails?: boolean;
}

interface NotificationPreferences {
  newSeasonAlerts?: boolean;
  newEpisodeAlerts?: boolean;
}

interface DisplayPreferences {
  theme?: 'light' | 'dark' | 'auto';
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  relativeDate?: 'relative-recent' | 'always-relative' | 'always-absolute';
  timeFormat?: '12h' | '24h';
}

interface PrivacyPreferences {
  allowRecommendations?: boolean;
  dataCollection?: boolean;
}

// Used in updateMultiplePreferences (all keys optional/partial)
interface TypedPreferenceUpdate {
  email: Partial<EmailPreferences>;
  notification: Partial<NotificationPreferences>;
  display: Partial<DisplayPreferences>;
  privacy: Partial<PrivacyPreferences>;
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
    "email": {
      "weeklyDigest": true,
      "marketingEmails": false
    },
    "notification": {
      "newSeasonAlerts": true,
      "newEpisodeAlerts": true
    },
    "display": {
      "theme": "dark",
      "dateFormat": "MM/DD/YYYY",
      "relativeDate": "relative-recent",
      "timeFormat": "12h"
    },
    "privacy": {
      "allowRecommendations": true,
      "dataCollection": false
    }
  }
}
```

### Get Preferences by Type

```bash
curl -H "Authorization: Bearer token" \
  https://api.example.com/api/v1/accounts/123/preferences/notification
```

**Response:**

```json
{
  "message": "Account preferences retrieved successfully",
  "preferences": {
    "newSeasonAlerts": true,
    "newEpisodeAlerts": true
  }
}
```

### Update Single Preference Type

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "newSeasonAlerts": false,
    "newEpisodeAlerts": true
  }' \
  https://api.example.com/api/v1/accounts/123/preferences/notification
```

**Response:**

```json
{
  "message": "Account preferences updated successfully",
  "preferences": {
    "newSeasonAlerts": false,
    "newEpisodeAlerts": true
  }
}
```

### Update Multiple Preference Types

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "notification": {
      "newSeasonAlerts": false,
      "newEpisodeAlerts": true
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
    "notification": {
      "newSeasonAlerts": false,
      "newEpisodeAlerts": true
    },
    "display": {
      "theme": "light",
      "dateFormat": "MM/DD/YYYY",
      "relativeDate": "relative-recent",
      "timeFormat": "12h"
    }
  }
}
```

Note: `updateMultiplePreferences` only updates the preference types included in the request body — the response reflects
the categories that were actually updated (via `preferencesService.updateMultiplePreferences`), not the full account
preference set.

## Error Handling

The controller follows standard error handling patterns consistent with other controllers in the codebase:

```typescript
// Invalid preference type (rejected by `preferenceRouteParamsSchema` before the controller runs)
{
  "error": "preferenceType: Invalid enum value. Expected 'email' | 'notification' | 'display' | 'privacy', received 'invalidType'"
}

// Unauthorized access
{
  "error": "You do not have permission to access this account"
}

// Body validation errors (invalid field for the given preference type)
{
  "error": "weeklyDigest: Expected boolean, received string"
}
```

Note: `preferenceType` is restricted to `email`, `notification`, `display`, or `privacy` by `preferenceTypeSchema` — any
other value fails route parameter validation with a 400 response before
`getAccountPreferencesByType`/`updatePreferences` ever runs.

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

- **Type-based organization:** Preferences are organized by type (`email`, `notification`, `display`, `privacy`)
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
