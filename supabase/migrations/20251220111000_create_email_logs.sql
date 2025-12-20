-- Create email_logs table for tracking all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    resend_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role has full access
-- RLS Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access to email_logs" ON email_logs;
CREATE POLICY "Service role has full access to email_logs"
    ON email_logs FOR ALL
    USING (true)
    WITH CHECK (true);

-- RLS Policy: Users can view their own email logs
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
CREATE POLICY "Users can view their own email logs"
    ON email_logs FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE auth_user_id = auth.uid()::text
        )
    );
