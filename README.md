# KeepWatching! Server

## API Documentation
* Authorization
* Account
* Shows
* Seasons
* Episodes
* [Movies](resources/movies.md)
* Files
* [Search](resources/search.md)
* [Discover](resources/discover.md)

### Rate Limiting
All API implement rate limiting to ensure fair usage:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

When rate limit is exceeded, the API returns a 429 Too Many Requests response:
```json
{
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```