# Plan: Fix Order Tables Schema

## Problem Summary

The `app/api/orders/route.ts` expects a different database schema than what's defined in `scripts/03-create-order-tables.sql`. The tables don't exist yet, so we need to create a corrected migration.

## Discrepancies Found

### 1. `customers` table
| Column | API Expects | SQL Has |
|--------|-------------|---------|
| Name | `first_name`, `last_name` | `full_name` |
| Auth | `auth_user_id` (UUID) | Missing |

### 2. `shipping_addresses` table
| Column | API Expects | SQL Has |
|--------|-------------|---------|
| Address Line 1 | `address_line_1` | `address_line1` |

### 3. `orders` table
| Column | API Expects | SQL Has |
|--------|-------------|---------|
| Shipping cost excl | `shipping_cost_excluding_vat` | `shipping_cost` (single) |
| Shipping cost incl | `shipping_cost_including_vat` | Missing |
| Total excl | `total_amount_excluding_vat` | `total_excluding_vat` |
| Total incl | `total_amount_with_vat` | `total_including_vat` |
| Notes | `notes` | `customer_notes` + `internal_notes` |

### 4. `order_items` table
| Column | API Expects | SQL Has |
|--------|-------------|---------|
| Unit price incl | `unit_price_with_vat` | `unit_price_including_vat` |
| Line total excl | `line_total_excluding_vat` | `subtotal_excluding_vat` |
| Line total incl | `line_total_with_vat` | `subtotal_including_vat` |

## Decision

**Update the SQL script to match the API** because:
1. The API is already written and tested with this structure
2. API includes `auth_user_id` for Clerk integration (required)
3. API has proper first/last name split (more flexible)
4. API has detailed VAT handling for shipping

## Checklist

- [ ] Create new migration file `supabase/migrations/YYYYMMDD_create_order_tables.sql`
- [ ] Update `customers` table: use `first_name`, `last_name`, add `auth_user_id`
- [ ] Update `shipping_addresses` table: use `address_line_1`
- [ ] Update `orders` table: proper VAT columns, use `notes`
- [ ] Update `order_items` table: correct column names
- [ ] Keep indexes and triggers
- [ ] Add RLS policies for security
- [ ] Test by running migration locally

## Review

**Completed:** Created `supabase/migrations/20251220_create_order_tables.sql`

### Changes Made
1. **customers**: Uses `first_name` + `last_name`, added `auth_user_id` (TEXT for Clerk IDs)
2. **shipping_addresses**: Uses `address_line_1` with underscore
3. **orders**: All VAT columns match API (`shipping_cost_excluding_vat`, `shipping_cost_including_vat`, `total_amount_excluding_vat`, `total_amount_with_vat`), single `notes` field
4. **order_items**: Uses `unit_price_with_vat`, `line_total_excluding_vat`, `line_total_with_vat`

### Additional Improvements
- Added `idx_customers_auth_user_id` index for Clerk user lookups
- Added `idx_orders_created_at` index for date-based queries
- Used `TIMESTAMPTZ` instead of `TIMESTAMP` for proper timezone handling
- Added RLS policies for all tables (service role full access + user self-access)

### Next Steps
Run the migration:
```bash
npx supabase db push
```

Or apply via Supabase dashboard.
