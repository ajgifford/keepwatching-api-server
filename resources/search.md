[Home](../README.md)

# Search API Documentation

This document describes the endpoints available for searching TV shows and movies using text-based queries with optional filtering by year and pagination support.

## Base URL

All endpoints are prefixed with `/api/v1/search`

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

### Search Response Object

```typescript
{
  results: Array<{
    id: string,
    title?: string,          // For movies
    name?: string,           // For TV shows
    overview?: string,
    release_date?: string,   // For movies
    first_air_date?: string, // For TV shows
    vote_average?: number,
    vote_count?: number,
    popularity?: number,
    poster_path?: string,
    backdrop_path?: string,
    genre_ids?: number[],
    adult?: boolean,
    original_language?: string,
    original_title?: string, // For movies
    original_name?: string,  // For TV shows
    // ... other TMDB properties
  }>,
  total_results: number,
  total_pages: number,
  current_page: number
}
```

### Search Query Parameters

```typescript
{
  searchString: string,    // Required: The text to search for
  year?: string,          // Optional: Filter by year (YYYY format)
  page?: number          // Optional: Page number for pagination (default: 1)
}
```

## Endpoints

### Search TV Shows

Searches for TV shows and series using a text query with optional year filtering and pagination.

**Endpoint:** `GET /api/v1/search/shows`

**Authentication:** Required

#### Query Parameters

- `searchString` (required): The search term to find TV shows
- `year` (optional): Filter results by first air date year (YYYY format)
- `page` (optional): Page number for pagination (default: 1)

#### Example Request

```
GET /api/v1/search/shows?searchString=Breaking%20Bad&year=2008&page=1
```

#### Response Format

```typescript
{
  results: Array<TVShowSearchResult>,
  total_results: number,
  total_pages: number,
  current_page: number
}
```

#### Example Response

```json
{
  "results": [
    {
      "id": "1396",
      "name": "Breaking Bad",
      "overview": "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live, he becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime.",
      "first_air_date": "2008-01-20",
      "vote_average": 9.5,
      "vote_count": 12847,
      "popularity": 369.594,
      "poster_path": "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
      "backdrop_path": "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
      "genre_ids": [18, 80],
      "adult": false,
      "original_language": "en",
      "original_name": "Breaking Bad",
      "origin_country": ["US"]
    },
    {
      "id": "62560",
      "name": "Mr. Robot",
      "overview": "A contemporary and culturally resonant drama about a young programmer, Elliot, who suffers from a debilitating anti-social disorder and decides that he can only connect to people by hacking them.",
      "first_air_date": "2015-06-24",
      "vote_average": 8.2,
      "vote_count": 2156,
      "popularity": 45.678,
      "poster_path": "/oKIBhzZzDX07SiE2QDc4mOnWs6k.jpg",
      "backdrop_path": "/eN9lbpVnbf6CLYxtKrDNfXNGwBG.jpg",
      "genre_ids": [80, 18],
      "adult": false,
      "original_language": "en",
      "original_name": "Mr. Robot",
      "origin_country": ["US"]
    }
  ],
  "total_results": 42,
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

### Search Movies

Searches for movies using a text query with optional year filtering and pagination.

**Endpoint:** `GET /api/v1/search/movies`

**Authentication:** Required

#### Query Parameters

- `searchString` (required): The search term to find movies
- `year` (optional): Filter results by release year (YYYY format)
- `page` (optional): Page number for pagination (default: 1)

#### Example Request

```
GET /api/v1/search/movies?searchString=Inception&year=2010&page=1
```

#### Response Format

```typescript
{
  results: Array<MovieSearchResult>,
  total_results: number,
  total_pages: number,
  current_page: number
}
```

#### Example Response

```json
{
  "results": [
    {
      "id": "27205",
      "title": "Inception",
      "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
      "release_date": "2010-07-16",
      "vote_average": 8.4,
      "vote_count": 34562,
      "popularity": 147.435,
      "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      "genre_ids": [28, 878, 53],
      "adult": false,
      "original_language": "en",
      "original_title": "Inception",
      "video": false
    },
    {
      "id": "155",
      "title": "The Dark Knight",
      "overview": "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
      "release_date": "2008-07-18",
      "vote_average": 9.0,
      "vote_count": 32105,
      "popularity": 123.456,
      "poster_path": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      "backdrop_path": "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
      "genre_ids": [18, 28, 80, 53],
      "adult": false,
      "original_language": "en",
      "original_title": "The Dark Knight",
      "video": false
    }
  ],
  "total_results": 156,
  "total_pages": 8,
  "current_page": 1
}
```

**Status Codes:**

- 200: Success
- 400: Invalid query parameters or validation errors
- 401: Authentication required
- 500: Server error

## Query Parameter Validation

### Search String Validation

**Requirements:**
- **Required:** Yes
- **Type:** String
- **Minimum Length:** 1 character
- **Maximum Length:** 100 characters
- **Special Characters:** Allowed (automatically URL encoded)

**Example Error Response for Missing Search String:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "searchString",
      "message": "Search string is required"
    }
  ]
}
```

**Example Error Response for Invalid Search String:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "searchString",
      "message": "Search string must be between 1 and 100 characters"
    }
  ]
}
```

### Year Validation

**Requirements:**
- **Required:** No
- **Type:** String (YYYY format)
- **Range:** 1900 - Current Year + 5
- **Format:** Four-digit year

**Example Error Response for Invalid Year:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "year",
      "message": "Year must be a valid 4-digit year between 1900 and 2030"
    }
  ]
}
```

### Page Validation

**Requirements:**
- **Required:** No
- **Type:** Number
- **Default:** 1
- **Range:** 1 - 1000
- **Format:** Positive integer

**Example Error Response for Invalid Page:**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "page",
      "message": "Page must be a positive integer between 1 and 1000"
    }
  ]
}
```

## Search Features

### Text Matching

The search functionality supports:

- **Exact title matches** - Highest relevance for exact matches
- **Partial title matches** - Substring matching within titles
- **Fuzzy matching** - Handles typos and similar spellings
- **Alternative titles** - Searches original and translated titles
- **Multiple word searches** - Searches for all terms or phrase matching
- **Special character handling** - Automatically handles punctuation and accents

### Relevance Ranking

Search results are ranked by:

1. **Exact title match** - Highest priority
2. **Title starts with search term** - High priority
3. **Title contains search term** - Medium priority
4. **TMDB popularity score** - Tiebreaker for similar matches
5. **Vote average** - Additional ranking factor
6. **Release recency** - Preference for newer content

### Year Filtering

When a year filter is applied:

- **Movies:** Filtered by `release_date` year
- **TV Shows:** Filtered by `first_air_date` year
- **Date parsing:** Handles various date formats from TMDB
- **Fallback:** Items without dates are excluded from year-filtered results

## Pagination

### Page Structure

- **Default page size:** 20 results per page
- **Maximum page size:** 20 results per page (not configurable)
- **Maximum pages:** 1000 pages
- **Total results:** May be limited by TMDB API constraints

### Navigation Information

Each response includes pagination metadata:

```typescript
{
  total_results: number,    // Total number of matching results
  total_pages: number,      // Total number of pages available
  current_page: number      // Current page number (1-indexed)
}
```

### Example Pagination Usage

```typescript
// Navigate through search results
for (let page = 1; page <= totalPages && page <= 50; page++) {
  const results = await searchMovies("Avengers", undefined, page, token);
  processResults(results.results);
}
```

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "searchString",
      "message": "Search string is required"
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

### Search Service Error (503 Service Unavailable)

```json
{
  "error": "Search service temporarily unavailable"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "error": "Too many requests, please try again later.",
  "retry_after": 60
}
```

## Data Sources

Search functionality integrates with:

- **TMDB (The Movie Database)** - Primary source for movie and TV show metadata
- **Internal caching** - For performance optimization and rate limit management
- **Search indexing** - Optimized search algorithms for better relevance

## Rate Limiting

Search endpoints are subject to standard API rate limiting:

- **100 requests per minute** per IP address
- **1000 requests per hour** per authenticated user

Additionally, TMDB API rate limits may apply:

- **40 requests per 10 seconds** to TMDB (shared across all users)
- **1000 requests per day** per API key

## Caching

Search results are cached to improve performance:

- **Popular searches** - Cached for 1 hour
- **Specific queries** - Cached for 30 minutes
- **Cache invalidation** - Automatic cleanup of old cache entries
- **Cache key strategy** - Based on search string, year, and page

## Example Usage

### JavaScript/TypeScript Examples

```typescript
// Basic show search
async function searchShows(query: string, token: string) {
  const response = await fetch(`/api/v1/search/shows?searchString=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  return await response.json();
}

// Movie search with year filter
async function searchMoviesByYear(query: string, year: number, token: string) {
  const response = await fetch(
    `/api/v1/search/movies?searchString=${encodeURIComponent(query)}&year=${year}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  return await response.json();
}

// Paginated search with all parameters
async function searchMoviesWithPagination(
  query: string,
  year?: number,
  page: number = 1,
  token: string
) {
  const params = new URLSearchParams({
    searchString: query,
    page: page.toString(),
  });
  
  if (year) {
    params.append('year', year.toString());
  }
  
  const response = await fetch(`/api/v1/search/movies?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  return await response.json();
}

// Search with comprehensive error handling
async function searchWithErrorHandling(
  endpoint: 'shows' | 'movies',
  query: string,
  options: { year?: number; page?: number } = {},
  token: string
) {
  try {
    const params = new URLSearchParams({
      searchString: query,
      page: (options.page || 1).toString(),
    });
    
    if (options.year) {
      params.append('year', options.year.toString());
    }
    
    const response = await fetch(`/api/v1/search/${endpoint}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      } else if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(`Validation error: ${errorData.details?.map(d => d.message).join(', ') || 'Invalid parameters'}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Search failed: ${response.statusText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

// Search all pages for comprehensive results
async function searchAllPages(
  endpoint: 'shows' | 'movies',
  query: string,
  year?: number,
  token: string,
  maxPages: number = 10
) {
  const allResults = [];
  let currentPage = 1;
  let totalPages = 1;
  
  do {
    const response = await searchWithErrorHandling(
      endpoint,
      query,
      { year, page: currentPage },
      token
    );
    
    allResults.push(...response.results);
    totalPages = Math.min(response.total_pages, maxPages);
    currentPage++;
    
    // Add delay to respect rate limits
    if (currentPage <= totalPages) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  } while (currentPage <= totalPages);
  
  return {
    results: allResults,
    total_results: allResults.length,
    total_pages: totalPages,
  };
}

// Type-safe search function
interface SearchOptions {
  year?: number;
  page?: number;
}

interface SearchResult {
  results: any[];
  total_results: number;
  total_pages: number;
  current_page: number;
}

async function typeSafeSearch(
  type: 'movies' | 'shows',
  searchString: string,
  options: SearchOptions = {},
  token: string
): Promise<SearchResult> {
  if (!searchString.trim()) {
    throw new Error('Search string cannot be empty');
  }
  
  if (searchString.length > 100) {
    throw new Error('Search string cannot exceed 100 characters');
  }
  
  if (options.year && (options.year < 1900 || options.year > new Date().getFullYear() + 5)) {
    throw new Error('Year must be between 1900 and ' + (new Date().getFullYear() + 5));
  }
  
  if (options.page && (options.page < 1 || options.page > 1000)) {
    throw new Error('Page must be between 1 and 1000');
  }
  
  return await searchWithErrorHandling(type, searchString, options, token);
}
```

### React Hook Example

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseSearchOptions {
  year?: number;
  page?: number;
  debounceMs?: number;
}

interface SearchState {
  data: SearchResult | null;
  loading: boolean;
  error: string | null;
}

export function useSearch(
  type: 'movies' | 'shows',
  searchString: string,
  options: UseSearchOptions = {},
  token: string
) {
  const [state, setState] = useState<SearchState>({
    data: null,
    loading: false,
    error: null,
  });
  
  const { year, page = 1, debounceMs = 300 } = options;
  
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await typeSafeSearch(type, query, { year, page }, token);
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Search failed',
      });
    }
  }, [type, year, page, token]);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchString);
    }, debounceMs);
    
    return () => clearTimeout(timeoutId);
  }, [searchString, performSearch, debounceMs]);
  
  const retry = useCallback(() => {
    performSearch(searchString);
  }, [searchString, performSearch]);
  
  return { ...state, retry };
}
```

### cURL Examples

```bash
# Basic TV show search
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/search/shows?searchString=Breaking%20Bad"

# Movie search with year filter
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/search/movies?searchString=Inception&year=2010"

# Paginated search
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/search/movies?searchString=Avengers&page=2"

# Search with all parameters
curl -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/search/shows?searchString=Game%20of%20Thrones&year=2011&page=1"
```

## Additional Notes

- Search queries are case-insensitive
- Special characters in search strings are automatically URL encoded
- Search results include TMDB IDs that can be used with other API endpoints
- Image paths returned are relative and need TMDB base URL for complete URLs
- Genre IDs correspond to TMDB's genre taxonomy
- Adult content filtering may be applied based on user preferences
- Search performance is optimized with intelligent caching and indexing
- Multiple language support depends on TMDB data availability
- Search results may vary based on TMDB data updates
- Consider implementing debouncing for real-time search to avoid excessive API calls