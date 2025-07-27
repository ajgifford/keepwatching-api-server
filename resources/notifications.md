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
interface Notification {
  id: number;
  message: string;
  startDate: Date;
  endDate: Date;
  type?: string;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Notification Response

```typescript
interface NotificationResponse {
  message: string;
  notifications: Array<{
    id: number;
    message: string;
    startDate: Date;
    endDate: Date;
  }>;
}
```

## Endpoints

### Get Notifications

Retrieves all active notifications for a specific account.

**Endpoint:** `GET /api/v1/accounts/{accountId}/notifications`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Query Parameters

- `includeDismissed` (optional, boolean): Include dismissed notifications in the response (default: false)

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
      "endDate": "2025-06-30T23:59:59Z",
      "isRead": false
    },
    {
      "id": 124,
      "message": "System maintenance scheduled for tonight at 2 AM EST",
      "startDate": "2025-06-05T00:00:00Z",
      "endDate": "2025-06-05T23:59:59Z",
      "isRead": true
    },
    {
      "id": 125,
      "message": "New movies added to your watchlist streaming services",
      "startDate": "2025-06-03T00:00:00Z",
      "endDate": "2025-06-15T23:59:59Z",
      "isRead": false
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found
- 500: Server error

---

### Mark Notification as Read

Marks a specific notification as read or unread for an account.

**Endpoint:** `POST /api/v1/accounts/{accountId}/notifications/read/{notificationId}`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account
- `notificationId` (path parameter, required): Unique identifier of the notification

#### Query Parameters

- `hasBeenRead` (required, boolean): Whether to mark as read (true) or unread (false)
- `includeDismissed` (optional, boolean): Include dismissed notifications in the response (default: false)

#### Example Request

```bash
# Mark as read
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/notifications/read/456?hasBeenRead=true"

# Mark as unread
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/notifications/read/456?hasBeenRead=false"
```

#### Example Response

```json
{
  "message": "Notification marked as read",
  "notifications": [
    {
      "id": 456,
      "message": "New episodes available for your favorite shows!",
      "startDate": "2025-06-01T00:00:00Z",
      "endDate": "2025-06-30T23:59:59Z",
      "isRead": true
    }
  ]
}
```

**Status Codes:**

- 200: Success - Notification read status updated
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found or notification not found
- 500: Server error

---

### Mark All Notifications as Read

Marks all notifications as read or unread for an account.

**Endpoint:** `POST /api/v1/accounts/{accountId}/notifications/read`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Query Parameters

- `hasBeenRead` (required, boolean): Whether to mark all as read (true) or unread (false)
- `includeDismissed` (optional, boolean): Include dismissed notifications in the response (default: false)

#### Example Request

```bash
# Mark all as read
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/notifications/read?hasBeenRead=true"

# Mark all as unread
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  "https://api.example.com/api/v1/accounts/123/notifications/read?hasBeenRead=false"
```

#### Example Response

```json
{
  "message": "All notifications marked as read",
  "notifications": [
    {
      "id": 123,
      "message": "New episodes available for your favorite shows!",
      "startDate": "2025-06-01T00:00:00Z",
      "endDate": "2025-06-30T23:59:59Z",
      "isRead": true
    },
    {
      "id": 124,
      "message": "System maintenance scheduled for tonight at 2 AM EST",
      "startDate": "2025-06-05T00:00:00Z",
      "endDate": "2025-06-05T23:59:59Z",
      "isRead": true
    }
  ]
}
```

**Status Codes:**

- 200: Success - All notifications read status updated
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

#### Query Parameters

- `includeDismissed` (optional, boolean): Include dismissed notifications in the response (default: false)

#### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/notifications/dismiss/456
```

#### Example Response

```json
{
  "message": "Notification dismissed",
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

- 200: Success - Notification dismissed successfully
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found or notification not found
- 500: Server error

---

### Dismiss All Notifications

Dismisses all notifications for an account, removing them from the user's notification list.

**Endpoint:** `POST /api/v1/accounts/{accountId}/notifications/dismiss`

#### Parameters

- `accountId` (path parameter, required): Unique identifier of the account

#### Query Parameters

- `includeDismissed` (optional, boolean): Include dismissed notifications in the response (default: false)

#### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer your_token_here" \
  https://api.example.com/api/v1/accounts/123/notifications/dismiss
```

#### Example Response

```json
{
  "message": "All notifications dismissed",
  "notifications": []
}
```

**Status Codes:**

- 200: Success - All notifications dismissed successfully
- 401: Authentication required
- 403: Access forbidden (user doesn't own this account)
- 404: Account not found
- 500: Server error

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

## TypeScript Examples

### Complete React Hook Implementation

```typescript
import { useCallback, useEffect, useState } from 'react';

interface Notification {
  id: number;
  message: string;
  startDate: Date;
  endDate: Date;
  type?: string;
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  markNotificationRead: (notificationId: number, hasBeenRead: boolean) => Promise<void>;
  markAllNotificationsRead: (hasBeenRead: boolean) => Promise<void>;
  dismissNotification: (notificationId: number) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
}

export function useNotifications(accountId: number, token: string, includeDismissed = false): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = includeDismissed ? '?includeDismissed=true' : '';
      const response = await fetch(`/api/v1/accounts/${accountId}/notifications${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [accountId, token, includeDismissed]);

  const markNotificationRead = useCallback(
    async (notificationId: number, hasBeenRead: boolean) => {
      try {
        setError(null);

        const query = new URLSearchParams({
          hasBeenRead: hasBeenRead.toString(),
          ...(includeDismissed && { includeDismissed: 'true' }),
        }).toString();

        const response = await fetch(`/api/v1/accounts/${accountId}/notifications/read/${notificationId}?${query}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Failed to mark notification as ${hasBeenRead ? 'read' : 'unread'}: ${response.statusText}`,
          );
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to mark notification as ${hasBeenRead ? 'read' : 'unread'}`;
        setError(errorMessage);
        console.error('Error marking notification read:', err);
        throw err;
      }
    },
    [accountId, token, includeDismissed],
  );

  const markAllNotificationsRead = useCallback(
    async (hasBeenRead: boolean) => {
      try {
        setError(null);

        const query = new URLSearchParams({
          hasBeenRead: hasBeenRead.toString(),
          ...(includeDismissed && { includeDismissed: 'true' }),
        }).toString();

        const response = await fetch(`/api/v1/accounts/${accountId}/notifications/read?${query}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Failed to mark all notifications as ${hasBeenRead ? 'read' : 'unread'}: ${response.statusText}`,
          );
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to mark all notifications as ${hasBeenRead ? 'read' : 'unread'}`;
        setError(errorMessage);
        console.error('Error marking all notifications read:', err);
        throw err;
      }
    },
    [accountId, token, includeDismissed],
  );

  const dismissNotification = useCallback(
    async (notificationId: number) => {
      try {
        setError(null);

        const query = includeDismissed ? '?includeDismissed=true' : '';
        const response = await fetch(`/api/v1/accounts/${accountId}/notifications/dismiss/${notificationId}${query}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to dismiss notification: ${response.statusText}`);
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss notification';
        setError(errorMessage);
        console.error('Error dismissing notification:', err);
        throw err;
      }
    },
    [accountId, token, includeDismissed],
  );

  const dismissAllNotifications = useCallback(async () => {
    try {
      setError(null);

      const query = includeDismissed ? '?includeDismissed=true' : '';
      const response = await fetch(`/api/v1/accounts/${accountId}/notifications/dismiss${query}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to dismiss all notifications: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss all notifications';
      setError(errorMessage);
      console.error('Error dismissing all notifications:', err);
      throw err;
    }
  }, [accountId, token, includeDismissed]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    dismissAllNotifications,
    refreshNotifications: fetchNotifications,
    clearError,
  };
}
```

### Service Class Implementation

```typescript
interface NotificationService {
  getNotifications(accountId: number, includeDismissed?: boolean): Promise<NotificationResponse>;
  markNotificationRead(
    accountId: number,
    notificationId: number,
    hasBeenRead: boolean,
    includeDismissed?: boolean,
  ): Promise<NotificationResponse>;
  markAllNotificationsRead(
    accountId: number,
    hasBeenRead: boolean,
    includeDismissed?: boolean,
  ): Promise<NotificationResponse>;
  dismissNotification(
    accountId: number,
    notificationId: number,
    includeDismissed?: boolean,
  ): Promise<NotificationResponse>;
  dismissAllNotifications(accountId: number, includeDismissed?: boolean): Promise<NotificationResponse>;
}

class ApiNotificationService implements NotificationService {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1/accounts${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getNotifications(accountId: number, includeDismissed = false): Promise<NotificationResponse> {
    const query = includeDismissed ? '?includeDismissed=true' : '';
    return this.makeRequest<NotificationResponse>(`/${accountId}/notifications${query}`);
  }

  async markNotificationRead(
    accountId: number,
    notificationId: number,
    hasBeenRead: boolean,
    includeDismissed = false,
  ): Promise<NotificationResponse> {
    const query = new URLSearchParams({
      hasBeenRead: hasBeenRead.toString(),
      ...(includeDismissed && { includeDismissed: 'true' }),
    }).toString();

    return this.makeRequest<NotificationResponse>(`/${accountId}/notifications/read/${notificationId}?${query}`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead(
    accountId: number,
    hasBeenRead: boolean,
    includeDismissed = false,
  ): Promise<NotificationResponse> {
    const query = new URLSearchParams({
      hasBeenRead: hasBeenRead.toString(),
      ...(includeDismissed && { includeDismissed: 'true' }),
    }).toString();

    return this.makeRequest<NotificationResponse>(`/${accountId}/notifications/read?${query}`, { method: 'POST' });
  }

  async dismissNotification(
    accountId: number,
    notificationId: number,
    includeDismissed = false,
  ): Promise<NotificationResponse> {
    const query = includeDismissed ? '?includeDismissed=true' : '';
    return this.makeRequest<NotificationResponse>(`/${accountId}/notifications/dismiss/${notificationId}${query}`, {
      method: 'POST',
    });
  }

  async dismissAllNotifications(accountId: number, includeDismissed = false): Promise<NotificationResponse> {
    const query = includeDismissed ? '?includeDismissed=true' : '';
    return this.makeRequest<NotificationResponse>(`/${accountId}/notifications/dismiss${query}`, { method: 'POST' });
  }
}
```

### Basic JavaScript Functions

```typescript
// Get all notifications for an account
async function getNotifications(
  accountId: number,
  token: string,
  includeDismissed = false,
): Promise<NotificationResponse> {
  const query = includeDismissed ? '?includeDismissed=true' : '';
  const response = await fetch(`/api/v1/accounts/${accountId}/notifications${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get notifications: ${response.statusText}`);
  }

  return await response.json();
}

// Mark a notification as read/unread
async function markNotificationRead(
  accountId: number,
  notificationId: number,
  hasBeenRead: boolean,
  token: string,
  includeDismissed = false,
): Promise<NotificationResponse> {
  const query = new URLSearchParams({
    hasBeenRead: hasBeenRead.toString(),
    ...(includeDismissed && { includeDismissed: 'true' }),
  }).toString();

  const response = await fetch(`/api/v1/accounts/${accountId}/notifications/read/${notificationId}?${query}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to mark notification as ${hasBeenRead ? 'read' : 'unread'}: ${response.statusText}`);
  }

  return await response.json();
}

// Mark all notifications as read/unread
async function markAllNotificationsRead(
  accountId: number,
  hasBeenRead: boolean,
  token: string,
  includeDismissed = false,
): Promise<NotificationResponse> {
  const query = new URLSearchParams({
    hasBeenRead: hasBeenRead.toString(),
    ...(includeDismissed && { includeDismissed: 'true' }),
  }).toString();

  const response = await fetch(`/api/v1/accounts/${accountId}/notifications/read?${query}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to mark all notifications as ${hasBeenRead ? 'read' : 'unread'}: ${response.statusText}`);
  }

  return await response.json();
}

// Dismiss a specific notification
async function dismissNotification(
  accountId: number,
  notificationId: number,
  token: string,
  includeDismissed = false,
): Promise<NotificationResponse> {
  const query = includeDismissed ? '?includeDismissed=true' : '';
  const response = await fetch(`/api/v1/accounts/${accountId}/notifications/dismiss/${notificationId}${query}`, {
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

// Dismiss all notifications
async function dismissAllNotifications(
  accountId: number,
  token: string,
  includeDismissed = false,
): Promise<NotificationResponse> {
  const query = includeDismissed ? '?includeDismissed=true' : '';
  const response = await fetch(`/api/v1/accounts/${accountId}/notifications/dismiss${query}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to dismiss all notifications: ${response.statusText}`);
  }

  return await response.json();
}
```

## WebSocket Integration

The notifications system integrates with WebSocket for real-time updates.

### WebSocket Event Types

```typescript
interface WebSocketEvents {
  // New notification received
  new_notification: (notification: Notification) => void;

  // Notification was dismissed
  notification_dismissed: (data: { notificationId: number; accountId: number }) => void;

  // Notification expired (past endDate)
  notification_expired: (data: { notificationId: number; accountId: number }) => void;

  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;

  // Authentication events
  authenticated: (data: { accountId: number }) => void;
  authentication_failed: (error: string) => void;
}
```

### WebSocket Connection Setup

```typescript
import { Socket, io } from 'socket.io-client';

class NotificationSocketManager {
  public socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(token: string, accountId: number): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.socket = io('wss://api.example.com', {
        auth: {
          token,
          accountId,
        },
        transports: ['websocket'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('authenticated', (data) => {
        console.log('WebSocket authenticated for account:', data.accountId);
      });

      this.socket.on('authentication_failed', (error) => {
        console.error('WebSocket authentication failed:', error);
        reject(new Error(`Authentication failed: ${error}`));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);

        if (reason === 'io server disconnect') {
          return; // Server initiated disconnect, don't reconnect
        }

        this.handleReconnect(token, accountId);
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }

  private handleReconnect(token: string, accountId: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect(token, accountId).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNewNotification(callback: (notification: Notification) => void): void {
    this.socket?.on('new_notification', callback);
  }

  onNotificationDismissed(callback: (notificationId: number) => void): void {
    this.socket?.on('notification_dismissed', (data) => {
      callback(data.notificationId);
    });
  }
}
```

### WebSocket Usage Example

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

## Polling Implementation

For cases where WebSocket is not available, you can implement polling:

```typescript
class NotificationPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private lastNotificationCount = 0;
  private lastNotificationIds = new Set<number>();

  constructor(
    private accountId: number,
    private token: string,
    private intervalMs: number = 30000,
    private onNewNotifications?: (notifications: Notification[]) => void,
    private onError?: (error: Error) => void,
  ) {}

  start(): void {
    if (this.intervalId) {
      return; // Already running
    }

    this.poll(); // Initial poll
    this.intervalId = setInterval(() => this.poll(), this.intervalMs);
    console.log(`Notification polling started (interval: ${this.intervalMs}ms)`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Notification polling stopped');
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  private async poll(): Promise<void> {
    try {
      const response = await fetch(`/api/v1/accounts/${this.accountId}/notifications`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to poll notifications: ${response.statusText}`);
      }

      const data = await response.json();
      const notifications: Notification[] = data.notifications || [];

      // Check for new notifications
      const currentNotificationIds = new Set(notifications.map((n) => n.id));
      const newNotifications = notifications.filter((n) => !this.lastNotificationIds.has(n.id));

      if (newNotifications.length > 0) {
        console.log(`${newNotifications.length} new notification(s) received!`);
        this.onNewNotifications?.(newNotifications);
      }

      this.lastNotificationCount = notifications.length;
      this.lastNotificationIds = currentNotificationIds;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown polling error');
      console.error('Error polling notifications:', err);
      this.onError?.(err);
    }
  }

  setInterval(intervalMs: number): void {
    this.intervalMs = intervalMs;

    if (this.isRunning()) {
      this.stop();
      this.start();
    }
  }

  async pollNow(): Promise<void> {
    await this.poll();
  }
}
```

## Security Considerations

### Rate Limiting

The notifications endpoints implement the following rate limits:

- **GET /notifications**: 60 requests per minute per account
- **POST /notifications/dismiss**: 100 requests per minute per account
- **WebSocket connections**: 1 connection per account

### Security Best Practices

1. **Always use HTTPS** for notification API calls
2. **Validate tokens** before making requests
3. **Implement request timeouts** to prevent hanging requests
4. **Handle token expiration** gracefully with automatic refresh
5. **Sanitize notification content** before displaying in UI
6. **Limit notification polling frequency** to respect rate limits
7. **Use WebSocket for real-time updates** instead of aggressive polling

## Performance Considerations

### Notification Limits

- **Maximum active notifications per account**: 50
- **Automatic cleanup**: Notifications older than 30 days are automatically removed
- **Memory optimization**: Only active notifications (within date range) are returned
- **Database indexing**: Optimized queries with proper indexing on accountId and date fields

### Caching Strategy

```typescript
interface NotificationCache {
  notifications: Notification[];
  lastUpdated: number;
  ttl: number; // Time to live in milliseconds
}

class CachedNotificationService {
  private cache = new Map<number, NotificationCache>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  async getNotifications(accountId: number, token: string, forceFresh = false): Promise<Notification[]> {
    const cached = this.cache.get(accountId);
    const now = Date.now();

    if (!forceFresh && cached && now - cached.lastUpdated < cached.ttl) {
      return cached.notifications;
    }

    const response = await fetch(`/api/v1/accounts/${accountId}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    const notifications = data.notifications || [];

    this.cache.set(accountId, {
      notifications,
      lastUpdated: now,
      ttl: this.DEFAULT_TTL,
    });

    return notifications;
  }

  invalidateCache(accountId: number): void {
    this.cache.delete(accountId);
  }
}
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
enum NotificationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

class NotificationError extends Error {
  public readonly type: NotificationErrorType;
  public readonly statusCode?: number;
  public readonly retryAfter?: number;

  constructor(message: string, type: NotificationErrorType, statusCode?: number, retryAfter?: number) {
    super(message);
    this.name = 'NotificationError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

async function getNotificationsWithRetry(accountId: number, token: string, maxRetries = 3): Promise<Notification[]> {
  let lastError: NotificationError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/v1/accounts/${accountId}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

## Additional Notes

- Notifications are account-specific and don't differ between profiles
- The system supports time-based notifications with start and end dates
- Dismissed notifications are permanently removed from the user's view
- Notification content supports basic text formatting
- The API returns notifications in chronological order (newest first)
- Expired notifications (past `endDate`) are automatically filtered out server-side
- Large notification lists are not paginated (typically limited to active notifications)
- Notification preferences and settings are managed through the account settings
- The system supports both user-generated and system-generated notifications
- Notifications can be triggered by content updates, system events, or scheduled announcements
