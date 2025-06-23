[TV Series](./tv-series.md) > Episodes

# Episodes API Documentation

This document describes the endpoints available for managing individual TV show episodes, including tracking watch
status, retrieving episode data, and managing viewing progress.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}/episodes`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Data Structures

### Episode Object

```typescript
{
  episode_id: number,
  episode_number: number,
  season_number: number,
  title: string,
  description: string,
  air_date: string,
  runtime: number, // in minutes
  still_url: string,
  season_id: number,
  show_id: number,
  watchStatus: 'WATCHED' | 'NOT_WATCHED',
  show_title?: string,
  show_poster_url?: string,
  show_backdrop_url?: string,
  guest_stars?: Array<{
    name: string,
    character: string,
    profile_path: string
  }>,
  crew?: Array<{
    name: string,
    job: string,
    profile_path: string
  }>,
  director?: string,
  writer?: string,
  averageRating?: number,
  tmdb_id?: number,
  production_code?: string
}
```

### Episode Group Object

```typescript
{
  show_id: number,
  show_title: string,
  show_poster_url: string,
  episodes: Array<Episode>
}
```

### Episode Progress Object

```typescript
{
  recentEpisodes: Array<Episode>,
  upcomingEpisodes: Array<Episode>,
  nextUnwatchedEpisodes: Array<EpisodeGroup>
}
```

## Endpoints

### Update Episode Watch Status

Updates the watch status of a specific episode and returns updated next unwatched episodes for the profile.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/episodes/watchStatus`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "episodeId": 123,
  "status": "WATCHED"
}
```

#### Request Body Fields

- `episodeId` (required): ID of the episode to update
- `status` (required): New watch status (`WATCHED`, `NOT_WATCHED`)

#### Response Format

```typescript
{
  message: string,
  nextUnwatchedEpisodes: Array<EpisodeGroup>
}
```

#### Example Response

```json
{
  "message": "Successfully updated the episode watch status",
  "nextUnwatchedEpisodes": [
    {
      "show_id": 1,
      "show_title": "Breaking Bad",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "episodes": [
        {
          "episode_id": 124,
          "episode_number": 2,
          "season_number": 1,
          "title": "Cat's in the Bag...",
          "description": "Walt and Jesse attempt to tie up loose ends.",
          "air_date": "2008-01-27",
          "runtime": 48,
          "still_url": "https://image.tmdb.org/t/p/w500/A7ZpngsACMdbyxK6pzLq55O9lTWD.jpg",
          "season_id": 1,
          "show_id": 1,
          "watchStatus": "NOT_WATCHED"
        }
      ]
    }
  ]
}
```

**Status Codes:**

- 200: Status updated successfully
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 404: Episode not found
- 500: Server error

---

### Get Episodes for Season

Retrieves all episodes for a specific season with their watch status.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/seasons/{seasonId}/episodes`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `seasonId` (path, required): Unique identifier of the season

#### Response Format

```typescript
{
  message: string,
  results: Array<Episode>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved episodes for the season",
  "results": [
    {
      "episode_id": 1,
      "episode_number": 1,
      "season_number": 1,
      "title": "Pilot",
      "description": "When an unassuming high school chemistry teacher discovers he has a rare form of lung cancer...",
      "air_date": "2008-01-20",
      "runtime": 58,
      "still_url": "https://image.tmdb.org/t/p/w500/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg",
      "season_id": 1,
      "show_id": 1,
      "watchStatus": "WATCHED",
      "show_title": "Breaking Bad",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "director": "Vince Gilligan",
      "writer": "Vince Gilligan",
      "averageRating": 8.2,
      "tmdb_id": 349232,
      "guest_stars": [
        {
          "name": "Max Arciniega",
          "character": "Krazy-8",
          "profile_path": "/hRyw2cglnWU42vHZUag7b9dIf4u.jpg"
        }
      ]
    },
    {
      "episode_id": 2,
      "episode_number": 2,
      "season_number": 1,
      "title": "Cat's in the Bag...",
      "description": "Walt and Jesse attempt to tie up loose ends.",
      "air_date": "2008-01-27",
      "runtime": 48,
      "still_url": "https://image.tmdb.org/t/p/w500/A7ZpngsACMdbyxK6pzLq55O9lTWD.jpg",
      "season_id": 1,
      "show_id": 1,
      "watchStatus": "WATCHED",
      "show_title": "Breaking Bad",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "director": "Adam Bernstein",
      "writer": "Vince Gilligan",
      "averageRating": 8.1,
      "tmdb_id": 349233
    },
    {
      "episode_id": 3,
      "episode_number": 3,
      "season_number": 1,
      "title": "...And the Bag's in the River",
      "description": "Walt and Jesse clean up after the bathtub incident.",
      "air_date": "2008-02-10",
      "runtime": 48,
      "still_url": "https://image.tmdb.org/t/p/w500/episodestill3.jpg",
      "season_id": 1,
      "show_id": 1,
      "watchStatus": "NOT_WATCHED",
      "show_title": "Breaking Bad",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "director": "Adam Bernstein",
      "writer": "Vince Gilligan",
      "averageRating": 8.3,
      "tmdb_id": 349234
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 404: Season not found
- 500: Server error

---

### Get Upcoming Episodes

Retrieves upcoming episodes across all shows in a profile's favorites, ordered by air date.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/episodes/upcoming`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Query Parameters

- `limit` (optional, default: 20): Maximum number of episodes to return
- `days` (optional, default: 30): Number of days ahead to look for episodes

#### Response Format

```typescript
{
  message: string,
  results: Array<Episode>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved upcoming episodes",
  "results": [
    {
      "episode_id": 201,
      "episode_number": 5,
      "season_number": 4,
      "title": "The Upside Down",
      "description": "Joyce and Hopper uncover the truth about the lab's experiments.",
      "air_date": "2025-06-08",
      "runtime": 52,
      "still_url": "https://image.tmdb.org/t/p/w500/stranger_things_still.jpg",
      "season_id": 10,
      "show_id": 2,
      "watchStatus": "NOT_WATCHED",
      "show_title": "Stranger Things",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      "show_backdrop_url": "https://image.tmdb.org/t/p/w1280/backdrop.jpg"
    },
    {
      "episode_id": 202,
      "episode_number": 6,
      "season_number": 4,
      "title": "The Mind Flayer",
      "description": "The kids face their greatest challenge yet.",
      "air_date": "2025-06-15",
      "runtime": 55,
      "still_url": "https://image.tmdb.org/t/p/w500/stranger_things_still2.jpg",
      "season_id": 10,
      "show_id": 2,
      "watchStatus": "NOT_WATCHED",
      "show_title": "Stranger Things",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"
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

### Get Recent Episodes

Retrieves recently aired episodes across all shows in a profile's favorites, ordered by air date (most recent first).

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/episodes/recent`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Query Parameters

- `limit` (optional, default: 20): Maximum number of episodes to return
- `days` (optional, default: 14): Number of days back to look for episodes

#### Response Format

```typescript
{
  message: string,
  results: Array<Episode>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved recent episodes",
  "results": [
    {
      "episode_id": 195,
      "episode_number": 3,
      "season_number": 4,
      "title": "The Sauna Test",
      "description": "Eleven and Max seek to discover the source of Billy's strange behavior.",
      "air_date": "2025-05-25",
      "runtime": 52,
      "still_url": "https://image.tmdb.org/t/p/w500/recent_episode_still.jpg",
      "season_id": 10,
      "show_id": 2,
      "watchStatus": "WATCHED",
      "show_title": "Stranger Things",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      "show_backdrop_url": "https://image.tmdb.org/t/p/w1280/backdrop.jpg"
    },
    {
      "episode_id": 196,
      "episode_number": 4,
      "season_number": 4,
      "title": "The Flayed",
      "description": "A code red brings the gang back together to face a frighteningly familiar evil.",
      "air_date": "2025-06-01",
      "runtime": 48,
      "still_url": "https://image.tmdb.org/t/p/w500/recent_episode_still2.jpg",
      "season_id": 10,
      "show_id": 2,
      "watchStatus": "NOT_WATCHED",
      "show_title": "Stranger Things",
      "show_poster_url": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

## Episode Watch Status Behavior

### Status Types

- **WATCHED**: Episode has been viewed by the user
- **NOT_WATCHED**: Episode has not been viewed by the user

### Automatic Updates

Episode status changes trigger several automatic updates:

1. **Season Progress**: Recalculates season watch progress and status
2. **Show Progress**: Updates overall show completion percentage
3. **Next Episodes**: Refreshes the next unwatched episodes queue
4. **Statistics**: Updates profile and account viewing statistics

### Next Episode Logic

The system determines the next episode to watch using this priority:

1. **Chronological Order**: Episodes are ordered by air date within each show
2. **Season Progression**: Episodes within the same season follow episode number order
3. **Show Continuity**: Next episode is typically the next unwatched episode in the series
4. **Multiple Shows**: Next episodes from different shows are returned separately

## Episode Data Sources

### TMDB Integration

- Episode metadata is sourced from The Movie Database
- Still images, descriptions, and crew information are automatically fetched
- Air dates and runtime information are kept current with TMDB updates

### Episode Ratings

- Average ratings are calculated from TMDB user ratings
- Ratings are updated periodically to reflect current scores

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "episodeId",
      "message": "Episode ID must be a positive integer"
    },
    {
      "field": "status",
      "message": "Status must be either 'WATCHED' or 'NOT_WATCHED'"
    }
  ]
}
```

### Episode Not Found (404 Not Found)

```json
{
  "error": "Episode not found"
}
```

### Episode Not in Profile (403 Forbidden)

```json
{
  "error": "Episode does not belong to a show in this profile's favorites"
}
```

## Example Usage

### Complete Episode Management Workflow

```typescript
// Update individual episode watch status
async function updateEpisodeWatchStatus(
  accountId: number,
  profileId: number,
  episodeId: number,
  status: 'WATCHED' | 'NOT_WATCHED',
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/episodes/watchStatus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ episodeId, status }),
  });
  return await response.json();
}

// Update next episode in sequence
async function updateNextEpisodeWatchStatus(
  accountId: number,
  profileId: number,
  showId: number,
  seasonId: number,
  episodeId: number,
  status: 'WATCHED' | 'NOT_WATCHED',
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/episodes/nextWatchStatus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ showId, seasonId, episodeId, status }),
  });
  return await response.json();
}

// Get episodes for a specific season
async function getEpisodesForSeason(accountId: number, profileId: number, seasonId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/seasons/${seasonId}/episodes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get upcoming episodes
async function getUpcomingEpisodes(
  accountId: number,
  profileId: number,
  limit: number = 20,
  days: number = 30,
  token: string,
) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    days: days.toString(),
  });

  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/episodes/upcoming?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get recent episodes
async function getRecentEpisodes(
  accountId: number,
  profileId: number,
  limit: number = 20,
  days: number = 14,
  token: string,
) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    days: days.toString(),
  });

  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/episodes/recent?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Mark episode as watched and get next episodes
async function watchEpisodeAndGetNext(accountId: number, profileId: number, episodeId: number, token: string) {
  try {
    const result = await updateEpisodeWatchStatus(accountId, profileId, episodeId, 'WATCHED', token);
    console.log('Episode marked as watched');
    console.log('Next episodes to watch:', result.nextUnwatchedEpisodes);
    return result.nextUnwatchedEpisodes;
  } catch (error) {
    console.error('Failed to update episode status:', error);
    throw error;
  }
}

// Batch mark multiple episodes as watched
async function batchWatchEpisodes(accountId: number, profileId: number, episodeIds: number[], token: string) {
  const results = [];

  for (const episodeId of episodeIds) {
    try {
      const result = await updateEpisodeWatchStatus(accountId, profileId, episodeId, 'WATCHED', token);
      results.push({ episodeId, success: true, result });

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to update episode ${episodeId}:`, error);
      results.push({ episodeId, success: false, error });
    }
  }

  return results;
}

// Get comprehensive episode overview for profile
async function getEpisodeOverview(accountId: number, profileId: number, token: string) {
  try {
    const [recentResponse, upcomingResponse] = await Promise.all([
      getRecentEpisodes(accountId, profileId, 10, 7, token),
      getUpcomingEpisodes(accountId, profileId, 10, 14, token),
    ]);

    return {
      recentEpisodes: recentResponse.results,
      upcomingEpisodes: upcomingResponse.results,
      summary: {
        recentCount: recentResponse.results.length,
        upcomingCount: upcomingResponse.results.length,
        watchedRecent: recentResponse.results.filter((ep) => ep.watchStatus === 'WATCHED').length,
        unwatchedRecent: recentResponse.results.filter((ep) => ep.watchStatus === 'NOT_WATCHED').length,
      },
    };
  } catch (error) {
    console.error('Failed to get episode overview:', error);
    throw error;
  }
}

// Advanced episode tracking workflow
async function advancedEpisodeTracking() {
  const token = 'your_jwt_token';
  const accountId = 123;
  const profileId = 456;

  try {
    // Get overview of recent and upcoming episodes
    const overview = await getEpisodeOverview(accountId, profileId, token);
    console.log('Episode Overview:', overview);

    // Mark any unwatched recent episodes as watched
    const unwatchedRecent = overview.recentEpisodes.filter((ep) => ep.watchStatus === 'NOT_WATCHED');
    if (unwatchedRecent.length > 0) {
      console.log(`Marking ${unwatchedRecent.length} recent episodes as watched...`);
      const batchResults = await batchWatchEpisodes(
        accountId,
        profileId,
        unwatchedRecent.map((ep) => ep.episode_id),
        token,
      );

      const successful = batchResults.filter((r) => r.success).length;
      console.log(`Successfully updated ${successful} out of ${unwatchedRecent.length} episodes`);
    }

    // Get specific season episodes for detailed tracking
    const seasonId = 1; // example season
    const seasonEpisodes = await getEpisodesForSeason(accountId, profileId, seasonId, token);
    console.log(`Season episodes:`, seasonEpisodes.results.length);

    // Calculate season progress
    const watchedInSeason = seasonEpisodes.results.filter((ep) => ep.watchStatus === 'WATCHED').length;
    const progressPercent = (watchedInSeason / seasonEpisodes.results.length) * 100;
    console.log(
      `Season progress: ${progressPercent.toFixed(1)}% (${watchedInSeason}/${seasonEpisodes.results.length})`,
    );
  } catch (error) {
    console.error('Advanced episode tracking failed:', error);
  }
}
```

### cURL Examples

```bash
# Mark episode as watched
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"episodeId": 123, "status": "WATCHED"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/episodes/watchStatus

# Update next episode watch status
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"showId": 1, "seasonId": 1, "episodeId": 124, "status": "WATCHED"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/episodes/nextWatchStatus

# Get episodes for season
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/1/episodes

# Get upcoming episodes (next 14 days, limit 10)
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/profiles/456/episodes/upcoming?limit=10&days=14"

# Get recent episodes (last 7 days, limit 15)
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/profiles/456/episodes/recent?limit=15&days=7"

# Mark episode as not watched
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"episodeId": 125, "status": "NOT_WATCHED"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/episodes/watchStatus
```

## Performance Considerations

### Caching Strategy

- Episode data is cached for 15 minutes
- Watch status updates invalidate related caches immediately
- Recent/upcoming episode lists are cached for 5 minutes
- Season episode lists are cached for 30 minutes

### Batch Operations

- Use batch functions for updating multiple episodes
- Implement rate limiting for bulk operations (100ms delay recommended)
- Consider using season-level updates for complete season watching

## Integration Notes

### Related Endpoints

- Use [Shows API](./shows.md) for show-level watch status
- Use [Seasons API](./seasons.md) for season-level operations
- Use [Statistics API](./statistics.md) for detailed watch analytics

### Real-time Updates

- Episode status changes trigger WebSocket notifications
- Cache invalidation occurs immediately on status updates
- Parent show/season status is automatically recalculated

### Data Consistency

- Episode updates maintain referential integrity with seasons and shows
- All watch status changes are atomic operations
- Concurrent updates are handled gracefully

## Additional Notes

- All dates use ISO 8601 format (YYYY-MM-DD)
- Episode images are served via TMDB CDN for optimal performance
- Runtime is provided in minutes for consistency
- Episode numbering follows TMDB conventions
- Special episodes (Season 0) are included when available
- Guest star and crew information is optional and may not be available for all episodes
- Episode ratings are updated periodically from TMDB
- Watch status changes trigger automatic progress recalculation for seasons and shows
- Air dates are used to determine recent/upcoming episode categories
- Time zones are handled consistently across all date calculations
