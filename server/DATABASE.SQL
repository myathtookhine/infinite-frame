-- ==========================================
-- INFINITE FRAME - SUPABASE DATABASE SCHEMA
-- ==========================================
-- Run this in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. ENABLE EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CLEANUP (Use with caution!)
-- ==========================================
-- Uncomment these lines only if you want to reset the database
-- DROP TABLE IF EXISTS artwork_attributes CASCADE;
-- DROP TABLE IF EXISTS artworks CASCADE;
-- DROP TABLE IF EXISTS attributes CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;

-- ==========================================
-- 3. USERS & AUTH (admins table)
-- ==========================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('super_admin', 'individual')) NOT NULL DEFAULT 'individual',
    otp_code VARCHAR(6),
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. MASTER DATA (Dynamic Attributes)
-- ==========================================
CREATE TABLE IF NOT EXISTS attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_id, type, name)
);

-- ==========================================
-- 5. CATEGORIES (Separate from Attributes)
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_id, name)
);

-- ==========================================
-- 6. ARTWORKS
-- ==========================================
CREATE TABLE IF NOT EXISTS artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    price DECIMAL(15, 2),
    description TEXT,
    image_url TEXT,
    is_sold BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. ARTWORK ATTRIBUTES (Link Table)
-- ==========================================
CREATE TABLE IF NOT EXISTS artwork_attributes (
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    attribute_id UUID REFERENCES attributes(id) ON DELETE RESTRICT,
    PRIMARY KEY (artwork_id, attribute_id)
);

-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_attributes_admin_id ON attributes(admin_id);
CREATE INDEX IF NOT EXISTS idx_attributes_type ON attributes(type);
CREATE INDEX IF NOT EXISTS idx_categories_admin_id ON categories(admin_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_artworks_admin_id ON artworks(admin_id);
CREATE INDEX IF NOT EXISTS idx_artworks_is_active ON artworks(is_active);

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_attributes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 10. RLS POLICIES (Backend Access)
-- ==========================================
-- Allow backend (service_role) to access all data
-- Your Node.js backend uses service_role key

CREATE POLICY "Backend full access on admins" ON admins
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Backend full access on attributes" ON attributes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Backend full access on categories" ON categories
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Backend full access on artworks" ON artworks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Backend full access on artwork_attributes" ON artwork_attributes
    FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 11. UPDATED_AT TRIGGER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attributes_updated_at
    BEFORE UPDATE ON attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artworks_updated_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 12. SEED SUPER ADMIN (Optional)
-- ==========================================
-- Replace the password_hash with actual bcrypt hash
-- You can generate one using: https://bcrypt-generator.com/
-- Or run in your Node.js: bcrypt.hashSync('yourpassword', 10)

-- INSERT INTO admins (username, email, password_hash, role, is_verified, status)
-- VALUES ('superadmin', 'admin@infiniteframe.online', '$2b$10$YourActualHashHere', 'super_admin', TRUE, 'active')
-- ON CONFLICT (email) DO NOTHING;