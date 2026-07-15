[Home](../README.md)

# Watchlist API Documentation

This document describes the endpoints for a profile's personal, prioritized watchlist — the queue behind the "What
Should I Watch Next?" feature. Unlike favorites (which track everything a profile follows), the watchlist is a
short, manually-ordered list of shows and movies the profile intends to watch soon.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}/watchlist`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Data Structures

### Watchlist Item Object

A watchlist entry enriched with the display fields needed to render a watchlist card.

```typescript
{
  id: number,
  profileId: number,
  contentType: 'show' | 'movie',
  contentId: number,
  priority: number,             // display order; lower values appear first (1-based)
  addedAt: string,               // ISO timestamp
  title: string,
  posterImage: string,
  genres: string,                // comma-separated genre names
  streamingServices: string,     // comma-separated streaming service names
  runtime: number | null,        // average episode runtime (shows) or movie runtime, in minutes; null if unknown
  currentWatchStatus: 'UNAIRED' | 'NOT_WATCHED' | 'WATCHING' | 'WATCHED' | 'UP_TO_DATE' | 'SKIPPED'
}
```

`currentWatchStatus` reflects the profile's live watch status for the underlying show or movie, independent of the
watchlist entry itself — it's included so the UI can flag entries the profile has already started or finished
without a separate lookup.

### Add Watchlist Item Request Body

```typescript
{
  contentType: 'show' | 'movie',
  contentId: number  // positive integer; the show or movie's internal ID (not its TMDB ID)
}
```

### Update Watchlist Priorities Request Body

```typescript
{
  priorities: Array<{
    id: number,       // watchlist entry ID (not the show/movie ID)
    priority: number  // new position; >= 0
  }>
}
```

## Endpoints

### Get Watchlist

Retrieves a profile's full watchlist, ordered by priority (ascending — lower values first).

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/watchlist`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  watchlist: Array<WatchlistItem>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved watchlist",
  "watchlist": [
    {
      "id": 12,
      "profileId": 456,
      "contentType": "show",
      "contentId": 101,
      "priority": 0,
      "addedAt": "2026-06-01T12:00:00.000Z",
      "title": "Breaking Bad",
      "posterImage": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "genres": "Drama, Crime, Thriller",
      "streamingServices": "Netflix",
      "runtime": 47,
      "currentWatchStatus": "NOT_WATCHED"
    },
    {
      "id": 7,
      "profileId": 456,
      "contentType": "movie",
      "contentId": 27205,
      "priority": 1,
      "addedAt": "2026-06-03T09:30:00.000Z",
      "title": "Inception",
      "posterImage": "https://image.tmdb.org/t/p/w500/inception_poster.jpg",
      "genres": "Action, Sci-Fi",
      "streamingServices": "HBO Max",
      "runtime": 148,
      "currentWatchStatus": "NOT_WATCHED"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Add Item to Watchlist

Adds a show or movie to the end of a profile's watchlist. The new entry is automatically assigned the next available
priority (current maximum + 1), so it's appended to the bottom of the queue.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/watchlist`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "contentType": "show",
  "contentId": 101
}
```

#### Response Format

```typescript
{
  message: string,
  item: WatchlistItem
}
```

#### Example Response

```json
{
  "message": "Successfully added item to watchlist",
  "item": {
    "id": 13,
    "profileId": 456,
    "contentType": "show",
    "contentId": 101,
    "priority": 2,
    "addedAt": "2026-07-14T18:00:00.000Z",
    "title": "Breaking Bad",
    "posterImage": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    "genres": "Drama, Crime, Thriller",
    "streamingServices": "Netflix",
    "runtime": 47,
    "currentWatchStatus": "NOT_WATCHED"
  }
}
```

**Status Codes:**

- 201: Item added successfully
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Remove Item from Watchlist

Removes a single entry from a profile's watchlist. This does not affect favorites, watch status, or watch history —
it only removes the queue entry itself.

**Endpoint:** `DELETE /api/v1/accounts/{accountId}/profiles/{profileId}/watchlist/{itemId}`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `itemId` (path, required): Unique identifier of the watchlist entry to remove (not the show/movie ID)

#### Response Format

```typescript
{
  message: string;
}
```

#### Example Response

```json
{
  "message": "Successfully removed item from watchlist"
}
```

**Status Codes:**

- 200: Item removed successfully
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Update Watchlist Priorities

Bulk-updates the display order of watchlist entries. Send the full desired ordering for the entries being
reprioritized — the server applies each `{ id, priority }` pair independently, so it's safe to send only the entries
that actually moved.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/watchlist/priorities`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "priorities": [
    { "id": 12, "priority": 1 },
    { "id": 7, "priority": 2 }
  ]
}
```

`priorities` must contain at least one entry.

#### Response Format

```typescript
{
  message: string;
}
```

#### Example Response

```json
{
  "message": "Successfully updated watchlist priorities"
}
```

**Status Codes:**

- 200: Priorities updated successfully
- 400: Invalid request body (empty array, or non-positive ID/negative priority)
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "contentId",
      "message": "Content ID must be a positive integer"
    }
  ]
}
```

### Authentication Errors (401 Unauthorized)

```json
{
  "error": "Authorization header missing or malformed"
}
```

### Authorization Errors (403 Forbidden)

```json
{
  "error": "You do not have permission to access this account"
}
```

### Server Errors (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

### Complete Watchlist Workflow

```typescript
// Get a profile's watchlist
async function getWatchlist(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Add a show or movie to the watchlist
async function addToWatchlist(
  accountId: number,
  profileId: number,
  contentType: 'show' | 'movie',
  contentId: number,
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType, contentId }),
  });
  return await response.json();
}

// Remove an entry from the watchlist
async function removeFromWatchlist(accountId: number, profileId: number, itemId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchlist/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Reorder watchlist entries (e.g. after a drag-and-drop reorder in the UI)
async function updateWatchlistPriorities(
  accountId: number,
  profileId: number,
  priorities: Array<{ id: number; priority: number }>,
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchlist/priorities`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ priorities }),
  });
  return await response.json();
}

// Complete workflow example
async function manageWatchlist() {
  const token = 'your_jwt_token';
  const accountId = 123;
  const profileId = 456;

  try {
    // 1. Add a show and a movie to the watchlist
    console.log('Adding items to watchlist...');
    await addToWatchlist(accountId, profileId, 'show', 101, token);
    const movieItem = await addToWatchlist(accountId, profileId, 'movie', 27205, token);

    // 2. Fetch the current watchlist
    console.log('Fetching watchlist...');
    const watchlist = await getWatchlist(accountId, profileId, token);
    console.log(`Watchlist has ${watchlist.watchlist.length} items`);

    // 3. Move the movie to the top of the queue
    console.log('Reordering watchlist...');
    await updateWatchlistPriorities(accountId, profileId, [{ id: movieItem.item.id, priority: 0 }], token);

    // 4. Remove an item once it's been watched
    console.log('Removing a watched item...');
    await removeFromWatchlist(accountId, profileId, movieItem.item.id, token);
  } catch (error) {
    console.error('Error managing watchlist:', error);
  }
}
```

### cURL Examples

```bash
# Get a profile's watchlist
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/watchlist

# Add a show to the watchlist
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"contentType": "show", "contentId": 101}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/watchlist

# Remove an item from the watchlist
curl -X DELETE \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/watchlist/12

# Reorder watchlist entries
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"priorities": [{"id": 12, "priority": 1}, {"id": 7, "priority": 2}]}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/watchlist/priorities
```

## Additional Notes

- Priority is a display-order value, not a rating — lower numbers sort first. New items are appended at
  `MAX(priority) + 1` for the profile, so they land at the bottom of the queue by default.
- `contentId` refers to the show or movie's internal KeepWatching ID, the same ID used throughout the
  [Shows API](./shows.md) and [Movies API](./movies.md) — not the TMDB ID used when adding new favorites or in
  [Discover API](./discover.md) results.
- The watchlist is independent of favorites: adding something to the watchlist does not add it to favorites, and
  removing it from the watchlist does not remove it from favorites or affect watch history.
- `currentWatchStatus` is computed live from the profile's watch status tables each time the watchlist is fetched,
  so it always reflects the latest state even if it was set outside the watchlist (e.g. from the Shows or Movies
  API).
- Watchlist activity (items added and removed, along with the watch status at removal) is recorded separately for
  the "What Should I Watch Next?" usage statistics surfaced on the [Statistics API](./statistics.md) dashboards.
