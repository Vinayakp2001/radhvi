# Admin Panel - Design Document

## Overview

A Next.js admin dashboard at `/admin/*` for Radhvi Gift Store. It is completely separate from Django's built-in `/admin` and the customer-facing storefront. Access is restricted to users with `is_staff=True` on the Django backend. The panel communicates with the existing Django REST API, extended with new staff-only endpoints.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Next.js App Router                          │
│                                                          │
│  /admin/login          ← public (no auth required)      │
│  /admin                ← protected (is_staff only)      │
│  /admin/products       ← protected                      │
│  /admin/orders         ← protected                      │
│  /admin/categories     ← protected                      │
│  /admin/coupons        ← protected                      │
│  /admin/returns        ← protected                      │
│  /admin/users          ← protected                      │
│  /admin/bulk-inquiries ← protected                      │
└──────────────────┬──────────────────────────────────────┘
                   │ Token auth (same auth_token)
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Django REST API                             │
│                                                          │
│  /api/admin/dashboard/       ← IsAdminUser              │
│  /api/admin/products/        ← IsAdminUser (CRUD)       │
│  /api/admin/orders/          ← IsAdminUser (R + update) │
│  /api/admin/categories/      ← IsAdminUser (CRUD)       │
│  /api/admin/coupons/         ← IsAdminUser (CRUD)       │
│  /api/admin/returns/         ← IsAdminUser (R + update) │
│  /api/admin/users/           ← IsAdminUser (R)          │
│  /api/admin/bulk-inquiries/  ← IsAdminUser (R + update) │
└─────────────────────────────────────────────────────────┘
```

The admin panel reuses the same `auth_token` from `localStorage` that the storefront uses. After login, the frontend checks `is_staff` from the `/api/auth/me/` response and stores it alongside user data. All admin API calls include `Authorization: Token <token>` and the backend enforces `IsAdminUser` permission.

---

## Components and Interfaces

### Route Structure (Next.js App Router)

```
frontend/src/app/admin/
├── layout.tsx              ← AdminLayout: sidebar + topbar, auth guard
├── page.tsx                ← Dashboard
├── login/
│   └── page.tsx            ← Admin login page (no layout)
├── products/
│   ├── page.tsx            ← Product list
│   └── [id]/
│       └── page.tsx        ← Create / Edit product
├── orders/
│   ├── page.tsx            ← Order list
│   └── [orderId]/
│       └── page.tsx        ← Order detail + status update
├── categories/
│   └── page.tsx            ← Category list + inline create/edit
├── coupons/
│   └── page.tsx            ← Coupon list + create form
├── returns/
│   ├── page.tsx            ← Return request list
│   └── [requestId]/
│       └── page.tsx        ← Return detail + status update
├── users/
│   ├── page.tsx            ← User list
│   └── [userId]/
│       └── page.tsx        ← User detail + order history
└── bulk-inquiries/
    ├── page.tsx            ← Inquiry list
    └── [inquiryId]/
        └── page.tsx        ← Inquiry detail + status update
```

### Shared Admin Components

```
frontend/src/components/admin/
├── AdminSidebar.tsx        ← Navigation sidebar with links
├── AdminTopbar.tsx         ← Top bar with admin name + logout
├── AdminTable.tsx          ← Reusable sortable/paginated table
├── AdminForm.tsx           ← Reusable form wrapper with validation
├── StatCard.tsx            ← Dashboard metric card
├── StatusBadge.tsx         ← Colored badge for order/return status
└── ConfirmDialog.tsx       ← Confirmation modal for destructive actions
```

### Auth Guard

`frontend/src/app/admin/layout.tsx` acts as the auth guard:
- Reads `auth_token` and `user_data` from `localStorage`
- Checks `user_data.is_staff === true`
- If not authenticated or not staff → redirect to `/admin/login`
- Wraps all admin pages in the sidebar + topbar shell

### Admin Auth Context

A lightweight `AdminAuthContext` (separate from the customer `AuthContext`) stores:
```ts
interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}
```
Login calls `/api/auth/login/`, then `/api/auth/me/` to verify `is_staff`. Token stored in `localStorage` under `auth_token` (shared with storefront — same user, same token).

---

## Data Models

### Backend: New Admin API ViewSets

All admin views live in a new file: `gift/api/admin_views.py`  
All admin URLs are registered under `/api/admin/` in `gift/api/urls.py`

#### Permission class used on all admin views:
```python
from rest_framework.permissions import IsAdminUser
```

#### Dashboard Stats endpoint
```
GET /api/admin/dashboard/
Response: {
  total_orders, total_revenue, total_products,
  pending_orders, pending_returns, pending_inquiries,
  recent_orders: [...],
  low_stock_products: [...]
}
```

#### Admin Product ViewSet
```
GET    /api/admin/products/          list (paginated, filterable)
POST   /api/admin/products/          create
GET    /api/admin/products/{id}/     retrieve
PUT    /api/admin/products/{id}/     update
PATCH  /api/admin/products/{id}/     partial update (flag toggles)
DELETE /api/admin/products/{id}/     delete
```

#### Admin Order ViewSet
```
GET   /api/admin/orders/             list (paginated, filterable by status)
GET   /api/admin/orders/{order_id}/  retrieve
PATCH /api/admin/orders/{order_id}/  update status
```

#### Admin Category ViewSet
```
GET    /api/admin/categories/        list
POST   /api/admin/categories/        create
PATCH  /api/admin/categories/{id}/   update
DELETE /api/admin/categories/{id}/   delete
```

#### Admin Coupon ViewSet
```
GET    /api/admin/coupons/           list
POST   /api/admin/coupons/           create
PATCH  /api/admin/coupons/{id}/      update / deactivate
DELETE /api/admin/coupons/{id}/      delete
```

#### Admin Return Request ViewSet
```
GET   /api/admin/returns/            list
GET   /api/admin/returns/{id}/       retrieve
PATCH /api/admin/returns/{id}/       update status
```

#### Admin User ViewSet
```
GET /api/admin/users/                list (paginated, searchable)
GET /api/admin/users/{id}/           retrieve with order history
```

#### Admin Bulk Inquiry ViewSet
```
GET   /api/admin/bulk-inquiries/     list
GET   /api/admin/bulk-inquiries/{id}/ retrieve
PATCH /api/admin/bulk-inquiries/{id}/ update status
```

### Frontend: Admin API Client

New file: `frontend/src/lib/admin-api.ts`

Reuses the same `api` axios instance (already has token interceptor). Exports typed functions:
```ts
adminApi.getDashboard()
adminApi.getProducts(params)
adminApi.createProduct(data)
adminApi.updateProduct(id, data)
adminApi.deleteProduct(id)
adminApi.getOrders(params)
adminApi.updateOrderStatus(orderId, status)
adminApi.getCategories()
adminApi.createCategory(data)
adminApi.updateCategory(id, data)
adminApi.getCoupons()
adminApi.createCoupon(data)
adminApi.updateCoupon(id, data)
adminApi.getReturns(params)
adminApi.updateReturnStatus(id, status)
adminApi.getUsers(params)
adminApi.getUserDetail(id)
adminApi.getBulkInquiries(params)
adminApi.updateInquiryStatus(id, status)
```

---

## Error Handling

- 401/403 responses from admin API → clear token, redirect to `/admin/login`
- Form validation errors → display inline field errors from DRF response
- Network errors → show toast notification "Something went wrong, please try again"
- Delete/destructive actions → always show `ConfirmDialog` before proceeding
- Empty states → each list page shows a friendly empty state with a CTA

---

## Testing Strategy

- Backend: Unit tests for `IsAdminUser` permission enforcement on all admin endpoints (non-staff user gets 403)
- Backend: Test dashboard stats aggregation returns correct counts
- Frontend: Component tests for `AdminTable`, `StatCard`, `StatusBadge`
- Manual: End-to-end flow — login as staff, create product, update order status, process return

---

## Design Decisions

1. **Separate route namespace `/admin/*`** — keeps admin completely isolated from the storefront, easy to add IP allowlisting or basic auth at the nginx level later.

2. **Reuse existing auth token** — no separate admin auth system needed. The same Django token works; we just check `is_staff` on the frontend and enforce `IsAdminUser` on the backend.

3. **New `admin_views.py` file** — keeps admin API logic separate from the customer-facing API views, easier to maintain and audit.

4. **No separate admin layout file** — the `frontend/src/app/admin/layout.tsx` handles both the auth guard and the sidebar shell in one place, keeping it simple.

5. **Tailwind CSS for styling** — consistent with the rest of the frontend, no new UI library needed. Simple table/card/form patterns using existing Tailwind classes.
