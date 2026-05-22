# Quickstart: Phase 0 Foundation

**Date**: 2026-04-23
**Feature**: Phase 0 Foundation - Getting Started Guide

## Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator
- Access to ESF backend API

## Setup

### 1. Clone and Install

```bash
cd SmartFarm-dev
npm install
```

### 2. Configure API Endpoint

Edit `src/constants/api.ts`:

```typescript
// Development
export const API_BASE_URL = 'https://your-dev-instance.frappe.cloud';

// Production
// export const API_BASE_URL = 'https://esf.example.com';
```

### 3. Start Development Server

```bash
# Start Expo development server
npm start

# Or start for specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## Project Structure Overview

```
src/
├── app/                  # Screens (Expo Router)
│   ├── _layout.tsx       # Root with auth routing
│   ├── auth/login.tsx    # Login screen
│   ├── (store-employee)/ # Store employee screens
│   ├── (farm-owner)/     # Farm owner screens
│   └── (investor)/       # Investor screens
├── components/ui/        # Shared UI components
├── contexts/             # React contexts (Auth)
├── hooks/                # Custom hooks
├── services/
│   ├── api/              # API client & resources
│   └── auth/             # Authentication logic
├── constants/            # App configuration
└── types/                # TypeScript definitions
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/api/client.ts` | Base HTTP client with auth injection |
| `src/services/auth/authService.ts` | Login/logout/session management |
| `src/services/auth/tokenStorage.ts` | Secure credential storage |
| `src/contexts/AuthContext.tsx` | Auth state provider |
| `src/app/_layout.tsx` | Root layout with role-based routing |

## Authentication Flow

```
App Start
    │
    ▼
┌─────────────────┐
│ Check stored    │
│ credentials     │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────┼────┐
   No   Yes
    │    │
    ▼    ▼
Login  ┌─────────────┐
Screen │ Get primary │
    │  │ role        │
    │  └──────┬──────┘
    │         │
    ▼         ▼
    └────► Role-Based
           Dashboard
```

## Adding a New Screen

1. Create file in appropriate route group:
   ```
   src/app/(store-employee)/farms/new-screen.tsx
   ```

2. Use standard screen template:
   ```tsx
   import { View, Text } from 'react-native';
   import { ScreenContainer } from '@/components/ui';

   export default function NewScreen() {
     return (
       <ScreenContainer>
         <Text>New Screen</Text>
       </ScreenContainer>
     );
   }
   ```

3. Screen is automatically available at `/farms/new-screen`

## Making API Calls

```typescript
import { getList, getDoc, callMethod } from '@/services/api/client';
import type { Farm } from '@/types/models';

// List with filters
const farms = await getList<Farm>('Farm', {
  filters: [['status', '=', 'Active']],
  fields: ['name', 'farm_name', 'farm_owner'],
  limit_page_length: 20
});

// Get single document
const farm = await getDoc<Farm>('Farm', 'FARM-001');

// Call custom endpoint
const dashboard = await callMethod('esf.api.store.get_dashboard', {
  store: 'STORE-001'
});
```

## Using UI Components

```tsx
import {
  LoadingScreen,
  ErrorScreen,
  EmptyState,
  Card,
  Badge,
  ListItem,
  SearchBar
} from '@/components/ui';

// Loading state
if (isLoading) return <LoadingScreen />;

// Error state
if (error) return <ErrorScreen error={error} onRetry={refetch} />;

// Empty state
if (data.length === 0) return <EmptyState message="No farms found" />;

// List with components
return (
  <View>
    <SearchBar value={search} onChangeText={setSearch} />
    {data.map(item => (
      <Card key={item.name}>
        <ListItem
          title={item.farm_name}
          subtitle={item.status}
          onPress={() => navigate(item.name)}
        />
        <Badge status={item.status} />
      </Card>
    ))}
  </View>
);
```

## Testing Login

Use these test credentials (adjust for your backend):

| Role | Email | Notes |
|------|-------|-------|
| Store Employee | store@example.com | Manages store operations |
| Farm Owner | farmer@example.com | Owns farms and gardens |
| Investor | investor@example.com | View-only access |

## Troubleshooting

### "Network Error" on Login
- Check API_BASE_URL is correct
- Verify backend is running
- Check device/emulator has network access

### "401 Unauthorized" After Login
- Tokens may have expired
- Clear app data and re-login
- Check token storage is working

### Screens Not Updating
- Check AuthContext is wrapping app
- Verify useAuth hook is imported correctly
- Check role-based routing in _layout.tsx

## Next Steps

After Phase 0 is complete:
- Phase 1A: Store Employee screens
- Phase 1B: Farm Owner screens
- Phase 1C: Investor screens (blocked on SPEC-010)
