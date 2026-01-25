-- Add page_views column to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 0;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_admins_page_views ON admins(page_views);
