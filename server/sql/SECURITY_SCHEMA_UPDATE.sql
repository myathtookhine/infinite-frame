-- =====================================================
-- SECURITY ENHANCEMENT - Database Schema Updates
-- =====================================================
-- Run this in Supabase SQL Editor to add security features

-- 1. Add OTP Expiry Column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admins' AND column_name = 'otp_expiry'
  ) THEN
    ALTER TABLE admins ADD COLUMN otp_expiry TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Add Failed Login Tracking Table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    username VARCHAR(50) PRIMARY KEY,
    attempt_count INTEGER DEFAULT 0,
    first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    locked_until TIMESTAMPTZ
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_failed_logins_locked_until ON failed_login_attempts(locked_until);

-- 3. Add Password History Table (prevent password reuse)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_admin_id ON password_history(admin_id);

-- 4. Create function to clean up expired OTPs (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM admins 
  WHERE is_verified = FALSE 
    AND otp_expiry IS NOT NULL 
    AND otp_expiry < NOW() - INTERVAL '24 hours';
    
  RAISE NOTICE 'Cleaned up expired unverified accounts';
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to clean up old failed login attempts
CREATE OR REPLACE FUNCTION cleanup_failed_logins()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts 
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours';
    
  RAISE NOTICE 'Cleaned up old failed login attempts';
END;
$$ LANGUAGE plpgsql;

-- 6. Update RLS Policies for new tables
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend full access on failed_login_attempts" ON failed_login_attempts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Backend full access on password_history" ON password_history
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- RECOMMENDED: Schedule cleanup jobs (Supabase Dashboard > Database > Cron Jobs)
-- =====================================================
-- Add these in Supabase Cron Jobs:
-- 
-- Job 1: Daily OTP cleanup
-- SELECT cleanup_expired_otps();
-- Schedule: 0 2 * * * (daily at 2 AM)
--
-- Job 2: Daily failed login cleanup  
-- SELECT cleanup_failed_logins();
-- Schedule: 0 3 * * * (daily at 3 AM)
-- =====================================================
