[TV Series](./tv-series.md) > Seasons

# Seasons API Documentation

This document describes the endpoints available for managing TV show seasons, including retrieving season data and updating season-level watch status.

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
  watchStatus: 'WATCHING' | 'COMPLETED' | 'NOT_WATCHING',
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
      "watchStatus": "COMPLETED",
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

Updates the watch status of a season, with optional recursive updates to all episodes within the season.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/seasons/watchstatus`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "seasonId": 1,
  "status": "COMPLETED",
  "recursive": true
}
```

#### Request Body Fields

- `seasonId` (required): ID of the season to update
- `status` (required): New watch status (`WATCHING`, `COMPLETED`, `NOT_WATCHING`)
- `recursive` (optional, default: false): Whether to update all episodes in the season

#### Response Format

```typescript
{
  message: string
}
```

#### Example Response

```json
{
  "message": "Successfully updated the season watch status"
}
```

**Status Codes:**
- 200: Status updated successfully
- 400: Invalid request body or status
- 401: Authentication required
- 403: Access forbidden
- 404: Season not found
- 500: Server error

## Season Watch Status Behavior

### Status Types

- **WATCHING**: Currently watching this season
- **COMPLETED**: Finished watching all episodes in the season
- **NOT_WATCHING**: Not currently watching this season

### Recursive Updates

When `recursive: true` is specified:

#### COMPLETED Status
- Marks all episodes in the season as `WATCHED`
- Updates season watch progress to 100%
- May trigger parent show status update if all seasons are completed

#### NOT_WATCHING Status
- Sets season status to `NOT_WATCHING`
- Preserves individual episode watch status
- Does not affect parent show status

#### WATCHING Status
- Sets season status to `WATCHING`
- Does not modify individual episode status
- Sets parent show status to `WATCHING` if not already set

### Automatic Status Calculation

The system automatically calculates season status based on episode progress:

- **COMPLETED**: When all episodes are marked as watched
- **WATCHING**: When at least one episode is watched but not all
- **NOT_WATCHING**: When no episodes are watched or explicitly set

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
- Season-level updates can cascade to episodes when recursive

## Parent Show Integration

### Show Status Impact
Season status changes can affect the parent show:

- **Show becomes COMPLETED**: When all seasons are completed
- **Show becomes WATCHING**: When any season is watching
- **Show remains NOT_WATCHING**: When all seasons are not watching

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
      "message": "Status must be one of: WATCHING, COMPLETED, NOT_WATCHING"
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
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Update season watch status
async function updateSeasonWatchStatus(
  accountId: number,
  profileId: number,
  seasonId: number,
  status: 'WATCHING' | 'COMPLETED' | 'NOT_WATCHING',
  recursive: boolean,
  token: string
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/seasons/watchstatus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ seasonId, status, recursive })
  });
  return await response.json();
}

// Mark entire season as completed
async function completeEntireSeason(accountId: number, profileId: number, seasonId: number, token: string) {
  try {
    const result = await updateSeasonWatchStatus(accountId, profileId, seasonId, 'COMPLETED', true, token);
    console.log('Season marked as completed with all episodes');
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
  
  const summary = seasons.map(season => ({
    seasonNumber: season.season_number,
    name: season.name,
    progress: season.watchProgress,
    status: season.watchStatus,
    watchedEpisodes: season.watchedEpisodes,
    totalEpisodes: season.totalEpisodes,
    totalRuntime: season.totalRuntime
  }));
  
  const overallProgress = seasons.reduce((total, season) => total + season.watchProgress, 0) / seasons.length;
  
  return {
    seasons: summary,
    overallProgress: Math.round(overallProgress * 10) / 10,
    totalSeasons: seasons.length,
    completedSeasons: seasons.filter(s => s.watchStatus === 'COMPLETED').length
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
    
    // Mark first three seasons as completed
    for (let i = 0; i < Math.min(3, seasons.length); i++) {
      const season = seasons[i];
      console.log(`Completing season ${season.season_number}: ${season.name}`);
      await completeEntireSeason(accountId, profileId, season.season_id, token);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
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

# Mark season as completed (with recursive episode updates)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"seasonId": 1, "status": "COMPLETED", "recursive": true}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/watchstatus

# Mark season as currently watching (without affecting episodes)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"seasonId": 2, "status": "WATCHING", "recursive": false}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/watchstatus

# Stop watching a season
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"seasonId": 3, "status": "NOT_WATCHING", "recursive": false}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/watchstatus
```

## Performance Considerations

### Caching Strategy
- Season data is cached for 30 minutes
- Cache is invalidated when season or episode status changes
- Episode data within seasons is cached separately

### Batch Operations
- Use recursive updates for bulk episode status changes
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