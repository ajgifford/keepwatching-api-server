[Home](../README.md)

# Account API Documentation

This document describes the endpoints available for account management including registration, login, logout, and
account updates.

## Base URL

All endpoints are prefixed with `/api/v1/accounts`

## Endpoints

### Register Account

Creates a new user account with the provided details.

**Endpoint:** `POST /api/v1/accounts/register`

**Authentication:** Not required

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "uid": "firebase-uid-123"
}
```

#### Response Format

```typescript
{
  message: string,
  result: {
    id: number,
    name: string,
    uid: string,
    email: string,
    image: string,
    defaultProfileId: number
  }
}
```

#### Example Response

```json
{
  "message": "Account registered successfully",
  "result": {
    "id": 1,
    "name": "John Doe",
    "uid": "firebase-uid-123",
    "email": "john.doe@example.com",
    "image": "default-account.png",
    "defaultProfileId": 101
  }
}
```

**Status Codes:**

- 201: Account created successfully
- 400: Invalid request body or validation errors
- 500: Server error

---

### Login

Authenticates a user with their Firebase UID.

**Endpoint:** `POST /api/v1/accounts/login`

**Authentication:** Not required

#### Request Body

```json
{
  "uid": "firebase-uid-123"
}
```

#### Response Format

```typescript
{
  message: string,
  result: {
    id: number,
    name: string,
    uid: string,
    email: string,
    image: string,
    defaultProfileId: number
  }
}
```

#### Example Response

```json
{
  "message": "Login successful",
  "result": {
    "id": 1,
    "name": "John Doe",
    "uid": "firebase-uid-123",
    "email": "john.doe@example.com",
    "image": "account-image.jpg",
    "defaultProfileId": 101
  }
}
```

**Status Codes:**

- 200: Login successful
- 400: Invalid request body or validation errors
- 404: Account not found
- 500: Server error

---

### Google Login

Authenticates a user with Google credentials, creating a new account if needed.

**Endpoint:** `POST /api/v1/accounts/googleLogin`

**Authentication:** Not required

#### Request Body

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@gmail.com",
  "uid": "google-firebase-uid-456",
  "photoURL": "https://lh3.googleusercontent.com/a/photo.jpg"
}
```

#### Response Format

```typescript
{
  message: string,
  result: {
    id: number,
    name: string,
    uid: string,
    email: string,
    image: string,
    defaultProfileId: number,
    isNewAccount: boolean
  }
}
```

#### Example Response (New Account)

```json
{
  "message": "Account registered successfully",
  "result": {
    "id": 2,
    "name": "Jane Smith",
    "uid": "google-firebase-uid-456",
    "email": "jane.smith@gmail.com",
    "image": "google-photo.jpg",
    "defaultProfileId": 102,
    "isNewAccount": true
  }
}
```

#### Example Response (Existing Account)

```json
{
  "message": "Login successful",
  "result": {
    "id": 2,
    "name": "Jane Smith",
    "uid": "google-firebase-uid-456",
    "email": "jane.smith@gmail.com",
    "image": "google-photo.jpg",
    "defaultProfileId": 102,
    "isNewAccount": false
  }
}
```

**Status Codes:**

- 201: New account created successfully
- 200: Existing account login successful
- 400: Invalid request body or validation errors
- 500: Server error

---

### Logout

Logs out the user by invalidating their cache data.

**Endpoint:** `POST /api/v1/accounts/logout`

**Authentication:** Not required

#### Request Body

```json
{
  "accountId": "1"
}
```

#### Response Format

```json
{
  "message": "Account logged out"
}
```

**Status Codes:**

- 200: Logout successful
- 500: Server error

---

### Update Account

Updates an account's details including name and default profile.

**Endpoint:** `PUT /api/v1/accounts/{accountId}`

**Authentication:** Required using a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Request Body

```json
{
  "name": "John Updated",
  "defaultProfileId": 105
}
```

#### Response Format

```typescript
{
  message: string,
  result: {
    id: number,
    name: string,
    email: string,
    image: string,
    defaultProfileId: number
  }
}
```

#### Example Response

```json
{
  "message": "Updated account 1",
  "result": {
    "id": 1,
    "name": "John Updated",
    "email": "john.doe@example.com",
    "image": "account-image.jpg",
    "defaultProfileId": 105
  }
}
```

**Status Codes:**

- 200: Account updated successfully
- 400: Invalid request body or validation errors
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found
- 500: Server error

## Authentication & Authorization

### Public Endpoints

The following endpoints do not require authentication:

- `POST /api/v1/accounts/register`
- `POST /api/v1/accounts/login`
- `POST /api/v1/accounts/googleLogin`
- `POST /api/v1/accounts/logout`

### Protected Endpoints

The following endpoints require authentication and authorization:

- `PUT /api/v1/accounts/{accountId}` - User must own the account being updated

### Authentication Header

For protected endpoints, include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

Requests without valid authentication will receive a 401 Unauthorized response:

```json
{
  "error": "Authorization header missing or malformed"
}
```

### Authorization

Users can only access and modify accounts that belong to them. Attempts to access another user's account will result in
a 403 Forbidden response:

```json
{
  "error": "You do not have permission to access this account"
}
```

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
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

### Not Found Errors (404 Not Found)

```json
{
  "error": "Account not found"
}
```

### Server Errors (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Additional Notes

- Account images are managed through the separate File Upload API endpoints
- Default profile IDs must reference valid profiles belonging to the account
- Firebase UID must be unique across all accounts
- Email addresses must be unique across all accounts
- Account names have a maximum length of 100 characters
- Google login automatically downloads and stores profile photos when available
