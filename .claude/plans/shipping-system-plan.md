# Table Rate Shipping System - Implementation Plan

## Overview
Complete shipping system for Jocril Acrílicos with:
- 3 zones (Continental Portugal, Madeira, Azores)
- 2 shipping classes (Standard ≤30kg, Cargo >30kg)
- Volumetric weight calculation
- Free shipping for Continental orders ≥ €500

## Discovered Patterns to Follow

### Database
- Table names: snake_case
- IDs: SERIAL PRIMARY KEY
- Timestamps: `TIMESTAMPTZ DEFAULT NOW()` with `updated_at` triggers
- Money: INTEGER cents
- Weights: INTEGER grams
- Dimensions: INTEGER millimeters
- RLS: Service role full access, users own data

### API Routes
- Location: `app/api/admin/[resource]/route.ts`
- Auth: `import { auth } from "@clerk/nextjs/server"` + `userIsAdmin()`
- Validation: Zod schemas with `.safeParse()`
- Response: `{ success: boolean, data?, error? }`

### Admin UI
- Layout: `AdminShell` wrapper
- Pages: Server Components with `dynamic = "force-dynamic"`
- Tables: Custom table components with pagination
- Forms: react-hook-form + zod resolver
- Modals: Dialog from shadcn/ui

### Styling
- CSS variables from globals.css
- Button variants from components/ui/button.tsx
- Colors: oklch color space, never hardcoded

---

## Phase 1: Database Layer

### Todo Checklist
- [ ] Create migration for shipping tables
- [ ] Create RLS policies
- [ ] Create fn_get_zone_by_postal_code function
- [ ] Create fn_get_volumetric_weight_grams function
- [ ] Create fn_calculate_shipping function
- [ ] Alter product_variants table (add dimensions)
- [ ] Seed initial data (zones, classes, rates, settings)

### Tables to Create

#### 1. shipping_zones
```sql
CREATE TABLE shipping_zones (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,           -- 'continental', 'madeira', 'azores'
  name TEXT NOT NULL,                  -- 'Portugal Continental'
  postal_code_start INTEGER NOT NULL,  -- 1000
  postal_code_end INTEGER NOT NULL,    -- 8999
  free_shipping_threshold_cents INTEGER, -- 50000 (€500) for continental, NULL for islands
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. shipping_classes
```sql
CREATE TABLE shipping_classes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,           -- 'standard', 'cargo'
  name TEXT NOT NULL,                  -- 'Envio Standard'
  max_weight_grams INTEGER NOT NULL,   -- 30000 for standard
  carrier_name TEXT NOT NULL,          -- 'CTT Expresso, DPD'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. shipping_rates
```sql
CREATE TABLE shipping_rates (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES shipping_classes(id) ON DELETE CASCADE,
  min_weight_grams INTEGER NOT NULL,   -- 0
  max_weight_grams INTEGER NOT NULL,   -- 5000
  base_rate_cents INTEGER NOT NULL,    -- 500 (€5.00)
  extra_kg_rate_cents INTEGER NOT NULL DEFAULT 0, -- for >50kg rates
  estimated_days_min INTEGER NOT NULL DEFAULT 1,
  estimated_days_max INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zone_id, class_id, min_weight_grams)
);
```

#### 4. shipping_settings
```sql
CREATE TABLE shipping_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. Alter product_variants
```sql
ALTER TABLE product_variants
  ADD COLUMN length_mm INTEGER,
  ADD COLUMN width_mm INTEGER,
  ADD COLUMN height_mm INTEGER;
```

### Functions

#### fn_get_zone_by_postal_code
Returns zone info or NULL for invalid postal codes.

#### fn_get_volumetric_weight_grams
Calculates volumetric weight using divisor from settings.

#### fn_calculate_shipping
Main calculation function that:
1. Extracts numeric postal code
2. Finds zone
3. Fetches variant weights/dimensions
4. Calculates billable weight (max of actual vs volumetric)
5. Determines shipping class
6. Finds applicable rate
7. Calculates cost (with free shipping check for continental)
8. Returns comprehensive result JSON

### Seed Data
- 3 zones with postal code ranges
- 2 shipping classes
- All rates from the table
- Settings: volumetric_divisor = 4000

---

## Phase 2: API Layer

### Todo Checklist
- [ ] Create /api/admin/shipping/zones route (GET, POST, PUT, DELETE)
- [ ] Create /api/admin/shipping/classes route (GET, POST, PUT, DELETE)
- [ ] Create /api/admin/shipping/rates route (GET, POST, PUT, DELETE)
- [ ] Create /api/admin/shipping/settings route (GET, PUT)
- [ ] Create /api/shipping/calculate route (POST - public)
- [ ] Create /api/shipping/zones route (GET - public)
- [ ] Create Zod validation schemas

### API Endpoints

#### Admin Routes (protected)
All require `userIsAdmin()` check.

```typescript
// GET /api/admin/shipping/zones
// Returns all zones with rates summary

// POST /api/admin/shipping/zones
// Body: { code, name, postal_code_start, postal_code_end, free_shipping_threshold_cents?, is_active }

// PUT /api/admin/shipping/zones
// Body: { id, ...updates }

// DELETE /api/admin/shipping/zones
// Query: ?id=1
```

Similar patterns for classes, rates, settings.

#### Public Routes

```typescript
// POST /api/shipping/calculate
// Body: { cart_items: [{ variant_id, quantity }], postal_code: string }
// Returns: ShippingCalculation result

// GET /api/shipping/zones
// Returns: Public zone list for UI display
```

---

## Phase 3: Admin UI

### Todo Checklist
- [ ] Create shipping settings page at /admin/shipping
- [ ] Create zones table component
- [ ] Create classes table component
- [ ] Create rates matrix component
- [ ] Create zone edit modal
- [ ] Create class edit modal
- [ ] Create rate edit modal
- [ ] Add dimensions fields to product variant form

### Page Structure

```
app/(admin)/admin/shipping/
  page.tsx              # Main shipping settings page

components/admin/shipping/
  shipping-zones-table.tsx
  shipping-classes-table.tsx
  shipping-rates-matrix.tsx
  zone-edit-modal.tsx
  class-edit-modal.tsx
  rate-edit-modal.tsx
```

### Shipping Settings Page Layout
1. Header with title and description
2. Tabs: Zonas | Classes | Taxas | Definições
3. Each tab shows relevant table/form
4. Rate matrix as main focus (grid view)

### Product Dimensions
Add to existing product variant form:
- length_mm input
- width_mm input
- height_mm input
- Volumetric weight preview calculation

---

## Phase 4: Checkout Integration

### Todo Checklist
- [ ] Create ShippingCalculator component
- [ ] Integrate into checkout page
- [ ] Add shipping to cart context (optional summary)
- [ ] Update order creation to include shipping
- [ ] Add shipping_cost_cents to orders table (if not exists)

### ShippingCalculator Component
- Input: cart items from context
- Postal code input field
- Debounced API call on postal code change
- Display: zone, cost, carrier, estimated days
- Free shipping progress bar for continental

### Checkout Integration
1. Add postal code field to shipping address form
2. Show real-time shipping cost
3. Add shipping to order total
4. Store shipping details in order

---

## Phase 5: Edge Cases & Polish

### Todo Checklist
- [ ] Handle invalid postal codes
- [ ] Handle missing weights (default 0?)
- [ ] Handle missing dimensions (actual weight only)
- [ ] Handle weight exceeds all classes
- [ ] Handle zone not found
- [ ] Handle no active rates
- [ ] Handle empty cart
- [ ] Portuguese error messages
- [ ] Loading states
- [ ] Error states

### Error Messages (Portuguese)
- "Código postal inválido. Use o formato português (XXXX-XXX ou XXXX)."
- "Não foi possível calcular o envio. Peso excede o limite."
- "Zona de envio não encontrada para este código postal."
- "Adicione produtos ao carrinho para calcular o envio."

---

## Files to Create/Modify

### New Files
```
supabase/migrations/YYYYMMDDHHMMSS_create_shipping_tables.sql

app/api/admin/shipping/zones/route.ts
app/api/admin/shipping/classes/route.ts
app/api/admin/shipping/rates/route.ts
app/api/admin/shipping/settings/route.ts
app/api/shipping/calculate/route.ts
app/api/shipping/zones/route.ts

app/(admin)/admin/shipping/page.tsx

components/admin/shipping/shipping-zones-table.tsx
components/admin/shipping/shipping-classes-table.tsx
components/admin/shipping/shipping-rates-matrix.tsx
components/admin/shipping/zone-edit-modal.tsx
components/admin/shipping/class-edit-modal.tsx
components/admin/shipping/rate-edit-modal.tsx

components/checkout/shipping-calculator.tsx

lib/validations/shipping.ts
lib/supabase/queries/shipping.ts
lib/types/shipping.ts
```

### Modified Files
```
app/(site)/checkout/page.tsx - Add shipping calculator
components/admin/products/product-variant-form.tsx - Add dimension fields
lib/types.ts - Add shipping types
lib/constants.ts - Add shipping constants
```

---

## Review Notes

### Key Decisions
1. All monetary values in cents (INTEGER) for precision
2. All weights in grams, dimensions in mm (INTEGER)
3. Volumetric divisor stored in settings table for flexibility
4. Free shipping threshold per zone (NULL = never free)
5. Extra kg rate for weights exceeding tier max

### Testing Points
1. Continental order €500+ gets free shipping
2. Island orders never get free shipping
3. Volumetric weight used when larger than actual
4. Correct carrier assigned based on weight class
5. Invalid postal codes show user-friendly error
6. Rate matrix displays correctly in admin

### Future Enhancements (not in scope)
- Multiple carrier options per zone
- Real-time carrier API integration
- Tracking number integration
- Delivery date calculation

---

## Implementation Summary (Completed 2025-12-21)

### Files Created

#### Database
- `supabase/migrations/20251221100000_create_shipping_tables.sql` - Complete migration with tables, functions, RLS, and seed data

#### Types & Validation
- `lib/types/shipping.ts` - TypeScript interfaces and utility functions
- `lib/validations/shipping.ts` - Zod schemas for all shipping entities

#### Admin API Routes
- `app/api/admin/shipping/zones/route.ts` - CRUD for shipping zones
- `app/api/admin/shipping/classes/route.ts` - CRUD for shipping classes
- `app/api/admin/shipping/rates/route.ts` - CRUD for shipping rates
- `app/api/admin/shipping/settings/route.ts` - GET/PUT for shipping settings

#### Public API Routes
- `app/api/shipping/calculate/route.ts` - Shipping cost calculation
- `app/api/shipping/zones/route.ts` - Public zone list for UI

#### Admin UI
- `app/(admin)/admin/shipping/page.tsx` - Main shipping settings page
- `components/admin/shipping/shipping-management.tsx` - Tabbed management interface
- `components/admin/shipping/shipping-zones-table.tsx` - Zones CRUD table
- `components/admin/shipping/shipping-classes-table.tsx` - Classes CRUD table
- `components/admin/shipping/shipping-rates-matrix.tsx` - Rates CRUD with filtering
- `components/admin/shipping/shipping-settings-form.tsx` - Settings form with volumetric examples
- `components/admin/shipping/zone-edit-modal.tsx` - Zone create/edit modal
- `components/admin/shipping/class-edit-modal.tsx` - Class create/edit modal
- `components/admin/shipping/rate-edit-modal.tsx` - Rate create/edit modal

#### Checkout Integration
- `components/checkout/shipping-calculator.tsx` - Real-time shipping calculator

### Files Modified
- `lib/types/index.ts` - Added shipping types export
- `app/(site)/checkout/page.tsx` - Integrated ShippingCalculator component
- `components/admin/admin-shell.tsx` - Added shipping link to admin navigation

### Key Implementation Details
1. Database uses INTEGER for all monetary (cents) and weight (grams) values
2. Shipping calculation uses PostgreSQL function `fn_calculate_shipping` for performance
3. Free shipping is zone-specific with configurable threshold
4. Volumetric weight calculation uses configurable divisor (default 4000)
5. ShippingCalculator debounces API calls (500ms) for smooth UX
6. All admin UI in Portuguese with proper error handling
