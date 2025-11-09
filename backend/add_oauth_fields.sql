-- =============================================
-- 添加 OAuth 支援欄位到 users 表
-- =============================================
-- 此腳本可以直接在 Supabase SQL Editor 執行
-- 或使用 psql 連線執行

-- 1. 添加 password_hash 欄位（支援傳統登入）
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. 添加 OAuth 提供者欄位
ALTER TABLE users
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);

-- 3. 添加 OAuth 使用者 ID
ALTER TABLE users
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

-- 4. 添加 OAuth 頭像 URL
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- 5. 創建 OAuth 複合唯一索引（只對非 NULL 值）
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_oauth
ON users (oauth_provider, oauth_id)
WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

-- 6. 驗證欄位已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('password_hash', 'oauth_provider', 'oauth_id', 'profile_picture_url')
ORDER BY column_name;

-- =============================================
-- 預期輸出應該顯示 4 個欄位：
-- - oauth_id            | character varying | YES
-- - oauth_provider      | character varying | YES
-- - password_hash       | character varying | YES
-- - profile_picture_url | character varying | YES
-- =============================================
