# Implementation Plan: Phase 1 — Feature Screens

**Branch**: `002-phase1-features` | **Date**: 2026-06-14
**References**: `esf_mobile_app_plan.md`, `specs/001-phase0-foundation/`, `INTEGRATION_GUIDE.md`

---

## 1. Architecture Overview

### 1.1 Current Structure (Unified `(main)` Group)

The app uses a single unified tab group `(main)` with 3 tabs: **Home**, **Menu**, **Profile**.
All feature screens live inside the Menu stack, gated by role.

```
src/app/
├── _layout.tsx              # Root: auth guard → redirect to /auth/login or /(main)
├── index.tsx                # Splash: redirects immediately
├── auth/
│   └── login.tsx            # Login screen (starting point)
└── (main)/
    ├── _layout.tsx           # Tab navigator: Home | Menu | Profile
    ├── home/
    │   └── index.tsx         # Newsfeed (all roles)
    ├── menu/
    │   ├── _layout.tsx       # Stack navigator for all feature screens
    │   ├── index.tsx         # Menu tile grid (role-gated)
    │   ├── orders/           ✅ Built
    │   ├── farms/            ✅ Built
    │   ├── gardens/          ✅ Built
    │   ├── care-logs/        ✅ Built
    │   ├── farm-owners/      ✅ Built
    │   └── stores/           ✅ Built
    └── profile/
        └── index.tsx         # Profile + logout
```

### 1.2 Navigation Flow

```
Login → /(main)/home (Newsfeed)
             ↓ Tab: Menu
        /(main)/menu (Tile grid, role-gated)
             ↓ Tap tile
        /(main)/menu/<feature>/index (List)
             ↓ Tap item
        /(main)/menu/<feature>/[name] (Detail)
```

### 1.3 Role → Menu Tiles Mapping

| Tile | Store Employee | Farm Owner | Investor |
|------|:-:|:-:|:-:|
| Farms | ✅ route | ✅ route | — |
| Gardens | — | ✅ route | — |
| Orders | ✅ route | — | — |
| Care Logs | ✅ route | ✅ route | — |
| Farm Owners | ✅ route | — | ✅ route |
| Stores | — | — | ✅ route |
| Cultivation Logs | — | ➕ needed | — |
| Inventory/Stock | ✅ (P2) | — | — |
| Reports | ✅ (P2) | — | ✅ (P2) |
| Purchase Requests | — | ✅ (P2) | — |
| Revenue | — | — | ✅ (P2) |

---

## 2. Current State vs API Plan

### 2.1 What Is Built (Phase 0 Output)

| Screen | File | API Used | Status |
|--------|------|----------|--------|
| Login | `auth/login.tsx` | `esf.api.auth.login` | ✅ Done |
| Home / Newsfeed | `(main)/home/index.tsx` | Mock data | ✅ Done (mock) |
| Menu tile grid | `(main)/menu/index.tsx` | Local role check | ✅ Done |
| Farms list | `menu/farms/index.tsx` | `GET /api/resource/Farm` | ✅ Done |
| Farm detail | `menu/farms/[name].tsx` | Farm + Gardens (parallel) | ✅ Done |
| Gardens list | `menu/gardens/index.tsx` | `GET /api/resource/Garden` | ✅ Done |
| Garden detail | `menu/gardens/[name].tsx` | `GET /api/resource/Garden/<name>` | ✅ Done |
| Care Logs list | `menu/care-logs/index.tsx` | `GET /api/resource/Care Log` | ✅ Done |
| Care Log detail | `menu/care-logs/[name].tsx` | `GET /api/resource/Care Log/<name>` | ✅ Done |
| Farm Owners list | `menu/farm-owners/index.tsx` | `GET /api/resource/Farm Owner` | ✅ Done |
| Farm Owner detail | `menu/farm-owners/[name].tsx` | FarmOwner + Farms (parallel) | ✅ Done |
| Stores list | `menu/stores/index.tsx` | `GET /api/resource/Distribution Store` | ✅ Done |
| Store detail | `menu/stores/[name].tsx` | `GET /api/resource/Distribution Store/<name>` | ✅ Done |
| Orders list | `menu/orders/index.tsx` | `GET /api/resource/Sales Order` | ✅ Done |
| Order detail | `menu/orders/[name].tsx` | `GET /api/resource/Sales Order/<name>` | ✅ Done |
| Profile | `(main)/profile/index.tsx` | Session info | ✅ Done |

### 2.2 What Is Missing (Phase 1 Remaining)

| Screen | File (to create) | API Required | Priority |
|--------|-----------------|--------------|----------|
| Store Employee Dashboard | Replace `home/index.tsx` mock | `esf.api.store.get_dashboard` | HIGH |
| Farm Owner Dashboard | Same (role-conditional) | `esf.api.farm_owner.get_dashboard` | HIGH |
| Investor Dashboard | Same (role-conditional) | `esf.api.investor.get_dashboard` | HIGH |
| Cultivation Logs list | `menu/cultivation-logs/index.tsx` | `GET /api/resource/Cultivation Log` | HIGH |
| Cultivation Log detail | `menu/cultivation-logs/[name].tsx` | `GET /api/resource/Cultivation Log/<name>` | HIGH |
| Delivery Notes list | `menu/delivery-notes/index.tsx` | `GET /api/resource/Delivery Note` | MED |
| Delivery Note detail | `menu/delivery-notes/[name].tsx` | `GET /api/resource/Delivery Note/<name>` | MED |
| Stock Levels | `menu/stock/index.tsx` | `esf.api.store.get_stock_levels` | MED |
| Investor Revenue | `menu/revenue/index.tsx` | `esf.api.investor.get_revenue_detail` | MED |
| Investor Revenue Detail | `menu/revenue/[store].tsx` | `esf.api.investor.get_revenue_detail` | MED |

### 2.3 Phase 2 (Deferred — CRUD)

| Feature | Requires | Phase |
|---------|----------|-------|
| Create/Edit Garden | Form screen | P2 |
| Create/Edit Care Log | Form screen + item picker | P2 |
| Create/Edit Cultivation Log | Form screen | P2 |
| Create Sales Order | Form + item search | P2 |
| Create Delivery Note from SO | ERPNext method | P2 |
| Purchase Request | SPEC-011 DocType | P2 |
| Nearest Store GPS | `get_nearest_store` endpoint | P2 |
| File upload (photos) | `/api/method/upload_file` | P2 |

---

## 3. Screen Architecture

### 3.1 Home Screen — Role-Conditional Dashboard

The current newsfeed mock should be replaced with a role-conditional dashboard.

**Dashboard layout per role**:

#### Store Employee (`esf.api.store.get_dashboard`)
```
┌─────────────────────────────────┐
│  Header: SmartFarm + notifications │
├─────────────────────────────────┤
│  Greeting: "Xin chào, {name}"   │
│  Store: {store_name}            │
├─────────────────────────────────┤
│  Stats row (4 cards):           │
│  [Farms] [Gardens] [Cultivations] [Farm Owners] │
├─────────────────────────────────┤
│  Recent Care Logs (last 5)      │
│  → tap: navigate to care log detail │
└─────────────────────────────────┘
```

#### Farm Owner (`esf.api.farm_owner.get_dashboard`)
```
┌─────────────────────────────────┐
│  Header: SmartFarm              │
├─────────────────────────────────┤
│  Profile card: {owner_name}     │
├─────────────────────────────────┤
│  Stats row: [Farms] [Gardens] [Active Cultivations] │
├─────────────────────────────────┤
│  My Farms (list, tap → detail)  │
├─────────────────────────────────┤
│  Recent Care Logs               │
└─────────────────────────────────┘
```

#### Investor (`esf.api.investor.get_dashboard`)
```
┌─────────────────────────────────┐
│  Header: SmartFarm + period picker │
├─────────────────────────────────┤
│  Total revenue card             │
├─────────────────────────────────┤
│  Stats: [Orders] [Farms] [Gardens] │
├─────────────────────────────────┤
│  Stores list with per-store revenue │
│  → tap: navigate to revenue detail  │
└─────────────────────────────────┘
```

### 3.2 Cultivation Logs (New Screens)

**For Farm Owner** (added to `farmOwnerItems` in `menu/index.tsx`):
```
key: 'cultivationLogs'
icon: 'leaf-outline'
route: '/(main)/menu/cultivation-logs'
```

**List screen** (`cultivation-logs/index.tsx`):
- Fields: `name`, `garden`, `garden_name`, `cultivation_master`, `cultivation_type`, `from_date`, `to_date`, `status`
- Status badge: In Progress=blue, Completed=green, Cancelled=gray
- Filter: search by garden name or cultivation type

**Detail screen** (`cultivation-logs/[name].tsx`):
- Full cultivation log info
- Garden link → navigate to garden detail
- Status badge
- Dates: from, to, expected harvest
- Notes
- Metadata (owner, creation)

### 3.3 Delivery Notes (New Screens — Store Employee)

Added to `storeEmployeeItems` in `menu/index.tsx`:
```
key: 'deliveryNotes'
icon: 'car-outline'
color: '#4CAF50'
route: '/(main)/menu/delivery-notes'
```

**List screen** (`delivery-notes/index.tsx`):
- Fields: `name`, `customer_name`, `grand_total`, `status`, `posting_date`
- Filter by `custom_distribution_store`
- Status badge: Draft=gray, To Bill=orange, Completed=green, Cancelled=red

**Detail screen** (`delivery-notes/[name].tsx`):
- Header: customer name
- Status badge + posting date
- Items table (item_name, qty, rate, amount)
- Total/grand total
- Metadata

### 3.4 Stock Levels (New Screen — Store Employee)

Added to `storeEmployeeItems`:
```
key: 'inventory'
route: '/(main)/menu/stock'
```

**Screen** (`stock/index.tsx`):
- Requires store context from auth
- Calls `esf.api.store.get_stock_levels` with `distribution_store`
- Group by `item_group` (expandable sections)
- Search by item name/code
- Show `actual_qty` + `uom` per item
- Item image (if available)

### 3.5 Investor Revenue (New Screens)

Added to `investorItems`:
```
key: 'revenue'
route: '/(main)/menu/revenue'
```

**List screen** (`revenue/index.tsx`):
- Calls `esf.api.investor.get_assigned_stores` to get stores list
- Calls `esf.api.investor.get_revenue_detail` per store (or dashboard for summary)
- Shows per-store revenue cards with order count

**Detail screen** (`revenue/[store].tsx`):
- Calls `esf.api.investor.get_revenue_detail` with `distribution_store`
- Period picker: This Month / Last Month / This Quarter / This Year
- Revenue total card
- Revenue by item group (bar chart or list)
- Orders list (recent, tap → order detail)

---

## 4. API Service Layer — What Needs to Be Added

### 4.1 Missing Resource Services

```
src/services/api/resources/
├── careLog.ts             ✅ exists
├── cultivationLog.ts      ✅ exists
├── deliveryNote.ts        ✅ exists
├── distributionStore.ts   ✅ exists
├── farm.ts               ✅ exists
├── farmOwner.ts          ✅ exists
├── garden.ts             ✅ exists
├── salesOrder.ts         ✅ exists
└── index.ts              ✅ exists
```

All standard REST resource services exist. Need to add **custom RPC services**:

### 4.2 Custom RPC Services (to create)

**`src/services/api/rpc/store.ts`**:
```ts
export async function getDashboard(): Promise<StoreDashboard>
export async function getStockLevels(params: StockLevelParams): Promise<StockLevelResult>
```

**`src/services/api/rpc/farmOwner.ts`**:
```ts
export async function getDashboard(): Promise<FarmOwnerDashboard>
export async function getMyFarmOwner(): Promise<FarmOwner>
```

**`src/services/api/rpc/investor.ts`**:
```ts
export async function getDashboard(params?: PeriodParams): Promise<InvestorDashboard>
export async function getRevenueDetail(store: string, params?: PeriodParams): Promise<RevenueDetail>
export async function getAssignedStores(): Promise<{ stores: AssignedStore[] }>
export async function getFarmOwners(params?: PaginationParams): Promise<FarmOwnerListResult>
```

### 4.3 New Type Definitions (to add to `types/models/index.ts`)

```ts
// Dashboard types
interface StoreDashboardStore { name, store_name, warehouse, farm_count, garden_count, active_cultivation_count, farm_owner_count }
interface StoreDashboard { stores: StoreDashboardStore[], recent_care_logs: RecentCareLog[] }
interface FarmDashboardItem { name, farm_name, distribution_store, store_name, status, garden_count, active_cultivation_count }
interface FarmOwnerDashboard { farm_owner: FarmOwner, farms: FarmDashboardItem[], recent_care_logs: RecentCareLog[], total_gardens: number, active_cultivations: number }
interface InvestorStoreRevenue { name, store_name, total_revenue, order_count, farm_count, garden_count }
interface InvestorDashboard { stores: InvestorStoreRevenue[], total_revenue, total_orders, total_farms, total_gardens, revenue_trend: { month, revenue }[] }
interface RevenueDetail { distribution_store, store_name, total_revenue, orders: SalesOrder[], revenue_by_item_group: { item_group, total }[] }
interface StockItem { item_code, item_name, item_group, custom_usage_type, actual_qty, uom, image }
interface StockLevelResult { warehouse, items: StockItem[], total_count }
```

---

## 5. Menu Index Updates

Current `menu/index.tsx` needs these additions:

### Store Employee — add:
```ts
{ key: 'cultivationLogs', icon: 'leaf-outline', color: '#4CAF50', bg: '#F1F8E9', label: t('menu.cultivationLogs'), route: '/(main)/menu/cultivation-logs' },
{ key: 'deliveryNotes', icon: 'car-outline', color: '#4CAF50', bg: '#E8F5E9', label: t('menu.deliveryNotes'), route: '/(main)/menu/delivery-notes' },
// inventory: update route from '' to '/(main)/menu/stock'
```

### Farm Owner — add:
```ts
{ key: 'cultivationLogs', icon: 'leaf-outline', color: '#4CAF50', bg: '#F1F8E9', label: t('menu.cultivationLogs'), route: '/(main)/menu/cultivation-logs' },
```

### Investor — update:
```ts
// revenue: update route from '' to '/(main)/menu/revenue'
```

---

## 6. Translation Keys Needed

Add to `src/i18n/locales/en.json` and `vi.json`:

```json
{
  "menu": {
    "cultivationLogs": "Cultivation Logs",
    "deliveryNotes": "Delivery Notes",
    "stock": "Inventory",
    "revenue": "Revenue"
  },
  "cultivationLogs": {
    "title": "Cultivation Logs",
    "notFound": "No cultivation logs found",
    "status": {
      "inProgress": "In Progress",
      "completed": "Completed",
      "cancelled": "Cancelled"
    },
    "fromDate": "Start Date",
    "toDate": "End Date",
    "expectedHarvest": "Expected Harvest",
    "cultivationType": "Type"
  },
  "deliveryNotes": {
    "title": "Delivery Notes",
    "notFound": "No delivery notes found",
    "postingDate": "Posting Date"
  },
  "stock": {
    "title": "Inventory",
    "availableQty": "Available",
    "noItems": "No items in stock"
  },
  "revenue": {
    "title": "Revenue",
    "totalRevenue": "Total Revenue",
    "orderCount": "Orders",
    "byItemGroup": "By Category",
    "period": {
      "thisMonth": "This Month",
      "lastMonth": "Last Month",
      "thisQuarter": "This Quarter",
      "thisYear": "This Year"
    }
  },
  "dashboard": {
    "farms": "Farms",
    "gardens": "Gardens",
    "activeCultivations": "Active",
    "farmOwners": "Farm Owners",
    "recentCareLogs": "Recent Care Logs",
    "viewAll": "View All"
  }
}
```

---

## 7. Implementation Task Order

### Sprint 1 — Dashboards (highest value, replaces mock home)

1. Add `StoreDashboard`, `FarmOwnerDashboard`, `InvestorDashboard` types
2. Create `src/services/api/rpc/` directory with `store.ts`, `farmOwner.ts`, `investor.ts`
3. Rewrite `home/index.tsx` → role-conditional dashboard using custom endpoints
4. Update translation files with `dashboard.*` keys

### Sprint 2 — Cultivation Logs

5. Create `menu/cultivation-logs/index.tsx` (list)
6. Create `menu/cultivation-logs/[name].tsx` (detail)
7. Update `menu/index.tsx` — add cultivation logs tile to Store Employee + Farm Owner
8. Update translation files with `cultivationLogs.*` keys

### Sprint 3 — Delivery Notes

9. Create `menu/delivery-notes/index.tsx` (list, filter by store)
10. Create `menu/delivery-notes/[name].tsx` (detail with items table)
11. Update `menu/index.tsx` — add delivery notes tile to Store Employee
12. Update translation files with `deliveryNotes.*` keys

### Sprint 4 — Stock Levels

13. Create `src/services/api/rpc/store.ts` — `getStockLevels()`
14. Create `menu/stock/index.tsx`
15. Update `menu/index.tsx` — activate inventory route for Store Employee
16. Update translation files with `stock.*` keys

### Sprint 5 — Investor Revenue

17. Create `src/services/api/rpc/investor.ts`
18. Create `menu/revenue/index.tsx` (per-store summary)
19. Create `menu/revenue/[store].tsx` (detail with period picker)
20. Update `menu/index.tsx` — activate revenue route for Investor
21. Update translation files with `revenue.*` keys

---

## 8. Investor Module Prerequisite

**Blocked by**: SPEC-010 (Investor Assignment DocType)

Until SPEC-010 is implemented on the backend:
- `esf.api.investor.get_dashboard` will return empty data
- `esf.api.investor.get_assigned_stores` will return `[]`
- `esf.api.investor.get_farm_owners` will return `[]`
- Investor Cultivation/Care Log views will be unfiltered (security risk)

**Mitigation**: Build investor screens against the agreed API contract. Test with mock data. Enable when SPEC-010 is deployed.

---

## 9. Complete File Tree (Target State)

```
src/app/(main)/menu/
├── index.tsx                    ✅ (update: add cultivation-logs, delivery-notes tiles)
├── orders/
│   ├── index.tsx                ✅
│   └── [name].tsx               ✅
├── farms/
│   ├── index.tsx                ✅
│   └── [name].tsx               ✅
├── gardens/
│   ├── index.tsx                ✅
│   └── [name].tsx               ✅
├── care-logs/
│   ├── index.tsx                ✅
│   └── [name].tsx               ✅
├── farm-owners/
│   ├── index.tsx                ✅
│   └── [name].tsx               ✅
├── stores/
│   ├── index.tsx                ✅
│   └── [name].tsx               ✅
├── cultivation-logs/            ➕ Sprint 2
│   ├── index.tsx
│   └── [name].tsx
├── delivery-notes/              ➕ Sprint 3
│   ├── index.tsx
│   └── [name].tsx
├── stock/                       ➕ Sprint 4
│   └── index.tsx
└── revenue/                     ➕ Sprint 5
    ├── index.tsx
    └── [store].tsx

src/services/api/
├── client.ts                    ✅
├── resources/
│   ├── careLog.ts               ✅
│   ├── cultivationLog.ts        ✅
│   ├── deliveryNote.ts          ✅
│   ├── distributionStore.ts     ✅
│   ├── farm.ts                  ✅
│   ├── farmOwner.ts             ✅
│   ├── garden.ts                ✅
│   ├── salesOrder.ts            ✅
│   └── index.ts                 ✅
└── rpc/                         ➕ Sprint 1
    ├── store.ts
    ├── farmOwner.ts
    ├── investor.ts
    └── index.ts

src/app/(main)/home/
└── index.tsx                    🔄 Sprint 1 (replace mock with dashboard)
```

---

## 10. Conventions to Follow

All new screens must follow the established pattern:

```tsx
// 1. useCallback loadData + useEffect
const loadData = useCallback(async () => {
  try {
    setLoading(true); setError(null);
    const result = await SomeAPI.list();
    setData(result);
  } catch { setError(t('common.errorLoadData')); }
  finally { setLoading(false); }
}, [t]);
useEffect(() => { loadData(); }, [loadData]);

// 2. Early returns for loading/error
if (loading) return <LoadingScreen message={t('common.loading')} />;
if (error) return <ErrorScreen message={error} onRetry={loadData} />;

// 3. Green header with back button + safe area insets
// 4. Status badges: Active=#059669, Inactive=#6B7280
//    SO status: Draft=gray, To Deliver=#D97706, Completed=#059669, Cancelled=#DC2626
//    Efficiency: ≥80%=#059669, ≥50%=#D97706, <50%=#DC2626
//    CultivationLog: In Progress=#2563EB, Completed=#059669, Cancelled=#6B7280
// 5. settingApp.green_primery for header background
// 6. keyExtractor={item => item.name} (Frappe doc name)
// 7. encodeURIComponent(item.name) for route params
// 8. decodeURIComponent(name) on detail screen
```
