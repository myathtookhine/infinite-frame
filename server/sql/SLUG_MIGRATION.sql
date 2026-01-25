-- ==========================================
-- SLUG MIGRATION - Dynamic Identity Routing
-- ==========================================
-- Adds slug, gallery_name, and description columns to admins table
-- Run this in Supabase SQL Editor
-- ==========================================

-- Add new columns to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS gallery_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone_numbers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Create index on slug for performance
CREATE INDEX IF NOT EXISTS idx_admins_slug ON admins(slug);

-- ==========================================
-- Optional: Add sample data for testing
-- ==========================================
-- Uncomment and update with your actual admin username to test
-- UPDATE admins 
-- SET slug = 'lawkanatgallery', 
--     gallery_name = 'Lawkanat Gallery', 
--     description = 'A curated collection of contemporary art and traditional masterpieces.',
--     address = '123 Art Street, Gallery District, Yangon, Myanmar',
--     phone_numbers = '["09-123-456-789", "09-987-654-321"]'::jsonb,
--     social_links = '{"instagram": "https://instagram.com/lawkanatgallery", "facebook": "https://facebook.com/lawkanatgallery", "website": "https://lawkanatgallery.com"}'::jsonb
-- WHERE username = 'yourusername';
