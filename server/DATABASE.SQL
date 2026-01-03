-- ==========================================
-- ၁။ Table Structure (ဇယား တည်ဆောက်ခြင်း)
-- ==========================================

-- ရှိပြီးသား table အဟောင်းရှိရင် ဖျက်မယ် (Reset လုပ်ချင်ရင် သုံးရန်)
DROP TABLE IF EXISTS admins;

-- Admin table ကို Username နဲ့ အသစ်ပြန်ဆောက်မယ်
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,                    
    username VARCHAR(50) UNIQUE NOT NULL,    
    email VARCHAR(100) UNIQUE NOT NULL,       
    password_hash TEXT NOT NULL,              
    account_type VARCHAR(20) CHECK (account_type IN ('individual', 'gallery')) DEFAULT 'individual',
    slug VARCHAR(100) UNIQUE,
    otp_code VARCHAR(6),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);


-- ==========================================
-- ၂။ Data Handling (အချက်အလက် ထည့်ခြင်းနှင့် စစ်ဆေးခြင်း)
-- ==========================================

-- Admin user တစ်ယောက် အစမ်းထည့်ရန်
INSERT INTO admins (username, password_hash) 
VALUES ('admin01', '123456');

-- Database ထဲရှိ Data များအားလုံးကို ပြန်ကြည့်ရန်
SELECT * FROM admins;

-- သီးသန့် Username တစ်ခုတည်းကို ရှာကြည့်ရန် (Backend တွင် သုံးမည့်ပုံစံ)
SELECT * FROM admins WHERE username = 'admin01';

-- ၁။ Categories
CREATE TABLE categories (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL);

-- ၂။ Styles
CREATE TABLE styles (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL);

-- ၃။ Themes
CREATE TABLE themes (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL);

-- ၄။ Mediums
CREATE TABLE mediums (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL);

-- ၅။ Size Units
CREATE TABLE units (id SERIAL PRIMARY KEY, name VARCHAR(10) UNIQUE NOT NULL);