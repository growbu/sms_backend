# SMS For Me — Backend API Documentation

**Base URL:** `https://sms-backend-three-nu.vercel.app`  
**Framework:** NestJS + TypeScript  
**Database:** MongoDB Atlas (Mongoose ODM)  
**Authentication:** JWT (Access + Refresh tokens) + API Key  

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Standard Response Format](#standard-response-format)
4. [Error Handling](#error-handling)
5. [Modules & Endpoints](#modules--endpoints)
   - [Health Check](#health-check)
   - [Auth Module](#auth-module)
   - [Devices Module](#devices-module)
   - [API Keys Module](#api-keys-module)
   - [Messages Module](#messages-module)
   - [Templates Module](#templates-module)
   - [Campaigns Module](#campaigns-module)
6. [Data Schemas](#data-schemas)
7. [Environment Variables](#environment-variables)

---

## Overview

**SMS For Me** is an SMS gateway SaaS backend that allows users to send SMS messages through their linked Android devices. The flow works as follows:

1. **User registers/logs in** → receives JWT tokens
2. **User links their Android device** → device registers its FCM token
3. **User creates API keys** → used by external apps to send SMS
4. **External app (or dashboard) sends SMS** → backend selects an eligible device → dispatches via FCM → Android app sends the actual SMS → reports status back

The backend acts as a **bridge** between API consumers and real Android devices that physically send SMS messages.

---

## Authentication

The API uses two authentication mechanisms:

### 1. JWT Bearer Token (User Authentication)

Used for user-facing endpoints (profile, devices, API key management, message logs).

```
Authorization: Bearer <accessToken>
```

- **Access Token:** Short-lived (default: 15 minutes)
- **Refresh Token:** Long-lived (default: 7 days), stored as a bcrypt hash in the DB

### 2. API Key (Machine-to-Machine Authentication)

Used for the `POST /messages/send` endpoint (external integrations).

```
x-api-key: smsgw_<prefix>_<random>
```

Or alternatively:

```
Authorization: Bearer smsgw_<prefix>_<random>
```

API keys support:
- **Scoped permissions:** `messages:send`, `messages:read`, `devices:read`
- **Rate limiting:** configurable per-key requests/minute
- **Expiration dates:** optional TTL
- **Revocation:** keys can be deactivated without deletion

---

## Standard Response Format

All successful responses follow this structure:

```json
{
  "statusCode": 200,
  "message": "Operation description",
  "data": { ... }
}
```

List endpoints return arrays in `data`:

```json
{
  "statusCode": 200,
  "data": [ ... ]
}
```

Paginated endpoints include pagination metadata:

```json
{
  "statusCode": 200,
  "data": {
    "messages": [ ... ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

## Error Handling

Errors follow NestJS standard exception format:

```json
{
  "statusCode": 400,
  "message": "Error description or array of validation errors",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created successfully |
| `400` | Bad Request — validation error or invalid input |
| `401` | Unauthorized — missing, invalid, or expired auth |
| `403` | Forbidden — insufficient permissions or rate limit exceeded |
| `404` | Not Found — resource doesn't exist or you don't own it |
| `409` | Conflict — duplicate resource (e.g., existing email, already revoked key) |

### Validation

The API uses class-validator with these global pipe settings:
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects requests with unknown properties
- `transform: true` — auto-transforms payloads to DTO instances

---

## Modules & Endpoints

---

### Health Check

#### `GET /`

Returns a simple health check message. No authentication required.

**Response:**
```
Hello World!
```

---

### Auth Module

Base path: `/auth`

---

#### `POST /auth/signup`

Create a new account with email and password.

**Auth:** None  
**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `fullName` | `string` | ✅ | Cannot be empty |
| `email` | `string` | ✅ | Must be a valid email |
| `password` | `string` | ✅ | Minimum 8 characters |

**Example Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "MyP@ssw0rd"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "64a...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "provider": "local",
      "avatar": null,
      "role": "user",
      "isEmailVerified": false,
      "createdAt": "2026-04-11T10:00:00.000Z",
      "updatedAt": "2026-04-11T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

**Errors:**
- `409 Conflict` — Email already registered

---

#### `POST /auth/login`

Authenticate with email and password.

**Auth:** None  
**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | `string` | ✅ | Must be a valid email |
| `password` | `string` | ✅ | Cannot be empty |

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "MyP@ssw0rd"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

**Errors:**
- `401 Unauthorized` — Invalid email or password
- `401 Unauthorized` — Account uses Google sign-in

---

#### `POST /auth/google`

Authenticate or register with a Google ID token. Handles three scenarios:
1. **Existing Google user** → logs in
2. **Existing email (local account)** → links Google to the account
3. **New user** → creates account with Google provider

**Auth:** None  
**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `idToken` | `string` | ✅ | Valid Google ID token |

**Example Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Google authentication successful",
  "data": {
    "user": {
      "id": "64a...",
      "fullName": "John Doe",
      "email": "john@gmail.com",
      "provider": "google",
      "avatar": "https://lh3.googleusercontent.com/...",
      "role": "user",
      "isEmailVerified": true,
      "createdAt": "2026-04-11T10:00:00.000Z",
      "updatedAt": "2026-04-11T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

**Errors:**
- `400 Bad Request` — Google token missing required info
- `401 Unauthorized` — Invalid or expired Google token

---

#### `POST /auth/refresh`

Refresh an expired access token using a valid refresh token.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `refreshToken` | `string` | ✅ | Cannot be empty |

**Example Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Errors:**
- `403 Forbidden` — Invalid refresh token (potential token reuse detected — all tokens are invalidated)

---

#### `POST /auth/logout`

Invalidate the current refresh token.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:** None

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

---

#### `GET /auth/me`

Get the authenticated user's profile.

**Auth:** `Bearer <accessToken>` (JWT)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "64a...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "provider": "local",
    "avatar": null,
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2026-04-11T10:00:00.000Z",
    "updatedAt": "2026-04-11T10:00:00.000Z"
  }
}
```

---

#### `PATCH /auth/profile`

Update the authenticated user's profile.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:** (all fields optional, at least one required)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `fullName` | `string` | ❌ | Min 2 characters |
| `avatar` | `string` | ❌ | Must be a valid URL |

**Example Request:**
```json
{
  "fullName": "Jane Doe",
  "avatar": "https://example.com/avatar.png"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "64a...",
    "fullName": "Jane Doe",
    "email": "john@example.com",
    "provider": "local",
    "avatar": "https://example.com/avatar.png",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2026-04-11T10:00:00.000Z",
    "updatedAt": "2026-04-11T10:05:00.000Z"
  }
}
```

---

### Devices Module

Base path: `/devices`  
**All endpoints require JWT authentication.**

---

#### `POST /devices/register`

Register a new device or update an existing one (upsert by `deviceId`). Sets the device to `online` and `active` status.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `deviceId` | `string` | ✅ | Unique device identifier |
| `deviceName` | `string` | ✅ | Human-readable device name |
| `fcmToken` | `string` | ✅ | Firebase Cloud Messaging token |
| `platform` | `string` | ❌ | Default: `"android"` |
| `brand` | `string` | ❌ | e.g., `"Samsung"` |
| `model` | `string` | ❌ | e.g., `"Galaxy S24"` |
| `androidVersion` | `string` | ❌ | e.g., `"14"` |
| `appVersion` | `string` | ❌ | e.g., `"1.0.0"` |
| `simLabel` | `string` | ❌ | SIM card label |
| `simSlot` | `number` | ❌ | SIM slot number |
| `phoneNumber` | `string` | ❌ | Phone number of SIM |

**Example Request:**
```json
{
  "deviceId": "android-abc123",
  "deviceName": "My Samsung S24",
  "fcmToken": "fMRxS9k...",
  "platform": "android",
  "brand": "Samsung",
  "model": "Galaxy S24",
  "androidVersion": "14",
  "appVersion": "1.0.0",
  "simLabel": "Maroc Telecom",
  "simSlot": 0,
  "phoneNumber": "+212600000000"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Device registered successfully",
  "data": {
    "id": "64a...",
    "deviceId": "android-abc123",
    "deviceName": "My Samsung S24",
    "platform": "android",
    "brand": "Samsung",
    "model": "Galaxy S24",
    "androidVersion": "14",
    "appVersion": "1.0.0",
    "fcmToken": "fMRxS9k...",
    "simLabel": "Maroc Telecom",
    "simSlot": 0,
    "phoneNumber": "+212600000000",
    "isActive": true,
    "status": "online",
    "batteryLevel": null,
    "isCharging": null,
    "lastSeenAt": "2026-04-11T10:00:00.000Z",
    "createdAt": "2026-04-11T10:00:00.000Z",
    "updatedAt": "2026-04-11T10:00:00.000Z"
  }
}
```

---

#### `PATCH /devices/:id/fcm-token`

Update the FCM token for a device (e.g., after token refresh).

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the device  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `fcmToken` | `string` | ✅ |

**Response (200):** Full device object

---

#### `PATCH /devices/:id/heartbeat`

Send a heartbeat/presence update. Updates `lastSeenAt` and optionally battery info, status, and SIM info.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the device  
**Request Body:** (all fields optional)

| Field | Type | Validation |
|-------|------|------------|
| `batteryLevel` | `number` | 0–100 |
| `isCharging` | `boolean` | — |
| `status` | `string` | `"online"` or `"offline"` only |
| `simLabel` | `string` | — |
| `simSlot` | `number` | — |

**Example Request:**
```json
{
  "batteryLevel": 85,
  "isCharging": true,
  "status": "online"
}
```

**Response (200):** Full device object

---

#### `PATCH /devices/:id/status`

Pause or activate a device. Paused devices are excluded from SMS routing.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the device  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `isActive` | `boolean` | ✅ |

**Example Request:**
```json
{
  "isActive": false
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Device paused successfully",
  "data": { ... }
}
```

---

#### `GET /devices`

List all devices belonging to the authenticated user. Returns a summary view sorted by `lastSeenAt` descending.

**Auth:** `Bearer <accessToken>` (JWT)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "64a...",
      "deviceId": "android-abc123",
      "deviceName": "My Samsung S24",
      "platform": "android",
      "brand": "Samsung",
      "model": "Galaxy S24",
      "isActive": true,
      "status": "online",
      "batteryLevel": 85,
      "isCharging": true,
      "simLabel": "Maroc Telecom",
      "simSlot": 0,
      "lastSeenAt": "2026-04-11T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /devices/:id`

Get full details of a specific device.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the device

**Response (200):** Full device object

---

#### `DELETE /devices/:id`

Permanently delete a device.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the device

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Device removed successfully"
}
```

---

### API Keys Module

Base path: `/api-keys`  
**All endpoints require JWT authentication.**

API keys use the format `smsgw_<8-char-prefix>_<64-char-hex-random>`.  
Only a SHA-256 hash of the key is stored in the database. The full key is shown **once** at creation.

---

#### `POST /api-keys`

Create a new API key.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:**

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `name` | `string` | ✅ | — | Cannot be empty |
| `scopes` | `string[]` | ❌ | `["messages:send"]` | Values: `messages:send`, `messages:read`, `devices:read` |
| `expiresAt` | `string` | ❌ | `null` (never) | ISO 8601 date string |
| `rateLimitPerMinute` | `number` | ❌ | `null` (unlimited) | Min: 1 |

**Available Scopes:**

| Scope | Description |
|-------|-------------|
| `messages:send` | Send SMS messages via the API |
| `messages:read` | Read message logs |
| `devices:read` | Read device information |

**Example Request:**
```json
{
  "name": "My Integration",
  "scopes": ["messages:send", "messages:read"],
  "rateLimitPerMinute": 60,
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "API key created successfully. Store the key securely — it will not be shown again.",
  "data": {
    "id": "64a...",
    "name": "My Integration",
    "prefix": "smsgw_ab12cd34",
    "key": "smsgw_ab12cd34_e7f8a9b0c1d2e3f4...",
    "scopes": ["messages:send", "messages:read"],
    "isActive": true,
    "lastUsedAt": null,
    "requestCount": 0,
    "rateLimitPerMinute": 60,
    "expiresAt": "2027-01-01T00:00:00.000Z",
    "revokedAt": null,
    "createdAt": "2026-04-11T10:00:00.000Z",
    "updatedAt": "2026-04-11T10:00:00.000Z"
  }
}
```

> ⚠️ **The `key` field is only returned at creation and rotation. Store it securely.**

---

#### `GET /api-keys`

List all API keys for the authenticated user.

**Auth:** `Bearer <accessToken>` (JWT)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "64a...",
      "name": "My Integration",
      "prefix": "smsgw_ab12cd34",
      "scopes": ["messages:send"],
      "isActive": true,
      "lastUsedAt": "2026-04-11T10:05:00.000Z",
      "requestCount": 42,
      "rateLimitPerMinute": 60,
      "expiresAt": null,
      "revokedAt": null,
      "createdAt": "2026-04-11T10:00:00.000Z",
      "updatedAt": "2026-04-11T10:05:00.000Z"
    }
  ]
}
```

---

#### `GET /api-keys/:id`

Get details of a specific API key.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the API key

**Response (200):** Full API key object (without raw key)

---

#### `PATCH /api-keys/:id/revoke`

Revoke an API key. The key becomes permanently inactive.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the API key

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "API key revoked successfully",
  "data": {
    "id": "64a...",
    "isActive": false,
    "revokedAt": "2026-04-11T10:10:00.000Z",
    ...
  }
}
```

**Errors:**
- `409 Conflict` — Key is already revoked

---

#### `PATCH /api-keys/:id/rotate`

Regenerate an API key. Creates a new secret while keeping the same metadata (name, scopes, etc). Resets usage counters.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the API key

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "API key rotated successfully. Store the new key securely — it will not be shown again.",
  "data": {
    "id": "64a...",
    "key": "smsgw_ef56gh78_newrandomhex...",
    "requestCount": 0,
    ...
  }
}
```

**Errors:**
- `409 Conflict` — Cannot rotate a revoked key

---

#### `DELETE /api-keys/:id`

Permanently delete an API key.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the API key

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "API key deleted permanently"
}
```

---

### Messages Module

Base path: `/messages`

---

#### `POST /messages/send`

Send an SMS via the API. Selects an eligible device and dispatches the message via FCM push notification.

**Auth:** API Key (`x-api-key` header or `Bearer smsgw_...`)  
**Required Scope:** `messages:send`

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `recipient` | `string` | ✅ | Valid phone number (E.164 or national, 7–15 digits) |
| `message` | `string` | ✅ | 1–1600 characters |
| `deviceId` | `string` | ❌ | Specific device ObjectId (auto-selects if omitted) |
| `externalRequestId` | `string` | ❌ | Your custom correlation ID |

**Device Selection Logic:**
- If `deviceId` is provided → uses that specific device (must be active)
- If omitted → auto-selects the best eligible device:
  - Belongs to the API key's owner
  - `isActive === true`
  - `status === "online"`
  - Most recently seen first

**Example Request:**
```bash
curl -X POST https://sms-backend-three-nu.vercel.app/messages/send \
  -H "x-api-key: smsgw_ab12cd34_e7f8a9b0c1d2..." \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "+212600000000",
    "message": "Hello from the API!",
    "externalRequestId": "order-12345"
  }'
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "SMS queued for delivery",
  "data": {
    "id": "64a...",
    "deviceId": "64b...",
    "recipient": "+212600000000",
    "message": "Hello from the API!",
    "segmentsCount": 1,
    "status": "dispatching",
    "failureReason": null,
    "provider": "android_device",
    "source": "api",
    "externalRequestId": "order-12345",
    "queuedAt": "2026-04-11T10:00:00.000Z",
    "dispatchedAt": "2026-04-11T10:00:01.000Z",
    "sendingAt": null,
    "sentAt": null,
    "deliveredAt": null,
    "failedAt": null,
    "createdAt": "2026-04-11T10:00:00.000Z",
    "updatedAt": "2026-04-11T10:00:01.000Z",
    "device": {
      "id": "64b...",
      "deviceName": "My Samsung S24",
      "phoneNumber": "+212600000000"
    }
  }
}
```

**Errors:**
- `400 Bad Request` — No eligible device available
- `400 Bad Request` — Selected device is paused
- `401 Unauthorized` — Invalid/missing/expired/revoked API key
- `403 Forbidden` — Missing required scope or rate limit exceeded

---

#### `POST /messages/dashboard-send`

Send an SMS from the dashboard or mobile app (JWT-authenticated internal flow). Same logic as `/messages/send` but uses JWT auth and sets `source: "dashboard"`.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:** Same as `POST /messages/send`

**Response (201):** Same format as `POST /messages/send` with `"source": "dashboard"`

---

#### `GET /messages`

List messages with filtering and pagination.

**Auth:** `Bearer <accessToken>` (JWT)  
**Query Parameters:** (all optional)

| Param | Type | Description |
|-------|------|-------------|
| `status` | `string` | Filter by status: `queued`, `dispatching`, `sending`, `sent`, `delivered`, `failed` |
| `recipient` | `string` | Partial match on phone number (case-insensitive regex) |
| `deviceId` | `string` | Filter by device ObjectId |
| `source` | `string` | Filter by source: `api`, `dashboard`, `manual`, `system` |
| `from` | `string` | Start date (ISO 8601) |
| `to` | `string` | End date (ISO 8601) |
| `page` | `string` | Page number (default: `1`) |
| `limit` | `string` | Results per page (default: `20`, max: `100`) |

**Example Request:**
```
GET /messages?status=sent&source=api&page=1&limit=10
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "messages": [
      {
        "id": "64a...",
        "deviceId": "64b...",
        "recipient": "+212600000000",
        "message": "Hello from the API!",
        "segmentsCount": 1,
        "status": "sent",
        "failureReason": null,
        "provider": "android_device",
        "source": "api",
        "externalRequestId": "order-12345",
        "queuedAt": "2026-04-11T10:00:00.000Z",
        "dispatchedAt": "2026-04-11T10:00:01.000Z",
        "sendingAt": "2026-04-11T10:00:02.000Z",
        "sentAt": "2026-04-11T10:00:03.000Z",
        "deliveredAt": null,
        "failedAt": null,
        "createdAt": "2026-04-11T10:00:00.000Z",
        "updatedAt": "2026-04-11T10:00:03.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

#### `GET /messages/:id`

Get full details of a specific message.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the message

**Response (200):** Full message object

---

#### `POST /messages/:id/status`

Update the delivery status of a message. Used by the mobile app to report back the SMS delivery result.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the message  
**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | `string` | ✅ | `sending`, `sent`, `delivered`, `failed` |
| `failureReason` | `string` | ❌ | Reason for failure |
| `errorCode` | `string` | ❌ | Android error code |
| `deviceId` | `string` | ❌ | Reporting device ID |

**Status Transition Rules:**

```
queued → dispatching → sending → sent → delivered
                  ↘         ↘        ↘        ↘
                  failed    failed   failed   failed
```

Only forward transitions are allowed. Terminal states (`delivered`, `failed`) cannot transition further.

| Current Status | Allowed Next Status |
|----------------|---------------------|
| `queued` | `dispatching`, `failed` |
| `dispatching` | `sending`, `failed` |
| `sending` | `sent`, `failed` |
| `sent` | `delivered`, `failed` |
| `delivered` | *(terminal — none)* |
| `failed` | *(terminal — none)* |

**Example Request:**
```json
{
  "status": "sent",
  "deviceId": "64b..."
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Message status updated to \"sent\"",
  "data": { ... }
}
```

**Errors:**
- `400 Bad Request` — Invalid status transition (e.g., `sent` → `queued`)
- `404 Not Found` — Message not found or not owned by user

---


### Templates Module

Base path: `/templates`  
**All endpoints require JWT authentication.**

Templates are reusable SMS content snippets with **`{{variableName}}`** placeholders. Variables are auto-detected on create/update. Each template has a unique slug per user, auto-generated from the name. Updating content bumps the `version` counter.

---

#### `POST /templates`

Create a new template.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:**

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| `name` | `string` | ✅ | — | 2–100 characters |
| `content` | `string` | ✅ | — | 1–1600 characters, valid `{{var}}` syntax |
| `category` | `string` | ❌ | `null` | Max 50 characters |
| `language` | `string` | ❌ | `"en"` | Max 10 characters |
| `isActive` | `boolean` | ❌ | `true` | — |

**Placeholder rules:**
- Use `{{variableName}}` format (alphanumeric + underscore only)
- Malformed syntax like `{{unclosed` or nested `{{{{x}}}}` is rejected
- Variables are extracted automatically into the `variables` array

**Example Request:**
```json
{
  "name": "Welcome Template",
  "content": "Hello {{name}}, welcome to {{company}}! Your code is {{code}}.",
  "category": "onboarding",
  "language": "en"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Template created successfully",
  "data": {
    "id": "64a...",
    "name": "Welcome Template",
    "slug": "welcome-template",
    "category": "onboarding",
    "content": "Hello {{name}}, welcome to {{company}}! Your code is {{code}}.",
    "variables": ["name", "company", "code"],
    "language": "en",
    "isActive": true,
    "version": 1,
    "createdAt": "2026-04-11T10:00:00.000Z",
    "updatedAt": "2026-04-11T10:00:00.000Z"
  }
}
```

---

#### `GET /templates`

List templates with pagination and filters.

**Auth:** `Bearer <accessToken>` (JWT)  
**Query Parameters:** (all optional)

| Param | Type | Description |
|-------|------|-------------|
| `category` | `string` | Filter by category |
| `language` | `string` | Filter by language code |
| `isActive` | `"true"` \| `"false"` | Filter by active status |
| `search` | `string` | Partial match on template name (case-insensitive) |
| `page` | `string` | Page number (default: `1`) |
| `limit` | `string` | Results per page (default: `20`, max: `100`) |

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "templates": [
      {
        "id": "64a...",
        "name": "Welcome Template",
        "slug": "welcome-template",
        "category": "onboarding",
        "content": "Hello {{name}}, welcome to {{company}}! Your code is {{code}}.",
        "variables": ["name", "company", "code"],
        "language": "en",
        "isActive": true,
        "version": 1,
        "createdAt": "2026-04-11T10:00:00.000Z",
        "updatedAt": "2026-04-11T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

#### `GET /templates/:id`

Get a single template by ID.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the template

**Response (200):** Full template object

---

#### `PATCH /templates/:id`

Update a template. Every content update increments `version`. Variables are re-extracted from the new content automatically.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the template  
**Request Body:** (all fields optional)

| Field | Type | Validation |
|-------|------|------------|
| `name` | `string` | 2–100 characters |
| `content` | `string` | 1–1600 characters |
| `category` | `string` | Max 50 characters |
| `language` | `string` | Max 10 characters |
| `isActive` | `boolean` | — |

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Template updated successfully",
  "data": {
    "id": "64a...",
    "version": 2,
    ...
  }
}
```

---

#### `DELETE /templates/:id`

Permanently delete a template.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the template

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Template deleted successfully"
}
```

---

#### `POST /templates/:id/duplicate`

Create a copy of a template. The copy gets a `"(Copy)"` name suffix, a new unique slug, and resets `version` to `1`.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the template  
**Request Body:** None

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Template duplicated successfully",
  "data": {
    "id": "64b...",
    "name": "Welcome Template (Copy)",
    "slug": "welcome-template-copy",
    "version": 1,
    ...
  }
}
```

---

#### `POST /templates/:id/preview`

Render the template with sample variable values. Returns the resolved text, character count, segment count, and any missing variables.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the template  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `variables` | `Record<string, string>` | ❌ |

**Example Request:**
```json
{
  "variables": {
    "name": "John",
    "company": "Acme Inc",
    "code": "12345"
  }
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "renderedContent": "Hello John, welcome to Acme Inc! Your code is 12345.",
    "variables": ["name", "company", "code"],
    "missingVariables": [],
    "characterCount": 51,
    "segmentsCount": 1
  }
}
```

> If a variable is declared in the template but not provided in `variables`, it is left as-is in the output (e.g., `{{code}}`) and listed in `missingVariables`.

---

### Campaigns Module

Base path: `/campaigns`  
**All endpoints require JWT authentication.**

Campaigns allow bulk SMS sending to a list of recipients, using a template or raw message content. The campaign execution pipeline reuses the existing message sending infrastructure (FCM dispatch, status tracking, etc.).

#### Campaign Status Lifecycle

```
draft ──▶ scheduled ──▶ processing ──▶ completed
  │                         │
  │                         ▼
  └──────────────────▶ paused ──▶ processing
                           │
                           ▼
                       cancelled
                           │
                      (any) ──▶ failed
```

| Status | Description |
|--------|-------------|
| `draft` | Created, not yet launched |
| `scheduled` | Set to launch at a future `scheduleAt` time |
| `processing` | Actively dispatching messages |
| `paused` | Execution halted — can be resumed |
| `completed` | All recipients processed |
| `cancelled` | Stopped mid-way — remaining recipients marked as skipped |
| `failed` | Fatal error during execution |

---

#### `POST /campaigns`

Create a new campaign in `draft` status.

**Auth:** `Bearer <accessToken>` (JWT)  
**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | 2–200 characters |
| `description` | `string` | ❌ | Max 500 characters |
| `templateId` | `string` | ❌* | MongoDB ObjectId of an existing template |
| `messageContent` | `string` | ❌* | Raw SMS content (1–1600 chars) |
| `defaultVariables` | `object` | ❌ | Default `{{var}}` values applied to all recipients |
| `recipients` | `array` | ✅ | At least one recipient required |
| `recipients[].phoneNumber` | `string` | ✅ | Phone number (normalized automatically) |
| `recipients[].variables` | `object` | ❌ | Per-recipient variable overrides |
| `scheduleAt` | `string` | ❌ | ISO 8601 future date for scheduled launch |
| `deviceId` | `string` | ❌ | Force a specific device for all messages |

> \* Either `templateId` or `messageContent` must be provided — not both required, but at least one.

**Recipient Processing:**
- Phone numbers are **normalized** (whitespace, dashes, parentheses stripped)
- Numbers that don't match E.164 format (7–15 digits) are counted as `invalidRecipients`
- **Duplicate** numbers within the same campaign are automatically deduplicated
- Variable merging: `defaultVariables` are the base, per-recipient `variables` override them

**Example Request:**
```json
{
  "name": "May Promo Campaign",
  "description": "Send promo codes to verified users",
  "templateId": "64a...",
  "defaultVariables": { "company": "Acme Inc" },
  "recipients": [
    { "phoneNumber": "+212600000001", "variables": { "name": "Alice", "code": "ALICE20" } },
    { "phoneNumber": "+212600000002", "variables": { "name": "Bob", "code": "BOB15" } },
    { "phoneNumber": "invalid-number" },
    { "phoneNumber": "+212600000001" }
  ]
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Campaign created successfully",
  "data": {
    "id": "64c...",
    "name": "May Promo Campaign",
    "description": "Send promo codes to verified users",
    "status": "draft",
    "templateId": "64a...",
    "messageContentSnapshot": "Hello {{name}}, welcome to {{company}}! Your code is {{code}}.",
    "defaultVariables": { "company": "Acme Inc" },
    "totalRecipients": 4,
    "validRecipients": 2,
    "invalidRecipients": 1,
    "duplicateRecipients": 1,
    "sentCount": 0,
    "failedCount": 0,
    "deliveredCount": 0,
    "pendingCount": 2,
    "deviceId": null,
    "scheduleAt": null,
    "startedAt": null,
    "completedAt": null,
    "pausedAt": null,
    "cancelledAt": null,
    "processedIndex": 0,
    "createdAt": "2026-04-11T10:00:00.000Z",
    "updatedAt": "2026-04-11T10:00:00.000Z"
  }
}
```

**Errors:**
- `400 Bad Request` — Neither `templateId` nor `messageContent` provided
- `400 Bad Request` — `scheduleAt` is in the past
- `404 Not Found` — Template not found or not owned by user

---

#### `GET /campaigns`

List campaigns with pagination and filters.

**Auth:** `Bearer <accessToken>` (JWT)  
**Query Parameters:** (all optional)

| Param | Type | Description |
|-------|------|-------------|
| `status` | `string` | Filter by status: `draft`, `scheduled`, `processing`, `paused`, `completed`, `cancelled`, `failed` |
| `search` | `string` | Partial match on campaign name |
| `from` | `string` | Start date (ISO 8601) |
| `to` | `string` | End date (ISO 8601) |
| `page` | `string` | Page number (default: `1`) |
| `limit` | `string` | Results per page (default: `20`, max: `100`) |

> **Note:** The list endpoint omits the `recipients` array for performance. Use `GET /campaigns/:id` to get the full recipient list.

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "campaigns": [ { ... } ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

#### `GET /campaigns/:id`

Get full details of a campaign including the complete recipient list.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign

**Response (200):** Full campaign object with `recipients` array

```json
{
  "statusCode": 200,
  "data": {
    "id": "64c...",
    "name": "May Promo Campaign",
    "status": "draft",
    "recipients": [
      {
        "phoneNumber": "+212600000001",
        "variables": { "name": "Alice", "code": "ALICE20" },
        "status": "pending",
        "messageId": null,
        "processedAt": null
      }
    ],
    ...
  }
}
```

---

#### `PATCH /campaigns/:id`

Update a campaign. **Only allowed in `draft` or `scheduled` status.**

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign  
**Request Body:** (all fields optional — same fields as create)

Updating `recipients` fully replaces the recipient list and resets all counters.

**Errors:**
- `400 Bad Request` — Campaign is not in `draft` or `scheduled` status

---

#### `DELETE /campaigns/:id`

Permanently delete a campaign. **Only allowed for `draft`, `completed`, `cancelled`, or `failed` campaigns.**

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Campaign deleted successfully"
}
```

**Errors:**
- `400 Bad Request` — Campaign is active/processing/paused (cancel it first)

---

#### `POST /campaigns/:id/launch`

Launch a campaign immediately. Transitions status to `processing` and begins dispatching messages in batches (up to 50 per invocation). On launch, the template content is **snapshotted** — future template edits will not affect this campaign.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign  
**Request Body:** None

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Campaign launched. Messages are being dispatched.",
  "data": {
    "id": "64c...",
    "status": "processing",
    "startedAt": "2026-04-11T10:01:00.000Z",
    ...
  }
}
```

**Business Rules:**
- Campaign must have at least 1 valid recipient
- Campaign must have message content or a template
- Valid transitions: `draft` → `processing`, `scheduled` → `processing`

**Errors:**
- `400 Bad Request` — Zero valid recipients
- `400 Bad Request` — No message content set
- `400 Bad Request` — Invalid status transition

---

#### `POST /campaigns/:id/pause`

Pause a running campaign. Already-dispatched messages continue normally; no new messages are dispatched.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Campaign paused",
  "data": { "status": "paused", "pausedAt": "2026-04-11T10:02:00.000Z", ... }
}
```

**Valid from:** `processing` only

---

#### `POST /campaigns/:id/resume`

Resume a paused campaign. Processing continues from where it left off (`processedIndex`).

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Campaign resumed",
  "data": { "status": "processing", ... }
}
```

**Valid from:** `paused` only

---

#### `POST /campaigns/:id/cancel`

Cancel a campaign. All remaining `pending` recipients are marked as `skipped`. Already-dispatched messages are unaffected.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Campaign cancelled",
  "data": { "status": "cancelled", "cancelledAt": "2026-04-11T10:03:00.000Z", ... }
}
```

**Valid from:** `draft`, `scheduled`, `processing`, `paused`

---

#### `POST /campaigns/:id/duplicate`

Create a copy of a campaign as a new `draft`. All recipient data and content are cloned; counters are reset to zero.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign  
**Request Body:** None

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Campaign duplicated as draft",
  "data": {
    "id": "64d...",
    "name": "May Promo Campaign (Copy)",
    "status": "draft",
    "sentCount": 0,
    "pendingCount": 2,
    "scheduleAt": null,
    ...
  }
}
```

---

#### `GET /campaigns/:id/stats`

Get live aggregated stats computed from the recipient list.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "64c...",
    "name": "May Promo Campaign",
    "status": "processing",
    "totalRecipients": 4,
    "validRecipients": 2,
    "invalidRecipients": 1,
    "duplicateRecipients": 1,
    "pending": 0,
    "queued": 0,
    "sent": 1,
    "delivered": 1,
    "failed": 0,
    "skipped": 0,
    "progress": 100,
    "startedAt": "2026-04-11T10:01:00.000Z",
    "completedAt": "2026-04-11T10:01:05.000Z"
  }
}
```

| Field | Description |
|-------|-------------|
| `progress` | Percentage of valid recipients that have been processed (0–100) |
| `pending` | Not yet dispatched |
| `queued` | Dispatched to device, awaiting callback |
| `sent` | Device confirmed SMS was sent |
| `delivered` | Delivery receipt received |
| `failed` | Failed to send |
| `skipped` | Skipped due to cancellation or post-render validation failure |

---

#### `POST /campaigns/:id/preview`

Preview the rendered message for the first 5 recipients. Useful to verify content rendering before launching.

**Auth:** `Bearer <accessToken>` (JWT)  
**URL Params:** `id` — MongoDB ObjectId of the campaign  
**Request Body:** None

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "totalRecipients": 4,
    "validRecipients": 2,
    "invalidRecipients": 1,
    "duplicateRecipients": 1,
    "sampleMessages": [
      {
        "phoneNumber": "+212600000001",
        "renderedContent": "Hello Alice, welcome to Acme Inc! Your code is ALICE20.",
        "characterCount": 53,
        "segmentsCount": 1
      },
      {
        "phoneNumber": "+212600000002",
        "renderedContent": "Hello Bob, welcome to Acme Inc! Your code is BOB15.",
        "characterCount": 50,
        "segmentsCount": 1
      }
    ]
  }
}
```

---

#### `POST /campaigns/process-scheduled`

Trigger processing of all campaigns whose `scheduleAt` time has passed and are still in `scheduled` status. This endpoint is designed to be called by an **external cron job** (e.g., Vercel Cron). No authentication required.

**Auth:** None  
**Request Body:** None

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Processed 2 scheduled campaign(s)",
  "data": {
    "processed": 2,
    "campaignIds": ["64c...", "64e..."]
  }
}
```

---

## Data Schemas

### User

| Field | Type | Description |
|-------|------|-------------|
| `fullName` | `string` | User's display name |
| `email` | `string` | Unique, lowercase email |
| `passwordHash` | `string \| null` | bcrypt hash (null for Google-only accounts) |
| `provider` | `enum` | `local` or `google` |
| `googleId` | `string \| null` | Google user ID |
| `avatar` | `string \| null` | Profile picture URL |
| `role` | `enum` | `user` or `admin` |
| `isEmailVerified` | `boolean` | Email verification status |
| `refreshTokenHash` | `string \| null` | Hashed refresh token |
| `createdAt` | `Date` | Auto-generated |
| `updatedAt` | `Date` | Auto-generated |

### Device

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `ObjectId` | Owner reference |
| `deviceId` | `string` | Unique device identifier (from Android) |
| `deviceName` | `string` | Human-readable name |
| `platform` | `string` | Default: `"android"` |
| `brand` | `string \| null` | Device manufacturer |
| `model` | `string \| null` | Device model |
| `androidVersion` | `string \| null` | OS version |
| `appVersion` | `string \| null` | App version |
| `fcmToken` | `string` | Firebase Cloud Messaging token |
| `simLabel` | `string \| null` | SIM card label |
| `simSlot` | `number \| null` | SIM slot number |
| `phoneNumber` | `string \| null` | Phone number |
| `isActive` | `boolean` | Whether device accepts messages |
| `status` | `enum` | `online`, `offline`, `paused` |
| `batteryLevel` | `number \| null` | 0–100 |
| `isCharging` | `boolean \| null` | Charging status |
| `lastSeenAt` | `Date` | Last heartbeat timestamp |
| `createdAt` | `Date` | Auto-generated |
| `updatedAt` | `Date` | Auto-generated |

### API Key

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `ObjectId` | Owner reference |
| `name` | `string` | Human-readable key name |
| `prefix` | `string` | Visible prefix (e.g., `smsgw_ab12cd34`) |
| `keyHash` | `string` | SHA-256 hash of the full key |
| `scopes` | `string[]` | Permitted operations |
| `isActive` | `boolean` | Whether key is active |
| `lastUsedAt` | `Date \| null` | Last usage timestamp |
| `lastUsedIp` | `string \| null` | Last client IP |
| `requestCount` | `number` | Total requests made |
| `rateLimitPerMinute` | `number \| null` | Rate limit (null = unlimited) |
| `expiresAt` | `Date \| null` | Expiration date (null = never) |
| `revokedAt` | `Date \| null` | Revocation timestamp |
| `createdAt` | `Date` | Auto-generated |
| `updatedAt` | `Date` | Auto-generated |

### Message

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `ObjectId` | Owner reference |
| `apiKeyId` | `ObjectId \| null` | API key used (null for dashboard/manual/campaign sends) |
| `campaignId` | `ObjectId \| null` | Campaign reference (null for non-campaign messages) |
| `deviceId` | `ObjectId \| null` | Device that sent/will send the SMS |
| `recipient` | `string` | Destination phone number |
| `message` | `string` | SMS text content |
| `segmentsCount` | `number \| null` | Estimated SMS segments (GSM-7 or UCS-2) |
| `status` | `enum` | `queued`, `dispatching`, `sending`, `sent`, `delivered`, `failed` |
| `failureReason` | `string \| null` | Error description on failure |
| `provider` | `string` | Default: `"android_device"` |
| `source` | `enum` | `api`, `dashboard`, `manual`, `system`, `campaign` |
| `externalRequestId` | `string \| null` | Caller's correlation ID |
| `queuedAt` | `Date \| null` | When message was queued |
| `dispatchedAt` | `Date \| null` | When FCM push was sent |
| `sendingAt` | `Date \| null` | When device started sending |
| `sentAt` | `Date \| null` | When native SMS was sent |
| `deliveredAt` | `Date \| null` | When delivery receipt arrived |
| `failedAt` | `Date \| null` | When failure was recorded |
| `createdAt` | `Date` | Auto-generated |
| `updatedAt` | `Date` | Auto-generated |

### Template

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `ObjectId` | Owner reference |
| `name` | `string` | Human-readable template name |
| `slug` | `string` | URL-safe unique identifier per user (auto-generated, lowercase) |
| `category` | `string \| null` | Optional grouping label |
| `content` | `string` | SMS text with `{{variable}}` placeholders |
| `variables` | `string[]` | Auto-extracted list of placeholder names |
| `language` | `string` | Language code, default `"en"` |
| `isActive` | `boolean` | Whether template is available for use |
| `version` | `number` | Incremented on every content update (starts at 1) |
| `createdAt` | `Date` | Auto-generated |
| `updatedAt` | `Date` | Auto-generated |

**Indexes:** `{ userId, slug }` unique · `{ userId, category }` · `{ userId, isActive }`

### Campaign

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `ObjectId` | Owner reference |
| `name` | `string` | Campaign name |
| `description` | `string \| null` | Optional description |
| `status` | `enum` | `draft`, `scheduled`, `processing`, `paused`, `completed`, `cancelled`, `failed` |
| `templateId` | `ObjectId \| null` | Source template reference |
| `messageContentSnapshot` | `string \| null` | Content snapshot at launch time |
| `defaultVariables` | `object \| null` | Base variable values for all recipients |
| `recipients` | `CampaignRecipient[]` | Embedded recipient list |
| `totalRecipients` | `number` | Raw input count |
| `validRecipients` | `number` | Phone-valid, deduplicated count |
| `invalidRecipients` | `number` | Count of invalid phone numbers |
| `duplicateRecipients` | `number` | Count of removed duplicates |
| `sentCount` | `number` | Running aggregate |
| `failedCount` | `number` | Running aggregate |
| `deliveredCount` | `number` | Running aggregate |
| `pendingCount` | `number` | Remaining unprocessed |
| `deviceId` | `ObjectId \| null` | Forced device (null = auto-select) |
| `scheduleAt` | `Date \| null` | Scheduled launch time |
| `startedAt` | `Date \| null` | When processing began |
| `completedAt` | `Date \| null` | When all recipients were processed |
| `pausedAt` | `Date \| null` | When last paused |
| `cancelledAt` | `Date \| null` | When cancelled |
| `processedIndex` | `number` | Batch resume cursor |
| `createdAt` | `Date` | Auto-generated |
| `updatedAt` | `Date` | Auto-generated |

**Indexes:** `{ userId, status, createdAt }` · `{ userId, createdAt }` · `{ status, scheduleAt }` (for cron)

### CampaignRecipient (embedded)

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | `string` | Normalized phone number |
| `variables` | `object \| null` | Per-recipient variable overrides |
| `status` | `enum` | `pending`, `queued`, `sent`, `delivered`, `failed`, `skipped` |
| `messageId` | `ObjectId \| null` | Link to the Message record created for this recipient |
| `processedAt` | `Date \| null` | When this recipient was dispatched |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ❌ | Server port (default: `3000`) |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | ❌ | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | Refresh token TTL (default: `7d`) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth 2.0 Client ID |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID for FCM |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase service account private key (PEM) |

---

## SMS Delivery Flow

### Single Message

```
┌─────────────┐    API Key     ┌──────────────┐    FCM Push    ┌────────────────┐
│  External    │  ──────────▶  │   Backend    │  ──────────▶  │  Android App   │
│  Application │               │  (NestJS)    │               │  (Flutter)     │
└─────────────┘               └──────────────┘               └────────────────┘
                                     │                               │
                                     │  MongoDB                      │  Native SMS
                                     ▼                               ▼
                              ┌──────────────┐               ┌────────────────┐
                              │  Message Log │  ◀─────────── │  Status        │
                              │  (DB)        │   Callback    │  Callback      │
                              └──────────────┘               └────────────────┘
```

1. **External app** calls `POST /messages/send` with API key
2. **Backend** selects an eligible device, creates a message record, sends FCM data push
3. **Android app** receives FCM push, sends the SMS via native Android SMS API
4. **Android app** calls `POST /messages/:id/status` to report delivery result
5. **Backend** updates the message status in the database

### Campaign Flow

```
┌──────────┐  POST /campaigns/:id/launch  ┌──────────────┐
│ Dashboard │ ────────────────────────────▶│   Backend    │
└──────────┘                               │  (NestJS)    │
                                           └──────┬───────┘
                                                  │  For each recipient (batch of 50)
                                                  ▼
                                    ┌─────────────────────────┐
                                    │  Resolve template/vars  │
                                    │  Normalize phone number │
                                    │  Create Message record  │
                                    │  Dispatch via FCM       │
                                    └─────────────┬───────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │  Android App sends SMS  │
                                    │  Calls /messages/:id/   │
                                    │  status callback        │
                                    └─────────────┬───────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │  Campaign stats updated │
                                    │  (sentCount, etc.)      │
                                    └─────────────────────────┘
```

1. **User** creates a campaign with a template and recipient list
2. **Backend** normalizes/validates/deduplicates phone numbers at creation time
3. **User** calls `POST /campaigns/:id/launch`
4. **Backend** snapshots the template content at launch time and transitions to `processing`
5. **Backend** processes recipients in batches of 50, dispatching each through the existing FCM pipeline
6. **Android app** sends SMS and reports back via status callback
7. **Campaign stats** are updated in real time as messages progress through their lifecycle

---

*Last updated: April 11, 2026*
