# Prostor - Creative LMS Platform

## Project Overview
Prostor (Russian: Простор, "open space") is a lightweight creative LMS platform for workshops and classes.
It combines a real-time collaborative whiteboard, an Instagram-style assignment gallery, PDF slide viewer with per-page linked resources, and curated link resources into a single cohesive tool.

## Tech Stack
- **Framework**: Next.js 16.1 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS v4 (CSS-first config) + shadcn/ui + lucide-react + framer-motion
- **Database / Auth / Storage**: Supabase (PostgreSQL, Google OAuth, Storage, Realtime)
- **Whiteboard**: tldraw (Hobby license) with `@tldraw/sync`
- **Slide Viewer**: react-pdf (Mozilla pdf.js based)
- **Image Optimization**: browser-image-compression (client) + sharp (server) → WebP
- **Link Preview**: open-graph-scraper for OG metadata extraction
- **Deployment**: Vercel (main app) + Fly.io (tldraw sync server, Phase 2)

## Architecture Decisions
- tldraw whiteboard uses `useSyncDemo` for prototyping, will migrate to self-hosted `useSync` + `TLSocketRoom` on Fly.io for production
- Whiteboard data is stored by tldraw sync server (SQLite); Supabase only keeps room_id mapping
- Images are compressed client-side first (max 1920px, quality 0.8), then server-side via sharp (WebP + thumbnail generation)
- PDF slides uploaded to Supabase Storage; per-page link resources stored in `slide_resources` table
- All pages behind auth middleware except landing page
- Admin role managed via `users.role` column + RLS policies

## UI Design
- **Student Dashboard** (`/dashboard`): Game menu style — large greeting + ▶ course selection with hover animations
- **Course Pages** (`/course/[id]/*`): Left sidebar navigation (collapsible) + right content area
- **Admin Pages** (`/admin/*`): Standard dashboard UI — practical management interface
- Animations: framer-motion for fade-in, stagger, hover effects

## Project Structure
```
src/
├── app/
│   ├── (auth)/                    # Login, OAuth callback
│   │   ├── login/page.tsx
│   │   └── auth/callback/route.ts
│   ├── (main)/                    # Authenticated routes
│   │   ├── layout.tsx             # Auth check wrapper
│   │   ├── dashboard/page.tsx     # Game menu style course list
│   │   ├── admin/                 # Admin pages (standard dashboard UI)
│   │   │   └── courses/
│   │   │       ├── page.tsx
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/page.tsx
│   │   └── course/
│   │       └── [id]/
│   │           ├── layout.tsx     # Left sidebar navigation
│   │           ├── page.tsx       # Redirect to whiteboard
│   │           ├── whiteboard/page.tsx
│   │           ├── slides/page.tsx
│   │           ├── assignments/page.tsx
│   │           └── resources/page.tsx
│   ├── api/
│   │   ├── og-metadata/route.ts
│   │   └── upload/route.ts
│   ├── layout.tsx
│   └── page.tsx                   # Landing page
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/
│   │   ├── course-sidebar.tsx     # Left sidebar for course pages
│   │   └── admin-sidebar.tsx      # Admin sidebar
│   ├── dashboard/
│   │   └── game-menu-card.tsx     # ▶ Game-style course selection
│   ├── whiteboard/
│   │   └── tldraw-editor.tsx      # dynamic import, ssr: false
│   ├── slides/
│   │   ├── pdf-viewer.tsx         # react-pdf slide viewer
│   │   └── page-resources.tsx     # Per-page link cards
│   ├── gallery/
│   │   ├── assignment-card.tsx
│   │   ├── masonry-grid.tsx
│   │   └── upload-dialog.tsx
│   ├── resources/
│   │   ├── link-card.tsx
│   │   └── add-link-dialog.tsx
│   └── admin/
│       ├── course-form.tsx
│       ├── member-manager.tsx
│       ├── week-manager.tsx
│       └── slide-manager.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server component client
│   │   └── middleware.ts          # Auth middleware helper
│   ├── image-utils.ts             # Compression/resize utilities
│   └── types.ts                   # Database types (generated or manual)
├── hooks/
│   ├── use-user.ts
│   └── use-course.ts
└── middleware.ts                   # Auth guard (root level)
```

## Database Schema
Tables: `users`, `courses`, `course_members`, `weeks`, `assignments`, `slides`, `slide_resources`, `resources`, `whiteboards`
- See `supabase/migrations/` for full schema
- RLS policies enforce access control per table

## Key Commands
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
```

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_TLDRAW_LICENSE_KEY=
```

## Development Notes
- tldraw component MUST use `dynamic(() => import(...), { ssr: false })` — it requires browser APIs
- Supabase client for server components: use `createServerClient` from `@supabase/ssr`
- Supabase client for client components: use `createBrowserClient` from `@supabase/ssr`
- Image upload pipeline: client compress → POST /api/upload → sharp process → Supabase Storage
- PDF slides: react-pdf `<Document>` + `<Page>` with `onLoadSuccess` for auto page count
- Slide resources: linked per slide_id + page_number, fetched on page change
- All commits should be atomic per feature/phase
- Push after each phase completion

## License Considerations
- tldraw: Hobby license (non-commercial, "made with tldraw" watermark required)
- All other dependencies: MIT or Apache-2.0 compatible
