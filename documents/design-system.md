# Jocril Design System

## Foundations

### Typography
- **Primary sans family:** Geist with a fallback to Arial-style metrics via `Geist Fallback`, exposed through the `--font-geist-sans` custom property and applied globally via utility classes. @css/fonts.css#1-1
- **Primary mono family:** Geist Mono with matching fallback metrics, referenced by `--font-geist-mono` for monospaced UI text. @css/fonts.css#1-1

| Utility | Font family | Size | Line height | Extras |
| --- | --- | --- | --- | --- |
| `.text-mono-xs` | `var(--font-geist-mono)` | 12 px | 100% | Uppercase, tight tracking for labels. @css/components.css#10-18 |
| `.text-mono-sm` | `var(--font-geist-mono)` | 14 px | 100% | Uppercase, −0.0175 rem tracking. @css/components.css#20-28 |
| `.text-mono-md` | `var(--font-geist-mono)` | 16 → 18 px (≥1024 px) | 120% | Responsive metadata text. @css/components.css#30-44 |
| `.text-mono-meta` | `var(--font-geist-mono)` | 14 → 16 px (≥1024 px) | 120% | Secondary meta details. @css/components.css#46-60 |
| `.heading-1` | `var(--font-geist-sans)` | 70 → 160 px (responsive) | 100–110% | Hero headline scale. @css/components.css#62-84 |
| `.heading-2` | `var(--font-geist-sans)` | 30 → 48 px | 100% | Section headings. @css/components.css#86-100 |

### Color System
- **Accent trio:** Defined inline for quick overrides (`--accent-100` #2DD4CD, `--accent-200` #16B7B2, `--accent-300` #00DED7) and used for highlight badges and focus treatments. @index.html#47-52
- **Core palette:** Dark and light neutrals plus grayscale and accent bridges are centralised in `:root`, exposing `--color-*` tokens (`--color-base-100`→`--color-base-1000`, `--color-dark-base-primary`, etc.) for consistent UI coloring. @css/main.css#1-1
- **Usage:** Component styles consume the palette by alias tokens (e.g., `var(--color-base-500)` in badges and cards) to stay theme-aware. @css/components.css#350-357

### Spacing, Radii & Motion
- `--spacing` establishes a 0.25 rem base unit; tokenised sizing utilities multiply this token throughout layout and typography. @css/main.css#1-1
- Radius scale (`--radius-xs`…`--radius-3xl`) supports consistent rounded corners across cards, buttons, and layout shells. @css/main.css#1-1
- Transition primitives (`--ease-out`, `--ease-in-out`, `--default-transition-duration`) standardise interaction feel across hover and focus states. @css/main.css#1-1

### Theme Behaviour
- Theme switching persists in `localStorage`, toggling `data-theme` on the `<html>` element while temporarily disabling transitions to avoid flicker. @index.html#60-78
- Component rules branch on `[data-theme="light"]` to adjust backgrounds, borders, and button treatments while reusing the same structural styles. @css/components.css#175-214

## Components

### Buttons
- Base `.btn` establishes shared sizing, border, and transition rules; disabled and focus-visible states reinforce accessibility with clear outlines. @css/components.css#105-167
- Variants (`.btn-login`, `.btn-cta`, `.btn-apply`) layer palette tokens for semantic intent, including hover and focus adjustments that invert text/background pairings. @css/components.css#140-251
- CTA buttons inside the header lock to a 44 px height, aligning with the theme toggle cluster for consistent rhythm. @css/components.css#302-333

### Badges & Labels
- `.badge` pairs uppercase mono text with the accent dot (`[data-slot='badge-icon']`) to signal sections. @css/components.css#342-354
- `.job-category-badge` wraps metadata chips with dashed borders that adapt to theme context via base color tokens. @css/components.css#418-436

### Cards & Lists
- `.job-listing` grid cards manage dashed hover borders, z-index elevation, and responsive column layouts to keep list items legible. @css/components.css#364-417
- Portfolio tiles (`.portfolio-card*`) reuse neutral backgrounds, dashed frames, and hover scaling while preserving accessible focus outlines. @css/components.css#629-749

## Layout & Utility Patterns
- Columnar gaps (`.flex-col-gap-*`) and flex helpers (`.flex-between`, `.flex-wrap-gap-2`) translate spacing tokens into reusable layout primitives. @css/components.css#462-523
- Grid scaffolding (`.grid-layout`, `.portfolio-grid`) snaps from 4 to 12 columns at large breakpoints to mirror the site’s responsive grid. @css/components.css#488-603
- Visibility toggles (`.hidden-mobile`, `.visible-md`, `.hidden-md`) gate content by breakpoint without reauthoring markup. @css/components.css#537-552
- Text tint utility `.text-base-400` lets long-form content inherit a consistent neutral shade. @css/components.css#554-557

## Interaction & Accessibility
- Focus outlines rely on accent or light tokens (`var(--color-accent-300)` or `var(--color-light-base-secondary)`) to remain visible on both dark and light themes. @css/components.css#124-167 @css/components.css#740-748
- Mobile and desktop theme switches share button sizing via the `.theme-selector-button` rules, ensuring large tap targets. @css/components.css#325-336 @index.html#101-164

## Layering
- A dedicated z-index scale (`--z-below`…`--z-maximum`) prevents stacking conflicts and documents intended usage (sticky headers, modals, toasts). @css/z-index-system.css#6-24
- Interactive overlays such as `.portfolio-lightbox` and its close control adopt these tokens to stay atop base content while respecting the hierarchy. @css/components.css#760-823

## Implementation Notes
- The global script applies a `disable-transitions` class while flipping themes, mirroring the design intent of instant theme changes without motion artifacts. @index.html#60-78
- Accent tokens are intentionally duplicated inline (`index.html`) for early paint, while full palette definitions live in the compiled Tailwind layer. Document both locations when updating colors. @index.html#47-52 @css/main.css#1-1
