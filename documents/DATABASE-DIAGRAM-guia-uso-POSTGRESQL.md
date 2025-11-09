# 📊 DIAGRAMA ER E GUIA DE USO - JOCRIL ACRÍLICOS (PostgreSQL)
## Base de Dados Para Sistema de Produtos Com Variações

---

## 🗺️ DIAGRAMA ENTIDADE-RELACIONAMENTO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ESTRUTURA PRINCIPAL                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────┐
                        │  categories  │
                        │──────────────│
                        │ id (PK)      │
                        │ name         │
                        │ slug         │
                        │ parent_id    │◄─┐
                        └──────┬───────┘  │
                               │          │
                        (auto-referência) │
                               │          │
                        ┌──────▼───────────┴─────────────┐
                        │   product_templates           │
                        │───────────────────────────────│
                        │ id (PK)                       │
                        │ name                          │
                        │ slug (UNIQUE)                 │
                        │ sku_prefix                    │
                        │ category_id (FK) ────────────►│
                        │ material_id (FK)              │
                        │ full_description (TEXT)       │
                        │ advantages (TEXT)             │
                        │ faq (JSONB)                   │
                        │ orientation                   │
                        │ has_lock                      │
                        │ is_double_sided               │
                        └───────┬───────────────────────┘
                                │
                                │ 1:N (Um template, várias variantes)
                                │
                        ┌───────▼──────────────────────────┐
                        │   product_variants               │
                        │──────────────────────────────────│
                        │ id (PK)                          │
                        │ product_template_id (FK) ────────┘
                        │ size_format_id (FK) ──────────┐
                        │ sku (UNIQUE)                  │
                        │ orientation                   │
                        │ base_price_excluding_vat      │
                        │ base_price_including_vat      │
                        │ stock_quantity                │
                        │ stock_status                  │
                        │ url_slug (UNIQUE)             │
                        │ main_image_url                │
                        │ specific_description          │
                        │ ideal_for                     │
                        └───────┬───────────┬────────────┘
                                │           │
                ┌───────────────┼───────────┼─────────────────┐
                │               │           │                 │
                │               │           │                 │
        ┌───────▼────────┐  ┌──▼───────┐  │   ┌────────────▼─────────┐
        │  price_tiers   │  │  product │  │   │   product_images     │
        │────────────────│  │  _images │  │   │──────────────────────│
        │ id (PK)        │  │──────────│  │   │ id (PK)              │
        │ variant_id(FK) │  │ id (PK)  │  │   │ variant_id (FK)      │
        │ min_quantity   │  │ variant  │  │   │ image_url            │
        │ max_quantity   │  │ _id (FK) │  │   │ image_type           │
        │ discount_%     │  │ image_url│  │   │ alt_text             │
        │ price_per_unit │  │ alt_text │  │   │ display_order        │
        └────────────────┘  └──────────┘  │   └──────────────────────┘
                                          │
                            ┌─────────────▼──────────────┐
                            │  product_reviews           │
                            │────────────────────────────│
                            │ id (PK)                    │
                            │ variant_id (FK)            │
                            │ customer_name              │
                            │ rating (1-5)               │
                            │ review_text                │
                            │ verified_purchase          │
                            │ is_approved                │
                            └────────────────────────────┘

┌──────────────┐
│size_formats  │◄───────────────────┐
│──────────────│                    │
│ id (PK)      │                    │
│ name (A4..)  │                    │
│ width_mm     │                    │
│ height_mm    │                    │
│ width_cm     │ (computed)         │
│ height_cm    │ (computed)         │
│ area_cm2     │ (computed)         │
└──────────────┘                    │
                                    │
┌──────────────┐                    │
│  materials   │◄──────────┐        │
│──────────────│           │        │
│ id (PK)      │           │        │
│ name         │           │        │
│ thickness    │           │        │
│ properties   │ (JSONB)   │        │
└──────────────┘           │        │
                           │        │
                  product_templates │
                           │        │
                           │        │
                  product_variants──┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                     TABELAS DE RELACIONAMENTO                                 │
└─────────────────────────────────────────────────────────────────────────────┘

        product_templates                      applications
                │                                    │
                │                                    │
                └───────────┬────────────────────────┘
                            │
                    ┌───────▼──────────────┐
                    │ product_applications │  (M:N)
                    │──────────────────────│
                    │ template_id (FK)     │
                    │ application_id (FK)  │
                    │ relevance_score      │
                    └──────────────────────┘


        product_templates
                │
                └───────────┬────────────┐
                            │            │
                    ┌───────▼─────────┐  │
                    │ related_products│  │ (M:N auto-relacionamento)
                    │─────────────────│  │
                    │ template_id(FK) │──┘
                    │ related_id (FK) │
                    │ type            │
                    └─────────────────┘


        product_variants
                │
                └───────────┬────────────┐
                            │            │
                ┌───────────▼─────────┐  │
                │ frequently_bought   │  │ (M:N)
                │   _together         │  │
                │─────────────────────│  │
                │ variant_id (FK)     │──┘
                │ related_var_id (FK) │
                │ times_bought        │
                │ bundle_discount_%   │
                └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        TABELAS DE SUPORTE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

        ┌────────────────────┐
        │ technical_specs    │
        │────────────────────│
        │ id (PK)            │
        │ template_id (FK)   │
        │ spec_group         │
        │ spec_name          │
        │ spec_value         │
        └────────────────────┘

        ┌────────────────────┐
        │   product_faqs     │
        │────────────────────│
        │ id (PK)            │
        │ template_id (FK)   │
        │ question           │
        │ answer             │
        │ category           │
        └────────────────────┘

        ┌────────────────────┐
        │  shipping_rules    │
        │────────────────────│
        │ id (PK)            │
        │ region             │
        │ min/max_days       │
        │ costs              │
        └────────────────────┘

        ┌────────────────────┐
        │   promotions       │
        │────────────────────│
        │ id (PK)            │
        │ type               │
        │ discount_value     │
        │ start/end_date     │
        └──────┬─────────────┘
               │
               │ M:N
               ▼
        ┌────────────────────┐
        │ promotion_products │
        │────────────────────│
        │ promotion_id (FK)  │
        │ variant_id (FK)    │
        └────────────────────┘

        ┌────────────────────┐
        │ product_analytics  │
        │────────────────────│
        │ id (PK)            │
        │ variant_id (FK)    │
        │ date               │
        │ page_views         │
        │ add_to_cart        │
        │ purchases          │
        │ revenue            │
        │ conversion_rate    │
        └────────────────────┘
```

---

## 🎯 CONCEITOS CHAVE

### **1. Separação Template vs Variante**

```
TEMPLATE = Conteúdo FIXO
├── Nome base do produto
├── Descrição completa
├── Vantagens
├── FAQ geral
├── Especificações técnicas gerais
└── Aplicações

VARIANTE = Conteúdo VARIÁVEL + Dados comerciais
├── Tamanho específico (A3, A4, etc.)
├── Orientação (vertical/horizontal)
├── SKU único
├── Preço
├── Stock
├── Imagens
└── Descrição específica do tamanho
```

### **2. Exemplo Prático**

```
TEMPLATE: "Expositor de Folheto Acrílico Vertical"
├── VARIANTE 1: Expositor A3 Vertical (SKU: EXP-FOL-A3-V)
│   ├── Preço: €12.50
│   ├── Stock: 45 unidades
│   └── URL: /expositor-folheto-acrilico-a3-vertical
│
├── VARIANTE 2: Expositor A4 Vertical (SKU: EXP-FOL-A4-V)
│   ├── Preço: €8.90
│   ├── Stock: 120 unidades
│   └── URL: /expositor-folheto-acrilico-a4-vertical
│
├── VARIANTE 3: Expositor A5 Vertical (SKU: EXP-FOL-A5-V)
│   ├── Preço: €6.20
│   ├── Stock: 80 unidades
│   └── URL: /expositor-folheto-acrilico-a5-vertical
...
```

---

## 📝 CASOS DE USO COMUNS

### **1. Criar Novo Produto Completo**

```sql
-- 1. Criar template
INSERT INTO product_templates (
    name, slug, sku_prefix, category_id, 
    short_description, full_description, 
    orientation, has_lock, is_double_sided
)
VALUES (
    'Expositor de Folheto Acrílico Vertical',
    'expositor-folheto-acrilico',
    'EXP-FOL',
    1,
    'Expositor transparente de alta qualidade...',
    'Descrição completa do produto...',
    'vertical',
    FALSE,
    FALSE
)
RETURNING id; -- PostgreSQL returns the new ID

-- Suponha que retornou id = 10

-- 2. Criar variantes para cada tamanho
INSERT INTO product_variants (
    product_template_id, size_format_id, orientation,
    sku, base_price_excluding_vat, base_price_including_vat
)
VALUES
(10, 1, 'vertical', 'EXP-FOL-A3-V', 12.50, 15.38),
(10, 2, 'vertical', 'EXP-FOL-A4-V', 8.90, 10.95),
(10, 3, 'vertical', 'EXP-FOL-A5-V', 6.20, 7.63),
(10, 4, 'vertical', 'EXP-FOL-A6-V', 4.80, 5.90),
(10, 5, 'vertical', 'EXP-FOL-A7-V', 3.50, 4.31),
(10, 6, 'vertical', 'EXP-FOL-DL-V', 5.00, 6.15),
(10, 7, 'vertical', 'EXP-FOL-1/3A4-V', 4.20, 5.17);

-- 3. Criar price tiers para cada variante
-- Usando a função que criamos
SELECT fn_create_price_tiers(id) 
FROM product_variants 
WHERE product_template_id = 10;

-- 4. Adicionar imagens
INSERT INTO product_images (product_variant_id, image_url, alt_text, image_type, display_order)
SELECT 
    id,
    '/images/exp-fol-' || LOWER(sf.name) || '-v.jpg',
    'Expositor ' || sf.name || ' Vertical',
    'main',
    1
FROM product_variants pv
JOIN size_formats sf ON pv.size_format_id = sf.id
WHERE pv.product_template_id = 10;
```

### **2. Listar Produtos de uma Categoria**

```sql
-- Listar todos os produtos ativos de uma categoria
SELECT * FROM v_products_full
WHERE category_slug = 'expositores'
  AND variant_active = TRUE
ORDER BY is_bestseller DESC, display_order, created_at DESC;

-- Com paginação
SELECT * FROM v_products_full
WHERE category_slug = 'expositores'
  AND variant_active = TRUE
ORDER BY is_bestseller DESC, display_order
LIMIT 20 OFFSET 0;
```

### **3. Obter Produto para Página de Detalhe**

```sql
SELECT 
    vpf.*,
    pt.full_description,
    pt.advantages,
    pt.care_instructions,
    pt.faq,
    STRING_AGG(DISTINCT pi.image_url, ',' ORDER BY pi.display_order) AS gallery_images,
    COALESCE(AVG(pr.rating), 0) AS avg_rating,
    COUNT(DISTINCT pr.id) AS review_count
FROM v_products_full vpf
INNER JOIN product_templates pt ON vpf.template_id = pt.id
LEFT JOIN product_images pi ON vpf.variant_id = pi.product_variant_id
LEFT JOIN product_reviews pr ON vpf.variant_id = pr.product_variant_id 
    AND pr.is_approved = TRUE
WHERE vpf.url_slug = 'expositor-folheto-acrilico-a4-vertical'
GROUP BY 
    vpf.variant_id, vpf.sku, vpf.url_slug, vpf.barcode, vpf.variant_active,
    vpf.is_bestseller, vpf.template_id, vpf.template_name, vpf.template_slug,
    vpf.reference_code, vpf.short_description, vpf.has_quantity_discounts,
    vpf.min_order_quantity, vpf.is_featured, vpf.full_product_title, vpf.size_id,
    vpf.size_name, vpf.width_mm, vpf.height_mm, vpf.width_cm, vpf.height_cm,
    vpf.orientation, vpf.category_id, vpf.category_name, vpf.category_slug,
    vpf.material_id, vpf.material_name, vpf.material_thickness,
    vpf.base_price_excluding_vat, vpf.base_price_including_vat, vpf.cost_price,
    vpf.stock_quantity, vpf.stock_status, vpf.low_stock_threshold, vpf.restock_date,
    vpf.main_image_url, vpf.seo_title, vpf.seo_description, vpf.display_order,
    vpf.created_at, vpf.updated_at,
    pt.full_description, pt.advantages, pt.care_instructions, pt.faq;
```

### **4. Calcular Preço com Desconto**

```sql
-- Usando a função helper
SELECT 
    sku,
    base_price_excluding_vat,
    fn_get_price_for_quantity(id, 30) AS price_for_30_units,
    fn_get_price_for_quantity(id, 50) AS price_for_50_units,
    fn_get_price_for_quantity(id, 100) AS price_for_100_units
FROM product_variants
WHERE sku = 'EXP-FOL-A4-V';

-- Ou manualmente
SELECT 
    pv.sku,
    pv.base_price_excluding_vat AS base_price,
    30 AS desired_quantity,
    COALESCE(
        (SELECT pt.price_per_unit
         FROM price_tiers pt
         WHERE pt.product_variant_id = pv.id
           AND 30 BETWEEN pt.min_quantity AND COALESCE(pt.max_quantity, 999999)
         LIMIT 1),
        pv.base_price_excluding_vat
    ) AS final_price_per_unit
FROM product_variants pv
WHERE pv.sku = 'EXP-FOL-A4-V';
```

### **5. Pesquisa Full-Text**

```sql
-- Pesquisar produtos (PostgreSQL full-text search)
SELECT * FROM product_templates
WHERE to_tsvector('portuguese', name || ' ' || COALESCE(short_description, '')) 
      @@ plainto_tsquery('portuguese', 'expositor acrílico vertical')
ORDER BY is_featured DESC, is_active DESC;

-- Com ranking de relevância
SELECT 
    pt.*,
    ts_rank(
        to_tsvector('portuguese', pt.name || ' ' || COALESCE(pt.short_description, '')),
        plainto_tsquery('portuguese', 'expositor')
    ) AS relevance
FROM product_templates pt
WHERE to_tsvector('portuguese', pt.name || ' ' || COALESCE(pt.short_description, '')) 
      @@ plainto_tsquery('portuguese', 'expositor')
ORDER BY relevance DESC, is_featured DESC;
```

### **6. Atualizar Stock**

```sql
-- Atualizar stock de uma variante
UPDATE product_variants
SET stock_quantity = stock_quantity - 5
WHERE sku = 'EXP-FOL-A4-V';

-- O trigger trg_update_stock_status irá automaticamente atualizar stock_status

-- Ver produtos com stock baixo
SELECT 
    vpf.full_product_title,
    vpf.sku,
    vpf.stock_quantity,
    vpf.low_stock_threshold,
    vpf.stock_status
FROM v_products_full vpf
WHERE vpf.stock_status IN ('low_stock', 'out_of_stock')
  AND vpf.variant_active = TRUE
ORDER BY vpf.stock_quantity ASC;
```

### **7. Produtos Relacionados**

```sql
-- Adicionar produtos relacionados
INSERT INTO related_products (product_variant_id, related_variant_id, relation_type)
VALUES 
(123, 124, 'similar'),    -- Produto similar
(123, 125, 'accessory'),  -- Acessório complementar
(123, 126, 'upgrade');    -- Versão melhorada

-- Obter produtos relacionados
SELECT 
    vpf.full_product_title,
    vpf.base_price_including_vat,
    vpf.main_image_url,
    rp.relation_type
FROM related_products rp
INNER JOIN v_products_full vpf ON rp.related_variant_id = vpf.variant_id
WHERE rp.product_variant_id = 123
  AND vpf.variant_active = TRUE
ORDER BY rp.display_order;
```

---

## 📈 ANALYTICS E TRACKING

### **1. Registrar Visualização**

```sql
-- Inserir ou incrementar visualização do dia
INSERT INTO product_analytics (product_variant_id, date, page_views, unique_visitors)
VALUES (123, CURRENT_DATE, 1, 1)
ON CONFLICT (product_variant_id, date) 
DO UPDATE SET 
    page_views = product_analytics.page_views + 1,
    unique_visitors = product_analytics.unique_visitors + 1;
```

### **2. Registrar Adição ao Carrinho**

```sql
-- Registrar adição ao carrinho
INSERT INTO product_analytics (product_variant_id, date, add_to_cart_count)
VALUES (123, CURRENT_DATE, 1)
ON CONFLICT (product_variant_id, date)
DO UPDATE SET 
    add_to_cart_count = product_analytics.add_to_cart_count + 1;
```

### **3. Registrar Compra**

```sql
-- Registrar compra
INSERT INTO product_analytics (product_variant_id, date, purchases_count, revenue)
VALUES (123, CURRENT_DATE, 1, 10.95)
ON CONFLICT (product_variant_id, date)
DO UPDATE SET 
    purchases_count = product_analytics.purchases_count + 1,
    revenue = product_analytics.revenue + 10.95;
```

### **4. Promoções**

```sql
-- Criar promoção "Black Friday"
INSERT INTO promotions (name, promotion_type, discount_value, start_date, end_date)
VALUES ('Black Friday 2025', 'percentage', 25.00, '2025-11-24', '2025-11-30')
RETURNING id;

-- Suponha que retornou id = 5

-- Adicionar produtos à promoção
INSERT INTO promotion_products (promotion_id, product_variant_id)
SELECT 5, id
FROM product_variants
WHERE product_template_id IN (1, 2, 3); -- templates específicos
```

---

## 📊 QUERIES DE REPORTING

### **Dashboard Principal**

```sql
-- KPIs principais
SELECT 
    'Total Produtos' AS metric,
    COUNT(DISTINCT pt.id)::TEXT AS value
FROM product_templates pt WHERE pt.is_active = TRUE

UNION ALL

SELECT 
    'Total Variantes',
    COUNT(DISTINCT pv.id)::TEXT
FROM product_variants pv WHERE pv.is_active = TRUE

UNION ALL

SELECT 
    'Valor Total Stock',
    ROUND(SUM(pv.stock_quantity * pv.base_price_excluding_vat), 2)::TEXT
FROM product_variants pv WHERE pv.is_active = TRUE

UNION ALL

SELECT 
    'Produtos Esgotados',
    COUNT(*)::TEXT
FROM product_variants
WHERE stock_status = 'out_of_stock' AND is_active = TRUE;
```

### **Top 10 Produtos Mais Vendidos (Último Mês)**

```sql
SELECT 
    vpf.full_product_title,
    SUM(pa.purchases_count) AS total_sales,
    SUM(pa.revenue) AS total_revenue,
    AVG(pr.rating) AS avg_rating
FROM product_analytics pa
INNER JOIN v_products_full vpf ON pa.product_variant_id = vpf.variant_id
LEFT JOIN product_reviews pr ON vpf.variant_id = pr.product_variant_id 
    AND pr.is_approved = TRUE
WHERE pa.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY vpf.variant_id, vpf.full_product_title
ORDER BY total_sales DESC
LIMIT 10;
```

### **Análise de Conversão**

```sql
SELECT 
    vpf.full_product_title,
    SUM(pa.page_views) AS views,
    SUM(pa.add_to_cart_count) AS cart_adds,
    SUM(pa.purchases_count) AS purchases,
    ROUND(
        SUM(pa.purchases_count) * 100.0 / NULLIF(SUM(pa.page_views), 0), 
        2
    ) AS conversion_rate
FROM product_analytics pa
INNER JOIN v_products_full vpf ON pa.product_variant_id = vpf.variant_id
WHERE pa.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY vpf.variant_id, vpf.full_product_title
HAVING SUM(pa.page_views) > 10
ORDER BY conversion_rate DESC;
```

### **Produtos Mais Lucrativos**

```sql
SELECT 
    vpf.full_product_title,
    SUM(pa.purchases_count) AS units_sold,
    SUM(pa.revenue) AS total_revenue,
    AVG(pv.cost_price) AS avg_cost,
    SUM(pa.revenue) - (SUM(pa.purchases_count) * AVG(pv.cost_price)) AS profit
FROM product_analytics pa
INNER JOIN v_products_full vpf ON pa.product_variant_id = vpf.variant_id
INNER JOIN product_variants pv ON vpf.variant_id = pv.id
WHERE pa.date >= CURRENT_DATE - INTERVAL '90 days'
  AND pv.cost_price IS NOT NULL
GROUP BY vpf.variant_id, vpf.full_product_title
ORDER BY profit DESC
LIMIT 20;
```

---

## ⚡ OPTIMIZAÇÕES

### **1. Índices Importantes**

```sql
-- Já incluídos no schema, mas destacando os mais críticos:

-- Para pesquisa rápida por slug
CREATE INDEX IF NOT EXISTS idx_slug ON product_variants(url_slug);

-- Para listagens de categoria
CREATE INDEX IF NOT EXISTS idx_category_active 
ON product_templates(category_id, is_active);

-- Para analytics e reporting
CREATE INDEX IF NOT EXISTS idx_analytics_date 
ON product_analytics(date DESC);

-- Para ordenação por bestsellers
CREATE INDEX IF NOT EXISTS idx_bestseller 
ON product_variants(is_bestseller, display_order);

-- Para buscas por stock status
CREATE INDEX IF NOT EXISTS idx_stock_search 
ON product_variants(stock_status, is_active);
```

### **2. Caching Strategy**

```
CACHE Layer 1 (Redis): 
- Dados do produto completo (TTL: 1 hora)
- Preços com desconto calculados (TTL: 30 min)
- Lista de produtos por categoria (TTL: 1 hora)

CACHE Layer 2 (Application):
- Size formats (raramente mudam)
- Categories tree (raramente mudam)
- Shipping rules (raramente mudam)

INVALIDAR quando:
- Produto atualizado → invalidar cache do produto
- Preço mudado → invalidar todos os preços do template
- Stock atualizado → invalidar apenas stock_quantity
```

### **3. Partitioning (Para crescimento futuro)**

```sql
-- PostgreSQL: Particionar analytics por mês
CREATE TABLE product_analytics_partitioned (
    id SERIAL,
    product_variant_id INT NOT NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (date);

-- Criar partições mensais
CREATE TABLE product_analytics_2025_01 PARTITION OF product_analytics_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE product_analytics_2025_02 PARTITION OF product_analytics_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
    
-- Etc...
```

### **4. Vacuum e Analyze**

```sql
-- Manutenção regular do PostgreSQL
VACUUM ANALYZE product_variants;
VACUUM ANALYZE product_analytics;
VACUUM ANALYZE product_reviews;

-- Configurar autovacuum (no postgresql.conf)
-- autovacuum = on
-- autovacuum_vacuum_scale_factor = 0.1
-- autovacuum_analyze_scale_factor = 0.05
```

---

## 🎓 EXEMPLOS DE INTEGRAÇÃO

### **API Endpoint: Obter Produto**

```javascript
// GET /api/products/:slug

async function getProduct(slug) {
    const query = `
        SELECT 
            pv.*, pt.*, sf.*, c.name as category_name
        FROM product_variants pv
        JOIN product_templates pt ON pv.product_template_id = pt.id
        JOIN size_formats sf ON pv.size_format_id = sf.id
        JOIN categories c ON pt.category_id = c.id
        WHERE pv.url_slug = $1
    `;
    
    const product = await db.query(query, [slug]);
    
    // Buscar price tiers
    product.priceTiers = await db.query(`
        SELECT * FROM price_tiers 
        WHERE product_variant_id = $1
        ORDER BY min_quantity
    `, [product.id]);
    
    // Buscar imagens
    product.images = await db.query(`
        SELECT * FROM product_images
        WHERE product_variant_id = $1
        ORDER BY display_order
    `, [product.id]);
    
    return product;
}
```

### **Carrinho de Compras: Calcular Total**

```javascript
async function calculateCartTotal(cartItems) {
    let total = 0;
    
    for (const item of cartItems) {
        const result = await db.query(`
            SELECT fn_get_price_for_quantity($1, $2) as price
        `, [item.variant_id, item.quantity]);
        
        total += result.rows[0].price * item.quantity;
    }
    
    return total;
}
```

### **Tracking de Analytics**

```javascript
async function trackProductView(variantId, isUnique = false) {
    await db.query(`
        INSERT INTO product_analytics (
            product_variant_id, 
            date, 
            page_views, 
            unique_visitors
        )
        VALUES ($1, CURRENT_DATE, 1, $2)
        ON CONFLICT (product_variant_id, date) 
        DO UPDATE SET 
            page_views = product_analytics.page_views + 1,
            unique_visitors = product_analytics.unique_visitors + $2
    `, [variantId, isUnique ? 1 : 0]);
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Setup Básico**
- [ ] Criar database PostgreSQL
- [ ] Executar schema SQL completo
- [ ] Popular size_formats (A3, A4, A5, A6, A7, DL, 1/3A4)
- [ ] Popular materials (Acrílico 2mm, 3mm, PVC, etc.)
- [ ] Popular categories (Expositores, Urnas, Placas, etc.)

### **Fase 2: Primeiro Produto**
- [ ] Criar template "Expositor de Folheto"
- [ ] Criar 7 variantes (A3-A7, DL, 1/3A4)
- [ ] Usar `fn_create_price_tiers()` para adicionar descontos
- [ ] Upload e registrar imagens
- [ ] Testar queries de listagem e detalhe

### **Fase 3: Expansão**
- [ ] Adicionar mais templates de produtos
- [ ] Popular applications (Lojas, Restaurantes, etc.)
- [ ] Configurar related_products
- [ ] Adicionar FAQs aos templates
- [ ] Adicionar especificações técnicas

### **Fase 4: Analytics**
- [ ] Implementar tracking de views na aplicação
- [ ] Tracking de add-to-cart
- [ ] Tracking de purchases
- [ ] Criar dashboard de reporting
- [ ] Configurar jobs de limpeza de dados antigos

### **Fase 5: Otimização**
- [ ] Implementar caching (Redis)
- [ ] Adicionar índices baseados em uso real (EXPLAIN ANALYZE)
- [ ] Monitorizar slow queries (pg_stat_statements)
- [ ] Configurar backups automatizados (pg_dump)
- [ ] Configurar replicação se necessário

---

## 🔧 COMANDOS ÚTEIS POSTGRESQL

```bash
# Conectar ao banco
psql -U postgres -d jocril_acrilicos

# Listar todas as tabelas
\dt

# Ver estrutura de uma tabela
\d product_variants

# Ver índices de uma tabela
\di product_variants

# Ver views
\dv

# Ver funções
\df

# Executar script
\i /path/to/schema.sql

# Backup
pg_dump -U postgres jocril_acrilicos > backup.sql

# Restore
psql -U postgres jocril_acrilicos < backup.sql

# Ver queries lentas
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Analisar query
EXPLAIN ANALYZE SELECT * FROM v_products_full WHERE category_slug = 'expositores';
```

---

## 📞 SUPORTE E TROUBLESHOOTING

**Precisa de Ajuda?**

1. **Queries lentas?**
   - Use `EXPLAIN ANALYZE` para ver o plano de execução
   - Verifique se os índices estão sendo usados
   - Considere adicionar índices compostos

2. **Problemas com full-text search?**
   - Verifique se os índices GIN estão criados
   - Teste diferentes configurações de idioma ('portuguese', 'simple')
   - Use `to_tsvector` e `plainto_tsquery` corretamente

3. **Erros de tipo de dados?**
   - Lembre-se: PostgreSQL é mais estrito que MySQL
   - Use casting explícito quando necessário (::TEXT, ::INTEGER)
   - SERIAL é usado em vez de AUTO_INCREMENT

4. **Performance issues?**
   - Configure `shared_buffers` e `effective_cache_size`
   - Use connection pooling (PgBouncer)
   - Considere particionar tabelas grandes

---

## 📚 DIFERENÇAS MYSQL vs POSTGRESQL

```
MySQL                      PostgreSQL
---------------------------------------------
AUTO_INCREMENT            SERIAL
CURDATE()                 CURRENT_DATE
NOW()                     CURRENT_TIMESTAMP
DATE_SUB()                - INTERVAL '30 days'
LAST_INSERT_ID()          RETURNING id
CONCAT()                  || operator
JSON                      JSONB
DELIMITER //              $$ LANGUAGE plpgsql
FULLTEXT INDEX            GIN INDEX with to_tsvector
GROUP_CONCAT()            STRING_AGG()
```

---

_Diagrama e Guia criados para Jocril Acrílicos_  
_Versão 2.0 - PostgreSQL - Janeiro 2025_
