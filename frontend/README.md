# Radhvi Frontend

Modern Next.js frontend for the Radhvi gift store.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Axios** - API client

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will run on [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production:
```env
NEXT_PUBLIC_API_URL=https://radhvi.in
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable React components
│   ├── lib/             # Utilities and API client
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── package.json
```

## API Integration

The frontend connects to the Django backend via REST APIs. All API calls go through the centralized `api` client in `src/lib/api.ts`.

## Building for Production

```bash
npm run build
npm start
```

## Design System

### Colors
- **Primary**: Red/Pink tones for CTAs and branding
- **Secondary**: Purple tones for accents
- **Accent**: Orange tones for highlights

### Typography
- **Body**: Inter (sans-serif)
- **Headings**: Playfair Display (serif)

### Spacing
- Mobile-first responsive design
- Consistent spacing scale using Tailwind
