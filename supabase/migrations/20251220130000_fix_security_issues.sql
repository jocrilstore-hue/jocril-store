-- Migration to fix Security Definer Views and Enable RLS on Public Tables
-- Updated to be Clerk-Compatible (checking JWT metadata instead of UUID tables)

-- 1. Fix Security Definer Views
-- Changing views to security_invoker ensures they respect the RLS policies of the querying user
ALTER VIEW public.v_products_full SET (security_invoker = true);
ALTER VIEW public.v_inventory_summary SET (security_invoker = true);
ALTER VIEW public.v_featured_products SET (security_invoker = true);

-- 2. Create Clerk-Compatible Admin Check Function
-- This function checks the JWT claims directly, avoiding dependency on the 'public.user_roles' table
-- (which uses UUIDs and might break if Clerk uses string IDs).
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  jwt_claims jsonb := auth.jwt();
  user_role text;
BEGIN
  -- 1. Check Clerk Metadata (standard location for custom claims in Clerk+Supabase)
  -- Adjust the path checking based on your Clerk Session template.
  -- Often it's in 'user_metadata' or 'public_metadata' at the root, or inside 'app_metadata'.
  
  -- Check 'app_metadata' (Supabase default & common place for roles)
  user_role := jwt_claims -> 'app_metadata' ->> 'role';
  IF user_role = 'admin' OR user_role = 'service_role' THEN
    RETURN true;
  END IF;

  -- Check 'user_metadata' (Supabase default for user editable metadata)
  user_role := jwt_claims -> 'user_metadata' ->> 'role';
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- 2. Fallback: Check for service_role key usage (bypass RLS logic handled by the role itself, but good to have explicit)
  IF (jwt_claims ->> 'role') = 'service_role' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO public;


-- 3. Enable RLS and Apply Policies
DO $$
DECLARE
    -- Tables that are primarily Catalog/Referential (Read Public, Write Admin)
    catalog_tables text[] := ARRAY[
        'size_formats',
        'product_templates',
        'product_variants',
        'categories',
        'materials',
        'price_tiers',
        'product_images',
        'related_products',
        'frequently_bought_together',
        'product_applications',
        'applications',
        'product_template_tags',
        'product_tags'
    ];
    
    t text;
BEGIN
    -------------------------------------------------------
    -- Catalog Tables Loop
    -------------------------------------------------------
    FOREACH t IN ARRAY catalog_tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- READ (Public access)
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Enable read access for all users" ON public.%I FOR SELECT USING (true);', t);
        
        -- WRITE (Admin only)
        -- Insert
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert access for admins" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Enable insert access for admins" ON public.%I FOR INSERT WITH CHECK (public.current_user_is_admin());', t);
        
        -- Update
        EXECUTE format('DROP POLICY IF EXISTS "Enable update access for admins" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Enable update access for admins" ON public.%I FOR UPDATE USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());', t);
        
        -- Delete
        EXECUTE format('DROP POLICY IF EXISTS "Enable delete access for admins" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Enable delete access for admins" ON public.%I FOR DELETE USING (public.current_user_is_admin());', t);
    END LOOP;

END $$;

-------------------------------------------------------
-- Product Reviews
-------------------------------------------------------
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Read (Public)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_reviews;
CREATE POLICY "Enable read access for all users" ON public.product_reviews FOR SELECT USING (true);

-- Insert (Public/Authenticated) -> Allow anyone to submit a review? Usually validation happens API side or we require auth.
-- Allowing all for now to mimic "RLS Disabled" behavior but safer.
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.product_reviews;
CREATE POLICY "Enable insert access for all users" ON public.product_reviews FOR INSERT WITH CHECK (true);

-- Update/Delete (Admin only)
DROP POLICY IF EXISTS "Enable update access for admins" ON public.product_reviews;
CREATE POLICY "Enable update access for admins" ON public.product_reviews FOR UPDATE USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Enable delete access for admins" ON public.product_reviews;
CREATE POLICY "Enable delete access for admins" ON public.product_reviews FOR DELETE USING (public.current_user_is_admin());


-------------------------------------------------------
-- Product Analytics
-------------------------------------------------------
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- Read (Public)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_analytics;
CREATE POLICY "Enable read access for all users" ON public.product_analytics FOR SELECT USING (true);

-- Insert (Public)
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.product_analytics;
CREATE POLICY "Enable insert access for all users" ON public.product_analytics FOR INSERT WITH CHECK (true);

-- Manage (Admin)
DROP POLICY IF EXISTS "Enable management access for admins" ON public.product_analytics;
CREATE POLICY "Enable management access for admins" ON public.product_analytics FOR ALL USING (public.current_user_is_admin());
