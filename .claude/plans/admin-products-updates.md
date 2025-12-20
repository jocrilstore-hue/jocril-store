# Admin Products Page Updates Plan

**Date:** 2025-11-30
**Status:** Completed

## Overview

Updates to the admin products list page including:
1. Fix thumbnail rendering or remove column
2. Add bulk delete action
3. Add bulk "Move to Category" action
4. Add bulk "Move to Material" action

---

## Investigation Findings

### Thumbnail Issue Analysis

The current thumbnail implementation in `product-templates-table.tsx` (lines ~750-770):
- Displays `template.thumbnailUrl` if present
- Falls back to placeholder icon if missing

The `thumbnailUrl` is sourced from `admin-products.ts` `mapTemplateRow()`:
- Derived from first active variant's `main_image_url`
- Falls back to first variant's `main_image_url` if no active variant
- Returns `null` if no variants exist or no images set

**Root Cause:** Products likely don't have variants with `main_image_url` populated, OR the `product_template_images` table (which has a `main` image type) is not being used for thumbnails.

**Solution:** Update the query to also check `product_template_images` for main images if no variant images exist.

---

## Todo Checklist

- [x] **1. Fix Thumbnail Rendering**
  - Updated `fetchAdminProductTemplates` in `admin-products.ts` to also fetch from `product_template_images` (main type) 
  - Modified `mapTemplateRow` to prioritize: template main image → variant main_image_url → null
  - Verified images are present in storage (products 1 and 5 have main images)

- [x] **2. Add Bulk Delete Action**
  - Added "Eliminar" button to bulk actions bar with Trash2 icon
  - Created confirmation dialog (AlertDialog) with count of items
  - Implemented `handleBulkDelete` function
  - Uses Supabase `.delete().in("id", selection)` 
  - Proper error handling and toast feedback

- [x] **3. Add Bulk "Move to Category" Action**
  - Added dropdown Select for categories in bulk action bar
  - Label: "Mover Categoria" with FolderInput icon
  - Added "Aplicar" button next to dropdown (disabled when no selection)
  - Uses existing `handleBulkUpdate` pattern with `{ category_id: selectedCategoryId }`

- [x] **4. Add Bulk "Move to Material" Action**
  - Added dropdown Select for materials in bulk action bar
  - Label: "Mover Material" with FolderInput icon
  - Added "Aplicar" button next to dropdown (disabled when no selection)
  - Uses existing `handleBulkUpdate` pattern with `{ material_id: selectedMaterialId }`

---

## Implementation Details

### 1. Thumbnail Fix

**File:** `lib/supabase/queries/admin-products.ts`

In `fetchAdminProductTemplates`, modify the query to also fetch template images:

```typescript
const { data: templateImages } = await supabase
  .from("product_template_images")
  .select("product_template_id, image_url")
  .eq("image_type", "main")
```

Then in `mapTemplateRow`, check template images first:
```typescript
const templateMainImage = templateImages?.find(
  img => img.product_template_id === template.id
)?.image_url;

thumbnailUrl: templateMainImage ?? thumbnailSource?.main_image_url ?? null
```

### 2. Bulk Delete

**File:** `components/admin/products/product-templates-table.tsx`

Add to bulk action bar (after existing buttons):
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash2 className="mr-2 h-4 w-4" />
      Eliminar
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Eliminar produtos?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação irá eliminar permanentemente {selection.size} produto(s).
        Esta ação não pode ser revertida.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleBulkDelete}>
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Delete handler:
```typescript
const handleBulkDelete = async () => {
  const ids = Array.from(selection);
  const { error } = await supabase
    .from("product_templates")
    .delete()
    .in("id", ids);
  
  if (error) {
    toast.error("Erro ao eliminar produtos");
    return;
  }
  
  toast.success(`${ids.length} produto(s) eliminado(s)`);
  setSelection(new Set());
  refreshData();
};
```

### 3 & 4. Bulk Move Category/Material

Add state for selected values:
```typescript
const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
const [bulkMaterialId, setBulkMaterialId] = useState<string>("");
```

Add to bulk action bar:
```tsx
{/* Move to Category */}
<div className="flex items-center gap-2">
  <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Mover Categoria" />
    </SelectTrigger>
    <SelectContent>
      {categories.map((cat) => (
        <SelectItem key={cat.id} value={cat.id.toString()}>
          {cat.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Button
    size="sm"
    variant="outline"
    disabled={!bulkCategoryId}
    onClick={() => handleBulkUpdate(
      { category_id: parseInt(bulkCategoryId) },
      `${selection.size} produto(s) movido(s) para categoria`
    )}
  >
    Aplicar
  </Button>
</div>

{/* Move to Material - same pattern */}
```

---

## Review Section

### Summary

All 4 requested features have been implemented:

1. **Thumbnail Fix**: The admin products table now correctly displays thumbnails by fetching images from the `product_template_images` table (main image type). The query was updated to include the `template_images` relation, and `mapTemplateRow` now prioritizes template main images over variant images.

2. **Bulk Delete**: Added a destructive "Eliminar" button with an AlertDialog confirmation that warns users about permanent deletion. The dialog shows the count of selected products and mentions that variants will also be deleted.

3. **Bulk Move Category**: Added a dropdown selector populated with all active categories, with an "Aplicar" button that's disabled until a category is selected.

4. **Bulk Move Material**: Same pattern as category, with a dropdown for materials and "Aplicar" button.

### Files Modified

- `lib/supabase/queries/admin-products.ts` (lines 30-75, 207-248, 280-305)
  - Added `template_images` to `RawTemplateRow` type
  - Updated `mapTemplateRow` to prioritize template main image
  - Added `template_images` join to the fetch query

- `components/admin/products/product-templates-table.tsx`
  - Added AlertDialog imports
  - Added FolderInput icon import
  - Added `bulkCategoryId` and `bulkMaterialId` state
  - Added `handleBulkDelete` function
  - Updated bulk action bar with delete button, category dropdown, and material dropdown

### Build Status

✅ Build successful - no TypeScript or compilation errors.

