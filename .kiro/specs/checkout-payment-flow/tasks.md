# Implementation Plan

## Note: Shiprocket Integration Already Complete ✅
The Shiprocket shipping integration is 100% implemented. All shipping-related tasks (rate calculation, order sync, tracking, webhooks) are already functional. This plan focuses only on what needs to be built.

---

- [x] 1. Set up Razorpay and verify Order model



  - Install razorpay Python package
  - Add Razorpay credentials to settings (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
  - Verify Order model has razorpay_order_id, razorpay_payment_id, razorpay_signature fields
  - Verify Order model has courier_id field for storing selected courier
  - _Requirements: 1.1, 1.2, 4.1_

- [x] 2. Create Address model for reusable shipping addresses



  - [x] 2.1 Create Address model



    - Define Address model with fields (user, name, phone, address, city, state, pincode, country, is_default)
    - Add ForeignKey to User model
    - Add validation for pincode format (6 digits)
    - Add method to set as default (unset others)
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Create Address serializer



    - Write AddressSerializer with all fields
    - Add validation for required fields
    - Add custom validation for pincode
    - _Requirements: 2.1_

  - [x] 2.3 Create Address API endpoints


    - Implement list addresses endpoint (GET /api/addresses/)
    - Implement create address endpoint (POST /api/addresses/)
    - Implement update address endpoint (PUT /api/addresses/{id}/)
    - Implement delete address endpoint (DELETE /api/addresses/{id}/)
    - Implement set default endpoint (POST /api/addresses/{id}/set-default/)
    - Add authentication requirement
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.4 Create migrations and register in admin



    - Create and run migrations for Address model
    - Register Address model in Django admin
    - Add AddressInline to User admin
    - _Requirements: 2.1_

- [x] 3. Implement Razorpay payment integration (Backend)



  - [x] 3.1 Create Razorpay service class



    - Create payment/razorpay_service.py file
    - Implement RazorpayService class with client initialization
    - Write create_order() method to create Razorpay order
    - Write verify_payment() method with signature verification
    - Add error handling for Razorpay API errors
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.2 Create payment serializers


    - Write CheckoutSerializer for checkout initiation
    - Write PaymentVerificationSerializer for payment verification
    - Add validation for required fields
    - _Requirements: 4.1, 4.2_

  - [x] 3.3 Create checkout initiation endpoint


    - Implement POST /api/checkout/initiate/ endpoint
    - Validate cart has items
    - Calculate order total (cart subtotal + shipping)
    - Create Razorpay order
    - Create Order record with status='pending', payment_status='pending'
    - Return Razorpay order_id and order details
    - _Requirements: 1.1, 1.2, 4.1, 4.2_

  - [x] 3.4 Create payment verification endpoint

    - Implement POST /api/checkout/verify-payment/ endpoint
    - Verify Razorpay signature
    - Update Order with payment details (razorpay_payment_id, razorpay_signature)
    - Update Order status to 'confirmed', payment_status to 'paid'
    - Clear user's cart
    - Trigger Shiprocket sync task (use existing sync_order_to_shiprocket_task)
    - Return order confirmation details
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 3.5 Create payment failure handler

    - Implement POST /api/checkout/payment-failed/ endpoint
    - Update Order payment_status to 'failed'
    - Log failure reason
    - Return error details
    - _Requirements: 4.4, 9.1_

- [x] 4. Create shipping rate endpoint (wrapper around existing Shiprocket service)



  - Implement POST /api/checkout/shipping-rates/ endpoint
  - Accept delivery_pincode and cod flag
  - Get cart items for weight calculation
  - Call existing ShippingService.get_shipping_rates() method
  - Return formatted courier options with rates
  - Handle serviceability errors gracefully
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Implement Order API endpoints



  - [x] 5.1 Create Order serializers

    - Write OrderListSerializer for order list view
    - Write OrderDetailSerializer with nested items and shipment
    - Write OrderItemSerializer for order items
    - Include shipment tracking data in detail serializer
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Create order list endpoint

    - Implement GET /api/orders/ endpoint
    - Filter by authenticated user
    - Add pagination (10 orders per page)
    - Order by created_at descending
    - Include basic order info and status
    - _Requirements: 5.1, 5.2_

  - [x] 5.3 Create order detail endpoint

    - Implement GET /api/orders/{order_id}/ endpoint
    - Return full order details with items
    - Include shipment tracking info if available
    - Include customer and shipping address
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.4 Create order cancellation endpoint

    - Implement POST /api/orders/{order_id}/cancel/ endpoint
    - Validate order can be cancelled (status in ['pending', 'confirmed'])
    - Update Order status to 'cancelled'
    - If synced to Shiprocket, call existing cancel_shipment() method
    - Initiate refund if payment was made
    - _Requirements: 7.1, 7.2_

- [x] 6. Implement email notifications

  - [x] 6.1 Create email templates

    - Create order_confirmation.html email template
    - Create order_shipped.html email template
    - Create order_delivered.html email template
    - Include order details, items, and tracking info
    - _Requirements: 8.1, 8.2_

  - [x] 6.2 Create email service

    - Create notifications/email_service.py file
    - Write send_order_confirmation_email() function
    - Write send_order_shipped_email() function
    - Write send_order_delivered_email() function
    - Add error handling for email failures
    - _Requirements: 8.1, 8.2_

  - [x] 6.3 Integrate email notifications

    - Send order confirmation email after payment verification
    - Send shipped email when shipment AWB is generated
    - Send delivered email from webhook handler (already has notification hook)
    - _Requirements: 8.1, 8.2_

- [x] 7. Build frontend checkout page


  - [x] 7.1 Create checkout page component


    - Create frontend/src/app/checkout/page.tsx
    - Implement multi-step checkout UI (Address → Shipping → Payment)
    - Add form validation
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 7.2 Implement address step


    - Display saved addresses for logged-in users
    - Add "Add New Address" form
    - Allow selecting existing address
    - Support guest checkout with address form
    - Validate pincode format
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 7.3 Implement shipping method selection


    - Fetch shipping rates from API when pincode entered
    - Display courier options with rates and delivery times
    - Allow selecting shipping method
    - Update order total with shipping charge
    - Handle "delivery not available" scenario
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.4 Implement order summary


    - Display cart items with quantities and prices
    - Show subtotal, shipping charge, discount, and total
    - Add "Place Order" button
    - _Requirements: 1.1, 1.2_

  - [x] 7.5 Integrate Razorpay payment


    - Load Razorpay SDK script
    - Call checkout initiation API
    - Open Razorpay payment modal
    - Handle payment success callback
    - Call payment verification API
    - Handle payment failure
    - Redirect to order confirmation on success
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Build frontend order pages


  - [x] 8.1 Create order confirmation page


    - Create frontend/src/app/orders/[orderId]/confirmation/page.tsx
    - Display order success message
    - Show order details and items
    - Display estimated delivery date
    - Add "Track Order" and "Continue Shopping" buttons
    - _Requirements: 1.3, 5.1_

  - [x] 8.2 Create order history page


    - Create frontend/src/app/orders/page.tsx
    - Fetch and display user's orders
    - Show order status badges
    - Add pagination
    - Link to order detail page
    - _Requirements: 5.1, 5.2_

  - [x] 8.3 Create order detail page


    - Create frontend/src/app/orders/[orderId]/page.tsx
    - Display full order information
    - Show order items with images
    - Display shipping address
    - Show payment information
    - Include shipment tracking timeline if available
    - Add "Cancel Order" button (if eligible)
    - Add "Track Shipment" button (if shipped)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.4 Create order tracking page


    - Create frontend/src/app/orders/[orderId]/track/page.tsx
    - Display shipment status timeline
    - Show AWB code and courier name
    - Display tracking scans with timestamps
    - Show estimated delivery date
    - Add "Download Invoice" button
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 9. Create address management UI


  - [x] 9.1 Create address list component


    - Create frontend/src/components/AddressList.tsx
    - Display saved addresses as cards
    - Show default address badge
    - Add edit and delete buttons
    - _Requirements: 2.1, 2.2_

  - [x] 9.2 Create address form component


    - Create frontend/src/components/AddressForm.tsx
    - Implement form with all address fields
    - Add validation
    - Support create and edit modes
    - _Requirements: 2.1, 2.2_

  - [x] 9.3 Create address management page


    - Create frontend/src/app/account/addresses/page.tsx
    - Display AddressList component
    - Add "Add New Address" button
    - Implement edit and delete functionality
    - Allow setting default address
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 10. Add order management to account page



  - Update frontend/src/app/account/page.tsx
  - Add "My Orders" section with recent orders
  - Add "Manage Addresses" link
  - Display order statistics (total orders, pending, delivered)
  - _Requirements: 5.1, 5.2_

- [ ] 11. Testing and validation
  - [ ] 11.1 Test complete checkout flow
    - Test guest checkout with new address
    - Test logged-in user checkout with saved address
    - Test shipping rate calculation for different pincodes
    - Test Razorpay payment success flow
    - Test Razorpay payment failure handling
    - Verify order creation and Shiprocket sync
    - _Requirements: All_

  - [ ] 11.2 Test order management
    - Test order list pagination
    - Test order detail display
    - Test order cancellation
    - Test tracking page display
    - _Requirements: 5.1, 5.2, 7.1_

  - [ ] 11.3 Test address management
    - Test creating new address
    - Test editing address
    - Test deleting address
    - Test setting default address
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 11.4 Test email notifications
    - Verify order confirmation email sent
    - Verify shipped notification email
    - Verify delivered notification email
    - Check email template rendering
    - _Requirements: 8.1, 8.2_

  - [ ] 11.5 Test Shiprocket integration
    - Verify order syncs to Shiprocket after payment
    - Verify shipment creation with AWB
    - Verify webhook updates order status
    - Verify tracking data updates
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. Security and error handling
  - [ ] 12.1 Add security measures
    - Implement rate limiting on payment endpoints
    - Add CSRF protection
    - Validate Razorpay signatures properly
    - Sanitize user inputs
    - _Requirements: 9.1, 9.2_

  - [ ] 12.2 Add comprehensive error handling
    - Handle Razorpay API errors gracefully
    - Handle Shiprocket sync failures (already has retry logic)
    - Add user-friendly error messages
    - Log errors for debugging
    - _Requirements: 9.1, 9.2_

  - [ ] 12.3 Add loading states and feedback
    - Add loading spinners during API calls
    - Show success/error toast notifications
    - Disable buttons during processing
    - Add progress indicators for checkout steps
    - _Requirements: 1.3, 4.4_

- [ ] 13. Documentation and deployment
  - [ ] 13.1 Create API documentation
    - Document all checkout and order endpoints
    - Include request/response examples
    - Document error codes and messages
    - _Requirements: All_

  - [ ] 13.2 Create deployment checklist
    - Add Razorpay credentials to production environment
    - Verify Shiprocket configuration (already done)
    - Configure email settings
    - Set up SSL for payment security
    - Test payment flow in production
    - _Requirements: All_

  - [ ] 13.3 Create user guide
    - Document checkout process for customers
    - Explain order tracking
    - Document address management
    - Add FAQ section
    - _Requirements: All_
