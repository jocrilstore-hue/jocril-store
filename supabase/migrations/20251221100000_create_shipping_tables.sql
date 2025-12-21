-- =====================================================
-- Shipping System Tables Migration
-- Table Rate Shipping for Jocril Acrilicos
-- =====================================================

-- =====================================================
-- 1. SHIPPING ZONES TABLE
-- Defines geographic zones with postal code ranges
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_zones (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,                    -- 'continental', 'madeira', 'azores'
    name TEXT NOT NULL,                           -- 'Portugal Continental'
    postal_code_start INTEGER NOT NULL,           -- 1000
    postal_code_end INTEGER NOT NULL,             -- 8999
    free_shipping_threshold_cents INTEGER,        -- 50000 (€500) for continental, NULL for islands
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SHIPPING CLASSES TABLE
-- Defines shipping classes based on weight
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_classes (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,                    -- 'standard', 'cargo'
    name TEXT NOT NULL,                           -- 'Envio Standard'
    max_weight_grams INTEGER NOT NULL,            -- 30000 for standard
    carrier_name TEXT NOT NULL,                   -- 'CTT Expresso, DPD'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SHIPPING RATES TABLE
-- Rate tiers per zone and class
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_rates (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES shipping_classes(id) ON DELETE CASCADE,
    min_weight_grams INTEGER NOT NULL,            -- 0
    max_weight_grams INTEGER NOT NULL,            -- 5000
    base_rate_cents INTEGER NOT NULL,             -- 500 (€5.00)
    extra_kg_rate_cents INTEGER NOT NULL DEFAULT 0, -- for >50kg rates
    estimated_days_min INTEGER NOT NULL DEFAULT 1,
    estimated_days_max INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zone_id, class_id, min_weight_grams)
);

-- =====================================================
-- 4. SHIPPING SETTINGS TABLE
-- Key-value settings for shipping
-- =====================================================
CREATE TABLE IF NOT EXISTS shipping_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ALTER PRODUCT_VARIANTS TABLE
-- Add dimension columns for volumetric weight
-- =====================================================
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS weight_grams INTEGER,
    ADD COLUMN IF NOT EXISTS length_mm INTEGER,
    ADD COLUMN IF NOT EXISTS width_mm INTEGER,
    ADD COLUMN IF NOT EXISTS height_mm INTEGER;

-- =====================================================
-- 6. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shipping_zones_code ON shipping_zones(code);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_postal ON shipping_zones(postal_code_start, postal_code_end);
CREATE INDEX IF NOT EXISTS idx_shipping_classes_code ON shipping_classes(code);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone_class ON shipping_rates(zone_id, class_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_weight ON shipping_rates(min_weight_grams, max_weight_grams);
CREATE INDEX IF NOT EXISTS idx_shipping_settings_key ON shipping_settings(setting_key);

-- =====================================================
-- 7. TRIGGERS FOR updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_shipping_zones_updated_at ON shipping_zones;
CREATE TRIGGER update_shipping_zones_updated_at
    BEFORE UPDATE ON shipping_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_classes_updated_at ON shipping_classes;
CREATE TRIGGER update_shipping_classes_updated_at
    BEFORE UPDATE ON shipping_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_rates_updated_at ON shipping_rates;
CREATE TRIGGER update_shipping_rates_updated_at
    BEFORE UPDATE ON shipping_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_settings_updated_at ON shipping_settings;
CREATE TRIGGER update_shipping_settings_updated_at
    BEFORE UPDATE ON shipping_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role has full access to shipping_zones" ON shipping_zones;
CREATE POLICY "Service role has full access to shipping_zones"
    ON shipping_zones FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to shipping_classes" ON shipping_classes;
CREATE POLICY "Service role has full access to shipping_classes"
    ON shipping_classes FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to shipping_rates" ON shipping_rates;
CREATE POLICY "Service role has full access to shipping_rates"
    ON shipping_rates FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to shipping_settings" ON shipping_settings;
CREATE POLICY "Service role has full access to shipping_settings"
    ON shipping_settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- Public read access for zones, classes, rates (needed for checkout)
DROP POLICY IF EXISTS "Public can read active shipping zones" ON shipping_zones;
CREATE POLICY "Public can read active shipping zones"
    ON shipping_zones FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active shipping classes" ON shipping_classes;
CREATE POLICY "Public can read active shipping classes"
    ON shipping_classes FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active shipping rates" ON shipping_rates;
CREATE POLICY "Public can read active shipping rates"
    ON shipping_rates FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Public can read shipping settings" ON shipping_settings;
CREATE POLICY "Public can read shipping settings"
    ON shipping_settings FOR SELECT
    USING (true);

-- =====================================================
-- 9. FUNCTIONS
-- =====================================================

-- Function to get zone by postal code
CREATE OR REPLACE FUNCTION fn_get_zone_by_postal_code(p_postal_code TEXT)
RETURNS TABLE (
    zone_id INTEGER,
    zone_code TEXT,
    zone_name TEXT,
    free_shipping_threshold_cents INTEGER
) AS $$
DECLARE
    v_postal_numeric INTEGER;
BEGIN
    -- Extract numeric part (first 4 digits)
    v_postal_numeric := CAST(
        REGEXP_REPLACE(p_postal_code, '[^0-9]', '', 'g') AS INTEGER
    ) / POWER(10, GREATEST(0, LENGTH(REGEXP_REPLACE(p_postal_code, '[^0-9]', '', 'g')) - 4))::INTEGER;

    -- Take only first 4 digits
    IF v_postal_numeric >= 10000 THEN
        v_postal_numeric := v_postal_numeric / POWER(10, LENGTH(v_postal_numeric::TEXT) - 4)::INTEGER;
    END IF;

    RETURN QUERY
    SELECT
        sz.id,
        sz.code,
        sz.name,
        sz.free_shipping_threshold_cents
    FROM shipping_zones sz
    WHERE sz.is_active = true
      AND v_postal_numeric BETWEEN sz.postal_code_start AND sz.postal_code_end
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate volumetric weight
CREATE OR REPLACE FUNCTION fn_get_volumetric_weight_grams(
    p_length_mm INTEGER,
    p_width_mm INTEGER,
    p_height_mm INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_divisor INTEGER;
    v_volume_cm3 NUMERIC;
BEGIN
    -- Get divisor from settings (default 4000)
    SELECT CAST(setting_value AS INTEGER) INTO v_divisor
    FROM shipping_settings
    WHERE setting_key = 'volumetric_divisor';

    IF v_divisor IS NULL THEN
        v_divisor := 4000;
    END IF;

    -- Calculate volume in cm³ (mm³ / 1000)
    v_volume_cm3 := (p_length_mm::NUMERIC * p_width_mm::NUMERIC * p_height_mm::NUMERIC) / 1000;

    -- Volumetric weight = volume / divisor, convert to grams (* 1000)
    RETURN CEIL((v_volume_cm3 / v_divisor) * 1000);
END;
$$ LANGUAGE plpgsql;

-- Main shipping calculation function
CREATE OR REPLACE FUNCTION fn_calculate_shipping(
    p_cart_items JSONB,  -- Array of {variant_id, quantity}
    p_postal_code TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_zone RECORD;
    v_item RECORD;
    v_variant RECORD;
    v_total_actual_weight_grams INTEGER := 0;
    v_total_volumetric_weight_grams INTEGER := 0;
    v_billable_weight_grams INTEGER;
    v_shipping_class RECORD;
    v_rate RECORD;
    v_shipping_cost_cents INTEGER;
    v_extra_kg INTEGER;
BEGIN
    -- Validate postal code
    IF p_postal_code IS NULL OR LENGTH(TRIM(p_postal_code)) < 4 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Código postal inválido. Use o formato português (XXXX-XXX ou XXXX).'
        );
    END IF;

    -- Get zone
    SELECT * INTO v_zone
    FROM fn_get_zone_by_postal_code(p_postal_code);

    IF v_zone.zone_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Zona de envio não encontrada para este código postal.'
        );
    END IF;

    -- Calculate total weights from cart items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(variant_id INTEGER, quantity INTEGER)
    LOOP
        SELECT
            pv.weight_grams,
            pv.length_mm,
            pv.width_mm,
            pv.height_mm
        INTO v_variant
        FROM product_variants pv
        WHERE pv.id = v_item.variant_id;

        IF v_variant IS NOT NULL THEN
            -- Add actual weight
            v_total_actual_weight_grams := v_total_actual_weight_grams +
                COALESCE(v_variant.weight_grams, 0) * v_item.quantity;

            -- Add volumetric weight if dimensions exist
            IF v_variant.length_mm IS NOT NULL
               AND v_variant.width_mm IS NOT NULL
               AND v_variant.height_mm IS NOT NULL THEN
                v_total_volumetric_weight_grams := v_total_volumetric_weight_grams +
                    fn_get_volumetric_weight_grams(
                        v_variant.length_mm,
                        v_variant.width_mm,
                        v_variant.height_mm
                    ) * v_item.quantity;
            END IF;
        END IF;
    END LOOP;

    -- Use billable weight (greater of actual vs volumetric)
    v_billable_weight_grams := GREATEST(v_total_actual_weight_grams, v_total_volumetric_weight_grams);

    -- Determine shipping class based on weight
    SELECT * INTO v_shipping_class
    FROM shipping_classes
    WHERE is_active = true
      AND v_billable_weight_grams <= max_weight_grams
    ORDER BY max_weight_grams ASC
    LIMIT 1;

    -- If no class found, use cargo (highest weight)
    IF v_shipping_class.id IS NULL THEN
        SELECT * INTO v_shipping_class
        FROM shipping_classes
        WHERE is_active = true
        ORDER BY max_weight_grams DESC
        LIMIT 1;
    END IF;

    IF v_shipping_class.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Nenhuma classe de envio disponível.'
        );
    END IF;

    -- Find applicable rate
    SELECT * INTO v_rate
    FROM shipping_rates
    WHERE zone_id = v_zone.zone_id
      AND class_id = v_shipping_class.id
      AND is_active = true
      AND v_billable_weight_grams >= min_weight_grams
      AND v_billable_weight_grams <= max_weight_grams
    LIMIT 1;

    -- If no exact rate, find the highest tier
    IF v_rate.id IS NULL THEN
        SELECT * INTO v_rate
        FROM shipping_rates
        WHERE zone_id = v_zone.zone_id
          AND class_id = v_shipping_class.id
          AND is_active = true
        ORDER BY max_weight_grams DESC
        LIMIT 1;
    END IF;

    IF v_rate.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Não foi possível calcular o envio para esta zona.'
        );
    END IF;

    -- Calculate cost
    v_shipping_cost_cents := v_rate.base_rate_cents;

    -- Add extra kg cost if weight exceeds rate max
    IF v_billable_weight_grams > v_rate.max_weight_grams AND v_rate.extra_kg_rate_cents > 0 THEN
        v_extra_kg := CEIL((v_billable_weight_grams - v_rate.max_weight_grams)::NUMERIC / 1000);
        v_shipping_cost_cents := v_shipping_cost_cents + (v_extra_kg * v_rate.extra_kg_rate_cents);
    END IF;

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'zone_code', v_zone.zone_code,
        'zone_name', v_zone.zone_name,
        'shipping_class_code', v_shipping_class.code,
        'shipping_class_name', v_shipping_class.name,
        'carrier_name', v_shipping_class.carrier_name,
        'actual_weight_grams', v_total_actual_weight_grams,
        'volumetric_weight_grams', v_total_volumetric_weight_grams,
        'billable_weight_grams', v_billable_weight_grams,
        'shipping_cost_cents', v_shipping_cost_cents,
        'free_shipping_threshold_cents', v_zone.free_shipping_threshold_cents,
        'is_free_shipping', COALESCE(v_zone.free_shipping_threshold_cents IS NOT NULL, false),
        'estimated_days_min', v_rate.estimated_days_min,
        'estimated_days_max', v_rate.estimated_days_max
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SEED DATA
-- =====================================================

-- Shipping Zones
INSERT INTO shipping_zones (code, name, postal_code_start, postal_code_end, free_shipping_threshold_cents, display_order)
VALUES
    ('continental', 'Portugal Continental', 1000, 8999, 50000, 1),
    ('madeira', 'Madeira', 9000, 9499, NULL, 2),
    ('azores', 'Açores', 9500, 9999, NULL, 3)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    postal_code_start = EXCLUDED.postal_code_start,
    postal_code_end = EXCLUDED.postal_code_end,
    free_shipping_threshold_cents = EXCLUDED.free_shipping_threshold_cents,
    display_order = EXCLUDED.display_order;

-- Shipping Classes
INSERT INTO shipping_classes (code, name, max_weight_grams, carrier_name)
VALUES
    ('standard', 'Envio Standard', 30000, 'CTT Expresso, DPD'),
    ('cargo', 'Envio Cargo', 999999, 'Transportadora Dedicada')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    max_weight_grams = EXCLUDED.max_weight_grams,
    carrier_name = EXCLUDED.carrier_name;

-- Shipping Settings
INSERT INTO shipping_settings (setting_key, setting_value, description)
VALUES
    ('volumetric_divisor', '4000', 'Divisor para cálculo de peso volumétrico (cm³/divisor = kg)')
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description;

-- Get zone and class IDs for rates
DO $$
DECLARE
    v_continental_id INTEGER;
    v_madeira_id INTEGER;
    v_azores_id INTEGER;
    v_standard_id INTEGER;
    v_cargo_id INTEGER;
BEGIN
    SELECT id INTO v_continental_id FROM shipping_zones WHERE code = 'continental';
    SELECT id INTO v_madeira_id FROM shipping_zones WHERE code = 'madeira';
    SELECT id INTO v_azores_id FROM shipping_zones WHERE code = 'azores';
    SELECT id INTO v_standard_id FROM shipping_classes WHERE code = 'standard';
    SELECT id INTO v_cargo_id FROM shipping_classes WHERE code = 'cargo';

    -- Continental Standard Rates
    INSERT INTO shipping_rates (zone_id, class_id, min_weight_grams, max_weight_grams, base_rate_cents, estimated_days_min, estimated_days_max)
    VALUES
        (v_continental_id, v_standard_id, 0, 5000, 500, 1, 3),
        (v_continental_id, v_standard_id, 5001, 10000, 700, 1, 3),
        (v_continental_id, v_standard_id, 10001, 20000, 900, 1, 3),
        (v_continental_id, v_standard_id, 20001, 30000, 1200, 2, 4)
    ON CONFLICT (zone_id, class_id, min_weight_grams) DO UPDATE SET
        max_weight_grams = EXCLUDED.max_weight_grams,
        base_rate_cents = EXCLUDED.base_rate_cents,
        estimated_days_min = EXCLUDED.estimated_days_min,
        estimated_days_max = EXCLUDED.estimated_days_max;

    -- Continental Cargo Rates
    INSERT INTO shipping_rates (zone_id, class_id, min_weight_grams, max_weight_grams, base_rate_cents, extra_kg_rate_cents, estimated_days_min, estimated_days_max)
    VALUES
        (v_continental_id, v_cargo_id, 30001, 50000, 2500, 0, 3, 5),
        (v_continental_id, v_cargo_id, 50001, 100000, 4500, 50, 3, 5),
        (v_continental_id, v_cargo_id, 100001, 999999, 7500, 40, 4, 7)
    ON CONFLICT (zone_id, class_id, min_weight_grams) DO UPDATE SET
        max_weight_grams = EXCLUDED.max_weight_grams,
        base_rate_cents = EXCLUDED.base_rate_cents,
        extra_kg_rate_cents = EXCLUDED.extra_kg_rate_cents,
        estimated_days_min = EXCLUDED.estimated_days_min,
        estimated_days_max = EXCLUDED.estimated_days_max;

    -- Madeira Standard Rates
    INSERT INTO shipping_rates (zone_id, class_id, min_weight_grams, max_weight_grams, base_rate_cents, estimated_days_min, estimated_days_max)
    VALUES
        (v_madeira_id, v_standard_id, 0, 5000, 1500, 3, 7),
        (v_madeira_id, v_standard_id, 5001, 10000, 2000, 3, 7),
        (v_madeira_id, v_standard_id, 10001, 20000, 2800, 3, 7),
        (v_madeira_id, v_standard_id, 20001, 30000, 3500, 4, 8)
    ON CONFLICT (zone_id, class_id, min_weight_grams) DO UPDATE SET
        max_weight_grams = EXCLUDED.max_weight_grams,
        base_rate_cents = EXCLUDED.base_rate_cents,
        estimated_days_min = EXCLUDED.estimated_days_min,
        estimated_days_max = EXCLUDED.estimated_days_max;

    -- Madeira Cargo Rates
    INSERT INTO shipping_rates (zone_id, class_id, min_weight_grams, max_weight_grams, base_rate_cents, extra_kg_rate_cents, estimated_days_min, estimated_days_max)
    VALUES
        (v_madeira_id, v_cargo_id, 30001, 50000, 5500, 0, 5, 10),
        (v_madeira_id, v_cargo_id, 50001, 100000, 8500, 80, 5, 10),
        (v_madeira_id, v_cargo_id, 100001, 999999, 12000, 70, 7, 14)
    ON CONFLICT (zone_id, class_id, min_weight_grams) DO UPDATE SET
        max_weight_grams = EXCLUDED.max_weight_grams,
        base_rate_cents = EXCLUDED.base_rate_cents,
        extra_kg_rate_cents = EXCLUDED.extra_kg_rate_cents,
        estimated_days_min = EXCLUDED.estimated_days_min,
        estimated_days_max = EXCLUDED.estimated_days_max;

    -- Azores Standard Rates
    INSERT INTO shipping_rates (zone_id, class_id, min_weight_grams, max_weight_grams, base_rate_cents, estimated_days_min, estimated_days_max)
    VALUES
        (v_azores_id, v_standard_id, 0, 5000, 1800, 4, 8),
        (v_azores_id, v_standard_id, 5001, 10000, 2300, 4, 8),
        (v_azores_id, v_standard_id, 10001, 20000, 3200, 4, 8),
        (v_azores_id, v_standard_id, 20001, 30000, 4000, 5, 10)
    ON CONFLICT (zone_id, class_id, min_weight_grams) DO UPDATE SET
        max_weight_grams = EXCLUDED.max_weight_grams,
        base_rate_cents = EXCLUDED.base_rate_cents,
        estimated_days_min = EXCLUDED.estimated_days_min,
        estimated_days_max = EXCLUDED.estimated_days_max;

    -- Azores Cargo Rates
    INSERT INTO shipping_rates (zone_id, class_id, min_weight_grams, max_weight_grams, base_rate_cents, extra_kg_rate_cents, estimated_days_min, estimated_days_max)
    VALUES
        (v_azores_id, v_cargo_id, 30001, 50000, 6500, 0, 6, 12),
        (v_azores_id, v_cargo_id, 50001, 100000, 9500, 90, 6, 12),
        (v_azores_id, v_cargo_id, 100001, 999999, 14000, 80, 8, 16)
    ON CONFLICT (zone_id, class_id, min_weight_grams) DO UPDATE SET
        max_weight_grams = EXCLUDED.max_weight_grams,
        base_rate_cents = EXCLUDED.base_rate_cents,
        extra_kg_rate_cents = EXCLUDED.extra_kg_rate_cents,
        estimated_days_min = EXCLUDED.estimated_days_min,
        estimated_days_max = EXCLUDED.estimated_days_max;
END $$;
