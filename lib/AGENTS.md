# Package: Libraries & Utilities

## Package Identity
- Shared logic, database clients, helpers, and types.

## Patterns & Conventions
- **Supabase**: `lib/supabase` for client initialization and helpers.
- **Auth**: `lib/auth` for authentication logic.
- **Utils**: `lib/utils.ts` usually contains `cn` helper.
- **Types**: `lib/types.ts` or `lib/**/types.ts` for shared interfaces.

### Examples
- ✅ Database: Use singleton/helper from `lib/supabase` (e.g., `createClient`).
- ✅ Validation: Use Zod schemas from `lib/validations`.

## Touch Points
- Main Utils: `lib/utils.ts`
- Supabase: `lib/supabase/*`
- Types: `lib/types.ts`

## JIT Index Hints
- Find utility: `fd ".ts" lib`
- Find validation schema: `fd ".ts" lib/validations`
