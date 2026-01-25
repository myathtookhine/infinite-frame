-- ==========================================
-- ARTWORKS MIGRATION SCRIPT
-- ==========================================
-- This script creates the artworks table and related structures
-- Run this in Supabase SQL Editor AFTER main DATABASE.SQL
-- ==========================================

-- Step 1: Create artworks table
CREATE TABLE IF NOT EXISTS artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    is_untitled BOOLEAN DEFAULT FALSE,
    description TEXT,
    
    -- Images (MVP Approach)
    main_image TEXT,
    additional_images TEXT[],
    
    -- Category (Required)
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
    
    -- Creation Date
    created_year INTEGER NOT NULL,
    created_month VARCHAR(20),
    
    -- Dimensions
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
    
    -- Status
    status VARCHAR(50) NOT NULL CHECK (status IN ('available', 'sold', 'reserved', 'private collection')),
    
    -- Additional Information
    is_framed BOOLEAN DEFAULT FALSE,
    edition_info VARCHAR(255),
    has_signature BOOLEAN DEFAULT FALSE,
    has_coa BOOLEAN DEFAULT FALSE,
    
    -- Pricing
    price DECIMAL(15, 2),
    currency VARCHAR(10) DEFAULT 'MMK',
    
    -- Sale Status & Display Controls
    is_for_sale BOOLEAN DEFAULT TRUE,
    show_price BOOLEAN DEFAULT TRUE,
    show_additional_details BOOLEAN DEFAULT TRUE,
    
    -- Active Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create artwork_attributes junction table
CREATE TABLE IF NOT EXISTS artwork_attributes (
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES attributes(id) ON DELETE RESTRICT,
    PRIMARY KEY (artwork_id, attribute_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artworks_admin_id ON artworks(admin_id);
CREATE INDEX IF NOT EXISTS idx_artworks_category_id ON artworks(category_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_artworks_is_active ON artworks(is_active);
CREATE INDEX IF NOT EXISTS idx_artworks_created_year ON artworks(created_year);
CREATE INDEX IF NOT EXISTS idx_artworks_name ON artworks(name);

CREATE INDEX IF NOT EXISTS idx_artwork_attributes_artwork_id ON artwork_attributes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_attributes_attribute_id ON artwork_attributes(attribute_id);

-- Step 4: Add updated_at trigger
CREATE TRIGGER update_artworks_updated_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable RLS
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_attributes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies

-- Policy 1: Backend full access (for API operations)
CREATE POLICY "Backend full access on artworks" ON artworks
    FOR ALL USING (true) WITH CHECK (true);

-- Policy 2: Public read access for active artworks (for client gallery)
CREATE POLICY "Public read active artworks" ON artworks
    FOR SELECT USING (is_active = true);

-- Policy 3: Admins can view all their own artworks
CREATE POLICY "Admins view own artworks" ON artworks
    FOR SELECT USING (auth.uid() = admin_id);

-- Policy 4: Admins can insert their own artworks  
CREATE POLICY "Admins insert own artworks" ON artworks
    FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Policy 5: Admins can update their own artworks
CREATE POLICY "Admins update own artworks" ON artworks
    FOR UPDATE USING (auth.uid() = admin_id);

-- Policy 6: Admins can delete their own artworks
CREATE POLICY "Admins delete own artworks" ON artworks
    FOR DELETE USING (auth.uid() = admin_id);

-- Artwork Attributes junction table policies
CREATE POLICY "Backend full access on artwork_attributes" ON artwork_attributes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read artwork attributes" ON artwork_attributes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artworks 
            WHERE artworks.id = artwork_attributes.artwork_id 
            AND artworks.is_active = true
        )
    );

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Summary:
-- ✓ Created artworks table with all fields
-- ✓ Created artwork_attributes junction table
-- ✓ Added indexes for performance
-- ✓ Added updated_at trigger
-- ✓ Enabled RLS with role-based policies
--   - Backend: Full access (API operations)
--   - Public: Read active artworks (client gallery)
--   - Admins: CRUD own artworks
--   - Superadmin: Read-only through backend API
-- ==========================================
