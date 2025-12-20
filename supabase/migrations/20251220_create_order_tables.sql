-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company_name VARCHAR(255),
    tax_id VARCHAR(50),
    auth_user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shipping_addresses table
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Portugal',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    subtotal_excluding_vat DECIMAL(10, 2) NOT NULL,
    subtotal_including_vat DECIMAL(10, 2) NOT NULL,
    shipping_cost_excluding_vat DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_cost_including_vat DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount_excluding_vat DECIMAL(10, 2) NOT NULL,
    total_amount_with_vat DECIMAL(10, 2) NOT NULL,
    shipping_address_id INTEGER REFERENCES shipping_addresses(id),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price_excluding_vat DECIMAL(10, 2) NOT NULL,
    unit_price_with_vat DECIMAL(10, 2) NOT NULL,
    line_total_excluding_vat DECIMAL(10, 2) NOT NULL,
    line_total_with_vat DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_customer_id ON shipping_addresses(customer_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Service role has full access to customers"
    ON customers FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own customer record"
    ON customers FOR SELECT
    USING (auth_user_id = auth.uid()::text);

-- RLS Policies for shipping_addresses
CREATE POLICY "Service role has full access to shipping_addresses"
    ON shipping_addresses FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own addresses"
    ON shipping_addresses FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE auth_user_id = auth.uid()::text
        )
    );

-- RLS Policies for orders
CREATE POLICY "Service role has full access to orders"
    ON orders FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE auth_user_id = auth.uid()::text
        )
    );

-- RLS Policies for order_items
CREATE POLICY "Service role has full access to order_items"
    ON order_items FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own order items"
    ON order_items FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders WHERE customer_id IN (
                SELECT id FROM customers WHERE auth_user_id = auth.uid()::text
            )
        )
    );
