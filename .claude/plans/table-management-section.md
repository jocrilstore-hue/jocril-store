# Table Management Section Plan

**Date:** 2025-11-30
**Status:** Completed

## Overview

Add a new "Gestão de Tabelas" section to the existing `/admin/products/tools` page for managing lookup tables (categories and materials).

---

## Database Schema Reference

### Categories Table
- `id` (SERIAL, PK)
- `name` (VARCHAR 200, NOT NULL)
- `slug` (VARCHAR 200, UNIQUE, NOT NULL)
- `parent_id` (INT, FK to categories.id, nullable)
- `description` (TEXT, nullable)
- `image_url` (VARCHAR 500, nullable)
- `display_order` (INT, DEFAULT 0)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `seo_title`, `seo_description` (SEO fields)
- `created_at`, `updated_at` (timestamps)

### Materials Table
- `id` (SERIAL, PK)
- `name` (VARCHAR 100, UNIQUE, NOT NULL)
- `thickness_mm` (DECIMAL 5,2, nullable)
- `properties` (JSONB, nullable)
- `description` (TEXT, nullable)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (timestamps)

---

## Todo Checklist

- [x] **1. Create Categories Editor Component**
  - Fetch all categories (including inactive) with hierarchy
  - Display in table with indentation for children
  - Add/Edit form with: name, slug (auto-generate), description, parent_id dropdown, is_active toggle
  - Delete with confirmation + warning if products assigned
  - Show display_order as read-only reference

- [x] **2. Create Materials Editor Component**
  - Fetch all materials (including inactive)
  - Display in table
  - Add/Edit form with: name, description, thickness_mm, is_active toggle
  - Delete with confirmation + warning if products assigned

- [x] **3. Update Product Tools Dashboard**
  - Add new "Gestão de Tabelas" section
  - Include both editors as side-by-side cards

---

## Implementation Details

### Component Structure

```
components/admin/products/
├── product-tools-dashboard.tsx (update)
├── categories-editor.tsx (new)
└── materials-editor.tsx (new)
```

### Categories Editor Features
- Hierarchical display with visual indentation
- Auto-slug generation from name
- Parent category dropdown (exclude self and children)
- Product count per category
- Inline editing or modal form

### Materials Editor Features
- Simple table layout
- Thickness displayed with "mm" suffix
- Product count per material
- Inline editing or modal form

### Shared Patterns
- Use AlertDialog for delete confirmation
- Check product assignments before delete
- Toast notifications for success/error
- Loading states during operations

