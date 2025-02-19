[Home](../README.md)

# Movies API Documentation

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

```json
{
  "profile_id": 3,
  "movie_id": 65,
  "tmdb_id": 774370,
  "title": "Dog Man",
  "description": "When a faithful police dog and his human police officer owner are injured together on the job...",
  "release_date": "2025-01-24",
  "runtime": 89,
  "poster_image": "/89wNiexZdvLQ41OQWIsQy4O6jAQ.jpg",
  "backdrop_image": "/iXU87IdtNsYt7n6OigPJBDdbFf1.jpg",
  "user_rating": 7.074999809265137,
  "mpa_rating": "PG",
  "genres": "Action, Animation, Comedy, Family",
  "streaming_services": "Theater",
  "watch_status": "WATCHED"
}
```

## Endpoints

### Get Movies for Profile

Retrieves all movies associated with a specific profile.

**Endpoint:** `GET /profiles/{profileId}/movies`

**Parameters:**

- `profileId` (path parameter, required): Unique identifier of the profile

**Example Response:**

```json
{
  "message": "Successfully retrieved movies for a profile",
  "results": [
    {
      "profile_id": 3,
      "movie_id": 65,
      "tmdb_id": 774370,
      "title": "Dog Man",
      "description": "When a faithful police dog and his human police officer owner are injured together on the job...",
      "release_date": "2025-01-24",
      "runtime": 89,
      "poster_image": "/89wNiexZdvLQ41OQWIsQy4O6jAQ.jpg",
      "backdrop_image": "/iXU87IdtNsYt7n6OigPJBDdbFf1.jpg",
      "user_rating": 7.074999809265137,
      "mpa_rating": "PG",
      "genres": "Action, Animation, Comedy, Family",
      "streaming_services": "Theater",
      "watch_status": "WATCHED"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 500: Server error

### Add Movie to Favorites

Adds a movie to a profile's favorites list. If the movie doesn't exist in the database, it will be fetched from TMDB and
added.

**Endpoint:** `POST /profiles/{profileId}/movies/favorites`

**Parameters:**

- `profileId` (path parameter, required): Unique identifier of the profile
- Request body:
  ```json
  {
    "id": 774370 // TMDB movie ID
  }
  ```

**Example Response:**

```json
{
  "message": "Successfully saved Dog Man as a favorite",
  "result": {
    "favoritedMovie": {
      "profile_id": 3,
      "movie_id": 65,
      "tmdb_id": 774370,
      "title": "Dog Man",
      "description": "When a faithful police dog and his human police officer owner are injured together on the job...",
      "release_date": "2025-01-24",
      "runtime": 89,
      "poster_image": "/89wNiexZdvLQ41OQWIsQy4O6jAQ.jpg",
      "backdrop_image": "/iXU87IdtNsYt7n6OigPJBDdbFf1.jpg",
      "user_rating": 7.074999809265137,
      "mpa_rating": "PG",
      "genres": "Action, Animation, Comedy, Family",
      "streaming_services": "Theater",
      "watch_status": "WATCHED"
    },
    "recentMovies": [{ "movie_id": 65 }, { "movie_id": 66 }, { "movie_id": 67 }],
    "upcomingMovies": [{ "movie_id": 68 }, { "movie_id": 69 }, { "movie_id": 70 }]
  }
}
```

**Status Codes:**

- 200: Success
- 500: Server error

### Remove Movie from Favorites

Removes a movie from a profile's favorites list.

**Endpoint:** `DELETE /profiles/{profileId}/movies/favorites/{movieId}`

**Parameters:**

- `profileId` (path parameter, required): Unique identifier of the profile
- `movieId` (path parameter, required): Unique identifier of the movie

**Example Response:**

```json
{
  "message": "Successfully removed the movie from favorites",
  "result": {
    "removedMovie": {
      "movie_id": 65,
      "title": "Dog Man"
    },
    "recentMovies": [{ "movie_id": 65 }, { "movie_id": 66 }, { "movie_id": 67 }],
    "upcomingMovies": [{ "movie_id": 68 }, { "movie_id": 69 }, { "movie_id": 70 }]
  }
}
```

**Status Codes:**

- 200: Success
- 400: Bad Request: The movie to remove isn't a favorite
- 500: Server error

### Update Movie Watch Status

Updates the watch status of a movie for a specific profile.

**Endpoint:** `PUT /profiles/{profileId}/movies/watchstatus`

**Parameters:**

- `profileId` (path parameter, required): Unique identifier of the profile
- Request body:
  ```json
  {
    "movie_id": 65,
    "status": "WATCHED" // Possible values: "WATCHED", "NOT_WATCHING"
  }
  ```

**Example Response:**

```json
{
  "message": "Successfully updated the watch status"
}
```

**Status Codes:**

- 200: Success
- 400: Bad Request: The watch status wasn't updated
- 500: Server error

### Get Recent and Upcoming Movies

Retrieves both recent and upcoming movie releases for a specific profile.

**Endpoint:** `GET /profiles/{profileId}/movies/recentUpcoming`

**Parameters:**

- `profileId` (path parameter, required): Unique identifier of the profile

**Example Response:**

```json
{
  "message": "Successfully retrieved recent & upcoming movies for a profile",
  "results": {
    "recent": [{ "movie_id": 65 }, { "movie_id": 66 }, { "movie_id": 67 }],
    "upcoming": [{ "movie_id": 68 }, { "movie_id": 69 }, { "movie_id": 70 }]
  }
}
```

**Status Codes:**

- 200: Success
- 500: Server error
