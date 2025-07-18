[Home](../README.md)

# Person API Documentation

This document describes the endpoints available for managing person/actor data, including retrieving detailed
information about cast members, crew, and their filmography/credits from both internal database and TMDB sources.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/profiles/{profileId}`

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

### Person Object (Internal Database)

```typescript
{
  id: number,
  tmdbId: number,
  name: string,
  gender: number,
  biography: string,
  profileImage: string,
  birthdate: string,
  deathdate: string | null,
  placeOfBirth: string,
  movieCredits: Array<{
    name: string,
    poster: string,
    year: string,
    character: string,
    rating: number
  }>,
  showCredits: Array<{
    name: string,
    poster: string,
    year: string,
    character: string,
    rating: number,
    episodeCount: number
  }>
}
```

### SearchPerson Object (TMDB)

```typescript
{
  id: number,
  name: string,
  profileImage: string,
  department: string,
  popularity: number,
  biography: string,
  birthday: string,
  birthplace: string,
  deathday: string | null
}
```

### SearchPersonCredits Object

```typescript
{
  cast: Array<{
    tmdbId: number,
    title: string,
    posterImage: string,
    releaseDate: string,
    character: string,
    job: string,
    mediaType: 'tv' | 'movie',
    isCast?: boolean
  }>,
  crew: Array<{
    tmdbId: number,
    title: string,
    posterImage: string,
    releaseDate: string,
    character: string,
    job: string,
    mediaType: 'tv' | 'movie',
    isCast?: boolean
  }>
}
```

## Endpoints

### Get Person Details (Internal)

Retrieves person details from the internal database, including any locally stored information and metadata.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/person/{personId}`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile
- `personId` (path parameter, required): Unique identifier of the person in internal database

#### Response Format

```typescript
{
  message: string,
  person: Person
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved person details",
  "person": {
    "id": 123,
    "tmdbId": 17419,
    "name": "Bryan Cranston",
    "gender": 2,
    "biography": "Bryan Lee Cranston is an American actor, director, producer, and screenwriter, best known for his roles as Walter White in the AMC crime drama series Breaking Bad and Hal in the Fox comedy series Malcolm in the Middle.",
    "profileImage": "https://image.tmdb.org/t/p/w500/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg",
    "birthdate": "1956-03-07",
    "deathdate": null,
    "placeOfBirth": "Hollywood, California, USA",
    "movieCredits": [
      {
        "name": "Breaking Bad: El Camino",
        "poster": "https://image.tmdb.org/t/p/w500/ePXuKdXZuJx8hHMNr2yM4jY2L7Z.jpg",
        "year": "2019",
        "character": "Walter White",
        "rating": 7.3
      },
      {
        "name": "Ford v Ferrari",
        "poster": "https://image.tmdb.org/t/p/w500/dR1Ju50iudrOh3YgfwkAU1g2HZe.jpg",
        "year": "2019",
        "character": "Lee Iacocca",
        "rating": 8.1
      }
    ],
    "showCredits": [
      {
        "name": "Breaking Bad",
        "poster": "https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
        "year": "2008",
        "character": "Walter White",
        "rating": 9.5,
        "episodeCount": 62
      },
      {
        "name": "Malcolm in the Middle",
        "poster": "https://image.tmdb.org/t/p/w500/k5KDlEe3O73s0A8XWnNCIrRtpKo.jpg",
        "year": "2000",
        "character": "Hal",
        "rating": 8.0,
        "episodeCount": 151
      }
    ]
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Person not found
- 500: Server error

---

### Get TMDB Person Details

Retrieves comprehensive person details directly from The Movie Database (TMDB), including the most up-to-date biography,
filmography metadata, and personal information.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/tmdbPerson/{personId}`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile
- `personId` (path parameter, required): TMDB person ID

#### Response Format

```typescript
{
  message: string,
  person: SearchPerson
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved TMDB person details",
  "person": {
    "id": 17419,
    "name": "Bryan Cranston",
    "profileImage": "https://image.tmdb.org/t/p/w500/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg",
    "department": "Acting",
    "popularity": 45.678,
    "biography": "Bryan Lee Cranston (born March 7, 1956) is an American actor, director, producer, and screenwriter, best known for his roles as Walter White in the AMC crime drama series Breaking Bad (2008–2013), for which he won the Primetime Emmy Award for Outstanding Lead Actor in a Drama Series four times, and as Hal in the Fox comedy series Malcolm in the Middle (2000–2006).",
    "birthday": "1956-03-07",
    "birthplace": "Hollywood, California, USA",
    "deathday": null
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Person not found in TMDB
- 500: Server error

---

### Get TMDB Person Credits

Retrieves complete filmography and television credits for a person from TMDB, including both cast and crew roles across
movies and TV shows.

**Endpoint:** `GET /api/v1/accounts/{accountId}/profiles/{profileId}/tmdbPerson/{personId}/credits`

**Authentication:** Required

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile
- `personId` (path parameter, required): TMDB person ID

#### Response Format

```typescript
{
  message: string,
  credits: SearchPersonCredits
}
```

#### Example Response

```json
{
  "message": "Successfully retrieved TMDB person credits",
  "credits": {
    "cast": [
      {
        "tmdbId": 1396,
        "title": "Breaking Bad",
        "posterImage": "https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
        "releaseDate": "2008-01-20",
        "character": "Walter White",
        "job": "Actor",
        "mediaType": "tv",
        "isCast": true
      },
      {
        "tmdbId": 37165,
        "title": "Malcolm in the Middle",
        "posterImage": "https://image.tmdb.org/t/p/w500/k5KDlEe3O73s0A8XWnNCIrRtpKo.jpg",
        "releaseDate": "2000-01-09",
        "character": "Hal",
        "job": "Actor",
        "mediaType": "tv",
        "isCast": true
      },
      {
        "tmdbId": 559,
        "title": "Spider-Man: Into the Spider-Verse",
        "posterImage": "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
        "releaseDate": "2018-12-14",
        "character": "Li (voice)",
        "job": "Voice Actor",
        "mediaType": "movie",
        "isCast": true
      }
    ],
    "crew": [
      {
        "tmdbId": 1396,
        "title": "Breaking Bad",
        "posterImage": "https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
        "releaseDate": "2008-01-20",
        "character": "",
        "job": "Executive Producer",
        "mediaType": "tv",
        "isCast": false
      },
      {
        "tmdbId": 456,
        "title": "Drive",
        "posterImage": "https://image.tmdb.org/t/p/w500/602vevIURmpDfzbnv5Ubi6wIkWT.jpg",
        "releaseDate": "2011-09-15",
        "character": "",
        "job": "Producer",
        "mediaType": "movie",
        "isCast": false
      }
    ]
  }
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Person not found in TMDB
- 500: Server error

## Authorization

All person endpoints require that:

- The user is authenticated
- The user owns the account specified in the URL
- The profile must belong to the specified account

## Data Sources

### Internal Database vs TMDB

- **Internal Person Details**: Returns locally stored person information, which may include custom metadata or cached
  data
- **TMDB Person Details**: Returns real-time data directly from The Movie Database with the most current information
- **TMDB Credits**: Provides comprehensive filmography data including both well-known and lesser-known roles

### Person Gender Codes

The system uses numeric codes for gender following TMDB standards:

- `0`: Not specified / unknown
- `1`: Female
- `2`: Male
- `3`: Non-binary

### Media Types

Credits are categorized by media type:

- `movie`: Feature films
- `tv`: Television series and shows

### Credit Properties

- **tmdbId**: TMDB identifier for the content
- **title**: Name of the movie or TV show
- **posterImage**: URL to the content's poster
- **releaseDate**: Release/air date in ISO format (YYYY-MM-DD)
- **character**: Character name (empty for crew roles)
- **job**: Role description (Actor, Director, Producer, etc.)
- **mediaType**: Either 'movie' or 'tv'
- **isCast**: Optional boolean indicating cast vs crew role

## Caching

Person data caching strategy:

- **Internal person details**: Cached for 1 hour
- **TMDB person details**: Cached for 6 hours (updated less frequently)
- **TMDB credits**: Cached for 12 hours (filmography changes infrequently)
- **Cache invalidation**: Manual refresh available through background jobs

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

### Person Not Found (404 Not Found)

```json
{
  "error": "Person not found"
}
```

### TMDB Person Not Found (404 Not Found)

```json
{
  "error": "Person not found in TMDB database"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

### TMDB Service Unavailable (503 Service Unavailable)

```json
{
  "error": "TMDB service temporarily unavailable"
}
```

## Example Usage

### JavaScript/TypeScript Examples

```typescript
// Get internal person details
async function getPersonDetails(accountId: number, profileId: number, personId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/person/${personId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get person details: ${response.statusText}`);
  }

  return await response.json();
}

// Get TMDB person details
async function getTMDBPersonDetails(accountId: number, profileId: number, tmdbPersonId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/tmdbPerson/${tmdbPersonId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get TMDB person details: ${response.statusText}`);
  }

  return await response.json();
}

// Get TMDB person credits
async function getTMDBPersonCredits(accountId: number, profileId: number, tmdbPersonId: number, token: string) {
  const response = await fetch(
    `/api/v1/accounts/${accountId}/profiles/${profileId}/tmdbPerson/${tmdbPersonId}/credits`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get person credits: ${response.statusText}`);
  }

  return await response.json();
}

// Comprehensive person information retrieval
async function getCompletePersonInfo(accountId: number, profileId: number, tmdbPersonId: number, token: string) {
  try {
    const [personDetails, personCredits] = await Promise.all([
      getTMDBPersonDetails(accountId, profileId, tmdbPersonId, token),
      getTMDBPersonCredits(accountId, profileId, tmdbPersonId, token),
    ]);

    return {
      person: personDetails.person,
      credits: personCredits.credits,
      summary: {
        totalCredits: personCredits.credits.cast.length + personCredits.credits.crew.length,
        castRoles: personCredits.credits.cast.length,
        crewRoles: personCredits.credits.crew.length,
        department: personDetails.person.department,
        mostRecentWork: personCredits.credits.cast.sort(
          (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
        )[0],
      },
    };
  } catch (error) {
    console.error('Error retrieving person information:', error);
    throw error;
  }
}

// Filter credits by media type
function filterCreditsByMediaType(credits: SearchPersonCredits, mediaType: 'movie' | 'tv') {
  return {
    cast: credits.cast.filter((credit) => credit.mediaType === mediaType),
    crew: credits.crew.filter((credit) => credit.mediaType === mediaType),
  };
}

// Get person's most recent work
function getMostRecentWork(credits: SearchPersonCredits, limit: number = 10) {
  const allWork = [...credits.cast, ...credits.crew];

  return allWork
    .filter((work) => work.releaseDate)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, limit);
}

// Advanced person analysis
async function analyzePersonCareer(accountId: number, profileId: number, tmdbPersonId: number, token: string) {
  try {
    const personInfo = await getCompletePersonInfo(accountId, profileId, tmdbPersonId, token);

    const movieCredits = filterCreditsByMediaType(personInfo.credits, 'movie');
    const tvCredits = filterCreditsByMediaType(personInfo.credits, 'tv');

    const recentWork = getMostRecentWork(personInfo.credits);

    // Calculate career span
    const allReleases = personInfo.credits.cast
      .map((work) => work.releaseDate)
      .filter((date) => date)
      .sort();

    const careerStart = allReleases[0];
    const careerEnd = allReleases[allReleases.length - 1];

    return {
      person: personInfo.person,
      careerAnalysis: {
        careerSpan: {
          start: careerStart,
          end: careerEnd,
          years: careerStart && careerEnd ? new Date(careerEnd).getFullYear() - new Date(careerStart).getFullYear() : 0,
        },
        workDistribution: {
          movies: movieCredits.cast.length,
          tvShows: tvCredits.cast.length,
          totalProductions: movieCredits.crew.length + tvCredits.crew.length,
        },
        recentWork: recentWork.slice(0, 5),
        primaryDepartment: personInfo.person.department,
      },
    };
  } catch (error) {
    console.error('Error analyzing person career:', error);
    throw error;
  }
}

// Person search integration (works with search endpoints)
async function searchAndGetPersonDetails(query: string, accountId: number, profileId: number, token: string) {
  try {
    // First search for people (using search API)
    const searchResponse = await fetch(`/api/v1/search/people?searchString=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.statusText}`);
    }

    const searchResults = await searchResponse.json();

    if (searchResults.results.length === 0) {
      return { found: false, results: [] };
    }

    // Get detailed information for top search results
    const detailedResults = await Promise.all(
      searchResults.results.slice(0, 3).map(async (person: any) => {
        try {
          const details = await getTMDBPersonDetails(accountId, profileId, person.id, token);
          return { ...person, details: details.person };
        } catch (error) {
          console.warn(`Failed to get details for person ${person.id}:`, error);
          return person;
        }
      }),
    );

    return {
      found: true,
      results: detailedResults,
      totalResults: searchResults.total_results,
    };
  } catch (error) {
    console.error('Error in person search and details:', error);
    throw error;
  }
}
```

### React Hook Example

```typescript
import { useCallback, useEffect, useState } from 'react';

interface PersonDetails {
  person: Person | SearchPerson | null;
  credits?: SearchPersonCredits | null;
  loading: boolean;
  error: string | null;
}

interface UsePersonDetailsOptions {
  includeCredits?: boolean;
  autoFetch?: boolean;
}

export function usePersonDetails(
  accountId: number,
  profileId: number,
  tmdbPersonId: number | null,
  token: string,
  options: UsePersonDetailsOptions = {}
) {
  const { includeCredits = true, autoFetch = true } = options;

  const [state, setState] = useState<PersonDetails>({
    person: null,
    credits: null,
    loading: false,
    error: null,
  });

  const fetchPersonDetails = useCallback(async () => {
    if (!tmdbPersonId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const requests = [
        getTMDBPersonDetails(accountId, profileId, tmdbPersonId, token),
      ];

      if (includeCredits) {
        requests.push(getTMDBPersonCredits(accountId, profileId, tmdbPersonId, token));
      }

      const results = await Promise.all(requests);

      setState({
        person: results[0].person,
        credits: includeCredits && results[1] ? results[1].credits : null,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch person details',
      }));
    }
  }, [accountId, profileId, tmdbPersonId, token, includeCredits]);

  useEffect(() => {
    if (autoFetch && tmdbPersonId) {
      fetchPersonDetails();
    }
  }, [autoFetch, tmdbPersonId, fetchPersonDetails]);

  const retry = useCallback(() => {
    fetchPersonDetails();
  }, [fetchPersonDetails]);

  return {
    ...state,
    refetch: fetchPersonDetails,
    retry,
  };
}

// Usage example:
function PersonProfile({ tmdbPersonId }: { tmdbPersonId: number }) {
  const { person, credits, loading, error, retry } = usePersonDetails(
    123, // accountId
    456, // profileId
    tmdbPersonId,
    'your_token_here',
    { includeCredits: true }
  );

  if (loading) return <div>Loading person details...</div>;
  if (error) return <div>Error: {error} <button onClick={retry}>Retry</button></div>;
  if (!person) return <div>Person not found</div>;

  return (
    <div>
      <h1>{person.name}</h1>
      <p>{person.biography}</p>
      {credits && (
        <div>
          <h2>Filmography</h2>
          <p>Cast roles: {credits.cast.length}</p>
          <p>Crew roles: {credits.crew.length}</p>
        </div>
      )}
    </div>
  );
}
```

### cURL Examples

```bash
# Get internal person details
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/person/789

# Get TMDB person details
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/tmdbPerson/17419

# Get TMDB person credits
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/tmdbPerson/17419/credits

# Get person details with error handling
curl -f -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/profiles/456/tmdbPerson/17419 \
  || echo "Failed to retrieve person details"
```

## Performance Considerations

### Caching Strategy

- Implement client-side caching for frequently accessed person data
- Use appropriate cache durations based on data volatility
- Consider background refresh for popular actors/directors

### Batch Operations

- When displaying cast lists, consider batching person detail requests
- Implement progressive loading for large filmographies
- Use pagination for extensive credit lists

### Rate Limiting

- TMDB API has rate limits that may affect real-time requests
- Consider implementing request queuing for bulk person data retrieval
- Use internal database for frequently accessed person information

## Integration Notes

### Related Endpoints

- Use [Search API](./search.md) to find people before getting detailed information
- Use [Shows API](./shows.md) and [Movies API](./movies.md) to access cast information
- Person data integrates with show and movie cast/crew listings

### Cross-Platform IDs

- TMDB person IDs are consistent across all TMDB integrations
- IMDB IDs are provided when available for cross-platform lookups
- Internal person IDs may differ from TMDB IDs

## Additional Notes

- All image paths require TMDB base image URL for complete URLs
- Person biography and filmography data is automatically updated from TMDB
- Gender codes follow TMDB conventions (0=unknown, 1=female, 2=male, 3=non-binary)
- Person popularity scores are calculated by TMDB based on current search trends
- Profile images are served directly from TMDB CDN for optimal performance
- Person details support both internal database lookups and real-time TMDB queries
- Credits include both major and minor roles across the person's entire career
- Release dates for credits follow ISO 8601 format (YYYY-MM-DD)
- Credit data is sourced from TMDB and may be updated periodically
- Internal person records include curated filmography with ratings and episode counts
- The `department` field indicates the person's primary known contribution (Acting, Directing, Writing, etc.)
- Birthday and birthplace fields provide biographical context for person profiles
- Cast vs crew distinction is maintained through the `isCast` boolean flag in credits
- Person data caching helps optimize performance for frequently accessed actors and directors
- All person endpoints maintain referential integrity with show and movie cast information
