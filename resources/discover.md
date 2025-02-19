[Home](../README.md)

# Discover API Documentation

## Get Top Shows

Retrieves top-rated shows or movies from various streaming services.

### Endpoint

```
GET /api/v1/discover/top
```

### Query Parameters

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| showType  | string | Yes      | Type of content to retrieve ("movie" or "series") |
| service   | string | Yes      | Streaming service to query                        |

### Supported Services

- netflix
- disney
- hbo
- apple
- prime

### Response Format

```typescript
{
  message: string,
  results: {
    id: string,
    title: string,
    genres: string[],
    premiered: number,
    summary: string,
    image: string,
    rating: number
  }[]
}
```

### Example Request

```
GET /api/v1/discover/top?showType=movie&service=netflix
```

### Example Response

```json
{
  "message": "Found top movie for netflix",
  "results": [
    {
      "id": "123456",
      "title": "Example Movie",
      "genres": ["Action", "Adventure"],
      "premiered": 2024,
      "summary": "An exciting movie description",
      "image": "https://example.com/poster.jpg",
      "rating": 8.5
    }
  ]
}
```

### Error Responses

#### Invalid Parameters (400 Bad Request)

```json
{
  "error": "Show type must be either \"movie\" or \"series\""
}
```

```json
{
  "error": "Invalid streaming service provided"
}
```

#### Server Error (500 Internal Server Error)

```json
{
  "message": "Unexpected error while discovering top content",
  "error": "Error details"
}
```

### Additional Notes

- Results are cached for 300 seconds (5 minutes)
- Images are returned in w240 vertical poster format
- IDs are stripped of "tv/" and "movie/" prefixes
- The API uses US region content by default
