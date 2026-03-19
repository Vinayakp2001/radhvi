# Implementation Plan

- [x] 1. Backend: Admin API views and URLs





  - Create `gift/api/admin_views.py` with all admin ViewSets using `IsAdminUser` permission
  - Register all admin routes under `/api/admin/` in `gift/api/urls.py`
  - _Requirements: 10.1, 10.2_

- [x] 1.1 Create dashboard stats endpoint


  - Implement `GET /api/admin/dashboard/` view that aggregates total_orders, total_revenue, total_products, pending_orders, pending_returns, pending_inquiries, recent_orders (last 5), low_stock_products (stock < 5)
  - _Requirements: 10.3, 2.1, 2.2, 2.3, 2.4_

- [x] 1.2 Create admin Product ViewSet


  - Full CRUD ViewSet for `Product` model with `IsAdminUser` permission
  - Support pagination, search by name, filter by category and stock status
  - _Requirements: 10.4, 10.5, 3.1, 3.2_



- [x] 1.3 Create admin Order ViewSet

  - Read + PATCH ViewSet for `Order` model; allow updating `status` field only
  - Support filtering by `status` and `payment_status`
  - _Requirements: 10.4, 10.5, 4.1, 4.2, 4.4_




- [x] 1.4 Create admin Category, Coupon, Return, User, BulkInquiry ViewSets

  - `Category`: full CRUD
  - `Coupon`: full CRUD
  - `ReturnRequest`: read + PATCH status
  - `User`: read-only list + detail with prefetched orders
  - `BulkInquiry`: read + PATCH status
  - _Requirements: 10.4, 5.1, 6.1, 7.1, 8.1, 9.1_

- [x] 1.5 Register all admin URLs in `gift/api/urls.py`




  - Add `path('admin/', include('gift.api.admin_urls'))` and create `gift/api/admin_urls.py` with all router registrations
  - _Requirements: 10.1, 10.2_

- [ ]* 1.6 Write permission enforcement tests
  - Test that non-staff token returns 403 on all admin endpoints
  - Test that staff token returns 200 on dashboard endpoint
  - _Requirements: 10.1, 10.2_

- [x] 2. Frontend: Admin auth and layout



  - Build the admin login page, auth guard layout, and shared sidebar/topbar shell
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Create `frontend/src/lib/admin-api.ts`


  - Export typed functions for all admin API calls (getDashboard, getProducts, createProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus, getCategories, createCategory, updateCategory, getCoupons, createCoupon, updateCoupon, getReturns, updateReturnStatus, getUsers, getUserDetail, getBulkInquiries, updateInquiryStatus)
  - Reuse the existing `api` axios instance
  - _Requirements: 10.3, 10.4, 10.5_


- [x] 2.2 Create admin login page at `frontend/src/app/admin/login/page.tsx`

  - Username + password form, calls `/api/auth/login/` then `/api/auth/me/` to verify `is_staff`
  - If `is_staff` is false, show "Access denied" and clear token
  - On success, store `is_staff` in `localStorage` alongside user data and redirect to `/admin`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.3 Create admin layout at `frontend/src/app/admin/layout.tsx`


  - Auth guard: reads token + `is_staff` from localStorage; redirects to `/admin/login` if missing or false
  - Renders `AdminSidebar` + `AdminTopbar` shell around `{children}`
  - _Requirements: 1.1, 1.3, 1.5_


- [x] 2.4 Create `AdminSidebar` and `AdminTopbar` components

  - `AdminSidebar`: nav links to Dashboard, Products, Orders, Categories, Coupons, Returns, Users, Bulk Inquiries
  - `AdminTopbar`: shows logged-in admin name and logout button
  - _Requirements: 1.4_

- [x] 3. Frontend: Shared admin UI components


  - Build reusable table, stat card, status badge, and confirm dialog components
  - _Requirements: 2.1, 3.1, 4.1_


- [x] 3.1 Create `AdminTable` component

  - Accepts `columns` config and `rows` data, renders a responsive table with optional sort indicators
  - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_


- [x] 3.2 Create `StatCard`, `StatusBadge`, and `ConfirmDialog` components

  - `StatCard`: icon + label + value card for dashboard metrics
  - `StatusBadge`: colored pill for order/return/inquiry status values
  - `ConfirmDialog`: modal with confirm/cancel for destructive actions
  - _Requirements: 2.1, 3.6, 4.4_

- [x] 4. Frontend: Dashboard page


  - Implement `frontend/src/app/admin/page.tsx` fetching from `/api/admin/dashboard/`
  - Render 4 `StatCard`s (total orders, revenue, products, pending orders), recent orders table, low stock products list, pending returns/inquiries counts
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Frontend: Product management pages



  - Build product list page and create/edit product form page
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_


- [x] 5.1 Product list page at `frontend/src/app/admin/products/page.tsx`

  - Fetch paginated products from `/api/admin/products/`, render in `AdminTable`
  - Search input and category filter; Edit and Delete buttons per row; flag toggle buttons (featured, bestseller, etc.)
  - _Requirements: 3.1, 3.2, 3.6, 3.7_


- [x] 5.2 Product create/edit page at `frontend/src/app/admin/products/[id]/page.tsx`

  - Form with all product fields: name, description, short_description, price, discounted_price, category, stock, weight, dimensions, flags, meta fields
  - `id = 'new'` for create, numeric id for edit (pre-fills form via GET)
  - On submit: POST for create, PUT for edit; show success/error feedback
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 6. Frontend: Order management pages



  - Build order list page and order detail page
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 6.1 Order list page at `frontend/src/app/admin/orders/page.tsx`

  - Fetch paginated orders from `/api/admin/orders/`, render in `AdminTable`
  - Filter dropdowns for order status and payment status
  - _Requirements: 4.1, 4.2_


- [x] 6.2 Order detail page at `frontend/src/app/admin/orders/[orderId]/page.tsx`

  - Show full order: items, shipping address, payment info (gateway, transaction ID), Shiprocket sync status, AWB code
  - Status update dropdown + save button using PATCH `/api/admin/orders/{orderId}/`
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 7. Frontend: Category, Coupon, Returns, Users, Bulk Inquiries pages



  - Build remaining management pages
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3_


- [x] 7.1 Categories page at `frontend/src/app/admin/categories/page.tsx`

  - List all categories in `AdminTable`; inline create form and edit modal; active toggle
  - _Requirements: 5.1, 5.2, 5.3_


- [x] 7.2 Coupons page at `frontend/src/app/admin/coupons/page.tsx`

  - List all coupons; create form (code, type, value, min order, dates, usage limit); deactivate toggle
  - _Requirements: 6.1, 6.2, 6.3_


- [x] 7.3 Returns list and detail pages

  - `frontend/src/app/admin/returns/page.tsx`: list with `StatusBadge`, filter by status
  - `frontend/src/app/admin/returns/[requestId]/page.tsx`: full detail + status update dropdown
  - _Requirements: 7.1, 7.2, 7.3_


- [x] 7.4 Users list and detail pages

  - `frontend/src/app/admin/users/page.tsx`: searchable user list
  - `frontend/src/app/admin/users/[userId]/page.tsx`: user profile + order history table
  - _Requirements: 8.1, 8.2, 8.3_


- [x] 7.5 Bulk Inquiries list and detail pages

  - `frontend/src/app/admin/bulk-inquiries/page.tsx`: list with status filter
  - `frontend/src/app/admin/bulk-inquiries/[inquiryId]/page.tsx`: full detail + status update
  - _Requirements: 9.1, 9.2, 9.3_
