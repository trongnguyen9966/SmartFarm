# ESF Mobile App — API Plan

**Date**: 2026-04-22
**Status**: Draft
**PRD Reference**: `esf_prd.md` Sections 16, 17, 18, 19.6
**Spec Roadmap**: `.specify/README.md` (SPEC-014, SPEC-015, SPEC-016)

---

## 1. Architecture Overview

### 1.1 API Strategy

The ESF mobile app consumes the Frappe v15 REST API. Two types of endpoints:

| Type | When to Use | Example |
|------|-------------|---------|
| **Standard REST** (`/api/resource/<DocType>`) | Single-DocType CRUD with built-in permission enforcement | List gardens, view farm detail, create care log |
| **Custom RPC** (`/api/method/esf.api.<module>.<function>`) | Aggregated dashboards, multi-DocType joins, computed data | Store dashboard with counts, investor revenue summary |

~70% of mobile features use standard REST with zero custom code. Custom endpoints are reserved for aggregations, cross-chain queries, and auth.

### 1.2 Authentication

**Phase 1: Token-Based Auth**

```
Authorization: token <api_key>:<api_secret>
```

- Each user has an `api_key` and `api_secret` pair on their User record
- Mobile app authenticates via a custom login endpoint that returns tokens + role context
- Tokens are stored securely on the device and sent with every request

**Future**: OAuth 2.0 Bearer tokens if third-party integrations are needed.

### 1.3 Permission Enforcement

All API calls (standard and custom) are subject to Frappe's permission system:

- **DocPerm**: Role-based CRUD permissions per DocType
- **permission_query_conditions**: Row-level filtering (e.g., Store Manager sees only assigned stores' data)
- **has_permission**: Document-level access check (e.g., Care Log write only by creator)

The mobile app does NOT need to implement permission logic — the server enforces it.

### 1.4 Pagination Convention

All list endpoints use offset-based pagination:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit_start` | int | 0 | Offset |
| `limit_page_length` | int | 20 | Page size |
| `order_by` | string | `modified desc` | Sort order |
| `fields` | JSON array | `["name"]` | Fields to return |
| `filters` | JSON array | — | Filter conditions |

Custom endpoints also return `total_count` for infinite scroll.

### 1.5 Error Handling

Frappe returns structured errors:

| HTTP Status | Meaning | Mobile Handling |
|-------------|---------|-----------------|
| 200 | Success | Parse `data` or `message` |
| 403 | Permission denied | Show "access denied" |
| 404 | Not found | Show "not found" |
| 417 | Validation error | Parse `_server_messages` for user-facing text |
| 401 | Unauthenticated | Redirect to login |

---

## 2. Dependencies (Must Build Before Mobile)

| Dependency | Spec | Status | Blocks |
|------------|------|--------|--------|
| Investor Assignment DocType | SPEC-010 | Not started | Investor module (all screens) |
| Investor DocPerm on Distribution Store, Farm, Farm Owner, Garden | SPEC-010 | Not started | Investor read access |
| Investor permission_query_conditions updates | SPEC-010 | Not started | Investor data filtering |
| Farm Purchase Request DocType | SPEC-011 | Not started | Farm Owner purchase request (Phase 2 only) |

**Note**: All Store Employee and Farm Owner Phase 1 endpoints work with the current codebase. Only the Investor module requires SPEC-010 to be completed first.

---

## 3. API Module Structure

```
esf/
  api/
    __init__.py
    auth.py            # Login, session info, role detection
    store.py           # Store Employee dashboard & aggregated endpoints
    farm_owner.py      # Farm Owner dashboard & aggregated endpoints
    investor.py        # Investor dashboard & aggregated endpoints
    common.py          # Shared utilities (get_user_stores, get_user_farm_owner)
```

All `@frappe.whitelist()` methods are automatically accessible at `/api/method/esf.api.<module>.<function>`. No hooks.py changes needed.

---

## 4. Store Employee Module (ESF Store Manager)

### 4.1 Dashboard — Home Screen

**Custom endpoint** — aggregates counts from multiple DocTypes in one call.

```
POST /api/method/esf.api.store.get_dashboard
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Uses `frappe.session.user` |

**Response**:
```json
{
  "stores": [
    {
      "name": "DS-00001",
      "store_name": "Cửa Hàng A",
      "warehouse": "WH-00001",
      "farm_count": 5,
      "garden_count": 12,
      "active_cultivation_count": 8,
      "farm_owner_count": 3
    }
  ],
  "recent_care_logs": [
    {
      "name": "CARE-00001",
      "care_date": "2026-04-20",
      "garden": "GRD-00001",
      "garden_name": "Vườn A",
      "cultivation_log": "CLOG-00001"
    }
  ]
}
```

**Phase**: P1

---

### 4.2 Store Info

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| View store detail | `GET /api/resource/Distribution Store/<name>` | Standard | P1 |
| Edit store info | `PUT /api/resource/Distribution Store/<name>` | Standard | P2 |

---

### 4.3 Stock Levels

**Custom endpoint** — joins `tabBin` (stock) with `tabItem` filtered by store warehouse.

```
POST /api/method/esf.api.store.get_stock_levels
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `distribution_store` | string | Yes | DS-xxxxx |
| `item_group` | string | No | Filter by item group |
| `search` | string | No | Search item name/code |
| `limit_start` | int | No | Pagination offset (default 0) |
| `limit_page_length` | int | No | Page size (default 20) |

**Response**:
```json
{
  "warehouse": "WH-00001",
  "items": [
    {
      "item_code": "ITEM-001",
      "item_name": "Phân bón A",
      "item_group": "Phân bón",
      "custom_usage_type": "Farm Care",
      "actual_qty": 150.0,
      "uom": "Kg",
      "image": "/files/item-001.jpg"
    }
  ],
  "total_count": 45
}
```

**Phase**: P1

---

### 4.4 Sales Orders

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List SOs for store | `GET /api/resource/Sales Order?filters=[["custom_distribution_store","=","DS-00001"]]&fields=["name","customer_name","grand_total","status","transaction_date"]&order_by=transaction_date desc` | Standard | P1 |
| View SO detail | `GET /api/resource/Sales Order/<name>` | Standard | P1 |
| Create SO | `POST /api/resource/Sales Order` | Standard | P2 |
| Submit SO | `POST /api/method/frappe.client.submit` | Standard | P2 |

**Note**: Sales Order has no `permission_query_conditions` for ESF roles — the mobile app must filter by `custom_distribution_store` explicitly.

---

### 4.5 Delivery Notes

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List DNs for store | `GET /api/resource/Delivery Note?filters=[["custom_distribution_store","=","DS-00001"]]&fields=["name","customer_name","grand_total","status","posting_date"]&order_by=posting_date desc` | Standard | P1 |
| View DN detail | `GET /api/resource/Delivery Note/<name>` | Standard | P1 |
| Create DN from SO | `POST /api/method/erpnext.selling.doctype.sales_order.sales_order.make_delivery_note` | Standard ERPNext | P2 |

---

### 4.6 Farm Owners

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List farm owners | `GET /api/resource/Farm Owner?fields=["name","owner_name","phone","email"]` | Standard (permission auto-filters) | P1 |
| View detail | `GET /api/resource/Farm Owner/<name>` | Standard | P1 |
| List farms for owner | `GET /api/resource/Farm?filters=[["farm_owner","=","FO-00001"]]` | Standard | P1 |
| Edit farm owner | `PUT /api/resource/Farm Owner/<name>` | Standard | P2 |
| Create farm owner | `POST /api/resource/Farm Owner` | Standard | P2 |

---

### 4.7 Gardens

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List gardens | `GET /api/resource/Garden?fields=["name","garden_name","farm","farm_owner","status"]&filters=[["farm","=","FRM-00001"]]` | Standard | P1 |
| View detail (incl. geolocation) | `GET /api/resource/Garden/<name>` | Standard | P1 |
| Edit garden | `PUT /api/resource/Garden/<name>` | Standard | P2 |
| Create garden | `POST /api/resource/Garden` | Standard | P2 |

---

### 4.8 Cultivation Logs

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List logs | `GET /api/resource/Cultivation Log?fields=["name","garden","cultivation_master","cultivation_type","from_date","to_date","status","farm","farm_owner"]&order_by=from_date desc` | Standard | P1 |
| View detail | `GET /api/resource/Cultivation Log/<name>` | Standard | P1 |
| List cultivation masters (picker) | `GET /api/resource/Cultivation Master?filters=[["status","=","Active"]]&fields=["name","cultivation_name","cultivation_type","image"]` | Standard | P1 |
| Create log | `POST /api/resource/Cultivation Log` | Standard | P2 |
| Update log (status change) | `PUT /api/resource/Cultivation Log/<name>` | Standard | P2 |

---

### 4.9 Care Logs

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List care logs | `GET /api/resource/Care Log?fields=["name","cultivation_log","care_date","garden","efficiency_percent","owner"]&order_by=care_date desc` | Standard | P1 |
| View detail (incl. items child table) | `GET /api/resource/Care Log/<name>` | Standard | P1 |
| Create care log | `POST /api/resource/Care Log` | Standard | P2 |
| Update care log (only own) | `PUT /api/resource/Care Log/<name>` | Standard (has_permission enforces owner-only write) | P2 |

**Phase 2 — Create Care Log POST body example**:
```json
{
  "doctype": "Care Log",
  "cultivation_log": "CLOG-00001",
  "care_date": "2026-04-22",
  "content": "Bón phân lần 2",
  "efficiency_percent": 85,
  "items": [
    {"item": "ITEM-001", "quantity": 5, "uom": "Kg", "notes": "Bón đều"}
  ]
}
```

---

## 5. Farm Owner Module (ESF Farm Owner)

### 5.1 Dashboard — Home Screen

**Custom endpoint** — resolves Farm Owner from `linked_user`, aggregates farm/garden/log counts.

```
POST /api/method/esf.api.farm_owner.get_dashboard
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Uses `frappe.session.user` |

**Response**:
```json
{
  "farm_owner": {
    "name": "FO-00001",
    "owner_name": "Nguyễn Văn A",
    "phone": "09x...",
    "email": "a@example.com"
  },
  "farms": [
    {
      "name": "FRM-00001",
      "farm_name": "Trang Trại A",
      "distribution_store": "DS-00001",
      "store_name": "Cửa Hàng A",
      "status": "Active",
      "garden_count": 4,
      "active_cultivation_count": 3
    }
  ],
  "recent_care_logs": [
    {
      "name": "CARE-00001",
      "care_date": "2026-04-20",
      "garden_name": "Vườn A"
    }
  ],
  "total_gardens": 8,
  "active_cultivations": 6
}
```

**Phase**: P1

---

### 5.2 My Farm Owner Info

**Custom endpoint** — resolves Farm Owner record from current user's `linked_user`.

```
POST /api/method/esf.api.farm_owner.get_my_farm_owner
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Uses `frappe.session.user` |

**Response**: Full Farm Owner document fields.

**Phase**: P1

---

### 5.3 My Farms

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List own farms | `GET /api/resource/Farm` | Standard (permission auto-filters to own farms) | P1 |
| View farm detail | `GET /api/resource/Farm/<name>` | Standard | P1 |

---

### 5.4 Gardens

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List own gardens | `GET /api/resource/Garden` | Standard (permission auto-filters) | P1 |
| View garden detail | `GET /api/resource/Garden/<name>` | Standard | P1 |
| Create garden | `POST /api/resource/Garden` | Standard | P2 |
| Edit garden | `PUT /api/resource/Garden/<name>` | Standard | P2 |

---

### 5.5 Cultivation Logs

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List own cultivation logs | `GET /api/resource/Cultivation Log` | Standard (auto-filtered) | P1 |
| View detail | `GET /api/resource/Cultivation Log/<name>` | Standard | P1 |
| Create | `POST /api/resource/Cultivation Log` | Standard | P2 |
| Update | `PUT /api/resource/Cultivation Log/<name>` | Standard | P2 |

---

### 5.6 Care Logs

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List own care logs | `GET /api/resource/Care Log` | Standard (auto-filtered) | P1 |
| View detail | `GET /api/resource/Care Log/<name>` | Standard | P1 |
| Create | `POST /api/resource/Care Log` | Standard | P2 |
| Update (only own) | `PUT /api/resource/Care Log/<name>` | Standard (has_permission enforces) | P2 |

---

### 5.7 Purchase Requests (Phase 2 Only)

**Requires**: Farm Purchase Request DocType (SPEC-011).

**Custom endpoint** — creates purchase request and auto-assigns nearest store.

```
POST /api/method/esf.api.farm_owner.create_purchase_request
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `farm` | string | Yes | FRM-xxxxx |
| `items` | array | Yes | `[{"item": "ITEM-001", "quantity": 10, "uom": "Kg"}]` |
| `notes` | string | No | Free-text notes |

**Response**:
```json
{
  "name": "FPR-00001",
  "distribution_store": "DS-00001",
  "store_name": "Cửa Hàng A",
  "status": "Pending"
}
```

**Phase**: P2

---

**Custom endpoint** — finds nearest store by GPS coordinates.

```
POST /api/method/esf.api.farm_owner.get_nearest_store
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | float | Yes | GPS latitude |
| `longitude` | float | Yes | GPS longitude |

**Response**:
```json
{
  "name": "DS-00001",
  "store_name": "Cửa Hàng A",
  "distance_km": 2.5
}
```

**Phase**: P2

---

## 6. Investor Module (ESF Investor)

**Prerequisite**: SPEC-010 (Investor Assignment DocType) must be implemented.

All Investor endpoints are **read-only** in both Phase 1 and Phase 2.

### 6.1 Dashboard — Home Screen

**Custom endpoint** — aggregates revenue from Sales Orders, counts from farms/gardens, filtered by Investor Assignment.

```
POST /api/method/esf.api.investor.get_dashboard
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `this_month` (default), `last_month`, `this_quarter`, `this_year`, `custom` |
| `from_date` | string | No | Required when period=custom |
| `to_date` | string | No | Required when period=custom |

**Response**:
```json
{
  "stores": [
    {
      "name": "DS-00001",
      "store_name": "Cửa Hàng A",
      "total_revenue": 50000000,
      "order_count": 25,
      "farm_count": 5,
      "garden_count": 12
    }
  ],
  "total_revenue": 150000000,
  "total_orders": 75,
  "total_farms": 15,
  "total_gardens": 36,
  "revenue_trend": [
    {"month": "2026-01", "revenue": 40000000},
    {"month": "2026-02", "revenue": 55000000},
    {"month": "2026-03", "revenue": 55000000}
  ]
}
```

**Phase**: P1

---

### 6.2 Revenue Detail (Per Store)

**Custom endpoint** — detailed revenue breakdown for a specific store.

```
POST /api/method/esf.api.investor.get_revenue_detail
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `distribution_store` | string | Yes | DS-xxxxx |
| `period` | string | No | Same as dashboard |
| `from_date` | string | No | For custom period |
| `to_date` | string | No | For custom period |

**Response**:
```json
{
  "distribution_store": "DS-00001",
  "store_name": "Cửa Hàng A",
  "total_revenue": 50000000,
  "orders": [
    {
      "name": "SO-00001",
      "customer_name": "Khách hàng A",
      "grand_total": 5000000,
      "transaction_date": "2026-04-15",
      "status": "Completed"
    }
  ],
  "revenue_by_item_group": [
    {"item_group": "Phân bón", "total": 30000000},
    {"item_group": "Thuốc BVTV", "total": 20000000}
  ]
}
```

**Phase**: P1

---

### 6.3 Assigned Stores

**Custom endpoint** — returns stores assigned to the investor via Investor Assignment.

```
POST /api/method/esf.api.investor.get_assigned_stores
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Uses `frappe.session.user` |

**Response**:
```json
{
  "stores": [
    {
      "name": "DS-00001",
      "store_name": "Cửa Hàng A",
      "address": "123 Đường ABC, Quận 1",
      "phone": "028...",
      "warehouse": "WH-00001"
    }
  ]
}
```

**Phase**: P1

---

### 6.4 Farm Owners (via Assigned Stores)

**Custom endpoint** — Farm Owner has no direct link to Distribution Store; must traverse Farm Owner → Farm → Distribution Store → Investor Assignment.

```
POST /api/method/esf.api.investor.get_farm_owners
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `distribution_store` | string | No | Filter by specific store |
| `limit_start` | int | No | Pagination offset |
| `limit_page_length` | int | No | Page size |

**Response**:
```json
{
  "farm_owners": [
    {
      "name": "FO-00001",
      "owner_name": "Nguyễn Văn A",
      "phone": "09x...",
      "farm_count": 2,
      "distribution_store": "DS-00001",
      "store_name": "Cửa Hàng A"
    }
  ],
  "total_count": 10
}
```

**Phase**: P1

---

### 6.5 Cultivation & Care Logs (Read-Only)

| Feature | API | Type | Phase |
|---------|-----|------|-------|
| List cultivation logs | `GET /api/resource/Cultivation Log` | Standard (permission_query filters by investor assignment) | P1 |
| View cultivation log detail | `GET /api/resource/Cultivation Log/<name>` | Standard | P1 |
| List care logs | `GET /api/resource/Care Log` | Standard (permission_query filters) | P1 |
| View care log detail | `GET /api/resource/Care Log/<name>` | Standard | P1 |

**Important**: Requires permission_query_conditions updates in SPEC-010 to filter by Investor Assignment → Distribution Store chain.

---

## 7. Auth Endpoints

### 7.1 Login

**Custom endpoint** — authenticates and returns tokens + role-specific context in one call.

```
POST /api/method/esf.api.auth.login
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `usr` | string | Yes | Username or email |
| `pwd` | string | Yes | Password |

**Response**:
```json
{
  "user": "employee@example.com",
  "full_name": "Nguyễn Văn B",
  "roles": ["ESF Store Manager"],
  "primary_role": "ESF Store Manager",
  "api_key": "abc123...",
  "api_secret": "xyz789...",
  "context": {
    "stores": [{"name": "DS-00001", "store_name": "Cửa Hàng A"}]
  }
}
```

**Context varies by role**:
- ESF Store Manager: `"stores"` — assigned Distribution Stores
- ESF Farm Owner: `"farm_owner"` — linked Farm Owner record
- ESF Investor: `"assigned_stores"` — stores from Investor Assignment

**Phase**: P1

---

### 7.2 Session Info

**Custom endpoint** — refreshes session context without re-authenticating (for app resume).

```
POST /api/method/esf.api.auth.get_session_info
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Uses current auth token |

**Response**: Same as login, without `api_key`/`api_secret`.

**Phase**: P1

---

## 8. Lookup Endpoints (Standard REST)

Used for form dropdowns/pickers in Phase 2 create/edit screens:

| Lookup | API | Phase |
|--------|-----|-------|
| Cultivation Masters | `GET /api/resource/Cultivation Master?filters=[["status","=","Active"]]&fields=["name","cultivation_name","cultivation_type","image"]` | P1 (display), P2 (pickers) |
| Items (for Care Log) | `GET /api/resource/Item?filters=[["custom_usage_type","in",["Farm Care","Both"]]]&fields=["name","item_name","item_group","custom_usage_type","image"]` | P2 |
| UOMs | `GET /api/resource/UOM?fields=["name"]` | P2 |
| Customers (for SO) | `GET /api/resource/Customer?fields=["name","customer_name"]` | P2 |
| Farms (for picker) | `GET /api/resource/Farm?fields=["name","farm_name","farm_owner","distribution_store","status"]` | P2 |
| Gardens (for picker) | `GET /api/resource/Garden?fields=["name","garden_name","farm","status"]` | P2 |

---

## 9. File Upload (Phase 2)

For care log attachments, cultivation log attachments, farm/garden images:

```
POST /api/method/upload_file
Content-Type: multipart/form-data

file: <binary>
doctype: "Care Log"
docname: "CARE-00001"
fieldname: "attachments"
is_private: 1
```

**Response**: File DocType record with `file_url`.

---

## 10. Custom Endpoint Summary

### Phase 1 (10 endpoints)

| # | Endpoint | Module | Purpose |
|---|----------|--------|---------|
| 1 | `esf.api.auth.login` | Auth | Login + return tokens & role context |
| 2 | `esf.api.auth.get_session_info` | Auth | Session refresh on app resume |
| 3 | `esf.api.store.get_dashboard` | Store | Aggregated store counts & recent logs |
| 4 | `esf.api.store.get_stock_levels` | Store | Warehouse stock with item details |
| 5 | `esf.api.farm_owner.get_dashboard` | Farm Owner | Aggregated farm/garden/log counts |
| 6 | `esf.api.farm_owner.get_my_farm_owner` | Farm Owner | Resolve Farm Owner from current user |
| 7 | `esf.api.investor.get_dashboard` | Investor | Revenue summary + stats by store |
| 8 | `esf.api.investor.get_revenue_detail` | Investor | Per-store revenue breakdown |
| 9 | `esf.api.investor.get_assigned_stores` | Investor | Investor's assigned stores |
| 10 | `esf.api.investor.get_farm_owners` | Investor | Farm owners in assigned stores |

### Phase 2 (2 additional endpoints)

| # | Endpoint | Module | Purpose |
|---|----------|--------|---------|
| 11 | `esf.api.farm_owner.create_purchase_request` | Farm Owner | Create purchase request, auto-assign store |
| 12 | `esf.api.farm_owner.get_nearest_store` | Farm Owner | Find nearest store by GPS |

### Standard REST (no custom code)

All DocType CRUD operations use `GET/POST/PUT /api/resource/<DocType>` with Frappe's built-in permission enforcement:

- Distribution Store, Farm Owner, Farm, Garden
- Cultivation Master, Cultivation Log, Care Log
- Sales Order, Delivery Note, Item, Customer, UOM
- File upload via `/api/method/upload_file`

---

## 11. Permission Gap Analysis

### Current State

| DocType | ESF Store Manager | ESF Farm Owner | ESF Investor |
|---------|------------------|----------------|--------------|
| Distribution Store | Read/Write (assigned) | — | **MISSING** |
| Farm Owner | Read/Write/Create | Read (own) | **MISSING** |
| Farm | Read/Write/Create (assigned stores) | Read (own) | **MISSING** |
| Garden | Read/Write/Create (assigned stores) | Read/Write/Create (own) | **MISSING** |
| Cultivation Master | Read | Read | Read |
| Cultivation Log | Read/Write/Create (assigned stores) | Read/Write/Create (own) | Read (**unfiltered**) |
| Care Log | Read/Write/Create (assigned stores, own edit) | Read/Write/Create (own edit) | Read (**unfiltered**) |

### Required Changes (SPEC-010)

1. **Add DocPerm** for ESF Investor (read) on: Distribution Store, Farm Owner, Farm, Garden
2. **Update permission_query_conditions** for ESF Investor on all 6 custom DocTypes to filter through:
   `Investor Assignment.user = current_user → Distribution Store → Farm → Garden → Cultivation Log → Care Log`
3. Currently Cultivation Log and Care Log return `""` (no filter) for ESF Investor — must be restricted

---

## 12. Phase 1 vs Phase 2 Scope Summary

### Phase 1 — Read-Only + Dashboards

**All 3 roles**: View-only. No create/edit/delete operations.

- 10 custom endpoints (auth, dashboards, aggregations)
- Standard REST `GET` calls for all DocTypes
- Prerequisite: SPEC-010 (Investor Assignment) for Investor module

### Phase 2 — Full CRUD + Purchase Workflow

- 2 additional custom endpoints (purchase request, nearest store)
- Standard REST `POST/PUT` for creating/editing DocTypes
- File upload for attachments/images
- Prerequisite: SPEC-011 (Farm Purchase Request) for purchase workflow
- Offline queue for data mutations (deferred per PRD Section 19.6)

---

## 13. Spec Mapping

| Spec | Mobile Scope |
|------|-------------|
| SPEC-010 (Investor Assignment) | Required before Investor module |
| SPEC-011 (Farm Purchase Request) | Required before Farm Owner purchase (P2) |
| SPEC-014 (Mobile API — Store Employee) | Sections 4.1–4.9 of this plan |
| SPEC-015 (Mobile API — Farm Owner) | Sections 5.1–5.7 of this plan |
| SPEC-016 (Mobile API — Investor) | Sections 6.1–6.5 of this plan |

**Recommended implementation order**:
1. SPEC-010 → Investor Assignment DocType + permission updates
2. SPEC-014 → Store Employee API (most features, largest role)
3. SPEC-015 → Farm Owner API (dashboard + standard REST)
4. SPEC-016 → Investor API (dashboards + revenue aggregation)
5. SPEC-011 → Farm Purchase Request (Phase 2)
