[Home](../README.md)

# Profile Transfer API Documentation

This document describes the endpoints for transferring a profile — and everything tied to it — out of one account and
into a brand-new, independent account. A profile owner (the "source account") invites another person by email; that
person claims the invitation from a link, which creates them a new KeepWatching account and moves the profile into it.
Nothing is copied — the profile, its watchlist entries, and its watch history all move to the new account in a single
atomic operation.

This is the only resource in this API that spans multiple, differently-authenticated route groups. Read
[Base URL](#base-url) and [Authentication](#authentication) carefully before integrating, and see [Workflow](#workflow)
for the full invite → preview → claim lifecycle.

## Base URL

Profile transfer endpoints are **not** under one common prefix. There are three distinct groups:

1. **Sender-managed invitations** (source account owner, authenticated) — prefixed with `/api/v1/accounts/{accountId}`:
   - `POST /api/v1/accounts/{accountId}/profiles/{profileId}/transferInvitations`
   - `GET /api/v1/accounts/{accountId}/transferInvitations`
   - `DELETE /api/v1/accounts/{accountId}/transferInvitations/{invitationId}`
2. **Public claim preview** (no authentication) — prefixed with `/api/v1/profileTransferInvitations`:
   - `GET /api/v1/profileTransferInvitations/{token}`
3. **Claim submission** (authenticated as the _recipient_, not as the source account) — same prefix as group 2:
   - `POST /api/v1/profileTransferInvitations/{token}/claim`

## Authentication

Requirements differ by group:

- Group 1 endpoints require a Bearer token **and** that the authenticated account owns the `accountId` (and, for the
  create endpoint, the `profileId`) in the URL, enforced by `authenticateUser` + `authorizeAccountAccess`.
- `GET /api/v1/profileTransferInvitations/{token}` is **fully public** — no `Authorization` header is sent or checked.
  This lets the claim landing page render an invitation preview (profile name, source account name, expiration) before
  the recipient has signed in or created an account.
- `POST /api/v1/profileTransferInvitations/{token}/claim` requires a Bearer token (`authenticateUser`), but **not**
  ownership of the source account — any authenticated Firebase user may attempt to claim. The server instead verifies
  that the authenticated user's verified email matches the invitation's `targetEmail` (see [Workflow](#workflow)).

For authenticated endpoints, include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Data Structures

### Profile Transfer Invitation Object

The full invitation record. Doubles as the audit record read by admin tooling.

```typescript
{
  id: number,
  profileId: number,
  profileName: string,
  sourceAccountId: number,
  sourceAccountName: string,
  targetEmail: string,
  targetName: string | null,
  newDefaultProfileId: number | null,
  status: 'pending' | 'claimed' | 'canceled' | 'expired',
  expiresAt: string,   // ISO timestamp
  claimedAt: string | null,
  createdAt: string
}
```

### Profile Transfer Invitation Preview Object

The reduced, non-sensitive shape returned by the public preview endpoint. It omits `id`, `profileId`, `sourceAccountId`,
`status`, and `claimedAt`.

```typescript
{
  profileName: string,
  sourceAccountName: string,
  targetEmail: string,
  targetName: string | null,
  expiresAt: string   // ISO timestamp
}
```

### Create Invitation Request Body

```typescript
{
  targetEmail: string,          // required, valid email
  targetName?: string,          // optional, 1-50 chars, trimmed
  newDefaultProfileId?: number  // required only when the profile being transferred is the account's current default
}
```

### Claim Request Body

```typescript
{
  name?: string  // optional, 1-50 chars, trimmed; falls back to invitation.targetName, then the profile's own name
}
```

### Account Object (Claim Result)

The claim endpoint returns the newly created account so the client can bootstrap the recipient's session immediately.
See [Account API](./account.md) for the full `Account` shape; the fields relevant here are:

```typescript
{
  id: number,
  name: string,
  email: string,
  uid: string,
  image: string,
  defaultProfileId: number  // set to the just-transferred profile's ID
}
```

## Workflow

Transferring a profile is a multi-step, asynchronous process:

1. **Invite.** The source account owner calls [Create Profile Transfer Invitation](#create-profile-transfer-invitation)
   with the recipient's email (and optionally a display name to pre-fill the claim form). The source account must have
   at least one other profile besides the one being transferred — a single-profile account has nothing to fall back to
   and cannot transfer its only profile. If the profile being transferred is currently the account's default profile,
   `newDefaultProfileId` must identify another profile on the same account to become the new default; otherwise the
   request is rejected.
2. **Token issuance & email.** The server generates a random 256-bit claim token, stores only its SHA-256 hash (never
   the raw token) alongside a 7-day expiration, and emails the recipient a claim link containing the raw token. If the
   email fails to send, the invitation row is deleted immediately so no orphaned, unreachable invitation is left behind.
   Only one **pending** invitation may exist per profile at a time; a second invite attempt while one is pending is
   rejected with a conflict.
3. **Preview (public, pre-auth).** When the recipient opens the claim link, the client calls
   [Get Profile Transfer Invitation Preview](#get-profile-transfer-invitation-preview) — no sign-in required — to show
   the profile name, source account name, and expiration on the claim landing page.
4. **Claim.** The recipient signs in or registers their own Firebase account (via the normal [Account API](./account.md)
   flows — unrelated to this resource) and then calls
   [Claim Profile Transfer Invitation](#claim-profile-transfer-invitation) with their Firebase bearer token. The server:
   - Re-validates that the invitation is still `pending` and unexpired (guards against races with cancellation or expiry
     that may have happened between the preview call and the claim).
   - Requires the authenticated user's verified email to case-insensitively match the invitation's `targetEmail` —
     signing in with a different email is rejected.
   - Requires that no KeepWatching account already exists for that email. This flow always **creates a brand-new
     account**; it never merges a transferred profile into an existing account.
   - Creates the new account, using (in order of preference) the `name` from the request body, then the invitation's
     `targetName`, then the profile's own display name.
   - Re-parents the profile — and its watchlist entries and watchlist activity events — from the source account to the
     new account in a single database transaction.
   - Sets the new account's `defaultProfileId` to the transferred profile.
   - If the transferred profile was the source account's default, updates the source account's `defaultProfileId` to the
     `newDefaultProfileId` captured at invite time.
   - Marks the invitation `claimed` and stamps `claimedAt`.
   - Initializes default preferences for the new account and sends it a welcome email.
   - Emits a best-effort WebSocket notification to the source account so any of its open sessions immediately drop the
     transferred profile from local state rather than showing it as still owned until the next login.
5. **Cancel (optional).** At any point before claiming, the source account owner can cancel a still-pending invitation
   via [Cancel Profile Transfer Invitation](#cancel-profile-transfer-invitation), freeing the profile up for a new
   invitation. Invitations that are already `claimed`, `canceled`, or expired cannot be canceled again.

Watch status, ratings, and other profile-scoped data are untouched by the transfer — only account ownership
(`profiles.account_id`) and the denormalized watchlist account references change. There is no "undo" once an invitation
has been claimed.

## Endpoints

### Create Profile Transfer Invitation

Invites a profile to be transferred into a brand-new account owned by `targetEmail`. No data moves until the invitation
is claimed.

**Endpoint:** `POST /api/v1/accounts/{accountId}/profiles/{profileId}/transferInvitations`

**Authentication:** Required — source account owner only

#### Parameters

- `accountId` (path, required): Unique identifier of the source account
- `profileId` (path, required): Unique identifier of the profile to transfer

#### Request Body

```json
{
  "targetEmail": "jamie@example.com",
  "targetName": "Jamie"
}
```

When the profile being transferred is the account's current default profile, a replacement default must also be
supplied:

```json
{
  "targetEmail": "jamie@example.com",
  "newDefaultProfileId": 7
}
```

#### Response Format

```typescript
{
  message: string,
  invitation: ProfileTransferInvitation
}
```

#### Example Response

```json
{
  "message": "Profile transfer invitation sent successfully",
  "invitation": {
    "id": 1,
    "profileId": 42,
    "profileName": "Jamie's Profile",
    "sourceAccountId": 5,
    "sourceAccountName": "The Smith Family",
    "targetEmail": "jamie@example.com",
    "targetName": "Jamie",
    "newDefaultProfileId": null,
    "status": "pending",
    "expiresAt": "2026-07-21T00:00:00.000Z",
    "claimedAt": null,
    "createdAt": "2026-07-14T00:00:00.000Z"
  }
}
```

**Status Codes:**

- 201: Invitation created and emailed successfully
- 400: Invalid request body, the account has only one profile, or a required `newDefaultProfileId` is missing/invalid
- 401: Authentication required
- 403: Access forbidden
- 404: Account or profile not found
- 409: The target email already has a KeepWatching account, or a pending invitation already exists for this profile
- 500: Server error (including failure to send the invitation email)

---

### Get Profile Transfer Invitations

Lists all transfer invitations created by an account, most recent first.

**Endpoint:** `GET /api/v1/accounts/{accountId}/transferInvitations`

**Authentication:** Required — source account owner only

#### Parameters

- `accountId` (path, required): Unique identifier of the source account

#### Response Format

```typescript
{
  message: string,
  invitations: Array<ProfileTransferInvitation>
}
```

#### Example Response

```json
{
  "message": "Retrieved profile transfer invitations for account 5",
  "invitations": [
    {
      "id": 1,
      "profileId": 42,
      "profileName": "Jamie's Profile",
      "sourceAccountId": 5,
      "sourceAccountName": "The Smith Family",
      "targetEmail": "jamie@example.com",
      "targetName": "Jamie",
      "newDefaultProfileId": null,
      "status": "pending",
      "expiresAt": "2026-07-21T00:00:00.000Z",
      "claimedAt": null,
      "createdAt": "2026-07-14T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**

- 200: Success
- 401: Authentication required
- 403: Access forbidden
- 500: Server error

---

### Cancel Profile Transfer Invitation

Cancels a pending invitation created by this account. Only `pending` invitations can be canceled.

**Endpoint:** `DELETE /api/v1/accounts/{accountId}/transferInvitations/{invitationId}`

**Authentication:** Required — source account owner only

#### Parameters

- `accountId` (path, required): Unique identifier of the source account
- `invitationId` (path, required): Unique identifier of the invitation to cancel

#### Response Format

```typescript
{
  message: string;
}
```

#### Example Response

```json
{
  "message": "Profile transfer invitation canceled successfully"
}
```

**Status Codes:**

- 200: Invitation canceled successfully
- 400: The invitation is not in `pending` status (already claimed, canceled, or expired)
- 401: Authentication required
- 403: Access forbidden, or the invitation does not belong to the specified account
- 404: Invitation not found
- 500: Server error

---

### Get Profile Transfer Invitation Preview

Public, pre-authentication preview of a pending invitation, used to render the claim landing page before the recipient
has signed in.

**Endpoint:** `GET /api/v1/profileTransferInvitations/{token}`

**Authentication:** Not required — this endpoint is fully public

#### Parameters

- `token` (path, required): The raw claim token from the invitation link

#### Response Format

```typescript
{
  message: string,
  preview: ProfileTransferInvitationPreview
}
```

#### Example Response

```json
{
  "message": "Retrieved profile transfer invitation preview",
  "preview": {
    "profileName": "Jamie's Profile",
    "sourceAccountName": "The Smith Family",
    "targetEmail": "jamie@example.com",
    "targetName": "Jamie",
    "expiresAt": "2026-07-21T00:00:00.000Z"
  }
}
```

**Status Codes:**

- 200: Success
- 404: No invitation matches this token
- 410: The invitation has expired, or has already been claimed or canceled
- 500: Server error

---

### Claim Profile Transfer Invitation

Claims a pending invitation: creates a brand-new account for the already-authenticated Firebase user and re-parents the
invited profile (and its watchlist data) to it in a single transaction.

**Endpoint:** `POST /api/v1/profileTransferInvitations/{token}/claim`

**Authentication:** Required — any authenticated Firebase user; does **not** require ownership of the source account.
The authenticated user's verified email must match the invitation's `targetEmail`.

#### Parameters

- `token` (path, required): The raw claim token from the invitation link

#### Request Body

```json
{
  "name": "Jamie Smith"
}
```

`name` is optional; if omitted the new account uses the invitation's `targetName`, or failing that, the transferred
profile's own display name.

#### Response Format

```typescript
{
  message: string,
  account: Account
}
```

#### Example Response

```json
{
  "message": "Profile transfer invitation claimed successfully",
  "account": {
    "id": 42,
    "name": "Jamie Smith",
    "email": "jamie@example.com",
    "uid": "firebase-uid-789",
    "image": "",
    "defaultProfileId": 42
  }
}
```

**Status Codes:**

- 200: Invitation claimed successfully; profile transferred
- 400: Invalid request body, or the source account no longer has another profile to fall back to
- 401: Authentication required
- 403: The authenticated email doesn't match the invitation's `targetEmail`
- 404: No invitation matches this token
- 409: An account already exists for the authenticated user's email
- 410: The invitation has expired, or has already been claimed or canceled
- 500: Server error

## Error Responses

### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "targetEmail",
      "message": "Invalid email format"
    }
  ]
}
```

### Business Rule Errors (400 Bad Request)

```json
{
  "error": "The account must have at least one other profile to transfer this profile"
}
```

```json
{
  "error": "This profile is the account default; choose another profile on the account to become the new default"
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

```json
{
  "error": "Sign in with the email address the invitation was sent to"
}
```

### Not Found Errors (404 Not Found)

```json
{
  "error": "ProfileTransferInvitation with ID 1 not found"
}
```

### Conflict Errors (409 Conflict)

```json
{
  "error": "A pending transfer invitation already exists for this profile"
}
```

```json
{
  "error": "Account with email jamie@example.com already exists"
}
```

### Gone Errors (410 Gone)

```json
{
  "error": "This invitation has expired"
}
```

```json
{
  "error": "This invitation has already been claimed"
}
```

### Server Errors (500 Internal Server Error)

```json
{
  "error": "Internal server error occurred"
}
```

## Example Usage

### Complete Profile Transfer Workflow

```typescript
// Source account owner: invite a profile transfer
async function inviteProfileTransfer(
  accountId: number,
  profileId: number,
  targetEmail: string,
  targetName: string | undefined,
  token: string,
) {
  const response = await fetch(`/api/v1/accounts/${accountId}/profiles/${profileId}/transferInvitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ targetEmail, targetName }),
  });
  return await response.json();
}

// Source account owner: list invitations they've sent
async function getSentInvitations(accountId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/transferInvitations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Source account owner: cancel a pending invitation
async function cancelInvitation(accountId: number, invitationId: number, token: string) {
  const response = await fetch(`/api/v1/accounts/${accountId}/transferInvitations/${invitationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

// Recipient (not yet signed in): preview the invitation from the claim link
async function previewInvitation(claimToken: string) {
  const response = await fetch(`/api/v1/profileTransferInvitations/${claimToken}`);
  return await response.json();
}

// Recipient (now signed in with their own Firebase account): claim the invitation
async function claimInvitation(claimToken: string, name: string | undefined, recipientToken: string) {
  const response = await fetch(`/api/v1/profileTransferInvitations/${claimToken}/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recipientToken}`,
    },
    body: JSON.stringify({ name }),
  });
  return await response.json();
}

// End-to-end example
async function runProfileTransfer() {
  const sourceToken = 'source_account_jwt_token';
  const accountId = 5;
  const profileId = 42;

  try {
    // 1. Source account owner sends the invitation
    const invite = await inviteProfileTransfer(accountId, profileId, 'jamie@example.com', 'Jamie', sourceToken);
    console.log(`Invitation sent, expires ${invite.invitation.expiresAt}`);

    // 2. Recipient opens the emailed claim link and previews it (no auth yet)
    const claimToken = 'raw-token-from-email-link';
    const preview = await previewInvitation(claimToken);
    console.log(`Claiming "${preview.preview.profileName}" from ${preview.preview.sourceAccountName}`);

    // 3. Recipient signs in with their own Firebase account, then claims
    const recipientToken = 'recipient_jwt_token';
    const claimed = await claimInvitation(claimToken, 'Jamie Smith', recipientToken);
    console.log(`New account created: ${claimed.account.id}`);
  } catch (error) {
    console.error('Profile transfer failed:', error);
  }
}
```

### cURL Examples

```bash
# Source account owner: invite a profile transfer
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer source_token_here" \
  -d '{"targetEmail": "jamie@example.com", "targetName": "Jamie"}' \
  https://api.example.com/api/v1/accounts/5/profiles/42/transferInvitations

# Source account owner: list sent invitations
curl -H "Authorization: Bearer source_token_here" \
  https://api.example.com/api/v1/accounts/5/transferInvitations

# Source account owner: cancel a pending invitation
curl -X DELETE \
  -H "Authorization: Bearer source_token_here" \
  https://api.example.com/api/v1/accounts/5/transferInvitations/1

# Recipient: preview an invitation (public, no auth)
curl https://api.example.com/api/v1/profileTransferInvitations/raw-token-from-email-link

# Recipient: claim an invitation (requires the recipient's own Firebase token)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer recipient_token_here" \
  -d '{"name": "Jamie Smith"}' \
  https://api.example.com/api/v1/profileTransferInvitations/raw-token-from-email-link/claim
```

## Additional Notes

- A source account must have at least two profiles to transfer one out — the profile being transferred always needs
  somewhere to leave a functioning account behind.
- Only one **pending** invitation may exist per profile at a time; cancel the existing one before sending another.
- Invitations expire 7 days after creation. Expired invitations behave like canceled ones for preview/claim purposes
  (both return 410 Gone) but remain visible in the sender's invitation list with `status: 'expired'` once queried after
  expiry.
- The raw claim token is only ever transmitted once, in the emailed link, and is stored server-side only as a SHA-256
  hash. There is no way to recover a lost link — cancel the invitation and send a new one.
- Claiming always creates a **new** account; it never merges a profile into an existing account, even one owned by the
  same email address. The target email must be free of any existing KeepWatching account at claim time.
- The transfer moves the profile plus its watchlist entries and watchlist activity history. Watch status, ratings, and
  viewing history rows are keyed to the profile itself and move implicitly since they were never keyed to the account.
- See [Account API](./account.md) for the `Account` object returned on claim, and [Profile API](./profile.md) for
  managing profiles once they belong to their new account.
