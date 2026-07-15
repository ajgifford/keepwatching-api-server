[Home](../README.md)

# Statistics API Documentation

This document describes the endpoints available for retrieving statistical data about user accounts and profiles,
including show/movie counts, watch progress, viewing velocity, binge patterns, streaks, milestones, content depth,
content discovery, abandonment risk, unaired content, rewatch/skip/watchlist behavior, and shareable recaps.

There are two endpoint families:

- **Account statistics** — aggregate data across every profile on an account.
- **Profile statistics** — data scoped to a single profile.

Most account-level endpoints work by fetching the equivalent profile-level statistic for every profile on the account
and combining the results (summing counts, averaging rates, merging/re-sorting top-N lists, and — where the source data
supports it — attaching a `profileName` to each entry so the origin profile can be identified). That relationship is
called out per endpoint below instead of being re-derived each time.

## Base URL

- Account statistics: `/api/v1/accounts/{accountId}/statistics`
- Profile statistics: `/api/v1/accounts/{accountId}/profiles/{profileId}/statistics`

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

All endpoints also require that the authenticated user owns the `accountId` in the path (enforced by the
`authorizeAccountAccess` middleware), and for profile-level endpoints, that `profileId` belongs to `accountId`.

## Query Parameter Conventions

Several endpoints accept an optional integer query parameter that windows the stats to a trailing period. These are
**not** validated by a zod schema (unlike path params) — the controller reads `req.query.<name>` and calls
`parseInt(..., 10)`, falling back to a hardcoded default when the parameter is absent:

- `days` — most common; window size in days. Endpoints that report "all-time" data by default use `36500` (~100 years)
  as their default so the window is effectively unbounded unless the caller narrows it.
- `weeks` — used only by the profile weekly-activity endpoint (default `12`).
- `months` — used only by the profile monthly-activity endpoint (default `12`).

Each endpoint's Parameters section below states its specific default. Passing a non-numeric value produces
`NaN`/undefined-window behavior since there is no schema validation on these query params — callers should always send a
valid integer when overriding the default.

## Data Structures

These shared shapes are referenced by multiple endpoints below rather than being redefined per endpoint.

### ShowStatisticsResponse

```typescript
{
  total: number,
  watchStatusCounts: {
    unaired: number,
    watched: number,
    watching: number,
    notWatched: number,
    upToDate: number
  },
  genreDistribution: Record<string, number>,
  serviceDistribution: Record<string, number>,
  watchProgress: number // percentage, 0-100
}
```

### MovieStatisticsResponse

```typescript
{
  movieReferences: Array<{ id: number, title: string, tmdbId: number }>,
  total: number,
  watchStatusCounts: {
    unaired: number,
    watched: number,
    notWatched: number
  },
  genreDistribution: Record<string, number>,
  serviceDistribution: Record<string, number>,
  watchProgress: number // percentage, 0-100
}
```

### DailyActivity / WeeklyActivity / MonthlyActivity

```typescript
DailyActivity: { date: string, episodesWatched: number, showsWatched: number }
WeeklyActivity: { weekStart: string, episodesWatched: number }
MonthlyActivity: { month: string, episodesWatched: number, moviesWatched: number } // month is "YYYY-MM"
```

### Milestone / Achievement

```typescript
Milestone: {
  type: 'episodes' | 'movies' | 'hours' | 'showsCompleted' | 'anniversary',
  threshold: number,
  achieved: boolean,
  progress: number // percentage, 0-100
}

Achievement: {
  description: string,
  achievedDate: string,
  achievementType:
    'EPISODES_WATCHED' | 'MOVIES_WATCHED' | 'HOURS_WATCHED' | 'FIRST_EPISODE' | 'FIRST_MOVIE' |
    'SHOW_COMPLETED' | 'WATCH_STREAK' | 'BINGE_SESSION' | 'PROFILE_ANNIVERSARY',
  thresholdValue: number,
  profileName?: string, // present on account-level aggregated achievements
  metadata?: {
    showTitle?: string, showId?: number, movieTitle?: string, movieId?: number,
    streakDays?: number, episodeCount?: number, [key: string]: any
  }
}
```

### AbandonmentRiskShow

```typescript
{
  showId: number,
  showTitle: string,
  daysSinceLastWatch: number,
  unwatchedEpisodes: number,
  status: string,
  profileName?: string // present on account-level aggregation
}
```

### Rewatch entities (RewatchedShow / RewatchedMovie / RewatchedEpisode / RewatchedSeason)

```typescript
RewatchedShow: { showId: number, showTitle: string, rewatchCount: number }
RewatchedMovie: { movieId: number, movieTitle: string, rewatchCount: number }
RewatchedEpisode: {
  episodeId: number, showId: number, showTitle: string,
  seasonNumber: number, episodeNumber: number, episodeTitle: string, rewatchCount: number
}
RewatchedSeason: {
  seasonId: number, showId: number, showTitle: string,
  seasonNumber: number, seasonName: string, rewatchCount: number
}
RewatchedShowEpisodeSummary: {
  showId: number, showTitle: string,
  totalEpisodesRewatched: number, totalRewatchCount: number,
  topEpisodes: RewatchedEpisode[]
}
```

Account-level rewatch endpoints return these same shapes with an added `profileName: string` field on every entry.

### SkippedShow / QueuedItemAge

```typescript
SkippedShow: { showId: number, showTitle: string, skippedSeasonCount: number }
QueuedItemAge: { contentId: number, contentType: 'show' | 'movie', title: string, daysInQueue: number }
```

Account-level skip-rate and watchlist-usage endpoints return these same shapes with an added `profileName: string` field
on every entry.

## Account Statistics Endpoints

Base path for all endpoints in this section: `/api/v1/accounts/{accountId}/statistics`. All require path param
`accountId` (positive integer) and pass through `authorizeAccountAccess` + `trackAccountActivity` middleware. Cache TTL
for every account-level statistic is **3600 seconds (1 hour)**, keyed by `accountId` (and `days` where applicable).

| Method | Path                             | Description                                                               |
| ------ | -------------------------------- | ------------------------------------------------------------------------- |
| GET    | `/statistics`                    | Show/movie/episode counts and progress, aggregated across all profiles    |
| GET    | `/statistics/velocity`           | Weighted-average watching pace across all profiles                        |
| GET    | `/statistics/activity/timeline`  | Merged daily/weekly/monthly activity across all profiles                  |
| GET    | `/statistics/binge`              | Merged binge-session stats and top binged shows across all profiles       |
| GET    | `/statistics/streaks`            | Account-wide max current/longest watch streaks                            |
| GET    | `/statistics/time-to-watch`      | Averaged days-to-start/complete and merged fastest completions            |
| GET    | `/statistics/seasonal`           | Summed viewing-by-month/season across all profiles                        |
| GET    | `/statistics/milestones`         | Summed lifetime totals, milestones, and merged achievements               |
| GET    | `/statistics/content-depth`      | Averaged episode-count/runtime and merged distributions                   |
| GET    | `/statistics/content-discovery`  | Averaged content addition rate and watch-to-add ratio                     |
| GET    | `/statistics/abandonment-risk`   | Merged at-risk shows and averaged abandonment rate                        |
| GET    | `/statistics/unaired-content`    | Summed unaired show/season/movie/episode counts                           |
| GET    | `/statistics/profile-comparison` | Side-by-side metrics for every profile on the account                     |
| GET    | `/statistics/rewatches`          | Summed rewatch totals and merged most-rewatched entities                  |
| GET    | `/statistics/skip-rate`          | Summed season skip totals and merged most-skipped shows                   |
| GET    | `/statistics/watchlist-usage`    | Summed watchlist queue/completion metrics and merged longest-queued items |

---

### 1. Get Account Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics`

**Controller:** `getAccountStatistics` → `accountStatisticsService.getAccountStatistics(accountId)`

#### Parameters

- `accountId` (path, required): positive integer

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved account statistics"
  results: {
    profileCount: number,
    uniqueContent: { showCount: number, movieCount: number },
    showStatistics: ShowStatisticsResponse,
    movieStatistics: MovieStatisticsResponse,
    episodeStatistics: {
      totalEpisodes: number,
      watchedEpisodes: number,
      watchProgress: number
    }
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account statistics",
  "results": {
    "profileCount": 3,
    "uniqueContent": { "showCount": 25, "movieCount": 42 },
    "showStatistics": {
      "total": 25,
      "watchStatusCounts": { "unaired": 3, "watched": 8, "watching": 5, "notWatched": 7, "upToDate": 2 },
      "genreDistribution": { "Drama": 9, "Comedy": 7, "Action": 5 },
      "serviceDistribution": { "Netflix": 15, "Disney+": 6, "HBO Max": 4 },
      "watchProgress": 68
    },
    "movieStatistics": {
      "movieReferences": [{ "id": 1, "title": "Inception", "tmdbId": 27205 }],
      "total": 42,
      "watchStatusCounts": { "unaired": 5, "watched": 30, "notWatched": 7 },
      "genreDistribution": { "Action": 15, "Comedy": 12, "Drama": 8 },
      "serviceDistribution": { "Netflix": 22, "Amazon Prime": 15 },
      "watchProgress": 81
    },
    "episodeStatistics": { "totalEpisodes": 1250, "watchedEpisodes": 892, "watchProgress": 71 }
  }
}
```

---

### 2. Get Account Watching Velocity

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/velocity`

**Controller:** `getAccountWatchingVelocity` → `accountStatisticsService.getAccountWatchingVelocity(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `30`)

#### Response Format

```typescript
{
  message: string,
  results: {
    episodesPerWeek: number,
    episodesPerMonth: number,
    averageEpisodesPerDay: number,
    mostActiveDay: string,
    mostActiveHour: number, // 0-23
    velocityTrend: 'increasing' | 'decreasing' | 'stable'
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account watching velocity statistics",
  "results": {
    "episodesPerWeek": 14.5,
    "episodesPerMonth": 62,
    "averageEpisodesPerDay": 2.1,
    "mostActiveDay": "Saturday",
    "mostActiveHour": 20,
    "velocityTrend": "increasing"
  }
}
```

---

### 3. Get Account Activity Timeline

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/activity/timeline`

**Controller:** `getAccountActivityTimeline` → `accountStatisticsService.getAccountActivityTimeline(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    dailyActivity: DailyActivity[],
    weeklyActivity: WeeklyActivity[],
    monthlyActivity: MonthlyActivity[]
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account activity timeline statistics",
  "results": {
    "dailyActivity": [{ "date": "2026-07-13", "episodesWatched": 5, "showsWatched": 2 }],
    "weeklyActivity": [{ "weekStart": "2026-07-06", "episodesWatched": 21 }],
    "monthlyActivity": [{ "month": "2026-07", "episodesWatched": 85, "moviesWatched": 12 }]
  }
}
```

---

### 4. Get Account Binge-Watching Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/binge`

**Controller:** `getAccountBingeWatchingStats` →
`accountStatisticsService.getAccountBingeWatchingStats(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    bingeSessionCount: number,
    averageEpisodesPerBinge: number,
    longestBingeSession: { profileName: string, showTitle: string, episodeCount: number, date: string },
    topBingedShows: Array<{ showId: number, showTitle: string, bingeSessionCount: number }> // top 10
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account binge watching statistics",
  "results": {
    "bingeSessionCount": 15,
    "averageEpisodesPerBinge": 4.5,
    "longestBingeSession": {
      "profileName": "Alice",
      "showTitle": "Breaking Bad",
      "episodeCount": 8,
      "date": "2026-06-15"
    },
    "topBingedShows": [{ "showId": 1, "showTitle": "The Office", "bingeSessionCount": 5 }]
  }
}
```

---

### 5. Get Account Watch Streak Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/streaks`

**Controller:** `getAccountWatchStreakStats` → `accountStatisticsService.getAccountWatchStreakStats(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    currentStreak: number, // max current streak across all profiles
    longestStreak: number, // max longest streak across all profiles
    currentStreakStartDate: string,
    longestStreakPeriod: { startDate: string, endDate: string, days: number },
    streaksOver7Days: number, // summed across profiles
    averageStreakLength: number // weighted average across profiles' 7+ day streaks
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account watch streak statistics",
  "results": {
    "currentStreak": 5,
    "longestStreak": 21,
    "currentStreakStartDate": "2026-07-10",
    "longestStreakPeriod": { "startDate": "2025-12-01", "endDate": "2025-12-21", "days": 21 },
    "streaksOver7Days": 3,
    "averageStreakLength": 9.5
  }
}
```

---

### 6. Get Account Time-to-Watch Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/time-to-watch`

**Controller:** `getAccountTimeToWatchStats` → `accountStatisticsService.getAccountTimeToWatchStats(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    averageDaysToStartShow: number, // averaged across profiles
    averageDaysToCompleteShow: number, // averaged across profiles
    fastestCompletions: Array<{ profileName: string, showId: number, showTitle: string, daysToComplete: number }>, // top 10
    backlogAging: { unwatchedOver30Days: number, unwatchedOver90Days: number, unwatchedOver365Days: number } // summed
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account time to watch statistics",
  "results": {
    "averageDaysToStartShow": 12.5,
    "averageDaysToCompleteShow": 45.2,
    "fastestCompletions": [{ "profileName": "Alice", "showId": 1, "showTitle": "Breaking Bad", "daysToComplete": 7 }],
    "backlogAging": { "unwatchedOver30Days": 5, "unwatchedOver90Days": 3, "unwatchedOver365Days": 1 }
  }
}
```

---

### 7. Get Account Seasonal Viewing Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/seasonal`

**Controller:** `getAccountSeasonalViewingStats` →
`accountStatisticsService.getAccountSeasonalViewingStats(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    viewingByMonth: Record<string, number>, // summed across profiles
    viewingBySeason: { spring: number, summer: number, fall: number, winter: number },
    peakViewingMonth: string,
    slowestViewingMonth: string
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account seasonal viewing statistics",
  "results": {
    "viewingByMonth": { "January": 45, "February": 38 },
    "viewingBySeason": { "spring": 120, "summer": 95, "fall": 110, "winter": 130 },
    "peakViewingMonth": "December",
    "slowestViewingMonth": "July"
  }
}
```

---

### 8. Get Account Milestone Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/milestones`

**Controller:** `getAccountMilestoneStats` → `accountStatisticsService.getAccountMilestoneStats(accountId)`

Sums lifetime totals across every profile, and also queries `accountsDb.findAccountById` for the account's own
`createdAt`. Milestones are recalculated against the summed totals using the same threshold tables as the profile-level
endpoint. `firstEpisodeWatchedAt`/`firstMovieWatchedAt` are the earliest such timestamps across all profiles.

#### Parameters

- `accountId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    totalEpisodesWatched: number,
    totalMoviesWatched: number,
    totalHoursWatched: number,
    totalShowsCompleted: number,
    createdAt?: string, // account creation date
    firstEpisodeWatchedAt?: string,
    firstMovieWatchedAt?: string,
    firstEpisodeMetadata?: Record<string, unknown>, // includes profileName
    firstMovieMetadata?: Record<string, unknown>,   // includes profileName
    milestones: Milestone[],
    recentAchievements: Achievement[], // top 10, each with profileName
    allAchievements: Achievement[]     // full history, each with profileName
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account milestone statistics",
  "results": {
    "totalEpisodesWatched": 1856,
    "totalMoviesWatched": 92,
    "totalHoursWatched": 1342,
    "totalShowsCompleted": 18,
    "createdAt": "2023-01-15T10:30:00Z",
    "firstEpisodeWatchedAt": "2023-01-20T14:25:00Z",
    "firstMovieWatchedAt": "2023-02-01T19:15:00Z",
    "milestones": [{ "type": "episodes", "threshold": 2000, "achieved": false, "progress": 92.8 }],
    "recentAchievements": [
      {
        "description": "500 Episodes Watched",
        "achievedDate": "2026-06-15",
        "achievementType": "EPISODES_WATCHED",
        "thresholdValue": 500,
        "profileName": "Alice"
      }
    ],
    "allAchievements": []
  }
}
```

---

### 9. Get Account Content Depth Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/content-depth`

**Controller:** `getAccountContentDepthStats` → `accountStatisticsService.getAccountContentDepthStats(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    averageEpisodeCountPerShow: number, // averaged across profiles
    averageMovieRuntime: number,        // averaged across profiles (minutes)
    releaseYearDistribution: Record<string, number>,    // summed across profiles
    contentMaturityDistribution: Record<string, number> // summed across profiles
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account content depth statistics",
  "results": {
    "averageEpisodeCountPerShow": 42.5,
    "averageMovieRuntime": 118,
    "releaseYearDistribution": { "2020-2024": 45, "2015-2019": 32 },
    "contentMaturityDistribution": { "TV-MA": 25, "TV-14": 35 }
  }
}
```

---

### 10. Get Account Content Discovery Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/content-discovery`

**Controller:** `getAccountContentDiscoveryStats` →
`accountStatisticsService.getAccountContentDiscoveryStats(accountId, days)`

#### Parameters

- `accountId` (path, required)
- `days` (query, optional, integer, default `30`)

#### Response Format

```typescript
{
  message: string,
  results: {
    daysSinceLastContentAdded: number, // minimum (most recent) across profiles
    contentAdditionRate: { showsPerMonth: number, moviesPerMonth: number }, // averaged across profiles
    watchToAddRatio: { shows: number, movies: number } // averaged across profiles
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account content discovery statistics",
  "results": {
    "daysSinceLastContentAdded": 3,
    "contentAdditionRate": { "showsPerMonth": 4.5, "moviesPerMonth": 8.2 },
    "watchToAddRatio": { "shows": 0.85, "movies": 1.2 }
  }
}
```

---

### 11. Get Account Abandonment Risk Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/abandonment-risk`

**Controller:** `getAccountAbandonmentRiskStats` → `accountStatisticsService.getAccountAbandonmentRiskStats(accountId)`

#### Parameters

- `accountId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    showsAtRisk: Array<AbandonmentRiskShow>, // top 20, sorted by daysSinceLastWatch desc, each with profileName
    showAbandonmentRate: number // percentage, averaged across profiles
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account abandonment risk statistics",
  "results": {
    "showsAtRisk": [
      {
        "showId": 123,
        "showTitle": "The Walking Dead",
        "daysSinceLastWatch": 45,
        "unwatchedEpisodes": 23,
        "status": "WATCHING",
        "profileName": "Bob"
      }
    ],
    "showAbandonmentRate": 18.5
  }
}
```

---

### 12. Get Account Unaired Content Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/unaired-content`

**Controller:** `getAccountUnairedContentStats` → `accountStatisticsService.getAccountUnairedContentStats(accountId)`

#### Parameters

- `accountId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    unairedShowCount: number,
    unairedSeasonCount: number,
    unairedMovieCount: number,
    unairedEpisodeCount: number
  } // all summed across profiles
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account unaired content statistics",
  "results": { "unairedShowCount": 5, "unairedSeasonCount": 8, "unairedMovieCount": 12, "unairedEpisodeCount": 45 }
}
```

---

### 13. Get Account Profile Comparison

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/profile-comparison`

**Controller:** `getProfileComparison` → `accountStatisticsService.getProfileComparison(accountId)`

Unlike the other account endpoints, this one is sourced from a dedicated SQL aggregation
(`statisticsDb.getProfileComparisonData`) rather than by combining each profile's individual statistics response.

#### Parameters

- `accountId` (path, required)

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved profile comparison"
  results: {
    accountId: number,
    profileCount: number,
    profiles: Array<{
      profileId: number,
      profileName: string,
      totalShows: number,
      totalMovies: number,
      episodesWatched: number,
      moviesWatched: number,
      totalHoursWatched: number,
      showWatchProgress: number,
      movieWatchProgress: number,
      topGenres: Array<{ genre: string, count: number }>,   // top 3
      topServices: Array<{ service: string, count: number }>, // top 3
      episodesPerWeek: number,
      mostActiveDay: string,
      lastActivityDate: string | null,
      currentlyWatchingCount: number,
      completedShowsCount: number
    }>,
    accountSummary: {
      totalUniqueShows: number,
      totalUniqueMovies: number,
      mostWatchedShow: { showId: number, title: string, watchCount: number } | null,
      mostWatchedMovie: { movieId: number, title: string, watchCount: number } | null
    }
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved profile comparison",
  "results": {
    "accountId": 1,
    "profileCount": 2,
    "profiles": [
      {
        "profileId": 101,
        "profileName": "Alice",
        "totalShows": 15,
        "totalMovies": 28,
        "episodesWatched": 352,
        "moviesWatched": 22,
        "totalHoursWatched": 264,
        "showWatchProgress": 72,
        "movieWatchProgress": 79,
        "topGenres": [{ "genre": "Drama", "count": 6 }],
        "topServices": [{ "service": "Netflix", "count": 10 }],
        "episodesPerWeek": 14.5,
        "mostActiveDay": "Saturday",
        "lastActivityDate": "2026-07-13",
        "currentlyWatchingCount": 5,
        "completedShowsCount": 8
      }
    ],
    "accountSummary": {
      "totalUniqueShows": 25,
      "totalUniqueMovies": 42,
      "mostWatchedShow": { "showId": 1, "title": "Breaking Bad", "watchCount": 2 },
      "mostWatchedMovie": null
    }
  }
}
```

---

### 14. Get Account Rewatch Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/rewatches`

**Controller:** `getAccountRewatchStats` → `accountStatisticsService.getAccountRewatchStats(accountId)`

Sourced directly from `db/statistics/rewatchRepository.getAccountRewatchStats(accountId)` — a dedicated SQL aggregation,
not a per-profile combine.

#### Parameters

- `accountId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    totalShowRewatches: number,
    totalMovieRewatches: number,
    totalEpisodeRewatches: number,
    totalSeasonRewatches: number,
    mostRewatchedShows: Array<RewatchedShow & { profileName: string }>,
    mostRewatchedMovies: Array<RewatchedMovie & { profileName: string }>,
    mostRewatchedEpisodes: Array<RewatchedEpisode & { profileName: string }>,
    mostRewatchedSeasons: Array<RewatchedSeason & { profileName: string }>,
    topRewatchedShowsByEpisodes: Array<RewatchedShowEpisodeSummary & { profileName: string }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account rewatch statistics",
  "results": {
    "totalShowRewatches": 18,
    "totalMovieRewatches": 35,
    "totalEpisodeRewatches": 22,
    "totalSeasonRewatches": 9,
    "mostRewatchedShows": [{ "showId": 101, "showTitle": "Breaking Bad", "rewatchCount": 5, "profileName": "Alice" }],
    "mostRewatchedMovies": [{ "movieId": 550, "movieTitle": "Fight Club", "rewatchCount": 8, "profileName": "Bob" }],
    "mostRewatchedEpisodes": [
      {
        "episodeId": 5001,
        "showId": 101,
        "showTitle": "Breaking Bad",
        "seasonNumber": 1,
        "episodeNumber": 1,
        "episodeTitle": "Pilot",
        "rewatchCount": 3,
        "profileName": "Alice"
      }
    ],
    "mostRewatchedSeasons": [],
    "topRewatchedShowsByEpisodes": []
  }
}
```

---

### 15. Get Account Skip-Rate Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/skip-rate`

**Controller:** `getAccountSkipRateStats` → `accountStatisticsService.getAccountSkipRateStats(accountId)`

Sourced directly from `db/statistics/skipRateRepository.getAccountSkipRateStats(accountId)` — a dedicated SQL
aggregation.

#### Parameters

- `accountId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    totalSeasonsTracked: number,
    totalSeasonsSkipped: number,
    skipRate: number, // percentage
    mostSkippedShows: Array<SkippedShow & { profileName: string }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account skip-rate statistics",
  "results": {
    "totalSeasonsTracked": 120,
    "totalSeasonsSkipped": 14,
    "skipRate": 11.7,
    "mostSkippedShows": [
      { "showId": 101, "showTitle": "Grey's Anatomy", "skippedSeasonCount": 3, "profileName": "Alice" }
    ]
  }
}
```

---

### 16. Get Account Watchlist Usage Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/statistics/watchlist-usage`

**Controller:** `getAccountWatchlistUsageStats` → `accountStatisticsService.getAccountWatchlistUsageStats(accountId)`

Sourced directly from `db/statistics/watchlistUsageRepository.getAccountWatchlistUsageStats(accountId)` — a dedicated
SQL aggregation.

#### Parameters

- `accountId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    currentlyQueuedCount: number,
    averageCurrentQueueDays: number,
    totalAdded: number,
    totalRemoved: number,
    completedCount: number,
    abandonedCount: number,
    completionRate: number, // percentage
    averageDaysToCompletion: number | null,
    longestQueuedItems: Array<QueuedItemAge & { profileName: string }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved account watchlist usage statistics",
  "results": {
    "currentlyQueuedCount": 15,
    "averageCurrentQueueDays": 10.1,
    "totalAdded": 60,
    "totalRemoved": 45,
    "completedCount": 30,
    "abandonedCount": 15,
    "completionRate": 66.7,
    "averageDaysToCompletion": 8.5,
    "longestQueuedItems": [
      { "contentId": 101, "contentType": "show", "title": "Severance", "daysInQueue": 42, "profileName": "Alice" }
    ]
  }
}
```

---

## Profile Statistics Endpoints

Base path for all endpoints in this section: `/api/v1/accounts/{accountId}/profiles/{profileId}/statistics`. All require
path params `accountId` and `profileId` (both positive integers) and pass through `authorizeAccountAccess`

- `trackAccountActivity` middleware. Cache TTL for every profile-level statistic is **1800 seconds (30 minutes)**, keyed
  by `profileId` (and `days`/`weeks`/`months`/period where applicable) — except closed-period recaps, which are cached
  indefinitely since their underlying data can no longer change.

| Method | Path                            | Description                                                     |
| ------ | ------------------------------- | --------------------------------------------------------------- |
| GET    | `/statistics`                   | Show/movie/episode counts and progress for this profile         |
| GET    | `/statistics/velocity`          | Watching pace and trend for this profile                        |
| GET    | `/statistics/activity/daily`    | Daily activity entries only                                     |
| GET    | `/statistics/activity/weekly`   | Weekly activity entries only                                    |
| GET    | `/statistics/activity/monthly`  | Monthly activity entries only                                   |
| GET    | `/statistics/activity/timeline` | Combined daily + weekly + monthly activity                      |
| GET    | `/statistics/binge`             | Binge-session stats and top binged shows                        |
| GET    | `/statistics/streaks`           | Current/longest watch streaks                                   |
| GET    | `/statistics/time-to-watch`     | Days-to-start/complete and fastest completions                  |
| GET    | `/statistics/seasonal`          | Viewing-by-month/season breakdown                               |
| GET    | `/statistics/milestones`        | Lifetime totals, milestones, and achievements                   |
| GET    | `/statistics/content-depth`     | Episode-count/runtime averages and distributions                |
| GET    | `/statistics/content-discovery` | Content addition rate and watch-to-add ratio                    |
| GET    | `/statistics/abandonment-risk`  | Shows at risk of abandonment and abandonment rate               |
| GET    | `/statistics/unaired-content`   | Unaired show/season/movie/episode counts                        |
| GET    | `/statistics/rewatches`         | Rewatch totals and most-rewatched entities                      |
| GET    | `/statistics/skip-rate`         | Season skip totals and most-skipped shows                       |
| GET    | `/statistics/watchlist-usage`   | Watchlist queue/completion metrics                              |
| GET    | `/statistics/recap`             | Shareable "month/year in review" for a specific calendar period |
| GET    | `/statistics/recap/available`   | Calendar years/months that have watch activity                  |

---

### 1. Get Profile Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics`

**Controller:** `getProfileStatistics` → `profileStatisticsService.getProfileStatistics(profileId)`. Internally combines
`showService.getProfileShowStatistics`, `moviesService.getProfileMovieStatistics`, and
`showService.getProfileWatchProgress`.

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved profile statistics"
  results: {
    profileId: number,
    showStatistics: ShowStatisticsResponse,
    movieStatistics: MovieStatisticsResponse,
    episodeWatchProgress: {
      totalEpisodes: number,
      watchedEpisodes: number,
      unairedEpisodes: number,
      overallProgress: number, // percentage
      showsProgress: Array<{
        showId: number, title: string, status: WatchStatus,
        totalEpisodes: number, watchedEpisodes: number, percentComplete: number
      }>
    }
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved profile statistics",
  "results": {
    "profileId": 101,
    "showStatistics": {
      "total": 15,
      "watchStatusCounts": { "unaired": 2, "watched": 8, "watching": 3, "notWatched": 2, "upToDate": 0 },
      "genreDistribution": { "Drama": 6, "Thriller": 4 },
      "serviceDistribution": { "Netflix": 10, "Disney+": 5 },
      "watchProgress": 73
    },
    "movieStatistics": {
      "movieReferences": [{ "id": 5, "title": "Dune: Part Two", "tmdbId": 693134 }],
      "total": 28,
      "watchStatusCounts": { "unaired": 1, "watched": 22, "notWatched": 5 },
      "genreDistribution": { "Action": 10, "Comedy": 8 },
      "serviceDistribution": { "Netflix": 18, "Amazon Prime": 10 },
      "watchProgress": 81
    },
    "episodeWatchProgress": {
      "totalEpisodes": 487,
      "watchedEpisodes": 352,
      "unairedEpisodes": 10,
      "overallProgress": 74,
      "showsProgress": [
        {
          "showId": 1,
          "title": "Breaking Bad",
          "status": "WATCHED",
          "totalEpisodes": 62,
          "watchedEpisodes": 62,
          "percentComplete": 100
        }
      ]
    }
  }
}
```

---

### 2. Get Profile Watching Velocity

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/velocity`

**Controller:** `getWatchingVelocity` → `profileStatisticsService.getWatchingVelocity(profileId, days)` →
`statisticsDb.getWatchingVelocityData(profileId, days)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `30`)

#### Response Format

```typescript
{
  message: string,
  results: {
    episodesPerWeek: number,
    episodesPerMonth: number,
    averageEpisodesPerDay: number,
    mostActiveDay: string,
    mostActiveHour: number,
    velocityTrend: 'increasing' | 'decreasing' | 'stable'
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved watching velocity statistics",
  "results": {
    "episodesPerWeek": 14.5,
    "episodesPerMonth": 62,
    "averageEpisodesPerDay": 2.1,
    "mostActiveDay": "Saturday",
    "mostActiveHour": 20,
    "velocityTrend": "increasing"
  }
}
```

---

### 3. Get Profile Daily Activity

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/activity/daily`

**Controller:** `getDailyActivity` → `profileStatisticsService.getDailyActivity(profileId, days)` →
`statisticsDb.getDailyActivityTimeline(profileId, days)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `30`)

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved daily activity"
  results: DailyActivity[]
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved daily activity",
  "results": [{ "date": "2026-07-13", "episodesWatched": 3, "showsWatched": 2 }]
}
```

---

### 4. Get Profile Weekly Activity

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/activity/weekly`

**Controller:** `getWeeklyActivity` → `profileStatisticsService.getWeeklyActivity(profileId, weeks)` →
`statisticsDb.getWeeklyActivityTimeline(profileId, weeks)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `weeks` (query, optional, integer, default `12`)

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved weekly activity"
  results: WeeklyActivity[]
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved weekly activity",
  "results": [{ "weekStart": "2026-07-06", "episodesWatched": 21 }]
}
```

---

### 5. Get Profile Monthly Activity

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/activity/monthly`

**Controller:** `getMonthlyActivity` → `profileStatisticsService.getMonthlyActivity(profileId, months)` →
`statisticsDb.getMonthlyActivityTimeline(profileId, months)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `months` (query, optional, integer, default `12`)

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved monthly activity"
  results: MonthlyActivity[]
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved monthly activity",
  "results": [{ "month": "2026-07", "episodesWatched": 85, "moviesWatched": 12 }]
}
```

---

### 6. Get Profile Activity Timeline

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/activity/timeline`

**Controller:** `getActivityTimeline` → `profileStatisticsService.getActivityTimeline(profileId, days)`. Internally fans
out to the daily/weekly/monthly methods above using `weeks = ceil(days / 7)` and `months = max(1, ceil(days / 30))`.

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved activity timeline"
  results: { dailyActivity: DailyActivity[], weeklyActivity: WeeklyActivity[], monthlyActivity: MonthlyActivity[] }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved activity timeline",
  "results": {
    "dailyActivity": [{ "date": "2026-07-13", "episodesWatched": 3, "showsWatched": 2 }],
    "weeklyActivity": [{ "weekStart": "2026-07-06", "episodesWatched": 21 }],
    "monthlyActivity": [{ "month": "2026-07", "episodesWatched": 85, "moviesWatched": 12 }]
  }
}
```

---

### 7. Get Profile Binge-Watching Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/binge`

**Controller:** `getBingeWatchingStats` → `profileStatisticsService.getBingeWatchingStats(profileId, days)` →
`statisticsDb.getBingeWatchingStats(profileId, days)`. A binge session is defined as 3+ episodes watched within 24
hours.

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    bingeSessionCount: number,
    averageEpisodesPerBinge: number,
    longestBingeSession: { showTitle: string, episodeCount: number, date: string },
    topBingedShows: Array<{ showId: number, showTitle: string, bingeSessionCount: number }>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved binge-watching statistics",
  "results": {
    "bingeSessionCount": 15,
    "averageEpisodesPerBinge": 4.5,
    "longestBingeSession": { "showTitle": "Breaking Bad", "episodeCount": 8, "date": "2026-06-15" },
    "topBingedShows": [{ "showId": 1, "showTitle": "The Office", "bingeSessionCount": 5 }]
  }
}
```

---

### 8. Get Profile Watch Streak Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/streaks`

**Controller:** `getWatchStreakStats` → `profileStatisticsService.getWatchStreakStats(profileId, days)` →
`statisticsDb.getWatchStreakStats(profileId, days)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    currentStreak: number,
    longestStreak: number,
    currentStreakStartDate: string,
    longestStreakPeriod: { startDate: string, endDate: string, days: number },
    streaksOver7Days: number,
    averageStreakLength: number
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved watch streak statistics",
  "results": {
    "currentStreak": 5,
    "longestStreak": 21,
    "currentStreakStartDate": "2026-07-10",
    "longestStreakPeriod": { "startDate": "2025-12-01", "endDate": "2025-12-21", "days": 21 },
    "streaksOver7Days": 3,
    "averageStreakLength": 6.5
  }
}
```

---

### 9. Get Profile Time-to-Watch Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/time-to-watch`

**Controller:** `getTimeToWatchStats` → `profileStatisticsService.getTimeToWatchStats(profileId, days)` →
`statisticsDb.getTimeToWatchStats(profileId, days)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    averageDaysToStartShow: number,
    averageDaysToCompleteShow: number,
    fastestCompletions: Array<{ showId: number, showTitle: string, daysToComplete: number }>,
    backlogAging: { unwatchedOver30Days: number, unwatchedOver90Days: number, unwatchedOver365Days: number }
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved time-to-watch statistics",
  "results": {
    "averageDaysToStartShow": 12.5,
    "averageDaysToCompleteShow": 45.2,
    "fastestCompletions": [{ "showId": 1, "showTitle": "Breaking Bad", "daysToComplete": 7 }],
    "backlogAging": { "unwatchedOver30Days": 5, "unwatchedOver90Days": 3, "unwatchedOver365Days": 1 }
  }
}
```

---

### 10. Get Profile Seasonal Viewing Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/seasonal`

**Controller:** `getSeasonalViewingStats` → `profileStatisticsService.getSeasonalViewingStats(profileId, days)` →
`statisticsDb.getSeasonalViewingStats(profileId, days)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    viewingByMonth: Record<string, number>,
    viewingBySeason: { spring: number, summer: number, fall: number, winter: number },
    peakViewingMonth: string,
    slowestViewingMonth: string
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved seasonal viewing statistics",
  "results": {
    "viewingByMonth": { "January": 45, "February": 38 },
    "viewingBySeason": { "spring": 120, "summer": 95, "fall": 110, "winter": 130 },
    "peakViewingMonth": "December",
    "slowestViewingMonth": "July"
  }
}
```

---

### 11. Get Profile Milestone Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/milestones`

**Controller:** `getMilestoneStats` → `profileStatisticsService.getMilestoneStats(profileId)` →
`statisticsDb.getMilestoneStats(profileId)`

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    totalEpisodesWatched: number,
    totalMoviesWatched: number,
    totalHoursWatched: number,
    totalShowsCompleted: number,
    createdAt?: string, // profile creation date
    firstEpisodeWatchedAt?: string,
    firstMovieWatchedAt?: string,
    firstEpisodeMetadata?: Record<string, unknown>,
    firstMovieMetadata?: Record<string, unknown>,
    milestones: Milestone[],
    recentAchievements: Achievement[], // last 30 days
    allAchievements: Achievement[]     // full lifetime history
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved milestone statistics",
  "results": {
    "totalEpisodesWatched": 856,
    "totalMoviesWatched": 32,
    "totalHoursWatched": 642,
    "totalShowsCompleted": 8,
    "createdAt": "2023-01-15T10:30:00Z",
    "firstEpisodeWatchedAt": "2023-01-20T14:25:00Z",
    "firstMovieWatchedAt": "2023-02-01T19:15:00Z",
    "milestones": [{ "type": "episodes", "threshold": 1000, "achieved": false, "progress": 85.6 }],
    "recentAchievements": [
      {
        "description": "500 Episodes Watched",
        "achievedDate": "2026-06-15",
        "achievementType": "EPISODES_WATCHED",
        "thresholdValue": 500
      }
    ],
    "allAchievements": []
  }
}
```

---

### 12. Get Profile Content Depth Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/content-depth`

**Controller:** `getContentDepthStats` → `profileStatisticsService.getContentDepthStats(profileId, days)` →
`statisticsDb.getContentDepthStats(profileId, days)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `36500`)

#### Response Format

```typescript
{
  message: string,
  results: {
    averageEpisodeCountPerShow: number,
    averageMovieRuntime: number, // minutes
    releaseYearDistribution: Record<string, number>,
    contentMaturityDistribution: Record<string, number>
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved content depth statistics",
  "results": {
    "averageEpisodeCountPerShow": 42.5,
    "averageMovieRuntime": 118,
    "releaseYearDistribution": { "2020-2024": 45, "2015-2019": 32 },
    "contentMaturityDistribution": { "TV-MA": 25, "TV-14": 35 }
  }
}
```

---

### 13. Get Profile Content Discovery Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/content-discovery`

**Controller:** `getContentDiscoveryStats` → `profileStatisticsService.getContentDiscoveryStats(profileId, days)` →
`statisticsDb.getContentDiscoveryStats(profileId, days)`

#### Parameters

- `accountId`, `profileId` (path, required)
- `days` (query, optional, integer, default `30`)

#### Response Format

```typescript
{
  message: string,
  results: {
    daysSinceLastContentAdded: number,
    contentAdditionRate: { showsPerMonth: number, moviesPerMonth: number },
    watchToAddRatio: { shows: number, movies: number }
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved content discovery statistics",
  "results": {
    "daysSinceLastContentAdded": 3,
    "contentAdditionRate": { "showsPerMonth": 4.5, "moviesPerMonth": 8.2 },
    "watchToAddRatio": { "shows": 0.85, "movies": 1.2 }
  }
}
```

---

### 14. Get Profile Abandonment Risk Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/abandonment-risk`

**Controller:** `getAbandonmentRiskStats` → `profileStatisticsService.getAbandonmentRiskStats(profileId)` →
`statisticsDb.getAbandonmentRiskStats(profileId)`. Shows are flagged "at risk" when marked `WATCHING` but with no
progress in 30+ days; `showAbandonmentRate` excludes currently-airing shows.

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    showsAtRisk: Array<{ showId: number, showTitle: string, daysSinceLastWatch: number, unwatchedEpisodes: number, status: string }>,
    showAbandonmentRate: number
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved abandonment risk statistics",
  "results": {
    "showsAtRisk": [
      {
        "showId": 123,
        "showTitle": "The Walking Dead",
        "daysSinceLastWatch": 45,
        "unwatchedEpisodes": 23,
        "status": "WATCHING"
      }
    ],
    "showAbandonmentRate": 18.5
  }
}
```

---

### 15. Get Profile Unaired Content Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/unaired-content`

**Controller:** `getUnairedContentStats` → `profileStatisticsService.getUnairedContentStats(profileId)` →
`statisticsDb.getUnairedContentStats(profileId)`

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: { unairedShowCount: number, unairedSeasonCount: number, unairedMovieCount: number, unairedEpisodeCount: number }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved unaired content statistics",
  "results": { "unairedShowCount": 2, "unairedSeasonCount": 3, "unairedMovieCount": 4, "unairedEpisodeCount": 15 }
}
```

---

### 16. Get Profile Rewatch Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/rewatches`

**Controller:** `getRewatchStats` → `profileStatisticsService.getRewatchStats(profileId)` →
`db/statistics/rewatchRepository.getProfileRewatchStats(profileId)`

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    totalShowRewatches: number,
    totalMovieRewatches: number,
    totalEpisodeRewatches: number,
    totalSeasonRewatches: number,
    mostRewatchedShows: RewatchedShow[],
    mostRewatchedMovies: RewatchedMovie[],
    mostRewatchedEpisodes: RewatchedEpisode[],
    mostRewatchedSeasons: RewatchedSeason[],
    topRewatchedShowsByEpisodes: RewatchedShowEpisodeSummary[]
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved rewatch statistics",
  "results": {
    "totalShowRewatches": 5,
    "totalMovieRewatches": 12,
    "totalEpisodeRewatches": 7,
    "totalSeasonRewatches": 2,
    "mostRewatchedShows": [{ "showId": 101, "showTitle": "Breaking Bad", "rewatchCount": 2 }],
    "mostRewatchedMovies": [{ "movieId": 550, "movieTitle": "Fight Club", "rewatchCount": 3 }],
    "mostRewatchedEpisodes": [
      {
        "episodeId": 5001,
        "showId": 101,
        "showTitle": "Breaking Bad",
        "seasonNumber": 1,
        "episodeNumber": 1,
        "episodeTitle": "Pilot",
        "rewatchCount": 2
      }
    ],
    "mostRewatchedSeasons": [],
    "topRewatchedShowsByEpisodes": []
  }
}
```

---

### 17. Get Profile Skip-Rate Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/skip-rate`

**Controller:** `getSkipRateStats` → `profileStatisticsService.getSkipRateStats(profileId)` →
`db/statistics/skipRateRepository.getProfileSkipRateStats(profileId)`

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: { totalSeasonsTracked: number, totalSeasonsSkipped: number, skipRate: number, mostSkippedShows: SkippedShow[] }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved skip-rate statistics",
  "results": {
    "totalSeasonsTracked": 42,
    "totalSeasonsSkipped": 5,
    "skipRate": 11.9,
    "mostSkippedShows": [{ "showId": 101, "showTitle": "Grey's Anatomy", "skippedSeasonCount": 3 }]
  }
}
```

---

### 18. Get Profile Watchlist Usage Statistics

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/watchlist-usage`

**Controller:** `getWatchlistUsageStats` → `profileStatisticsService.getWatchlistUsageStats(profileId)` →
`db/statistics/watchlistUsageRepository.getProfileWatchlistUsageStats(profileId)`

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string,
  results: {
    currentlyQueuedCount: number,
    averageCurrentQueueDays: number,
    totalAdded: number,
    totalRemoved: number,
    completedCount: number,
    abandonedCount: number,
    completionRate: number,
    averageDaysToCompletion: number | null,
    longestQueuedItems: QueuedItemAge[]
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved watchlist usage statistics",
  "results": {
    "currentlyQueuedCount": 8,
    "averageCurrentQueueDays": 12.4,
    "totalAdded": 25,
    "totalRemoved": 17,
    "completedCount": 11,
    "abandonedCount": 6,
    "completionRate": 64.7,
    "averageDaysToCompletion": 9.2,
    "longestQueuedItems": [{ "contentId": 101, "contentType": "show", "title": "Severance", "daysInQueue": 42 }]
  }
}
```

---

### 19. Get Profile Recap

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/recap`

**Controller:** `getProfileRecap` → `profileStatisticsService.getProfileRecap(profileId, period, year, month)` →
`statisticsDb.getRecapStats(...)`. Aggregates watch activity within a fixed calendar period (not a rolling window). A
recap for a **closed** period (one that has already ended) is cached indefinitely; the current in-progress period uses
the standard 30-minute TTL.

#### Parameters

- `accountId`, `profileId` (path, required)
- `period` (query, required): `'month' | 'year'`
- `year` (query, required): integer, 1900-9999
- `month` (query, required if `period` is `'month'`, otherwise omitted): integer, 1-12

Validated by `recapQuerySchema` (zod), which also enforces that `month` is present when `period === 'month'` via a
`.refine()`. An invalid combination (e.g. `period=month` with no `month`) returns a 400 from `validateSchema`.

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved profile recap"
  results: {
    profileId: number,
    period: 'month' | 'year',
    year: number,
    month?: number, // present only when period is 'month'
    startDate: string,
    endDate: string,
    hoursWatched: number,
    episodesWatched: number,
    moviesWatched: number,
    topGenres: Array<{ genre: string, count: number }>,
    topShow: { showId: number, title: string, episodesWatched: number } | null,
    topMovie: { movieId: number, title: string } | null,
    longestStreak: { days: number, startDate: string, endDate: string } | null,
    busiestBingeDay: { date: string, episodesWatched: number } | null,
    firstWatchDate: string | null,
    activityBreakdown: Array<{ period: number, episodesWatched: number }>
    // period = day-of-month (1-31) for a monthly recap, or calendar month (1-12) for a yearly recap;
    // always fully populated including zero-activity buckets
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved profile recap",
  "results": {
    "profileId": 42,
    "period": "year",
    "year": 2026,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "hoursWatched": 312,
    "episodesWatched": 540,
    "moviesWatched": 28,
    "topGenres": [{ "genre": "Drama", "count": 120 }],
    "topShow": { "showId": 7, "title": "Breaking Bad", "episodesWatched": 62 },
    "topMovie": { "movieId": 3, "title": "Inception" },
    "longestStreak": { "days": 14, "startDate": "2026-07-01", "endDate": "2026-07-14" },
    "busiestBingeDay": { "date": "2026-07-04", "episodesWatched": 11 },
    "firstWatchDate": "2026-01-03",
    "activityBreakdown": [
      { "period": 1, "episodesWatched": 0 },
      { "period": 2, "episodesWatched": 3 }
    ]
  }
}
```

#### Example Requests

```
GET /api/v1/accounts/1/profiles/42/statistics/recap?period=year&year=2026
GET /api/v1/accounts/1/profiles/42/statistics/recap?period=month&year=2026&month=7
```

---

### 20. Get Available Recap Periods

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/statistics/recap/available`

**Controller:** `getAvailableRecapPeriods` → `profileStatisticsService.getAvailableRecapPeriods(profileId)` →
`statisticsDb.getAvailableRecapPeriods(profileId)`. Used to bound recap navigation so the UI never attempts to render an
empty period.

#### Parameters

- `accountId`, `profileId` (path, required)

#### Response Format

```typescript
{
  message: string, // "Successfully retrieved available recap periods"
  results: {
    years: number[], // calendar years with at least one watched episode or movie
    months: Array<{ year: number, month: number }> // calendar (year, month) pairs with at least one watched episode or movie
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved available recap periods",
  "results": {
    "years": [2025, 2026],
    "months": [
      { "year": 2026, "month": 6 },
      { "year": 2026, "month": 7 }
    ]
  }
}
```

---

## Standard Status Codes

Every endpoint documented above returns the same set of status codes:

- **200**: Success
- **401**: Authentication required (missing/invalid Bearer token)
- **403**: Access forbidden (user doesn't own the account, or the profile doesn't belong to the account)
- **404**: Account or profile not found
- **500**: Server error

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

### Account/Profile Not Found (404 Not Found)

```json
{
  "error": "Account not found"
}
```

```json
{
  "error": "Profile not found"
}
```

### Validation Error (400 Bad Request)

Returned by `validateSchema` when a path param fails validation, or when the `recap` endpoint's query params fail
`recapQuerySchema` (e.g. `period=month` without `month`):

```json
{
  "error": "month is required when period is \"month\""
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

The request pattern is identical across all 36 endpoints: build the path, attach the Bearer token, and (for a handful of
endpoints) add `days`/`weeks`/`months` or the `recap` query params.

### JavaScript/TypeScript

```typescript
async function getStatistic(path: string, token: string, params?: Record<string, string | number>) {
  const url = new URL(`https://api.example.com${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error ?? `Request failed with status ${response.status}`);
  }

  return await response.json();
}

// Account-level, no query params
const accountStats = await getStatistic('/api/v1/accounts/1/statistics', token);

// Profile-level with a "days" window
const velocity = await getStatistic('/api/v1/accounts/1/profiles/42/statistics/velocity', token, { days: 90 });

// Profile recap for a specific month
const recap = await getStatistic('/api/v1/accounts/1/profiles/42/statistics/recap', token, {
  period: 'month',
  year: 2026,
  month: 7,
});
```

### cURL

```bash
# Account-level
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/1/statistics

# Profile-level with a query param
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/1/profiles/42/statistics/velocity?days=90"

# Profile recap
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/1/profiles/42/statistics/recap?period=year&year=2026"
```

## Additional Notes

- Statistics are calculated from live watch-status/watch-history data at request time, then cached (account-level: 1
  hour; profile-level: 30 minutes, except closed-period recaps which are cached indefinitely). Cache keys include the
  relevant `days`/`weeks`/`months`/period arguments, so different windows are cached independently. A request that
  throws (e.g. `BadRequestError` for an account with zero profiles) is not cached — only successful results are.
  <!-- TODO: whether a write (e.g. marking an episode watched) proactively invalidates the relevant statistics cache
  entries, or whether callers must wait out the TTL for a stale read to clear, was not confirmed against
  CacheService's call sites outside the statistics services themselves — verify before depending on either behavior. -->
- Every account-level endpoint that isn't backed by a dedicated SQL aggregation (rewatches, skip-rate, watchlist-usage,
  profile-comparison) works by calling the equivalent profile-level method once per profile on the account and combining
  the results in memory — see each endpoint's description above for the exact combination rule (sum, average, weighted
  average, or merge-and-resort).
- `AccountStatisticsResponse`/`ProfileStatisticsResponse`'s `watchProgress` fields, and every other percentage field in
  this document, are 0-100 (not 0-1).
- Genre and service distribution data is derived from TMDB metadata stored on each show/movie.
- `days`/`weeks`/`months` query params are unvalidated integers read directly off `req.query`; there is no zod schema
  enforcing them, unlike the `recap` endpoint's query params.
