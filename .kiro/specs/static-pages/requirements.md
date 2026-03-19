# Requirements Document

## Introduction

Radhvi's footer and navigation link to several pages that don't exist yet, causing 404 errors across the site. Additionally, the `OccasionCard` component references a `/placeholder-occasion.jpg` image that doesn't exist in the `public/` folder, causing a 400 error from `next/image`. This spec covers building all missing static/informational pages and fixing the broken image reference.

The pages needed are:
- **Shop:** `/new-arrivals`
- **Customer Service:** `/contact`, `/faq`, `/shipping`, `/returns`, `/track-order`
- **Company:** `/about`, `/story`, `/careers`, `/bulk-orders`
- **Legal:** `/privacy`, `/terms`, `/refund-policy`

All pages should match the existing Radhvi design system (Tailwind, red primary color, `container-custom` layout, shared Header/Footer).

## Requirements

### Requirement 1: Fix Broken Placeholder Image

**User Story:** As a visitor, I want the Occasions section on the homepage to load without errors, so that I don't see broken images or console errors.

#### Acceptance Criteria

1. WHEN an occasion has no image THEN the `OccasionCard` SHALL render a styled fallback (gradient background with an icon) instead of passing a broken path to `next/image`.
2. WHEN `/placeholder-occasion.jpg` is referenced THEN the system SHALL NOT make a failing request to `next/image` for a non-existent file.

### Requirement 2: New Arrivals Page

**User Story:** As a shopper, I want to browse new arrivals at `/new-arrivals`, so that I can discover the latest products added to the store.

#### Acceptance Criteria

1. WHEN a user visits `/new-arrivals` THEN the system SHALL display products filtered by `is_new_arrival=true` from the API.
2. WHEN no new arrivals exist THEN the system SHALL display an empty state with a link to all products.
3. WHEN the page loads THEN it SHALL include the shared Header and Footer.

### Requirement 3: Contact Page

**User Story:** As a customer, I want to reach Radhvi at `/contact`, so that I can ask questions or get support.

#### Acceptance Criteria

1. WHEN a user visits `/contact` THEN the system SHALL display contact information (email, phone, WhatsApp, address) and a contact form.
2. WHEN a user submits the contact form THEN the system SHALL show a success confirmation message.
3. WHEN the form is submitted with missing required fields THEN the system SHALL show inline validation errors.

### Requirement 4: FAQ Page

**User Story:** As a customer, I want to read answers to common questions at `/faq`, so that I can resolve my queries without contacting support.

#### Acceptance Criteria

1. WHEN a user visits `/faq` THEN the system SHALL display an accordion of frequently asked questions grouped by category (Orders, Shipping, Returns, Payments).
2. WHEN a user clicks a question THEN the answer SHALL expand/collapse smoothly.

### Requirement 5: Shipping & Delivery Page

**User Story:** As a customer, I want to understand shipping policies at `/shipping`, so that I know when to expect my order.

#### Acceptance Criteria

1. WHEN a user visits `/shipping` THEN the system SHALL display shipping timelines, charges, free shipping threshold, and courier partners.
2. The page SHALL include a table or card layout showing delivery estimates by region.

### Requirement 6: Returns & Exchanges Page

**User Story:** As a customer, I want to understand the return policy at `/returns`, so that I know my options if something goes wrong.

#### Acceptance Criteria

1. WHEN a user visits `/returns` THEN the system SHALL display the return window, eligible items, process steps, and refund timeline.
2. The page SHALL include a step-by-step return process guide.

### Requirement 7: Track Order Page

**User Story:** As a customer, I want to track my order at `/track-order`, so that I can check delivery status without logging in.

#### Acceptance Criteria

1. WHEN a user visits `/track-order` THEN the system SHALL display a form to enter an order ID.
2. WHEN a logged-in user visits `/track-order` THEN the system SHALL redirect them to `/orders` where they can see all their orders.
3. WHEN an order ID is submitted THEN the system SHALL redirect to `/orders/{orderId}` if the user is authenticated, or show a prompt to log in.

### Requirement 8: About Us Page

**User Story:** As a visitor, I want to learn about Radhvi at `/about`, so that I can understand the brand's mission and values.

#### Acceptance Criteria

1. WHEN a user visits `/about` THEN the system SHALL display the brand story, mission, values, and team section.
2. The page SHALL include a CTA linking to the shop.

### Requirement 9: Our Story Page

**User Story:** As a visitor, I want to read Radhvi's founding story at `/story`, so that I can connect with the brand.

#### Acceptance Criteria

1. WHEN a user visits `/story` THEN the system SHALL display a narrative about how Radhvi was founded, its journey, and vision.
2. The page SHALL be visually rich with sections and imagery.

### Requirement 10: Careers Page

**User Story:** As a job seeker, I want to see open positions at `/careers`, so that I can apply to work at Radhvi.

#### Acceptance Criteria

1. WHEN a user visits `/careers` THEN the system SHALL display current openings (or a "no openings" message) and a general application CTA.
2. The page SHALL include company culture highlights.

### Requirement 11: Bulk Orders Page

**User Story:** As a corporate buyer, I want to inquire about bulk orders at `/bulk-orders`, so that I can place large gift orders for my company.

#### Acceptance Criteria

1. WHEN a user visits `/bulk-orders` THEN the system SHALL display bulk order benefits and an inquiry form (company name, contact, quantity, requirements).
2. WHEN the form is submitted THEN the system SHALL show a confirmation and optionally POST to a backend endpoint.
3. WHEN the form has missing required fields THEN the system SHALL show inline validation errors.

### Requirement 12: Legal Pages

**User Story:** As a customer or regulator, I want to read Radhvi's legal policies at `/privacy`, `/terms`, and `/refund-policy`, so that I understand my rights and the company's obligations.

#### Acceptance Criteria

1. WHEN a user visits `/privacy` THEN the system SHALL display the Privacy Policy with sections covering data collection, usage, and rights.
2. WHEN a user visits `/terms` THEN the system SHALL display Terms & Conditions covering usage, orders, and liability.
3. WHEN a user visits `/refund-policy` THEN the system SHALL display the Refund Policy covering eligibility, process, and timelines.
4. All legal pages SHALL display a "Last updated" date.
