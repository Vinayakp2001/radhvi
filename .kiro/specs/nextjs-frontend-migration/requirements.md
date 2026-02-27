# Next.js Frontend Migration - Requirements

## Introduction

Migrate the Radhvi gift store from Django templates to a modern Next.js frontend while keeping the Django backend for data, auth, and admin. This will be done feature-by-feature to minimize risk and maintain site availability.

## Requirements

### Requirement 1: Maintain Current Functionality

**User Story:** As a site owner, I want the current site to remain fully functional during migration, so that customers can continue shopping without interruption.

#### Acceptance Criteria

1. WHEN migration begins THEN existing Django site SHALL continue to serve all pages
2. WHEN new Next.js pages are deployed THEN old Django pages SHALL remain accessible as fallback
3. IF Next.js frontend fails THEN system SHALL automatically serve Django templates
4. WHEN APIs are added THEN existing Django views SHALL continue to work unchanged

### Requirement 2: Homepage Migration (Phase 1)

**User Story:** As a customer, I want to see a modern, fast homepage with all gift categories and deals, so that I can easily find products.

#### Acceptance Criteria

1. WHEN visiting homepage THEN system SHALL display announcement bar with configurable message
2. WHEN viewing hero section THEN system SHALL show heading, subheading, and CTA buttons
3. WHEN scrolling homepage THEN system SHALL display "Shop by Occasion" grid with 4-8 occasion cards
4. WHEN viewing bestsellers THEN system SHALL show horizontal slider of product cards
5. WHEN viewing featured product THEN system SHALL highlight one product with image, price, and CTA
6. WHEN reading about section THEN system SHALL display company story with image
7. WHEN viewing blog preview THEN system SHALL show latest 3 blog posts
8. WHEN reading testimonials THEN system SHALL display customer reviews in slider/grid
9. WHEN reaching footer THEN system SHALL show navigation links, newsletter signup, and contact info
10. WHEN using mobile device THEN all sections SHALL be responsive and mobile-optimized

### Requirement 3: API Layer for Homepage

**User Story:** As a developer, I want Django to expose JSON APIs for homepage data, so that Next.js can fetch and display content.

#### Acceptance Criteria

1. WHEN Next.js requests occasions THEN API SHALL return list of occasions with name, slug, image, tagline
2. WHEN Next.js requests bestsellers THEN API SHALL return products flagged as bestsellers
3. WHEN Next.js requests featured product THEN API SHALL return one highlighted product
4. WHEN Next.js requests blog posts THEN API SHALL return latest 3 posts with title, excerpt, date
5. WHEN Next.js requests testimonials THEN API SHALL return active testimonials with name, city, text, tag
6. WHEN API is called from localhost:3000 THEN CORS headers SHALL allow the request
7. WHEN API encounters error THEN system SHALL return appropriate HTTP status and error message

### Requirement 4: Reusable Components

**User Story:** As a developer, I want reusable React components, so that I can maintain consistency and reduce code duplication.

#### Acceptance Criteria

1. WHEN displaying product THEN ProductCard component SHALL show image, title, price, rating, wishlist icon
2. WHEN product has discount THEN ProductCard SHALL display "Save X%" badge
3. WHEN product is bestseller THEN ProductCard SHALL display "Bestseller" badge
4. WHEN displaying occasion THEN OccasionCard component SHALL show image, name, and tagline
5. WHEN clicking product card THEN system SHALL navigate to product detail page
6. WHEN clicking wishlist icon THEN system SHALL toggle wishlist status without page reload
7. WHEN components render THEN they SHALL use consistent Tailwind styling

### Requirement 5: Data Model Extensions

**User Story:** As a developer, I want extended product models, so that I can support new frontend features.

#### Acceptance Criteria

1. WHEN product is created THEN system SHALL support short_description field
2. WHEN product has discount THEN system SHALL store compare_at_price
3. WHEN marking bestseller THEN system SHALL have is_bestseller boolean flag
4. WHEN product is rated THEN system SHALL store rating and rating_count
5. WHEN categorizing products THEN system SHALL support occasions many-to-many relationship
6. WHEN adding fields THEN migrations SHALL be non-breaking and preserve existing data

### Requirement 6: Gradual Rollout Strategy

**User Story:** As a site owner, I want to deploy new pages gradually, so that I can test and validate before full migration.

#### Acceptance Criteria

1. WHEN homepage is ready THEN system SHALL allow routing / to Next.js
2. WHEN Next.js serves homepage THEN Django SHALL continue serving /admin/, /products/, /cart/
3. WHEN testing new page THEN system SHALL allow A/B testing between old and new versions
4. WHEN rollback is needed THEN system SHALL quickly revert to Django templates
5. WHEN monitoring performance THEN system SHALL track page load times and errors

### Requirement 7: SEO and Performance

**User Story:** As a site owner, I want the new frontend to maintain or improve SEO rankings, so that organic traffic continues.

#### Acceptance Criteria

1. WHEN search engines crawl THEN pages SHALL have proper meta tags and structured data
2. WHEN page loads THEN system SHALL use Next.js SSR/ISR for fast initial render
3. WHEN images load THEN system SHALL use Next.js Image optimization
4. WHEN measuring performance THEN Core Web Vitals SHALL meet or exceed current scores
5. WHEN generating URLs THEN system SHALL maintain existing URL structure for SEO

### Requirement 8: Development Workflow

**User Story:** As a developer, I want clear development workflow, so that I can work efficiently on both frontend and backend.

#### Acceptance Criteria

1. WHEN developing locally THEN Django SHALL run on localhost:8000
2. WHEN developing locally THEN Next.js SHALL run on localhost:3000
3. WHEN making changes THEN hot reload SHALL work for both Django and Next.js
4. WHEN committing code THEN Git SHALL track both frontend/ and gift_project/ changes
5. WHEN deploying THEN system SHALL have clear deployment instructions for both services
