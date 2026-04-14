# Loading & Auth Flow

## Architecture

```
src/index.tsx (Root Entry Point)
    ↓
AuthProvider (AuthContext)
    ├─ Restores user session from AsyncStorage
    ├─ Shows loading state during restore
    └─ Provides auth functions (login, logout, register)
        ↓
    _layout.tsx (RootLayout)
        ├─ Checks isLoading from AuthProvider
        ├─ While loading → Shows AnimatedSplashOverlay
        ├─ Once loaded:
        │   ├─ If isLoggedIn → Shows App Stack (Tabs)
        │   └─ If NOT isLoggedIn → Shows Auth Stack (Login, etc)
        └─ Wraps content with ThemeProvider
```

## Flow Diagram

```
App Start
    ↓
AuthProvider initializes
    ↓
restoreToken() called
    ├─ Checks AsyncStorage for stored user
    ├─ Sets isLoading = true
    └─ Sets isLoading = false when done
        ↓
RootLayout checks isLoading
    ├─ While isLoading → Show Splash Screen
    └─ Once loaded → Check isLoggedIn
        ├─ true → Show Tabs (Home, Explore, Profile)
        └─ false → Show Login Screen
```

## How to Test

### Test 1: First Time User (No stored session)
1. Install app fresh
2. App should show splash screen for ~1 second
3. Then redirect to Login screen
4. Login with: `admin` / `123`
5. After login, should see Home screen (Tabs)

### Test 2: Return User (Has stored session)
1. Login once (user session stored in AsyncStorage)
2. Close and reopen app
3. App should show splash screen for ~1 second
4. Then directly show Home screen (because user session is restored)
5. Click Logout → Back to Login screen

## Key Files

- `src/index.tsx` - App entry point
- `src/app/_layout.tsx` - Root layout with conditional navigation
- `src/navigation/AuthContext.tsx` - Auth state management & persistence
- `src/app/auth/login.tsx` - Login screen
- `src/app/(tabs)/index.tsx` - Home screen (with logout button)

## Implementation Details

### Stored Data (AsyncStorage)
```json
{
  "key": "user",
  "value": {
    "id": "1",
    "email": "admin",
    "name": "Admin User"
  }
}
```

When user logs out, this entry is deleted.

### Auth State Flow

1. **Initial State**
   - `isLoading: true`
   - `isLoggedIn: false`
   - `user: null`

2. **After restoreToken()**
   - If session found: `isLoggedIn: true`, `user: <restored>`
   - If no session: `isLoggedIn: false`, `user: null`
   - `isLoading: false`

3. **After Login**
   - `isLoggedIn: true`
   - `user: <new_user>`
   - Saved to AsyncStorage

4. **After Logout**
   - `isLoggedIn: false`
   - `user: null`
   - Removed from AsyncStorage
