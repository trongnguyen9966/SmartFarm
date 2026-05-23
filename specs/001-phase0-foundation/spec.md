# Feature Specification: Phase 0 Foundation

**Feature Branch**: `001-phase0-foundation`
**Created**: 2026-04-23
**Status**: Draft
**Input**: User description: "Phase 0 Foundation - API Client Setup, Authentication, Role-Based Navigation, and Shared UI Components for ESF Mobile App"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Login (Priority: P1)

A store employee, farm owner, or investor opens the ESF mobile app and needs to authenticate securely to access their role-specific features. They enter their credentials and are granted access to the appropriate dashboard based on their primary role.

**Why this priority**: Authentication is the gateway to all app functionality. Without secure login, no other features can be accessed. This is the foundational requirement that enables all subsequent user interactions.

**Independent Test**: Can be fully tested by attempting login with valid/invalid credentials and verifying that successful login stores tokens securely and redirects to the correct role-based dashboard.

**Acceptance Scenarios**:

1. **Given** a user with valid credentials, **When** they enter their email and password and tap login, **Then** they are authenticated and redirected to their role-specific home screen
2. **Given** a user with invalid credentials, **When** they attempt to login, **Then** they see a clear error message and can retry
3. **Given** a previously authenticated user, **When** they open the app, **Then** their session is restored automatically without re-entering credentials

---

### User Story 2 - Role-Based Navigation (Priority: P1)

After successful authentication, users see a tab-based navigation tailored to their role. Store employees see Home/Farms/Orders/Profile tabs, farm owners see Home/Gardens/Care Logs/Profile tabs, and investors see Home/Stores/Reports/Profile tabs.

**Why this priority**: Role-based navigation ensures users only see features relevant to their responsibilities, reducing confusion and improving usability. This is essential for multi-role applications.

**Independent Test**: Can be fully tested by logging in as different user roles and verifying that each role sees their designated tab structure and can navigate between tabs.

**Acceptance Scenarios**:

1. **Given** an authenticated store employee, **When** they view the app, **Then** they see tabs for Home, Farms, Orders, and Profile
2. **Given** an authenticated farm owner, **When** they view the app, **Then** they see tabs for Home, Gardens, Care Logs, and Profile
3. **Given** an authenticated investor, **When** they view the app, **Then** they see tabs for Home, Stores, Reports, and Profile

---

### User Story 3 - API Communication (Priority: P1)

The app communicates with the backend server to fetch and send data. All API requests include proper authentication headers, and errors are handled gracefully with appropriate user feedback.

**Why this priority**: API communication is the backbone of all data operations. Without reliable API connectivity and error handling, no business features can function.

**Independent Test**: Can be fully tested by making API calls with valid/invalid tokens and verifying proper header injection, response handling, and error state management.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the app makes an API request, **Then** the request includes proper authentication headers
2. **Given** an expired or invalid session, **When** an API returns 401 Unauthorized, **Then** the user is redirected to the login screen
3. **Given** a permission issue, **When** an API returns 403 Forbidden, **Then** the user sees an "Access Denied" message
4. **Given** a validation error, **When** an API returns 417, **Then** the user sees specific validation feedback

---

### User Story 4 - Consistent UI Experience (Priority: P2)

Users interact with a consistent set of UI components throughout the app, including loading indicators, error screens, empty states, cards, badges, list items, and search functionality.

**Why this priority**: Consistent UI components improve user experience and reduce cognitive load. While not blocking functionality, they significantly impact usability and professional appearance.

**Independent Test**: Can be fully tested by navigating to various screens and verifying that loading states, error states, empty states, and interactive components render consistently.

**Acceptance Scenarios**:

1. **Given** data is loading, **When** the user views a screen, **Then** they see a full-screen loading spinner
2. **Given** an error has occurred, **When** the user views the error screen, **Then** they see the error message and a retry button
3. **Given** no data is available, **When** the user views a list, **Then** they see an appropriate empty state placeholder

---

### Edge Cases

- What happens when the device loses network connectivity during login?
- How does the system handle token expiration while the user is actively using the app?
- What happens when a user's role changes on the backend after they've already logged in?
- How does the app behave when secure storage is unavailable or full?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `frappe-react-sdk` for API communication with automatic cookie-based session management
- **FR-002**: System MUST store login credentials (username/password) securely using expo-secure-store for session restoration
- **FR-003**: System MUST handle API error responses appropriately: 401 redirects to login, 403 shows access denied, 417 shows validation errors
- **FR-004**: System MUST provide an AuthContext that manages login state via `useFrappeAuth` hook throughout the application
- **FR-005**: System MUST route users to role-specific tab navigation based on their primary_role after calling get_session_info
- **FR-006**: System MUST provide three distinct tab layouts: Store Employee (Home/Farms/Orders/Profile), Farm Owner (Home/Gardens/Care Logs/Profile), and Investor (Home/Stores/Reports/Profile)
- **FR-007**: System MUST persist credentials securely and re-authenticate on app restart to restore sessions
- **FR-008**: System MUST provide a login screen that accepts username/email and password credentials
- **FR-009**: System MUST provide reusable UI components: LoadingScreen, ErrorScreen, EmptyState, Card, Badge, ListItem, and SearchBar
- **FR-010**: System MUST provide strongly-typed data models for all API response types and business entities
- **FR-011**: System MUST implement a two-step login flow: (1) POST /api/method/login, (2) POST get_session_info for roles/context

### Key Entities

- **User Session**: Represents an authenticated user including email, full name, roles array, primary role, API credentials, and role-specific context data (e.g., assigned stores)
- **API Response**: Standardized response wrapper containing success status, data payload, and error information
- **Distribution Store**: A store entity that store employees manage, containing store details and assignments
- **Farm Owner**: A user who owns farms and can track cultivation and care activities
- **Investor**: A user with read-only access to revenue data for assigned stores

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the login process in under 10 seconds on a standard mobile connection
- **SC-002**: Authentication state persists correctly across app restarts 100% of the time when tokens are valid
- **SC-003**: Role-based navigation displays the correct tabs for each user role with zero misroutes
- **SC-004**: API errors are handled gracefully with user-friendly messages, with 100% of 401/403/417 errors properly categorized
- **SC-005**: All shared UI components render consistently across different screen sizes and orientations
- **SC-006**: Token storage uses device secure storage mechanisms, never storing credentials in plain text

## Assumptions

- Users have Expo-compatible mobile devices (iOS 13+ or Android 8+)
- Users have stable internet connectivity for initial login (offline mode not in scope for Phase 0)
- The backend ESF API is available and returns responses in the documented format
- The app uses Expo framework with Expo Router for navigation
- expo-secure-store package is available for secure credential storage
- frappe-react-sdk is used for API communication with cookie-based session management
- The backend provides a custom `esf.api.auth.get_session_info` endpoint that returns user roles and primary_role for routing
- Frappe's built-in `/api/method/login` endpoint is used for initial authentication (via useFrappeAuth hook)
