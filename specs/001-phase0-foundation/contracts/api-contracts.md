# API Contracts: Phase 0 Foundation

**Date**: 2026-04-23
**Feature**: Phase 0 Foundation - Authentication & Core API

## Overview

This document defines the API contracts between the ESF Mobile App and the Frappe/ERPNext backend. Phase 0 focuses on authentication endpoints and the base patterns for resource access.

The app uses `frappe-react-sdk` for authentication, which implements cookie-based session management via Frappe's built-in login endpoint.

---

## Authentication Endpoints

### Two-Step Authentication Flow

The login process consists of two steps:
1. **Login**: POST to `/api/method/login` to establish a session cookie
2. **Get Session Info**: POST to `/api/method/esf.api.auth.get_session_info` to retrieve user roles and context

This two-step approach is required because Frappe's built-in login endpoint doesn't return role/context information.

---

### Step 1: POST /api/method/login (Frappe Built-in)

Authenticate user and establish a session cookie. This endpoint is provided by Frappe core.

**Request**:
```json
{
  "usr": "string (email or username)",
  "pwd": "string (password)"
}
```

**Response (200 OK)**:
```json
{
  "message": "Logged In",
  "home_page": "/app",
  "full_name": "User Name"
}
```

**Response Headers**:
- Sets `sid` session cookie for subsequent requests

**Error Responses**:
| Status | Condition | Response |
|--------|-----------|----------|
| 401 | Invalid credentials | `{"message": "Invalid login credentials"}` |
| 417 | Validation error | `{"_server_messages": "[...]"}` |

**Note**: This endpoint is called via `useFrappeAuth().login()` from `frappe-react-sdk`.

---

### Step 2: POST /api/method/esf.api.auth.get_session_info

Retrieve the authenticated user's role information and context after login.

**Request**: None (uses session cookie)

**Headers**:
```
Cookie: sid={session_id}
Content-Type: application/json
```

**Response (200 OK)**:
```json
{
  "message": {
    "user": "email@example.com",
    "full_name": "User Name",
    "roles": ["ESF Store Manager", "System Manager"],
    "primary_role": "ESF Store Manager",
    "context": {
      "stores": [
        {
          "name": "STORE-001",
          "store_name": "Main Distribution Store"
        }
      ]
    }
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 401 | Session expired or invalid |

---

## Standard REST Patterns

All resource endpoints follow Frappe's REST API conventions.

### GET /api/resource/{DocType}

List documents with filtering and pagination.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| fields | JSON array | Fields to return |
| filters | JSON array | Filter conditions `[["field", "operator", "value"]]` |
| order_by | string | Sort order (e.g., "creation desc") |
| limit_start | number | Pagination offset |
| limit_page_length | number | Page size (default 20) |

**Example**:
```
GET /api/resource/Farm?fields=["name","farm_name","status"]&filters=[["status","=","Active"]]
```

**Response (200 OK)**:
```json
{
  "data": [
    {
      "name": "FARM-001",
      "farm_name": "Green Valley Farm",
      "status": "Active"
    }
  ]
}
```

---

### GET /api/resource/{DocType}/{name}

Get single document by name.

**Response (200 OK)**:
```json
{
  "data": {
    "name": "FARM-001",
    "farm_name": "Green Valley Farm",
    "farm_owner": "FO-001",
    "distribution_store": "STORE-001",
    "status": "Active",
    "creation": "2026-01-15 10:30:00",
    "modified": "2026-04-20 14:22:00"
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 404 | Document not found |
| 403 | No read permission |

---

### POST /api/resource/{DocType}

Create new document.

**Request**:
```json
{
  "farm_name": "New Farm",
  "farm_owner": "FO-001",
  "distribution_store": "STORE-001",
  "status": "Active"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "name": "FARM-002",
    "farm_name": "New Farm",
    ...
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 403 | No create permission |
| 417 | Validation errors |

---

### PUT /api/resource/{DocType}/{name}

Update existing document.

**Request**:
```json
{
  "farm_name": "Updated Farm Name"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "name": "FARM-001",
    "farm_name": "Updated Farm Name",
    ...
  }
}
```

---

### DELETE /api/resource/{DocType}/{name}

Delete document.

**Response (200 OK)**:
```json
{
  "message": "ok"
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 403 | No delete permission |
| 417 | Cannot delete linked document |

---

## Error Response Format

### Validation Error (417)

```json
{
  "exc_type": "ValidationError",
  "exception": "ValidationError: Farm Name is required",
  "_server_messages": "[{\"message\": \"Farm Name is required\"}]"
}
```

**Parsing Logic**:
1. Parse `_server_messages` as JSON array
2. Each element is a JSON string containing `{"message": "..."}`
3. Extract and display all messages to user

### Permission Error (403)

```json
{
  "exc_type": "PermissionError",
  "exception": "PermissionError: Not permitted to read Farm"
}
```

### Session Expired (401)

```json
{
  "exc_type": "SessionExpiredError",
  "exception": "Session Expired"
}
```

---

## Session Authentication

The app uses cookie-based authentication via `frappe-react-sdk`. All authenticated requests include the session cookie automatically.

**Headers for authenticated requests**:
```
Cookie: sid={session_id}
Content-Type: application/json
Accept: application/json
```

**Session Persistence**: To restore sessions across app restarts, the app stores user credentials (username/password) in secure storage and re-authenticates on launch. This is necessary because HTTP-only cookies cannot be persisted by the mobile app.

**Alternative Token Auth** (for direct API calls without frappe-react-sdk):
```
Authorization: token {api_key}:{api_secret}
```
Note: The current implementation uses cookie-based auth, but token auth is available for future integrations.

---

## DocTypes Reference

| DocType | Description |
|---------|-------------|
| Distribution Store | Store locations |
| Farm Owner | Farm owner profiles |
| Farm | Agricultural properties |
| Garden | Cultivation areas within farms |
| Cultivation Master | Crop/cultivation types |
| Cultivation Log | Active cultivation tracking |
| Care Log | Farm care activities |
| Sales Order | Customer orders |
| Delivery Note | Shipment records |
