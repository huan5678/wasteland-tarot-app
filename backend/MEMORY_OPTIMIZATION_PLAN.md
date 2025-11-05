# 後端記憶體優化方案

## 當前問題分析

### 記憶體消耗來源（估計）

1. **大量模組載入** (~150MB)
   - 30+ endpoint 檔案在啟動時全部載入
   - 60+ service 模組全部初始化
   - AI provider libraries (anthropic, openai, google-generativeai)

2. **重量級依賴** (~100MB)
   - anthropic SDK
   - openai SDK  
   - google-generativeai SDK
   - google-cloud-texttospeech
   - SQLAlchemy ORM + asyncpg + psycopg

3. **啟動時初始化** (~100MB)
   - APScheduler 調度器
   - Database connection pool
   - Logger 系統
   - 每日號碼檢查（冷啟動修正）

4. **Python 基礎開銷** (~50MB)
   - Python 解釋器
   - FastAPI + Uvicorn
   - 基本依賴

**總計: ~400MB**

---

## 優化策略

### Phase 1: 立即生效的優化（記憶體節省 ~80-120MB）

#### 1.1 延遲載入 AI Providers ✅ 
**已實作但可強化**

```python
# 當前狀況: factory.py 已經實作 lazy loading
# 問題: services/ai_service.py 可能在啟動時就載入所有 AI SDK

# 優化方向: 確保沒有模組在 top-level import AI SDKs
```

**檢查點:**
- [ ] `app/providers/__init__.py` 不應該直接 import providers
- [ ] `app/services/__init__.py` 不應該直接 import AI services
- [ ] 只在實際使用時才 import

#### 1.2 條件式載入不常用的服務
**目標記憶體節省: 30-50MB**

```python
# app/api/v1/api.py
# 不要在啟動時載入所有 endpoint，改用條件式路由

from fastapi import APIRouter
from app.config import settings

api_router = APIRouter()

# 核心功能 - 總是載入
from app.api.v1.endpoints import auth, cards, readings, spreads
api_router.include_router(auth.router, tags=["🔐 認證"])
api_router.include_router(cards.router, prefix="/cards", tags=["🃏 Cards"])
api_router.include_router(readings.router, prefix="/readings", tags=["📖 Readings"])
api_router.include_router(spreads.router, prefix="/spreads", tags=["🗂️ Spreads"])

# 功能性模組 - 按需載入
if settings.enable_social_features:  # 新增環境變數控制
    from app.api.v1.endpoints import social
    api_router.include_router(social.router, prefix="/social", tags=["👥 Social"])

if settings.enable_music_system:
    from app.api.v1.endpoints import music, playlists
    api_router.include_router(music.router, prefix="/music", tags=["🎵 Music"])
    api_router.include_router(playlists.router, prefix="/playlists", tags=["📻 Playlists"])

if settings.enable_gamification:
    from app.api.v1.endpoints import bingo, achievements, tasks, levels, quests
    api_router.include_router(bingo.router, prefix="/bingo", tags=["🎲 Bingo"])
    api_router.include_router(achievements.router, prefix="/achievements", tags=["🏆 Achievements"])
```

#### 1.3 移除不必要的依賴
**目標記憶體節省: 20-30MB**

```toml
# pyproject.toml - 移除未使用的套件

# ❌ 如果不需要 edge-tts，移除它
# "edge-tts>=7.2.3",

# ❌ 如果不需要 gTTS，移除它  
# "gtts>=2.5.4",

# ❌ 評估是否真的需要同時有 psycopg2-binary 和 psycopg[binary]
# "psycopg2-binary>=2.9.10",  # 可能可以移除

# ✅ 只保留必要的 AI provider
# 如果只用 Gemini，可以考慮移除 anthropic 和 openai
```

#### 1.4 優化 Database Connection Pool
**目標記憶體節省: 10-20MB**

```python
# app/db/session.py or app/core/database_pool.py

# 減少 connection pool 大小（開發/小規模部署）
if settings.environment == "production":
    pool_size = 10
    max_overflow = 20
else:
    pool_size = 2  # 從 5 減少到 2
    max_overflow = 5  # 從 10 減少到 5

engine = create_async_engine(
    settings.database_url,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_pre_ping=True,
    pool_recycle=3600,
)
```

#### 1.5 禁用不必要的啟動時檢查
**目標記憶體節省: 5-10MB**

```python
# app/main.py - lifespan 函數

# 移除或條件化冷啟動檢查
if settings.enable_bingo_cold_start_check:  # 新增環境變數
    try:
        from app.services.daily_number_generator_service import DailyNumberGeneratorService
        # ... 檢查邏輯
    except Exception as e:
        logger.error(f"Cold start check failed: {e}")
```

---

### Phase 2: 架構級優化（記憶體節省 ~100-150MB）

#### 2.1 模組分離策略
**將巨型後端拆分成微服務或可選模組**

```
backend/
├── core/           # 核心 API (auth, cards, readings, spreads) - 必須
├── gamification/   # 遊戲化功能 (bingo, achievements, tasks) - 可選
├── social/         # 社交功能 (social, share) - 可選
├── media/          # 音樂音效 (music, playlists, audio) - 可選
└── analytics/      # 分析監控 (analytics, monitoring) - 可選
```

#### 2.2 AI Provider 外部化
**使用輕量級 HTTP client 呼叫獨立的 AI 服務**

```python
# 不直接載入 SDK，而是透過 HTTP 呼叫
async def call_gemini_api(prompt: str) -> MusicParameters:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            headers={"x-goog-api-key": settings.gemini_api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]}
        )
        # Parse response...
```

**記憶體節省:** 不載入整個 google-generativeai SDK (~50MB)

#### 2.3 使用 Gunicorn + Preload
**多 worker 但共享 code**

```bash
# 使用 preload_app 讓所有 worker 共享載入的模組
gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 2 \
  --preload  # 關鍵：共享記憶體
```

---

### Phase 3: 執行時優化

#### 3.1 啟用 Python Memory Pool
```bash
# 設定環境變數
export PYTHONMALLOC=malloc
export MALLOC_TRIM_THRESHOLD_=100000
```

#### 3.2 定期記憶體清理
```python
import gc

@app.on_event("startup")
async def configure_gc():
    # 更激進的 GC 策略
    gc.set_threshold(400, 5, 5)  # 預設是 (700, 10, 10)
```

---

## 實作優先順序

### 🚀 Quick Wins (1小時內完成，節省 ~80MB)

1. ✅ **檢查並修正 top-level imports**
   - 檢查 `app/providers/__init__.py`
   - 檢查 `app/services/__init__.py`
   - 確保 AI SDKs 只在使用時載入

2. ✅ **減少 Database Pool**
   - 修改 pool_size 從 10 → 3
   - 修改 max_overflow 從 20 → 5

3. ✅ **條件化冷啟動檢查**
   - 加入環境變數 `ENABLE_BINGO_COLD_START_CHECK=false`

4. ✅ **移除未使用的 TTS providers**
   - 如果只用 Google TTS，移除 edge-tts 和 gtts

### 📊 Medium Impact (半天完成，節省 ~100MB)

5. **條件式載入非核心 endpoints**
   - 實作 feature flags
   - 按需載入 social, music, gamification 模組

6. **移除重複依賴**
   - 評估 psycopg vs psycopg2-binary
   - 統一 AI provider 選擇

### 🏗️ Long Term (需要架構調整，節省 ~150MB+)

7. **模組分離**
   - 將功能分離成可選套件
   - 使用 Docker multi-stage build

8. **AI Provider 輕量化**
   - 使用 HTTP client 取代完整 SDK

---

## 測量方法

```python
# 在 app/main.py 加入記憶體監控
import psutil
import os

@app.on_event("startup")
async def log_memory_usage():
    process = psutil.Process(os.getpid())
    memory_mb = process.memory_info().rss / 1024 / 1024
    logger.info(f"🧠 Memory Usage: {memory_mb:.2f} MB")

@app.get("/health/memory")
async def get_memory_info():
    process = psutil.Process(os.getpid())
    return {
        "rss_mb": process.memory_info().rss / 1024 / 1024,
        "vms_mb": process.memory_info().vms / 1024 / 1024,
        "percent": process.memory_percent(),
    }
```

---

## 預期成果

| 優化階段 | 記憶體使用 | 節省幅度 |
|---------|-----------|---------|
| 當前 | ~400MB | - |
| Phase 1 Quick Wins | ~320MB | -80MB (-20%) |
| Phase 1 Complete | ~280MB | -120MB (-30%) |
| Phase 2 Complete | ~180MB | -220MB (-55%) |
| Phase 3 Complete | ~150MB | -250MB (-62%) |

---

## 立即行動清單

今天就可以做的 5 件事：

1. [ ] 檢查 `app/providers/__init__.py` 和 `app/services/__init__.py` 的 imports
2. [ ] 減少 database connection pool 配置
3. [ ] 添加環境變數 `ENABLE_BINGO_COLD_START_CHECK=false`
4. [ ] 評估並移除未使用的 TTS 套件 (edge-tts, gtts)
5. [ ] 添加 `/health/memory` endpoint 來追蹤優化效果
