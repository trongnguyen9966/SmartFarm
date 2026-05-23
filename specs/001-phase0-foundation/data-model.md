# Data Model: Phase 0 Foundation

**Date**: 2026-04-23
**Feature**: Phase 0 Foundation - Core Entities and Relationships

## Overview

Phase 0 establishes the foundational data models for authentication, user sessions, and the core business entities that will be used throughout the application.

---

## Authentication Entities

### UserSession

Represents an authenticated user's session state in the app.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address (login identifier) |
| fullName | string | Yes | User's display name |
| roles | string[] | Yes | Array of all assigned roles |
| primaryRole | string | Yes | Primary role for navigation routing |
| context | object | Yes | Role-specific context data |

**Context Structure by Role**:
- Store Employee: `{ stores: StoreContext[] }` - Assigned distribution stores
- Farm Owner: `{ farm_owner: FarmOwnerContext }` - Linked farm owner record
- Investor: `{ assigned_stores: StoreContext[] }` - Assigned stores for reporting

**Note**: The app uses cookie-based session management via `frappe-react-sdk`. Session cookies are managed automatically by the SDK.

### StoredCredentials

Credentials stored securely for session restoration across app restarts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Email or username |
| password | string | Yes | User password (encrypted via expo-secure-store) |

**Storage Keys**:
- `esf_cred_usr`: Username
- `esf_cred_pwd`: Password
- `esf_user_data`: Cached user session data (JSON)

### StoredUserData

Cached user data for immediate display during session restoration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user | string | Yes | User email |
| fullName | string | Yes | Display name |
| roles | string[] | Yes | Assigned roles |
| primaryRole | string | Yes | Primary role |
| context | object | Yes | Role-specific context |

### AuthTokens (Optional)

For direct API calls without `frappe-react-sdk`. Not currently used in the main auth flow.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| apiKey | string | Yes | Frappe API key |
| apiSecret | string | Yes | Frappe API secret |

---

## API Response Entities

### ApiResponse<T>

Standard wrapper for successful API responses.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | T | Yes | Response payload (type varies by endpoint) |

### ApiError

Error response structure.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| exc_type | string | No | Exception type from server |
| exception | string | No | Full exception message |
| _server_messages | string | No | JSON-encoded validation messages |

### FrappeLoginResponse

Response from Frappe built-in `/api/method/login` endpoint.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | "Logged In" on success |
| home_page | string | Yes | Default home page path |
| full_name | string | Yes | User's display name |

**Note**: This response does not include roles or context. Those are retrieved via a separate `get_session_info` call.

### SessionInfoResponse

Response from `/api/method/esf.api.auth.get_session_info` endpoint.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user | string | Yes | User email |
| full_name | string | Yes | Display name |
| roles | string[] | Yes | All assigned roles |
| primary_role | string | Yes | Primary role for routing |
| context | object | Yes | Role-specific context |

---

## Core Business Entities

### BaseDocType

Common fields inherited by all Frappe DocTypes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Unique document identifier |
| owner | string | Yes | Creator's email |
| creation | string | Yes | ISO datetime of creation |
| modified | string | Yes | ISO datetime of last modification |
| modified_by | string | Yes | Last modifier's email |
| docstatus | 0 \| 1 \| 2 | Yes | 0=Draft, 1=Submitted, 2=Cancelled |

### DistributionStore

Physical store location managed by store employees.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| store_name | string | Yes | Store display name |
| warehouse | string | Yes | Linked ERPNext warehouse |
| address | string | No | Physical address |
| phone | string | No | Contact phone |
| email | string | No | Contact email |
| latitude | number | No | GPS latitude |
| longitude | number | No | GPS longitude |
| status | 'Active' \| 'Inactive' | Yes | Store status |

### FarmOwner

User who owns and manages farms.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| owner_name | string | Yes | Farm owner's full name |
| phone | string | No | Contact phone |
| email | string | No | Contact email |
| address | string | No | Physical address |
| linked_user | string | No | Associated system user |
| distribution_store | string | No | Primary distribution store |

### Farm

Agricultural property owned by a farm owner.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| farm_name | string | Yes | Farm display name |
| farm_owner | string | Yes | Link to FarmOwner |
| distribution_store | string | Yes | Associated distribution store |
| address | string | No | Physical address |
| latitude | number | No | GPS latitude |
| longitude | number | No | GPS longitude |
| area | number | No | Total area |
| area_uom | string | No | Unit of measurement |
| status | 'Active' \| 'Inactive' | Yes | Farm status |

### Garden

Subdivision of a farm for cultivation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| garden_name | string | Yes | Garden display name |
| farm | string | Yes | Link to parent Farm |
| farm_owner | string | Yes | Link to FarmOwner |
| area | number | No | Garden area |
| area_uom | string | No | Unit of measurement |
| latitude | number | No | GPS latitude |
| longitude | number | No | GPS longitude |
| soil_type | string | No | Soil classification |
| status | 'Active' \| 'Inactive' | Yes | Garden status |

---

## Entity Relationships

```
DistributionStore
    │
    ├── manages ──► FarmOwner (1:N)
    │                  │
    │                  └── owns ──► Farm (1:N)
    │                                  │
    │                                  └── contains ──► Garden (1:N)
    │
    └── receives ──► SalesOrder (1:N) [Phase 1A]
```

---

## State Transitions

### DocStatus (all DocTypes)

```
Draft (0) ──► Submit ──► Submitted (1) ──► Cancel ──► Cancelled (2)
     │                                                      │
     └──────────────────── Delete ◄─────────────────────────┘
```

### Store/Farm/Garden Status

```
Active ◄──────► Inactive
```

---

## Validation Rules

### UserSession
- Email must be valid email format
- At least one role must be present
- primaryRole must exist in roles array

### LoginCredentials
- Username: non-empty string
- Password: non-empty string (min length enforced by backend)

### DistributionStore
- store_name: required, non-empty
- warehouse: required, must be valid ERPNext warehouse

### FarmOwner
- owner_name: required, non-empty

### Farm
- farm_name: required, non-empty
- farm_owner: required, must be valid FarmOwner
- distribution_store: required, must be valid DistributionStore

### Garden
- garden_name: required, non-empty
- farm: required, must be valid Farm
- farm_owner: required, must be valid FarmOwner
