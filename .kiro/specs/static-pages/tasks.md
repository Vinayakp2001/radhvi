# Implementation Plan

- [x] 1. Fix OccasionCard broken placeholder image



  - In `frontend/src/components/OccasionCard.tsx`, replace the `next/image` call with a conditional: if `image` is falsy or equals `/placeholder-occasion.jpg`, render a gradient fallback div with a gift emoji; otherwise render `<Image>`
  - This eliminates the 400 error from `next/image` for missing occasion images
  - _Requirements: 1.1, 1.2_

- [x] 2. New Arrivals page



  - Create `frontend/src/app/new-arrivals/page.tsx`
  - Fetch products with `is_new_arrival=true` filter from the API using `apiServices` or direct fetch
  - Render product grid using existing `ProductCard` component with Header/Footer/AnnouncementBar
  - Show empty state with CTA to `/collections/all` if no products returned
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Contact page



  - Create `frontend/src/app/contact/page.tsx` as a client component
  - Two-column layout: contact details (email, phone, WhatsApp, address, hours) + contact form
  - Form fields: Name, Email, Phone, Subject (select dropdown), Message (textarea)
  - Client-side validation: required fields check before submit
  - On valid submit: show green success banner, reset form
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. FAQ page



  - Create `frontend/src/app/faq/page.tsx` as a client component
  - Define static FAQ data grouped by category: Orders, Shipping & Delivery, Returns & Refunds, Payments
  - Accordion UI: `useState` tracks which item is open, chevron rotates on open
  - _Requirements: 4.1, 4.2_

- [x] 5. Shipping & Delivery page


  - Create `frontend/src/app/shipping/page.tsx` as a server component (static content)
  - Sections: free shipping threshold card, delivery timeline cards (Standard/Express), regional delivery estimate table, courier partners
  - _Requirements: 5.1, 5.2_


- [x] 6. Returns & Exchanges page

  - Create `frontend/src/app/returns/page.tsx` as a server component (static content)
  - Sections: return window highlight (7 days), numbered step-by-step process cards, eligible/not-eligible items list, refund timeline
  - _Requirements: 6.1, 6.2_


- [x] 7. Track Order page

  - Create `frontend/src/app/track-order/page.tsx` as a client component
  - Centered card with order ID text input and "Track Order" button
  - On submit: redirect to `/orders/{orderId}` (user will be prompted to log in if not authenticated)
  - Show inline validation if order ID field is empty
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. About Us page


  - Create `frontend/src/app/about/page.tsx` as a server component
  - Sections: hero with tagline, mission & values (icon cards), story snippet with image, stats row (orders delivered, happy customers, cities), CTA to shop
  - _Requirements: 8.1, 8.2_

- [x] 9. Our Story page


  - Create `frontend/src/app/story/page.tsx` as a server component
  - Narrative layout with timeline-style sections, founder quote blockquote, brand journey milestones
  - _Requirements: 9.1, 9.2_

- [x] 10. Careers page



  - Create `frontend/src/app/careers/page.tsx` as a server component
  - Sections: hero, culture highlights (icon cards for values), "No open positions right now" message, general application CTA with email link
  - _Requirements: 10.1, 10.2_

- [x] 11. Bulk Orders page


  - Create `frontend/src/app/bulk-orders/page.tsx` as a client component
  - Hero with bulk order benefits grid (discount, dedicated manager, custom packaging, flexible payment)
  - Inquiry form: Company Name, Contact Person, Email, Phone, Quantity, Product Interest (textarea), Budget Range
  - Client-side validation + success state on submit
  - _Requirements: 11.1, 11.2, 11.3_


- [x] 12. Legal pages


- [x] 12.1 Privacy Policy — `frontend/src/app/privacy/page.tsx`


  - Sections: Introduction, Data We Collect, How We Use Data, Cookies, Third Parties, Your Rights, Contact
  - "Last updated: March 2026" note at top
  - _Requirements: 12.1, 12.4_


- [x] 12.2 Terms & Conditions — `frontend/src/app/terms/page.tsx`

  - Sections: Acceptance, Use of Site, Orders & Payments, Intellectual Property, Limitation of Liability, Governing Law
  - "Last updated: March 2026" note at top
  - _Requirements: 12.2, 12.4_

- [x] 12.3 Refund Policy — `frontend/src/app/refund-policy/page.tsx`


  - Sections: Eligibility, How to Request, Processing Time, Non-Refundable Items, Contact
  - "Last updated: March 2026" note at top
  - _Requirements: 12.3, 12.4_
