-- ==========================================
-- BANNER IMAGE FEATURE - DATABASE MIGRATION
-- ==========================================
-- Run this in Supabase SQL Editor
-- Adds banner image columns to admins table
-- ==========================================

-- Add banner columns to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS banner_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS banner_uploaded_at TIMESTAMPTZ;

-- Create index for performance (for public gallery queries)
CREATE INDEX IF NOT EXISTS idx_admins_banner_enabled ON admins(banner_enabled);

-- ==========================================
-- VERIFICATION
-- ==========================================
-- Run this to verify the columns were added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'admins' AND column_name LIKE 'banner%';
