[Home](../README.md)

# Community Recommendations API Documentation

This document describes the endpoints available for the community recommendations feature — a community-wide feed where
profiles can recommend shows and movies to the rest of the community, optionally attaching a star rating and a personal
message. This is distinct from the personal [Ratings API](./ratings.md), which stores private, per-profile star ratings
that are never shared with other users.

## Base URL

This resource is mounted at two different base paths depending on whether an endpoint operates on the public community
feed or on a specific profile's own recommendations:

- `/api/v1/community/recommendations` — the public, anonymized community feed (not scoped to an account/profile)
- `/api/v1/accounts/{accountId}/profiles/{profileId}/recommendations` — a specific profile's own recommendation actions
  (submitting, viewing, and removing their own recommendations)

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

**This resource has a different authorization model than the rest of the API.** The two
`/api/v1/community/recommendations*` GET endpoints only require that the caller be an authenticated user — there is **no
account-ownership check**, since they return an anonymized, community-wide feed that isn't scoped to any particular
account or profile. Every other endpoint documented here (and in every other resource in this API) additionally requires
that the authenticated user's account owns the `accountId`/`profileId` in the path, enforced via the standard
account-authorization check.

## Data Structures

### Community Recommendation Object

An aggregated, anonymized entry summarizing all recommendations submitted by any profile for a piece of content.
Returned by the public community feed endpoints. Never exposes which profiles submitted the underlying recommendations.

```typescript
{
  id: number,
  contentType: 'show' | 'movie',
  contentId: number, // internal database ID of the show or movie
  tmdbId: number,
  contentTitle: string,
  posterImage: string,
  releaseDate: string, // ISO format (YYYY-MM-DD)
  genres: string, // comma-separated list of genre names
  averageRating: number | null, // average of all star ratings attached to recommendations for this content
  ratingCount: number, // number of profiles that included a star rating
  messageCount: number, // number of profiles that included a written message
  recommendationCount: number, // total number of profiles that recommended this content
  createdAt: string // ISO timestamp of the earliest recommendation for this content
}
```

### Recommendation Detail Object

The per-profile breakdown behind a single `CommunityRecommendation` entry. Profile identity is not exposed — only a
display name.

```typescript
{
  profileName: string,
  rating: number | null, // 1-5, or null if no rating was included
  message: string | null,
  createdAt: string // ISO timestamp
}
```

### Profile Recommendation Object

A recommendation as submitted by (and attributed to) the authenticated profile. Returned by the profile-scoped
endpoints.

```typescript
{
  id: number,
  profileId: number,
  contentType: 'show' | 'movie',
  contentId: number,
  rating: number | null, // 1-5, or null if no rating was included
  message: string | null,
  createdAt: string // ISO timestamp
}
```

## Endpoints

### Get Community Recommendations Feed

Retrieves the public, anonymized community recommendations feed, aggregated across all profiles. Results are ordered by
total recommendation count (most-recommended first), then by recency.

**Endpoint:** `GET /api/v1/community/recommendations`

**Authentication:** Required (any authenticated user — no account-ownership check)

#### Parameters

- `contentType` (query, optional): Filter to only `show` or `movie` content. If omitted, both shows and movies are
  returned.

#### Response Format

```typescript
{
  message: string,
  recommendations: Array<CommunityRecommendation>
}
```

#### Example Response

```json
{
  "message": "Retrieved community recommendations",
  "recommendations": [
    {
      "id": 3,
      "contentType": "show",
      "contentId": 101,
      "tmdbId": 1396,
      "contentTitle": "Breaking Bad",
      "posterImage": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "releaseDate": "2008-01-20",
      "genres": "Drama, Crime, Thriller",
      "averageRating": 4.7,
      "ratingCount": 15,
      "messageCount": 8,
      "recommendationCount": 20,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": 9,
      "contentType": "movie",
      "contentId": 550,
      "tmdbId": 550,
      "contentTitle": "Fight Club",
      "posterImage": "https://image.tmdb.org/t/p/w500/fight-club.jpg",
      "releaseDate": "1999-10-15",
      "genres": "Drama",
      "averageRating": null,
      "ratingCount": 0,
      "messageCount": 3,
      "recommendationCount": 5,
      "createdAt": "2024-02-14T09:12:00Z"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 400: Invalid `contentType` query parameter
- 401: Authentication required
- 500: Server error

---

### Get Recommendation Details

Retrieves the individual, per-profile breakdown behind a single community recommendation entry — who recommended it (by
display name only), and any rating/message they included.

**Endpoint:** `GET /api/v1/community/recommendations/{contentType}/{contentId}`

**Authentication:** Required (any authenticated user — no account-ownership check)

#### Parameters

- `contentType` (path, required): `show` or `movie`
- `contentId` (path, required): Unique identifier (internal database ID) of the show or movie

#### Response Format

```typescript
{
  message: string,
  details: Array<RecommendationDetail>
}
```

#### Example Response

```json
{
  "message": "Retrieved recommendation details",
  "details": [
    {
      "profileName": "Alice",
      "rating": 5,
      "message": "Absolutely unmissable.",
      "createdAt": "2024-03-10T18:00:00Z"
    },
    {
      "profileName": "Bob",
      "rating": null,
      "message": "Solid show, worth the hype.",
      "createdAt": "2024-02-02T11:45:00Z"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 400: Invalid `contentType` or `contentId` path parameter
- 401: Authentication required
- 500: Server error

---

### Get Profile's Recommendations

Retrieves the recommendations submitted by a specific profile.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/recommendations`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  recommendations: Array<ProfileRecommendation>
}
```

#### Example Response

```json
{
  "message": "Retrieved recommendations for profile",
  "recommendations": [
    {
      "id": 7,
      "profileId": 456,
      "contentType": "movie",
      "contentId": 550,
      "rating": 5,
      "message": "You have to watch this — it changed how I think about filmmaking.",
      "createdAt": "2024-03-10T18:00:00Z"
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

### Send a Recommendation

Submits a recommendation for a show or movie from a profile, optionally including a star rating and/or a personal
message. A profile can only recommend a given piece of content once.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/recommendations`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "contentType": "show",
  "contentId": 101,
  "rating": 5,
  "message": "One of the greatest TV dramas ever made."
}
```

#### Request Body Fields

- `contentType` (required): `show` or `movie`
- `contentId` (required): Positive integer ID of the show or movie being recommended
- `rating` (optional): Star rating from 1 to 5, or `null` to omit a rating
- `message` (optional): Personal message, maximum 500 characters, or `null` to omit a message

#### Response Format

```typescript
{
  message: string,
  recommendation: ProfileRecommendation
}
```

#### Example Response

```json
{
  "message": "Recommendation added successfully",
  "recommendation": {
    "id": 7,
    "profileId": 456,
    "contentType": "show",
    "contentId": 101,
    "rating": 5,
    "message": "One of the greatest TV dramas ever made.",
    "createdAt": "2024-03-10T18:00:00Z"
  }
}
```

**Status Codes:**

- 201: Recommendation added successfully
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 409: This profile has already recommended this content
- 500: Server error

---

### Remove a Recommendation

Removes a previously submitted recommendation for a specific piece of content from a profile.

**Endpoint:** `DELETE /api/v1/accounts/{accountId}/profiles/{profileId}/recommendations`

#### Parameters

- `accountId` (path, required): Unique identifier of the account
- `profileId` (path, required): Unique identifier of the profile

#### Request Body

```json
{
  "contentType": "show",
  "contentId": 101
}
```

#### Request Body Fields

- `contentType` (required): `show` or `movie`
- `contentId` (required): Positive integer ID of the show or movie whose recommendation should be removed

Only `contentType` and `contentId` are used to locate the recommendation to delete; the request body schema is shared
with the "Send a Recommendation" endpoint, so `rating` and `message` may technically be included but are ignored.

#### Response Format

```json
{
  "message": "Recommendation removed successfully"
}
```

**Status Codes:**

- 200: Recommendation removed successfully
- 400: Invalid request body
- 401: Authentication required
- 403: Access forbidden
- 404: Recommendation not found for this profile and content
- 500: Server error

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "contentId",
      "message": "Content ID must be a positive integer"
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

Only applies to the profile-scoped endpoints (`/api/v1/accounts/{accountId}/profiles/{profileId}/recommendations`):

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

### Duplicate Recommendation (409 Conflict)

```json
{
  "error": "This profile has already recommended this content"
}
```

### Recommendation Not Found (404 Not Found)

```json
{
  "error": "Recommendation not found for this profile and content"
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
// Get the public community recommendations feed
async function getCommunityRecommendations(contentType: 'show' | 'movie' | undefined, token: string) {
  const query = contentType ? `?contentType=${contentType}` : '';
  const response = await fetch(`/api/v1/community/recommendations${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get the per-profile breakdown behind a community recommendation
async function getRecommendationDetails(contentType: 'show' | 'movie', contentId: number, token: string) {
  const response = await fetch(`/api/v1/community/recommendations/${contentType}/${contentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get a profile's own submitted recommendations
async function getProfileRecommendations(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Send a recommendation
async function sendRecommendation(
  accountId: number,
  profileId: number,
  contentType: 'show' | 'movie',
  contentId: number,
  rating: number | null,
  message: string | null,
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType, contentId, rating, message }),
  });
  return await response.json();
}

// Remove a recommendation
async function removeRecommendation(
  accountId: number,
  profileId: number,
  contentType: 'show' | 'movie',
  contentId: number,
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/recommendations`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contentType, contentId }),
  });
  return await response.json();
}
```

### cURL Examples

```bash
# Get the community recommendations feed (all content types)
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/community/recommendations

# Get the community recommendations feed (shows only)
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/community/recommendations?contentType=show"

# Get the per-profile breakdown for a specific show
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/community/recommendations/show/101

# Get a profile's own recommendations
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/recommendations

# Send a recommendation with a rating and message
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"contentType": "show", "contentId": 101, "rating": 5, "message": "One of the greatest TV dramas ever made."}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/recommendations

# Remove a recommendation
curl -X DELETE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"contentType": "show", "contentId": 101}' \
  https://api.example.com/api/v1/accounts/123/profiles/456/recommendations
```

## Additional Notes

- The community feed is anonymized by design — `CommunityRecommendation` and `RecommendationDetail` never expose a
  `profileId`, only a display `profileName` on the detail view. Use the profile-scoped endpoints to manage a specific
  profile's own recommendations.
- A profile can recommend a given piece of content only once; attempting to recommend the same content twice returns a
  409 Conflict. To change a rating or message, remove the existing recommendation first and resubmit.
- `rating` and `message` are both optional on a recommendation — a profile can recommend content with neither, either,
  or both.
- `averageRating` on a `CommunityRecommendation` is calculated only from profiles that included a rating; it is `null`
  when no profile has rated the content, even if others have recommended it with just a message.
- Recommending content is independent of personally rating it — see the [Ratings API](./ratings.md) for private,
  per-profile star ratings and notes that are never shown to other users.
- See [Shows API](./shows.md) and [Movies API](./movies.md) for details on the show/movie objects referenced by
  `contentId`.
