-- ============================================================================
-- Migration: Fix Supabase Security Issues
-- Date: 2025-01-31
-- Description: Enable RLS on 15 tables, fix 3 views, fix 11 functions
-- ============================================================================

-- ============================================================================
-- PART 1: ENABLE RLS ON ALL TABLES WITH APPROPRIATE POLICIES
-- ============================================================================

-- Note: Since we use Clerk for authentication (not Supabase Auth),
-- admin writes use service_role key which bypasses RLS.
-- RLS policies are set to allow public reads on catalog data.

-- ----------------------------------------------------------------------------
-- 1. size_formats - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.size_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on size_formats"
ON public.size_formats FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 2. categories - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on categories"
ON public.categories FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 3. materials - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on materials"
ON public.materials FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 4. product_templates - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on product_templates"
ON public.product_templates FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 5. product_variants - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on product_variants"
ON public.product_variants FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 6. price_tiers - Public catalog data (quantity discounts)
-- ----------------------------------------------------------------------------
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on price_tiers"
ON public.price_tiers FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 7. product_images - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on product_images"
ON public.product_images FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 8. related_products - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.related_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on related_products"
ON public.related_products FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 9. frequently_bought_together - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.frequently_bought_together ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on frequently_bought_together"
ON public.frequently_bought_together FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 10. applications - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on applications"
ON public.applications FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 11. product_applications - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on product_applications"
ON public.product_applications FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 12. product_tags - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on product_tags"
ON public.product_tags FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 13. product_template_tags - Public catalog data
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_template_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on product_template_tags"
ON public.product_template_tags FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- 14. product_reviews - Public read for approved reviews only
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on approved reviews"
ON public.product_reviews FOR SELECT
TO public
USING (is_approved = true);

-- ----------------------------------------------------------------------------
-- 15. product_analytics - No public access (admin only via service_role)
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- No SELECT policy = no public access (only service_role can access)


-- ============================================================================
-- PART 2: FIX VIEWS TO USE SECURITY INVOKER
-- ============================================================================

-- Drop and recreate views with SECURITY INVOKER
-- Views should NOT use SECURITY DEFINER as they can bypass RLS unexpectedly

-- ----------------------------------------------------------------------------
-- 1. v_products_full
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_featured_products;
DROP VIEW IF EXISTS public.v_inventory_summary;
DROP VIEW IF EXISTS public.v_products_full;

CREATE VIEW public.v_products_full
WITH (security_invoker = true)
AS
SELECT
    pv.id AS variant_id,
    pv.sku,
    pv.url_slug,
    pv.barcode,
    pv.is_active AS variant_active,
    pv.is_bestseller,
    pt.id AS template_id,
    pt.name AS template_name,
    pt.slug AS template_slug,
    pt.reference_code,
    pt.short_description,
    pt.has_quantity_discounts,
    pt.min_order_quantity,
    pt.is_featured,
    (((((pt.name)::text || ' '::text) || (sf.name)::text) || ' '::text) ||
        CASE (pv.orientation)::text
            WHEN 'vertical'::text THEN 'Vertical'::text
            WHEN 'horizontal'::text THEN 'Horizontal'::text
            ELSE ''::text
        END) AS full_product_title,
    sf.id AS size_id,
    sf.name AS size_name,
    sf.width_mm,
    sf.height_mm,
    sf.width_cm,
    sf.height_cm,
    pv.orientation,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    m.id AS material_id,
    m.name AS material_name,
    m.thickness AS material_thickness,
    pv.base_price_excluding_vat,
    pv.base_price_including_vat,
    pv.cost_price,
    pv.stock_quantity,
    pv.stock_status,
    pv.low_stock_threshold,
    pv.restock_date,
    pv.main_image_url,
    COALESCE(pv.seo_title, ((((pt.name)::text || ' '::text) || (sf.name)::text))::character varying) AS seo_title,
    COALESCE(pv.seo_description, (pt.short_description)::character varying) AS seo_description,
    pv.display_order,
    pv.created_at,
    pv.updated_at
FROM ((((product_variants pv
    JOIN product_templates pt ON ((pv.product_template_id = pt.id)))
    JOIN size_formats sf ON ((pv.size_format_id = sf.id)))
    JOIN categories c ON ((pt.category_id = c.id)))
    LEFT JOIN materials m ON ((pt.material_id = m.id)));

-- ----------------------------------------------------------------------------
-- 2. v_inventory_summary
-- ----------------------------------------------------------------------------
CREATE VIEW public.v_inventory_summary
WITH (security_invoker = true)
AS
SELECT
    c.name AS category,
    count(DISTINCT pt.id) AS total_templates,
    count(pv.id) AS total_variants,
    sum(pv.stock_quantity) AS total_stock_units,
    sum(
        CASE
            WHEN (pv.stock_status = 'out_of_stock'::stock_status_type) THEN 1
            ELSE 0
        END) AS out_of_stock_count,
    sum(
        CASE
            WHEN (pv.stock_status = 'low_stock'::stock_status_type) THEN 1
            ELSE 0
        END) AS low_stock_count,
    sum(((pv.stock_quantity)::numeric * pv.cost_price)) AS total_inventory_value
FROM ((categories c
    LEFT JOIN product_templates pt ON ((c.id = pt.category_id)))
    LEFT JOIN product_variants pv ON ((pt.id = pv.product_template_id)))
WHERE (pv.is_active = true)
GROUP BY c.id, c.name
ORDER BY (sum(((pv.stock_quantity)::numeric * pv.cost_price))) DESC;

-- ----------------------------------------------------------------------------
-- 3. v_featured_products
-- ----------------------------------------------------------------------------
CREATE VIEW public.v_featured_products
WITH (security_invoker = true)
AS
SELECT
    vpf.variant_id,
    vpf.sku,
    vpf.url_slug,
    vpf.barcode,
    vpf.variant_active,
    vpf.is_bestseller,
    vpf.template_id,
    vpf.template_name,
    vpf.template_slug,
    vpf.reference_code,
    vpf.short_description,
    vpf.has_quantity_discounts,
    vpf.min_order_quantity,
    vpf.is_featured,
    vpf.full_product_title,
    vpf.size_id,
    vpf.size_name,
    vpf.width_mm,
    vpf.height_mm,
    vpf.width_cm,
    vpf.height_cm,
    vpf.orientation,
    vpf.category_id,
    vpf.category_name,
    vpf.category_slug,
    vpf.material_id,
    vpf.material_name,
    vpf.material_thickness,
    vpf.base_price_excluding_vat,
    vpf.base_price_including_vat,
    vpf.cost_price,
    vpf.stock_quantity,
    vpf.stock_status,
    vpf.low_stock_threshold,
    vpf.restock_date,
    vpf.main_image_url,
    vpf.seo_title,
    vpf.seo_description,
    vpf.display_order,
    vpf.created_at,
    vpf.updated_at,
    COALESCE(avg(pr.rating), (0)::numeric) AS avg_rating,
    count(pr.id) AS review_count
FROM (v_products_full vpf
    LEFT JOIN product_reviews pr ON (((vpf.variant_id = pr.product_variant_id) AND (pr.is_approved = true))))
WHERE ((vpf.variant_active = true) AND ((vpf.is_featured = true) OR (vpf.is_bestseller = true)))
GROUP BY vpf.variant_id, vpf.sku, vpf.url_slug, vpf.barcode, vpf.variant_active, vpf.is_bestseller,
    vpf.template_id, vpf.template_name, vpf.template_slug, vpf.reference_code, vpf.short_description,
    vpf.has_quantity_discounts, vpf.min_order_quantity, vpf.is_featured, vpf.full_product_title,
    vpf.size_id, vpf.size_name, vpf.width_mm, vpf.height_mm, vpf.width_cm, vpf.height_cm,
    vpf.orientation, vpf.category_id, vpf.category_name, vpf.category_slug, vpf.material_id,
    vpf.material_name, vpf.material_thickness, vpf.base_price_excluding_vat, vpf.base_price_including_vat,
    vpf.cost_price, vpf.stock_quantity, vpf.stock_status, vpf.low_stock_threshold, vpf.restock_date,
    vpf.main_image_url, vpf.seo_title, vpf.seo_description, vpf.display_order, vpf.created_at,
    vpf.updated_at
ORDER BY vpf.display_order, vpf.created_at DESC;


-- ============================================================================
-- PART 3: FIX FUNCTIONS WITH MUTABLE SEARCH_PATH
-- ============================================================================

-- All functions should have search_path = '' for security.
-- We need to recreate each function with the proper setting.

-- ----------------------------------------------------------------------------
-- 1. check_user_is_admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id AND role = 'admin'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. fn_create_price_tiers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_create_price_tiers(p_variant_id integer)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_base_price numeric;
BEGIN
    SELECT base_price_including_vat INTO v_base_price
    FROM public.product_variants
    WHERE id = p_variant_id;

    IF v_base_price IS NULL THEN
        RETURN;
    END IF;

    -- Delete existing tiers
    DELETE FROM public.price_tiers WHERE product_variant_id = p_variant_id;

    -- Insert standard quantity discount tiers
    INSERT INTO public.price_tiers (product_variant_id, min_quantity, max_quantity, discount_percentage, price_per_unit, display_text)
    VALUES
        (p_variant_id, 1, 9, 0, v_base_price, 'Preço unitário'),
        (p_variant_id, 10, 24, 5, v_base_price * 0.95, '10-24 unidades: 5% desconto'),
        (p_variant_id, 25, 49, 10, v_base_price * 0.90, '25-49 unidades: 10% desconto'),
        (p_variant_id, 50, 99, 15, v_base_price * 0.85, '50-99 unidades: 15% desconto'),
        (p_variant_id, 100, NULL, 20, v_base_price * 0.80, '100+ unidades: 20% desconto');
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. fn_generate_sku
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_generate_sku(
    p_template_id integer,
    p_size_name character varying,
    p_orientation orientation_type
)
RETURNS character varying
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_prefix varchar;
    v_size_code varchar;
    v_orientation_code varchar;
BEGIN
    SELECT sku_prefix INTO v_prefix
    FROM public.product_templates
    WHERE id = p_template_id;

    v_size_code := UPPER(REPLACE(p_size_name, ' ', ''));
    v_orientation_code := CASE p_orientation
        WHEN 'vertical' THEN 'V'
        WHEN 'horizontal' THEN 'H'
        ELSE 'B'
    END;

    RETURN COALESCE(v_prefix, 'SKU') || '-' || v_size_code || '-' || v_orientation_code;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. fn_get_price_for_quantity
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_get_price_for_quantity(p_variant_id integer, p_quantity integer)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_price numeric;
BEGIN
    SELECT price_per_unit INTO v_price
    FROM public.price_tiers
    WHERE product_variant_id = p_variant_id
      AND p_quantity >= min_quantity
      AND (max_quantity IS NULL OR p_quantity <= max_quantity)
    ORDER BY min_quantity DESC
    LIMIT 1;

    IF v_price IS NULL THEN
        SELECT base_price_including_vat INTO v_price
        FROM public.product_variants
        WHERE id = p_variant_id;
    END IF;

    RETURN COALESCE(v_price, 0);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. handle_new_user (Supabase Auth trigger - may be unused with Clerk)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. is_admin (fix search_path from 'public' to '')
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id AND role = 'admin'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. search_products (must drop first due to return type change)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_products(text, numeric, numeric, text[], text, integer);

CREATE FUNCTION public.search_products(
    search_term text DEFAULT NULL,
    min_price numeric DEFAULT NULL,
    max_price numeric DEFAULT NULL,
    category_ids text[] DEFAULT NULL,
    sort_by text DEFAULT 'relevance',
    result_limit integer DEFAULT 50
)
RETURNS TABLE(
    variant_id integer,
    template_name varchar,
    size_name varchar,
    orientation orientation_type,
    category_name varchar,
    base_price_including_vat numeric,
    main_image_url varchar,
    url_slug varchar,
    stock_status stock_status_type,
    relevance_score numeric
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pv.id AS variant_id,
        pt.name AS template_name,
        sf.name AS size_name,
        pv.orientation,
        c.name AS category_name,
        pv.base_price_including_vat,
        pv.main_image_url,
        pv.url_slug,
        pv.stock_status,
        CASE
            WHEN search_term IS NULL THEN 1.0::numeric
            ELSE (
                CASE WHEN pt.name ILIKE '%' || search_term || '%' THEN 10 ELSE 0 END +
                CASE WHEN pt.short_description ILIKE '%' || search_term || '%' THEN 5 ELSE 0 END +
                CASE WHEN c.name ILIKE '%' || search_term || '%' THEN 3 ELSE 0 END
            )::numeric
        END AS relevance_score
    FROM public.product_variants pv
    JOIN public.product_templates pt ON pv.product_template_id = pt.id
    JOIN public.size_formats sf ON pv.size_format_id = sf.id
    JOIN public.categories c ON pt.category_id = c.id
    WHERE pv.is_active = true
      AND pt.is_active = true
      AND (min_price IS NULL OR pv.base_price_including_vat >= min_price)
      AND (max_price IS NULL OR pv.base_price_including_vat <= max_price)
      AND (category_ids IS NULL OR c.id::text = ANY(category_ids))
      AND (search_term IS NULL OR
           pt.name ILIKE '%' || search_term || '%' OR
           pt.short_description ILIKE '%' || search_term || '%' OR
           c.name ILIKE '%' || search_term || '%')
    ORDER BY
        CASE sort_by
            WHEN 'price_asc' THEN pv.base_price_including_vat
            WHEN 'price_desc' THEN -pv.base_price_including_vat
            WHEN 'newest' THEN -EXTRACT(EPOCH FROM pv.created_at)::numeric
            ELSE -(
                CASE WHEN search_term IS NULL THEN 1 ELSE
                    CASE WHEN pt.name ILIKE '%' || search_term || '%' THEN 10 ELSE 0 END +
                    CASE WHEN pt.short_description ILIKE '%' || search_term || '%' THEN 5 ELSE 0 END
                END
            )::numeric
        END
    LIMIT result_limit;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. trigger_generate_url_slug
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_generate_url_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_template_slug varchar;
    v_size_name varchar;
    v_base_slug varchar;
    v_final_slug varchar;
    v_counter integer := 0;
BEGIN
    IF NEW.url_slug IS NULL OR NEW.url_slug = '' THEN
        SELECT pt.slug, sf.name INTO v_template_slug, v_size_name
        FROM public.product_templates pt
        JOIN public.size_formats sf ON NEW.size_format_id = sf.id
        WHERE pt.id = NEW.product_template_id;

        v_base_slug := v_template_slug || '-' ||
            LOWER(REPLACE(REPLACE(v_size_name, ' ', '-'), '.', '')) || '-' ||
            LOWER(NEW.orientation::text);

        v_final_slug := v_base_slug;

        WHILE EXISTS (SELECT 1 FROM public.product_variants WHERE url_slug = v_final_slug AND id != COALESCE(NEW.id, 0)) LOOP
            v_counter := v_counter + 1;
            v_final_slug := v_base_slug || '-' || v_counter;
        END LOOP;

        NEW.url_slug := v_final_slug;
    END IF;

    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. trigger_set_updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. trigger_update_stock_status
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_update_stock_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.stock_quantity <= 0 THEN
        NEW.stock_status := 'out_of_stock';
    ELSIF NEW.stock_quantity <= COALESCE(NEW.low_stock_threshold, 10) THEN
        NEW.stock_status := 'low_stock';
    ELSE
        NEW.stock_status := 'in_stock';
    END IF;
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 11. update_admin_settings_updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_admin_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. update_template_images_updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_template_images_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant read access to anon and authenticated roles on public catalog tables
GRANT SELECT ON public.size_formats TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.materials TO anon, authenticated;
GRANT SELECT ON public.product_templates TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.price_tiers TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT ON public.related_products TO anon, authenticated;
GRANT SELECT ON public.frequently_bought_together TO anon, authenticated;
GRANT SELECT ON public.applications TO anon, authenticated;
GRANT SELECT ON public.product_applications TO anon, authenticated;
GRANT SELECT ON public.product_tags TO anon, authenticated;
GRANT SELECT ON public.product_template_tags TO anon, authenticated;
GRANT SELECT ON public.product_reviews TO anon, authenticated;

-- Grant read access to views
GRANT SELECT ON public.v_products_full TO anon, authenticated;
GRANT SELECT ON public.v_inventory_summary TO anon, authenticated;
GRANT SELECT ON public.v_featured_products TO anon, authenticated;


-- ============================================================================
-- VERIFICATION COMMENT
-- ============================================================================
COMMENT ON SCHEMA public IS 'Security fixes applied: RLS enabled on 15 tables, 3 views use SECURITY INVOKER, 12 functions have search_path set to empty string. Migration applied on 2025-01-31.';
