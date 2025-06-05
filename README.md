# KeepWatching API Server

A Node.js/TypeScript API server for the KeepWatching application - a comprehensive media tracking platform that helps users manage their favorite TV shows and movies.

## Features

- **Authentication & Authorization**: Firebase-based user authentication with role-based access control
- **Media Management**: Track TV shows, seasons, episodes, and movies with watch status
- **Content Discovery**: Search and discover new content through TMDB integration
- **Profile System**: Multi-profile support per account for family sharing
- **Real-time Updates**: WebSocket integration for live notifications
- **File Uploads**: Profile and account image management
- **Statistics**: Comprehensive viewing statistics and progress tracking
- **Rate Limiting**: Built-in API rate limiting for fair usage

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Authentication**: Firebase Admin SDK
- **Database**: MySQL with connection pooling
- **Real-time**: Socket.IO
- **File Uploads**: Multer
- **Process Management**: PM2
- **Testing**: Jest with comprehensive unit tests
- **Validation**: Zod schema validation
- **Logging**: Winston with daily log rotation

## Prerequisites

- Node.js 18+ and Yarn
- MySQL database
- Firebase project with service account credentials
- SSL certificates for HTTPS
- TMDB API access for content discovery

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keepwatching-server
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file based on your configuration needs. The server uses the `@ajgifford/keepwatching-common-server` package for configuration management.

4. **Set up Firebase credentials**
   Place your Firebase service account JSON file in the `certs/` directory as `keepwatching-service-account.json`.

5. **Set up SSL certificates**
   Place your SSL certificates in the `certs/` directory.

6. **Build the project**
   ```bash
   yarn build
   ```

## Development

### Running in Development Mode
```bash
yarn dev
```
This uses `tsx` to watch for changes and automatically restart the server.

### Building for Production
```bash
yarn build
```

### Running Tests
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run tests for CI
yarn test:ci
```

### Code Formatting
```bash
yarn format
```

## Production Deployment

### Using PM2
```bash
yarn serve
```
This builds the project and starts it using PM2 with the production configuration.

### PM2 Configuration
The project includes `ecosystem.config.js` with two app configurations:
- `keepwatching-server`: Production mode
- `keepwatching-server-dev`: Development mode with file watching

## API Documentation

The server provides a comprehensive REST API with the following main endpoints:

### [Authentication & Accounts](./resources/account.md)
- `POST /api/v1/accounts/register` - Register new account
- `POST /api/v1/accounts/login` - User login
- `POST /api/v1/accounts/googleLogin` - Google OAuth login
- `POST /api/v1/accounts/logout` - User logout
- `PUT /api/v1/accounts/:accountId` - Update account details

### [Profiles](./resources/profile.md)
- `GET /api/v1/accounts/:accountId/profiles` - Get all profiles
- `GET /api/v1/accounts/:accountId/profiles/:profileId` - Get specific profile
- `POST /api/v1/accounts/:accountId/profiles` - Create new profile
- `PUT /api/v1/accounts/:accountId/profiles/:profileId` - Update profile
- `DELETE /api/v1/accounts/:accountId/profiles/:profileId` - Delete profile

### [Shows, Seasons & Episodes](./resources/tvSeries.md)
- `GET /api/v1/accounts/:accountId/profiles/:profileId/shows` - Get user's shows
- `GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/details` - Get show details
- `GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/recommendations` - Get show recommendations
- `GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/similar` - Get similar shows
- `POST /api/v1/accounts/:accountId/profiles/:profileId/shows/favorites` - Add show to favorites
- `DELETE /api/v1/accounts/:accountId/profiles/:profileId/shows/favorites/:showId` - Remove from favorites
- `PUT /api/v1/accounts/:accountId/profiles/:profileId/shows/watchstatus` - Update show watch status
- `GET /api/v1/accounts/:accountId/profiles/:profileId/episodes` - Get episode data for profile
- `PUT /api/v1/accounts/:accountId/profiles/:profileId/episodes/watchStatus` - Update episode watch status
- `PUT /api/v1/accounts/:accountId/profiles/:profileId/episodes/nextWatchStatus` - Update next episode watch status
- `GET /api/v1/accounts/:accountId/profiles/:profileId/episodes/upcoming` - Get upcoming episodes
- `GET /api/v1/accounts/:accountId/profiles/:profileId/episodes/recent` - Get recent episodes
- `GET /api/v1/accounts/:accountId/profiles/:profileId/seasons/:seasonId/episodes` - Get episodes for season
- `GET /api/v1/accounts/:accountId/profiles/:profileId/shows/:showId/seasons` - Get seasons for show
- `PUT /api/v1/accounts/:accountId/profiles/:profileId/seasons/watchstatus` - Update season watch status

### [Movies](./resources/movies.md)
- `GET /api/v1/accounts/:accountId/profiles/:profileId/movies` - Get user's movies
- `POST /api/v1/accounts/:accountId/profiles/:profileId/movies/favorites` - Add movie to favorites
- `DELETE /api/v1/accounts/:accountId/profiles/:profileId/movies/favorites/:movieId` - Remove movie from favorites
- `PUT /api/v1/accounts/:accountId/profiles/:profileId/movies/watchstatus` - Update movie watch status
- `GET /api/v1/accounts/:accountId/profiles/:profileId/movies/recentUpcoming` - Get recent and upcoming movies

### [Search](./resources/search.md)
- `GET /api/v1/search/shows` - Search TV shows
- `GET /api/v1/search/movies` - Search movies

### [Content Discovery](./resources/discover.md)
- `GET /api/v1/discover/top` - Discover top content
- `GET /api/v1/discover/trending` - Discover trending content
- `GET /api/v1/discover/changes` - Discover content changes (new, expiring)

### [File Management](./resources/file.md)
- `POST /api/v1/upload/accounts/:accountId` - Upload account image
- `POST /api/v1/upload/accounts/:accountId/profiles/:profileId` - Upload profile image

### [Statistics](./resources/statistics.md)
- `GET /api/v1/accounts/:accountId/statistics` - Get account statistics
- `GET /api/v1/accounts/:accountId/profiles/:profileId/statistics` - Get profile statistics

### [Notifications](./resources/notifications.md)
- `GET /api/v1/accounts/:accountId/notifications` - Get notifications
- `POST /api/v1/accounts/:accountId/notifications/dismiss/:notificationId` - Dismiss notification

## Rate Limiting

All API endpoints implement rate limiting:
- **100 requests per minute** per IP address
- **1000 requests per hour** per authenticated user

When limits are exceeded, the API returns a `429 Too Many Requests` response.

## Security Features

- **HTTPS Only**: All connections must use HTTPS
- **Host Validation**: Only allows connections from approved hostnames
- **Request Filtering**: Blocks suspicious requests and common attack patterns
- **Helmet**: Security headers for protection against common vulnerabilities
- **CORS**: Configurable cross-origin resource sharing
- **Authentication**: Firebase JWT token validation
- **Authorization**: Role-based access control for resources

## WebSocket Support

The server includes Socket.IO for real-time features:
- Live notifications for new episodes and movies
- Real-time updates when content is added or modified
- Authentication required for WebSocket connections

## File Storage

- **Upload Directory**: Configurable upload directory for user files
- **Image Processing**: Automatic image naming and organization
- **File Cleanup**: Automatic cleanup of old files when updating
- **Size Limits**: 2MB maximum file size for uploads

## Project Structure

```
src/
├── controllers/        # Request handlers
├── middleware/         # Custom middleware (auth, upload, etc.)
├── routes/            # Route definitions
└── index.ts           # Application entry point

tests/
└── unit/              # Unit tests for controllers and middleware

certs/                 # SSL certificates and Firebase credentials
uploads/               # User uploaded files
```

## Dependencies

### Main Dependencies
- `express` - Web framework
- `firebase-admin` - Firebase authentication
- `socket.io` - WebSocket support
- `mysql2` - Database connectivity
- `multer` - File upload handling
- `helmet` - Security headers
- `winston` - Logging
- `zod` - Schema validation

### Development Dependencies
- `typescript` - TypeScript compiler
- `jest` - Testing framework
- `prettier` - Code formatting
- `eslint` - Code linting
- `tsx` - Development server

## Health Checks

The server provides health check endpoints:
- `GET /` - Basic server info and status
- `GET /health` - Detailed health information including uptime

## Contributing

1. Ensure all tests pass: `yarn test`
2. Format code: `yarn format`
3. Follow TypeScript best practices
4. Add tests for new functionality
5. Update documentation as needed

## License

Private project - All rights reserved
