# Implementation Plan: Phase 0 Foundation

**Branch**: `001-phase0-foundation` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-phase0-foundation/spec.md`

## Summary

Phase 0 Foundation establishes the core infrastructure for the ESF Mobile App: a secure API client with authentication header injection, role-based authentication and navigation system supporting three user types (Store Employee, Farm Owner, Investor), and a consistent set of reusable UI components. The implementation leverages Expo with Expo Router for navigation, expo-secure-store for secure credential storage, and axios for HTTP communication with the Frappe/ERPNext backend.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.2, React Native 0.83
**Primary Dependencies**: Expo 55, Expo Router 55, frappe-react-sdk 1.x, expo-secure-store 55
**API Client**: frappe-react-sdk (cookie-based session management via useFrappeAuth hook)
**Storage**: expo-secure-store for credentials, Frappe/ERPNext backend for data
**Testing**: Manual testing (no test framework currently configured)
**Target Platform**: iOS 13+, Android 8+, Web (via react-native-web)
**Project Type**: Mobile app (React Native / Expo)
**Performance Goals**: Login under 10 seconds, smooth 60fps navigation
**Constraints**: Must work offline-tolerant for UI (API requires connectivity)
**Scale/Scope**: 3 user roles, ~50 screens total across all phases

### Authentication Flow

1. User enters credentials on login screen
2. App calls `useFrappeAuth().login()` → POST `/api/method/login`
3. Frappe returns `{ message: "Logged In", full_name }` and sets session cookie
4. App calls `useFrappePostCall()` → POST `/api/method/esf.api.auth.get_session_info`
5. Backend returns `{ user, full_name, roles, primary_role, context }`
6. App stores credentials securely for session restoration
7. App navigates to role-specific home screen based on primary_role

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is a template without specific principles defined. No gates to enforce.

**Status**: PASS (no constitution constraints defined)

## Project Structure

### Documentation (this feature)

```text
specs/001-phase0-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with auth check
│   ├── index.tsx                 # Splash screen
│   ├── auth/
│   │   └── login.tsx             # Login screen
│   ├── (store-employee)/         # Store Employee role group
│   │   ├── _layout.tsx           # Tabs: Home, Farms, Orders, Profile
│   │   ├── home/
│   │   ├── farms/
│   │   ├── orders/
│   │   └── profile/
│   ├── (farm-owner)/             # Farm Owner role group
│   │   ├── _layout.tsx           # Tabs: Home, Gardens, Care, Profile
│   │   ├── home/
│   │   ├── gardens/
│   │   ├── care/
│   │   └── profile/
│   └── (investor)/               # Investor role group
│       ├── _layout.tsx           # Tabs: Home, Stores, Reports, Profile
│       ├── home/
│       ├── stores/
│       ├── reports/
│       └── profile/
├── components/
│   └── ui/                       # Shared UI components
│       ├── LoadingScreen.tsx
│       ├── ErrorScreen.tsx
│       ├── EmptyState.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── ListItem.tsx
│       ├── SearchBar.tsx
│       ├── ScreenContainer.tsx
│       └── index.ts
├── contexts/
│   └── AuthContext.tsx           # Authentication state provider
├── hooks/
│   └── useAuth.ts                # Auth hook for components
├── services/
│   ├── storage.ts                # AsyncStorage wrapper
│   └── auth/
│       └── tokenStorage.ts       # Secure credential storage (expo-secure-store)
├── constants/
│   ├── api.ts                    # API base URL config
│   └── theme.ts                  # Theme constants
└── types/
    ├── api.ts                    # API response types
    └── models/
        └── index.ts              # DocType TypeScript interfaces
```

**Structure Decision**: Mobile app structure with Expo Router file-based routing. Role-specific route groups using parentheses notation `(role-name)` for tab navigation isolation.

## Complexity Tracking

No violations - structure follows standard Expo/React Native patterns.
