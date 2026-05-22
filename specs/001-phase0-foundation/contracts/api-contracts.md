# API Contracts: Phase 0 Foundation

**Date**: 2026-04-23
**Feature**: Phase 0 Foundation - Authentication & Core API

## Overview

This document defines the API contracts between the ESF Mobile App and the Frappe/ERPNext backend. Phase 0 focuses on authentication endpoints and the base patterns for resource access.

---

## Authentication Endpoints

### POST /api/method/esf.api.auth.login

Authenticate user and retrieve session credentials.

**Request**:
```json
{
  "usr": "string (email)",
  "pwd": "string (password)"
}
```

**Response (200 OK)**:
```json
{
  "message": {
    "user": "email@example.com",
    "full_name": "User Name",
    "roles": ["ESF Store Manager", "System Manager"],
    "primary_role": "ESF Store Manager",
    "api_key": "abcd1234",
    "api_secret": "xyz789",
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
| Status | Condition | Response |
|--------|-----------|----------|
| 401 | Invalid credentials | `{"message": "Invalid login credentials"}` |
| 417 | Validation error | `{"_server_messages": "[...]"}` |

---

### POST /api/method/esf.api.auth.get_session_info

Refresh current user session information.

**Request**: None (uses Authorization header)

**Headers**:
```
Authorization: token {api_key}:{api_secret}
```

**Response (200 OK)**:
```json
{
  "message": {
    "user": "email@example.com",
    "full_name": "User Name",
    "roles": ["ESF Store Manager"],
    "primary_role": "ESF Store Manager",
    "context": {
      "stores": [...]
    }
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 401 | Token expired or invalid |

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

## Authorization Header Format

All authenticated requests must include:

```
Authorization: token {api_key}:{api_secret}
Content-Type: application/json
Accept: application/json
```

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
