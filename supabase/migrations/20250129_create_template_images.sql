-- ================================================
-- PRODUCT TEMPLATE IMAGES
-- Images at template level (shared across all variants)
-- ================================================

-- Create product_template_images table
CREATE TABLE IF NOT EXISTS public.product_template_images (
    id SERIAL PRIMARY KEY,
    product_template_id INT NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(300),
    image_type VARCHAR(50) NOT NULL DEFAULT 'gallery'
        CHECK (image_type IN ('main', 'gallery', 'technical')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_images_template_id ON public.product_template_images(product_template_id);
CREATE INDEX IF NOT EXISTS idx_template_images_type ON public.product_template_images(image_type);

-- Ensure only one main image per template
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_images_unique_main
    ON public.product_template_images(product_template_id)
    WHERE image_type = 'main';

-- Ensure only one technical drawing per template
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_images_unique_technical
    ON public.product_template_images(product_template_id)
    WHERE image_type = 'technical';

-- Enable RLS
ALTER TABLE public.product_template_images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view images (public catalog)
CREATE POLICY "Anyone can view template images"
    ON public.product_template_images
    FOR SELECT
    USING (true);

-- Policy: Only admins can manage images (using SECURITY DEFINER function to avoid recursion)
CREATE POLICY "Admins can manage template images"
    ON public.product_template_images
    FOR ALL
    USING (
        public.check_user_is_admin(auth.uid())
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_template_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_template_images_updated_at ON public.product_template_images;
CREATE TRIGGER trigger_update_template_images_updated_at
    BEFORE UPDATE ON public.product_template_images
    FOR EACH ROW
    EXECUTE FUNCTION update_template_images_updated_at();

-- Add comment
COMMENT ON TABLE public.product_template_images IS 'Stores images at template level (main photo, technical drawing, gallery). Shared across all variants of the template.';
COMMENT ON COLUMN public.product_template_images.image_type IS 'Type of image: main (principal listing image), technical (schematic/dimensions), gallery (additional photos)';
