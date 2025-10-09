# Supabase 資料庫連線設定指南

## 問題說明

目前後端啟動時出現 `Tenant or user not found` 錯誤，這是因為 `.env` 檔案中的 Supabase 資料庫連線資訊不正確。

## 解決步驟

### 1. 從 Supabase Dashboard 取得正確的連線資訊

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案 `aelwaolzpraxmzjqdiyw`
3. 點擊左側選單的 **Settings** > **Database**
4. 在 **Connection string** 區塊中，選擇 **URI** 標籤
5. 你會看到類似這樣的連線字串：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.aelwaolzpraxmzjqdiyw.supabase.co:5432/postgres
   ```
6. **重要**：點擊 "Show password" 來顯示真實的資料庫密碼

### 2. 更新 `.env` 檔案

將步驟 1 取得的連線字串更新到 `backend/.env` 檔案中：

```bash
# 將 [YOUR-PASSWORD] 替換為實際的資料庫密碼
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.aelwaolzpraxmzjqdiyw.supabase.co:5432/postgres
```

**注意**：記得在 `postgresql://` 後面加上 `+asyncpg://` 變成 `postgresql+asyncpg://`

### 3. 其他連線選項

如果直接連線不行，也可以嘗試使用 Supabase 的 Transaction Pooler 或 Session Pooler：

#### Transaction Pooler (Port 6543)
```bash
DATABASE_URL=postgresql+asyncpg://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

#### Session Pooler (Port 5432)
```bash
DATABASE_URL=postgresql+asyncpg://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### 4. 暫時使用 SQLite（目前設定）

如果暫時無法取得正確的 Supabase 連線資訊，可以先使用本地 SQLite 資料庫：

```bash
DATABASE_URL=sqlite+aiosqlite:///./wasteland_tarot.db
```

這是目前的設定，伺服器可以正常啟動。

## 驗證連線

更新 `.env` 後，重新啟動伺服器：

```bash
cd backend
uv run uvicorn app.main:app --reload
```

如果連線成功，你應該看到：
```
🏭 Starting Wasteland Tarot API...
📦 Imported database models
🏗️ Database tables created/verified
💾 Database initialized
```

如果還是出現 "Tenant or user not found" 錯誤，請再次確認：
1. 資料庫密碼是否正確
2. 連線字串格式是否正確
3. Supabase 專案是否處於活躍狀態

## 需要協助？

如果你需要重置資料庫密碼：
1. 在 Supabase Dashboard 中
2. Settings > Database
3. 找到 "Database password" 區塊
4. 點擊 "Reset Database Password"
