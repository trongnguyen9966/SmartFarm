# Implementation Plan: Phase 1 — Feature Screens

**Branch**: `001-phase0-foundation` (current) → `002-phase1-features` (next)
**Last Updated**: 2026-06-14
**References**: `esf_mobile_app_plan.md`, `MOBILE_APP_SPEC.md`, `specs/001-phase0-foundation/`

---

## 1. Architecture — Current Structure

### 1.1 App Layout (Unified `(main)` Group)

The app uses a **single unified tab group** `(main)` with 3 tabs for all roles.
Feature screens live in the Menu stack, gated by `sessionInfo.primary_role` via `useFeatures()`.

> Note: Original spec described separate `(store-employee)`, `(farm-owner)`, `(investor)` tab groups.
> The current implementation uses a unified `(main)` group — this is the correct structure going forward.

```
src/app/
├── _layout.tsx              # Root: FrappeProvider + AuthProvider + Stack
├── index.tsx                # Splash: animates while isRestoringSession=true
├── auth/
│   └── login.tsx            # Login screen
└── (main)/
    ├── _layout.tsx           # Tab navigator: Home | Menu | Profile
    ├── home/
    │   └── index.tsx         # Quick menu tiles + Newsfeed (mock) — needs real dashboard
    ├── menu/
    │   ├── _layout.tsx       # Stack navigator for all feature screens
    │   ├── index.tsx         # Menu tile grid (role-gated via useFeatures)
    │   ├── quick-menu-settings.tsx  # Toggle up to 4 quick tiles
    │   ├── farms/            ✅ list + detail
    │   ├── gardens/          ✅ list + detail
    │   ├── care-logs/        ✅ list + detail
    │   ├── farm-owners/      ✅ list + detail
    │   ├── stores/           ✅ list + detail
    │   └── orders/           ✅ list + detail
    └── profile/
        └── index.tsx         # Profile, language selector, logout
```

### 1.2 Auth & Session Flow

```
App start
  └── isRestoringSession=true (AuthContext)
       ├── Load sessionInfo from AsyncStorage → setSessionInfo
       ├── Load credentials from SecureStore
       │    └── frappeLogin(username, password) → updateCurrentUser
       └── setIsRestoringSession(false)
            └── isLoading=false → splash navigates

Login
  └── frappeLogin → getUser → getSessionInfo (API)
       └── persistSessionInfo → AsyncStorage + React state

Logout
  └── frappeLogout → persistSessionInfo(null) → clearTokens → /auth/login
```

### 1.3 Permission & Menu Architecture

```
sessionInfo (from AsyncStorage or API)
  ├── primary_role   → role badge, default quick menu, home dashboard type
  ├── roles[]        → ROLE_FEATURES map → feature key list
  └── permissions{}  → DocType read gate (optional, fallback to roles)

useFeatures() → string[]     (hook: derived from sessionInfo)
useQuickMenu()               (hook: AsyncStorage per-user, max 4 tiles)
usePrimaryRole()             (hook: sessionInfo.primary_role)
```

**Role → Feature mapping** (`src/constants/api.ts`):

| Feature key | Store Employee | Farm Owner | Investor |
|-------------|:-:|:-:|:-:|
| `farms` | ✅ | — | — |
| `myFarms` | — | ✅ | — |
| `orders` | ✅ | — | — |
| `farmOwners` | ✅ | — | ✅ |
| `careLogs` | ✅ | ✅ | — |
| `gardens` | — | ✅ | — |
| `stores` | — | — | ✅ |
| `deliveryNotes` | ✅ | — | — |
| `inventory` | ✅ | — | — |
| `cultivationLogs` | — | ✅ | — |
| `purchaseRequests` | — | ✅ | — |
| `revenue` | — | — | ✅ |
| `reports` | ✅ | — | ✅ |

---

## 2. Current State — What Is Built

### 2.1 Foundation (Phase 0) — COMPLETE

| Area | Files | Status |
|------|-------|--------|
| Auth (login, logout, session restore) | `AuthContext.tsx`, `tokenStorage.ts` | ✅ |
| Session persistence (AsyncStorage) | `tokenStorage.ts` — `saveSessionInfo/getSessionInfo/clearSessionInfo` | ✅ |
| Loading state on app restore | `isRestoringSession` in AuthContext | ✅ |
| Permission-based menu | `useFeatures()`, `usePermission.ts`, `constants/api.ts` | ✅ |
| Quick menu (4 tiles, user-customizable) | `useQuickMenu.ts`, `constants/quickMenu.ts`, `quick-menu-settings.tsx` | ✅ |
| Language selector (login + profile) | `LanguageSelector.tsx` (variant=icon/listItem) | ✅ |
| i18n (vi/en/zh) | `src/i18n/locales/` — terminology: Vườn/Chủ vườn/Khu vườn | ✅ |
| Splash screen with session wait | `index.tsx` — waits for `isLoading=false` | ✅ |

### 2.2 Feature Screens — Built

| Screen | File | API | Status |
|--------|------|-----|--------|
| Farms list | `menu/farms/index.tsx` | `GET /api/resource/Farm` | ✅ |
| Farm detail | `menu/farms/[name].tsx` | Farm + Gardens parallel | ✅ |
| Gardens (khu vườn) list | `menu/gardens/index.tsx` | `GET /api/resource/Garden` | ✅ |
| Garden detail | `menu/gardens/[name].tsx` | `GET /api/resource/Garden/<name>` | ✅ |
| Care Logs list | `menu/care-logs/index.tsx` | `GET /api/resource/Care Log` | ✅ |
| Care Log detail | `menu/care-logs/[name].tsx` | `GET /api/resource/Care Log/<name>` | ✅ |
| Farm Owners list | `menu/farm-owners/index.tsx` | `GET /api/resource/Farm Owner` | ✅ |
| Farm Owner detail | `menu/farm-owners/[name].tsx` | FarmOwner + Farms parallel | ✅ |
| Stores list | `menu/stores/index.tsx` | `GET /api/resource/Distribution Store` | ✅ |
| Store detail | `menu/stores/[name].tsx` | `GET /api/resource/Distribution Store/<name>` | ✅ |
| Orders list | `menu/orders/index.tsx` | `GET /api/resource/Sales Order` | ✅ |
| Order detail | `menu/orders/[name].tsx` | `GET /api/resource/Sales Order/<name>` | ✅ |
| Profile | `profile/index.tsx` | sessionInfo | ✅ |
| Menu tile grid | `menu/index.tsx` | useFeatures() | ✅ |
| Quick menu settings | `menu/quick-menu-settings.tsx` | AsyncStorage | ✅ |

### 2.3 API Service Layer — Built

```
src/services/api/
├── client.ts                    ✅ axios base client with auth header
└── resources/
    ├── careLog.ts               ✅
    ├── cultivationLog.ts        ✅
    ├── deliveryNote.ts          ✅
    ├── distributionStore.ts     ✅
    ├── farm.ts                  ✅
    ├── farmOwner.ts             ✅
    ├── garden.ts                ✅
    ├── salesOrder.ts            ✅
    └── index.ts                 ✅ (re-exports all)
```

---

## 3. What Needs to Be Built — Phase 1 Remaining

### 3.1 Missing Screens

| Screen | File (to create) | API | Role | Priority |
|--------|-----------------|-----|------|----------|
| Cultivation Logs list | `menu/cultivation-logs/index.tsx` | `GET /api/resource/Cultivation Log` | Store Employee, Farm Owner | HIGH |
| Cultivation Log detail | `menu/cultivation-logs/[name].tsx` | `GET /api/resource/Cultivation Log/<name>` | Store Employee, Farm Owner | HIGH |
| Delivery Notes list | `menu/delivery-notes/index.tsx` | `GET /api/resource/Delivery Note` | Store Employee | MED |
| Delivery Note detail | `menu/delivery-notes/[name].tsx` | `GET /api/resource/Delivery Note/<name>` | Store Employee | MED |
| Stock / Inventory | `menu/stock/index.tsx` | `esf.api.store.get_stock_levels` | Store Employee | MED |
| Investor Revenue list | `menu/revenue/index.tsx` | `esf.api.investor.get_assigned_stores` | Investor | LOW (blocked) |
| Investor Revenue detail | `menu/revenue/[store].tsx` | `esf.api.investor.get_revenue_detail` | Investor | LOW (blocked) |

### 3.2 Home Screen — Role Dashboard (replaces mock newsfeed)

Current `home/index.tsx` has quick menu + static newsfeed mock.
Needs to show role-specific dashboard data **below** the quick menu section.

| Role | API | Response Fields |
|------|-----|-----------------|
| Store Employee | `esf.api.store.get_dashboard` | `stores[]`, `recent_care_logs[]` |
| Farm Owner | `esf.api.farm_owner.get_dashboard` | `farm_owner`, `farms[]`, `recent_care_logs[]`, `total_gardens`, `active_cultivations` |
| Investor | `esf.api.investor.get_dashboard` | `stores[]`, `total_revenue`, `total_orders`, `revenue_trend[]` |

**Home screen layout** (below quick menu):
```
[Quick Menu tiles — existing]
───────────────────────────
[Greeting + role stats row]   ← NEW
[Recent care logs / farms / revenue summary]  ← NEW
```

### 3.3 RPC Service Layer (to create)

```
src/services/api/rpc/
├── store.ts       # getDashboard(), getStockLevels(params)
├── farmOwner.ts   # getDashboard(), getMyFarmOwner()
├── investor.ts    # getDashboard(period?), getRevenueDetail(store, period?), getAssignedStores(), getFarmOwners(params?)
└── index.ts       # re-exports
```

All use `useFrappePostCall` from frappe-react-sdk or direct `apiClient.post('/api/method/...')`.

---

## 4. Menu Route Activation

Routes currently empty (`route: ''`) in `MENU_ITEM_CONFIGS` that need activation:

| Key | Current route | Target route | Sprint |
|-----|---------------|--------------|--------|
| `deliveryNotes` | `''` | `/(main)/menu/delivery-notes` | Sprint 3 |
| `inventory` | `''` | `/(main)/menu/stock` | Sprint 4 |
| `cultivationLogs` | `''` | `/(main)/menu/cultivation-logs` | Sprint 2 |
| `purchaseRequests` | `''` | `/(main)/menu/purchase-requests` | Phase 2 |
| `revenue` | `''` | `/(main)/menu/revenue` | Sprint 5 |
| `reports` | `''` | `/(main)/menu/reports` | Phase 2 |

---

## 5. i18n Keys to Add

Add to `vi.ts`, `en.ts`, `zh.ts`:

```ts
cultivationLogs: {
  title: 'Nhật ký canh tác',
  list: 'Danh sách nhật ký canh tác',
  detail: 'Chi tiết nhật ký canh tác',
  notFound: 'Không tìm thấy nhật ký canh tác',
  statusInProgress: 'Đang thực hiện',
  statusCompleted: 'Hoàn thành',
  statusCancelled: 'Đã hủy',
  fromDate: 'Ngày bắt đầu',
  toDate: 'Ngày kết thúc',
  cultivationType: 'Loại canh tác',
},
deliveryNotes: {
  title: 'Phiếu giao hàng',
  list: 'Danh sách phiếu giao hàng',
  detail: 'Chi tiết phiếu giao hàng',
  notFound: 'Không tìm thấy phiếu giao hàng',
  postingDate: 'Ngày giao',
  statusDraft: 'Nháp',
  statusToBill: 'Chờ thanh toán',
  statusCompleted: 'Hoàn thành',
  statusCancelled: 'Đã hủy',
},
stock: {
  title: 'Tồn kho',
  availableQty: 'Tồn kho',
  noItems: 'Không có hàng tồn kho',
  searchPlaceholder: 'Tìm theo tên, mã hàng...',
},
revenue: {
  title: 'Doanh thu',
  totalRevenue: 'Tổng doanh thu',
  orderCount: 'Đơn hàng',
  byItemGroup: 'Theo danh mục',
  thisMonth: 'Tháng này',
  lastMonth: 'Tháng trước',
  thisQuarter: 'Quý này',
  thisYear: 'Năm này',
},
```

---

## 6. Implementation Sprint Order

### Sprint 2 — Cultivation Logs

1. Create `menu/cultivation-logs/index.tsx` (list, filter by garden/type)
2. Create `menu/cultivation-logs/[name].tsx` (detail: dates, status, care logs link)
3. Update `MENU_ITEM_CONFIGS` route: `cultivationLogs` → `/(main)/menu/cultivation-logs`
4. Add `cultivationLogs.*` i18n keys to vi/en/zh
5. `cultivationLogs` already in `ROLE_FEATURES` for both Store Employee + Farm Owner

### Sprint 3 — Delivery Notes

6. Create `menu/delivery-notes/index.tsx` (filter by `custom_distribution_store` from context)
7. Create `menu/delivery-notes/[name].tsx` (detail with items table)
8. Update `MENU_ITEM_CONFIGS` route: `deliveryNotes` → `/(main)/menu/delivery-notes`
9. Add `deliveryNotes.*` i18n keys

### Sprint 4 — Stock / Inventory

10. Create `src/services/api/rpc/store.ts` — `getStockLevels(distributionStore, params)`
11. Create `menu/stock/index.tsx` (search + group by item_group, shows actual_qty)
12. Update `MENU_ITEM_CONFIGS` route: `inventory` → `/(main)/menu/stock`
13. Add `stock.*` i18n keys

### Sprint 5 — Home Dashboard

14. Create `src/services/api/rpc/store.ts` — `getDashboard()`
15. Create `src/services/api/rpc/farmOwner.ts` — `getDashboard()`, `getMyFarmOwner()`
16. Update `home/index.tsx` — add role-conditional dashboard section below quick menu
17. Add `dashboard.*` i18n keys

### Sprint 6 — Investor Revenue (requires SPEC-010)

18. Create `src/services/api/rpc/investor.ts`
19. Create `menu/revenue/index.tsx` (per-store summary cards)
20. Create `menu/revenue/[store].tsx` (period picker + orders list)
21. Update `MENU_ITEM_CONFIGS` route: `revenue` → `/(main)/menu/revenue`
22. Add `revenue.*` i18n keys

---

## 7. Phase 2 (Deferred)

| Feature | Blocker | Notes |
|---------|---------|-------|
| Create/Edit Garden | — | Form screen, P2 |
| Create/Edit Care Log | — | With item picker child table |
| Create/Edit Cultivation Log | — | Form screen |
| Create Sales Order | — | Item search, submit |
| Create Delivery Note from SO | — | ERPNext method |
| Purchase Requests | SPEC-011 DocType | GPS nearest store |
| File upload (photos) | — | Care Log / Cultivation Log attachments |
| Reports (charts) | — | Investor + Store Employee |
| Offline queue | — | PRD Section 19.6 |

---

## 8. Code Conventions (Must Follow)

```tsx
// Loading/error pattern
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<T | null>(null);

const loadData = useCallback(async () => {
  try {
    setLoading(true); setError(null);
    const result = await SomeAPI.list();
    setData(result);
  } catch { setError(t('common.errorLoadData')); }
  finally { setLoading(false); }
}, [t]);
useEffect(() => { loadData(); }, [loadData]);

if (loading) return <LoadingScreen message={t('common.loading')} />;
if (error) return <ErrorScreen message={error} onRetry={loadData} />;
```

**Style conventions**:
- Header bg: `settingApp.green_primery`
- Screen bg: `#F5F5F5`
- Card bg: `#FFFFFF`, `borderRadius: 12`
- Back button: `<Ionicons name="arrow-back" size={24} color="#FFFFFF" />`
- Status badge colors:
  - Active / Completed: `#059669` (green)
  - Inactive / Cancelled: `#6B7280` (gray)
  - Pending / Draft: `#D97706` (amber)
  - In Progress: `#2563EB` (blue)
  - Error: `#DC2626` (red)
- Route params: `encodeURIComponent(item.name)` → `decodeURIComponent(name)` on detail
- List key: `keyExtractor={item => item.name}`
- Frappe doc `name` field = unique ID (not numeric)

---

## 9. Blocked Features (Investor Module)

**Blocked by**: SPEC-010 (Investor Assignment DocType) — not started on backend.

Until SPEC-010 deploys:
- `esf.api.investor.get_dashboard` → empty data
- `esf.api.investor.get_assigned_stores` → `[]`
- `esf.api.investor.get_revenue_detail` → empty
- Investor Cultivation/Care Log access is unfiltered (security risk — do not expose)

**Mitigation**: Build investor screens with mock data behind a `__DEV__` flag. Enable when backend deploys.

---

## 10. API Quick Reference

### Custom RPC Endpoints

| Endpoint | Role | Phase |
|----------|------|-------|
| `esf.api.auth.get_session_info` | All | P0 ✅ |
| `esf.api.store.get_dashboard` | Store Employee | P1 |
| `esf.api.store.get_stock_levels` | Store Employee | P1 |
| `esf.api.farm_owner.get_dashboard` | Farm Owner | P1 |
| `esf.api.farm_owner.get_my_farm_owner` | Farm Owner | P1 |
| `esf.api.investor.get_dashboard` | Investor | P1 (blocked SPEC-010) |
| `esf.api.investor.get_assigned_stores` | Investor | P1 (blocked) |
| `esf.api.investor.get_revenue_detail` | Investor | P1 (blocked) |
| `esf.api.investor.get_farm_owners` | Investor | P1 (blocked) |
| `esf.api.farm_owner.create_purchase_request` | Farm Owner | P2 (blocked SPEC-011) |
| `esf.api.farm_owner.get_nearest_store` | Farm Owner | P2 |

### Standard REST (already in service layer)

```
GET /api/resource/Farm
GET /api/resource/Farm/<name>
GET /api/resource/Garden
GET /api/resource/Garden/<name>
GET /api/resource/Care Log
GET /api/resource/Care Log/<name>
GET /api/resource/Cultivation Log
GET /api/resource/Cultivation Log/<name>
GET /api/resource/Farm Owner
GET /api/resource/Farm Owner/<name>
GET /api/resource/Distribution Store
GET /api/resource/Distribution Store/<name>
GET /api/resource/Sales Order?filters=[["custom_distribution_store","=","DS-xxx"]]
GET /api/resource/Sales Order/<name>
GET /api/resource/Delivery Note?filters=[["custom_distribution_store","=","DS-xxx"]]
GET /api/resource/Delivery Note/<name>
```

---

## 11. Terminology (Vietnamese)

| Domain term | Vietnamese | Notes |
|-------------|-----------|-------|
| Farm | Vườn | Main unit |
| Garden (sub-plot) | Khu vườn | Sub-unit within a Vườn |
| Farm Owner | Chủ vườn | |
| Store (Distribution Store) | Cửa hàng | |
| Care Log | Nhật ký chăm sóc | |
| Cultivation Log | Nhật ký canh tác | |
| Sales Order | Đơn hàng | |
| Delivery Note | Phiếu giao hàng | |
| Stock / Inventory | Tồn kho | |
