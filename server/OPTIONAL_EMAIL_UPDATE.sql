-- ==========================================
-- OPTIONAL EMAIL MIGRATION
-- ==========================================
-- Run this in your Supabase SQL Editor to make email optional
-- ==========================================

-- 1. Remove NOT NULL constraint from email column
ALTER TABLE admins ALTER COLUMN email DROP NOT NULL;

-- 2. Ensure username is still unique (already is, but good to verify)
-- Verify: \d admins; should show "email" ... without "not null"
