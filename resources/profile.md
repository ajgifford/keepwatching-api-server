[Home](../README.md)

# Profile API Documentation

This document describes the endpoints available for profile management including creating, retrieving, updating, and
deleting profiles within user accounts.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles`

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

### Profile Object

```typescript
{
  id: number,
  name: string,
  image: string,
  accountId?: number
}
```

### Profile with Content Object

```typescript
{
  profile: {
    id: number,
    accountId: number,
    name: string,
    image: string
  },
  shows: Array<{
    show_id: number,
    title: string,
    // ... other show properties
  }>,
  episodes: {
    recentEpisodes: Array<Episode>,
    upcomingEpisodes: Array<Episode>,
    nextUnwatchedEpisodes: Array<{
      show_id: number,
      episodes: Array<Episode>
    }>
  },
  movies: Array<{
    movie_id: number,
    title: string,
    // ... other movie properties
  }>,
  recentUpcomingMovies: {
    recentMovies: Array<Movie>,
    upcomingMovies: Array<Movie>
  }
}
```

## Endpoints

### Get All Profiles for Account

Retrieves all profiles associated with a specific account.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Response Format

```typescript
{
  message: string,
  profiles: Array<{
    id: number,
    name: string,
    image: string
  }>
}
```

#### Example Response

```json
{
  "message": "Retrieved profiles for account 123",
  "profiles": [
    {
      "id": 456,
      "name": "John's Profile",
      "image": "profile-456.jpg"
    },
    {
      "id": 457,
      "name": "Family Profile",
      "image": "profile-457.png"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 500: Server error

---

### Get Profile with Content

Retrieves a specific profile with all its associated content including shows, episodes, and movies.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Response Format

```typescript
{
  message: string,
  profileWithContent: {
    profile: Profile,
    shows: Array<Show>,
    episodes: EpisodeData,
    movies: Array<Movie>,
    recentUpcomingMovies: RecentUpcomingMovies
  }
}
```

#### Example Response

```json
{
  "message": "Retrieved profile with id: 456 and it's content",
  "profileWithContent": {
    "profile": {
      "id": 456,
      "accountId": 123,
      "name": "John's Profile",
      "image": "profile-456.jpg"
    },
    "shows": [
      {
        "show_id": 1,
        "title": "Breaking Bad",
        "watchStatus": "WATCHING"
      }
    ],
    "episodes": {
      "recentEpisodes": [
        {
          "episode_id": 101,
          "title": "Pilot",
          "air_date": "2025-01-15"
        }
      ],
      "upcomingEpisodes": [
        {
          "episode_id": 102,
          "title": "Next Episode",
          "air_date": "2025-06-10"
        }
      ],
      "nextUnwatchedEpisodes": [
        {
          "show_id": 1,
          "episodes": [
            {
              "episode_id": 103,
              "title": "Unwatched Episode"
            }
          ]
        }
      ]
    },
    "movies": [
      {
        "movie_id": 201,
        "title": "The Matrix",
        "watchStatus": "WATCHED"
      }
    ],
    "recentUpcomingMovies": {
      "recentMovies": [
        {
          "movie_id": 202,
          "title": "Recent Movie"
        }
      ],
      "upcomingMovies": [
        {
          "movie_id": 203,
          "title": "Upcoming Movie"
        }
      ]
    }
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Profile not found
- 500: Server error

---

### Create Profile

Creates a new profile for an account.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Request Body

```json
{
  "name": "New Profile Name"
}
```

#### Response Format

```typescript
{
  message: string,
  profile: {
    id: number,
    name: string,
    image: string
  }
}
```

#### Example Response

```json
{
  "message": "Profile added successfully",
  "profile": {
    "id": 458,
    "name": "New Profile Name",
    "image": "default-profile.jpg"
  }
}
```

**Status Codes:**

- 201: Profile created successfully
- 400: Invalid request body or validation errors
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 500: Server error

---

### Update Profile

Updates an existing profile's details.

**Endpoint:** `PUT /api/v1/accounts/{accountId}/profiles/{profileId}`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Request Body

```json
{
  "name": "Updated Profile Name"
}
```

#### Response Format

```typescript
{
  message: string,
  profile: {
    id: number,
    name: string,
    image: string
  }
}
```

#### Example Response

```json
{
  "message": "Profile edited successfully",
  "profile": {
    "id": 456,
    "name": "Updated Profile Name",
    "image": "profile-456.jpg"
  }
}
```

**Status Codes:**

- 200: Profile updated successfully
- 400: Invalid request body or validation errors
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Profile not found
- 500: Server error

---

### Delete Profile

Deletes a profile from an account. This action will cascade delete all watch status data for the profile.

**Endpoint:** `DELETE /api/v1/accounts/{accountId}/profiles/{profileId}`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Response Format

```json
{
  "message": "Profile deleted successfully"
}
```

**Status Codes:**

- 204: Profile deleted successfully
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Profile not found
- 500: Server error

## Authorization

All profile endpoints require that:

- The user is authenticated
- The user owns the account specified in the URL
- For profile-specific operations, the profile must belong to the specified account

## Validation Rules

### Profile Name

- **Required:** Yes
- **Type:** String
- **Length:** 1-100 characters
- **Special Characters:** Allowed

### Profile Image

- Managed through the separate File Upload API
- Default image assigned automatically for new profiles
- See [File Upload API Documentation](files.md) for image management

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Profile name is required"
    }
  ]
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
// Get all profiles for an account
async function getProfiles(accountId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Get profile with all content
async function getProfileWithContent(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// Create a new profile
async function createProfile(accountId: number, name: string, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  return await response.json();
}

// Update profile name
async function updateProfile(accountId: number, profileId: number, name: string, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  return await response.json();
}

// Delete profile
async function deleteProfile(accountId: number, profileId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.ok;
}
```

### cURL Examples

```bash
# Get all profiles for account
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles

# Get profile with content
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456

# Create new profile
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"name": "New Profile"}' \
  https://api.example.com/api/v1/accounts/123/profiles

# Update profile
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token_here" \
  -d '{"name": "Updated Name"}' \
  https://api.example.com/api/v1/accounts/123/profiles/456

# Delete profile
curl -X DELETE \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456
```

## Additional Notes

- Profile images are managed through the File Upload API endpoints
- Deleting a profile cascades to all associated watch status data
- Profile data includes comprehensive content aggregation (shows, movies, episodes)
- Profile cache is automatically invalidated when profiles are updated
- Default profile images are assigned automatically during creation
- Profile names must be unique within an account
- Each account can have multiple profiles for family sharing
- Recent and upcoming content is automatically calculated based on air dates and release dates
