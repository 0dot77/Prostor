# Prostor - Creative LMS Platform

## Project Overview
Prostor (Russian: Простор, "open space") is a lightweight creative LMS platform for workshops and classes.
It combines a real-time collaborative whiteboard, an Instagram-style assignment gallery, and curated link resources into a single cohesive tool.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS v4 (CSS-first config) + shadcn/ui + lucide-react
- **Database / Auth / Storage**: Supabase (PostgreSQL, Google OAuth, Storage, Realtime)
- **Whiteboard**: tldraw (Hobby license) with `@tldraw/sync`
- **Image Optimization**: browser-image-compression (client) + sharp (server) → WebP
- **Link Preview**: open-graph-scraper for OG metadata extraction
- **Deployment**: Vercel (main app) + Fly.io (tldraw sync server, Phase 2)

## Architecture Decisions
- tldraw whiteboard uses `useSyncDemo` for prototyping, will migrate to self-hosted `useSync` + `TLSocketRoom` on Fly.io for production
- Whiteboard data is stored by tldraw sync server (SQLite); Supabase only keeps room_id mapping
- Images are compressed client-side first (max 1920px, quality 0.8), then server-side via sharp (WebP + thumbnail generation)
- All pages behind auth middleware except landing page
- Admin role managed via `users.role` column + RLS policies

## Project Structure
```
src/
├── app/
│   ├── (auth)/           # Login, OAuth callback
│   ├── (main)/           # Authenticated routes
│   │   ├── dashboard/    # User's course list
│   │   ├── admin/        # Admin: course/member/week CRUD
│   │   └── course/[id]/  # Course pages (whiteboard, assignments, resources)
│   └── api/              # API routes (upload, og-metadata)
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Sidebar, tabs
│   ├── whiteboard/       # tldraw wrapper (dynamic import, ssr: false)
│   ├── gallery/          # Assignment cards, masonry grid, upload dialog
│   ├── resources/        # Link cards, add link dialog
│   └── admin/            # Course form, member manager, week manager
├── lib/
│   ├── supabase/         # Client/server Supabase helpers
│   ├── image-utils.ts    # Compression/resize utilities
│   └── types.ts          # Database types
├── hooks/                # Custom React hooks
└── middleware.ts          # Auth guard
```

## Database Schema
Tables: `users`, `courses`, `course_members`, `weeks`, `assignments`, `resources`, `whiteboards`
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
- All commits should be atomic per feature/phase
- Push after each phase completion

## License Considerations
- tldraw: Hobby license (non-commercial, "made with tldraw" watermark required)
- All other dependencies: MIT or Apache-2.0 compatible
