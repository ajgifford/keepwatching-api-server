[Home](../README.md)

# Discover API Documentation

This document describes the endpoints available for content discovery including top content, trending content, and
content changes (new additions and expiring content) across various streaming services.

## Base URL

All endpoints are prefixed with `/api/v1/discover`

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

### Discover Response Object

```typescript
{
  message: string,
  results: Array<{
    id: string,
    title: string,
    overview?: string,
    release_date?: string,
    first_air_date?: string,
    vote_average?: number,
    poster_path?: string,
    backdrop_path?: string,
    genre_ids?: number[],
    // ... other TMDB properties
  }>,
  total_results: number,
  total_pages: number,
  current_page: number
}
```

### Supported Show Types

- `movie` - Movies
- `series` - TV Series/Shows

### Supported Streaming Services

- `netflix` - Netflix
- `amazon_prime` - Amazon Prime Video
- `disney_plus` - Disney+
- `hulu` - Hulu
- `apple_tv` - Apple TV+
- `hbo_max` - HBO Max
- `paramount_plus` - Paramount+
- And other supported streaming services...

### Supported Change Types

- `new` - Recently added content
- `expiring` - Content expiring soon
- `updated` - Recently updated content

## Endpoints

### Discover Top Content

Retrieves top-rated or most popular content from a specific streaming service.

**Endpoint:** `GET /api/v1/discover/top`

**Authentication:** Required

#### Query Parameters

- `showType` (required): Type of content (`movie` or `series`)
- `service` (required): Streaming service identifier

#### Example Request

```
GET /api/v1/discover/top?showType=movie&service=netflix
```

#### Response Format

```typescript
{
  message: string,
  results: Array<ContentItem>,
  total_results: number,
  total_pages: number,
  current_page: number
}
```

#### Example Response

```json
{
  "message": "Found top movie for netflix",
  "results": [
    {
      "id": "550",
      "title": "Fight Club",
      "overview": "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
      "release_date": "1999-10-15",
      "vote_average": 8.4,
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "backdrop_path": "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
      "genre_ids": [18, 53, 35]
    },
    {
      "id": "13",
      "title": "Forrest Gump",
      "overview": "A man with a low IQ has accomplished great things in his life and been present during significant historic events.",
      "release_date": "1994-06-23",
      "vote_average": 8.5,
      "poster_path": "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      "backdrop_path": "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
      "genre_ids": [35, 18, 10749]
    }
  ],
  "total_results": 50,
  "total_pages": 3,
  "current_page": 1
}
```

**Status Codes:**

- 200: Success
- 400: Invalid query parameters or validation errors
- 401: Authentication required
- 500: Server error

---

### Discover Content Changes

Retrieves content that has recently been added, updated, or is expiring from a streaming service.

**Endpoint:** `GET /api/v1/discover/changes`

**Authentication:** Required

#### Query Parameters

- `showType` (required): Type of content (`movie` or `series`)
- `service` (required): Streaming service identifier
- `changeType` (required): Type of change (`new`, `expiring`, or `updated`)

#### Example Request

```
GET /api/v1/discover/changes?showType=series&service=netflix&changeType=new
```

#### Response Format

```typescript
{
  message: string,
  results: Array<ContentItem>,
  total_results: number,
  total_pages: number,
  current_page: number
}
```

#### Example Response

```json
{
  "message": "Found new series for netflix",
  "results": [
    {
      "id": "94605",
      "title": "Arcane",
      "overview": "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
      "first_air_date": "2021-11-06",
      "vote_average": 9.0,
      "poster_path": "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      "backdrop_path": "/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg",
      "genre_ids": [16, 10765, 10759, 18]
    },
    {
      "id": "85552",
      "title": "Euphoria",
      "overview": "A group of high school students navigate love and friendships in a world of drugs, sex, trauma and social media.",
      "first_air_date": "2019-06-16",
      "vote_average": 8.4,
      "poster_path": "/jtnfNzqZwN4E32FGGxx1YZaBWWf.jpg",
      "backdrop_path": "/oKt4J3TFjWirVwBqoHyIvv5IImd.jpg",
      "genre_ids": [18]
    }
  ],
  "total_results": 25,
  "total_pages": 2,
  "current_page": 1
}
```

**Status Codes:**

- 200: Success
- 400: Invalid query parameters or validation errors
- 401: Authentication required
- 500: Server error

---

### Discover Trending Content

Retrieves currently trending content of a specific type.

**Endpoint:** `GET /api/v1/discover/trending`

**Authentication:** Required

#### Query Parameters

- `showType` (required): Type of content (`movie` or `series`)
- `page` (optional): Page number for pagination (default: 1)

#### Example Request

```
GET /api/v1/discover/trending?showType=movie&page=2
```

#### Response Format

```typescript
{
  message: string,
  results: Array<ContentItem>,
  total_results: number,
  total_pages: number,
  current_page: number
}
```

#### Example Response

```json
{
  "message": "Found trending movie",
  "results": [
    {
      "id": "872585",
      "title": "Oppenheimer",
      "overview": "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
      "release_date": "2023-07-21",
      "vote_average": 8.1,
      "poster_path": "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      "backdrop_path": "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
      "genre_ids": [18, 36]
    },
    {
      "id": "346698",
      "title": "Barbie",
      "overview": "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land.",
      "release_date": "2023-07-21",
      "vote_average": 7.2,
      "poster_path": "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
      "backdrop_path": "/nHf61UzkfFno5X1ofIhugCPus2R.jpg",
      "genre_ids": [35, 12, 14]
    }
  ],
  "total_results": 500,
  "total_pages": 25,
  "current_page": 2
}
```

**Status Codes:**

- 200: Success
- 400: Invalid query parameters or validation errors
- 401: Authentication required
- 500: Server error

## Query Parameter Validation

### Show Type Validation

**Valid Values:**

- `movie` - For movie content
- `series` - For TV series/show content

**Example Error Response for Invalid Show Type:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "showType",
      "message": "Show type must be either 'movie' or 'series'"
    }
  ]
}
```

### Service Validation

**Valid Values:**

- `netflix`
- `amazon_prime`
- `disney_plus`
- `hulu`
- `apple_tv`
- `hbo_max`
- `paramount_plus`
- Additional services as supported by the streaming availability API

**Example Error Response for Invalid Service:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "service",
      "message": "Invalid streaming service specified"
    }
  ]
}
```

### Change Type Validation

**Valid Values:**

- `new` - Recently added content
- `expiring` - Content that will be removed soon
- `updated` - Recently updated content

**Example Error Response for Invalid Change Type:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "changeType",
      "message": "Change type must be 'new', 'expiring', or 'updated'"
    }
  ]
}
```

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "showType",
      "message": "Show type is required"
    },
    {
      "field": "service",
      "message": "Streaming service is required"
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

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

### Service Unavailable (503 Service Unavailable)

```json
{
  "error": "Content discovery service temporarily unavailable"
}
```

## Data Sources

The discovery endpoints integrate with external APIs to provide up-to-date content information:

- **TMDB (The Movie Database)** - For content metadata, ratings, and images
- **Streaming Availability API** - For real-time streaming service availability
- **Internal caching** - For performance optimization and rate limit management

## Caching

Discovery data is cached to improve performance and reduce external API calls:

- **Top content** - Cached for 2 hours
- **Trending content** - Cached for 1 hour
- **Content changes** - Cached for 30 minutes

Cache invalidation occurs automatically based on content freshness requirements.

## Example Usage

### JavaScript/TypeScript Examples

```typescript
// Discover top movies on Netflix
async function getTopNetflixMovies(token: string) {
  const response = await fetch('/api/v1/discover/top?showType=movie&service=netflix', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discovery failed: ${response.statusText}`);
  }

  return await response.json();
}

// Discover new series on Disney+
async function getNewDisneyPlusSeries(token: string) {
  const response = await fetch('/api/v1/discover/changes?showType=series&service=disney_plus&changeType=new', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discovery failed: ${response.statusText}`);
  }

  return await response.json();
}

// Discover trending movies with pagination
async function getTrendingMovies(page: number = 1, token: string) {
  const response = await fetch(`/api/v1/discover/trending?showType=movie&page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discovery failed: ${response.statusText}`);
  }

  return await response.json();
}

// Get expiring content from multiple services
async function getExpiringContent(services: string[], showType: 'movie' | 'series', token: string) {
  const promises = services.map((service) =>
    fetch(`/api/v1/discover/changes?showType=${showType}&service=${service}&changeType=expiring`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => res.json()),
  );

  const results = await Promise.all(promises);

  // Combine results from all services
  return results.reduce(
    (combined, result) => {
      combined.results.push(...result.results);
      combined.total_results += result.total_results;
      return combined;
    },
    { results: [], total_results: 0 },
  );
}

// Content discovery with error handling
async function discoverContentSafely(
  endpoint: 'top' | 'changes' | 'trending',
  params: Record<string, string>,
  token: string,
) {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/v1/discover/${endpoint}?${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      } else if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(
          `Validation error: ${errorData.details?.map((d) => d.message).join(', ') || 'Invalid parameters'}`,
        );
      } else {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Content discovery error:', error);
    throw error;
  }
}
```

### cURL Examples

```bash
# Discover top movies on Netflix
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/discover/top?showType=movie&service=netflix"

# Discover new series on Disney+
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/discover/changes?showType=series&service=disney_plus&changeType=new"

# Discover trending movies (page 2)
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/discover/trending?showType=movie&page=2"

# Discover expiring content on Hulu
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/discover/changes?showType=movie&service=hulu&changeType=expiring"
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';

interface DiscoverParams {
  showType: 'movie' | 'series';
  service?: string;
  changeType?: 'new' | 'expiring' | 'updated';
  page?: number;
}

interface DiscoverResult {
  message: string;
  results: any[];
  total_results: number;
  total_pages: number;
  current_page: number;
}

export function useDiscover(endpoint: 'top' | 'changes' | 'trending', params: DiscoverParams, token: string) {
  const [data, setData] = useState<DiscoverResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('showType', params.showType);

        if (params.service) queryParams.append('service', params.service);
        if (params.changeType) queryParams.append('changeType', params.changeType);
        if (params.page) queryParams.append('page', params.page.toString());

        const response = await fetch(`/api/v1/discover/${endpoint}?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Discovery failed: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (token && params.showType) {
      fetchData();
    }
  }, [endpoint, params.showType, params.service, params.changeType, params.page, token]);

  return { data, loading, error };
}
```

## Additional Notes

- Content metadata is sourced from TMDB and includes ratings, descriptions, and image paths
- Image URLs need to be constructed using TMDB's base image URL configuration
- Streaming service availability is based on the user's region (if supported)
- Content discovery results may vary by geographic location
- Some streaming services may have limited content discovery API access
- Results are automatically filtered for appropriate content ratings when applicable
- Genre IDs correspond to TMDB's genre taxonomy
- Discovery endpoints are optimized for performance with intelligent caching strategies
- Content freshness varies by endpoint: trending updates more frequently than top content
