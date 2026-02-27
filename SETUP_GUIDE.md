# Radhvi Project Setup Guide

## Architecture Overview

This project uses a **decoupled architecture**:
- **Backend**: Django (existing) - handles data, auth, admin, APIs
- **Frontend**: Next.js (new) - modern UI/UX with Tailwind CSS

## Phase 1 Complete ✅

### What's Been Created

```
radhvi/
├── frontend/                    # NEW: Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with fonts
│   │   │   ├── page.tsx        # Homepage placeholder
│   │   │   └── globals.css     # Tailwind + custom styles
│   │   └── lib/
│   │       └── api.ts          # Axios API client
│   ├── package.json            # Dependencies
│   ├── tsconfig.json           # TypeScript config
│   ├── tailwind.config.ts      # Design system
│   ├── next.config.js          # Next.js config
│   └── .env.local              # Environment variables
└── gift_project/               # Existing Django backend
    └── ...
```

## Running the Project

### 1. Start Django Backend

```bash
cd gift_project
python manage.py runserver
```

Backend runs on: http://localhost:8000

### 2. Start Next.js Frontend

```bash
cd frontend
npm install          # First time only
npm run dev
```

Frontend runs on: http://localhost:3000

## Next Steps

### Phase 2: Django Backend APIs
- [ ] Install Django REST Framework
- [ ] Add CORS headers
- [ ] Create API endpoints for:
  - Products
  - Collections/Occasions
  - Wishlist
  - Cart
  - Blog posts
  - Testimonials
  - Reviews

### Phase 3: Core Components
- [ ] ProductCard component
- [ ] OccasionCard component
- [ ] Header/Footer
- [ ] Common UI elements

### Phase 4: Pages
- [ ] Homepage with all sections
- [ ] Collections pages
- [ ] Product detail
- [ ] Wishlist
- [ ] Cart
- [ ] Checkout
- [ ] Blog pages

## Design System

### Colors (Indian Gift Store Theme)
- **Primary**: Warm reds/pinks (#ef4444 - #dc2626)
- **Secondary**: Soft purples (#d946ef - #c026d3)
- **Accent**: Festive oranges (#f97316 - #ea580c)

### Typography
- **Body**: Inter (clean, modern)
- **Headings**: Playfair Display (elegant, traditional)

### Components
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`
- Cards: `.card`
- Inputs: `.input`
- Container: `.container-custom`

## API Configuration

The frontend is configured to call Django APIs at:
- **Development**: http://localhost:8000
- **Production**: https://radhvi.in

Change in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment Notes

### Frontend (Next.js)
- Can be deployed to Vercel, Netlify, or your server
- Build command: `npm run build`
- Start command: `npm start`

### Backend (Django)
- Already deployed at radhvi.in
- Will serve APIs at /api/* endpoints

## Troubleshooting

### CORS Issues
If frontend can't connect to backend, add to Django settings:
```python
INSTALLED_APPS += ['corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...] 
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

### Port Conflicts
- Django: Change port with `python manage.py runserver 8001`
- Next.js: Change port with `PORT=3001 npm run dev`
