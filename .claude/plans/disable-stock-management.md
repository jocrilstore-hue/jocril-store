# Plan: Disable Stock Management (Dormant Mode)

## Context
Jocril products are manufactured-to-order, so stock management should be disabled for now. All products should behave as "não movimenta stock" (does not manage stock) - meaning no stock restrictions on purchases.

## Changes Required

### 1. Schema Default Change
**File:** `lib/validations/product-schemas.ts`
- [ ] Change `stockQuantity` default from 0 to a high number (e.g., 999999)
- [ ] Change `stockStatus` default from `"in_stock"` to remain but be ignored

### 2. Product Detail Page
**File:** `components/product-detail.tsx`
- [ ] Remove `max={selectedVariant.stock_quantity}` from quantity input (line ~290)
- [ ] Remove `disabled={quantity >= selectedVariant.stock_quantity}` from + button (line ~295)
- [ ] Remove `disabled={selectedVariant.stock_status === "out_of_stock"}` from cart button (line ~310)
- [ ] Set a reasonable max order quantity (e.g., 9999) instead of stock-based limits

### 3. Cart Context
**File:** `contexts/cart-context.tsx`
- [ ] Remove `Math.min(..., item.stockQuantity)` constraint in `addToCart` (line 71)
- [ ] Remove `Math.min(quantity, item.stockQuantity)` constraint in `updateQuantity` (line 114)
- [ ] Use a fixed max (e.g., 9999) instead

### 4. Stock Management Utils (Optional - Leave as-is)
**File:** `lib/utils/stock-management.ts`
- No changes needed - keep for future use

### 5. Stock Badge Component (Optional - Leave as-is)
**File:** `components/ui/stock-badge.tsx`
- No changes needed - keep for future use, just won't be displayed

## Review
After implementation:
- Products should always be purchasable regardless of stock_quantity value
- Quantity selectors should allow up to 9999 units
- No "out of stock" blocking behavior
- Stock infrastructure remains for future activation
