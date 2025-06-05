[TV Series](./tv-series.md) > Shows

# Shows API Documentation

This document describes the endpoints available for managing TV shows, including adding/removing favorites, updating watch status, and discovering new content.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}/shows`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

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
  last_air_date: string | null,
  status: 'Returning Series' | 'Ended' | 'Canceled' | 'In Production',
  genres: Array<string>,
  tmdb_id: number,
  watchStatus: 'WATCHING' | 'COMPLETED' | 'NOT_WATCHING',
  totalSeasons: number,
  totalEpisodes: number,
  watchedEpisodes: number,
  watchProgress: number, // percentage
  nextEpisode?: {
    episode_id: number,
    title: string,
    season_number: number,
    episode_number: number,
    air_date: string
  },
  lastWatchedEpisode?: Episode,
  averageRating?: number,
  network?: string,
  runtime?: number,
  seasons?: Array<Season>
}
```

### Show Details Object
```typescript
{
  ...Show,
  seasons: Array<{
    season_id: number,
    season_number: number,
    name: string,
    description: string,
    poster_url: string,
    air_date: string,
    episode_count: number,
    watchStatus: 'WATCHING' | 'COMPLETED' | 'NOT_WATCHING',
    episodes: Array<Episode>
  }>,
  cast: Array<{
    name: string,
    character: string,
    profile_path: string
  }>,
  crew: Array<{
    name: string,
    job: string,
    profile_path: string
  }>,
  trailers: Array<{
    key: string,
    name: string,
    site: string,
    type: string
  }>
}
```

## Endpoints

### Get All Shows for Profile

Retrieves all shows in a profile's favorites list with their current watch status.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/shows`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  shows: Array<Show>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved shows for a profile",
  "shows": [
    {
      "show_id": 1,
      "title": "Breaking Bad",
      "description": "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine...",
      "poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
      "first_air_date": "2008-01-20",
      "last_air_date": "2013-09-29",
      "status": "Ended",
      "genres": ["Drama", "Crime"],
      "tmdb_id": 1396,
      "watchStatus": "COMPLETED",
      "totalSeasons": 5,
      "totalEpisodes": 62,
      "watchedEpisodes": 62,
      "watchProgress": 100,
      "averageRating": 9.5,
      "network": "AMC",
      "runtime": 47
    },
    {
      "show_id": 2,
      "title": "Stranger Things",
      "description": "When a young boy vanishes, a small town uncovers a mystery involving secret experiments...",
      "poster_url": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
      "first_air_date": "2016-07-15",
      "last_air_date": null,
      "status": "Returning Series",
      "genres": ["Drama", "Fantasy", "Horror"],
      "tmdb_id": 66732,
      "watchStatus": "WATCHING",
      "totalSeasons": 4,
      "totalEpisodes": 34,
      "watchedEpisodes": 25,
      "watchProgress": 73.5,
      "nextEpisode": {
        "episode_id": 234,
        "title": "Chapter Nine: The Gate",
        "season_number": 3,
        "episode_number": 1,
        "air_date": "2025-07-01"
      },
      "network": "Netflix",
      "runtime": 51
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

### Get Show Details

Retrieves comprehensive details for a specific show including seasons, episodes, cast, and crew information.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/shows/{showId}/details`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `showId` (path, required): Unique identifier of the show

#### Response Format

```typescript
{
  message: string,
  show: ShowDetails
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved a show and its details",
  "show": {
    "show_id": 1,
    "title": "Breaking Bad",
    "description": "A high school chemistry teacher diagnosed with inoperable lung cancer...",
    "poster_url": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    "backdrop_url": "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    "first_air_date": "2008-01-20",
    "last_air_date": "2013-09-29",
    "status": "Ended",
    "genres": ["Drama", "Crime"],
    "tmdb_id": 1396,
    "watchStatus": "COMPLETED",
    "totalSeasons": 5,
    "totalEpisodes": 62,
    "watchedEpisodes": 62,
    "watchProgress": 100,
    "seasons": [
      {
        "season_id": 1,
        "season_number": 1,
        "name": "Season 1",
        "description": "High school chemistry teacher Walter White's life is suddenly transformed...",
        "poster_url": "https://image.tmdb.org/t/p/w500/1BP4xYv9ZG4ZVHkL7ocOziBbSYH.jpg",
        "air_date": "2008-01-20",
        "episode_count": 7,
        "watchStatus": "COMPLETED",
        "episodes": []
      }
    ],
    "cast": [
      {
        "name": "Bryan Cranston",
        "character": "Walter White",
        "profile_path": "/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg"
      },
      {
        "name": "Aaron Paul",
        "character": "Jesse Pinkman",
        "profile_path": "/lOhDL0E3vsJoKhDN8thLKIDla8O.jpg"
      }
    ],
    "crew": [
      {
        "name": "Vince Gilligan",
        "job": "Creator",
        "profile_path": "/vZTEKqhcxZEqWjUqKYjAqJHjqyf.jpg"
      }
    ],
    "trailers": [
      {
        "key": "HhesaQXLuRY",
        "name": "Official Trailer",
        "site": "YouTube",
        "type": "Trailer"
      }
    ]
  }
}
```

**Status Codes:**
- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 404: Show not found
- 500: Server error

---

### Add Show to Favorites

Adds a TV show to a profile's favorites list. If the show doesn't exist in the system, it will be fetched from TMDB and created.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/shows/favorites`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "showTMDBId": 1396
}
```

#### Response Format

```typescript
{
  message: string,
  addedShow: Show,
  episodes: {
    recentEpisodes: Array<Episode>,
    upcomingEpisodes: Array<Episode>,
    nextUnwatchedEpisodes: Array<{
      show_id: number,
      episodes: Array<Episode>
    }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully saved show as a favorite",
  "addedShow": {
    "show_id": 1,
    "title": "Breaking Bad",
    "description": "A high school chemistry teacher diagnosed with inoperable lung cancer...",
    "tmdb_id": 1396,
    "watchStatus": "NOT_WATCHING",
    "totalSeasons": 5,
    "totalEpisodes": 62,
    "watchedEpisodes": 0,
    "watchProgress": 0
  },
  "episodes": {
    "recentEpisodes": [],
    "upcomingEpisodes": [],
    "nextUnwatchedEpisodes": [
      {
        "show_id": 1,
        "episodes": [
          {
            "episode_id": 1,
            "title": "Pilot",
            "season_number": 1,
            "episode_number": 1,
            "air_date": "2008-01-20",
            "watchStatus": "NOT_WATCHED"
          }
        ]
      }
    ]
  }
}
```

**Status Codes:**
- 200: Show added successfully
- 400: Invalid request body or TMDB ID
- 401: Authentication required
- 403: Access forbidden
- 409: Show already in favorites
- 500: Server error

---

### Remove Show from Favorites

Removes a TV show from a profile's favorites list.

**Endpoint:** `DELETE /api/v1/accounts/{accountId}/profiles/{profileId}/shows/favorites/{showId}`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `showId` (path, required): Unique identifier of the show

#### Response Format

```typescript
{
  message: string,
  removedShowReference: {
    id: number,
    title: string
  },
  episodes: {
    recentEpisodes: Array<Episode>,
    upcomingEpisodes: Array<Episode>,
    nextUnwatchedEpisodes: Array<{
      show_id: number,
      episodes: Array<Episode>
    }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully removed the show from favorites",
  "removedShowReference": {
    "id": 1,
    "title": "Breaking Bad"
  },
  "episodes": {
    "recentEpisodes": [],
    "upcomingEpisodes": [],
    "nextUnwatchedEpisodes": []
  }
}
```

**Status Codes:**
- 200: Show removed successfully
- 401: Authentication required
- 403: Access forbidden
- 404: Show not found in favorites
- 500: Server error

---

### Update Show Watch Status

Updates the watch status of a show, with optional recursive updates to all seasons and episodes.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/shows/watchstatus`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "showId": 1,
  "status": "COMPLETED",
  "recursive": true
}
```

#### Request Body Fields

- `showId` (required): ID of the show to update
- `status` (required): New watch status (`WATCHING`, `COMPLETED`, `NOT_WATCHING`)
- `recursive` (optional, default: false): Whether to update all seasons and episodes

#### Response Format

```typescript
{
  message: string,
  nextUnwatchedEpisodes: Array<{
    show_id: number,
    episodes: Array<Episode>
  }>
}
```

#### Example Response

```json
{
  "message": "Successfully updated the watch status to 'COMPLETED'",
  "nextUnwatchedEpisodes": [
    {
      "show_id": 2,
      "episodes": [
        {
          "episode_id": 234,
          "title": "Chapter Nine: The Gate",
          "season_number": 3,
          "episode_number": 1,
          "air_date": "2025-07-01",
          "watchStatus": "NOT_WATCHED",
          "show_title": "Stranger Things"
        }
      ]
    }
  ]
}
```

**Status Codes:**
- 200: Status updated successfully
- 400: Invalid request body or status
- 401: Authentication required
- 403: Access forbidden
- 404: Show not found
- 500: Server error

---

### Get Episode Data for Profile

Retrieves comprehensive episode data for a profile including recent, upcoming, and next unwatched episodes.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/episodes`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  episodes: {
    recentEpisodes: Array<Episode>,
    upcomingEpisodes: Array<Episode>,
    nextUnwatchedEpisodes: Array<{
      show_id: number,
      episodes: Array<Episode>
    }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved the episodes for a profile",
  "episodes": {
    "recentEpisodes": [
      {
        "episode_id": 101,
        "title": "Pilot",
        "season_number": 1,
        "episode_number": 1,
        "air_date": "2025-06-01",
        "runtime": 45,
        "watchStatus": "WATCHED",
        "show_title": "New Series",
        "show_poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg"
      }
    ],
    "upcomingEpisodes": [
      {
        "episode_id": 102,
        "title": "Episode 2",
        "season_number": 1,
        "episode_number": 2,
        "air_date": "2025-06-08",
        "runtime": 45,
        "watchStatus": "NOT_WATCHED",
        "show_title": "New Series",
        "show_poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg"
      }
    ],
    "nextUnwatchedEpisodes": [
      {
        "show_id": 1,
        "episodes": [
          {
            "episode_id": 103,
            "title": "Episode 3",
            "season_number": 1,
            "episode_number": 3,
            "air_date": "2025-06-15",
            "watchStatus": "NOT_WATCHED",
            "show_title": "New Series"
          }
        ]
      }
    ]
  }
}
```

**Status Codes:**
- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Get Show Recommendations

Retrieves personalized show recommendations based on a specific show and viewing history.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/shows/{showId}/recommendations`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `showId` (path, required): Unique identifier of the show to base recommendations on

#### Response Format

```typescript
{
  message: string,
  shows: Array<{
    id: number,
    title: string,
    description: string,
    poster_url: string,
    backdrop_url: string,
    first_air_date: string,
    genres: Array<string>,
    tmdb_id: number,
    averageRating: number,
    popularity: number,
    inFavorites: boolean
  }>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved show recommendations",
  "shows": [
    {
      "id": 456,
      "title": "Better Call Saul",
      "description": "Six years before Saul Goodman meets Walter White...",
      "poster_url": "https://image.tmdb.org/t/p/w500/fC2HDm5t0kHl7mTm7jxMR31cyBC.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/w1280/backdrop.jpg",
      "first_air_date": "2015-02-08",
      "genres": ["Crime", "Drama"],
      "tmdb_id": 60059,
      "averageRating": 8.8,
      "popularity": 845.2,
      "inFavorites": false
    },
    {
      "id": 789,
      "title": "The Wire",
      "description": "Told from the points of view of both the Baltimore homicide and narcotics detectives...",
      "poster_url": "https://image.tmdb.org/t/p/w500/4lbclFySvugI51fwsyxBTOm4DqK.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/w1280/backdrop2.jpg",
      "first_air_date": "2002-06-02",
      "genres": ["Crime", "Drama"],
      "tmdb_id": 1438,
      "averageRating": 9.3,
      "popularity": 567.8,
      "inFavorites": true
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

### Get Similar Shows

Retrieves shows that are similar to a specific show based on genre, themes, and metadata.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/shows/{showId}/similar`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `showId` (path, required): Unique identifier of the show to find similar shows for

#### Response Format

```typescript
{
  message: string,
  shows: Array<{
    id: number,
    title: string,
    description: string,
    poster_url: string,
    backdrop_url: string,
    first_air_date: string,
    genres: Array<string>,
    tmdb_id: number,
    averageRating: number,
    popularity: number,
    inFavorites: boolean
  }>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved similar shows",
  "shows": [
    {
      "id": 123,
      "title": "Ozark",
      "description": "A financial advisor drags his family from Chicago to the Missouri Ozarks...",
      "poster_url": "https://image.tmdb.org/t/p/w500/m73d8duNn6C2fU7MOUkyt0DoEiu.jpg",
      "backdrop_url": "https://image.tmdb.org/t/p/w1280/ozark_backdrop.jpg",
      "first_air_date": "2017-07-21",
      "genres": ["Crime", "Drama", "Thriller"],
      "tmdb_id": 69740,
      "averageRating": 8.4,
      "popularity": 123.45,
      "inFavorites": false
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

## Watch Status Behavior

### Recursive Updates

When `recursive: true` is used in watch status updates:

- **COMPLETED**: Marks all seasons and episodes as watched
- **NOT_WATCHING**: Marks all seasons as not watching, but preserves individual episode watch status
- **WATCHING**: Marks the show as watching, but doesn't change season/episode status

### Automatic Status Updates

The system automatically updates show status based on episode progress:

- Show becomes **COMPLETED** when all episodes are watched
- Show becomes **WATCHING** when any episode is marked as watched
- Show becomes **NOT_WATCHING** when explicitly set or when removed from favorites

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "showTMDBId",
      "message": "TMDB ID must be a positive integer"
    }
  ]
}
```

### Show Already in Favorites (409 Conflict)

```json
{
  "error": "Show is already in favorites"
}
```

### Show Not Found in TMDB (404 Not Found)

```json
{
  "error": "Show not found in TMDB database"
}
```

## Example Usage

### Complete Show Management Workflow

```typescript
// Add show to favorites
async function addShowToFavorites(accountId: number, profileId: number, tmdbId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ showTMDBId: tmdbId })
  });
  return await response.json();
}

// Get show details
async function getShowDetails(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/${showId}/details`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Update watch status
async function updateShowWatchStatus(
  accountId: number, 
  profileId: number, 
  showId: number, 
  status: string, 
  recursive: boolean,
  token: string
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/watchstatus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ showId, status, recursive })
  });
  return await response.json();
}

// Remove show from favorites
async function removeShowFromFavorites(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/favorites/${showId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Get show recommendations
async function getShowRecommendations(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/${showId}/recommendations`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Complete workflow example
async function manageShowLifecycle() {
  const token = 'your_jwt_token';
  const accountId = 123;
  const profileId = 456;
  const tmdbId = 1396; // Breaking Bad
  
  try {
    // 1. Add show to favorites
    console.log('Adding show to favorites...');
    const addResult = await addShowToFavorites(accountId, profileId, tmdbId, token);
    const showId = addResult.addedShow.show_id;
    
    // 2. Get detailed show information
    console.log('Fetching show details...');
    const showDetails = await getShowDetails(accountId, profileId, showId, token);
    console.log(`Added: ${showDetails.show.title} (${showDetails.show.totalEpisodes} episodes)`);
    
    // 3. Mark as currently watching
    console.log('Setting watch status to WATCHING...');
    await updateShowWatchStatus(accountId, profileId, showId, 'WATCHING', false, token);
    
    // 4. Get recommendations based on this show
    console.log('Getting recommendations...');
    const recommendations = await getShowRecommendations(accountId, profileId, showId, token);
    console.log(`Found ${recommendations.shows.length} recommended shows`);
    
    // 5. Eventually mark as completed (with recursive episode updates)
    console.log('Marking as completed...');
    await updateShowWatchStatus(accountId, profileId, showId, 'COMPLETED', true, token);
    
  } catch (error) {
    console.error('Error managing show:', error);
  }
}
```

### cURL Examples

```bash
# Add show to favorites
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"showTMDBId": 1396}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/favorites

# Get all shows for profile
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows

# Get show details
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/1/details

# Update watch status (mark as completed with recursive updates)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"showId": 1, "status": "COMPLETED", "recursive": true}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/watchstatus

# Remove show from favorites
curl -X DELETE \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/favorites/1

# Get show recommendations
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/1/recommendations

# Get similar shows
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/1/similar
```

## Performance Optimization

### Caching Strategy
- Show metadata is cached for 1 hour
- Watch status updates invalidate relevant caches
- Episode data is cached per profile for 5 minutes
- Recommendations are cached for 30 minutes

### Batch Operations
- Use recursive updates for bulk episode status changes
- Minimize individual episode update calls
- Leverage the episode management endpoints for detailed tracking

### Data Loading
- Show lists include essential metadata for quick rendering
- Detailed show information requires separate API call
- Episode data is lazily loaded as needed

## Integration Notes

### TMDB Integration
- All show metadata is sourced from The Movie Database
- Images are served via TMDB CDN URLs
- Show data is automatically updated when TMDB information changes
- Cast, crew, and trailer information is fetched in real-time

### Related Endpoints
- Use [Seasons API](./seasons.md) for season-level operations
- Use [Episodes API](./episodes.md) for episode-level tracking
- Use [Search API](./search.md) to find shows to add
- Use [Statistics API](./statistics.md) to view watching progress

## Additional Notes

- Show images are served directly from TMDB CDN
- Watch progress is calculated automatically based on episode status
- Next episode information is determined by watch status and air dates
- Recent and upcoming episodes are calculated relative to current date
- Profile-specific tracking allows multiple users per account
- All watch status changes trigger real-time cache updates
- Show removal only removes from favorites; watch history is preserved
- Recursive updates are optimized for performance on large shows