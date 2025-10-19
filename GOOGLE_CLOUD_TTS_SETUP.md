# Google Cloud TTS 設定指南

## 📋 前置需求

1. Google Cloud Platform 帳號
2. 啟用 Text-to-Speech API
3. 建立服務帳號並下載憑證 JSON 檔案

---

## 🔧 設定步驟

### Step 1: 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 記下專案 ID

### Step 2: 啟用 Text-to-Speech API

1. 在專案中，前往「API 和服務」→「程式庫」
2. 搜尋「Cloud Text-to-Speech API」
3. 點擊「啟用」

### Step 3: 建立服務帳號

1. 前往「IAM 和管理」→「服務帳號」
2. 點擊「建立服務帳號」
3. 填寫服務帳號名稱（例如：`tarot-tts-service`）
4. 授予角色：
   - **Cloud Text-to-Speech API User** (必要)
   - **Storage Object Creator** (用於 Supabase 上傳)
5. 點擊「完成」

### Step 4: 下載憑證 JSON

1. 在服務帳號列表中，找到剛建立的服務帳號
2. 點擊「動作」→「管理金鑰」
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」格式
5. 下載檔案並**安全儲存**（不要提交到 Git！）

### Step 5: 設定環境變數（支援三種方式）

系統支援三種憑證設定方式，依部署環境選擇最適合的：

---

#### 方法 1: 環境變數 JSON 內容（☁️ 雲端部署推薦）

**適用場景**: Vercel, Railway, Render, AWS, GCP 等雲端平台

**步驟**：
1. 將下載的 JSON 憑證檔案內容複製（整個 JSON 字串）
2. 在雲端平台的環境變數設定中新增：

```bash
# 方法 1: 直接貼上 JSON 內容（推薦）
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...}

# Supabase Storage
SUPABASE_STORAGE_BUCKET=audio-files
```

**優點**：
- ✅ 無需上傳檔案到雲端
- ✅ 支援所有雲端平台
- ✅ 更安全（不會遺留檔案）
- ✅ 易於管理和輪換

---

#### 方法 2: 檔案路徑（💻 本地開發推薦）

**適用場景**: 本地開發環境

**步驟**：
1. 將憑證檔案放到安全位置：
```bash
/Users/sean/.config/gcloud/tarot-tts-credentials.json
```

2. 在 `backend/.env` 中新增：
```bash
# 方法 2: 使用檔案路徑
GOOGLE_APPLICATION_CREDENTIALS=/Users/sean/.config/gcloud/tarot-tts-credentials.json

# Supabase Storage
SUPABASE_STORAGE_BUCKET=audio-files
```

**優點**：
- ✅ 適合本地開發
- ✅ 傳統做法，容易理解

**注意**：
- ⚠️ 不要將檔案提交到 Git
- ⚠️ 雲端部署時路徑可能不存在

---

#### 方法 3: Workload Identity（🔐 GCP 原生推薦）

**適用場景**: 部署在 Google Cloud (GKE, Cloud Run, Compute Engine)

**步驟**：
1. 在 Google Cloud 專案中設定 Workload Identity
2. **不需要設定任何環境變數**
3. 系統會自動使用 GCP 的預設憑證

**優點**：
- ✅ 最安全（無需管理憑證檔案）
- ✅ 自動輪換
- ✅ 符合 GCP 最佳實踐

**文件**: [Workload Identity 設定](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)

---

### 環境變數優先順序

系統會按以下順序檢查憑證：

1. **GOOGLE_CLOUD_CREDENTIALS_JSON** (環境變數 JSON 內容)
2. **GOOGLE_APPLICATION_CREDENTIALS** (檔案路徑)
3. **預設憑證** (Workload Identity 或 gcloud)

**建議配置**：
- 🏠 本地開發：使用方法 2（檔案路徑）
- ☁️ 雲端部署：使用方法 1（環境變數 JSON）
- 🔐 GCP 部署：使用方法 3（Workload Identity）

---

### 安全提示

**通用規則**：
- ✅ 將憑證檔案路徑加入 `.gitignore`
- ✅ 定期輪換服務帳號金鑰（每 90 天）
- ❌ **絕對不要**將憑證 JSON 提交到 Git
- ❌ **絕對不要**在前端使用憑證
- ❌ **絕對不要**在公開的 Issue 或 PR 中貼上憑證

**雲端平台範例**：

```bash
# ✅ 正確：在 Vercel 環境變數中設定
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account",...}

# ❌ 錯誤：不要在 .env 檔案中硬編碼並提交到 Git
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account",...}  # 會被提交！
```

---

## 🪣 Supabase Storage 設定

### Step 1: 建立 Storage Bucket

1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇你的專案
3. 前往「Storage」
4. 點擊「New Bucket」
5. 建立名為 `audio-files` 的 bucket
6. 設定為 **Public**（允許讀取）

### Step 2: 設定 RLS Policies

在 Supabase SQL Editor 中執行：

```sql
-- 允許所有人讀取音檔
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

-- 只允許服務角色寫入
CREATE POLICY "Service role can insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-files' AND
  auth.role() = 'service_role'
);

-- 只允許服務角色更新
CREATE POLICY "Service role can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio-files' AND
  auth.role() = 'service_role'
);

-- 只允許服務角色刪除
CREATE POLICY "Service role can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-files' AND
  auth.role() = 'service_role'
);
```

### Step 3: 建立資料夾結構

在 `audio-files` bucket 中建立：
- `static/` - 靜態卡牌解讀音檔
- `dynamic/` - 動態 AI 解讀音檔

---

## 🚀 啟動服務

### 1. 啟動 Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 啟動 Frontend

```bash
bun dev
```

### 3. 測試 TTS API

訪問測試頁面：
```
http://localhost:3000/test-tts-cloud
```

或直接測試 API：
```bash
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "強大！簡單！直接！",
    "character_key": "super_mutant",
    "audio_type": "ai_response",
    "cache_enabled": true,
    "return_format": "url"
  }'
```

---

## 📊 監控與配額

### 免費配額

- **Standard TTS**: 每月 4M 字元免費
- **超過後**: $4 / 1M 字元

### 監控使用量

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇專案
3. 前往「API 和服務」→「配額」
4. 搜尋「Text-to-Speech API」

### 設定預算警示

1. 前往「帳單」→「預算與警示」
2. 建立新預算
3. 設定警示閾值（例如：$5, $10, $20）
4. 設定通知電子郵件

---

## 🐛 疑難排解

### 錯誤：`GOOGLE_APPLICATION_CREDENTIALS` not found

**解決方案**：
```bash
# 確認檔案存在
ls -la /Users/sean/.config/gcloud/tarot-tts-credentials.json

# 確認環境變數已設定
echo $GOOGLE_APPLICATION_CREDENTIALS

# 重新載入環境變數
source backend/.env
```

### 錯誤：`Permission denied` 或 `Insufficient permissions`

**解決方案**：
1. 確認服務帳號有正確的角色
2. 重新下載憑證 JSON
3. 確認專案 ID 正確

### 錯誤：`Quota exceeded`

**解決方案**：
1. 檢查使用量（Google Cloud Console）
2. 清理不必要的音檔（降低重複生成）
3. 調整快取策略（增加 TTL）
4. 考慮升級配額

### Supabase 上傳失敗

**解決方案**：
1. 確認 `SUPABASE_SERVICE_ROLE_KEY` 正確
2. 確認 bucket 名稱為 `audio-files`
3. 確認 RLS policies 設定正確
4. 檢查 Supabase 專案配額

---

## ✅ 功能驗證清單

- [ ] Google Cloud TTS API 已啟用
- [ ] 服務帳號已建立並下載憑證
- [ ] 環境變數已正確設定
- [ ] Supabase Storage bucket 已建立
- [ ] RLS policies 已設定
- [ ] Backend 服務啟動正常
- [ ] `/api/v1/audio/test` 回應 OK
- [ ] `/test-tts-cloud` 頁面可正常訪問
- [ ] 可成功合成語音（至少測試 1 個角色）
- [ ] Redis 快取運作正常
- [ ] 音檔可正常上傳到 Supabase
- [ ] 音檔可正常播放

---

## 📚 相關文件

- [Google Cloud TTS 官方文件](https://cloud.google.com/text-to-speech/docs)
- [Google Cloud TTS 定價](https://cloud.google.com/text-to-speech/pricing)
- [Supabase Storage 文件](https://supabase.com/docs/guides/storage)
- [TTS 多角色實作總結](./TTS_MULTI_CHARACTER_IMPLEMENTATION.md)

---

## 🔐 安全建議

1. **不要將憑證提交到 Git**
   ```bash
   # 確認 .gitignore 包含
   *.json
   !package.json
   !tsconfig.json
   ```

2. **使用環境變數**
   - 開發環境：`.env` 檔案
   - 生產環境：環境變數或 Secrets Manager

3. **定期輪換憑證**
   - 每 90 天輪換一次服務帳號金鑰
   - 刪除不使用的舊金鑰

4. **限制 IP 存取**（選用）
   - 在 Google Cloud Console 設定 IP 白名單
   - 只允許伺服器 IP 存取

5. **監控異常活動**
   - 設定預算警示
   - 定期檢查 API 使用日誌

---

**建立日期**: 2025-10-19
**最後更新**: 2025-10-19
**維護者**: Claude AI
