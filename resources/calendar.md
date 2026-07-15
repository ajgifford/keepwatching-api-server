[Home](../README.md)

# Calendar API Documentation

This document describes the endpoint available for retrieving a profile's content calendar — a combined, date-ranged
view of episodes and movies relevant to a profile's favorites, used to power upcoming and recently-aired calendar views.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}/calendar`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Data Structures

### Calendar Content Response

```typescript
{
  episodes: Array<CalendarEpisode>,
  movies: Array<CalendarMovie>
}
```

### Calendar Episode Object

Represents an episode airing within the requested date range, for shows the profile has favorited.

```typescript
{
  profileId: number,
  showId: number,
  showName: string,
  streamingServices: string, // comma-separated list of streaming services for the show
  network: string,
  episodeTitle: string,
  airDate: string, // ISO format (YYYY-MM-DD)
  runtime: number, // minutes
  episodeNumber: number,
  seasonNumber: number,
  episodeStillImage: string
}
```

### Calendar Movie Object

Represents a movie releasing within the requested date range, for movies the profile has favorited.

```typescript
{
  id: number,
  tmdbId: number,
  title: string,
  releaseDate: string // ISO format (YYYY-MM-DD)
}
```

## Endpoints

### Get Calendar Content for Profile

Retrieves all episodes and movies relevant to a profile within a given date range. Only content the profile has already
favorited is included — episodes come from shows in the profile's favorites, and movies come from the profile's
favorited movies list.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/calendar`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `startDate` (query, optional): Start of the date range in ISO format (`YYYY-MM-DD`). Defaults to 30 days before the
  current date if omitted.
- `endDate` (query, optional): End of the date range in ISO format (`YYYY-MM-DD`). Defaults to 60 days after the current
  date if omitted.

`startDate` and `endDate` are read directly from the query string and are **not** validated by a schema. Passing a value
that isn't a well-formed date is not rejected by the API layer — it is passed straight through to the underlying
date-range query, so malformed values should be avoided by the caller rather than relied upon to produce a 400 response.

#### Example Request

```
GET /api/v1/accounts/123/profiles/456/calendar?startDate=2025-06-01&endDate=2025-08-31
```

#### Response Format

```typescript
{
  message: string,
  results: {
    episodes: Array<CalendarEpisode>,
    movies: Array<CalendarMovie>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved calendar content",
  "results": {
    "episodes": [
      {
        "profileId": 456,
        "showId": 10,
        "showName": "Breaking Bad",
        "streamingServices": "Netflix",
        "network": "AMC",
        "episodeTitle": "Ozymandias",
        "airDate": "2025-06-14",
        "runtime": 47,
        "episodeNumber": 14,
        "seasonNumber": 5,
        "episodeStillImage": "https://image.tmdb.org/t/p/w500/still.jpg"
      },
      {
        "profileId": 456,
        "showId": 22,
        "showName": "Stranger Things",
        "streamingServices": "Netflix",
        "network": "Netflix",
        "episodeTitle": "Chapter Nine: The Gate",
        "airDate": "2025-07-01",
        "runtime": 51,
        "episodeNumber": 1,
        "seasonNumber": 3,
        "episodeStillImage": "https://image.tmdb.org/t/p/w500/episode-still.jpg"
      }
    ],
    "movies": [
      {
        "id": 88,
        "tmdbId": 27205,
        "title": "Inception",
        "releaseDate": "2025-07-16"
      }
    ]
  }
}
```

**Status Codes:**

- 200: Success
- 400: Invalid `accountId` or `profileId` path parameter
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
      "field": "profileId",
      "message": "Profile ID must be a positive integer"
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

If the account is valid but the profile does not belong to it:

```json
{
  "error": "Access forbidden to this profile, it does not belong to the provided account"
}
```

### Server Errors (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

### JavaScript/TypeScript Examples

```typescript
// Get calendar content using the default date range (30 days back, 60 days forward)
async function getCalendarContent(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/calendar`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get calendar content for a specific date range
async function getCalendarContentForRange(
  accountId: number,
  profileId: number,
  startDate: string,
  endDate: string,
  token: string,
) {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/calendar?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get calendar content for the current month
async function getCalendarForCurrentMonth(accountId: number, profileId: number, token: string) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  return getCalendarContentForRange(accountId, profileId, startDate, endDate, token);
}
```

### cURL Examples

```bash
# Get calendar content with the default 90-day window (30 days back, 60 days forward)
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/calendar

# Get calendar content for a specific date range
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/profiles/456/calendar?startDate=2025-06-01&endDate=2025-08-31"
```

## Additional Notes

- The calendar only surfaces content the profile has already favorited — episodes are pulled from shows in the profile's
  favorites list, and movies from the profile's favorited movies. It does not surface content discovery suggestions.
- When `startDate`/`endDate` are omitted, the server defaults to a window from 30 days in the past through 60 days in
  the future, giving a "recently aired and upcoming" view out of the box.
- `episodes` and `movies` are fetched and combined in a single response so calendar UIs can render both content types
  without separate round trips.
- Episodes are ordered by air date, then show title, season number, and episode number. Movies are ordered by release
  date.
- `streamingServices` is a comma-separated list because a show may be available on more than one streaming service.
- Use [Shows API](./shows.md) and [Episodes API](./episodes.md) to manage which shows/episodes a profile is tracking,
  and [Movies API](./movies.md) to manage favorited movies — the calendar reflects those favorites automatically.
