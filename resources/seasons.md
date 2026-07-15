[TV Series](./tvSeries.md) > Seasons

# Seasons API Documentation

This document describes the endpoints available for managing TV show seasons, including retrieving season data and
updating season-level watch status.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Data Structures

### Season Object

```typescript
{
  season_id: number,
  season_number: number,
  name: string,
  description: string,
  poster_url: string,
  air_date: string,
  episode_count: number,
  show_id: number,
  watchStatus: 'UNAIRED' | 'NOT_WATCHED' | 'WATCHING' | 'WATCHED' | 'UP_TO_DATE' | 'SKIPPED',
  watchProgress: number, // percentage (0-100)
  watchedEpisodes: number,
  totalEpisodes: number,
  episodes: Array<Episode>,
  show_title: string,
  show_poster_url: string,
  averageRating?: number,
  totalRuntime?: number // in minutes
}
```

### Episode Object (within Season)

```typescript
{
  episode_id: number,
  episode_number: number,
  title: string,
  description: string,
  air_date: string,
  runtime: number, // in minutes
  still_url: string,
  season_id: number,
  show_id: number,
  watchStatus: 'WATCHED' | 'NOT_WATCHED',
  guest_stars?: Array<{
    name: string,
    character: string,
    profile_path: string
  }>,
  director?: string,
  writer?: string,
  averageRating?: number
}
```

## Endpoints

### Get Seasons for Show

Retrieves all seasons for a specific show with their episodes and watch status information.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/shows/{showId}/seasons`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `showId` (path, required): Unique identifier of the show

#### Response Format

```typescript
{
  message: string,
  results: Array<Season>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved seasons for the show",
  "results": [
    {
      "season_id": 1,
      "season_number": 1,
      "name": "Season 1",
      "description": "High school chemistry teacher Walter White's life is suddenly transformed by a dire medical diagnosis.",
      "poster_url": "https://image.tmdb.org/t/p/w500/1BP4xYv9ZG4ZVHkL7ocOziBbSYH.jpg",
      "air_date": "2008-01-20",
      "episode_count": 7,
      "show_id": 1,
      "watchStatus": "WATCHED",
      "watchProgress": 100,
      "watchedEpisodes": 7,
      "totalEpisodes": 7,
      "show_title": "Breaking Bad",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "averageRating": 8.2,
      "totalRuntime": 329,
      "episodes": [
        {
          "episode_id": 1,
          "episode_number": 1,
          "title": "Pilot",
          "description": "When an unassuming high school chemistry teacher discovers he has a rare form of lung cancer...",
          "air_date": "2008-01-20",
          "runtime": 58,
          "still_url": "https://image.tmdb.org/t/p/w500/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg",
          "season_id": 1,
          "show_id": 1,
          "watchStatus": "WATCHED",
          "director": "Vince Gilligan",
          "writer": "Vince Gilligan",
          "averageRating": 8.2
        },
        {
          "episode_id": 2,
          "episode_number": 2,
          "title": "Cat's in the Bag...",
          "description": "Walt and Jesse attempt to tie up loose ends.",
          "air_date": "2008-01-27",
          "runtime": 48,
          "still_url": "https://image.tmdb.org/t/p/w500/A7ZpngsACMdbyxK6pzLq55O9lTWD.jpg",
          "season_id": 1,
          "show_id": 1,
          "watchStatus": "WATCHED",
          "director": "Adam Bernstein",
          "writer": "Vince Gilligan",
          "averageRating": 8.1
        }
      ]
    },
    {
      "season_id": 2,
      "season_number": 2,
      "name": "Season 2",
      "description": "Walt and Jesse are in way over their heads in manufacturing and pushing their product.",
      "poster_url": "https://image.tmdb.org/t/p/w500/e3oGYpoTUhOFK0BJfloru5ZmfBf.jpg",
      "air_date": "2009-03-08",
      "episode_count": 13,
      "show_id": 1,
      "watchStatus": "WATCHING",
      "watchProgress": 61.5,
      "watchedEpisodes": 8,
      "totalEpisodes": 13,
      "show_title": "Breaking Bad",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "averageRating": 8.6,
      "totalRuntime": 611,
      "episodes": [
        {
          "episode_id": 8,
          "episode_number": 1,
          "title": "Seven Thirty-Seven",
          "description": "Walt and Jesse realize how dire their situation is.",
          "air_date": "2009-03-08",
          "runtime": 47,
          "still_url": "https://image.tmdb.org/t/p/w500/tjDNvbokPLtEnpFpnVMRIm9dLmO.jpg",
          "season_id": 2,
          "show_id": 1,
          "watchStatus": "WATCHED",
          "director": "Bryan Cranston",
          "writer": "J. Roberts",
          "averageRating": 8.4
        }
      ]
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 404: Show not found
- 500: Server error

---

### Update Season Watch Status

Updates the watch status of a season. There is no `recursive` flag — the update always cascades to the season's
episodes (except `SKIPPED`, see below) and always recalculates the parent show's status.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/seasons/watchstatus`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "seasonId": 1,
  "status": "WATCHED"
}
```

#### Request Body Fields

- `seasonId` (required): ID of the season to update
- `status` (required): New watch status — user-settable values are `NOT_WATCHED`, `WATCHED`, or `SKIPPED` (there is
  no `WATCHING`/`COMPLETED`/`NOT_WATCHING`)

#### Response Format

```typescript
{
  message: string,
  statusData: {
    showWithSeasons: ShowDetailsObject, // the parent show with its full season/episode hierarchy, post-update
    nextUnwatchedEpisodes: Array<{
      showId: number,
      showTitle: string,
      posterImage: string,
      lastWatched: string,
      episodes: Array<Episode>
    }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully updated the season watch status",
  "statusData": {
    "showWithSeasons": {
      "show_id": 1,
      "title": "Breaking Bad",
      "watchStatus": "WATCHING",
      "totalSeasons": 5,
      "totalEpisodes": 62,
      "watchedEpisodes": 7,
      "watchProgress": 11.3,
      "seasons": [
        {
          "season_id": 1,
          "season_number": 1,
          "watchStatus": "WATCHED",
          "episodes": []
        }
      ]
    },
    "nextUnwatchedEpisodes": []
  }
}
```

**Status Codes:**

- 200: Status updated successfully
- 400: Invalid request body or status
- 401: Authentication required
- 403: Access forbidden
- 404: Season not found
- 500: Server error

---

### Mark Seasons as Previously Watched

Marks specific seasons of a show as previously watched, using each episode's air date as the watched date so that
viewing statistics remain accurate.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/seasons/priorWatchStatus`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "seasonIds": [1, 2, 3],
  "showId": 1
}
```

#### Request Body Fields

- `seasonIds` (required): Array of season IDs to mark as previously watched (at least one required)
- `showId` (required): ID of the show the seasons belong to

#### Response Format

```typescript
{
  message: string,
  statusData: {
    showWithSeasons: ShowDetailsObject,
    nextUnwatchedEpisodes: Array<{
      showId: number,
      showTitle: string,
      posterImage: string,
      lastWatched: string,
      episodes: Array<Episode>
    }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully marked seasons as previously watched",
  "statusData": {
    "showWithSeasons": {
      "show_id": 1,
      "title": "Breaking Bad",
      "watchStatus": "WATCHING",
      "totalSeasons": 5,
      "totalEpisodes": 62,
      "watchedEpisodes": 20,
      "watchProgress": 32.3,
      "seasons": [
        {
          "season_id": 1,
          "season_number": 1,
          "watchStatus": "WATCHED",
          "episodes": []
        }
      ]
    },
    "nextUnwatchedEpisodes": []
  }
}
```

**Status Codes:**

- 200: Status updated successfully
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 404: Season not found
- 500: Server error

## Season Watch Status Behavior

### Status Values

The full `WatchStatus` enum is `UNAIRED | NOT_WATCHED | WATCHING | WATCHED | UP_TO_DATE | SKIPPED`:

- **User-settable season status**: `NOT_WATCHED`, `WATCHED`, or `SKIPPED` only.
- **Computed/response season status**: any of `UNAIRED`, `NOT_WATCHED`, `WATCHING`, `WATCHED`, `UP_TO_DATE`, or a
  user-set `SKIPPED`.
  - `UNAIRED`: The season hasn't aired yet.
  - `NOT_WATCHED`: The season has aired but no episodes have been watched.
  - `WATCHING`: Some but not all currently-aired episodes have been watched.
  - `UP_TO_DATE`: All currently-aired episodes have been watched, but more episodes of the season are still to air.
  - `WATCHED`: All episodes in the season have been watched and none remain to air.
  - `SKIPPED`: The user explicitly marked the season as skipped. It is never derived automatically — once set, it's
    trusted as-is and treated as "complete" (like `WATCHED`/`UP_TO_DATE`) when rolling up to the parent show's
    status, without altering the underlying episode watch statuses.

### No `recursive` Flag — Updates Always Cascade

- **Setting a season to `WATCHED` or `NOT_WATCHED`**: Marks every currently-aired episode in the season with that
  status, then recalculates the parent show's status from all of its seasons.
- **Setting a season to `SKIPPED`**: Stores `SKIPPED` on the season directly without changing any episode's watch
  status, then recalculates the parent show's status (a skipped season counts as "complete" for that roll-up).
- **Individual episode updates** within the season automatically recalculate the season's status (and in turn the
  show's), so there's no need for a season-level "recursive" toggle to keep things in sync.

### Watch Progress Calculation

Season watch progress is calculated as:

```
watchProgress = (watchedEpisodes / totalEpisodes) * 100
```

## Episode Management within Seasons

### Episode Loading

- Episodes are loaded with season data by default
- Episode watch status reflects individual tracking
- Episode metadata includes runtime, air dates, and crew information

### Episode Status Updates

- Individual episode updates automatically recalculate season progress
- Use the [Episodes API](./episodes.md) for granular episode management
- Season-level updates always cascade to episodes (except `SKIPPED`, which only affects the season itself)

## Parent Show Integration

### Show Status Impact

Season status changes always recalculate the parent show's status:

- **Show becomes `WATCHED`**: When all seasons are watched/up-to-date/skipped and the show is no longer in
  production
- **Show becomes `UP_TO_DATE`**: When all currently-aired seasons are watched/up-to-date/skipped but the show is
  still in production or has unaired seasons
- **Show becomes `WATCHING`**: When there's a mix of watched and not-watched seasons, or any season is itself
  `WATCHING`
- **Show becomes `NOT_WATCHED`**: When no aired seasons have any watched episodes

### Cache Management

- Season updates invalidate show-level cache
- Episode data cache is refreshed when season status changes
- Statistics cache is automatically updated

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "seasonId",
      "message": "Season ID must be a positive integer"
    },
    {
      "field": "status",
      "message": "Status must be one of: NOT_WATCHED, WATCHED, or SKIPPED"
    }
  ]
}
```

### Season Not Found (404 Not Found)

```json
{
  "error": "Season not found"
}
```

### Season Not in Profile (403 Forbidden)

```json
{
  "error": "Season does not belong to a show in this profile's favorites"
}
```

## Example Usage

### Complete Season Management Workflow

```typescript
// Get all seasons for a show
async function getSeasonsForShow(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/${showId}/seasons`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Update season watch status
async function updateSeasonWatchStatus(
  accountId: number,
  profileId: number,
  seasonId: number,
  status: 'NOT_WATCHED' | 'WATCHED' | 'SKIPPED',
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/seasons/watchstatus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ seasonId, status }),
  });
  return await response.json();
}

// Mark entire season as watched (cascades to all its episodes automatically)
async function completeEntireSeason(accountId: number, profileId: number, seasonId: number, token: string) {
  try {
    const result = await updateSeasonWatchStatus(accountId, profileId, seasonId, 'WATCHED', token);
    console.log('Season marked as watched with all episodes');
    return result;
  } catch (error) {
    console.error('Failed to complete season:', error);
    throw error;
  }
}

// Get season progress summary
async function getSeasonProgressSummary(accountId: number, profileId: number, showId: number, token: string) {
  const response = await getSeasonsForShow(accountId, profileId, showId, token);
  const seasons = response.results;

  const summary = seasons.map((season) => ({
    seasonNumber: season.season_number,
    name: season.name,
    progress: season.watchProgress,
    status: season.watchStatus,
    watchedEpisodes: season.watchedEpisodes,
    totalEpisodes: season.totalEpisodes,
    totalRuntime: season.totalRuntime,
  }));

  const overallProgress = seasons.reduce((total, season) => total + season.watchProgress, 0) / seasons.length;

  return {
    seasons: summary,
    overallProgress: Math.round(overallProgress * 10) / 10,
    totalSeasons: seasons.length,
    watchedSeasons: seasons.filter((s) => s.watchStatus === 'WATCHED' || s.watchStatus === 'UP_TO_DATE').length,
  };
}

// Batch season operations
async function batchUpdateSeasons() {
  const token = 'your_jwt_token';
  const accountId = 123;
  const profileId = 456;
  const showId = 1;

  try {
    // Get all seasons
    const seasonsData = await getSeasonsForShow(accountId, profileId, showId, token);
    const seasons = seasonsData.results;

    // Mark first three seasons as watched
    for (let i = 0; i < Math.min(3, seasons.length); i++) {
      const season = seasons[i];
      console.log(`Completing season ${season.season_number}: ${season.name}`);
      await completeEntireSeason(accountId, profileId, season.season_id, token);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Get updated progress summary
    const progressSummary = await getSeasonProgressSummary(accountId, profileId, showId, token);
    console.log('Updated progress:', progressSummary);
  } catch (error) {
    console.error('Batch season update failed:', error);
  }
}
```

### cURL Examples

```bash
# Get seasons for a show
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/1/seasons

# Mark season as watched (automatically cascades to all its episodes)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"seasonId": 1, "status": "WATCHED"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/watchstatus

# Mark a season as skipped (does not touch its episodes' watch status)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"seasonId": 2, "status": "SKIPPED"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/watchstatus

# Mark seasons 1-3 as previously watched
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"seasonIds": [1, 2, 3], "showId": 1}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/priorWatchStatus
```

## Performance Considerations

### Caching Strategy

- Season data is cached for 30 minutes
- Cache is invalidated when season or episode status changes
- Episode data within seasons is cached separately

### Batch Operations

- Season and show watch status updates cascade to all children automatically — prefer them over many individual
  episode API calls
- Minimize individual episode API calls when possible
- Consider rate limiting for bulk operations

### Data Loading

- Season data includes episode metadata for efficiency
- Episode details are pre-loaded to reduce additional API calls
- Images are served via TMDB CDN for optimal performance

## Integration Notes

### Related Endpoints

- Use [Shows API](./shows.md) for show-level operations
- Use [Episodes API](./episodes.md) for individual episode tracking
- Use [Statistics API](./statistics.md) for season-level progress analytics

### Data Consistency

- Season status automatically affects show status
- Episode updates within seasons trigger season recalculation
- All updates maintain referential integrity

## Additional Notes

- Season images and metadata are sourced from TMDB
- Special seasons (Season 0) contain specials and extras
- Season numbering follows TMDB conventions
- Runtime calculations include all episodes in the season
- Watch progress is calculated in real-time based on episode status
- Season status changes trigger automatic parent show evaluation
- All timestamp fields use ISO 8601 format
- Guest star information is available when provided by TMDB
