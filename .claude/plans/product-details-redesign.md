# Product Details Section Redesign

## Current State Analysis
- Horizontal tabs (DESCRIÇÃO, ESPECIFICAÇÕES, ONDE UTILIZAR, FAQ)
- Content hidden behind tabs - users can only see one section at a time
- Technical image and specs shown side-by-side when active
- Generic accordion for "Onde Utilizar" with hardcoded content
- Standard FAQ accordion

## Problems
1. Tabs hide content - users must click to discover information
2. Layout feels fragmented and clinical
3. No visual hierarchy or storytelling flow
4. Technical specs feel disconnected from the product narrative
5. The vertical nav draft is better but still feels like "tabs rotated 90 degrees"

## Design Concept: "Stacked Sections with Visual Anchors"

Instead of tabs or nav, present all information in a flowing, stacked layout that the user scrolls through. Each section has a distinct visual treatment but maintains cohesion.

### Layout Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  SECTION 1: DESCRIÇÃO                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Full-width text with generous whitespace                │  │
│  │  Optional: small inline accent (like a quote or callout) │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  SECTION 2: ESPECIFICAÇÕES TÉCNICAS                            │
│  ┌─────────────────────────────┬────────────────────────────┐  │
│  │                             │                            │  │
│  │   Technical Drawing         │    Specs in elegant        │  │
│  │   (if exists, prominent)    │    key-value pairs         │  │
│  │                             │                            │  │
│  └─────────────────────────────┴────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  SECTION 3: APLICAÇÕES (Onde Utilizar)                         │
│  ┌────────┬────────┬────────┬────────┐                         │
│  │  Card  │  Card  │  Card  │  Card  │  Horizontal scroll or   │
│  │  with  │  with  │  with  │  with  │  grid of use cases      │
│  │  icon  │  icon  │  icon  │  icon  │                         │
│  └────────┴────────┴────────┴────────┘                         │
├─────────────────────────────────────────────────────────────────┤
│  SECTION 4: FAQ (Expandable)                                    │
│  Only show if FAQ exists. Clean accordion.                      │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Design Principles:

1. **Section Labels**: Small, uppercase, tracking-wide labels with the accent underline
2. **White Space**: Generous padding between sections (py-16 or more)
3. **Asymmetry**: Let content breathe; don't force everything into equal columns
4. **Technical Drawing**: Make it the hero of the specs section - larger, prominent
5. **Applications Grid**: Visual cards instead of accordions - more scannable

### Key Styling (following your design system):
- Border-dashed with `var(--color-base-500)` for section dividers
- Accent color `var(--accent-100)` for highlights
- Uppercase + letter-spacing for all labels
- IBM Plex Mono for body, Geist Sans for headings

## Implementation Checklist

- [ ] Remove Tabs component from product details
- [ ] Create new stacked section structure
- [ ] Design Description section with breathing room
- [ ] Design Specifications section with prominent technical image
- [ ] Replace Onde Utilizar accordion with visual grid cards
- [ ] Keep FAQ as clean accordion (conditional render)
- [ ] Add subtle section dividers
- [ ] Test responsive behavior

## File to Modify
- `components/product-detail.tsx`
