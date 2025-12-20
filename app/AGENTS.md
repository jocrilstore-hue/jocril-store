# Package: Application Routes (app)

## Package Identity
- Contains all pages, layouts, and API routes for the Next.js App Router.
- **Framework**: Next.js 16 (App Router).

## Setup & Run
- Dev: `bun dev`

## Patterns & Conventions
- **Route Groups**:
  - `(admin)`: Admin dashboard routes (protected).
  - `(site)`: Public storefront routes.
- **Server Components**: Default. Use `"use client"` only for interactivity.
- **Data Fetching**: Fetch in Server Components (Page/Layout) using Supabase or other clients.
- **API Routes**: Located in `app/api`. Use `NextResponse`.

### Examples
- ✅ **Page**: `export default async function Page() { ... }`
- ✅ **API**: `export async function POST(req: Request) { ... }` in `route.ts`

## Touch Points
- Layouts: `app/layout.tsx` (Root), `app/(admin)/layout.tsx`, `app/(site)/layout.tsx`.
- Globals: `app/globals.css`.

## JIT Index Hints
- Find admin page: `fd "page.tsx" app/(admin)`
- Find api route: `fd "route.ts" app/api`
- Find layout: `fd "layout.tsx" app`
