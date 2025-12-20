# Package: UI Components

## Package Identity
- Reusable UI elements, powered by Radix UI and Tailwind CSS 4.

## Patterns & Conventions
- **Library**: `components/ui` contains Shadcn-like primitives.
  - ⚠️ AVOID modifying `components/ui` logic unless widely necessary. Extend via props/variants.
- **Feature Components**: Components specific to business logic (e.g., `product-detail.tsx`) reside in root `components/` or subfolders like `components/admin`.
- **Styling**: Tailwind classes. Use `cn()` utility for class merging.

### Examples
- ✅ DO: Use `import { Button } from "@/components/ui/button"`
- ❌ DON'T: Create new button styles from scratch if `Button` variant exists.

## Touch Points
- UI Library: `components/ui/*`
- Icons: `lucide-react` (imported as `import { IconName } from "lucide-react"`)

## JIT Index Hints
- Find UI primitive: `fd ".tsx" components/ui`
- Find admin component: `fd ".tsx" components/admin`
