-- Supabase 廢土塔羅牌資料庫 Schema
-- 建立所需的資料表和索引

-- 首先刪除現有表格 (如果存在)
DROP TABLE IF EXISTS public.user_readings CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.wasteland_cards CASCADE;

-- 建立廢土塔羅牌表格
CREATE TABLE public.wasteland_cards (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    suit VARCHAR(50) NOT NULL,
    number INTEGER,
    upright_meaning TEXT NOT NULL,
    reversed_meaning TEXT NOT NULL,
    radiation_level DECIMAL(4,2) DEFAULT 0.0,
    threat_level INTEGER DEFAULT 1 CHECK (threat_level >= 1 AND threat_level <= 5),
    wasteland_humor TEXT,
    nuka_cola_reference TEXT,
    fallout_easter_egg TEXT,
    special_ability TEXT,
    upright_keywords TEXT[], -- PostgreSQL 陣列
    reversed_keywords TEXT[],
    good_interpretation TEXT,
    neutral_interpretation TEXT,
    evil_interpretation TEXT,
    pip_boy_voice TEXT,
    vault_dweller_voice TEXT,
    wasteland_trader_voice TEXT,
    super_mutant_voice TEXT,
    codsworth_voice TEXT,
    brotherhood_significance TEXT,
    ncr_significance TEXT,
    legion_significance TEXT,
    raiders_significance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立用戶表格
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 建立用戶檔案表格
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    karma_level INTEGER DEFAULT 0,
    faction_alignment VARCHAR(50),
    character_voice VARCHAR(50) DEFAULT 'PIP_BOY',
    total_readings INTEGER DEFAULT 0,
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    bio TEXT,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立用戶偏好表格
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    favorite_suit VARCHAR(50),
    preferred_spread_type VARCHAR(50) DEFAULT 'SINGLE_CARD',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    sound_effects BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'zh-TW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立占卜記錄表格
CREATE TABLE public.user_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    question TEXT,
    spread_type VARCHAR(50) NOT NULL,
    cards_drawn TEXT[], -- 儲存抽到的卡牌 ID
    cards_positions TEXT[], -- 儲存卡牌位置
    cards_orientations BOOLEAN[], -- 儲存正逆位
    interpretation_result TEXT,
    character_voice VARCHAR(50),
    karma_influence VARCHAR(50),
    faction_influence VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引以提高查詢效能
CREATE INDEX idx_wasteland_cards_suit ON public.wasteland_cards(suit);
CREATE INDEX idx_wasteland_cards_number ON public.wasteland_cards(number);
CREATE INDEX idx_wasteland_cards_radiation ON public.wasteland_cards(radiation_level);
CREATE INDEX idx_wasteland_cards_threat ON public.wasteland_cards(threat_level);

CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_active ON public.users(is_active);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_karma ON public.user_profiles(karma_level);
CREATE INDEX idx_user_profiles_faction ON public.user_profiles(faction_alignment);

CREATE INDEX idx_user_readings_user_id ON public.user_readings(user_id);
CREATE INDEX idx_user_readings_created ON public.user_readings(created_at);
CREATE INDEX idx_user_readings_public ON public.user_readings(is_public);

-- 建立觸發器自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wasteland_cards_updated_at BEFORE UPDATE ON public.wasteland_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_readings_updated_at BEFORE UPDATE ON public.user_readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 建立 RLS (Row Level Security) 政策
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_readings ENABLE ROW LEVEL SECURITY;

-- 廢土塔羅牌是公開資料，所有人都可以讀取
ALTER TABLE public.wasteland_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read wasteland cards" ON public.wasteland_cards
    FOR SELECT USING (true);

-- 用戶只能讀取自己的資料
CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 用戶檔案政策
CREATE POLICY "Users can read their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用戶偏好政策
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- 占卜記錄政策
CREATE POLICY "Users can read their own readings" ON public.user_readings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read public readings" ON public.user_readings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own readings" ON public.user_readings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own readings" ON public.user_readings
    FOR UPDATE USING (auth.uid() = user_id);

-- 建立一些有用的 Views
CREATE VIEW public.popular_cards AS
SELECT
    wc.*,
    COUNT(ur.id) as usage_count
FROM public.wasteland_cards wc
LEFT JOIN public.user_readings ur ON wc.id = ANY(ur.cards_drawn)
GROUP BY wc.id, wc.name, wc.suit, wc.number, wc.upright_meaning, wc.reversed_meaning,
         wc.radiation_level, wc.threat_level, wc.wasteland_humor, wc.nuka_cola_reference,
         wc.fallout_easter_egg, wc.special_ability, wc.upright_keywords, wc.reversed_keywords,
         wc.good_interpretation, wc.neutral_interpretation, wc.evil_interpretation,
         wc.pip_boy_voice, wc.vault_dweller_voice, wc.wasteland_trader_voice,
         wc.super_mutant_voice, wc.codsworth_voice, wc.brotherhood_significance,
         wc.ncr_significance, wc.legion_significance, wc.raiders_significance,
         wc.created_at, wc.updated_at
ORDER BY usage_count DESC;

CREATE VIEW public.user_stats AS
SELECT
    u.id,
    u.username,
    up.karma_level,
    up.faction_alignment,
    up.total_readings,
    up.level,
    COUNT(ur.id) as actual_readings,
    AVG(ur.feedback_rating) as avg_rating
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_readings ur ON u.id = ur.user_id
GROUP BY u.id, u.username, up.karma_level, up.faction_alignment,
         up.total_readings, up.level;

-- 插入一些基本的枚舉值作為註釋
COMMENT ON COLUMN public.wasteland_cards.suit IS 'MAJOR_ARCANA, NUKA_COLA_BOTTLES, COMBAT_WEAPONS, BOTTLE_CAPS, RADIATION_RODS';
COMMENT ON COLUMN public.user_profiles.faction_alignment IS 'BROTHERHOOD_OF_STEEL, NCR_REPUBLIC, CAESAR_LEGION, RAIDERS, VAULT_DWELLER, INDEPENDENT';
COMMENT ON COLUMN public.user_profiles.character_voice IS 'PIP_BOY, VAULT_DWELLER, WASTELAND_TRADER, SUPER_MUTANT, CODSWORTH';
COMMENT ON COLUMN public.user_preferences.preferred_spread_type IS 'SINGLE_CARD, VAULT_TEC_SPREAD, WASTELAND_SURVIVAL, BROTHERHOOD_COUNCIL';

-- 完成
SELECT 'Wasteland Tarot Database Schema Created Successfully!' as result;