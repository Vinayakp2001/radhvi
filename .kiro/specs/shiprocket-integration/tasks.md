# Implementation Plan

- [x] 1. Project setup and dependencies



  - Install required Python packages (requests, celery, redis, django-celery-beat)
  - Configure Redis for caching and Celery broker
  - Add Shiprocket configuration to settings.py
  - Create shipping app directory structure
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create database models and migrations






- [x] 2.1 Create Shipment model

  - Define Shipment model with all fields (shiprocket_order_id, awb_code, courier details, status, tracking_data)
  - Add relationship to Order model (OneToOne)

  - Create database indexes for performance


  - _Requirements: 2.1, 2.2, 2.5_



- [x] 2.2 Create ShippingRate cache model

  - Define ShippingRate model for caching courier rates



  - Add composite index on (pickup_pincode, delivery_pincode, weight)
  - Implement cache expiry logic
  - _Requirements: 3.1, 3.5, 10.5_






- [x] 2.3 Create WebhookLog model


  - Define WebhookLog model for audit trail
  - Add fields for event_type, payload, processed status

  - _Requirements: 6.1, 6.5, 9.2_


- [x] 2.4 Extend Order model

  - Add shiprocket_synced boolean field to Order model
  - Add shiprocket_sync_error text field for error messages
  - Create and run migrations
  - _Requirements: 2.1, 2.4_

- [x] 3. Implement Shiprocket API client



- [x] 3.1 Create ShiprocketClient class structure


  - Create shiprocket_client.py file
  - Implement __init__ with configuration loading
  - Define custom exception classes (AuthenticationError, RateLimitError, etc.)
  - _Requirements: 1.1, 1.2, 9.1_

- [x] 3.2 Implement authentication methods


  - Write authenticate() method to get token from Shiprocket
  - Implement token caching with expiry
  - Write refresh_token() method for automatic token renewal
  - Add _ensure_authenticated() helper method
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3.3 Implement order management methods


  - Write create_order() method with payload formatting
  - Implement get_order() method for fetching order details
  - Write cancel_order() method
  - _Requirements: 2.1, 2.2, 7.1_

- [x] 3.4 Implement shipping rate methods


  - Write get_courier_serviceability() method
  - Add pincode validation
  - Implement weight and dimension calculations
  - _Requirements: 3.1, 3.2, 3.6_

- [x] 3.5 Implement shipment management methods


  - Write create_shipment() method
  - Implement generate_awb() method
  - Write generate_label() method
  - Add generate_manifest() method
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3.6 Implement tracking methods


  - Write track_shipment() method by AWB
  - Implement track_by_order_id() method
  - Parse and format tracking response data
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 3.7 Implement return management methods


  - Write create_return() method
  - Implement schedule_pickup() method
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 3.8 Add error handling and retry logic


  - Implement _make_request() with retry logic
  - Add exponential backoff for rate limiting
  - Write _handle_error() for different error types
  - Add request/response logging
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1_

- [ ] 3.9 Write unit tests for ShiprocketClient
  - Test authentication flow with mocked responses
  - Test all API methods with success and failure scenarios
  - Test retry logic and error handling
  - Test token refresh mechanism
  - _Requirements: 1.3, 9.1, 9.2_
  - **STATUS**: Implementation complete, tests pending



- [x] 4. Implement shipping service layer






- [x] 4.1 Create ShippingService class


  - Create services.py file
  - Initialize ShippingService with ShiprocketClient instance
  - Add helper methods for data transformation
  - _Requirements: 2.1, 3.1, 4.1_

- [x] 4.2 Implement order synchronization


  - Write sync_order_to_shiprocket() method
  - Implement _prepare_order_payload() helper
  - Add validation for required order fields
  - Handle order items transformation
  - Create Shipment record on success
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4.3 Implement shipping rate calculation


  - Write get_shipping_rates() method
  - Implement _calculate_package_weight() from cart items
  - Write _get_package_dimensions() helper
  - Add rate caching logic
  - Implement calculate_best_rate() with preference logic
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 4.4 Implement shipment creation workflow


  - Write create_shipment_for_order() method
  - Implement _prepare_shipment_payload() helper
  - Add courier selection logic
  - Generate AWB and label
  - Update Shipment model with results
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.5 Implement tracking functionality


  - Write get_tracking_info() method
  - Implement update_shipment_status() method
  - Parse tracking scans and format for display
  - Update Order status based on shipment status
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 4.6 Implement return management


  - Write create_return_shipment() method
  - Integrate with ReturnRequest model
  - Schedule pickup for returns
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4.7 Implement cancellation logic


  - Write cancel_shipment() method
  - Update Order and Shipment status
  - Handle cancellation errors
  - _Requirements: 7.1, 7.5_

- [ ] 4.8 Write unit tests for ShippingService
  - Test order sync with mocked client
  - Test rate calculation logic
  - Test shipment creation workflow
  - Test tracking updates
  - _Requirements: 2.1, 3.1, 4.1, 5.1_
  - **STATUS**: Implementation complete, tests pending

- [x] 5. Implement webhook integration





- [x] 5.1 Create webhook endpoint view

  - Create webhooks.py file
  - Implement shiprocket_webhook() view function
  - Add CSRF exemption
  - Add URL routing for /api/webhooks/shiprocket/
  - _Requirements: 6.1, 6.6_



- [x] 5.2 Implement webhook signature verification

  - Write _verify_signature() method
  - Use HMAC for signature validation
  - Log verification failures

  - _Requirements: 6.1, 6.5_

- [x] 5.3 Create WebhookHandler class

  - Implement event routing logic
  - Write handle_order_status_update() method
  - Write handle_shipment_status_update() method
  - Write handle_delivery_completed() method
  - Write handle_return_initiated() method
  - _Requirements: 6.2, 6.3, 6.4_




- [x] 5.4 Implement webhook logging

  - Log all webhook events to WebhookLog model
  - Store payload and processing status
  - Add error logging
  - _Requirements: 6.5, 9.2_


- [x] 5.5 Add customer notifications

  - Write _send_customer_notification() helper
  - Send email on status changes
  - Create notification templates
  - _Requirements: 6.4, 8.1_

- [ ] 5.6 Write tests for webhook handlers
  - Test signature verification
  - Test event routing
  - Test database updates from webhooks
  - Test notification triggers
  - _Requirements: 6.1, 6.2, 6.3_
  - **STATUS**: Implementation complete, tests pending

- [x] 6. Implement Celery async tasks




- [x] 6.1 Create Celery tasks file

  - Create tasks.py file
  - Configure Celery app in project
  - Add task decorators and error handling
  - _Requirements: 10.4, 10.6_



- [x] 6.2 Implement order sync task

  - Write sync_order_to_shiprocket_task()
  - Add retry logic with exponential backoff
  - Handle task failures and logging

  - _Requirements: 2.3, 2.4, 9.3, 10.4_

- [x] 6.3 Implement tracking update tasks

  - Write update_shipment_tracking_task() for single shipment
  - Write update_all_shipments_tracking() for batch updates
  - Add periodic task scheduling
  - _Requirements: 5.2, 5.3, 10.4_


- [x] 6.4 Implement batch operations tasks

  - Write generate_shipping_labels_batch() task
  - Write sync_pending_orders() retry task
  - Add rate cache refresh task
  - _Requirements: 4.5, 10.4_


- [x] 6.5 Configure Celery Beat schedule



  - Add periodic task schedules to settings
  - Configure tracking updates (every 2 hours)
  - Configure rate cache refresh (every 6 hours)
  - Configure retry failed syncs (every 30 minutes)
  - _Requirements: 10.4, 10.6_

- [ ] 6.6 Write tests for Celery tasks
  - Test task execution with mocked services
  - Test retry logic
  - Test periodic task scheduling
  - _Requirements: 10.4_
  - **STATUS**: Implementation complete, tests pending



- [x] 7. Integrate with checkout flow




- [x] 7.1 Add shipping rate calculation to checkout view

  - Modify checkout() view to fetch shipping rates when pincode is entered
  - Calculate cart weight and dimensions from cart items
  - Call ShippingService.get_shipping_rates() method
  - Pass rates to checkout template context
  - Cache rates for performance
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 7.2 Update checkout template

  - Add shipping method selection UI with radio buttons
  - Display courier options with rates and delivery times
  - Show "Delivery not available" message if no rates found
  - Update total calculation with selected shipping rate
  - _Requirements: 3.3, 3.4_


- [x] 7.3 Modify order creation to include courier selection

  - Store selected courier_id in Order model
  - Update shipping_charge based on selected rate
  - Trigger sync_order_to_shiprocket_task after payment confirmation
  - Handle COD vs Prepaid payment methods
  - _Requirements: 2.1, 2.6, 3.3_

- [x] 8. Create order tracking interface




- [x] 8.1 Create tracking view

  - Implement order_tracking() view function
  - Fetch shipment and tracking data from database
  - Call ShippingService.get_tracking_info() to refresh data
  - Format tracking scans for timeline display
  - Pass data to template context
  - _Requirements: 5.1, 5.2, 5.6_


- [x] 8.2 Create tracking template

  - Design tracking timeline UI with status progression
  - Display AWB code and courier information
  - Show estimated delivery date
  - Add tracking scan history with timestamps and locations
  - Style with CSS for visual timeline
  - _Requirements: 5.6, 8.1_



- [ ] 8.3 Add tracking link to order pages
  - Add "Track Order" button to order detail page
  - Add tracking status column to order history table
  - Display current shipment status badge
  - Link to tracking page from order detail
  - _Requirements: 5.1, 5.6, 8.1_

- [x] 9. Implement admin interface




- [x] 9.1 Create Shipment admin

  - Register Shipment model in admin
  - Configure list display with key fields
  - Add filters for status and sync_status
  - Add search by AWB and order ID
  - _Requirements: 8.1, 8.2, 8.4_


- [x] 9.2 Add admin actions

  - Implement sync_to_shiprocket() admin action
  - Add generate_labels() bulk action
  - Add update_tracking() action
  - Implement download_labels() action
  - _Requirements: 8.2, 8.5_



- [x] 9.3 Create Shipment inline for Order admin

  - Add ShipmentInline to Order admin
  - Display shipment details in order page
  - Add quick links to label and tracking

  - _Requirements: 8.1, 8.3_




- [x] 9.4 Add custom admin views

  - Create shipping dashboard view
  - Display pending syncs and failed orders
  - Show courier performance metrics
  - Add bulk operations page
  - _Requirements: 8.1, 8.5_

- [ ] 10. Add notification system
- [ ] 10.1 Create email templates
  - Design order shipped notification email
  - Create out for delivery notification template
  - Design delivered confirmation email
  - Add return pickup scheduled template
  - _Requirements: 6.4, 8.1_

- [ ] 10.2 Implement notification triggers
  - Send email when shipment is created
  - Notify on status changes via webhook
  - Send delivery confirmation
  - Trigger review request after delivery
  - _Requirements: 6.4, 8.1_

- [ ] 10.3 Add SMS notifications (optional)
  - Integrate SMS gateway
  - Send tracking updates via SMS
  - Add SMS preferences to user profile
  - _Requirements: 6.4_

- [ ] 11. Implement error handling and logging
- [ ] 11.1 Configure logging
  - Add Shiprocket logger to settings
  - Configure file handler with rotation
  - Set appropriate log levels
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 11.2 Add error monitoring
  - Log all API errors with context
  - Track sync failures
  - Monitor webhook processing errors
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 11.3 Implement admin notifications
  - Send email alerts for critical errors
  - Notify on repeated sync failures
  - Alert on webhook processing issues
  - _Requirements: 9.4, 9.5_

- [ ] 12. Performance optimization
- [ ] 12.1 Implement caching strategy
  - Cache authentication tokens
  - Cache shipping rates with TTL
  - Cache tracking data
  - Add cache invalidation logic
  - _Requirements: 3.5, 10.2, 10.5_

- [ ] 12.2 Optimize database queries
  - Add select_related for order-shipment queries
  - Use prefetch_related for order items
  - Add database indexes
  - Optimize tracking history queries
  - _Requirements: 10.6_

- [ ] 12.3 Implement batch operations
  - Batch label generation
  - Bulk tracking updates
  - Batch webhook processing
  - _Requirements: 10.4, 10.6_



- [ ] 13. Security implementation
- [ ] 13.1 Secure API credentials
  - Move credentials to environment variables
  - Add validation for required settings
  - Implement credential rotation support
  - _Requirements: 1.1, 1.4_

- [ ] 13.2 Implement webhook security
  - Add signature verification
  - Implement rate limiting on webhook endpoint
  - Log suspicious webhook attempts
  - _Requirements: 6.1, 6.5_

- [ ] 13.3 Secure sensitive data
  - Mask PII in logs
  - Sanitize error messages
  - Secure label PDF access
  - _Requirements: 9.5_

- [ ] 14. Testing and validation
- [ ] 14.1 Create test fixtures
  - Create sample order data
  - Mock Shiprocket API responses
  - Create webhook payload samples
  - _Requirements: All_

- [ ] 14.2 Write integration tests
  - Test end-to-end order sync flow
  - Test rate calculation with real pincodes
  - Test shipment creation workflow
  - Test webhook processing
  - _Requirements: All_
  - **STATUS**: Core functionality complete, integration tests pending

- [ ] 14.3 Perform manual testing
  - Test order sync after payment
  - Verify rate calculation at checkout
  - Test shipment creation from admin
  - Validate tracking page display
  - Test webhook updates
  - _Requirements: All_
  - **STATUS**: Ready for manual testing, all components implemented

- [ ] 15. Documentation and deployment
- [ ] 15.1 Create deployment documentation
  - Document installation steps
  - List all dependencies
  - Provide configuration guide
  - Add troubleshooting section
  - _Requirements: All_

- [ ] 15.2 Create user documentation
  - Document admin workflows
  - Create shipping process guide
  - Add FAQ section
  - Document common issues and solutions
  - _Requirements: 8.1, 8.2_

- [ ] 15.3 Configure production environment
  - Set up Redis server
  - Configure Celery workers
  - Set up Celery beat scheduler
  - Configure webhook URL in Shiprocket
  - _Requirements: 1.1, 6.6, 10.1_

- [ ] 15.4 Deploy to production
  - Run migrations
  - Deploy code changes
  - Start background services
  - Verify webhook connectivity
  - Monitor initial orders
  - _Requirements: All_

- [ ] 15.5 Post-deployment validation
  - Create test order and verify sync
  - Check webhook reception
  - Validate tracking updates
  - Monitor error logs
  - Verify email notifications
  - _Requirements: All_
