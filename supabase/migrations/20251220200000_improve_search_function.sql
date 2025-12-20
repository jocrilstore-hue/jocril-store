-- Create extension unaccent if it doesn't exist
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Drop function strictly to recreate it
DROP FUNCTION IF EXISTS public.search_products(text, numeric, numeric, text[], text, integer);

CREATE OR REPLACE FUNCTION public.search_products(
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
DECLARE
    normalized_search_term text;
    search_words text[];
BEGIN
    -- Normalize search term: lowercase and unaccent
    IF search_term IS NOT NULL AND TRIM(search_term) <> '' THEN
        -- We use public.unaccent because search_path is empty
        normalized_search_term := lower(public.unaccent(TRIM(search_term)));
        -- Split into unique words
        search_words := regexp_split_to_array(normalized_search_term, '\s+');
    ELSE
        -- If search term is empty/null, treat as null
        search_term := NULL;
    END IF;

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
                -- Exact match on full name (highest priority)
                CASE WHEN lower(public.unaccent(pt.name)) LIKE '%' || normalized_search_term || '%' THEN 20 ELSE 0 END +
                -- Exact match on SKU
                CASE WHEN lower(pv.sku) LIKE '%' || normalized_search_term || '%' THEN 30 ELSE 0 END +
                -- Word overlap score
                (
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN lower(public.unaccent(pt.name)) LIKE '%' || word || '%' THEN 5
                            WHEN lower(public.unaccent(pt.short_description)) LIKE '%' || word || '%' THEN 2
                            WHEN lower(public.unaccent(c.name)) LIKE '%' || word || '%' THEN 3
                            ELSE 0
                        END
                    ), 0)
                    FROM unnest(search_words) AS word
                )
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
           (
                -- Match if ANY word is found
                EXISTS (
                    SELECT 1
                    FROM unnest(search_words) AS word
                    WHERE 
                        lower(public.unaccent(pt.name)) LIKE '%' || word || '%' OR
                        lower(public.unaccent(pt.short_description)) LIKE '%' || word || '%' OR
                        lower(public.unaccent(c.name)) LIKE '%' || word || '%' OR
                        lower(pv.sku) LIKE '%' || word || '%'
                )
           )
      )
    ORDER BY
        CASE sort_by
            WHEN 'price_asc' THEN pv.base_price_including_vat
            WHEN 'price_desc' THEN -pv.base_price_including_vat
            WHEN 'newest' THEN -EXTRACT(EPOCH FROM pv.created_at)::numeric
            ELSE -relevance_score -- Sort by relevance desc
        END,
        pt.name ASC
    LIMIT result_limit;
END;
$$;
