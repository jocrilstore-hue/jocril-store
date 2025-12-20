# Loja Jocril

A modern e-commerce storefront built with Next.js 16, Supabase, and Tailwind CSS 4.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Radix UI
- **Database/Auth**: Supabase
- **Package Manager**: Bun

## Getting Started

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Run the development server**:
   ```bash
   bun dev
   ```

3. **Open the app**:
   Visit [http://localhost:3000](http://localhost:3000).

## Project Structure

- `app/(site)`: Public storefront pages.
- `app/(admin)`: Protected admin dashboard.
- `components/ui`: Shared UI components (Shadcn/Radix).
- `lib/supabase`: Database clients and helpers.

## AI Development

This project uses a hierarchical `AGENTS.md` system to guide AI assistants.
- **Root**: `AGENTS.md` (Project overview & universal conventions)
- **App**: `app/AGENTS.md` (Routing & Page patterns)
- **Components**: `components/AGENTS.md` (UI patterns)
- **Lib**: `lib/AGENTS.md` (Data & Utilities)
