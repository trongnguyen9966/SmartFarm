# Research: Phase 0 Foundation

**Date**: 2026-04-23
**Feature**: Phase 0 Foundation - API Client, Authentication, Navigation, UI Components

## Research Summary

This document captures the technical decisions and patterns established for the ESF Mobile App foundation layer. Since the project already has significant implementation, this research validates and documents the existing approach.

---

## 1. Authentication Strategy

### Decision: Token-based authentication with Frappe API

**Rationale**: The Frappe/ERPNext backend provides a standard authentication mechanism using API key/secret pairs. This approach is well-documented and integrates seamlessly with the existing backend.

**Implementation Pattern**:
- Login endpoint: `POST /api/method/esf.api.auth.login`
- Returns: `api_key`, `api_secret`, `roles`, `primary_role`, `context`
- Header format: `Authorization: token {api_key}:{api_secret}`

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| OAuth2 | Frappe uses its own auth system; OAuth would require additional backend work |
| Session cookies | Not suitable for mobile apps; tokens are more portable |
| JWT | Frappe uses api_key:api_secret pattern natively |

---

## 2. Secure Token Storage

### Decision: expo-secure-store for credentials

**Rationale**: expo-secure-store provides encrypted storage using iOS Keychain and Android Keystore, which are the platform-recommended secure storage mechanisms.

**Implementation Pattern**:
- Store `api_key` and `api_secret` separately
- Store serialized user info for offline access
- Clear all tokens on logout

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| AsyncStorage | Not encrypted; credentials would be stored in plain text |
| react-native-keychain | Requires native module linking; expo-secure-store is Expo-compatible |
| In-memory only | User would need to re-login every app restart |

---

## 3. HTTP Client Architecture

### Decision: Axios with request/response interceptors

**Rationale**: Axios provides a clean interceptor pattern for injecting auth headers and handling errors globally. This centralizes authentication logic and error handling.

**Implementation Pattern**:
- Request interceptor: Inject `Authorization` header from stored tokens
- Response interceptor: Parse Frappe-specific error formats (especially 417 validation errors)
- Error handling: Let consumers handle 401/403/417 based on context

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Fetch API | No interceptor support; would require wrapper for auth header injection |
| frappe-react-sdk | Already in dependencies but axios provides more control for mobile patterns |
| React Query | Would add complexity; can be added later for caching needs |

---

## 4. Role-Based Navigation

### Decision: Expo Router route groups with parentheses notation

**Rationale**: Expo Router supports route groups using `(group-name)` notation, allowing separate tab navigators for each role without URL path pollution.

**Implementation Pattern**:
- `(store-employee)/` - Store Employee tabs
- `(farm-owner)/` - Farm Owner tabs
- `(investor)/` - Investor tabs
- Root layout detects `primary_role` and redirects to appropriate group

**Role Mapping**:
| Backend Role | Route Group | Tabs |
|--------------|-------------|------|
| ESF Store Manager | (store-employee) | Home, Farms, Orders, Profile |
| ESF Farm Owner | (farm-owner) | Home, Gardens, Care, Profile |
| ESF Investor | (investor) | Home, Stores, Reports, Profile |

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Single tab bar with conditional tabs | Complex logic; harder to maintain |
| React Navigation directly | Expo Router provides file-based routing which is cleaner |
| Dynamic route generation | Harder to type-check; route groups are explicit |

---

## 5. Error Handling Strategy

### Decision: Centralized error categorization with consumer responsibility

**Rationale**: The API client intercepts errors and parses Frappe-specific formats, but leaves the handling decision to screen components. This provides flexibility for different UX patterns.

**Error Categories**:
| HTTP Status | Category | Typical Action |
|-------------|----------|----------------|
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show "Access Denied" message |
| 417 | Validation Error | Show field-specific errors |
| 5xx | Server Error | Show retry option |
| Network Error | Connectivity | Show offline indicator |

**Implementation Pattern**:
- AuthContext handles 401 globally (logout and redirect)
- Screen components handle 403/417 locally with user feedback
- ErrorScreen component for full-screen error states

---

## 6. UI Component Library

### Decision: Custom lightweight components

**Rationale**: Building lightweight custom components provides full control over styling and behavior without the overhead of a full UI library. The app's design requirements are specific enough that customization would be needed anyway.

**Components Created**:
| Component | Purpose |
|-----------|---------|
| LoadingScreen | Full-screen spinner for initial loads |
| ErrorScreen | Error state with retry button |
| EmptyState | "No data" placeholder |
| Card | Container with shadow and rounded corners |
| Badge | Status indicator pills |
| ListItem | Standard list row with chevron |
| SearchBar | Search input with clear button |
| ScreenContainer | Safe area wrapper with padding |

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| React Native Paper | Heavy; includes Material Design opinions |
| NativeBase | Large bundle size; many unused components |
| Tamagui | Steeper learning curve; overkill for this app |

---

## 7. TypeScript Models

### Decision: Interface-based models matching Frappe DocTypes

**Rationale**: TypeScript interfaces provide compile-time type safety without runtime overhead. The models mirror Frappe DocType structures for predictable API integration.

**Base Pattern**:
- `BaseDocType` interface with common fields (name, owner, creation, modified, docstatus)
- Domain-specific interfaces extending BaseDocType
- Child table types for nested data (e.g., SalesOrderItem, CareLogItem)

**Key Entities**:
- DistributionStore, FarmOwner, Farm, Garden
- CultivationMaster, CultivationLog, CareLog
- SalesOrder, DeliveryNote, Item, Customer

---

## Resolved Questions

All technical decisions have been made based on:
1. Existing codebase patterns
2. Expo/React Native best practices
3. Frappe/ERPNext integration requirements

No outstanding "NEEDS CLARIFICATION" items remain.
