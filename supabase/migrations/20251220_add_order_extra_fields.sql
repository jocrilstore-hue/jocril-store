-- Add EuPago payment fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eupago_reference VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eupago_entity VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eupago_transaction_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add product snapshot fields to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_format VARCHAR(100);

-- Add index for EuPago reference lookups
CREATE INDEX IF NOT EXISTS idx_orders_eupago_reference ON orders(eupago_reference);
