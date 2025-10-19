# TTS 雲端部署指南

## 🚀 快速部署到各大雲端平台

本指南說明如何在不同雲端平台上部署 Google Cloud TTS 服務。

---

## ☁️ 通用步驟

### 1. 準備 Google Cloud 憑證

1. 下載服務帳號 JSON 憑證檔案
2. 複製**整個 JSON 內容**（包含大括號）
3. 將 JSON 內容作為單行字串（移除換行）

```bash
# 原始 JSON（有換行）
{
  "type": "service_account",
  "project_id": "your-project-id",
  ...
}

# 單行格式（用於環境變數）
{"type":"service_account","project_id":"your-project-id",...}
```

### 2. 設定環境變數

在你的雲端平台中設定以下環境變數：

```bash
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id",...}
SUPABASE_STORAGE_BUCKET=audio-files
```

---

## 🎯 各平台部署指南

### Vercel

**步驟**：

1. 前往專案設定 → Environment Variables
2. 新增環境變數：
   - Key: `GOOGLE_CLOUD_CREDENTIALS_JSON`
   - Value: 貼上完整 JSON 字串
   - Environment: Production, Preview, Development（全選）
3. 點擊 "Save"
4. 重新部署專案

**CLI 設定**：
```bash
vercel env add GOOGLE_CLOUD_CREDENTIALS_JSON production
# 貼上 JSON 內容
```

**驗證**：
```bash
# 訪問你的部署 URL
https://your-app.vercel.app/api/v1/audio/test
```

---

### Railway

**步驟**：

1. 進入專案 → Variables 分頁
2. 新增環境變數：
   - Variable: `GOOGLE_CLOUD_CREDENTIALS_JSON`
   - Value: 貼上完整 JSON 字串
3. 點擊 "Add"
4. Railway 會自動重新部署

**注意**：
- Railway 支援多行 JSON，但建議使用單行
- 確保在 Service 層級設定（不是 Project 層級）

---

### Render

**步驟**：

1. Dashboard → 選擇服務 → Environment
2. 新增環境變數：
   - Key: `GOOGLE_CLOUD_CREDENTIALS_JSON`
   - Value: 貼上完整 JSON 字串
3. 點擊 "Save Changes"
4. 點擊 "Manual Deploy" → "Deploy latest commit"

**Blueprint 設定** (render.yaml)：
```yaml
services:
  - type: web
    name: tarot-backend
    env: python
    envVars:
      - key: GOOGLE_CLOUD_CREDENTIALS_JSON
        sync: false  # 手動設定，不同步到 Git
```

---

### Heroku

**步驟**：

1. Settings → Config Vars
2. 新增環境變數：
   - KEY: `GOOGLE_CLOUD_CREDENTIALS_JSON`
   - VALUE: 貼上完整 JSON 字串
3. 點擊 "Add"

**CLI 設定**：
```bash
heroku config:set GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'
```

**注意**：
- 使用單引號包裹 JSON 字串（避免 shell 解析問題）
- Heroku 會自動重啟 dynos

---

### AWS (Elastic Beanstalk)

**步驟**：

1. Configuration → Software → Environment properties
2. 新增環境變數：
   - Name: `GOOGLE_CLOUD_CREDENTIALS_JSON`
   - Value: 貼上完整 JSON 字串
3. 點擊 "Apply"

**CLI 設定** (.ebextensions/env.config)：
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    GOOGLE_CLOUD_CREDENTIALS_JSON: '{"type":"service_account",...}'
```

**注意**：
- ⚠️ 不要直接在 .ebextensions 中硬編碼憑證
- 建議使用 AWS Secrets Manager

---

### Google Cloud Run

**方法 1: 使用 Workload Identity（推薦）**

```bash
# 不需要設定環境變數
# Cloud Run 會自動使用專案的預設憑證
gcloud run deploy tarot-backend \
  --image gcr.io/your-project/tarot-backend \
  --region asia-east1
```

**方法 2: 使用環境變數**

```bash
gcloud run deploy tarot-backend \
  --image gcr.io/your-project/tarot-backend \
  --region asia-east1 \
  --set-env-vars GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'
```

**注意**：
- 方法 1 更安全，推薦使用
- 確保服務帳號有 `roles/cloudrun.serviceAgent` 角色

---

### Docker Compose

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    image: tarot-backend
    environment:
      - GOOGLE_CLOUD_CREDENTIALS_JSON=${GOOGLE_CLOUD_CREDENTIALS_JSON}
    env_file:
      - .env.production
```

**.env.production** (不要提交到 Git):
```bash
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account",...}
```

---

## 🔍 驗證部署

### 測試 TTS API

```bash
# 替換成你的部署 URL
curl https://your-app.com/api/v1/audio/test

# 預期回應
{
  "status": "ok",
  "service": "TTS API",
  "client_initialized": true
}
```

### 測試語音合成

```bash
curl -X POST https://your-app.com/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "測試語音",
    "character_key": "pip_boy",
    "audio_type": "ai_response",
    "cache_enabled": true,
    "return_format": "url"
  }'
```

---

## 🐛 常見問題

### 1. `client_initialized: false`

**原因**: 憑證未正確設定

**解決方案**:
```bash
# 檢查環境變數是否存在
echo $GOOGLE_CLOUD_CREDENTIALS_JSON

# 檢查 JSON 格式是否正確
python3 -c "import json; json.loads('$GOOGLE_CLOUD_CREDENTIALS_JSON')"
```

### 2. `Invalid JSON in GOOGLE_CLOUD_CREDENTIALS_JSON`

**原因**: JSON 格式錯誤（通常是換行或特殊字元問題）

**解決方案**:
```bash
# 將 JSON 壓縮成單行
cat credentials.json | jq -c . | pbcopy
# 貼上到環境變數
```

### 3. `Permission denied` 錯誤

**原因**: 服務帳號權限不足

**解決方案**:
```bash
# 確認服務帳號有以下角色
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudtexttospeech.user"
```

### 4. 環境變數過長

**原因**: 某些平台限制環境變數長度

**解決方案**:
- **選項 1**: 使用 Secret Manager（AWS Secrets Manager, GCP Secret Manager）
- **選項 2**: 將憑證檔案放入容器映像（不推薦）
- **選項 3**: 使用 Workload Identity（僅 GCP）

---

## 🔐 安全最佳實踐

### 1. 使用 Secret Manager

**GCP Secret Manager**:
```bash
# 儲存憑證
gcloud secrets create google-tts-credentials \
  --data-file=credentials.json

# 授予存取權限
gcloud secrets add-iam-policy-binding google-tts-credentials \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

**在程式碼中讀取**:
```python
from google.cloud import secretmanager

client = secretmanager.SecretManagerServiceClient()
name = f"projects/PROJECT_ID/secrets/google-tts-credentials/versions/latest"
response = client.access_secret_version(request={"name": name})
credentials_json = response.payload.data.decode("UTF-8")
```

### 2. 定期輪換憑證

```bash
# 每 90 天輪換一次
gcloud iam service-accounts keys create new-key.json \
  --iam-account=SERVICE_ACCOUNT_EMAIL

# 更新環境變數
# 刪除舊金鑰
gcloud iam service-accounts keys delete OLD_KEY_ID \
  --iam-account=SERVICE_ACCOUNT_EMAIL
```

### 3. 限制服務帳號權限

```bash
# 只授予必要的權限
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudtexttospeech.user"

# 不要使用 Owner 或 Editor 角色
```

---

## 📊 成本監控

### 設定預算警示

**Google Cloud Console**:
1. 前往 Billing → Budgets & alerts
2. 建立預算：
   - Name: "TTS API Budget"
   - Amount: $20/月
   - Alerts: 50%, 90%, 100%
3. 設定通知電子郵件

**CLI 設定**:
```bash
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="TTS API Budget" \
  --budget-amount=20USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

---

## 🎯 效能優化

### 1. 啟用 Redis 快取

```bash
# 在雲端平台設定 Redis URL
REDIS_URL=redis://your-redis-host:6379
```

### 2. 使用 CDN

- 將生成的音檔透過 CDN 分發
- Supabase Storage 已內建 CDN
- 建議使用 Cloudflare 或 Fastly

### 3. 監控 API 使用量

```bash
# 查看使用量
gcloud logging read "resource.type=api" \
  --limit 100 \
  --format json
```

---

**建立日期**: 2025-10-19
**維護者**: Claude AI
**版本**: v1.0 - 雲端部署指南
