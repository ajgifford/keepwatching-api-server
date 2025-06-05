[Home](../README.md)

# File Upload API Documentation

This document describes the endpoints available for uploading and managing account and profile images.

## Base URL

All endpoints are prefixed with `/api/v1/upload`

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

## File Requirements

### Supported Formats

- **Image Types:** JPEG, PNG, GIF, WebP
- **Maximum File Size:** 2MB (2,097,152 bytes)
- **Field Name:** `file` (multipart form data)

### File Naming Convention

- **Account Images:** `account-{accountId}.{extension}`
- **Profile Images:** `profile-{profileId}.{extension}`

## Endpoints

### Upload Account Image

Uploads and updates an account's profile image.

**Endpoint:** `POST /api/v1/upload/accounts/{accountId}`

**Content-Type:** `multipart/form-data`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Request Format

```http
POST /api/v1/upload/accounts/123
Content-Type: multipart/form-data
Authorization: Bearer <your_access_token>

Content-Disposition: form-data; name="file"; filename="profile.jpg"
Content-Type: image/jpeg

[binary image data]
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
  "message": "Uploaded the file successfully: account-123.jpg",
  "result": {
    "id": 123,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "image": "account-123.jpg",
    "defaultProfileId": 101
  }
}
```

**Status Codes:**

- 200: File uploaded successfully
- 400: Bad request (no file provided, invalid file, or account update failed)
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found
- 413: File too large (exceeds 2MB limit)
- 500: Server error

---

### Upload Profile Image

Uploads and updates a profile's image.

**Endpoint:** `POST /api/v1/upload/accounts/{accountId}/profiles/{profileId}`

**Content-Type:** `multipart/form-data`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `profileId` (path parameter, required): Unique identifier of the profile

#### Request Format

```http
POST /api/v1/upload/accounts/123/profiles/456
Content-Type: multipart/form-data
Authorization: Bearer <your_access_token>

Content-Disposition: form-data; name="file"; filename="avatar.png"
Content-Type: image/png

[binary image data]
```

#### Response Format

```typescript
{
  message: string,
  result: {
    id: number,
    name: string,
    image: string
  }
}
```

#### Example Response

```json
{
  "message": "Uploaded the file successfully: profile-456.png",
  "result": {
    "id": 456,
    "name": "Family Profile",
    "image": "profile-456.png"
  }
}
```

**Status Codes:**

- 200: File uploaded successfully
- 400: Bad request (no file provided, invalid file, or profile update failed)
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account/profile)
- 404: Account or profile not found
- 413: File too large (exceeds 2MB limit)
- 500: Server error

## File Storage

### Directory Structure

```
uploads/
├── accounts/
│   ├── account-123.jpg
│   ├── account-124.png
│   └── ...
└── profiles/
    ├── profile-456.jpg
    ├── profile-457.png
    └── ...
```

### File Access

Uploaded files are served statically from the `/uploads` endpoint:

- **Account Images:** `https://api.example.com/uploads/accounts/account-123.jpg`
- **Profile Images:** `https://api.example.com/uploads/profiles/profile-456.png`

### File Replacement

When uploading a new image:

1. The new file is saved with the standardized naming convention
2. The database is updated with the new filename
3. The previous image file is automatically deleted from storage
4. Profile cache is invalidated (for profile images)

## Authorization

### Account Image Upload

- User must own the account being updated
- Account must exist in the system

### Profile Image Upload

- User must own the account that contains the profile
- Profile must belong to the specified account
- Both account and profile must exist in the system

## Error Responses

### No File Provided (400 Bad Request)

```json
{
  "message": "Please upload a file!"
}
```

### File Too Large (413 Payload Too Large)

```json
{
  "error": "File too large. Maximum size is 2MB."
}
```

### Account Not Found (400 Bad Request)

```json
{
  "error": "Failed to add/update an account image"
}
```

### Profile Not Found (400 Bad Request)

```json
{
  "error": "Failed to add/update a profile image"
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

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

### JavaScript/TypeScript Example

```typescript
async function uploadAccountImage(accountId: number, file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/v1/upload/accounts/${accountId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
}

async function uploadProfileImage(accountId: number, profileId: number, file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/v1/upload/accounts/${accountId}/profiles/${profileId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
}
```

### cURL Example

```bash
# Upload account image
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/image.jpg" \
  https://api.example.com/api/v1/upload/accounts/123

# Upload profile image
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/avatar.png" \
  https://api.example.com/api/v1/upload/accounts/123/profiles/456
```

## Additional Notes

- File uploads are processed synchronously
- Old image files are automatically cleaned up when new ones are uploaded
- File deletion errors are logged but don't affect the upload success
- Profile image uploads invalidate the profile cache for immediate UI updates
- Supported MIME types are validated server-side
- File extensions are automatically determined from MIME type
- Images are stored in their original format without processing or compression
- No image resizing or optimization is performed server-side
