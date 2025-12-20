# Plan: Add specifications_json to Product Variants

## Status: COMPLETED

## Problem
Technical specifications (Especificações Técnicas) are currently stored only at the **template level** (`product_templates.specifications_json`). However, for products with size variations (A6, A5, A4, etc.), the specs change per variant since dimensions are different.

## Solution Implemented

### 1. Database Migration
- [x] Created `supabase/migrations/20250129_add_variant_specifications.sql`
- [x] Applied migration to Supabase project

### 2. Backend Updates
- [x] Added `specificationsJson` to `ProductVariantDetail` interface
- [x] Updated `fetchVariantDetail` query to include `specifications_json`
- [x] Added `specificationsJson` to validation schema in `product-schemas.ts`

### 3. Variant Form Simplification
- [x] Added SpecificationsEditor to variant form
- [x] Removed Stock & Logística card (manufactured products)
- [x] Removed Image upload card (uses template image)
- [x] Removed Conteúdo específico card
- [x] Cleaned up unused imports and state

### 4. Product Detail Display
- [x] Updated `product-detail.tsx` to prioritize variant specs over template specs

## Display Logic
```typescript
{selectedVariant.specifications_json ? (
  <StructuredSpecifications specs={selectedVariant.specifications_json} />
) : template.specifications_json ? (
  <StructuredSpecifications specs={template.specifications_json} />
) : (
  <p>Especificações em breve.</p>
)}
```

## Files Changed
- `supabase/migrations/20250129_add_variant_specifications.sql` (new)
- `lib/supabase/queries/admin-products.ts`
- `lib/validations/product-schemas.ts`
- `components/admin/products/product-variant-form.tsx` (simplified)
- `components/product-detail.tsx`

## Review
Build passes. The variant edit form at `/admin/products/1/variants/1/edit` now shows:
1. Identificação (SKU, Slug, Format, Orientation, Active/Bestseller)
2. Dimensões personalizadas (only if custom format selected)
3. Preço (excluding/including VAT)
4. Especificações Técnicas (variant-specific specs that override template)
