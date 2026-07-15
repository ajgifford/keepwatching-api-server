[Home](../README.md)

# Watch History API Documentation

This document describes the endpoints for reviewing a profile's watch history, retroactively flagging historical watches
as "prior watches" (pre-dating use of the app), and starting rewatches of shows, seasons, movies, and episodes.

Before integrating, read [Concepts](#concepts) below — this resource covers three related but distinct behaviors
(prior-watch tracking, show/season/movie rewatch, and episode rewatch) that are easy to conflate but affect the system
very differently.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}`. Most routes live under
`/watchHistory`, with the four rewatch endpoints instead nested under their respective content-type resource
(`/shows/{showId}/rewatch`, `/seasons/{seasonId}/rewatch`, `/movies/{movieId}/rewatch`, `/episodes/{episodeId}/rewatch`)
so they sit alongside the other show/season/movie/episode operations documented in [TV Series](./tvSeries.md) and
[Movies](./movies.md).

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Concepts

This resource touches three mechanisms that all sound similar but behave differently:

### Prior-Watch Tracking

"Prior watch" means content that was watched **before the user started tracking it in KeepWatching** — for example,
someone who binged all of _Breaking Bad_ years ago and then adds it to their favorites and bulk-marks it watched so
their library looks complete. Flagging these entries as prior watches (`isPriorWatch: true`) excludes them from
velocity, streak, binge-pattern, and other time-based statistics so a bulk historical mark doesn't skew analytics that
are supposed to reflect real-time viewing behavior. Prior-watch flagging **does not change watch status** — the content
is already `WATCHED`; it only changes how that watch event is treated statistically. Two endpoints support this:

- `GET /watchHistory/bulkMarked` proactively surfaces shows that look like they were bulk-marked (many episodes marked
  watched on the same day, none already flagged as prior) so the UI can prompt the user to review them.
- `POST /watchHistory/markAsPrior` and `POST /watchHistory/dismiss` let the user either retroactively flag the detected
  episodes as prior watches (backdating `watchedAt` to each episode's air date) or dismiss the suggestion without
  changing the watch dates.

### Show / Season / Movie Rewatch

Starting a rewatch of a show, season, or movie **resets watch status** back to not-watched (episodes/seasons back to
`NOT_WATCHED`, or the movie itself, depending on content type) and increments a `rewatch_count` counter on the content's
watch-status row. This is what makes rewatch statistics possible and is also why the content reappears in "Keep
Watching" — it now has unwatched episodes again. Movies are the exception: a movie rewatch is instantaneous (there's
nothing to "watch through" episode by episode), so it stays `WATCHED`, just with `watched_at` bumped to now and a new
`movie_watch_history` row appended.

### Episode Rewatch

Logging a rewatch of a single episode is a lightweight, "casual" action — a user rewatching one favorite episode without
wanting to reset the whole show. It **does not change watch status** at all (the episode, season, and show all stay
exactly as they were) and does not touch `rewatch_count`. It only appends a new row to `episode_watch_history` and
returns the episode's updated total watch count, which feeds the episode-level rewatch badge and statistics.

## Data Structures

### Watch History Item Object

A single entry in a profile's watch history, covering both episodes and movies. Each entry represents one watch event,
so rewatched content produces multiple entries distinguished by `watchNumber`.

```typescript
{
  historyId: number,
  contentType: 'episode' | 'movie',
  contentId: number,
  title: string,
  parentTitle: string | null,    // show title for episodes; null for movies
  seasonNumber: number | null,   // null for movies
  episodeNumber: number | null,  // null for movies
  posterImage: string,
  watchedAt: string,             // ISO timestamp
  watchNumber: number,           // 1 for the first watch, 2 for the first rewatch, etc.
  isPriorWatch: boolean,
  runtime: number                // minutes
}
```

### Bulk-Marked Show Object

A show detected as a likely candidate for retroactive prior-watch flagging.

```typescript
{
  showId: number,
  title: string,
  posterImage: string,
  markDate: string,     // YYYY-MM-DD, the date on which many episodes were marked watched
  episodeCount: number  // number of episodes marked watched on markDate
}
```

### Watch Status Data Object (Show / Season Rewatch Result)

Returned by the show and season rewatch endpoints. Mirrors the shape used elsewhere in the API after a watch-status
change so the client can refresh both the affected show and its Keep Watching entry in one round trip.

```typescript
{
  showWithSeasons: ShowDetails,        // full show + season/episode hierarchy — see Shows API
  nextUnwatchedEpisodes: Array<{
    showId: number,
    showTitle: string,
    posterImage: string,
    lastWatched: string,               // ISO timestamp
    episodes: Array<{
      episodeId: number,
      episodeTitle: string,
      overview: string,
      episodeNumber: number,
      seasonNumber: number,
      episodeStillImage: string,
      airDate: string,
      showId: number,
      showName: string,
      seasonId: number,
      posterImage: string,
      network: string,
      streamingServices: string,
      profileId: number
    }>
  }>
}
```

`showWithSeasons` follows the same shape as the Show Details object documented in the
[Shows API](./shows.md#get-show-details).

### Episode Rewatch Result Object

Returned by the episode rewatch endpoint.

```typescript
{
  episodeId: number,
  watchCount: number,  // total number of times this episode has been watched, including this rewatch
  watchedAt: string    // ISO timestamp of this rewatch event
}
```

## Endpoints

### Get Bulk-Marked Shows

Retrieves shows that appear to have been bulk-marked watched in one sitting — candidates for retroactive prior-watch
flagging. A show is a candidate when many of its episodes were marked `WATCHED` on the same calendar day and none of
those episodes are already flagged as prior watches.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/watchHistory/bulkMarked`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  shows: Array<BulkMarkedShow>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved bulk-marked shows",
  "shows": [
    {
      "showId": 1,
      "title": "Breaking Bad",
      "posterImage": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "markDate": "2026-06-01",
      "episodeCount": 62
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

### Get Watch History

Retrieves a paginated, filterable list of a profile's watch history across episodes and movies.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/watchHistory`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Query Parameters

- `page` (optional, default: `1`): 1-based page number
- `pageSize` (optional, default: `20`, min `1`, max `100`): Items per page
- `contentType` (optional, default: `'all'`): `'episode'`, `'movie'`, or `'all'`
- `sortOrder` (optional, default: `'desc'`): Sort direction on `watchedAt`; `'asc'` or `'desc'`
- `dateFrom` (optional): Inclusive lower bound on `watchedAt`, as a `YYYY-MM-DD` date string
- `dateTo` (optional): Inclusive upper bound on `watchedAt` (full day), as a `YYYY-MM-DD` date string
- `isPriorWatchOnly` (optional, default: `false`): When `true`, only return entries flagged as prior watches
- `excludePriorWatch` (optional, default: `false`): When `true`, exclude entries flagged as prior watches
- `searchQuery` (optional, max 200 chars): Filters episodes by show name and movies by title (partial match)

#### Response Format

```typescript
{
  message: string,
  items: Array<WatchHistoryItem>,
  totalCount: number,
  page: number,
  pageSize: number
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved watch history",
  "items": [
    {
      "historyId": 1001,
      "contentType": "episode",
      "contentId": 5042,
      "title": "Pilot",
      "parentTitle": "Breaking Bad",
      "seasonNumber": 1,
      "episodeNumber": 1,
      "posterImage": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      "watchedAt": "2026-07-10T20:30:00.000Z",
      "watchNumber": 1,
      "isPriorWatch": false,
      "runtime": 58
    },
    {
      "historyId": 998,
      "contentType": "movie",
      "contentId": 27205,
      "title": "Inception",
      "parentTitle": null,
      "seasonNumber": null,
      "episodeNumber": null,
      "posterImage": "https://image.tmdb.org/t/p/w500/inception_poster.jpg",
      "watchedAt": "2026-07-08T21:15:00.000Z",
      "watchNumber": 2,
      "isPriorWatch": false,
      "runtime": 148
    }
  ],
  "totalCount": 342,
  "page": 1,
  "pageSize": 20
}
```

**Status Codes:**

- 200: Success
- 400: Invalid query parameters
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Mark Show as Prior Watch

Retroactively flags previously-watched episodes of a show as prior watches, backdating `watchedAt` to each episode's
original air date so it no longer skews time-based statistics.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/watchHistory/markAsPrior`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "showId": 1,
  "seasonIds": [1, 2, 3]
}
```

- `showId` (required): ID of the show whose watched episodes should be flagged
- `seasonIds` (optional): Restrict flagging to specific season IDs; when omitted, all watched seasons of the show are
  flagged

#### Response Format

```typescript
{
  message: string;
}
```

#### Example Response

```json
{
  "message": "Successfully marked show episodes as previously watched"
}
```

**Status Codes:**

- 200: Success
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 404: Show not found
- 500: Server error

---

### Dismiss Bulk-Marked Show

Dismisses a bulk-marked show from the review list without changing its watch dates. Internally this still flags the
show's episodes as prior watches (so it stops reappearing in [Get Bulk-Marked Shows](#get-bulk-marked-shows)), but sets
`watchedAt` to each episode's existing `updatedAt` rather than its air date — use
[Mark Show as Prior Watch](#mark-show-as-prior-watch) instead if you want air-date-aligned timestamps.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/watchHistory/dismiss`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "showId": 1
}
```

#### Response Format

```typescript
{
  message: string;
}
```

#### Example Response

```json
{
  "message": "Successfully dismissed show from watch history review"
}
```

**Status Codes:**

- 200: Success
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Start Show Rewatch

Resets all episodes and seasons of a show to `NOT_WATCHED` and increments its rewatch count, so the user can rewatch it
from the beginning while the show continues to appear in Keep Watching.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/shows/{showId}/rewatch`

This endpoint takes no request body.

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `showId` (path, required): Unique identifier of the show to rewatch

#### Response Format

```typescript
{
  message: string,
  statusData: {
    showWithSeasons: ShowDetails,
    nextUnwatchedEpisodes: Array<KeepWatchingShow>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully started show rewatch",
  "statusData": {
    "showWithSeasons": {
      "show_id": 1,
      "title": "Breaking Bad",
      "watchStatus": "NOT_WATCHING",
      "watchedEpisodes": 0,
      "totalEpisodes": 62,
      "watchProgress": 0
    },
    "nextUnwatchedEpisodes": [
      {
        "showId": 1,
        "showTitle": "Breaking Bad",
        "posterImage": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        "lastWatched": "2026-07-10T20:30:00.000Z",
        "episodes": [
          {
            "episodeId": 1,
            "episodeTitle": "Pilot",
            "overview": "A high school chemistry teacher discovers he has cancer.",
            "episodeNumber": 1,
            "seasonNumber": 1,
            "episodeStillImage": "https://image.tmdb.org/t/p/w500/still.jpg",
            "airDate": "2008-01-20",
            "showId": 1,
            "showName": "Breaking Bad",
            "seasonId": 1,
            "posterImage": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
            "network": "AMC",
            "streamingServices": "Netflix",
            "profileId": 456
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
- 404: Show not found
- 500: Server error

---

### Start Season Rewatch

Resets all episodes in a single season to `NOT_WATCHED`. The parent show's status is then recalculated from the
remaining season statuses (`WATCHING` if any other season is still non-`NOT_WATCHED`, otherwise `NOT_WATCHED`).

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/seasons/{seasonId}/rewatch`

This endpoint takes no request body.

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `seasonId` (path, required): Unique identifier of the season to rewatch

#### Response Format

```typescript
{
  message: string,
  statusData: {
    showWithSeasons: ShowDetails,
    nextUnwatchedEpisodes: Array<KeepWatchingShow>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully started season rewatch",
  "statusData": {
    "showWithSeasons": {
      "show_id": 1,
      "title": "Breaking Bad",
      "watchStatus": "WATCHING",
      "watchedEpisodes": 55,
      "totalEpisodes": 62,
      "watchProgress": 88.7
    },
    "nextUnwatchedEpisodes": []
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 404: Season not found
- 500: Server error

---

### Start Movie Rewatch

Records an instant movie rewatch. Unlike show/season rewatch, the movie's status stays `WATCHED` — `watched_at` is
bumped to now, `rewatch_count` is incremented, and a new row is appended to the movie's watch history.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/movies/{movieId}/rewatch`

This endpoint takes no request body.

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `movieId` (path, required): Unique identifier of the movie to rewatch

#### Response Format

```typescript
{
  message: string,
  movie: ProfileMovie
}
```

#### Example Response

```json
{
  "message": "Successfully started movie rewatch",
  "movie": {
    "id": 1,
    "tmdbId": 27205,
    "title": "Inception",
    "description": "A thief who steals corporate secrets through dream-sharing technology...",
    "releaseDate": "2010-07-16",
    "posterImage": "https://image.tmdb.org/t/p/w500/inception_poster.jpg",
    "backdropImage": "https://image.tmdb.org/t/p/original/inception_backdrop.jpg",
    "runtime": 148,
    "userRating": 8.8,
    "mpaRating": "PG-13",
    "genres": "Action, Drama, Sci-Fi, Thriller",
    "streamingServices": "Netflix, HBO Max",
    "profileId": 456,
    "watchStatus": "WATCHED"
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 404: Movie not found
- 500: Server error

---

### Record Episode Rewatch

Logs a casual single-episode rewatch. This is a lightweight append — it does **not** reset watch status on the episode,
season, or show, and does not affect `rewatch_count`. It only records a new watch event and returns the episode's
updated total watch count.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/episodes/{episodeId}/rewatch`

This endpoint takes no request body.

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `episodeId` (path, required): Unique identifier of the episode to rewatch

#### Response Format

```typescript
{
  message: string,
  episodeId: number,
  watchCount: number,
  watchedAt: string
}
```

#### Example Response

```json
{
  "message": "Successfully recorded episode rewatch",
  "episodeId": 1,
  "watchCount": 3,
  "watchedAt": "2026-07-14T18:45:00.000Z"
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 404: Episode not found
- 500: Server error

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "showId",
      "message": "Show ID must be a positive integer"
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

### Not Found Errors (404 Not Found)

```json
{
  "error": "Show not found"
}
```

### Server Errors (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

### Complete Watch History Workflow

```typescript
// Get shows flagged as candidates for retroactive prior-watch review
async function getBulkMarkedShows(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchHistory/bulkMarked`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Retroactively mark a show's watched episodes as prior watches
async function markShowAsPrior(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchHistory/markAsPrior`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ showId }),
  });
  return await response.json();
}

// Dismiss a bulk-marked show from review without backdating watch times
async function dismissBulkMarkedShow(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchHistory/dismiss`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ showId }),
  });
  return await response.json();
}

// Get a page of watch history, most recent first
async function getWatchHistory(accountId: number, profileId: number, token: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20', sortOrder: 'desc' });
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/watchHistory?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Start rewatching a show from the beginning
async function rewatchShow(accountId: number, profileId: number, showId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/shows/${showId}/rewatch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Log a casual rewatch of a single episode
async function rewatchEpisode(accountId: number, profileId: number, episodeId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/episodes/${episodeId}/rewatch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Complete workflow example
async function reviewAndRewatch() {
  const token = 'your_jwt_token';
  const accountId = 123;
  const profileId = 456;

  try {
    // 1. Check for shows that look bulk-marked and need review
    const candidates = await getBulkMarkedShows(accountId, profileId, token);
    for (const show of candidates.shows) {
      console.log(`Marking "${show.title}" as prior-watched (${show.episodeCount} episodes)`);
      await markShowAsPrior(accountId, profileId, show.showId, token);
    }

    // 2. Browse recent watch history
    const history = await getWatchHistory(accountId, profileId, token);
    console.log(`Showing ${history.items.length} of ${history.totalCount} history entries`);

    // 3. Rewatch a favorite show from the start
    await rewatchShow(accountId, profileId, 1, token);

    // 4. Log a one-off rewatch of a favorite episode without resetting the show
    const rewatch = await rewatchEpisode(accountId, profileId, 15, token);
    console.log(`Episode has now been watched ${rewatch.watchCount} times`);
  } catch (error) {
    console.error('Error managing watch history:', error);
  }
}
```

### cURL Examples

```bash
# Get shows flagged for bulk-marked review
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/watchHistory/bulkMarked

# Get watch history (page 1, movies only)
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/profiles/456/watchHistory?page=1&contentType=movie"

# Retroactively mark a show's episodes as prior watches
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"showId": 1}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/watchHistory/markAsPrior

# Dismiss a bulk-marked show from review
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"showId": 1}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/watchHistory/dismiss

# Start a show rewatch
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/shows/1/rewatch

# Start a season rewatch
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/seasons/1/rewatch

# Start a movie rewatch
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/movies/1/rewatch

# Record a casual episode rewatch
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/episodes/1/rewatch
```

## Additional Notes

- Prior-watch flagging is purely a statistics concern — it never changes `watchStatus` and never touches
  `rewatch_count`. Use it for content watched before the user adopted KeepWatching.
- Show and season rewatch reset watch status back to `NOT_WATCHED` and increment `rewatch_count`, which is what drives
  rewatch statistics and re-surfaces the content in Keep Watching.
- Movie rewatch is the odd one out among the "resetting" rewatches: because a movie has no partial-progress state,
  rewatching it stays `WATCHED` and simply logs a new watch event with an updated timestamp.
- Episode rewatch is the lightest-weight of all four rewatch endpoints: no status changes anywhere in the
  show/season/episode hierarchy, just a new `episode_watch_history` row and an incremented watch count for that one
  episode.
- Rewatch and prior-watch statistics surface on the [Statistics API](./statistics.md) dashboards (rewatch counts,
  streaks, and episode/season rewatch leaderboards).
- See [Shows API](./shows.md) and [Movies API](./movies.md) for the underlying content objects and their normal
  (non-rewatch) watch-status update endpoints.
