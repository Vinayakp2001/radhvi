# Design Document

## Overview

This design document outlines the technical implementation for integrating Valentine's Day promotional branding into the Radhvi.in e-commerce platform. The solution provides a flexible, maintainable approach to seasonal promotions that can be easily enabled/disabled and reused for future campaigns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Django Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Context         │         │  Template        │          │
│  │  Processor       │────────▶│  System          │          │
│  │  (Campaign Data) │         │  (Rendering)     │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Campaign        │         │  Static Files    │          │
│  │  Model/Settings  │         │  (Images/CSS)    │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. User requests page → Django view processes request
2. Context processor checks campaign status
3. If active, campaign data added to template context
4. Template renders with conditional Valentine's elements
5. Static files (images, CSS) loaded from CDN/static server

## Components and Interfaces

### 1. Static Assets Structure

**Directory Structure:**
```
gift_project/gift/static/
├── images/
│   └── promotions/
│       └── valentines/
│           ├── radhvi-valentine-white.png
│           ├── radhvi-valentine-black.png
│           ├── radhvi-valentine-icon.png
│           └── valentine-banner-bg.jpg
├── css/
│   └── promotions/
│       └── valentine.css
└── js/
    └── promotions/
        └── valentine.js
```

**Image Specifications:**
- Format: PNG with transparency (logo), JPG (backgrounds)
- Logo dimensions: 400x400px (icon), 800x200px (banner)
- Optimization: Compressed for web, < 200KB each
- Responsive: Multiple sizes for different breakpoints

### 2. Campaign Configuration System

**Option A: Django Settings (Simple, recommended for MVP)**

```python
# settings.py
VALENTINE_CAMPAIGN = {
    'enabled': True,
    'start_date': '2026-02-01',
    'end_date': '2026-02-15',
    'discount_code': 'LOVE2026',
    'discount_percentage': 20,
    'show_announcement_bar': True,
    'show_hero_banner': True,
    'show_category_card': True,
    'show_promo_section': True,
}
```

**Option B: Database Model (Flexible, for future scalability)**

```python
# models.py
class Campaign(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=False)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Display settings
    show_announcement_bar = models.BooleanField(default=True)
    show_hero_banner = models.BooleanField(default=True)
    show_category_card = models.BooleanField(default=True)
    show_promo_section = models.BooleanField(default=True)
    
    # Content
    announcement_text = models.CharField(max_length=200)
    hero_title = models.CharField(max_length=100)
    hero_subtitle = models.CharField(max_length=200)
    discount_code = models.CharField(max_length=50, blank=True)
    discount_percentage = models.IntegerField(default=0)
    
    # Assets
    logo_white_bg = models.ImageField(upload_to='campaigns/')
    logo_black_bg = models.ImageField(upload_to='campaigns/')
    banner_image = models.ImageField(upload_to='campaigns/', blank=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def is_currently_active(self):
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.start_date <= now <= self.end_date
```

**Design Decision:** Start with Option A (settings-based) for MVP, migrate to Option B if multiple campaigns are needed.

### 3. Context Processor

**Purpose:** Make campaign data available to all templates

```python
# context_processors.py
from django.conf import settings
from datetime import datetime

def campaign_context(request):
    """Add active campaign data to all template contexts"""
    campaign_config = getattr(settings, 'VALENTINE_CAMPAIGN', {})
    
    # Check if campaign is active
    is_active = campaign_config.get('enabled', False)
    
    if is_active:
        # Check date range
        start_date = campaign_config.get('start_date')
        end_date = campaign_config.get('end_date')
        
        if start_date and end_date:
            today = datetime.now().date()
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            is_active = start <= today <= end
    
    return {
        'valentine_campaign': campaign_config if is_active else None,
        'campaign_active': is_active,
    }
```

### 4. Template Components

#### 4.1 Announcement Bar Component

**File:** `gift/templates/gift/includes/valentine_announcement.html`

```django
{% load static %}
{% if valentine_campaign and valentine_campaign.show_announcement_bar %}
<div class="valentine-announcement-bar" id="valentineAnnouncement">
    <div class="container">
        <div class="row align-items-center py-2">
            <div class="col-md-2 text-center text-md-start">
                <img src="{% static 'images/promotions/valentines/radhvi-valentine-icon.png' %}" 
                     alt="Valentine's Sale" 
                     class="valentine-logo-small">
            </div>
            <div class="col-md-8 text-center">
                <div class="valentine-announcement-text">
                    <span class="valentine-emoji">💝</span>
                    <strong>Valentine's Day Special!</strong>
                    Get {{ valentine_campaign.discount_percentage }}% OFF with code 
                    <span class="valentine-code">{{ valentine_campaign.discount_code }}</span>
                    <span class="valentine-emoji">💝</span>
                </div>
            </div>
            <div class="col-md-2 text-center text-md-end">
                <button class="valentine-close-btn" onclick="dismissValentineBar()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
</div>
{% endif %}
```

**Integration Point:** Add to `base.html` before `<header>` tag

#### 4.2 Hero Banner Component

**File:** `gift/templates/gift/includes/valentine_hero.html`

```django
{% load static %}
{% if valentine_campaign and valentine_campaign.show_hero_banner %}
<section class="valentine-hero-section">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <div class="valentine-hero-content">
                    <img src="{% static 'images/promotions/valentines/radhvi-valentine-white.png' %}" 
                         alt="Radhvi Valentine's Sale" 
                         class="valentine-hero-logo mb-4">
                    <h1 class="valentine-hero-title">
                        Emotions, Crafted Perfectly
                    </h1>
                    <p class="valentine-hero-subtitle">
                        Celebrate love with our exclusive Valentine's collection. 
                        Premium gifts that speak from the heart.
                    </p>
                    <div class="valentine-offer-badge">
                        <span class="offer-percentage">{{ valentine_campaign.discount_percentage }}% OFF</span>
                        <span class="offer-code">Use: {{ valentine_campaign.discount_code }}</span>
                    </div>
                    <div class="valentine-cta-buttons mt-4">
                        <a href="{% url 'product_list' %}?category=valentines" 
                           class="btn btn-valentine-primary">
                            <i class="fas fa-heart me-2"></i>Shop Valentine's Gifts
                        </a>
                        <a href="{% url 'product_list' %}" 
                           class="btn btn-valentine-outline">
                            Browse All Gifts
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="valentine-hero-image">
                    <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800" 
                         alt="Valentine's Gifts" 
                         class="img-fluid rounded-4">
                </div>
            </div>
        </div>
    </div>
</section>
{% endif %}
```

**Integration Point:** Add to `home.html` after main hero section or replace it

#### 4.3 Category Card Component

**File:** `gift/templates/gift/includes/valentine_category.html`

```django
{% load static %}
{% if valentine_campaign and valentine_campaign.show_category_card %}
<div class="col-xl-3 col-lg-4 col-md-6">
    <a href="{% url 'product_list' %}?category=valentines" class="valentine-category-card">
        <div class="card border-0 shadow-sm h-100 valentine-card-special">
            <div class="card-body p-4 text-center">
                <div class="valentine-badge-corner">
                    <span>SPECIAL</span>
                </div>
                <div class="category-icon mb-4">
                    <div class="icon-wrapper valentine-icon-wrapper p-4">
                        <img src="{% static 'images/promotions/valentines/radhvi-valentine-icon.png' %}" 
                             alt="Valentine's Gifts" 
                             class="valentine-category-icon">
                    </div>
                </div>
                <h5 class="fw-semibold mb-2 valentine-category-title">
                    💝 Valentine's Special
                </h5>
                <p class="text-muted small mb-3">
                    {{ valentine_products_count|default:0 }} Romantic Gifts
                </p>
                <div class="valentine-discount-tag">
                    {{ valentine_campaign.discount_percentage }}% OFF
                </div>
            </div>
            <div class="card-footer bg-transparent border-0 pt-0">
                <span class="text-danger small fw-semibold">
                    Explore Collection <i class="fas fa-arrow-right ms-1"></i>
                </span>
            </div>
        </div>
    </a>
</div>
{% endif %}
```

**Integration Point:** Add to categories section in `home.html` as first category card

#### 4.4 Promotional Section Component

**File:** `gift/templates/gift/includes/valentine_promo_section.html`

```django
{% load static %}
{% if valentine_campaign and valentine_campaign.show_promo_section %}
<section class="valentine-promo-section py-6">
    <div class="container">
        <div class="valentine-promo-card">
            <div class="row align-items-center">
                <div class="col-lg-6 order-lg-2 mb-4 mb-lg-0">
                    <div class="valentine-promo-image">
                        <img src="{% static 'images/promotions/valentines/radhvi-valentine-black.png' %}" 
                             alt="Valentine's Sale" 
                             class="img-fluid">
                    </div>
                </div>
                <div class="col-lg-6 order-lg-1">
                    <div class="valentine-promo-content">
                        <div class="valentine-promo-badge mb-3">
                            <i class="fas fa-heart me-2"></i>LIMITED TIME OFFER
                        </div>
                        <h2 class="valentine-promo-title mb-4">
                            Make This Valentine's Day Unforgettable
                        </h2>
                        <p class="valentine-promo-text mb-4">
                            Express your love with our handpicked collection of premium gifts. 
                            From personalized treasures to luxury hampers, find the perfect way 
                            to say "I love you."
                        </p>
                        <div class="valentine-promo-features mb-4">
                            <div class="feature-item">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span>Free Gift Wrapping</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span>Express Delivery Available</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <span>Personalization Options</span>
                            </div>
                        </div>
                        <div class="valentine-promo-cta">
                            <a href="{% url 'product_list' %}?category=valentines" 
                               class="btn btn-valentine-large">
                                <i class="fas fa-gift me-2"></i>
                                Shop Valentine's Collection
                            </a>
                            <div class="valentine-countdown mt-3">
                                <small class="text-muted">Offer ends in:</small>
                                <div class="countdown-timer" id="valentineCountdown"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
{% endif %}
```

**Integration Point:** Add to `home.html` between featured products and trending products sections

### 5. Styling System

**File:** `gift/static/css/promotions/valentine.css`

**Design Principles:**
- Use Valentine's color palette: #FF1744 (primary red), #F50057 (accent pink), #C51162 (dark red)
- Maintain consistency with existing site design
- Ensure accessibility (WCAG AA contrast ratios)
- Mobile-first responsive design

**Key Style Components:**

```css
/* Valentine's Color Palette */
:root {
    --valentine-primary: #FF1744;
    --valentine-accent: #F50057;
    --valentine-dark: #C51162;
    --valentine-light: #FFE0E6;
    --valentine-gradient: linear-gradient(135deg, #FF1744 0%, #F50057 100%);
}

/* Announcement Bar */
.valentine-announcement-bar {
    background: var(--valentine-gradient);
    color: white;
    position: relative;
    z-index: 1000;
}

/* Hero Section */
.valentine-hero-section {
    background: linear-gradient(135deg, #FFE0E6 0%, #FFF 100%);
    padding: 80px 0;
}

/* Category Card */
.valentine-card-special {
    border: 2px solid var(--valentine-primary) !important;
    position: relative;
    overflow: hidden;
}

.valentine-card-special::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: var(--valentine-gradient);
}

/* Buttons */
.btn-valentine-primary {
    background: var(--valentine-gradient);
    border: none;
    color: white;
    padding: 12px 30px;
    border-radius: 50px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-valentine-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255, 23, 68, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
    .valentine-hero-logo {
        max-width: 200px;
    }
    
    .valentine-announcement-text {
        font-size: 0.875rem;
    }
}
```

### 6. JavaScript Functionality

**File:** `gift/static/js/promotions/valentine.js`

**Features:**
- Announcement bar dismissal with session storage
- Countdown timer for campaign end date
- Smooth animations and transitions

```javascript
// Dismiss announcement bar
function dismissValentineBar() {
    const bar = document.getElementById('valentineAnnouncement');
    if (bar) {
        bar.style.transition = 'all 0.3s ease';
        bar.style.opacity = '0';
        bar.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            bar.style.display = 'none';
        }, 300);
        sessionStorage.setItem('valentine_bar_dismissed', 'true');
    }
}

// Check if bar was dismissed
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('valentine_bar_dismissed') === 'true') {
        const bar = document.getElementById('valentineAnnouncement');
        if (bar) bar.style.display = 'none';
    }
    
    // Initialize countdown timer
    initValentineCountdown();
});

// Countdown timer
function initValentineCountdown() {
    const countdownEl = document.getElementById('valentineCountdown');
    if (!countdownEl) return;
    
    const endDate = new Date('2026-02-15T23:59:59').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        if (distance < 0) {
            countdownEl.innerHTML = 'Offer Ended';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        countdownEl.innerHTML = `
            <span class="countdown-item">${days}d</span>
            <span class="countdown-item">${hours}h</span>
            <span class="countdown-item">${minutes}m</span>
            <span class="countdown-item">${seconds}s</span>
        `;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}
```

## Data Models

### Campaign Model (Future Enhancement)

```python
class Campaign(models.Model):
    """Seasonal campaign configuration"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=False)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Display configuration
    show_announcement_bar = models.BooleanField(default=True)
    show_hero_banner = models.BooleanField(default=True)
    show_category_card = models.BooleanField(default=True)
    show_promo_section = models.BooleanField(default=True)
    
    # Content
    announcement_text = models.TextField()
    hero_title = models.CharField(max_length=200)
    hero_subtitle = models.TextField()
    promo_title = models.CharField(max_length=200)
    promo_description = models.TextField()
    
    # Discount
    discount_code = models.CharField(max_length=50, blank=True)
    discount_percentage = models.IntegerField(default=0)
    
    # Assets
    logo_white_bg = models.ImageField(upload_to='campaigns/logos/')
    logo_black_bg = models.ImageField(upload_to='campaigns/logos/')
    icon = models.ImageField(upload_to='campaigns/icons/')
    banner_image = models.ImageField(upload_to='campaigns/banners/', blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Campaign'
        verbose_name_plural = 'Campaigns'
    
    def __str__(self):
        return self.name
    
    def is_currently_active(self):
        """Check if campaign is active based on dates"""
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.start_date <= now <= self.end_date
    
    def days_remaining(self):
        """Calculate days remaining in campaign"""
        from django.utils import timezone
        if not self.is_currently_active():
            return 0
        delta = self.end_date - timezone.now()
        return delta.days
```

### Product Category Enhancement

```python
# Add to existing Category model
class Category(models.Model):
    # ... existing fields ...
    
    # Campaign association
    is_campaign_category = models.BooleanField(default=False)
    campaign_slug = models.CharField(max_length=50, blank=True)
    campaign_priority = models.IntegerField(default=0)  # For sorting
```

## Error Handling

### Missing Assets
- Fallback to text-only display if images fail to load
- Log missing asset errors for monitoring
- Graceful degradation for older browsers

### Date Range Issues
- Validate date ranges in admin/settings
- Auto-disable campaigns past end date
- Warning notifications for upcoming campaign end

### Performance Issues
- Implement caching for campaign data
- Lazy load images below the fold
- Minify CSS/JS assets

## Testing Strategy

### Unit Tests

```python
# tests/test_campaign.py
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

class CampaignContextProcessorTest(TestCase):
    def test_active_campaign_in_context(self):
        """Test that active campaign appears in context"""
        # Set campaign dates to current
        # Assert campaign_active is True
        pass
    
    def test_expired_campaign_not_in_context(self):
        """Test that expired campaign doesn't appear"""
        # Set campaign dates to past
        # Assert campaign_active is False
        pass
    
    def test_future_campaign_not_in_context(self):
        """Test that future campaign doesn't appear"""
        # Set campaign dates to future
        # Assert campaign_active is False
        pass
```

### Integration Tests

```python
class ValentineCampaignIntegrationTest(TestCase):
    def test_announcement_bar_displays(self):
        """Test announcement bar appears when campaign active"""
        response = self.client.get('/')
        self.assertContains(response, 'valentine-announcement-bar')
    
    def test_hero_banner_displays(self):
        """Test hero banner appears on homepage"""
        response = self.client.get('/')
        self.assertContains(response, 'valentine-hero-section')
    
    def test_category_card_displays(self):
        """Test Valentine's category card appears"""
        response = self.client.get('/')
        self.assertContains(response, 'valentine-category-card')
```

### Manual Testing Checklist

- [ ] Announcement bar displays correctly on all pages
- [ ] Announcement bar dismissal works and persists
- [ ] Hero banner displays on homepage
- [ ] Category card appears in categories section
- [ ] Promotional section displays between products
- [ ] All images load correctly
- [ ] Links navigate to correct pages
- [ ] Countdown timer works accurately
- [ ] Mobile responsive on all screen sizes
- [ ] Campaign toggles on/off correctly
- [ ] Performance is acceptable (< 3s page load)

### Browser Compatibility Testing

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest version)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Performance Considerations

### Image Optimization
- Compress PNGs using tools like TinyPNG
- Serve WebP format with PNG fallback
- Use responsive images with srcset
- Implement lazy loading for below-fold images

### Caching Strategy
- Cache campaign configuration for 1 hour
- Use browser caching for static assets (7 days)
- Implement CDN for static files in production

### Code Splitting
- Load Valentine's CSS only when campaign is active
- Defer non-critical JavaScript
- Minimize render-blocking resources

## Security Considerations

- Validate all campaign dates server-side
- Sanitize any user-generated campaign content
- Use Django's static file security features
- Implement CSP headers for external resources
- Rate limit campaign-related API endpoints

## Deployment Strategy

### Phase 1: Asset Preparation
1. Optimize and upload Valentine's images
2. Create and test CSS/JS files
3. Update static files configuration

### Phase 2: Code Deployment
1. Add context processor
2. Create template components
3. Update base.html and home.html
4. Deploy to staging environment

### Phase 3: Configuration
1. Set campaign dates in settings
2. Enable campaign flags
3. Test all components

### Phase 4: Production Release
1. Deploy to production
2. Monitor performance metrics
3. Verify all components display correctly

### Phase 5: Post-Campaign
1. Disable campaign in settings
2. Archive campaign assets
3. Document lessons learned
4. Plan for next campaign

## Rollback Plan

If issues arise:
1. Set `VALENTINE_CAMPAIGN['enabled'] = False` in settings
2. Restart application servers
3. Clear cache if necessary
4. All Valentine's elements will be hidden immediately

## Future Enhancements

1. **Admin Interface**: Build Django admin for campaign management
2. **A/B Testing**: Test different promotional messages
3. **Analytics**: Track campaign performance metrics
4. **Personalization**: Show different content based on user behavior
5. **Multi-Campaign**: Support multiple simultaneous campaigns
6. **Scheduling**: Auto-enable/disable campaigns based on dates
7. **Email Integration**: Send Valentine's promotional emails
8. **Social Sharing**: Add social media sharing for Valentine's products
