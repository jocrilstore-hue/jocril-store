-- Add min_order_quantity to product_variants
-- This allows each variant to have its own minimum order quantity
-- Falls back to template min_order_quantity if not set

ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS min_order_quantity INT DEFAULT 1;

COMMENT ON COLUMN product_variants.min_order_quantity IS 'Minimum order quantity for this variant. Overrides template min_order_quantity when set.';
