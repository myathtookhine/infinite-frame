-- ==========================================
-- ၁။ Table Structure (ဇယား တည်ဆောက်ခြင်း)
-- ==========================================

-- ရှိပြီးသား table အဟောင်းရှိရင် ဖျက်မယ် (Reset လုပ်ချင်ရင် သုံးရန်)
DROP TABLE IF EXISTS admins;

-- Admin table ကို Username နဲ့ အသစ်ပြန်ဆောက်မယ်
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,                    -- အလိုအလျောက်တိုးမည့် ID
    username VARCHAR(50) UNIQUE NOT NULL,    -- ထပ်နေလို့မရသော Username
    password_hash TEXT NOT NULL,              -- Password (နောင်တွင် Hash လုပ်သိမ်းမည်)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- ဆောက်သည့်အချိန်
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