[Home](../README.md)

# Ratings API Documentation

This document describes the endpoints available for managing a profile's private star ratings and notes for shows and
movies. Ratings are personal to the profile that created them and are never shown to other profiles or accounts — for a
community-facing alternative where a rating can be shared alongside a recommendation, see the
[Community Recommendations API](./communityRecommendations.md).

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}/ratings`

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Data Structures

### Content Rating Object

```typescript
{
  id: number,
  profileId: number,
  contentType: 'show' | 'movie',
  contentId: number,
  contentTitle: string,
  posterImage: string,
  rating: number, // 1-5 star scale
  note: string | null,
  createdAt: string, // ISO timestamp
  updatedAt: string // ISO timestamp
}
```

## Endpoints

### Get Ratings for Profile

Retrieves all ratings a profile has submitted for shows and movies, most recently updated first.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/ratings`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  ratings: Array<ContentRating>
}
```

#### Example Response

```json
{
  "message": "Retrieved ratings for profile",
  "ratings": [
    {
      "id": 1,
      "profileId": 456,
      "contentType": "show",
      "contentId": 101,
      "contentTitle": "Breaking Bad",
      "posterImage": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "rating": 5,
      "note": "One of the best shows ever made.",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "profileId": 456,
      "contentType": "movie",
      "contentId": 550,
      "contentTitle": "Fight Club",
      "posterImage": "https://image.tmdb.org/t/p/w500/fight-club.jpg",
      "rating": 4,
      "note": null,
      "createdAt": "2024-02-02T14:05:00Z",
      "updatedAt": "2024-02-02T14:05:00Z"
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

### Save a Rating

Creates or updates a profile's rating for a show or movie. If the profile has already rated the given content, the
existing rating (and note) is replaced; otherwise a new rating record is created. This is an upsert — the same endpoint
is used whether the profile is rating the content for the first time or changing an existing rating.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/ratings`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "contentType": "show",
  "contentId": 101,
  "rating": 4,
  "note": "Great writing but the ending disappointed me.",
  "contentTitle": "Breaking Bad",
  "posterImage": "https://image.tmdb.org/t/p/w500/poster.jpg"
}
```

#### Request Body Fields

- `contentType` (required): `show` or `movie`
- `contentId` (required): Positive integer ID of the show or movie being rated
- `rating` (required): Star rating from 1 to 5
- `note` (optional): Personal note to accompany the rating, maximum 1000 characters, or `null` to omit
- `contentTitle` (required): Display title of the content, denormalized onto the rating record for display without a
  follow-up lookup
- `posterImage` (required): Poster image URL of the content, denormalized onto the rating record for the same reason

#### Response Format

```typescript
{
  message: string,
  rating: ContentRating
}
```

#### Example Response

```json
{
  "message": "Rating saved successfully",
  "rating": {
    "id": 1,
    "profileId": 456,
    "contentType": "show",
    "contentId": 101,
    "contentTitle": "Breaking Bad",
    "posterImage": "https://image.tmdb.org/t/p/w500/poster.jpg",
    "rating": 4,
    "note": "Great writing but the ending disappointed me.",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-03-20T08:15:00Z"
  }
}
```

**Status Codes:**

- 200: Rating saved successfully (covers both the initial create and any subsequent update)
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Delete a Rating

Deletes a rating by its ID. The rating must belong to the specified profile.

**Endpoint:** `DELETE /api/v1/accounts/{accountId}/profiles/{profileId}/ratings/{ratingId}`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile
- `ratingId` (path, required): Unique identifier of the rating to delete

#### Response Format

```json
{
  "message": "Rating deleted successfully"
}
```

**Status Codes:**

- 200: Rating deleted successfully
- 400: Invalid path parameter
- 401: Authentication required
- 403: Access forbidden
- 404: Rating not found or does not belong to this profile
- 500: Server error

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "rating",
      "message": "Number must be less than or equal to 5"
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

If the account is valid but the profile does not belong to it:

```json
{
  "error": "Access forbidden to this profile, it does not belong to the provided account"
}
```

### Rating Not Found (404 Not Found)

```json
{
  "error": "Rating not found or does not belong to this profile"
}
```

### Server Errors (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

### JavaScript/TypeScript Examples

```typescript
// Get all ratings for a profile
async function getRatingsForProfile(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/ratings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Save (create or update) a rating
async function saveRating(
  accountId: number,
  profileId: number,
  contentType: 'show' | 'movie',
  contentId: number,
  rating: number,
  note: string | null,
  contentTitle: string,
  posterImage: string,
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType, contentId, rating, note, contentTitle, posterImage }),
  });
  return await response.json();
}

// Delete a rating
async function deleteRating(accountId: number, profileId: number, ratingId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/ratings/${ratingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Complete workflow: rate a show, then update the rating, then delete it
async function manageRatingLifecycle() {
  const token = 'your_jwt_token';
  const accountId = 123;
  const profileId = 456;

  try {
    // 1. Rate a show for the first time
    console.log('Saving initial rating...');
    const saveResult = await saveRating(
      accountId,
      profileId,
      'show',
      101,
      4,
      'Great writing but the ending disappointed me.',
      'Breaking Bad',
      'https://image.tmdb.org/t/p/w500/poster.jpg',
      token,
    );
    const ratingId = saveResult.rating.id;

    // 2. Change the rating and note (upsert overwrites the existing record)
    console.log('Updating rating...');
    await saveRating(
      accountId,
      profileId,
      'show',
      101,
      5,
      'Changed my mind — this is a masterpiece.',
      'Breaking Bad',
      'https://image.tmdb.org/t/p/w500/poster.jpg',
      token,
    );

    // 3. Remove the rating entirely
    console.log('Deleting rating...');
    await deleteRating(accountId, profileId, ratingId, token);
  } catch (error) {
    console.error('Error managing rating:', error);
  }
}
```

### cURL Examples

```bash
# Get all ratings for a profile
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/ratings

# Save a rating with a note
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"contentType": "show", "contentId": 101, "rating": 4, "note": "Great writing but the ending disappointed me.", "contentTitle": "Breaking Bad", "posterImage": "https://image.tmdb.org/t/p/w500/poster.jpg"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/ratings

# Save a rating with no note
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"contentType": "movie", "contentId": 550, "rating": 5, "contentTitle": "Fight Club", "posterImage": "https://image.tmdb.org/t/p/w500/fight-club.jpg"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/ratings

# Delete a rating
curl -X DELETE \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/ratings/1
```

## Additional Notes

- Saving a rating is an upsert keyed on `profileId` + `contentType` + `contentId` — there is no separate "update"
  endpoint; POST again with the same content to change the rating or note.
- `contentTitle` and `posterImage` are supplied by the caller and denormalized onto the rating record rather than looked
  up server-side, so the client should pass the current title/poster from the corresponding [Show](./shows.md) or
  [Movie](./movies.md) object when saving a rating.
- `note` is entirely optional — a rating can be submitted with just a star value and no written note.
- Ratings are private to the profile that created them; they are never exposed to other profiles or accounts. To share a
  rating with the community alongside an optional message, use the
  [Community Recommendations API](./communityRecommendations.md) instead.
- Deleting a rating only removes the rating/note record — it has no effect on the profile's favorites list or watch
  status for the underlying show or movie.
