# 後端記憶體優化總結 ⚡

## 已完成的優化（Quick Wins）

### ✅ 1. 修正 Top-Level Imports（節省 ~80MB）

**問題**: AI Provider SDKs 在啟動時就被載入到記憶體

**修改檔案**:
- `app/providers/__init__.py` - 移除直接 import providers
- `app/services/__init__.py` - 移除直接 import services

**效果**: 
- Google Generative AI SDK (~50MB) 只在使用時載入
- OpenAI SDK (~30MB) 只在使用時載入
- Anthropic SDK (~30MB) 不會被載入（未使用）

### ✅ 2. 移除未使用的 TTS 套件（節省 ~20-30MB）

**修改檔案**: `pyproject.toml`

```toml
# ❌ Removed
# "edge-tts>=7.2.3",  # Not used
# "gtts>=2.5.4",       # Not used

# ✅ Kept
"google-cloud-texttospeech>=2.33.0",  # Only used provider
```

**效果**: 減少不必要的依賴

### ✅ 3. 條件式啟動功能（節省 ~10-15MB）

**修改檔案**: 
- `app/config.py` - 新增功能開關
- `app/main.py` - 使用條件式載入

**新增環境變數**:
```bash
# 關閉 Bingo 冷啟動檢查（節省 ~10MB）
ENABLE_BINGO_COLD_START_CHECK=false

# 關閉排程器（如不需要 Bingo 功能）
ENABLE_SCHEDULER=false

# 減少資料庫連線池
DATABASE_POOL_SIZE=3  # 從 5 減少到 3
DATABASE_MAX_OVERFLOW=5
```

### ✅ 4. Database Connection Pool 優化（已完成）

**config.py 設定**:
```python
database_pool_size: int = 3  # 進一步優化
database_max_overflow: int = 5
```

---

## 記憶體使用預期

| 狀態 | 記憶體使用 | 節省 |
|-----|----------|------|
| **優化前** | ~400MB | - |
| **優化後（預估）** | ~280-320MB | ~80-120MB (-20-30%) |

---

## 如何使用優化配置

### 1. 更新環境變數

在 `.env` 檔案中加入：

```bash
# 記憶體優化配置
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=5
ENABLE_BINGO_COLD_START_CHECK=false
ENABLE_SCHEDULER=true  # 如果需要 Bingo 功能，設為 true
```

### 2. 重新安裝依賴（移除未使用套件）

```bash
cd backend
uv sync  # 根據新的 pyproject.toml 同步依賴
```

### 3. 重啟後端服務

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 檢查記憶體使用

**方法 1: 使用檢查腳本**
```bash
python check_memory.py
```

**方法 2: 使用 API endpoint**
```bash
curl http://localhost:8000/api/v1/monitoring/metrics/memory
```

**方法 3: 手動檢查**
```bash
# macOS
ps aux | grep python | grep -v grep

# 詳細資訊
top -pid $(pgrep -f "uvicorn app.main")
```

---

## 監控與追蹤

### 即時監控 Endpoint

```bash
# 取得記憶體使用情況
GET /api/v1/monitoring/metrics/memory

# 回應範例
{
  "status": "success",
  "timestamp": "2025-11-05T14:30:00Z",
  "memory": {
    "rss_mb": 285.43,      // 實際物理記憶體
    "vms_mb": 512.18,      // 虛擬記憶體
    "percent": 3.52
  },
  "cpu": {
    "percent": 2.1
  },
  "process": {
    "num_threads": 8,
    "num_connections": 5
  }
}
```

### 啟動時日誌

優化後你會看到這些日誌訊息：

```
🏭 Starting Wasteland Tarot API...
💾 Database initialized
⏰ Scheduler disabled (ENABLE_SCHEDULER=false)
🔍 Bingo cold start check disabled (ENABLE_BINGO_COLD_START_CHECK=false)
```

---

## 進階優化選項

如果記憶體仍然不足，可以考慮：

### Option 1: 完全關閉排程器

```bash
ENABLE_SCHEDULER=false
```

**適用情況**: 不需要 Bingo 功能

### Option 2: 只在生產環境啟用冷啟動檢查

```bash
# 開發環境
ENABLE_BINGO_COLD_START_CHECK=false

# 生產環境
ENABLE_BINGO_COLD_START_CHECK=true
```

### Option 3: 減少 Uvicorn Workers（如使用多 worker）

```bash
# 單 worker（開發環境）
uv run uvicorn app.main:app --workers 1

# 多 worker + preload（生產環境，共享記憶體）
gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 2 \
  --preload  # 共享載入的模組
```

---

## 測試結果

請執行以下命令並回報結果：

```bash
# 1. 啟動後端
cd backend
uv run uvicorn app.main:app --reload

# 2. 等待完全啟動（看到 "Application startup complete"）

# 3. 檢查記憶體
python check_memory.py

# 4. 測試 API
curl http://localhost:8000/api/v1/monitoring/metrics/memory | jq
```

**預期結果**: RSS 記憶體使用 < 320MB

---

## 故障排除

### 問題: 啟動時出現 Import Error

**原因**: 某些 endpoint 可能直接從 `app.services` import

**解決**: 修改為直接 import 特定 service
```python
# ❌ 錯誤
from app.services import MusicService

# ✅ 正確
from app.services.music_service import MusicService
```

### 問題: Scheduler 不工作

**檢查**: 確認環境變數
```bash
ENABLE_SCHEDULER=true  # 必須為 true
```

### 問題: 記憶體沒有明顯下降

**可能原因**:
1. Python 解釋器本身佔用 ~50MB
2. FastAPI + Uvicorn 佔用 ~50MB
3. 需要重啟服務讓優化生效

**驗證**: 檢查是否有舊的 Python 進程還在運行
```bash
ps aux | grep python
```

---

## 相關文件

- 📋 **完整優化計畫**: `MEMORY_OPTIMIZATION_PLAN.md`
- 🔧 **檢查腳本**: `check_memory.py`
- 📝 **環境變數範例**: `.env.example`

---

## 檢查清單

優化完成後，確認以下項目：

- [ ] 更新 `.env` 檔案加入新的環境變數
- [ ] 執行 `uv sync` 更新依賴
- [ ] 重啟後端服務
- [ ] 執行 `python check_memory.py` 檢查記憶體
- [ ] 訪問 `/api/v1/monitoring/metrics/memory` endpoint
- [ ] 確認記憶體使用 < 320MB

---

**優化版本**: v1.0  
**最後更新**: 2025-11-05  
**預期節省**: 80-120MB (20-30%)
