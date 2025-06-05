[Home](../README.md)

# Notifications API Documentation

This document describes the endpoints available for managing user notifications including retrieving and dismissing
notifications for accounts.

## Base URL

All endpoints are prefixed with `/api/v1/accounts/{accountId}/notifications`

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

### Notification Object

```typescript
{
  id: number,
  message: string,
  startDate: Date,
  endDate: Date,
  type?: string,
  isRead?: boolean,
  createdAt?: Date,
  updatedAt?: Date
}
```

### Notification Response

```typescript
{
  message: string,
  notifications: Array<{
    id: number,
    message: string,
    startDate: Date,
    endDate: Date
  }>
}
```

## Endpoints

### Get Notifications

Retrieves all active notifications for a specific account.

**Endpoint:** `GET /api/v1/accounts/{accountId}/notifications`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Response Format

```typescript
{
  message: string,
  notifications: Array<Notification>
}
```

#### Example Response

```json
{
  "message": "Retrieved notifications for an account",
  "notifications": [
    {
      "id": 123,
      "message": "New episodes available for your favorite shows!",
      "startDate": "2025-06-01T00:00:00Z",
      "endDate": "2025-06-30T23:59:59Z"
    },
    {
      "id": 124,
      "message": "System maintenance scheduled for tonight at 2 AM EST",
      "startDate": "2025-06-05T00:00:00Z",
      "endDate": "2025-06-05T23:59:59Z"
    },
    {
      "id": 125,
      "message": "New movies added to your watchlist streaming services",
      "startDate": "2025-06-03T00:00:00Z",
      "endDate": "2025-06-15T23:59:59Z"
    }
  ]
}
```

#### Empty Notifications Response

```json
{
  "message": "Retrieved notifications for an account",
  "notifications": []
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found
- 500: Server error

---

### Dismiss Notification

Dismisses a specific notification for an account, removing it from the user's notification list.

**Endpoint:** `POST /api/v1/accounts/{accountId}/notifications/dismiss/{notificationId}`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `notificationId` (path parameter, required): Unique identifier of the notification to dismiss

#### Response Format

```typescript
{
  message: string,
  notifications: Array<Notification>
}
```

#### Example Response

```json
{
  "message": "Dismissed notification for account",
  "notifications": [
    {
      "id": 124,
      "message": "System maintenance scheduled for tonight at 2 AM EST",
      "startDate": "2025-06-05T00:00:00Z",
      "endDate": "2025-06-05T23:59:59Z"
    },
    {
      "id": 125,
      "message": "New movies added to your watchlist streaming services",
      "startDate": "2025-06-03T00:00:00Z",
      "endDate": "2025-06-15T23:59:59Z"
    }
  ]
}
```

**Status Codes:**

- 200: Notification dismissed successfully
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account or notification not found
- 500: Server error

## Authorization

All notification endpoints require that:

- The user is authenticated
- The user owns the account specified in the URL
- For dismissing notifications, the notification must exist and be associated with the account

## Notification Lifecycle

### Active Notifications

Notifications are considered active and will be returned by the GET endpoint when:

- Current date is between `startDate` and `endDate`
- The notification hasn't been dismissed by the user
- The notification type is enabled for the account

### Automatic Cleanup

The system automatically handles notification cleanup:

- Expired notifications (past `endDate`) are automatically filtered out
- Dismissed notifications are marked as read and excluded from future responses
- System maintains notification history for analytics purposes

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

### Account Not Found (404 Not Found)

```json
{
  "error": "Account not found"
}
```

### Notification Not Found (404 Not Found)

```json
{
  "error": "Notification not found"
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
// Get all notifications for an account
async function getNotifications(accountId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get notifications: ${response.statusText}`);
  }

  return await response.json();
}

// Dismiss a specific notification
async function dismissNotification(accountId: number, notificationId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/notifications/dismiss/${notificationId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to dismiss notification: ${response.statusText}`);
  }

  return await response.json();
}

// Display notifications in UI
async function displayNotifications(accountId: number, token: string) {
  try {
    const { notifications } = await getNotifications(accountId, token);

    if (notifications.length === 0) {
      console.log('No notifications to display');
      return;
    }

    notifications.forEach((notification) => {
      console.log(`[${notification.id}] ${notification.message}`);
      console.log(`Valid from: ${new Date(notification.startDate).toLocaleDateString()}`);
      console.log(`Valid until: ${new Date(notification.endDate).toLocaleDateString()}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
}

// Dismiss all notifications
async function dismissAllNotifications(accountId: number, token: string) {
  try {
    const { notifications } = await getNotifications(accountId, token);

    for (const notification of notifications) {
      await dismissNotification(accountId, notification.id, token);
      console.log(`Dismissed notification: ${notification.message}`);
    }

    console.log('All notifications dismissed');
  } catch (error) {
    console.error('Error dismissing notifications:', error);
  }
}

// Check for new notifications periodically
function startNotificationPolling(accountId: number, token: string, intervalMs: number = 30000) {
  let lastNotificationCount = 0;

  const poll = async () => {
    try {
      const { notifications } = await getNotifications(accountId, token);

      if (notifications.length > lastNotificationCount) {
        const newCount = notifications.length - lastNotificationCount;
        console.log(`${newCount} new notification(s) received!`);

        // Display new notifications
        notifications.slice(-newCount).forEach((notification) => {
          console.log(`New: ${notification.message}`);
        });
      }

      lastNotificationCount = notifications.length;
    } catch (error) {
      console.error('Error polling notifications:', error);
    }
  };

  // Initial poll
  poll();

  // Set up interval
  return setInterval(poll, intervalMs);
}
```

### React Hook Example

```typescript
import { useCallback, useEffect, useState } from 'react';

interface Notification {
  id: number;
  message: string;
  startDate: Date;
  endDate: Date;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  dismissNotification: (notificationId: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(accountId: number, token: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/accounts/${accountId}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [accountId, token]);

  const dismissNotification = useCallback(
    async (notificationId: number) => {
      try {
        const response = await fetch(`/api/v1/accounts/${accountId}/notifications/dismiss/${notificationId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to dismiss notification: ${response.statusText}`);
        }

        const data = await response.json();
        setNotifications(data.notifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to dismiss notification');
      }
    },
    [accountId, token],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    dismissNotification,
    refreshNotifications: fetchNotifications,
  };
}
```

### cURL Examples

```bash
# Get all notifications for account
curl -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/notifications

# Dismiss a specific notification
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/notifications/dismiss/456

# Get notifications with error handling
curl -f -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/notifications \
  || echo "Failed to retrieve notifications"
```

## Integration with WebSocket

The notifications system integrates with the WebSocket connection for real-time updates:

```typescript
// WebSocket notification listener
socket.on('new_notification', (notification) => {
  console.log('New notification received:', notification.message);
  // Update local notification state
  setNotifications((prev) => [...prev, notification]);
});

socket.on('notification_dismissed', (notificationId) => {
  console.log('Notification dismissed:', notificationId);
  // Remove from local state
  setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
});
```

## Additional Notes

- Notifications are account-specific and not shared between profiles
- The system supports time-based notifications with start and end dates
- Dismissed notifications are permanently removed from the user's view
- Notification content supports basic text formatting
- The API returns notifications in chronological order (newest first)
- Expired notifications are automatically filtered out server-side
- Large notification lists are not paginated (typically limited to active notifications)
- Notification preferences and settings are managed through the account settings
- The system supports both user-generated and system-generated notifications
- Notifications can be triggered by content updates, system events, or scheduled announcements
