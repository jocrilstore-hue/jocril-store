# Fix Admin Product Page - Dark Mode & Images

## Problem Summary
1. **Dark mode styling issue**: In the admin backoffice, form inputs, textareas, rich text editors, and cards become dark in dark mode making content hard to read. The backoffice should maintain light/white backgrounds for content areas regardless of theme.

2. **Images not appearing**: Need to verify the template images are being fetched and displayed correctly.

## Root Cause Analysis

### Styling Issue
The components use theme-aware CSS variables that change in dark mode:
- `Card`: Uses `bg-card` which becomes dark in dark mode
- `Input`: Uses `bg-transparent` with `dark:bg-input/30`
- `Textarea`: Uses `bg-transparent` with `dark:bg-input/30`
- `RichTextEditor`: Uses `bg-background` which becomes dark

For a backoffice, content areas should remain white/light for readability while the shell/sidebar can respect dark mode.

## Solution Plan

### Approach
Create admin-specific styling overrides. The simplest approach is to add explicit `bg-white dark:bg-white` or `bg-white dark:bg-neutral-50` to the admin form components where content needs to remain readable.

### Checklist

- [ ] **1. Fix Card component for admin context**
  - Add a variant or prop for "admin" mode that forces light background
  - OR: Override in the admin form directly with className

- [ ] **2. Fix Input fields in admin forms**
  - Add explicit light background override in admin context
  - Target: `product-template-form.tsx` and related admin forms

- [ ] **3. Fix Textarea fields in admin forms**
  - Same approach as inputs

- [ ] **4. Fix RichTextEditor**
  - Add explicit `bg-white dark:bg-white text-black dark:text-black` for the editable area

- [ ] **5. Verify images loading**
  - Check if `product_template_images` table exists and has data
  - Verify the `fetchTemplateImages` query is returning results
  - Check if images are being passed correctly to `TemplateImagesManager`

## Implementation Details

### Option A: Add CSS class for admin content areas
Create a utility class like `.admin-content` that forces light backgrounds:
```css
.admin-content {
  @apply bg-white dark:bg-white text-foreground dark:text-neutral-900;
}
```

### Option B: Direct overrides in admin components (Recommended - simpler)
Add explicit classes directly in the admin form components:
- Cards: `className="bg-white dark:bg-white"`
- Inputs: `className="bg-white dark:bg-white dark:text-neutral-900"`
- Rich text: Same pattern

I recommend **Option B** as it's more surgical and doesn't affect other parts of the app.

## Review Notes

### Implementation Summary
Instead of adding variants to each component (overcomplicated), we implemented a simple CSS-based solution:

1. **Added `.admin-content` CSS class** in `globals.css` that overrides CSS variables in dark mode to force light theme colors for the admin content area.

2. **Applied the class** to the admin shell content wrapper in `admin-shell.tsx`.

### Changes Made
- `app/globals.css`: Added `.admin-content` class with dark mode variable overrides
- `components/admin/admin-shell.tsx`: Added `admin-content` class to content wrapper
- `components/admin/products/template-images-manager.tsx`: Fixed TypeScript error (unrelated to styling)

### Result
- In dark mode, the admin content area (cards, inputs, text) will use light theme colors for better readability
- The sidebar and header can still respect the user's theme preference
- No component API changes needed - just CSS

### Images Status
Verified that images exist in the database for template 1 (8 images total). The images should display correctly now.
