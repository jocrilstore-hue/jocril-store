# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Rules

1. Think first. Read relevant files. Write a plan to `.claude/plans/`.
2. Plan includes a checklist of todo items to mark off.
3. **STOP** — Check in with me before executing. I verify the plan.
4. Execute todos, marking complete as you go.
5. Give me a high-level summary of each change as you make it.
6. **SIMPLICITY IS LAW** — Every change should be minimal, surgical, and impact as little code as possible. No clever solutions. No over-engineering.
7. Add a review section to the plan with a summary and any relevant notes.
8. **NO LAZY FIXES** — Find root causes. No band-aids. No "temporary" solutions. You are a senior developer. Act like it.
9. If something is unclear or you're unsure, ASK. Don't guess and proceed.

## Project Overview

Jocril Acrílicos - An e-commerce platform for professional acrylic display products (expositores, porta-menus, urnas). Built with Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase, and Radix UI components.

## Commands

```bash
# Development
pnpm dev          # Start development server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Architecture

### Route Groups
- `app/(site)/` - Public storefront pages (produtos, carrinho, checkout, categorias)
- `app/(admin)/admin/` - Protected admin panel with role-based access
- `app/api/` - API routes for orders and admin operations

### Key Directories
```
components/
├── ui/                # shadcn/ui components (Radix-based)
├── admin/             # Admin panel components
│   └── products/      # Product management (templates, variants, images)
└── [feature].tsx      # Site-wide components (header, footer, cart)

lib/
├── supabase/          # Supabase client (server.ts, client.ts, middleware.ts)
│   └── queries/       # Database query functions (admin-products.ts)
├── auth/              # Authentication & permissions
├── validations/       # Zod schemas
├── utils/             # Stock, image upload, error handling
└── types.ts           # Core TypeScript interfaces

contexts/
└── cart-context.tsx   # Shopping cart with localStorage persistence

hooks/
└── use-*.ts           # Custom React hooks (debounce, mobile, toast)
```

### Data Model
The product system uses a template-variant hierarchy:
- **ProductTemplate** - Base product with metadata, description, FAQ
- **ProductVariant** - Size/format variations with SKU, pricing, stock
- **PriceTier** - Quantity-based discount tiers per variant
- **ProductImage** / **ProductTemplateImage** - Gallery images

### Admin Authentication
Uses layered permission checking in `lib/auth/permissions.ts`:
1. User metadata roles (app_metadata.role, user_metadata.role)
2. Environment variable admin emails (ADMIN_EMAILS, NEXT_PUBLIC_ADMIN_EMAILS)
3. Database `user_roles` table lookup

Admin routes are protected in `app/(admin)/admin/layout.tsx` using `userIsAdmin()`.

### Supabase Integration
- Server-side client: `lib/supabase/server.ts` using `@supabase/ssr`
- Migrations in `supabase/migrations/`
- Local config: `supabase/config.toml` (project_id: loja-jocril)

## Styling

- Tailwind CSS 4 with `tailwindcss-animate`
- CSS variables for theming (light/dark mode) in `app/globals.css`
- Typography: Geist Sans (headings), IBM Plex Mono (body)
- Uses oklch color space for design tokens
- All headings/buttons are uppercase with letter-spacing

## Conventions

### Supabase Queries
Always use the server client for data fetching in Server Components:
```typescript
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
```

### TypeScript
Strict mode enabled. Key interfaces in `lib/types.ts`:
- `ProductTemplate`, `ProductVariant`, `PriceTier`
- `Cart`, `CartItem` for shopping cart

### Component Patterns
- Form validation with react-hook-form + zod resolvers
- Toast notifications via sonner
- Admin tables use server-side pagination with query functions
