# ESF Mobile App - Specification & Tasks

**Generated**: 2026-04-22
**Based on**: `esf_mobile_app_plan.md`
**Status Legend**: `[ ]` Todo | `[~]` In Progress | `[x]` Done

---

## Overview

| Role | Tabs | Key Features |
|------|------|--------------|
| **Store Employee** | Home, Farms, Orders, Profile | Dashboard, stock, sales orders, farm/garden management |
| **Farm Owner** | Home, Gardens, Care Logs, Profile | Dashboard, own farms/gardens, cultivation tracking |
| **Investor** | Home, Stores, Reports, Profile | Revenue dashboards, assigned stores (read-only) |

### Backend Dependencies

| Spec | Blocks | Status |
|------|--------|--------|
| SPEC-010 (Investor Assignment) | Investor Module | Not started |
| SPEC-011 (Farm Purchase Request) | Purchase flow (P2) | Not started |

---

## Phase 0: Foundation [COMPLETED]

### 0.1 API Client Setup
- [x] Install `expo-secure-store`, `axios`
- [x] Create `src/services/api/client.ts` - Base HTTP client with auth header
- [x] Create `src/types/api.ts` - API response types
- [x] Create `src/constants/api.ts` - Base URL config
- [x] Create `src/types/models/index.ts` - TypeScript interfaces for DocTypes
- [x] Handle errors: 401 → login, 403 → denied, 417 → validation

### 0.2 Authentication
| Task | File |
|------|------|
| [x] Secure token storage | `src/services/auth/tokenStorage.ts` |
| [x] Auth business logic | `src/services/auth/authService.ts` |
| [x] Auth state provider | `src/contexts/AuthContext.tsx` |
| [x] Auth hook | `src/hooks/useAuth.ts` |
| [x] Update root layout | `src/app/_layout.tsx` |
| [x] Connect login screen | `src/app/auth/login.tsx` |

**Login Response** (`POST /api/method/esf.api.auth.login`):
```json
{
  "user": "email@example.com",
  "full_name": "Name",
  "roles": ["ESF Store Manager"],
  "primary_role": "ESF Store Manager",
  "api_key": "...",
  "api_secret": "...",
  "context": { "stores": [...] }
}
```

### 0.3 Role-Based Navigation
| Task | File |
|------|------|
| [x] Store Employee tabs | `src/app/(store-employee)/_layout.tsx` |
| [x] Farm Owner tabs | `src/app/(farm-owner)/_layout.tsx` |
| [x] Investor tabs | `src/app/(investor)/_layout.tsx` |
| [x] Route by `primary_role` | `src/app/_layout.tsx` |

### 0.4 Shared UI Components
| Component | Purpose |
|-----------|---------|
| [x] `LoadingScreen` | Full screen spinner |
| [x] `ErrorScreen` | Error with retry |
| [x] `EmptyState` | No data placeholder |
| [x] `Card` | Reusable card container |
| [x] `Badge` | Status badges |
| [x] `ListItem` | Standard list row |
| [x] `SearchBar` | Search input |

---

## Phase 1A: Store Employee

### API Services
```
src/services/api/
├── store.ts              # getDashboard(), getStockLevels()
└── resources/
    ├── distributionStore.ts
    ├── farmOwner.ts
    ├── farm.ts
    ├── garden.ts
    ├── cultivationLog.ts
    ├── careLog.ts
    ├── salesOrder.ts
    └── deliveryNote.ts
```

### Screens

| # | Screen | Endpoint | Tasks |
|---|--------|----------|-------|
| 2.1 | [ ] Dashboard | `esf.api.store.get_dashboard` | Store cards, recent care logs, pull-to-refresh |
| 2.2 | [ ] Store Detail | `GET /api/resource/Distribution Store/<id>` | Store info, quick stats, nav buttons |
| 2.3 | [ ] Stock Levels | `esf.api.store.get_stock_levels` | Item list, search, filter, infinite scroll |
| 2.4 | [ ] Farm Owners List | `GET /api/resource/Farm Owner` | List, search |
| 2.5 | [ ] Farm Owner Detail | `GET /api/resource/Farm Owner/<id>` | Info, farms list, contact actions |
| 2.6 | [ ] Farm Detail | `GET /api/resource/Farm/<id>` | Info, gardens list |
| 2.7 | [ ] Garden Detail | `GET /api/resource/Garden/<id>` | Info, map, cultivation logs |
| 2.8 | [ ] Cultivation Logs | `GET /api/resource/Cultivation Log` | List, filter by garden/status |
| 2.9 | [ ] Cultivation Detail | `GET /api/resource/Cultivation Log/<id>` | Info, care logs list |
| 2.10 | [ ] Care Logs | `GET /api/resource/Care Log` | List, filter by date/garden |
| 2.11 | [ ] Care Log Detail | `GET /api/resource/Care Log/<id>` | Info, items used |
| 2.12 | [ ] Sales Orders | `GET /api/resource/Sales Order?filters=[["custom_distribution_store","=","<store>"]]` | List, filter, search |
| 2.13 | [ ] Order Detail | `GET /api/resource/Sales Order/<id>` | Header, items, totals |
| 2.14 | [ ] Delivery Notes | `GET /api/resource/Delivery Note?filters=[...]` | List |
| 2.15 | [ ] Profile | — | User info, stores, logout |

---

## Phase 1B: Farm Owner

### API Services
```
src/services/api/farmOwner.ts
  - getDashboard()
  - getMyFarmOwner()
```

### Screens

| # | Screen | Endpoint | Tasks |
|---|--------|----------|-------|
| 3.1 | [ ] Dashboard | `esf.api.farm_owner.get_dashboard` | Farm cards, recent care logs, stats |
| 3.2 | [ ] Profile | `esf.api.farm_owner.get_my_farm_owner` | Personal info |
| 3.3 | [ ] My Farms | `GET /api/resource/Farm` | List owned farms |
| 3.4 | [ ] Farm Detail | `GET /api/resource/Farm/<id>` | Info, gardens, store info |
| 3.5 | [ ] Garden Detail | `GET /api/resource/Garden/<id>` | Info, cultivation history |
| 3.6 | [ ] Cultivation Logs | `GET /api/resource/Cultivation Log` | List, filter |
| 3.7 | [ ] Cultivation Detail | `GET /api/resource/Cultivation Log/<id>` | Info, care logs |
| 3.8 | [ ] Care Logs | `GET /api/resource/Care Log` | List, filter |
| 3.9 | [ ] Care Log Detail | `GET /api/resource/Care Log/<id>` | Info, items |

---

## Phase 1C: Investor

> **BLOCKED**: Requires SPEC-010 (Investor Assignment) on backend

### API Services
```
src/services/api/investor.ts
  - getDashboard(period)
  - getRevenueDetail(store, period)
  - getAssignedStores()
  - getFarmOwners(filters)
```

### Screens

| # | Screen | Endpoint | Tasks |
|---|--------|----------|-------|
| 4.1 | [ ] Dashboard | `esf.api.investor.get_dashboard` | Revenue summary, trend chart, period filter |
| 4.2 | [ ] Assigned Stores | `esf.api.investor.get_assigned_stores` | Store list |
| 4.3 | [ ] Store Revenue | `esf.api.investor.get_revenue_detail` | Revenue breakdown, orders |
| 4.4 | [ ] Farm Owners | `esf.api.investor.get_farm_owners` | List by store |
| 4.5 | [ ] Reports | — | Charts, date picker |
| 4.6 | [ ] Profile | — | Info, logout |

---

## Phase 2A: CRUD Operations

### Form Components
- [ ] `GardenForm.tsx`
- [ ] `CultivationLogForm.tsx`
- [ ] `CareLogForm.tsx` (with items child table)
- [ ] `SalesOrderForm.tsx`
- [ ] Picker components (Cultivation Master, Items, UOMs)

### Store Employee CRUD
- [ ] Create/Edit Garden
- [ ] Create/Edit Cultivation Log
- [ ] Create/Edit Care Log (own only)
- [ ] Create Sales Order + Submit
- [ ] Create Delivery Note from SO

### Farm Owner CRUD
- [ ] Create/Edit Garden (own)
- [ ] Create/Edit Cultivation Log (own)
- [ ] Create/Edit Care Log (own)

---

## Phase 2B: Purchase Request

> **BLOCKED**: Requires SPEC-011 (Farm Purchase Request) on backend

- [ ] `createPurchaseRequest(farm, items, notes)` API
- [ ] `getNearestStore(lat, lng)` API
- [ ] My Requests screen
- [ ] Create Request form with GPS

---

## Phase 2C: File Upload

- [ ] Install `expo-image-picker`
- [ ] `src/services/api/upload.ts`
- [ ] `ImagePicker` + `ImageGallery` components
- [ ] Attach images to Care Log / Cultivation Log

---

## File Structure

```
src/
├── app/
│   ├── _layout.tsx              # Root - auth check & role routing
│   ├── index.tsx                # Splash
│   ├── auth/login.tsx
│   ├── (store-employee)/
│   │   ├── _layout.tsx          # Tabs: Home, Farms, Orders, Profile
│   │   ├── home/index.tsx       # Dashboard
│   │   ├── home/store/[id].tsx
│   │   ├── home/store/[id]/stock.tsx
│   │   ├── farms/index.tsx      # Farm Owners
│   │   ├── farms/owner/[id].tsx
│   │   ├── farms/farm/[id].tsx
│   │   ├── farms/garden/[id].tsx
│   │   ├── farms/cultivations/[index|id].tsx
│   │   ├── farms/care-logs/[index|id].tsx
│   │   ├── orders/[index|id].tsx
│   │   ├── orders/deliveries/[index|id].tsx
│   │   └── profile/index.tsx
│   ├── (farm-owner)/
│   │   ├── _layout.tsx          # Tabs: Home, Gardens, Care, Profile
│   │   ├── home/index.tsx
│   │   ├── gardens/[index|farm/[id]|garden/[id]].tsx
│   │   ├── care/[index|[id]|cultivations/*].tsx
│   │   └── profile/index.tsx
│   └── (investor)/
│       ├── _layout.tsx          # Tabs: Home, Stores, Reports, Profile
│       ├── home/index.tsx
│       ├── stores/[index|[id]].tsx
│       ├── reports/index.tsx
│       └── profile/index.tsx
├── components/
│   ├── ui/                      # Shared UI
│   ├── forms/                   # Form components (P2)
│   └── [role]/                  # Role-specific components
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── store.ts
│   │   ├── farmOwner.ts
│   │   ├── investor.ts
│   │   └── resources/*.ts
│   ├── auth/
│   │   ├── authService.ts
│   │   └── tokenStorage.ts
│   └── storage.ts
├── contexts/AuthContext.tsx
├── hooks/[useAuth|useApi|useDashboard].ts
├── constants/[theme|api].ts
└── types/[api|auth|models/*].ts
```

---

## API Quick Reference

### Custom Endpoints
```
POST /api/method/esf.api.auth.login
POST /api/method/esf.api.auth.get_session_info
POST /api/method/esf.api.store.get_dashboard
POST /api/method/esf.api.store.get_stock_levels
POST /api/method/esf.api.farm_owner.get_dashboard
POST /api/method/esf.api.farm_owner.get_my_farm_owner
POST /api/method/esf.api.investor.get_dashboard
POST /api/method/esf.api.investor.get_revenue_detail
POST /api/method/esf.api.investor.get_assigned_stores
POST /api/method/esf.api.investor.get_farm_owners
```

### Standard REST
```
GET    /api/resource/<DocType>              # List (with filters, fields, pagination)
GET    /api/resource/<DocType>/<name>       # Get single
POST   /api/resource/<DocType>              # Create
PUT    /api/resource/<DocType>/<name>       # Update
DELETE /api/resource/<DocType>/<name>       # Delete

Pagination: limit_start, limit_page_length, order_by, fields, filters
```

### DocTypes
Distribution Store, Farm Owner, Farm, Garden, Cultivation Master, Cultivation Log, Care Log, Sales Order, Delivery Note, Item, Customer, UOM

---

## Task Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 0: Foundation | 20 | COMPLETED |
| Phase 1A: Store Employee | 25 | Not started |
| Phase 1B: Farm Owner | 12 | Not started |
| Phase 1C: Investor | 10 | Blocked (SPEC-010) |
| Phase 2A: CRUD | 15 | Not started |
| Phase 2B: Purchase | 5 | Blocked (SPEC-011) |
| Phase 2C: File Upload | 8 | Not started |
| **Total** | **~95** | |
