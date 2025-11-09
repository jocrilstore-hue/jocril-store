-- ================================================
-- SEED DATA - JOCRIL ACRÍLICOS
-- ================================================

-- ================================================
-- 1. SIZE FORMATS
-- ================================================

INSERT INTO size_formats (name, width_mm, height_mm, description, display_order) VALUES
('A3', 297.00, 420.00, 'Formato A3 (29,7 x 42,0 cm)', 1),
('A4', 210.00, 297.00, 'Formato A4 (21,0 x 29,7 cm)', 2),
('A5', 148.00, 210.00, 'Formato A5 (14,8 x 21,0 cm)', 3),
('A6', 105.00, 148.00, 'Formato A6 (10,5 x 14,8 cm)', 4),
('A7', 74.00, 105.00, 'Formato A7 (7,4 x 10,5 cm)', 5),
('DL', 99.00, 210.00, 'Formato DL (9,9 x 21,0 cm)', 6),
('1/3 A4', 99.00, 210.00, 'Formato 1/3 A4 (9,9 x 21,0 cm)', 7)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 2. MATERIALS
-- ================================================

INSERT INTO materials (name, thickness_mm, description, properties) VALUES
('Acrílico Cristal 2mm', 2.00, 'Acrílico cristal transparente de alta qualidade', '{"transparency": "high", "durability": "medium"}'),
('Acrílico Cristal 3mm', 3.00, 'Acrílico cristal transparente extra resistente', '{"transparency": "high", "durability": "high"}'),
('Acrílico Fosco 2mm', 2.00, 'Acrílico fosco semi-transparente', '{"transparency": "medium", "durability": "medium"}'),
('PVC Transparente 2mm', 2.00, 'PVC transparente flexível', '{"transparency": "medium", "durability": "low", "flexibility": "high"}')
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 3. CATEGORIES
-- ================================================

INSERT INTO categories (name, slug, description, display_order) VALUES
('Expositores de Folhetos', 'expositores-folhetos', 'Expositores verticais e horizontais para folhetos e brochuras', 1),
('Expositores de Cartões', 'expositores-cartoes', 'Expositores para cartões de visita e cartões postais', 2),
('Porta-Menus', 'porta-menus', 'Porta-menus para restaurantes e cafés', 3),
('Placas Informativas', 'placas-informativas', 'Placas em acrílico para sinalização', 4),
('Urnas', 'urnas', 'Urnas em acrílico para eventos e votações', 5),
('Expositores de Produtos', 'expositores-produtos', 'Expositores para produtos diversos', 6)
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- 4. APPLICATIONS
-- ================================================

INSERT INTO applications (name, slug, description, icon, display_order) VALUES
('Restaurantes', 'restaurantes', 'Perfeito para restaurantes e cafés', '🍽️', 1),
('Hotéis', 'hoteis', 'Ideal para hotéis e alojamento', '🏨', 2),
('Lojas', 'lojas', 'Excelente para comércio e retalho', '🏪', 3),
('Escritórios', 'escritorios', 'Profissional para ambientes de escritório', '💼', 4),
('Eventos', 'eventos', 'Perfeito para feiras e eventos', '🎪', 5),
('Turismo', 'turismo', 'Ideal para pontos turísticos', '🗺️', 6)
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- 5. SHIPPING RULES
-- ================================================

INSERT INTO shipping_rules (region, min_delivery_days, max_delivery_days, base_cost, free_shipping_threshold) VALUES
('Portugal Continental', 2, 5, 5.90, 150.00),
('Ilhas (Açores e Madeira)', 5, 10, 15.00, 300.00),
('Espanha', 3, 7, 12.00, 200.00),
('União Europeia', 5, 12, 25.00, 400.00)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE shipping_rules IS 'Regras de envio por região';
