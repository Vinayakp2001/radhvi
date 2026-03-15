# Requirements Document

## Introduction

The Shiprocket shipping integration is already fully built (client, service, models, webhooks, background tasks). This spec covers the remaining work to wire it up end-to-end and make it production-ready: ensuring COD orders trigger sync, the Shiprocket webhook is reachable via the API router, and the integration can be validated with a real test order.

## Requirements

### Requirement 1: COD Order Shiprocket Sync

**User Story:** As a store operator, I want COD orders to automatically sync to Shiprocket after they are placed, so that shipments are created without requiring online payment confirmation.

#### Acceptance Criteria

1. WHEN a COD order is created with `payment_method = 'cod'` THEN the system SHALL set `payment_status = 'paid'` and `status = 'confirmed'` immediately upon order creation.
2. WHEN a COD order is confirmed THEN the system SHALL trigger `sync_order_to_shiprocket_task.delay(order.id)` asynchronously.
3. IF the Celery task fails THEN the system SHALL log the error without blocking the order creation response.

### Requirement 2: Shiprocket Webhook Accessible via API Router

**User Story:** As a store operator, I want the Shiprocket webhook endpoint to be accessible at `/api/webhooks/shiprocket/` (the same base path as other API endpoints), so that I can register a single consistent URL in the Shiprocket dashboard.

#### Acceptance Criteria

1. WHEN Shiprocket sends a POST request to `/api/webhooks/shiprocket/` THEN the system SHALL route it to the `shiprocket_webhook` handler.
2. The endpoint SHALL be registered in `gift/api/urls.py` so it is reachable under the `/api/` prefix used by the Next.js frontend router.
3. IF the endpoint is already registered in `gift/urls.py` at a different path THEN both paths SHALL remain functional to avoid breaking existing configuration.

### Requirement 3: Shipping Charge Calculated from Shiprocket Rates

**User Story:** As a customer, I want the shipping charge on my order to reflect the actual Shiprocket rate for my pincode, so that I am charged the correct amount.

#### Acceptance Criteria

1. WHEN a checkout is initiated with a `delivery_pincode` THEN the system SHALL attempt to fetch the shipping rate from Shiprocket for that pincode.
2. IF Shiprocket rates are available THEN the system SHALL use the best rate (based on `SHIPROCKET_COURIER_PREFERENCE`) as `shipping_charge` on the order.
3. IF Shiprocket rates are unavailable or the API call fails THEN the system SHALL fall back to the default shipping charge (₹50) and log a warning.
4. IF a `courier_id` is provided in the checkout request THEN the system SHALL use the rate for that specific courier.

### Requirement 4: Order Tracking Endpoint

**User Story:** As a customer, I want to check the live tracking status of my order via the API, so that I can see where my shipment is without visiting a third-party site.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/orders/<order_id>/tracking/` THEN the system SHALL return the current shipment status, AWB code, courier name, and tracking history.
2. IF the order has no shipment or no AWB code THEN the system SHALL return a response indicating tracking is not yet available.
3. WHEN tracking data is fetched THEN the system SHALL return cached data if it was updated within the last 30 minutes, otherwise refresh from Shiprocket.
