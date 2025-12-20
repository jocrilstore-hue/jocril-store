-- Add specifications_json to product_variants
-- This allows each variant (size variation) to have its own technical specifications
-- When displaying, variant specs take priority over template specs

ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS specifications_json JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN product_variants.specifications_json IS 'Structured technical specifications for this specific variant. Overrides template specs when present.';
