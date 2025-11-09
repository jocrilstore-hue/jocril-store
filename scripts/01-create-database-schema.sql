-- ================================================
-- JOCRIL ACRÍLICOS - POSTGRESQL DATABASE SCHEMA
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. TABELAS DE SUPORTE (LOOKUP TABLES)
-- ================================================

-- Size Formats
CREATE TABLE IF NOT EXISTS size_formats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    width_mm DECIMAL(10,2) NOT NULL,
    height_mm DECIMAL(10,2) NOT NULL,
    width_cm DECIMAL(10,2) GENERATED ALWAYS AS (width_mm / 10) STORED,
    height_cm DECIMAL(10,2) GENERATED ALWAYS AS (height_mm / 10) STORED,
    area_cm2 DECIMAL(10,2) GENERATED ALWAYS AS ((width_mm * height_mm) / 100) STORED,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    thickness_mm DECIMAL(5,2),
    properties JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 2. TABELA PRINCIPAL - PRODUCT TEMPLATES
-- ================================================

CREATE TABLE IF NOT EXISTS product_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    sku_prefix VARCHAR(50) NOT NULL,
    reference_code VARCHAR(100),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    material_id INT REFERENCES materials(id) ON DELETE SET NULL,
    short_description TEXT,
    full_description TEXT,
    advantages TEXT,
    care_instructions TEXT,
    faq JSONB,
    orientation VARCHAR(20) CHECK (orientation IN ('vertical', 'horizontal', 'both')),
    has_lock BOOLEAN DEFAULT FALSE,
    is_double_sided BOOLEAN DEFAULT FALSE,
    has_quantity_discounts BOOLEAN DEFAULT TRUE,
    min_order_quantity INT DEFAULT 1,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 3. PRODUCT VARIANTS (Variações de Produto)
-- ================================================

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_template_id INT NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
    size_format_id INT NOT NULL REFERENCES size_formats(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100),
    orientation VARCHAR(20) CHECK (orientation IN ('vertical', 'horizontal')),
    base_price_excluding_vat DECIMAL(10,2) NOT NULL,
    base_price_including_vat DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    low_stock_threshold INT DEFAULT 10,
    restock_date DATE,
    url_slug VARCHAR(400) NOT NULL UNIQUE,
    main_image_url VARCHAR(500),
    specific_description TEXT,
    ideal_for TEXT,
    weight_grams INT,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 4. PRICE TIERS (Descontos por Quantidade)
-- ================================================

CREATE TABLE IF NOT EXISTS price_tiers (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    min_quantity INT NOT NULL,
    max_quantity INT,
    discount_percentage DECIMAL(5,2) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity_range CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),
    UNIQUE(product_variant_id, min_quantity)
);

-- ================================================
-- 5. PRODUCT IMAGES
-- ================================================

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(300),
    image_type VARCHAR(50) DEFAULT 'gallery' CHECK (image_type IN ('main', 'gallery', 'detail', 'lifestyle', 'technical')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 6. PRODUCT REVIEWS
-- ================================================

CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    customer_name VARCHAR(200),
    customer_email VARCHAR(300),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title VARCHAR(300),
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 7. TABELAS DE RELACIONAMENTO (M:N)
-- ================================================

-- Product Applications (M:N)
CREATE TABLE IF NOT EXISTS product_applications (
    id SERIAL PRIMARY KEY,
    product_template_id INT NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
    application_id INT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    relevance_score INT DEFAULT 5 CHECK (relevance_score BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_template_id, application_id)
);

-- Related Products (M:N auto-relacionamento)
CREATE TABLE IF NOT EXISTS related_products (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    related_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) DEFAULT 'similar' CHECK (relation_type IN ('similar', 'accessory', 'upgrade', 'alternative')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_not_self CHECK (product_variant_id != related_variant_id),
    UNIQUE(product_variant_id, related_variant_id)
);

-- Frequently Bought Together
CREATE TABLE IF NOT EXISTS frequently_bought_together (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    related_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    times_bought_together INT DEFAULT 1,
    bundle_discount_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_not_self_fbt CHECK (product_variant_id != related_variant_id),
    UNIQUE(product_variant_id, related_variant_id)
);

-- ================================================
-- 8. TABELAS ADICIONAIS
-- ================================================

-- Technical Specifications
CREATE TABLE IF NOT EXISTS technical_specs (
    id SERIAL PRIMARY KEY,
    product_template_id INT NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
    spec_group VARCHAR(100),
    spec_name VARCHAR(200) NOT NULL,
    spec_value TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product FAQs
CREATE TABLE IF NOT EXISTS product_faqs (
    id SERIAL PRIMARY KEY,
    product_template_id INT NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipping Rules
CREATE TABLE IF NOT EXISTS shipping_rules (
    id SERIAL PRIMARY KEY,
    region VARCHAR(100) NOT NULL,
    min_delivery_days INT NOT NULL,
    max_delivery_days INT NOT NULL,
    base_cost DECIMAL(10,2) NOT NULL,
    free_shipping_threshold DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    promotion_type VARCHAR(50) CHECK (promotion_type IN ('percentage', 'fixed', 'bogo', 'bundle')),
    discount_value DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    min_purchase_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotion Products (M:N)
CREATE TABLE IF NOT EXISTS promotion_products (
    id SERIAL PRIMARY KEY,
    promotion_id INT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(promotion_id, product_variant_id)
);

-- Product Analytics
CREATE TABLE IF NOT EXISTS product_analytics (
    id SERIAL PRIMARY KEY,
    product_variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    add_to_cart_count INT DEFAULT 0,
    purchases_count INT DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN page_views > 0 THEN (purchases_count::DECIMAL / page_views * 100)
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_variant_id, date)
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_variants_template ON product_variants(product_template_id);
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants(size_format_id);
CREATE INDEX IF NOT EXISTS idx_variants_slug ON product_variants(url_slug);
CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_variants_bestseller ON product_variants(is_bestseller, display_order);
CREATE INDEX IF NOT EXISTS idx_templates_category ON product_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON product_templates(slug);
CREATE INDEX IF NOT EXISTS idx_templates_active ON product_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_price_tiers_variant ON price_tiers(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_images_variant ON product_images(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_variant ON product_reviews(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_variant_date ON product_analytics(product_variant_id, date DESC);

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_templates
    BEFORE UPDATE ON product_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_variants
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar stock_status baseado em stock_quantity
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity = 0 THEN
        NEW.stock_status = 'out_of_stock';
    ELSIF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        NEW.stock_status = 'low_stock';
    ELSE
        NEW.stock_status = 'in_stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock_status
    BEFORE INSERT OR UPDATE OF stock_quantity ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_status();

-- ================================================
-- FUNÇÕES ÚTEIS
-- ================================================

-- Função para obter preço baseado na quantidade
CREATE OR REPLACE FUNCTION fn_get_price_for_quantity(
    p_variant_id INT,
    p_quantity INT
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_price DECIMAL(10,2);
BEGIN
    SELECT COALESCE(
        (SELECT price_per_unit
         FROM price_tiers
         WHERE product_variant_id = p_variant_id
           AND p_quantity >= min_quantity
           AND (max_quantity IS NULL OR p_quantity <= max_quantity)
         ORDER BY min_quantity DESC
         LIMIT 1),
        (SELECT base_price_excluding_vat FROM product_variants WHERE id = p_variant_id)
    ) INTO v_price;
    
    RETURN v_price;
END;
$$ LANGUAGE plpgsql;

-- Função para criar price tiers automáticos
CREATE OR REPLACE FUNCTION fn_create_price_tiers(p_variant_id INT)
RETURNS VOID AS $$
DECLARE
    v_base_price DECIMAL(10,2);
BEGIN
    SELECT base_price_excluding_vat INTO v_base_price
    FROM product_variants
    WHERE id = p_variant_id;
    
    INSERT INTO price_tiers (product_variant_id, min_quantity, max_quantity, discount_percentage, price_per_unit)
    VALUES
        (p_variant_id, 1, 4, 0, v_base_price),
        (p_variant_id, 5, 9, 5, v_base_price * 0.95),
        (p_variant_id, 10, 24, 10, v_base_price * 0.90),
        (p_variant_id, 25, 49, 15, v_base_price * 0.85),
        (p_variant_id, 50, NULL, 20, v_base_price * 0.80)
    ON CONFLICT (product_variant_id, min_quantity) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VIEW PRINCIPAL PARA PRODUTOS
-- ================================================

CREATE OR REPLACE VIEW v_products_full AS
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
    (pt.name || ' - ' || sf.name || ' ' || COALESCE(pv.orientation, '')) AS full_product_title,
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
    m.thickness_mm AS material_thickness,
    pv.base_price_excluding_vat,
    pv.base_price_including_vat,
    pv.cost_price,
    pv.stock_quantity,
    pv.stock_status,
    pv.low_stock_threshold,
    pv.restock_date,
    pv.main_image_url,
    pv.seo_title,
    pv.seo_description,
    pv.display_order,
    pv.created_at,
    pv.updated_at
FROM product_variants pv
INNER JOIN product_templates pt ON pv.product_template_id = pt.id
INNER JOIN size_formats sf ON pv.size_format_id = sf.id
LEFT JOIN categories c ON pt.category_id = c.id
LEFT JOIN materials m ON pt.material_id = m.id;

COMMENT ON VIEW v_products_full IS 'View completa com todos os dados relevantes dos produtos';
