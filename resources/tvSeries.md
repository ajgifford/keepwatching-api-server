[Home](../README.md)

# TV Series API Documentation

This document describes the comprehensive endpoints available for managing TV series, including shows, seasons, and
episodes. The TV Series API provides functionality for tracking watch progress, managing favorites, and discovering new
content.

## Overview

The TV Series API is organized into three main components:

- **Shows**: Managing favorite TV shows, watch status, and show-level operations
- **Seasons**: Managing season-level watch status and retrieving season data
- **Episodes**: Managing individual episode watch status and episode-specific data

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

Requests without valid authentication will receive a 401 Unauthorized response.

## Quick Reference

### Shows

- `GET /shows` - Get all shows for a profile
- `POST /shows/favorites` - Add show to favorites
- `DELETE /shows/favorites/:showId` - Remove show from favorites
- `PUT /shows/watchstatus` - Update show watch status
- `GET /shows/:showId/details` - Get detailed show information
- `GET /shows/:showId/recommendations` - Get show recommendations
- `GET /shows/:showId/similar` - Get similar shows

### Seasons

- `GET /shows/:showId/seasons` - Get seasons for a show
- `PUT /seasons/watchstatus` - Update season watch status

### Episodes

- `GET /episodes` - Get episode data for profile
- `GET /seasons/:seasonId/episodes` - Get episodes for a season
- `GET /episodes/recent` - Get recent episodes
- `GET /episodes/upcoming` - Get upcoming episodes
- `PUT /episodes/watchStatus` - Update episode watch status
- `PUT /episodes/nextWatchStatus` - Update next episode watch status

## Data Structures

### Show Object

```typescript
{
  show_id: number,
  title: string,
  description: string,
  poster_url: string,
  backdrop_url: string,
  first_air_date: string,
  last_air_date: string,
  status: string,
  genres: Array<string>,
  tmdb_id: number,
  watchStatus: 'WATCHING' | 'COMPLETED' | 'NOT_WATCHING',
  totalSeasons: number,
  totalEpisodes: number,
  watchedEpisodes: number,
  nextEpisode?: Episode
}
```

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
  episodes: Array<Episode>
}
```

### Episode Object

```typescript
{
  episode_id: number,
  episode_number: number,
  season_number: number,
  title: string,
  description: string,
  air_date: string,
  runtime: number,
  still_url: string,
  season_id: number,
  show_id: number,
  watchStatus: 'WATCHED' | 'NOT_WATCHED',
  show_title?: string,
  show_poster_url?: string
}
```

## Watch Status Types

### Show Watch Status

- `WATCHING`: Currently watching the show
- `COMPLETED`: Finished watching all available episodes
- `NOT_WATCHING`: Not currently watching (may be paused or dropped)

### Episode Watch Status

- `WATCHED`: Episode has been watched
- `NOT_WATCHED`: Episode has not been watched

## Content Discovery

The API integrates with TMDB (The Movie Database) to provide:

- Automatic show metadata fetching
- Show recommendations based on viewing history
- Similar show suggestions
- Trending content discovery

## Authorization

All TV Series endpoints require that:

- The user is authenticated
- The user owns the account specified in the URL
- The profile belongs to the specified account

## Error Handling

All endpoints follow consistent error response patterns:

### Authentication Required (401)

```json
{
  "error": "Authorization header missing or malformed"
}
```

### Access Forbidden (403)

```json
{
  "error": "You do not have permission to access this account"
}
```

### Not Found (404)

```json
{
  "error": "Show/Season/Episode not found"
}
```

### Validation Error (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "showTMDBId",
      "message": "TMDB ID is required"
    }
  ]
}
```

## Detailed Sections

### [Shows Management](./shows.md)

Complete documentation for show-level operations including favorites management, watch status updates, and content
discovery.

### [Seasons Management](./seasons.md)

Documentation for season-level operations including season watch status and episode listing.

### [Episodes Management](./episodes.md)

Documentation for episode-level operations including individual episode tracking and watch progress.

## Common Usage Patterns

### Adding a New Show

1. Search for shows using the Search API
2. Add show to favorites using `POST /shows/favorites`
3. Set initial watch status using `PUT /shows/watchstatus`
4. Track episode progress using episode endpoints

### Tracking Watch Progress

1. Mark episodes as watched using `PUT /episodes/watchStatus`
2. System automatically updates show/season progress
3. Use statistics endpoints to view overall progress

### Discovering Content

1. Get recommendations using `GET /shows/:showId/recommendations`
2. Find similar content using `GET /shows/:showId/similar`
3. Use the Discover API for trending content

## Performance Considerations

- Show data is cached for improved performance
- Episode data is paginated for large seasons
- Watch status updates are optimized for batch operations
- Cache invalidation occurs automatically on status changes

## Real-time Updates

The API supports real-time updates via WebSocket connections:

- New episode notifications
- Show status changes
- Recommendation updates

## Example Workflows

### Complete Show Management Workflow

```typescript
// 1. Add show to favorites
const addResult = await addShowToFavorites(accountId, profileId, tmdbId, token);

// 2. Get show details
const showDetails = await getShowDetails(accountId, profileId, showId, token);

// 3. Mark episodes as watched
await updateEpisodeWatchStatus(accountId, profileId, episodeId, 'WATCHED', token);

// 4. Update show status when complete
await updateShowWatchStatus(accountId, profileId, showId, 'COMPLETED', token);
```

### Batch Episode Updates

```typescript
// Mark entire season as watched
await updateSeasonWatchStatus(accountId, profileId, seasonId, 'COMPLETED', true, token);

// Get next unwatched episodes
const nextEpisodes = await getProfileEpisodes(accountId, profileId, token);
```

## Additional Notes

- All dates are in ISO 8601 format
- TMDB integration provides rich metadata
- Watch status changes trigger cache invalidation
- Episode air dates are used for upcoming/recent episode calculations
- Recursive operations are available for bulk status updates
- Profile-specific tracking allows family sharing
- Statistics are calculated in real-time based on watch status
