-- Add sort_order column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Index for performance when sorting
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
