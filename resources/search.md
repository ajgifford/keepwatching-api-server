[Home](../README.md)

# Search API Documentation

This document describes the endpoints available for searching movies and TV shows.

## Base URL

All endpoints are prefixed with `/api/v1/search`

## Endpoints

### Search TV Shows

```
GET /api/v1/search/shows
```

Searches for TV shows based on provided criteria.

#### Query Parameters

| Parameter    | Type   | Required | Description                                 |
| ------------ | ------ | -------- | ------------------------------------------- |
| searchString | string | Yes      | Search term (1-100 characters)              |
| year         | string | No       | Filter by first air date year (YYYY format) |
| page         | string | No       | Page number for pagination (defaults to 1)  |

#### Response

```json
{
  "results": [
    {
      "id": number,
      "title": string,
      "genres": string[],
      "premiered": string,
      "summary": string,
      "image": string,
      "rating": number,
      "popularity": number
    }
  ],
  "total_pages": number,
  "total_results": number,
  "current_page": number
}
```

#### Notes

- Results are cached for 300 seconds (5 minutes)
- Supports localization via `Accept-Language` header (defaults to `en-US`)
- Adult content is filtered out
- The `image` field contains a poster path that needs to be combined with TMDB base URL

### Search Movies

```
GET /api/v1/search/movies
```

Searches for movies based on provided criteria.

#### Query Parameters

| Parameter    | Type   | Required | Description                                |
| ------------ | ------ | -------- | ------------------------------------------ |
| searchString | string | Yes      | Search term (1-100 characters)             |
| year         | string | No       | Filter by release year (YYYY format)       |
| page         | string | No       | Page number for pagination (defaults to 1) |

#### Response

```json
{
  "results": [
    {
      "id": number,
      "title": string,
      "genres": string[],
      "premiered": string,
      "summary": string,
      "image": string,
      "rating": number
    }
  ],
  "total_pages": number,
  "total_results": number,
  "current_page": number,
  "timestamp": string
}
```

#### Notes

- Supports localization via `Accept-Language` header (defaults to `en-US`)
- Adult content is filtered out
- Region is locked to 'US'
- The `image` field contains a poster path that needs to be combined with TMDB base URL

## Error Handling

Both endpoints will return validation errors if:

- `searchString` is empty or exceeds 100 characters
- `year` is not in YYYY format
- `page` is not a valid number

## Data Source

All data is sourced from TMDB (The Movie Database) API.
