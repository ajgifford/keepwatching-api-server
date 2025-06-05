[Home](../README.md)

# Statistics API Documentation

This document describes the endpoints available for retrieving statistical data about user accounts and profiles,
including show/movie counts, watch progress, and content analytics.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

Requests without valid authentication will receive a 401 Unauthorized response:

```json
{
  "message": "Authentication required",
  "error": "No valid authentication token provided"
}
```

## Data Structures

### Account Statistics Object

```typescript
{
  profileCount: number,
  uniqueContent: {
    showCount: number,
    movieCount: number
  },
  showStatistics: {
    total: number,
    watching: number,
    completed: number,
    notWatching: number,
    // ... other show metrics
  },
  movieStatistics: {
    total: number,
    watched: number,
    notWatched: number,
    // ... other movie metrics
  },
  episodeStatistics: {
    totalEpisodes: number,
    watchedEpisodes: number,
    unwatchedEpisodes: number,
    watchProgress: number // percentage
  }
}
```

### Profile Statistics Object

```typescript
{
  showStatistics: {
    total: number,
    watching: number,
    completed: number,
    notWatching: number,
    favoriteGenres: Array<{
      genre: string,
      count: number
    }>,
    // ... other show metrics
  },
  movieStatistics: {
    total: number,
    watched: number,
    notWatched: number,
    favoriteGenres: Array<{
      genre: string,
      count: number
    }>,
    // ... other movie metrics
  },
  episodeWatchProgress: {
    totalEpisodes: number,
    watchedEpisodes: number,
    unwatchedEpisodes: number,
    watchProgress: number, // percentage
    recentWatchActivity: Array<{
      date: string,
      episodesWatched: number
    }>
  }
}
```

## Endpoints

### Get Account Statistics

Retrieves comprehensive statistics for an entire account, aggregating data across all profiles.

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Response Format

```typescript
{
  message: string,
  results: {
    profileCount: number,
    uniqueContent: {
      showCount: number,
      movieCount: number
    },
    showStatistics: ShowStatistics,
    movieStatistics: MovieStatistics,
    episodeStatistics: EpisodeStatistics
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account statistics",
  "results": {
    "profileCount": 3,
    "uniqueContent": {
      "showCount": 25,
      "movieCount": 42
    },
    "showStatistics": {
      "total": 25,
      "watching": 8,
      "completed": 12,
      "notWatching": 5,
      "totalSeasons": 87,
      "averageRating": 8.2,
      "favoriteGenres": [
        {
          "genre": "Drama",
          "count": 9
        },
        {
          "genre": "Comedy",
          "count": 7
        },
        {
          "genre": "Action",
          "count": 5
        }
      ]
    },
    "movieStatistics": {
      "total": 42,
      "watched": 35,
      "notWatched": 7,
      "totalRuntime": 4680, // minutes
      "averageRating": 7.8,
      "favoriteGenres": [
        {
          "genre": "Action",
          "count": 15
        },
        {
          "genre": "Comedy",
          "count": 12
        },
        {
          "genre": "Drama",
          "count": 8
        }
      ]
    },
    "episodeStatistics": {
      "totalEpisodes": 1250,
      "watchedEpisodes": 892,
      "unwatchedEpisodes": 358,
      "watchProgress": 71.4,
      "totalWatchTime": 44600, // minutes
      "averageEpisodeLength": 45
    }
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found
- 500: Server error

---

### Get Profile Statistics

Retrieves detailed statistics for a specific profile within an account.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  results: {
    showStatistics: ShowStatistics,
    movieStatistics: MovieStatistics,
    episodeWatchProgress: EpisodeWatchProgress
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved profile statistics",
  "results": {
    "showStatistics": {
      "total": 15,
      "watching": 5,
      "completed": 8,
      "notWatching": 2,
      "totalSeasons": 42,
      "averageRating": 8.5,
      "favoriteGenres": [
        {
          "genre": "Drama",
          "count": 6
        },
        {
          "genre": "Thriller",
          "count": 4
        },
        {
          "genre": "Comedy",
          "count": 3
        }
      ],
      "mostWatchedShow": {
        "title": "Breaking Bad",
        "episodesWatched": 62,
        "totalEpisodes": 62,
        "completionPercentage": 100
      }
    },
    "movieStatistics": {
      "total": 28,
      "watched": 22,
      "notWatched": 6,
      "totalRuntime": 3240, // minutes
      "averageRating": 7.9,
      "favoriteGenres": [
        {
          "genre": "Action",
          "count": 10
        },
        {
          "genre": "Comedy",
          "count": 8
        },
        {
          "genre": "Drama",
          "count": 6
        }
      ],
      "recentlyWatched": [
        {
          "title": "Dune: Part Two",
          "watchedDate": "2025-05-28",
          "rating": 9.1
        }
      ]
    },
    "episodeWatchProgress": {
      "totalEpisodes": 487,
      "watchedEpisodes": 352,
      "unwatchedEpisodes": 135,
      "watchProgress": 72.3,
      "totalWatchTime": 15840, // minutes
      "averageWatchSession": 180, // minutes
      "recentWatchActivity": [
        {
          "date": "2025-06-04",
          "episodesWatched": 3,
          "minutesWatched": 135
        },
        {
          "date": "2025-06-03",
          "episodesWatched": 2,
          "minutesWatched": 90
        },
        {
          "date": "2025-06-02",
          "episodesWatched": 4,
          "minutesWatched": 180
        }
      ],
      "bingingStreak": {
        "currentStreak": 5, // days
        "longestStreak": 12,
        "showTitle": "Stranger Things"
      }
    }
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Account or profile not found
- 500: Server error

## Statistics Metrics

### Show Statistics

| Metric            | Description                          |
| ----------------- | ------------------------------------ |
| `total`           | Total number of shows in favorites   |
| `watching`        | Shows currently being watched        |
| `completed`       | Shows that have been fully watched   |
| `notWatching`     | Shows not currently being watched    |
| `totalSeasons`    | Combined seasons across all shows    |
| `averageRating`   | Average user rating of all shows     |
| `favoriteGenres`  | Most popular genres by count         |
| `mostWatchedShow` | Show with highest episode completion |

### Movie Statistics

| Metric            | Description                         |
| ----------------- | ----------------------------------- |
| `total`           | Total number of movies in favorites |
| `watched`         | Movies that have been watched       |
| `notWatched`      | Movies not yet watched              |
| `totalRuntime`    | Combined runtime in minutes         |
| `averageRating`   | Average user rating of all movies   |
| `favoriteGenres`  | Most popular genres by count        |
| `recentlyWatched` | Recently viewed movies              |

### Episode Statistics

| Metric                | Description                                |
| --------------------- | ------------------------------------------ |
| `totalEpisodes`       | Total episodes across all shows            |
| `watchedEpisodes`     | Episodes marked as watched                 |
| `unwatchedEpisodes`   | Episodes not yet watched                   |
| `watchProgress`       | Overall completion percentage              |
| `totalWatchTime`      | Total time spent watching (minutes)        |
| `averageWatchSession` | Average viewing session length             |
| `recentWatchActivity` | Daily watch activity history               |
| `bingingStreak`       | Current and longest binge-watching streaks |

## Authorization

All statistics endpoints require that:

- The user is authenticated
- The user owns the account specified in the URL
- For profile-specific statistics, the profile must belong to the specified account

## Caching

Statistics are calculated in real-time but may be cached for performance:

- Account statistics: Cached for 5 minutes
- Profile statistics: Cached for 3 minutes
- Cache automatically invalidates when watch status changes

## Error Responses

### Authentication Required (401 Unauthorized)

```json
{
  "error": "Authorization header missing or malformed"
}
```

### Access Forbidden (403 Forbidden)

```json
{
  "error": "You do not have permission to access this account"
}
```

```json
{
  "error": "Access forbidden to this profile, it does not belong to the provided account"
}
```

### Account Not Found (404 Not Found)

```json
{
  "error": "Account not found"
}
```

### Profile Not Found (404 Not Found)

```json
{
  "error": "Profile not found"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

### JavaScript/TypeScript Examples

```typescript
// Get account statistics
async function getAccountStatistics(accountId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/statistics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get profile statistics
async function getProfileStatistics(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/statistics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Calculate watch time in hours
function formatWatchTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// Display statistics summary
async function displayStatsSummary(accountId: number, token: string) {
  const stats = await getAccountStatistics(accountId, token);
  const { results } = stats;

  console.log(`Account Summary:`);
  console.log(`- Profiles: ${results.profileCount}`);
  console.log(`- Shows: ${results.uniqueContent.showCount}`);
  console.log(`- Movies: ${results.uniqueContent.movieCount}`);
  console.log(`- Watch Progress: ${results.episodeStatistics.watchProgress}%`);
  console.log(`- Total Watch Time: ${formatWatchTime(results.episodeStatistics.totalWatchTime)}`);
}
```

### cURL Examples

```bash
# Get account statistics
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/statistics

# Get profile statistics
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/statistics
```

## Additional Notes

- Statistics are calculated based on current watch status data
- Genre statistics are derived from TMDB metadata
- Watch time calculations include estimated episode durations
- Recent activity data covers the last 30 days
- Binge-watching streaks are calculated based on consecutive viewing days
- Rating averages exclude unrated content
- All time-based metrics are provided in minutes for consistency
- Statistics automatically update when watch status changes
- Account-level statistics aggregate data across all profiles
- Profile-level statistics provide detailed individual viewing patterns
