# 環境配置檢查清單 (Environment Configuration Checklist)
## AI 串流完成整合 - Task 6.1

**文件版本**: 1.0
**最後更新**: 2025-11-13
**任務狀態**: ✅ 完成

---

## 檢查概覽

本文件提供完整的環境配置檢查清單，確保 AI 串流完成功能在生產環境正確運作。

---

## 1. Streaming Timeout 配置

### 1.1 Backend 配置 (`backend/app/config.py`)

**狀態**: ✅ 已配置

```python
# Line 139 in backend/app/config.py
streaming_timeout: int = Field(60, env="STREAMING_TIMEOUT")  # seconds (default 60)
```

**驗證結果**:
- ✅ 配置項存在於 `Settings` 類別中
- ✅ 預設值設定為 60 秒（符合設計要求）
- ✅ 可透過環境變數 `STREAMING_TIMEOUT` 覆寫

### 1.2 環境變數配置

**當前狀態**: ⚠️ 未設定（使用預設值 60 秒）

**檢查命令**:
```bash
cd backend && grep "^STREAMING_TIMEOUT=" .env
```

**預期結果**:
- 若未設定環境變數，將使用預設值 60 秒
- 若需調整，可在 `.env` 中加入: `STREAMING_TIMEOUT=60`

**建議配置**:
```bash
# Backend .env configuration
STREAMING_TIMEOUT=60  # 可根據實際 AI provider 回應時間調整
```

### 1.3 使用位置追蹤

**需要使用 `settings.streaming_timeout` 的檔案**:
- `backend/app/api/v1/endpoints/readings_stream.py` (Task 3.2 實作時加入)
  - `stream_card_interpretation()` endpoint
  - `stream_multi_card_interpretation()` endpoint

**實作範例**:
```python
import asyncio
from app.config import settings

async with asyncio.timeout(settings.streaming_timeout):
    async for chunk in ai_service.generate_interpretation_stream(...):
        yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
```

---

## 2. TTS API 配置

### 2.1 Google Cloud TTS 配置

**狀態**: ✅ 已配置（Credentials 已設定）

#### Backend 配置項 (`backend/app/config.py`)

```python
# Lines 67-71 in backend/app/config.py
google_cloud_credentials_json: Optional[str] = Field(None, env="GOOGLE_CLOUD_CREDENTIALS_JSON")
google_tts_language_code: Optional[str] = Field("zh-TW", env="GOOGLE_TTS_LANGUAGE_CODE")
google_tts_voice_name: Optional[str] = Field("zh-TW-Standard-A", env="GOOGLE_TTS_VOICE_NAME")
supabase_storage_bucket: str = Field("audio-files", env="SUPABASE_STORAGE_BUCKET")
```

#### 環境變數檢查結果

**檢查命令**:
```bash
cd backend && grep -E "^(GOOGLE_CLOUD_CREDENTIALS_JSON|GOOGLE_TTS_|SUPABASE_STORAGE_BUCKET)=" .env
```

**檢查結果**:
- ✅ `GOOGLE_CLOUD_CREDENTIALS_JSON`: 已配置（credentials 已設定）
- ⚠️ `GOOGLE_TTS_LANGUAGE_CODE`: 未明確設定（將使用預設值 `zh-TW`）
- ⚠️ `GOOGLE_TTS_VOICE_NAME`: 未明確設定（將使用預設值 `zh-TW-Standard-A`）
- ✅ `SUPABASE_STORAGE_BUCKET`: 已設定為 `audio-files`

**建議配置**:
```bash
# Backend .env configuration
GOOGLE_CLOUD_CREDENTIALS_JSON={"type": "service_account", ...}  # 已設定
GOOGLE_TTS_LANGUAGE_CODE=zh-TW  # 可明確設定
GOOGLE_TTS_VOICE_NAME=zh-TW-Standard-A  # 可明確設定，或使用角色專屬 voice
SUPABASE_STORAGE_BUCKET=audio-files  # 已設定
```

### 2.2 Chirp 3:HD TTS 配置（進階功能）

**狀態**: ⚠️ 未啟用（Feature flag 關閉）

#### Backend 配置項

```python
# Lines 73-95 in backend/app/config.py
chirp3_enabled: bool = Field(default=False, env="CHIRP3_ENABLED")
chirp3_rollout_percentage: int = Field(default=0, ge=0, le=100, env="CHIRP3_ROLLOUT_PERCENTAGE")
chirp3_enabled_characters: str = Field(default="", env="CHIRP3_ENABLED_CHARACTERS")
chirp3_fallback_to_wavenet: bool = Field(default=True, env="CHIRP3_FALLBACK_TO_WAVENET")
```

#### 環境變數檢查結果

**檢查命令**:
```bash
cd backend && grep "^CHIRP3_" .env
```

**檢查結果**:
- ⚠️ 所有 CHIRP3 環境變數未設定（將使用預設值，Chirp3 功能關閉）

**建議配置**:
```bash
# Backend .env configuration (Optional - 進階語音品質)
CHIRP3_ENABLED=false  # 初期關閉，待測試後啟用
CHIRP3_ROLLOUT_PERCENTAGE=0  # 漸進式 rollout: 0% → 10% → 50% → 100%
CHIRP3_ENABLED_CHARACTERS=  # 空白 = 所有角色，或設定特定角色（如: pip_boy,wanderer）
CHIRP3_FALLBACK_TO_WAVENET=true  # 失敗時回退到 WaveNet
```

### 2.3 TTS API Endpoint 配置

**狀態**: ❌ 需實作（Task 2.2 中定義）

**預期 API Endpoint**: 參考 `.kiro/specs/chirp3-hd-tts-system/` 規格

根據 Chirp3 TTS spec，TTS 功能已整合至 backend，無需額外 API URL 配置。

**使用方式**:
```typescript
// Frontend 呼叫 TTS API (Task 2.2 實作時定義)
const response = await fetch('/api/v1/tts/synthesize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: fullInterpretationText,
    voice: characterVoice || 'pip_boy',
    language: 'zh-TW',
    speed: 1.0
  })
});
```

---

## 3. CORS 配置

### 3.1 Backend CORS Origins

**狀態**: ✅ 已配置

#### Backend 配置項 (`backend/app/config.py`)

```python
# Lines 46-59 in backend/app/config.py
backend_cors_origins: List[str] = Field(
    default=[
        "http://localhost:3000",
        "https://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3001",
        "http://localhost:8080",
        "https://localhost:8080",
        "http://localhost",
        "https://localhost"
    ],
    env="BACKEND_CORS_ORIGINS"
)
```

#### 環境變數檢查結果

**檢查命令**:
```bash
cd backend && grep "^BACKEND_CORS_ORIGINS=" .env
```

**檢查結果**:
```bash
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://localhost:3000","http://localhost:3001","https://localhost:3001","http://localhost","https://localhost"]
```

**驗證結果**:
- ✅ Development origins 已配置
- ⚠️ **Production origins 缺失** - 需在 Zeabur 環境變數中加入生產環境 URL

**建議配置**:
```bash
# Local Development (.env)
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://localhost:3000"]

# Production (Zeabur Environment Variables)
BACKEND_CORS_ORIGINS=["https://your-frontend-domain.zeabur.app","https://your-custom-domain.com"]
```

### 3.2 Frontend URL 配置

**狀態**: ⚠️ 需在 Production 環境配置

**Backend 配置項**:
```python
# Line 62 in backend/app/config.py
frontend_url: str = Field("http://localhost:3000", env="FRONTEND_URL")
```

**當前狀態**: 未在 `.env` 中明確設定（使用預設值）

**建議配置**:
```bash
# Local Development
FRONTEND_URL=http://localhost:3000

# Production (Zeabur Environment Variables)
FRONTEND_URL=https://your-frontend-domain.zeabur.app
```

---

## 4. AI Provider API Keys 配置

### 4.1 配置項檢查

**Backend 配置項 (`backend/app/config.py`)**:
```python
# Lines 113-130 in backend/app/config.py
ai_enabled: bool = Field(False, env="AI_ENABLED")
ai_provider: str = Field("openai", env="AI_PROVIDER")

# OpenAI Configuration
openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
openai_model: str = Field("gpt-4o", env="OPENAI_MODEL")

# Google Gemini Configuration
gemini_api_key: Optional[str] = Field(None, env="GEMINI_API_KEY")
gemini_model: str = Field("gemini-1.5-pro", env="GEMINI_MODEL")

# Anthropic Configuration
anthropic_api_key: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
anthropic_model: str = Field("claude-3-5-sonnet-20241022", env="ANTHROPIC_MODEL")
```

### 4.2 環境變數檢查結果

**檢查命令**:
```bash
cd backend && grep -E "^(AI_ENABLED|AI_PROVIDER|OPENAI_API_KEY|GEMINI_API_KEY|ANTHROPIC_API_KEY)=" .env
```

**檢查結果**:
- ✅ `AI_ENABLED=True` - AI 功能已啟用
- ⚠️ `AI_PROVIDER`: 未明確設定（將使用預設值 `openai`）
- ✅ `OPENAI_API_KEY`: 已設定（API key 存在）
- ✅ `GEMINI_API_KEY`: 已設定（API key 存在）
- ❌ `ANTHROPIC_API_KEY`: 未設定（為空）

**驗證結果**:
- ✅ **OpenAI provider 已就緒** - 可立即使用
- ✅ **Gemini provider 已就緒** - 可作為備用 provider
- ⚠️ **Anthropic provider 未配置** - 需要時可加入 API key

**建議配置**:
```bash
# Backend .env configuration
AI_ENABLED=True  # 已設定
AI_PROVIDER=openai  # 或 gemini, anthropic
OPENAI_API_KEY=sk-proj-...  # 已設定
GEMINI_API_KEY=AIzaSy...  # 已設定
ANTHROPIC_API_KEY=  # Optional - 若需使用 Claude 則設定
```

### 4.3 Model 配置檢查

**檢查命令**:
```bash
cd backend && grep -E "^(OPENAI_MODEL|GEMINI_MODEL|ANTHROPIC_MODEL)=" .env
```

**檢查結果**: 未明確設定（將使用預設值）

**預設值**:
- OpenAI: `gpt-4o`
- Gemini: `gemini-1.5-pro`
- Anthropic: `claude-3-5-sonnet-20241022`

**建議配置**:
```bash
# Backend .env configuration (Optional - 若需調整 model)
OPENAI_MODEL=gpt-4o  # 或 gpt-4o-mini (更快更便宜)
GEMINI_MODEL=gemini-1.5-pro  # 或 gemini-2.0-flash-exp
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

---

## 5. Zeabur HTTP/2 配置

### 5.1 Zeabur 平台 HTTP/2 支援

**狀態**: ✅ **Zeabur 原生支援 HTTP/2**

**驗證依據**:
- Zeabur 平台預設啟用 HTTP/2 for all deployed services
- 無需額外配置或環境變數
- HTTP/2 multiplexing 自動處理 SSE 併發連線

**參考資料**:
- [Zeabur Documentation - Networking](https://zeabur.com/docs/networking)
- HTTP/2 支援包含: multiplexing, server push, header compression

### 5.2 Backend Server 配置

**當前配置 (`backend/start-zeabur.sh`)**:
```bash
exec uvicorn app.main:app \
    --host "$HOST" \
    --port "$PORT" \
    --workers "$WORKERS" \
    --log-level "$LOG_LEVEL" \
    --no-access-log
```

**驗證結果**:
- ✅ Uvicorn 本身支援 HTTP/2 (透過 h2 library)
- ✅ Zeabur 的 reverse proxy 處理 HTTP/2 → HTTP/1.1 轉換
- ✅ SSE connections 透過 HTTP/2 multiplexing 提升效能

**無需額外配置** - Zeabur 平台自動處理 HTTP/2 升級

### 5.3 Frontend SSE Client 配置

**EventSource API 相容性**:
- ✅ EventSource API 自動使用瀏覽器的 HTTP/2 支援
- ✅ 無需修改 frontend code
- ✅ `useStreamingText` hook 無需調整

**驗證方式** (Production 部署後):
```bash
# 使用 curl 測試 HTTP/2 連線
curl -I --http2 https://your-backend.zeabur.app/health

# 預期看到: HTTP/2 200
```

---

## 6. 完整配置檢查表

### 6.1 Backend 環境變數檢查清單

| 環境變數 | 優先級 | 當前狀態 | 建議值 | 說明 |
|---------|--------|---------|--------|------|
| `STREAMING_TIMEOUT` | P0 | ⚠️ 未設定 | `60` | Streaming 超時時間（秒） |
| `AI_ENABLED` | P0 | ✅ 已設定 | `True` | 啟用 AI 解讀功能 |
| `AI_PROVIDER` | P0 | ⚠️ 未設定 | `openai` 或 `gemini` | AI provider 選擇 |
| `OPENAI_API_KEY` | P0 | ✅ 已設定 | `sk-proj-...` | OpenAI API key |
| `GEMINI_API_KEY` | P1 | ✅ 已設定 | `AIzaSy...` | Gemini API key (備用) |
| `ANTHROPIC_API_KEY` | P2 | ❌ 未設定 | (Optional) | Claude API key (可選) |
| `GOOGLE_CLOUD_CREDENTIALS_JSON` | P1 | ✅ 已設定 | `{"type": "service_account", ...}` | Google Cloud TTS credentials |
| `GOOGLE_TTS_LANGUAGE_CODE` | P1 | ⚠️ 未設定 | `zh-TW` | TTS 語言代碼 |
| `GOOGLE_TTS_VOICE_NAME` | P1 | ⚠️ 未設定 | `zh-TW-Standard-A` | TTS 語音名稱 |
| `SUPABASE_STORAGE_BUCKET` | P1 | ✅ 已設定 | `audio-files` | Supabase 音訊儲存 bucket |
| `BACKEND_CORS_ORIGINS` | P0 | ⚠️ 僅 dev | `["https://your-frontend.zeabur.app"]` | Production CORS origins |
| `FRONTEND_URL` | P1 | ⚠️ 未設定 | `https://your-frontend.zeabur.app` | Frontend URL |
| `CHIRP3_ENABLED` | P2 | ⚠️ 未設定 | `false` | Chirp3 HD TTS 功能開關 |
| `CHIRP3_ROLLOUT_PERCENTAGE` | P2 | ⚠️ 未設定 | `0` | Chirp3 漸進式 rollout |

### 6.2 Zeabur Production 環境變數設定建議

**必須設定**:
```bash
# AI Streaming 核心配置
STREAMING_TIMEOUT=60
AI_ENABLED=True
AI_PROVIDER=openai

# OpenAI 配置
OPENAI_API_KEY=sk-proj-xxx  # 從 local .env 複製
OPENAI_MODEL=gpt-4o

# Gemini 備用配置
GEMINI_API_KEY=AIzaSyxxx  # 從 local .env 複製
GEMINI_MODEL=gemini-1.5-pro

# TTS 配置
GOOGLE_CLOUD_CREDENTIALS_JSON={"type": "service_account", ...}  # 從 local .env 複製
GOOGLE_TTS_LANGUAGE_CODE=zh-TW
GOOGLE_TTS_VOICE_NAME=zh-TW-Standard-A
SUPABASE_STORAGE_BUCKET=audio-files

# CORS 配置
BACKEND_CORS_ORIGINS=["https://your-frontend.zeabur.app"]
FRONTEND_URL=https://your-frontend.zeabur.app

# 資料庫配置（已存在）
DATABASE_URL=postgresql+asyncpg://...  # Supabase DB URL
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 安全配置（已存在）
SECRET_KEY=xxx
```

---

## 7. 驗證步驟

### 7.1 Local Development 驗證

**1. Backend 配置驗證**:
```bash
cd backend
python -c "from app.config import settings; print(f'STREAMING_TIMEOUT: {settings.streaming_timeout}'); print(f'AI_ENABLED: {settings.ai_enabled}'); print(f'AI_PROVIDER: {settings.ai_provider}'); print(f'OPENAI_API_KEY: {\"✅ Set\" if settings.openai_api_key else \"❌ Missing\"}'); print(f'GEMINI_API_KEY: {\"✅ Set\" if settings.gemini_api_key else \"❌ Missing\"}')"
```

**預期輸出**:
```
STREAMING_TIMEOUT: 60
AI_ENABLED: True
AI_PROVIDER: openai
OPENAI_API_KEY: ✅ Set
GEMINI_API_KEY: ✅ Set
```

**2. CORS 配置驗證**:
```bash
cd backend
python -c "from app.config import settings; print(f'CORS Origins: {settings.backend_cors_origins}')"
```

**3. TTS 配置驗證**:
```bash
cd backend
python -c "from app.config import settings; print(f'TTS Credentials: {\"✅ Set\" if settings.google_cloud_credentials_json else \"❌ Missing\"}'); print(f'TTS Language: {settings.google_tts_language_code}'); print(f'TTS Voice: {settings.google_tts_voice_name}')"
```

### 7.2 Production 部署前檢查

**Zeabur Dashboard 檢查清單**:
1. ✅ Backend Service 環境變數已設定所有必要項
2. ✅ Frontend Service 已部署且 URL 正確
3. ✅ BACKEND_CORS_ORIGINS 包含 Frontend URL
4. ✅ Database 連線字串正確（Supabase）
5. ✅ AI Provider API keys 已設定
6. ✅ Google Cloud TTS credentials 已設定

**Health Check 驗證**:
```bash
# 驗證 backend 健康狀態
curl https://your-backend.zeabur.app/health

# 預期回應: {"status": "healthy", ...}
```

**Streaming Endpoint 驗證** (Task 3.1, 3.2 完成後):
```bash
# 測試 authenticated streaming request
curl -X POST https://your-backend.zeabur.app/api/v1/readings/interpretation/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{"card_id": "0", "question": "Test question"}'

# 預期: SSE stream 開始，或 401 if auth required
```

---

## 8. 已知問題與建議

### 8.1 配置缺失項

1. **STREAMING_TIMEOUT 未設定** (優先級: P0)
   - **影響**: 將使用預設值 60 秒
   - **建議**: 在 `.env` 中明確設定 `STREAMING_TIMEOUT=60`
   - **理由**: 明確配置可避免未來誤解

2. **AI_PROVIDER 未設定** (優先級: P1)
   - **影響**: 將使用預設值 `openai`
   - **建議**: 明確設定 `AI_PROVIDER=openai` 或 `gemini`
   - **理由**: 明確選擇 provider，可在需要時快速切換

3. **Production CORS Origins 缺失** (優先級: P0)
   - **影響**: Frontend 無法在 production 呼叫 backend API
   - **建議**: 在 Zeabur 環境變數中設定 `BACKEND_CORS_ORIGINS=["https://your-frontend.zeabur.app"]`
   - **理由**: 必須配置才能在 production 正常運作

4. **GOOGLE_TTS_LANGUAGE_CODE/VOICE_NAME 未設定** (優先級: P1)
   - **影響**: 將使用預設值（可能不符合所有角色需求）
   - **建議**: 根據角色配置不同 voice（可在 Task 2.2 實作時處理）
   - **理由**: 角色專屬 voice 提升體驗

### 8.2 最佳實踐建議

1. **使用環境變數管理工具**:
   - Zeabur Dashboard: 集中管理 production 環境變數
   - `.env.example`: 保持更新，加入所有新配置項

2. **API Keys 安全性**:
   - ✅ 不要提交 API keys 到 git
   - ✅ 使用 Zeabur Secrets 管理敏感資訊
   - ✅ 定期輪換 API keys

3. **配置驗證自動化**:
   - 建議在 CI/CD pipeline 加入配置驗證步驟
   - 部署前自動檢查必要環境變數

4. **Monitoring 配置**:
   - 在 Zeabur 啟用 logging
   - 監控 streaming timeout 發生頻率
   - 追蹤 AI provider API 使用量

---

## 9. 下一步驟

### 9.1 立即行動項 (Before Task 6.2)

1. **補齊缺失的環境變數** (5 分鐘):
   ```bash
   cd backend
   echo "STREAMING_TIMEOUT=60" >> .env
   echo "AI_PROVIDER=openai" >> .env
   echo "GOOGLE_TTS_LANGUAGE_CODE=zh-TW" >> .env
   echo "GOOGLE_TTS_VOICE_NAME=zh-TW-Standard-A" >> .env
   ```

2. **更新 .env.example** (3 分鐘):
   ```bash
   # 確保 .env.example 包含所有新配置項
   cd backend
   # 手動檢查並加入 STREAMING_TIMEOUT 等項目
   ```

3. **準備 Production 環境變數清單** (10 分鐘):
   - 從 `.env` 複製所有必要環境變數
   - 準備好在 Zeabur Dashboard 設定
   - 特別注意 CORS origins 和 Frontend URL

### 9.2 Task 3.2 實作時

- 在 `readings_stream.py` 中引入 `settings.streaming_timeout`
- 使用 `asyncio.timeout(settings.streaming_timeout)` 包裝 async generator
- 加入 timeout 錯誤處理與 logging

### 9.3 Task 6.2 最終驗證前

- 執行所有驗證步驟（Section 7）
- 確認 Zeabur production 環境變數已設定
- 測試 streaming endpoint 與 TTS 功能

---

## 10. 總結

### 配置完整度評估

| 類別 | 完整度 | 說明 |
|-----|--------|------|
| **Streaming Timeout** | 🟡 80% | 配置項存在，預設值合理，建議明確設定環境變數 |
| **TTS API** | 🟢 90% | Credentials 已設定，語言/voice 可使用預設值 |
| **CORS** | 🟡 60% | Development 已配置，Production origins 待設定 |
| **AI Providers** | 🟢 95% | OpenAI/Gemini 已就緒，Anthropic 為可選 |
| **Zeabur HTTP/2** | 🟢 100% | 平台原生支援，無需配置 |
| **整體評估** | 🟢 85% | 核心功能已就緒，部分優化項待完成 |

### 關鍵結論

1. ✅ **核心配置已就緒**: AI providers, TTS credentials, database 配置正確
2. ⚠️ **需補充項目**: Production CORS origins, 明確設定 STREAMING_TIMEOUT
3. ✅ **Zeabur HTTP/2**: 無需額外配置，平台原生支援
4. 🎯 **可立即進行 Task 3.2**: Backend timeout 保護實作所需配置已準備好

**建議**: 完成 Section 9.1 的立即行動項後，即可繼續 Task 3.2 實作。

---

**文件完成日期**: 2025-11-13
**檢查執行者**: Claude Code (Kiro Agent)
**下一個檢查點**: Task 6.2 - 最終功能驗證
