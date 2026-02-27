# Next.js Frontend Migration - Design Document

## Overview

This document outlines the technical design for migrating the Radhvi gift store frontend from Django templates to Next.js while maintaining the Django backend. The migration follows a feature-by-feature approach, starting with the homepage.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Frontend                            │
│                  (localhost:3000)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages (App Router)                                   │  │
│  │  - / (Homepage)                                       │  │
│  │  - /collections/[slug]                                │  │
│  │  - /products/[slug]                                   │  │
│  │  - /cart, /wishlist, /checkout                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Components                                           │  │
│  │  - ProductCard, OccasionCard                          │  │
│  │  - Header, Footer, AnnouncementBar                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Client (Axios)                                   │  │
│  │  - Centralized API calls                              │  │
│  │  - Auth token management                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/JSON
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Django Backend                              │
│                  (localhost:8000)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  REST API Endpoints (/api/*)                          │  │
│  │  - /api/occasions/                                    │  │
│  │  - /api/products/                                     │  │
│  │  - /api/cart/                                         │  │
│  │  - /api/wishlist/                                     │  │
│  │  - /api/blog/                                         │  │
│  │  - /api/testimonials/                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Existing Django Views (Templates)                    │  │
│  │  - /admin/ (Django Admin)                             │  │
│  │  - Fallback routes                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Models & Database                                    │  │
│  │  - Product, Category, Order                           │  │
│  │  - Cart, Wishlist, User                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 15.1.6 (App Router)
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4
- Axios for API calls

**Backend:**
- Django 4.x (existing)
- Django REST Framework 3.x (new)
- django-cors-headers (new)
- PostgreSQL (existing)

## Components and Interfaces

### Frontend Components

#### 1. ProductCard Component

**Purpose:** Reusable card for displaying products across the site

**Props:**
```typescript
interface ProductCardProps {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  rating?: number;
  ratingCount?: number;
  isBestseller: boolean;
  isInWishlist: boolean;
  onWishlistToggle: (productId: number) => Promise<void>;
}
```

**Features:**
- Discount badge (if compareAtPrice > price)
- Bestseller badge
- Star rating display
- Wishlist heart icon (filled/outline)
- Hover effects
- Responsive design

#### 2. OccasionCard Component

**Purpose:** Display occasion/collection categories

**Props:**
```typescript
interface OccasionCardProps {
  slug: string;
  name: string;
  tagline: string;
  image: string;
}
```

#### 3. Layout Components

**Header:**
- Logo
- Navigation menu
- Search bar
- Cart icon with count
- Wishlist icon
- User account dropdown

**Footer:**
- Shop links (collections)
- Customer service links
- Company links
- Newsletter signup
- Social media links
- WhatsApp contact

**AnnouncementBar:**
- Configurable message
- Dismissible
- Sticky on scroll

### API Endpoints

#### Homepage APIs

**GET /api/occasions/**
```json
{
  "results": [
    {
      "id": 1,
      "slug": "birthday",
      "name": "Birthday Gifts",
      "tagline": "Make birthdays unforgettable",
      "image": "/media/occasions/birthday.jpg"
    }
  ]
}
```

**GET /api/products/?bestseller=true**
```json
{
  "results": [
    {
      "id": 1,
      "slug": "red-roses-bouquet",
      "name": "Red Roses Bouquet",
      "short_description": "Fresh red roses",
      "image": "/media/products/roses-1.jpg",
      "price": "999.00",
      "compare_at_price": "1299.00",
      "rating": 4.5,
      "rating_count": 120,
      "is_bestseller": true
    }
  ]
}
```

**GET /api/products/featured/**
```json
{
  "id": 5,
  "slug": "premium-gift-hamper",
  "name": "Premium Gift Hamper",
  "description": "Luxury gift hamper with...",
  "image": "/media/products/hamper.jpg",
  "price": "2499.00",
  "compare_at_price": "3499.00"
}
```

**GET /api/blog/posts/?limit=3**
```json
{
  "results": [
    {
      "id": 1,
      "slug": "gift-ideas-for-anniversary",
      "title": "10 Romantic Anniversary Gift Ideas",
      "excerpt": "Celebrate your love with...",
      "published_date": "2026-02-20",
      "image": "/media/blog/anniversary.jpg"
    }
  ]
}
```

**GET /api/testimonials/**
```json
{
  "results": [
    {
      "id": 1,
      "name": "Priya Sharma",
      "city": "Mumbai",
      "text": "Amazing quality and fast delivery!",
      "tag": "Birthday Gift",
      "is_active": true
    }
  ]
}
```

#### Wishlist APIs

**GET /api/wishlist/**
- Returns user's wishlist items (session or user-based)

**POST /api/wishlist/add/**
```json
{
  "product_id": 5
}
```

**DELETE /api/wishlist/remove/{product_id}/**

## Data Models

### Extended Product Model

```python
class Product(models.Model):
    # Existing fields
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/')
    
    # NEW fields for Next.js frontend
    short_description = models.TextField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Brief description for product cards"
    )
    compare_at_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Original price before discount"
    )
    is_bestseller = models.BooleanField(
        default=False,
        help_text="Mark as bestseller for homepage"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        help_text="Average rating (0-5)"
    )
    rating_count = models.IntegerField(
        default=0,
        help_text="Number of ratings"
    )
    occasions = models.ManyToManyField(
        'Occasion',
        blank=True,
        related_name='products'
    )
    
    # Computed properties
    @property
    def discount_percentage(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return int(((self.compare_at_price - self.price) / self.compare_at_price) * 100)
        return 0
```

### New Occasion Model

```python
class Occasion(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    tagline = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='occasions/')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
```

### New Testimonial Model

```python
class Testimonial(models.Model):
    name = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    text = models.TextField()
    tag = models.CharField(
        max_length=50,
        help_text="e.g., Birthday Gift, Anniversary Gift"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
```

### Wishlist Model (Session-based)

```python
class WishlistItem(models.Model):
    session_key = models.CharField(max_length=40, db_index=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [['session_key', 'product']]
```

## Error Handling

### Frontend Error Handling

**API Call Wrapper:**
```typescript
async function apiCall<T>(
  request: Promise<AxiosResponse<T>>
): Promise<T | null> {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific error codes
      if (error.response?.status === 404) {
        // Show 404 page
      } else if (error.response?.status === 500) {
        // Show error toast
      }
    }
    return null;
  }
}
```

**Loading States:**
- Skeleton loaders for product cards
- Spinner for page transitions
- Shimmer effect for images

**Error States:**
- Friendly error messages
- Retry buttons
- Fallback to cached data (if available)

### Backend Error Handling

**API Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": {}
  }
}
```

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- Component rendering
- Props validation
- Event handlers
- Utility functions

**Integration Tests:**
- API client
- Page navigation
- Form submissions

**E2E Tests (Future):**
- User flows (browse → add to cart → checkout)
- Wishlist functionality
- Search and filters

### Backend Testing

**API Tests:**
- Endpoint responses
- Authentication
- Permissions
- Data validation

**Model Tests:**
- Field validation
- Computed properties
- Relationships

## Deployment Strategy

### Phase 1: Development & Testing

1. **Local Development:**
   - Django: `python manage.py runserver` (port 8000)
   - Next.js: `npm run dev` (port 3000)
   - Test APIs with Postman/curl
   - Test frontend with mock data

2. **Staging:**
   - Deploy Django to staging server
   - Deploy Next.js to Vercel/staging
   - Test integration
   - Performance testing

### Phase 2: Production Rollout

**Option A: Subdomain Approach**
```
radhvi.in          → Django (current site)
new.radhvi.in      → Next.js (new homepage)
api.radhvi.in      → Django APIs
admin.radhvi.in    → Django admin
```

**Option B: Path-based Routing (Recommended)**
```
radhvi.in/         → Next.js homepage
radhvi.in/admin/   → Django admin
radhvi.in/api/     → Django APIs
radhvi.in/*        → Django (fallback)
```

**Nginx Configuration:**
```nginx
server {
    server_name radhvi.in;
    
    # Next.js homepage
    location = / {
        proxy_pass http://localhost:3000;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://localhost:8000;
    }
    
    # Django APIs
    location /api/ {
        proxy_pass http://localhost:8000;
    }
    
    # Django static/media
    location /static/ {
        alias /path/to/staticfiles/;
    }
    
    location /media/ {
        alias /path/to/media/;
    }
    
    # Fallback to Django
    location / {
        proxy_pass http://localhost:8000;
    }
}
```

### Phase 3: Gradual Migration

**Week 1:** Homepage only
**Week 2:** Collections pages
**Week 3:** Product detail pages
**Week 4:** Cart & Wishlist
**Week 5:** Checkout
**Week 6:** Blog pages

## Performance Optimization

### Frontend Optimization

1. **Next.js Features:**
   - Server-Side Rendering (SSR) for SEO
   - Incremental Static Regeneration (ISR) for product pages
   - Image optimization with next/image
   - Code splitting (automatic)

2. **Caching Strategy:**
   - Static pages: ISR with 60s revalidation
   - Product data: SWR (stale-while-revalidate)
   - Images: CDN caching

3. **Bundle Optimization:**
   - Tree shaking
   - Dynamic imports for heavy components
   - Minimize third-party dependencies

### Backend Optimization

1. **Database:**
   - Index on frequently queried fields (slug, is_bestseller)
   - Select_related/prefetch_related for relationships
   - Database query optimization

2. **API Response:**
   - Pagination for lists
   - Field selection (only return needed fields)
   - Response compression (gzip)

3. **Caching:**
   - Redis for session data
   - Cache bestsellers list (5 min TTL)
   - Cache occasions list (1 hour TTL)

## Security Considerations

1. **CORS Configuration:**
   - Allow only specific origins (localhost:3000, radhvi.in)
   - Credentials support for cookies

2. **API Authentication:**
   - Session-based auth (existing)
   - JWT tokens (future consideration)
   - CSRF protection

3. **Input Validation:**
   - Django serializers for API input
   - Frontend form validation
   - XSS prevention

4. **Rate Limiting:**
   - API rate limits (100 req/min per IP)
   - Wishlist operations (10 req/min)

## Monitoring & Analytics

1. **Performance Monitoring:**
   - Next.js Analytics
   - Core Web Vitals tracking
   - API response times

2. **Error Tracking:**
   - Sentry for frontend errors
   - Django logging for backend errors

3. **User Analytics:**
   - Google Analytics 4
   - Conversion tracking
   - User behavior flows

## Rollback Plan

If issues arise:

1. **Immediate Rollback:**
   - Update Nginx config to route / back to Django
   - Reload Nginx: `sudo systemctl reload nginx`
   - Takes effect immediately

2. **Partial Rollback:**
   - Keep working pages on Next.js
   - Route problematic pages back to Django
   - Fix issues and redeploy

3. **Data Integrity:**
   - No data loss (Django database unchanged)
   - Wishlist data preserved (session-based)
   - Orders continue processing normally
