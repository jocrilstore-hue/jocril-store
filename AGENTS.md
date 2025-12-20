# Project: My V0 Project (Loja Jocril)

## Project Snapshot
- **Type**: Single Project (Next.js App Router)
- **Stack**: Next.js 16, React 19, Bun, Supabase, Tailwind CSS 4
- **PackageManager**: Bun (`bun`)
- **Sub-agents**: See `app/AGENTS.md`, `components/AGENTS.md`, `lib/AGENTS.md`

## Root Setup Commands
- Install: `bun install`
- Dev: `bun dev` (starts on port 3000)
- Build: `bun run build`
- Lint: `bun run lint`

## Universal Conventions
- **Style**: Strict TypeScript, Tailwind CSS 4 for styling.
- **Imports**: Use `@/` for root relative imports (e.g., `@/components/ui/button`).
- **Icons**: `lucide-react`.
- **Components**: Functional components only.

## Security & Secrets
- `.env.local` for secrets (SUPABASE_KEY, etc).
- **NEVER** commit secrets.

## JIT Index - Directory Map
### Core Structure
- **Pages/Routes**: `app/` → [see app/AGENTS.md](app/AGENTS.md)
  - Admin: `app/(admin)`
  - Public: `app/(site)`
  - API: `app/api`
- **UI Components**: `components/` → [see components/AGENTS.md](components/AGENTS.md)
  - Shadcn UI: `components/ui`
- **Lib/Utils**: `lib/` → [see lib/AGENTS.md](lib/AGENTS.md)
  - Supabase: `lib/supabase`

### Quick Find Commands
- Find Page: `fd "page.tsx" app`
- Find Component: `fd ".tsx" components`
- Find Utility: `fd ".ts" lib`

## Definition of Done
- Types check (`bun run build` implies typecheck).
- Lint passes (`bun run lint`).
- No hardcoded secrets.
