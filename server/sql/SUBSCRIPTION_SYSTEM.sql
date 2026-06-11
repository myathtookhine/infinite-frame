-- ==========================================
-- SUBSCRIPTION SYSTEM MIGRATION
-- ==========================================

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) CHECK (plan_type IN ('free', 'pro', 'deluxe')) NOT NULL DEFAULT 'free',
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')) NOT NULL DEFAULT 'monthly',
    status VARCHAR(20) CHECK (status IN ('pending', 'active', 'rejected', 'expired')) NOT NULL DEFAULT 'pending',
    amount DECIMAL(15, 2) DEFAULT 0,
    receipt_url TEXT,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Payment Info Table (Superadmin Settings)
CREATE TABLE IF NOT EXISTS payment_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL, -- e.g., 'KPay', 'KBZ Bank'
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add current plan columns to admins table for quick access
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pf_columns WHERE table_name = 'admins' AND column_name = 'subscription_plan') THEN
        ALTER TABLE admins ADD COLUMN subscription_plan VARCHAR(20) DEFAULT 'free';
        ALTER TABLE admins ADD COLUMN subscription_expiry TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_info_updated_at
    BEFORE UPDATE ON payment_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend full access on subscriptions" ON subscriptions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Backend full access on payment_info" ON payment_info
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Initial Payment Info Seed (Optional)
-- INSERT INTO payment_info (provider, account_name, account_number) VALUES ('KPay', 'Infinite Frame Admin', '09123456789');
