# Plan: Align Order API with Database Schema

## Current State Analysis

The base API (`app/api/orders/route.ts`) matches the migration (`20251220_create_order_tables.sql`).

**However, the task mentions additional fields that are NOT yet implemented:**

### Missing from `orders` table:
- `eupago_reference` - Payment reference code
- `eupago_entity` - Payment entity (for Multibanco)
- `eupago_transaction_id` - Transaction ID from EuPago
- `payment_deadline` - Deadline for payment
- `paid_at` - When payment was received

### Missing from `order_items` table:
- `product_name` - Snapshot of product name at order time
- `product_sku` - Snapshot of SKU
- `size_format` - Size/format description

## Checklist

- [x] Review current API and schema
- [ ] Create migration to add missing columns
- [ ] Update API to capture product snapshots in order_items
- [ ] Add GET endpoint for order lookup
- [ ] Add Zod validation schemas
- [ ] Update types

## Implementation

### Phase 1: Database Migration
Add missing columns to orders and order_items.

### Phase 2: API Updates
1. Capture product name, SKU, size when creating order items
2. Add GET endpoint for fetching orders by order_number or user

### Phase 3: Validation
Add Zod schemas for type safety.

## Review

**Completed**

### Files Created/Modified

1. **`supabase/migrations/20251220_add_order_extra_fields.sql`** - Adds:
   - EuPago fields: `eupago_reference`, `eupago_entity`, `eupago_transaction_id`, `payment_deadline`, `paid_at`
   - Snapshot fields: `product_name`, `product_sku`, `size_format`

2. **`app/api/orders/route.ts`** - Complete rewrite with:
   - Zod validation schemas for all inputs
   - GET endpoint for fetching orders (by order_number or user's orders)
   - Product snapshot capture (name, SKU, size_format)
   - Consistent response format: `{ success: boolean, data?: T, error?: string }`
   - Portuguese error messages
   - Proper auth checks for order ownership

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders?order_number=JCR-xxx` | Fetch single order |
| GET | `/api/orders` | Fetch user's orders (requires auth) |
| POST | `/api/orders` | Create new order |

### Next Steps

1. Run migration in Supabase dashboard
2. Test order creation flow
3. Implement EuPago payment integration (uses the new columns)
