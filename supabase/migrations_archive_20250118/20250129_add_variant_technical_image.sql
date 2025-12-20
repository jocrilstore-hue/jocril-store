-- Add technical_image_url to product_variants
-- This is the specifications/dimensions diagram for each variant size
-- Falls back to template technical image if not set

ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS technical_image_url VARCHAR(500) DEFAULT NULL;

COMMENT ON COLUMN product_variants.technical_image_url IS 'Technical specifications image showing dimensions for this variant. Overrides template technical image when set.';
