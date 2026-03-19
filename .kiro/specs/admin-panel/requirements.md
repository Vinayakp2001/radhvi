# Requirements Document

## Introduction

A custom Next.js admin panel for Radhvi Gift Store, accessible only to staff/admin users authenticated via the existing Django backend. The panel provides full store management capabilities including products, orders, categories, coupons, users, return requests, and bulk inquiries — all through a secure, dedicated dashboard interface at `/admin`.

## Requirements

### Requirement 1: Admin Authentication & Access Control

**User Story:** As a store admin, I want to log in with my admin credentials and access a protected dashboard, so that only authorized staff can manage the store.

#### Acceptance Criteria

1. WHEN an unauthenticated user visits any `/admin/*` route THEN the system SHALL redirect them to `/admin/login`
2. WHEN a user logs in with valid credentials THEN the system SHALL check `is_staff` flag from the Django API and grant access only if true
3. WHEN a non-staff user attempts to access `/admin/*` THEN the system SHALL redirect them to `/admin/login` with an "Access denied" message
4. WHEN an admin logs out THEN the system SHALL clear the auth token and redirect to `/admin/login`
5. IF the auth token is expired or invalid THEN the system SHALL redirect to `/admin/login`

---

### Requirement 2: Admin Dashboard Overview

**User Story:** As a store admin, I want to see a summary dashboard with key metrics, so that I can quickly understand the store's current status.

#### Acceptance Criteria

1. WHEN the admin visits `/admin` THEN the system SHALL display total orders count, total revenue, total products, and pending orders count
2. WHEN the admin views the dashboard THEN the system SHALL show a list of the 5 most recent orders
3. WHEN the admin views the dashboard THEN the system SHALL show low stock products (stock < 5)
4. WHEN the admin views the dashboard THEN the system SHALL show counts of pending return requests and bulk inquiries

---

### Requirement 3: Product Management

**User Story:** As a store admin, I want to list, create, edit, and delete products, so that I can keep the product catalog up to date.

#### Acceptance Criteria

1. WHEN the admin visits `/admin/products` THEN the system SHALL display a paginated table of all products with name, SKU, price, stock, category, and status flags
2. WHEN the admin searches or filters products THEN the system SHALL filter by name, category, or stock status in real time
3. WHEN the admin clicks "Add Product" THEN the system SHALL show a form to create a new product with all required fields (name, description, price, category, stock, images, flags)
4. WHEN the admin clicks "Edit" on a product THEN the system SHALL show a pre-filled form with existing product data
5. WHEN the admin submits a valid product form THEN the system SHALL save the product and show a success message
6. WHEN the admin clicks "Delete" on a product THEN the system SHALL ask for confirmation before deleting
7. WHEN the admin toggles flags (is_featured, is_best_seller, is_trending, is_new_arrival) THEN the system SHALL update the product immediately via API

---

### Requirement 4: Order Management

**User Story:** As a store admin, I want to view and manage all customer orders, so that I can process, update, and track them efficiently.

#### Acceptance Criteria

1. WHEN the admin visits `/admin/orders` THEN the system SHALL display a paginated table of all orders with order ID, customer name, total amount, payment status, order status, and date
2. WHEN the admin filters orders THEN the system SHALL support filtering by status (pending, confirmed, shipped, delivered, cancelled) and payment status
3. WHEN the admin clicks on an order THEN the system SHALL show full order details including items, shipping address, payment info, and Shiprocket sync status
4. WHEN the admin updates an order status THEN the system SHALL save the new status via API and reflect it immediately
5. WHEN the admin views an order with a shipment THEN the system SHALL show the AWB code and tracking link

---

### Requirement 5: Category Management

**User Story:** As a store admin, I want to manage product categories, so that I can organize the product catalog.

#### Acceptance Criteria

1. WHEN the admin visits `/admin/categories` THEN the system SHALL display all categories with name, slug, product count, and active status
2. WHEN the admin creates or edits a category THEN the system SHALL allow setting name, icon, description, and active status
3. WHEN the admin toggles a category's active status THEN the system SHALL update it immediately

---

### Requirement 6: Coupon Management

**User Story:** As a store admin, I want to create and manage discount coupons, so that I can run promotions for customers.

#### Acceptance Criteria

1. WHEN the admin visits `/admin/coupons` THEN the system SHALL display all coupons with code, discount type, value, validity dates, usage count, and active status
2. WHEN the admin creates a coupon THEN the system SHALL allow setting code, discount type (percentage/fixed), value, min order amount, validity dates, and usage limit
3. WHEN the admin deactivates a coupon THEN the system SHALL immediately prevent it from being used at checkout

---

### Requirement 7: Return Request Management

**User Story:** As a store admin, I want to review and process return/refund requests, so that I can handle customer issues promptly.

#### Acceptance Criteria

1. WHEN the admin visits `/admin/returns` THEN the system SHALL display all return requests with request ID, order ID, customer, reason, type, and current status
2. WHEN the admin opens a return request THEN the system SHALL show full details including order items, reason description, and status history
3. WHEN the admin updates a return request status THEN the system SHALL save the new status (approved, rejected, picked_up, refunded, completed)

---

### Requirement 8: User Management

**User Story:** As a store admin, I want to view registered users and their order history, so that I can manage customer accounts.

#### Acceptance Criteria

1. WHEN the admin visits `/admin/users` THEN the system SHALL display a list of all users with username, email, join date, and total orders count
2. WHEN the admin clicks on a user THEN the system SHALL show their profile, order history, and addresses
3. WHEN the admin searches for a user THEN the system SHALL filter by username or email

---

### Requirement 9: Bulk Inquiry Management

**User Story:** As a store admin, I want to view and manage bulk/corporate order inquiries, so that I can follow up with potential B2B customers.

#### Acceptance Criteria

1. WHEN the admin visits `/admin/bulk-inquiries` THEN the system SHALL display all bulk inquiries with company name, contact, quantity, and status
2. WHEN the admin opens an inquiry THEN the system SHALL show full details including product interest and budget range
3. WHEN the admin updates an inquiry status THEN the system SHALL save the new status (pending, contacted, quoted, converted, rejected)

---

### Requirement 10: Admin API Endpoints (Backend)

**User Story:** As a developer, I want dedicated admin API endpoints protected by staff-only permissions, so that the admin panel can securely read and write store data.

#### Acceptance Criteria

1. WHEN any admin API endpoint is called without a valid staff token THEN the system SHALL return 403 Forbidden
2. WHEN the admin API is called THEN the system SHALL use `IsAdminUser` or `is_staff` permission check on all admin routes
3. WHEN the admin requests dashboard stats THEN the system SHALL return aggregated counts and revenue from the database
4. WHEN the admin updates an order, product, category, coupon, or return request THEN the system SHALL validate the data and persist changes
5. WHEN the admin requests a list of any resource THEN the system SHALL support pagination, search, and filtering
