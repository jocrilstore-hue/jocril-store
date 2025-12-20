# Auto-generate Product Fields on Name Input

## Problem
When creating a new product, the user has to manually fill:
- Slug (URL-friendly version of name)
- Reference code (unique product identifier)
- SKU prefix (for variant SKUs)
- Display order (ordem de exibição)

These should be auto-generated when the user types the product name.

## Solution

### Changes to `components/admin/products/product-template-form.tsx`:

1. **Auto-generate on name change (create mode only)**
   - Watch the `name` field
   - When name changes and mode is "create":
     - Generate slug from name
     - Generate reference code: "J-" + random 6 chars (uppercase alphanumeric)
     - Generate SKU prefix from name (first letters of words, uppercase)

2. **Hide display order field**
   - Remove from the form UI (it's not needed for new products)
   - Keep the default value of 0 in the schema

3. **Generate functions**
   - `generateReferenceCode()`: Returns "J-" + 6 random uppercase alphanumeric chars
   - `generateSkuPrefix(name)`: First letter of each word, uppercase, max 5 chars

## Checklist
- [x] Add `generateReferenceCode()` function
- [x] Add `generateSkuPrefix(name)` function  
- [x] Add useEffect to auto-generate fields when name changes (create mode)
- [x] Remove display order field from UI
- [x] Edit mode protection: useEffect only runs when `mode === "create"`

## Review

### Changes Made

**lib/validations/product-schemas.ts:**
- Added `generateReferenceCode()`: Returns "J-" + 6 random uppercase alphanumeric chars
- Added `generateSkuPrefix(name)`: First letter of each word, uppercase, max 5 chars

**components/admin/products/product-template-form.tsx:**
- Imported new generation functions
- Added useEffect that watches `name` field and auto-generates:
  - Slug (always regenerated as name changes)
  - Reference code (only if empty, so it stays stable once generated)
  - SKU prefix (regenerated as name changes)
- useEffect only runs in create mode (`mode !== "create"` guard)
- Removed "Ordem de exibição" field from UI (defaults to 0)

### Behavior
- Type product name → slug, reference code, and SKU prefix auto-fill
- Reference code is generated once and doesn't change after
- Edit mode: no auto-generation, existing values preserved
- Display order hidden from UI, uses default value 0
