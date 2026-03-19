# Design Document

## Overview

This spec adds all missing static/informational pages to the Radhvi Next.js frontend and fixes the broken placeholder image in `OccasionCard`. All pages follow the existing design system: Tailwind CSS, red primary (`text-red-500`, `bg-red-500`), `container-custom` layout class, shared `Header` and `Footer` components, and `AnnouncementBar`.

Pages are purely frontend — no new backend APIs are needed. Contact and Bulk Orders forms will use client-side state with a success message (no backend submission for now, easily wired later).

## Architecture

```
frontend/src/app/
├── new-arrivals/page.tsx          # Fetches products with is_new_arrival filter
├── contact/page.tsx               # Contact info + form (client component)
├── faq/page.tsx                   # Accordion FAQ (client component)
├── shipping/page.tsx              # Static shipping policy
├── returns/page.tsx               # Static returns policy
├── track-order/page.tsx           # Order ID form → redirect
├── about/page.tsx                 # Brand story + values
├── story/page.tsx                 # Founding narrative
├── careers/page.tsx               # Job listings + culture
├── bulk-orders/page.tsx           # Bulk inquiry form (client component)
├── privacy/page.tsx               # Privacy policy
├── terms/page.tsx                 # Terms & conditions
└── refund-policy/page.tsx         # Refund policy

frontend/src/components/
└── OccasionCard.tsx               # Fix: fallback when image is missing/broken
```

## Components and Interfaces

### OccasionCard Fix
- Remove the `if (image &&` guard that still passes the broken path to `next/image`
- Replace with: if `image` is falsy or equals `/placeholder-occasion.jpg`, render a gradient div with a gift emoji instead of `<Image>`
- This eliminates the 400 from `next/image` entirely

### Shared Page Layout Pattern
All static pages use this structure:
```tsx
<div className="min-h-screen flex flex-col">
  <AnnouncementBar />
  <Header />
  <main className="flex-1">
    {/* Hero banner */}
    {/* Content sections */}
  </main>
  <Footer />
</div>
```

### Page-specific components (inline, no separate files needed):
- `FAQAccordion` — inline in `faq/page.tsx`, uses `useState` for open/close
- `ContactForm` — inline in `contact/page.tsx`, uses `useState` for form fields + submission
- `BulkOrderForm` — inline in `bulk-orders/page.tsx`, uses `useState`

## Data Models

### New Arrivals
Reuses existing API: `GET /api/products/?is_new_arrival=true&limit=24`
Uses `apiServices.fetchProducts()` or direct fetch with filter param.

### Contact / Bulk Orders Forms
Client-side only state:
```ts
type ContactForm = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type BulkOrderForm = {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  quantity: string;
  product_interest: string;
  budget_range: string;
}
```

### FAQ Data
Static array defined in the page file:
```ts
type FAQItem = { question: string; answer: string; }
type FAQCategory = { category: string; items: FAQItem[] }
```

## Error Handling

- `new-arrivals`: if API fetch fails, show empty state with "Browse all products" CTA
- `track-order`: if order ID is empty, show inline validation error
- Contact/Bulk forms: client-side required field validation before showing success state

## Testing Strategy

- Visual check: all pages render without 404 or console errors
- OccasionCard: verify no `next/image` 400 errors when occasion has no image
- Forms: verify validation fires on empty submit, success state shows on valid submit
- New Arrivals: verify products load from API

## Page Content Details

### `/new-arrivals`
- Hero: "New Arrivals" heading + subtitle
- Product grid using existing `ProductCard` component
- Fetches `?is_new_arrival=true` from products API

### `/contact`
- Hero section with heading
- Two-column: left = contact details (email, phone, WhatsApp, address, hours), right = form
- Form fields: Name, Email, Phone, Subject (select), Message
- On submit: show green success banner

### `/faq`
- Hero section
- FAQ categories: Orders, Shipping & Delivery, Returns & Refunds, Payments
- Accordion: click to expand, chevron rotates

### `/shipping`
- Hero section
- Cards: Free Shipping threshold, Standard Delivery, Express Delivery
- Table: delivery estimates by zone (Metro, Tier 2, Rest of India)
- Courier partners section

### `/returns`
- Hero section
- Return window highlight (7 days)
- Step-by-step process (numbered cards)
- What's eligible / not eligible
- Refund timeline

### `/track-order`
- Simple centered card with order ID input
- If authenticated → redirect to `/orders`
- If not → show input + "Track" button that goes to `/orders/{id}` (requires login)

### `/about`
- Hero with brand tagline
- Mission & values (icon cards)
- Story snippet with image
- Stats (orders delivered, happy customers, etc.)
- CTA to shop

### `/story`
- Full narrative layout
- Timeline-style sections
- Founder quote

### `/careers`
- Hero
- Culture highlights (icon cards)
- "No open positions" message with general application email CTA

### `/bulk-orders`
- Hero with benefits
- Benefits grid (discount, dedicated manager, custom packaging, etc.)
- Inquiry form

### `/privacy`, `/terms`, `/refund-policy`
- Consistent layout: hero + prose content sections
- "Last updated: March 2026" footer note
- Table of contents sidebar on desktop
