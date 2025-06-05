[Home](../README.md)

# Movies API Documentation

This document describes the endpoints available for managing movies within user profiles, including retrieving movies,
adding/removing favorites, updating watch status, and accessing recent/upcoming movie data.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}/movies`

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

### Movie Object

```typescript
{
  movie_id: number,
  title: string,
  overview?: string,
  release_date?: string,
  runtime?: number,
  vote_average?: number,
  vote_count?: number,
  popularity?: number,
  poster_path?: string,
  backdrop_path?: string,
  genre_ids?: number[],
  genres?: Array<{
    id: number,
    name: string
  }>,
  tmdb_id: number,
  watchStatus?: 'WATCHED' | 'NOT_WATCHED',
  addedDate?: string,
  watchedDate?: string,
  userRating?: number
}
```

### Recent/Upcoming Movies Response

```typescript
{
  recentMovies: Array<{
    movie_id: number,
    title: string,
    release_date: string,
    poster_path?: string,
    vote_average?: number,
    // ... other movie properties
  }>,
  upcomingMovies: Array<{
    movie_id: number,
    title: string,
    release_date: string,
    poster_path?: string,
    vote_average?: number,
    // ... other movie properties
  }>
}
```

### Add Movie Favorite Response

```typescript
{
  message: string,
  favoritedMovie: Movie,
  recentUpcomingMovies: {
    recentMovies: Movie[],
    upcomingMovies: Movie[]
  }
}
```

### Remove Movie Favorite Response

```typescript
{
  message: string,
  removedMovieReference: {
    id: number,
    title: string
  },
  recentUpcomingMovies: {
    recentMovies: Movie[],
    upcomingMovies: Movie[]
  }
}
```

## Endpoints

### Get Movies for Profile

Retrieves all movies in a profile's favorites list with their watch status and metadata.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/movies`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  results: Array<Movie>
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved movies for a profile",
  "results": [
    {
      "movie_id": 12345,
      "title": "Inception",
      "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible.",
      "release_date": "2010-07-16",
      "runtime": 148,
      "vote_average": 8.4,
      "vote_count": 34562,
      "popularity": 147.435,
      "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      "genre_ids": [28, 878, 53],
      "genres": [
        { "id": 28, "name": "Action" },
        { "id": 878, "name": "Science Fiction" },
        { "id": 53, "name": "Thriller" }
      ],
      "tmdb_id": 27205,
      "watchStatus": "WATCHED",
      "addedDate": "2025-05-15T10:30:00Z",
      "watchedDate": "2025-05-20T19:45:00Z",
      "userRating": 9
    },
    {
      "movie_id": 12346,
      "title": "The Dark Knight",
      "overview": "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
      "release_date": "2008-07-18",
      "runtime": 152,
      "vote_average": 9.0,
      "vote_count": 32105,
      "popularity": 123.456,
      "poster_path": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      "backdrop_path": "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
      "genre_ids": [18, 28, 80, 53],
      "genres": [
        { "id": 18, "name": "Drama" },
        { "id": 28, "name": "Action" },
        { "id": 80, "name": "Crime" },
        { "id": 53, "name": "Thriller" }
      ],
      "tmdb_id": 155,
      "watchStatus": "NOT_WATCHED",
      "addedDate": "2025-06-01T14:20:00Z"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Account or profile not found
- 500: Server error

---

### Add Movie to Favorites

Adds a movie to a profile's favorites list. If the movie doesn't exist in the system, it will fetch details from TMDB
and create it before adding to favorites.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/movies/favorites`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Request Body

```json
{
  "movieTMDBId": 27205
}
```

#### Response Format

```typescript
{
  message: string,
  favoritedMovie: Movie,
  recentUpcomingMovies: {
    recentMovies: Movie[],
    upcomingMovies: Movie[]
  }
}
```

#### Example Response

```json
{
  "message": "Successfully saved movie as a favorite",
  "favoritedMovie": {
    "movie_id": 12347,
    "title": "Dune: Part Two",
    "overview": "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
    "release_date": "2024-02-29",
    "runtime": 166,
    "vote_average": 8.2,
    "vote_count": 5432,
    "popularity": 89.123,
    "poster_path": "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    "backdrop_path": "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    "genre_ids": [878, 12],
    "genres": [
      { "id": 878, "name": "Science Fiction" },
      { "id": 12, "name": "Adventure" }
    ],
    "tmdb_id": 693134,
    "watchStatus": "NOT_WATCHED",
    "addedDate": "2025-06-05T16:45:00Z"
  },
  "recentUpcomingMovies": {
    "recentMovies": [
      {
        "movie_id": 12348,
        "title": "Oppenheimer",
        "release_date": "2023-07-21",
        "poster_path": "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        "vote_average": 8.1
      }
    ],
    "upcomingMovies": [
      {
        "movie_id": 12349,
        "title": "Deadpool 3",
        "release_date": "2025-07-26",
        "poster_path": "/4Zb4Z2HjX6BGAAFzfE6YjurVSZ.jpg",
        "vote_average": 7.8
      }
    ]
  }
}
```

**Status Codes:**

- 200: Movie added to favorites successfully
- 400: Invalid request body or TMDB ID not found
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Account or profile not found
- 500: Server error

---

### Remove Movie from Favorites

Removes a movie from a profile's favorites list.

**Endpoint:** `DELETE /api/v1/accounts/{accountId}/profiles/{profileId}/movies/favorites/{movieId}`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile
- `movieId` (path parameter, required): Unique identifier of the movie to remove

#### Response Format

```typescript
{
  message: string,
  removedMovieReference: {
    id: number,
    title: string
  },
  recentUpcomingMovies: {
    recentMovies: Movie[],
    upcomingMovies: Movie[]
  }
}
```

#### Example Response

```json
{
  "message": "Successfully removed the movie from favorites",
  "removedMovieReference": {
    "id": 12345,
    "title": "Inception"
  },
  "recentUpcomingMovies": {
    "recentMovies": [
      {
        "movie_id": 12348,
        "title": "Oppenheimer",
        "release_date": "2023-07-21",
        "poster_path": "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        "vote_average": 8.1
      }
    ],
    "upcomingMovies": [
      {
        "movie_id": 12349,
        "title": "Deadpool 3",
        "release_date": "2025-07-26",
        "poster_path": "/4Zb4Z2HjX6BGAAFzfE6YjurVSZ.jpg",
        "vote_average": 7.8
      }
    ]
  }
}
```

**Status Codes:**

- 200: Movie removed from favorites successfully
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Account, profile, or movie not found
- 500: Server error

---

### Update Movie Watch Status

Updates the watch status of a movie in a profile's favorites list.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}/movies/watchstatus`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Request Body

```json
{
  "movieId": 12345,
  "status": "WATCHED"
}
```

#### Valid Status Values

- `WATCHED` - Movie has been watched
- `NOT_WATCHED` - Movie has not been watched

#### Response Format

```json
{
  "message": "Successfully updated the watch status to 'WATCHED'"
}
```

**Status Codes:**

- 200: Watch status updated successfully
- 400: Invalid request body or status value
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Account, profile, or movie not found
- 500: Server error

---

### Get Recent and Upcoming Movies

Retrieves recently released and upcoming movies for a profile based on their favorites list and preferences.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/movies/recentUpcoming`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  results: {
    recentMovies: Movie[],
    upcomingMovies: Movie[]
  }
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved recent & upcoming movies for a profile",
  "results": {
    "recentMovies": [
      {
        "movie_id": 12348,
        "title": "Oppenheimer",
        "overview": "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
        "release_date": "2023-07-21",
        "runtime": 180,
        "vote_average": 8.1,
        "vote_count": 12847,
        "popularity": 289.456,
        "poster_path": "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        "backdrop_path": "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
        "genre_ids": [18, 36],
        "genres": [
          { "id": 18, "name": "Drama" },
          { "id": 36, "name": "History" }
        ],
        "tmdb_id": 872585,
        "watchStatus": "NOT_WATCHED"
      },
      {
        "movie_id": 12350,
        "title": "Barbie",
        "overview": "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.",
        "release_date": "2023-07-21",
        "runtime": 114,
        "vote_average": 7.2,
        "vote_count": 8934,
        "popularity": 456.789,
        "poster_path": "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
        "backdrop_path": "/nHf61UzkfFno5X1ofIhugCPus2R.jpg",
        "genre_ids": [35, 12, 14],
        "genres": [
          { "id": 35, "name": "Comedy" },
          { "id": 12, "name": "Adventure" },
          { "id": 14, "name": "Fantasy" }
        ],
        "tmdb_id": 346698,
        "watchStatus": "WATCHED",
        "watchedDate": "2023-08-15T20:30:00Z"
      }
    ],
    "upcomingMovies": [
      {
        "movie_id": 12349,
        "title": "Deadpool 3",
        "overview": "The third installment in the Deadpool film series.",
        "release_date": "2025-07-26",
        "runtime": null,
        "vote_average": null,
        "vote_count": 0,
        "popularity": 234.567,
        "poster_path": "/4Zb4Z2HjX6BGAAFzfE6YjurVSZ.jpg",
        "backdrop_path": "/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg",
        "genre_ids": [28, 35, 878],
        "genres": [
          { "id": 28, "name": "Action" },
          { "id": 35, "name": "Comedy" },
          { "id": 878, "name": "Science Fiction" }
        ],
        "tmdb_id": 567604,
        "watchStatus": "NOT_WATCHED"
      },
      {
        "movie_id": 12351,
        "title": "Avatar 3",
        "overview": "The third film in James Cameron's Avatar saga.",
        "release_date": "2025-12-20",
        "runtime": null,
        "vote_average": null,
        "vote_count": 0,
        "popularity": 189.234,
        "poster_path": "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        "backdrop_path": "/Yc9q6QuWrMp9nuDm5R8ExNqbEq.jpg",
        "genre_ids": [878, 12, 28],
        "genres": [
          { "id": 878, "name": "Science Fiction" },
          { "id": 12, "name": "Adventure" },
          { "id": 28, "name": "Action" }
        ],
        "tmdb_id": 83533,
        "watchStatus": "NOT_WATCHED"
      }
    ]
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Account or profile not found
- 500: Server error

## Authorization

All movie endpoints require that:

- The user is authenticated
- The user owns the account specified in the URL
- The profile must belong to the specified account

## Validation Rules

### Movie TMDB ID

- **Required:** Yes (for add favorite endpoint)
- **Type:** Number
- **Range:** Positive integer
- **Validation:** Must exist in TMDB database

### Movie ID

- **Required:** Yes (for remove favorite and watch status endpoints)
- **Type:** Number
- **Range:** Positive integer
- **Validation:** Must exist in user's favorites

### Watch Status

- **Required:** Yes (for watch status endpoint)
- **Type:** String
- **Valid Values:** `WATCHED`, `NOT_WATCHED`

## Data Integration

### TMDB Integration

When adding movies to favorites:

1. **TMDB Lookup:** System fetches complete movie metadata from TMDB
2. **Local Storage:** Movie data is stored locally for fast access
3. **Metadata Sync:** Regular updates ensure current information
4. **Image Handling:** Poster and backdrop paths are stored for UI display

### Watch Status Tracking

- **Automatic Timestamps:** Watch dates are automatically recorded
- **Status History:** Previous status changes may be tracked
- **User Ratings:** Optional user ratings can be associated with movies
- **Watch Progress:** Future support for partial watch progress

## Cache Behavior

### Profile Movies Cache

- **Cache Duration:** 5 minutes for movie lists
- **Invalidation Triggers:**
  - Adding/removing favorites
  - Updating watch status
  - Profile modifications
- **Cache Key Strategy:** Based on profile ID and last modification time

### Recent/Upcoming Cache

- **Cache Duration:** 30 minutes
- **Refresh Strategy:** Background refresh for popular profiles
- **Data Sources:** Combines user favorites with trending/upcoming data

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "movieTMDBId",
      "message": "TMDB ID is required and must be a positive integer"
    }
  ]
}
```

### Movie Not Found (400 Bad Request)

```json
{
  "error": "Movie not found in TMDB database"
}
```

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

### Movie Not in Favorites (404 Not Found)

```json
{
  "error": "Movie not found in user's favorites"
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
// Get all movies for a profile
async function getMoviesForProfile(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/movies`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get movies: ${response.statusText}`);
  }

  return await response.json();
}

// Add movie to favorites
async function addMovieToFavorites(accountId: number, profileId: number, tmdbId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/movies/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      movieTMDBId: tmdbId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add movie: ${response.statusText}`);
  }

  return await response.json();
}

// Remove movie from favorites
async function removeMovieFromFavorites(accountId: number, profileId: number, movieId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/movies/favorites/${movieId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to remove movie: ${response.statusText}`);
  }

  return await response.json();
}

// Update movie watch status
async function updateMovieWatchStatus(
  accountId: number,
  profileId: number,
  movieId: number,
  status: 'WATCHED' | 'NOT_WATCHED',
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/movies/watchstatus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      movieId,
      status,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update watch status: ${response.statusText}`);
  }

  return await response.json();
}

// Get recent and upcoming movies
async function getRecentUpcomingMovies(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/movies/recentUpcoming`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get recent/upcoming movies: ${response.statusText}`);
  }

  return await response.json();
}

// Comprehensive movie management class
class MovieManager {
  constructor(
    private accountId: number,
    private profileId: number,
    private token: string,
  ) {}

  async getMovies() {
    return getMoviesForProfile(this.accountId, this.profileId, this.token);
  }

  async addToFavorites(tmdbId: number) {
    return addMovieToFavorites(this.accountId, this.profileId, tmdbId, this.token);
  }

  async removeFromFavorites(movieId: number) {
    return removeMovieFromFavorites(this.accountId, this.profileId, movieId, this.token);
  }

  async markAsWatched(movieId: number) {
    return updateMovieWatchStatus(this.accountId, this.profileId, movieId, 'WATCHED', this.token);
  }

  async markAsNotWatched(movieId: number) {
    return updateMovieWatchStatus(this.accountId, this.profileId, movieId, 'NOT_WATCHED', this.token);
  }

  async getRecentUpcoming() {
    return getRecentUpcomingMovies(this.accountId, this.profileId, this.token);
  }

  // Bulk operations
  async markMultipleAsWatched(movieIds: number[]) {
    const promises = movieIds.map((id) => this.markAsWatched(id));
    return Promise.allSettled(promises);
  }

  async addMultipleToFavorites(tmdbIds: number[]) {
    const promises = tmdbIds.map((id) => this.addToFavorites(id));
    return Promise.allSettled(promises);
  }

  // Filter and search operations
  async getWatchedMovies() {
    const response = await this.getMovies();
    return response.results.filter((movie: any) => movie.watchStatus === 'WATCHED');
  }

  async getUnwatchedMovies() {
    const response = await this.getMovies();
    return response.results.filter((movie: any) => movie.watchStatus === 'NOT_WATCHED');
  }

  async getMoviesByGenre(genreId: number) {
    const response = await this.getMovies();
    return response.results.filter((movie: any) => movie.genre_ids?.includes(genreId));
  }

  async getMoviesByRating(minRating: number) {
    const response = await this.getMovies();
    return response.results.filter((movie: any) => movie.vote_average && movie.vote_average >= minRating);
  }
}

// Error handling with retry logic
async function movieOperationWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Don't retry on authentication or validation errors
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Authentication required');
      }
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage with retry logic
const movieManager = new MovieManager(123, 456, 'your_token');

try {
  const movies = await movieOperationWithRetry(() => movieManager.getMovies());
  console.log('Movies retrieved successfully:', movies);
} catch (error) {
  console.error('Failed to retrieve movies after retries:', error);
}
```

### React Hook Example

```typescript
import { useCallback, useEffect, useState } from 'react';

interface Movie {
  movie_id: number;
  title: string;
  watchStatus: 'WATCHED' | 'NOT_WATCHED';
  // ... other properties
}

interface UseMoviesResult {
  movies: Movie[];
  recentUpcoming: any;
  loading: boolean;
  error: string | null;
  addToFavorites: (tmdbId: number) => Promise<void>;
  removeFromFavorites: (movieId: number) => Promise<void>;
  updateWatchStatus: (movieId: number, status: 'WATCHED' | 'NOT_WATCHED') => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMovies(accountId: number, profileId: number, token: string): UseMoviesResult {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recentUpcoming, setRecentUpcoming] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const movieManager = new MovieManager(accountId, profileId, token);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [moviesResponse, recentUpcomingResponse] = await Promise.all([
        movieManager.getMovies(),
        movieManager.getRecentUpcoming(),
      ]);

      setMovies(moviesResponse.results);
      setRecentUpcoming(recentUpcomingResponse.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  }, [accountId, profileId, token]);

  const addToFavorites = useCallback(
    async (tmdbId: number) => {
      try {
        await movieManager.addToFavorites(tmdbId);
        await fetchMovies(); // Refresh data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add movie');
        throw err;
      }
    },
    [movieManager, fetchMovies],
  );

  const removeFromFavorites = useCallback(
    async (movieId: number) => {
      try {
        await movieManager.removeFromFavorites(movieId);
        await fetchMovies(); // Refresh data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove movie');
        throw err;
      }
    },
    [movieManager, fetchMovies],
  );

  const updateWatchStatus = useCallback(
    async (movieId: number, status: 'WATCHED' | 'NOT_WATCHED') => {
      try {
        await movieManager.updateWatchStatus(movieId, status);

        // Optimistically update local state
        setMovies((prev) =>
          prev.map((movie) => (movie.movie_id === movieId ? { ...movie, watchStatus: status } : movie)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update watch status');
        await fetchMovies(); // Revert on error
        throw err;
      }
    },
    [movieManager, fetchMovies],
  );

  useEffect(() => {
    if (accountId && profileId && token) {
      fetchMovies();
    }
  }, [fetchMovies]);

  return {
    movies,
    recentUpcoming,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    updateWatchStatus,
    refresh: fetchMovies,
  };
}
```

### cURL Examples

```bash
# Get all movies for a profile
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/movies

# Add movie to favorites
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"movieTMDBId": 27205}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/movies/favorites

# Remove movie from favorites
curl -X DELETE \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/movies/favorites/12345

# Update movie watch status
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"movieId": 12345, "status": "WATCHED"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/movies/watchstatus

# Get recent and upcoming movies
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/movies/recentUpcoming
```

## Performance Considerations

### Caching Strategies

Implement client-side caching for better performance:

```typescript
class CachedMovieManager extends MovieManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}_${args.join('_')}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  async getMovies() {
    const cacheKey = this.getCacheKey('getMovies');
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    const data = await super.getMovies();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async addToFavorites(tmdbId: number) {
    const result = await super.addToFavorites(tmdbId);

    // Invalidate relevant caches
    this.cache.delete(this.getCacheKey('getMovies'));
    this.cache.delete(this.getCacheKey('getRecentUpcoming'));

    return result;
  }

  // Similar cache invalidation for other mutating operations...
}
```

## Additional Notes

- **TMDB Integration:** Movie metadata is automatically fetched from TMDB when adding new favorites
- **Image URLs:** Poster and backdrop paths require TMDB base image URL for complete URLs
- **Genre Mapping:** Genre IDs correspond to TMDB's standardized genre taxonomy
- **Release Date Formatting:** Dates are returned in ISO 8601 format (YYYY-MM-DD)
- **Runtime Information:** Runtime is provided in minutes when available from TMDB
- **Rating System:** Vote averages are on a scale of 0-10 from TMDB user ratings
- **Watch Status Persistence:** Status changes are immediately persisted and reflected in subsequent API calls
- **Recent/Upcoming Logic:** Recent movies are typically within the last 3 months, upcoming within the next 6 months
- **Profile Isolation:** Movie favorites and watch status are isolated per profile within an account
- **Data Consistency:** All movie operations maintain referential integrity with profile and account data
- **Search Integration:** Movies added via this API become searchable through the search endpoints
- **Statistics Impact:** Watch status changes immediately update profile and account statistics
- **Notification Triggers:** Adding movies may trigger notifications for new releases and related content
