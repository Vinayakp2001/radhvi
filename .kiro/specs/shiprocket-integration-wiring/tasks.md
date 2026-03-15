# Implementation Plan

- [x] 1. Register Shiprocket webhook in the API router



  - Add `shiprocket_webhook` import and URL pattern to `gift/api/urls.py`
  - Path: `webhooks/shiprocket/` — mirrors the existing registration in `gift/urls.py`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Add COD support to checkout and wire Shiprocket sync




- [x] 2.1 Add `payment_method` field to `CheckoutSerializer`

  - Add `payment_method = serializers.ChoiceField(choices=['phonepe', 'cod'], default='phonepe')` to `CheckoutSerializer` in `gift/api/serializers.py`
  - _Requirements: 1.1_

- [x] 2.2 Handle COD flow in `initiate_checkout` view


  - In `gift/api/views.py`, after order creation, branch on `payment_method`
  - For `cod`: set `order.payment_status = 'paid'`, `order.status = 'confirmed'`, `order.payment_method = 'cod'`, save, then call `sync_order_to_shiprocket_task.delay(order.id)`, return order confirmation response (no PhonePe URL)
  - For online payment: existing PhonePe flow unchanged
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Replace hardcoded shipping charge with live Shiprocket rates



  - In `initiate_checkout`, before order creation, call `ShippingService().get_shipping_rates(cart_items, pincode, cod)` 
  - Use `calculate_best_rate()` to pick the rate; if `courier_id` was passed in the request, find the matching rate from the list
  - Fall back to `Decimal('50')` and log a warning if rates are unavailable or the call raises an exception
  - Store the selected `courier_id` on the order
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Add order tracking API endpoint




- [x] 4.1 Implement `get_order_tracking` view in `gift/api/views.py`

  - `GET /api/orders/<order_id>/tracking/` — authenticated users only
  - Fetch `Order` by `order_id` scoped to `request.user`
  - If no shipment or no AWB: return `{"tracking_available": false}`
  - Otherwise call `ShippingService().get_tracking_info(shipment)` and return the result with `awb_code`, `courier_name`, `status`, `scans`, `estimated_delivery_date`, `last_updated`
  - _Requirements: 4.1, 4.2, 4.3_


- [-] 4.2 Register tracking URL in `gift/api/urls.py`

  - Add `path('orders/<str:order_id>/tracking/', get_order_tracking, name='order-tracking')` and import the view
  - _Requirements: 4.1_
