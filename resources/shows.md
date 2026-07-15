[TV Series](./tvSeries.md) > Shows

# Shows API Documentation

This document describes the endpoints available for managing TV shows, including adding/removing favorites, updating
watch status, and discovering new content.

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
  watchStatus: 'UNAIRED' | 'NOT_WATCHED' | 'WATCHING' | 'WATCHED' | 'UP_TO_DATE',
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

### Show Details Object (`showWithSeasons`)

The `GET .../shows/{showId}/details` endpoint returns the show merged with its seasons/episodes, not a single object
containing `cast`/`crew`/`trailers` — those are returned separately as `showCast` (see below).

```typescript
{
  ...Show,
  seasons?: Array<{
    season_id: number,
    season_number: number,
    name: string,
    description: string,
    poster_url: string,
    air_date: string,
    episode_count: number,
    watchStatus: 'UNAIRED' | 'NOT_WATCHED' | 'WATCHING' | 'WATCHED' | 'UP_TO_DATE' | 'SKIPPED',
    episodes: Array<Episode>
  }>
}
```

### Show Cast Object (`showCast`)

```typescript
{
  activeCast: Array<{
    contentId: number,
    personId: number,
    characterName: string,
    order: number,
    name: string,
    profileImage: string,
    episodeCount: number,
    active: true
  }>,
  priorCast: Array<{
    contentId: number,
    personId: number,
    characterName: string,
    order: number,
    name: string,
    profileImage: string,
    episodeCount: number,
    active: false
  }>
}
```

There is no separate `crew` or `trailers` array in the current API — cast members who are no longer part of the show are
surfaced in `priorCast` rather than a distinct crew list.

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
      "watchStatus": "WATCHED",
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

Retrieves comprehensive details for a specific show including seasons, episodes, and cast information.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/shows/{showId}/details`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `showId` (path, required): Unique identifier of the show

#### Response Format

The response has two top-level data fields — `showWithSeasons` (the show plus its season/episode hierarchy) and
`showCast` (active and prior cast members) — not a single nested `show` object.

```typescript
{
  message: string,
  showWithSeasons: ShowDetailsObject, // see "Show Details Object" above
  showCast: ShowCastObject // see "Show Cast Object" above
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved a show and its details",
  "showWithSeasons": {
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
    "watchStatus": "WATCHED",
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
        "watchStatus": "WATCHED",
        "episodes": []
      }
    ]
  },
  "showCast": {
    "activeCast": [
      {
        "contentId": 1,
        "personId": 3231,
        "characterName": "Walter White",
        "order": 0,
        "name": "Bryan Cranston",
        "profileImage": "/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg",
        "episodeCount": 62,
        "active": true
      }
    ],
    "priorCast": []
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

Adds a TV show to a profile's favorites list. If the show doesn't exist in the system, it will be fetched from TMDB and
created.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/shows/favorites`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "showTMDBId": 1396,
  "restoreFromHistory": false
}
```

#### Request Body Fields

- `showTMDBId` (required): TMDB ID of the show to add
- `restoreFromHistory` (optional, default: `false`): If `true` and the show has surviving watch history from a previous
  favorite/unfavorite cycle (see `removeHistory` below), rebuilds the show's watch status from that history instead of
  starting fresh as `NOT_WATCHED`/`UNAIRED`

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
  },
  hasSurvivingHistory: boolean
}
```

`hasSurvivingHistory` indicates whether the show had prior watch history available to restore (regardless of whether
`restoreFromHistory` was actually set to `true`).

#### Example Response

```json
{
  "message": "Successfully saved show as a favorite",
  "addedShow": {
    "show_id": 1,
    "title": "Breaking Bad",
    "description": "A high school chemistry teacher diagnosed with inoperable lung cancer...",
    "tmdb_id": 1396,
    "watchStatus": "NOT_WATCHED",
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
  },
  "hasSurvivingHistory": false
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

#### Query Parameters

- `removeHistory` (optional, default: `false`): If `true`, also deletes the profile's watch history for the show instead
  of preserving it for a future `restoreFromHistory` re-add

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

Updates the watch status of a show. There is no `recursive` flag — the update always cascades to all seasons and
episodes in the show.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/shows/watchstatus`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "showId": 1,
  "status": "WATCHED"
}
```

#### Request Body Fields

- `showId` (required): ID of the show to update
- `status` (required): New watch status — user-settable values are `NOT_WATCHED` or `WATCHED` only. There is no
  `recursive` flag; the update always cascades (see "Watch Status Behavior" below).

#### Response Format

```typescript
{
  message: string,
  statusData: {
    showWithSeasons: ShowDetailsObject, // the show with its full season/episode hierarchy, post-update
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
  "message": "Successfully updated the watch status to 'WATCHED'",
  "statusData": {
    "showWithSeasons": {
      "show_id": 1,
      "title": "Breaking Bad",
      "watchStatus": "WATCHED",
      "totalSeasons": 5,
      "totalEpisodes": 62,
      "watchedEpisodes": 62,
      "watchProgress": 100,
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
- 404: Show not found
- 500: Server error

---

### Mark Prior Seasons as Watched

Marks some or all of a show's seasons as previously watched, using each episode's air date as the watched date so that
viewing statistics remain accurate. Intended for the "I've already seen this" flow when adding an existing show to
favorites, rather than marking every episode as watched "now."

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/shows/priorWatchStatus`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "showId": 1,
  "upToSeasonNumber": 3
}
```

#### Request Body Fields

- `showId` (required): ID of the show to update
- `upToSeasonNumber` (optional): If provided, only seasons up to and including this season number are marked as
  previously watched; if omitted, all currently-aired seasons are marked

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
  "message": "Successfully marked prior seasons as previously watched",
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

### Status Values

The full `WatchStatus` enum used across shows, seasons, and episodes is `UNAIRED | NOT_WATCHED | WATCHING | WATCHED |
UP_TO_DATE | SKIPPED`. Not every value is settable by a user or applicable to every entity type:

- **User-settable show status** (`PUT .../shows/watchstatus`): `NOT_WATCHED` or `WATCHED` only.
- **Computed/response show status**: any of `UNAIRED`, `NOT_WATCHED`, `WATCHING`, `WATCHED`, `UP_TO_DATE`.
  - `UNAIRED`: The show hasn't aired yet.
  - `NOT_WATCHED`: The show has aired but no episodes have been watched.
  - `WATCHING`: Some but not all currently-aired episodes have been watched.
  - `UP_TO_DATE`: All currently-aired episodes have been watched, but the show is still airing/in production (more
    episodes are expected).
  - `WATCHED`: All episodes have been watched and the show is no longer in production (fully complete).
  - `SKIPPED` is a season-only status (see [Seasons API](./seasons.md)) and is never returned as a show's own
    `watchStatus`, though a skipped season counts toward the show being "complete" for `UP_TO_DATE`/`WATCHED`
    purposes.

### No `recursive` Flag — Updates Always Cascade

There is no `recursive` option on the watch status request body; updating a show's watch status always propagates to
every season and episode in that show, and the reverse is also true — updating an episode or season recalculates its
parents. Specifically:

- **Setting a show to `WATCHED`**: Marks every currently-aired episode across all seasons as `WATCHED`, then
  recalculates each season's status from its episodes.
- **Setting a show to `NOT_WATCHED`**: Marks every currently-aired episode as `NOT_WATCHED`, then recalculates each
  season's status from its episodes.
- **Setting a season's status**: Cascades to that season's episodes (except `SKIPPED`, which is stored on the season
  without touching episode-level status) and then recalculates the parent show's status from all of its seasons.
- **Setting an episode's status**: Recalculates the parent season's status from its episodes, then recalculates the
  show's status from its seasons.

Show and season status are otherwise never stored as a fixed value that drifts from their children — they're
recomputed bottom-up any time a child's status changes, using the aired/unaired episode counts described above.

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
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ showTMDBId: tmdbId }),
  });
  return await response.json();
}

// Get show details
async function getShowDetails(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/${showId}/details`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Update watch status
async function updateShowWatchStatus(
  accountId: number,
  profileId: number,
  showId: number,
  status: 'NOT_WATCHED' | 'WATCHED',
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/watchstatus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ showId, status }),
  });
  return await response.json();
}

// Remove show from favorites
async function removeShowFromFavorites(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/favorites/${showId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get show recommendations
async function getShowRecommendations(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/${showId}/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
    console.log(`Added: ${showDetails.showWithSeasons.title} (${showDetails.showWithSeasons.totalEpisodes} episodes)`);

    // 3. Get recommendations based on this show
    console.log('Getting recommendations...');
    const recommendations = await getShowRecommendations(accountId, profileId, showId, token);
    console.log(`Found ${recommendations.shows.length} recommended shows`);

    // 4. Mark the show as fully watched (cascades to all seasons/episodes automatically)
    console.log('Marking as watched...');
    await updateShowWatchStatus(accountId, profileId, showId, 'WATCHED', token);
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

# Update watch status (mark as watched; automatically cascades to all seasons/episodes)
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"showId": 1, "status": "WATCHED"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/watchstatus

# Mark seasons 1-3 as previously watched
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"showId": 1, "upToSeasonNumber": 3}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/priorWatchStatus

# Remove show from favorites (also delete its watch history)
curl -X DELETE \
  -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/profiles/456/shows/favorites/1?removeHistory=true"

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

- Show and season watch status updates cascade to all children automatically — prefer them over many individual
  episode update calls for bulk status changes
- Use the "Mark Prior Seasons as Watched" endpoint for backfilling watch history without touching current timestamps
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
- Cast information (active and prior) is fetched in real-time

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
- Show removal only removes from favorites; watch history is preserved by default (pass `removeHistory=true` to also
  delete it)
- Watch status cascades are applied in a single transaction for consistency, even on large shows
