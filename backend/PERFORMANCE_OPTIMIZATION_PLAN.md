# Backend 效能優化計畫

## 📊 當前狀況
- **記憶體使用**: 750-770MB (穩定運行)
- **部署平台**: Zeabur
- **Python 版本**: 3.11
- **主要框架**: FastAPI + Uvicorn
- **工作進程數**: 4 workers

---

## 🎯 優化目標
1. 將記憶體使用降低至 **400-500MB**（節省 30-40%）
2. 提升 API 回應時間 **20-30%**
3. 優化啟動時間
4. 減少資料庫連接池開銷
5. 優化 AI Provider 記憶體佔用

---

## 🔍 記憶體分析與優化策略

### 1. **Worker 進程優化** (最大影響)
**當前問題**: 4 workers × ~190MB = 760MB

#### 方案 A: 減少 Worker 數量 (推薦)
```dockerfile
# 修改 Dockerfile
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \          # 從 4 減至 2
     "--log-level", "info"]
```
**預期節省**: ~380MB → 目標 380-400MB

#### 方案 B: 使用 Gunicorn + Uvicorn Workers
```bash
# 更精細的工作進程管理
gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 2 \
  --max-requests 1000 \           # 定期重啟 worker 釋放記憶體
  --max-requests-jitter 100 \
  --timeout 30
```

### 2. **依賴套件優化**
**當前問題**: 過多重量級依賴

#### 移除未使用的依賴
```toml
# pyproject.toml 檢查並移除
# 考慮移除或替換:
- redis  # 如果沒使用 Redis caching
- prometheus-client  # 如果沒啟用監控
- edge-tts, gtts  # 如果只用一種 TTS
```

#### 使用輕量級替代方案
```toml
# 替換方案
psycopg[binary] → psycopg[binary,pool]  # 使用連接池
anthropic, openai, google-generativeai → 按需載入
```

### 3. **資料庫連接池優化**

#### 當前配置檢查
```python
# app/db/session.py 或 database.py
# 優化連接池設定
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,              # 從 10 降至 5
    max_overflow=5,           # 從 10 降至 5
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False                # 確保生產環境關閉 SQL logging
)
```

### 4. **AI Provider 優化**

#### 延遲載入 (Lazy Loading)
```python
# app/providers/factory.py
class AIProviderFactory:
    _providers = {}
    
    @classmethod
    def get_provider(cls, provider_type: str):
        # 只在需要時才載入
        if provider_type not in cls._providers:
            if provider_type == "openai":
                from app.providers.openai_provider import OpenAIProvider
                cls._providers[provider_type] = OpenAIProvider()
        return cls._providers[provider_type]
```

#### 共享 HTTP 客戶端
```python
# 避免每個 provider 都創建 httpx.AsyncClient
import httpx

class SharedHTTPClient:
    _client: httpx.AsyncClient | None = None
    
    @classmethod
    def get_client(cls) -> httpx.AsyncClient:
        if cls._client is None:
            cls._client = httpx.AsyncClient(
                timeout=30.0,
                limits=httpx.Limits(max_keepalive_connections=5)
            )
        return cls._client
```

### 5. **Logging 優化**

#### 減少日誌記憶體佔用
```python
# app/core/logging_config.py
def setup_logging(
    level: str = "INFO",
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 3,               # 減少備份數量
    enable_json: bool = True,
    enable_file: bool = False            # 生產環境考慮關閉文件日誌
):
    # 使用 stdout 而非文件，讓平台處理日誌收集
    pass
```

### 6. **Scheduler 優化**

#### APScheduler 輕量化配置
```python
# app/core/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore  # 使用記憶體儲存

jobstores = {
    'default': MemoryJobStore()
}
executors = {
    'default': {'type': 'threadpool', 'max_workers': 2}  # 限制執行緒數
}
```

### 7. **Response Caching**

#### 使用內建快取而非 Redis
```python
from functools import lru_cache
from datetime import datetime, timedelta

class SimpleCache:
    def __init__(self, ttl: int = 300):
        self._cache = {}
        self._ttl = ttl
    
    def get(self, key: str):
        if key in self._cache:
            value, timestamp = self._cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self._ttl):
                return value
            del self._cache[key]
        return None
    
    def set(self, key: str, value):
        self._cache[key] = (value, datetime.now())
```

---

## 📝 優化實施步驟

### Phase 1: 立即優化 (預計節省 200-300MB)
1. ✅ **減少 Uvicorn workers 至 2**
   ```bash
   # 測試命令
   uvicorn app.main:app --workers 2 --host 0.0.0.0 --port 8000
   ```

2. ✅ **優化資料庫連接池**
   - pool_size: 10 → 5
   - max_overflow: 10 → 5

3. ✅ **關閉生產環境檔案日誌**
   - enable_file=False
   - 只使用 stdout

### Phase 2: 依賴優化 (預計節省 50-100MB)
1. 🔄 **審查並移除未使用依賴**
   ```bash
   # 生成依賴使用報告
   pipdeptree -p wasteland-tarot-backend
   ```

2. 🔄 **AI Provider 延遲載入**
   - 實施 lazy loading pattern
   - 共享 HTTP 客戶端

### Phase 3: 進階優化 (預計節省 50-100MB)
1. 🔄 **實施應用層快取**
   - 卡牌資料快取 (很少變動)
   - 牌陣模板快取
   - 故事模板快取

2. 🔄 **優化 Scheduler**
   - 使用 MemoryJobStore
   - 減少執行緒池大小

3. 🔄 **Response 壓縮**
   ```python
   from fastapi.middleware.gzip import GZipMiddleware
   app.add_middleware(GZipMiddleware, minimum_size=1000)
   ```

### Phase 4: 監控與調整
1. 📊 **實施記憶體監控**
   ```python
   import psutil
   import os
   
   @app.get("/metrics/memory")
   async def memory_metrics():
       process = psutil.Process(os.getpid())
       return {
           "memory_mb": process.memory_info().rss / 1024 / 1024,
           "memory_percent": process.memory_percent()
       }
   ```

2. 📊 **效能基準測試**
   ```bash
   # 使用 locust 進行負載測試
   locust -f tests/performance/locustfile.py --host=http://localhost:8000
   ```

---

## 🛠️ 具體代碼修改

### 1. Dockerfile 優化
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim AS runtime

# ... 其他配置 ...

# 優化啟動命令
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--log-level", "warning", \
     "--access-log"]
```

### 2. 資料庫配置優化
```python
# app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    settings.database_url,
    echo=False,  # 關閉 SQL logging
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_timeout=30,
    connect_args={
        "server_settings": {
            "application_name": "wasteland-tarot",
            "jit": "off"  # 關閉 JIT 編譯以節省記憶體
        }
    }
)
```

### 3. AI Provider 工廠優化
```python
# app/providers/factory.py
from typing import Dict, Type
import httpx

class OptimizedAIProviderFactory:
    _providers: Dict[str, Any] = {}
    _http_client: httpx.AsyncClient | None = None
    
    @classmethod
    def get_http_client(cls) -> httpx.AsyncClient:
        if cls._http_client is None:
            cls._http_client = httpx.AsyncClient(
                timeout=30.0,
                limits=httpx.Limits(
                    max_keepalive_connections=5,
                    max_connections=10
                )
            )
        return cls._http_client
    
    @classmethod
    def get_provider(cls, provider_type: str):
        if provider_type not in cls._providers:
            # 延遲載入
            if provider_type == "openai":
                from app.providers.openai_provider import OpenAIProvider
                cls._providers[provider_type] = OpenAIProvider(
                    http_client=cls.get_http_client()
                )
            elif provider_type == "gemini":
                from app.providers.gemini_provider import GeminiProvider
                cls._providers[provider_type] = GeminiProvider(
                    http_client=cls.get_http_client()
                )
        return cls._providers[provider_type]
```

### 4. 應用層快取
```python
# app/core/cache.py
from typing import Any, Optional
from datetime import datetime, timedelta
import asyncio

class MemoryCache:
    def __init__(self):
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, key: str, ttl: int = 300) -> Optional[Any]:
        async with self._lock:
            if key in self._cache:
                value, timestamp = self._cache[key]
                if datetime.now() - timestamp < timedelta(seconds=ttl):
                    return value
                del self._cache[key]
            return None
    
    async def set(self, key: str, value: Any):
        async with self._lock:
            self._cache[key] = (value, datetime.now())
    
    async def clear(self):
        async with self._lock:
            self._cache.clear()

# 全局快取實例
app_cache = MemoryCache()
```

```python
# app/api/v1/endpoints/cards.py
from app.core.cache import app_cache

@router.get("/cards")
async def get_cards(db: AsyncSession = Depends(get_db)):
    # 嘗試從快取獲取
    cache_key = "all_cards"
    cached = await app_cache.get(cache_key, ttl=3600)  # 1小時
    
    if cached:
        return cached
    
    # 從資料庫查詢
    cards = await card_service.get_all_cards(db)
    await app_cache.set(cache_key, cards)
    
    return cards
```

---

## 📈 預期效果

| 優化項目 | 記憶體節省 | 效能提升 | 優先級 |
|---------|----------|---------|--------|
| Worker 數量 (4→2) | ~380MB | - | ⭐⭐⭐ |
| 資料庫連接池 | ~50MB | +10% | ⭐⭐⭐ |
| AI Provider 延遲載入 | ~100MB | +15% | ⭐⭐ |
| 日誌優化 | ~30MB | +5% | ⭐⭐ |
| 依賴清理 | ~50MB | - | ⭐⭐ |
| 應用快取 | ~20MB | +30% | ⭐⭐⭐ |
| **總計** | **~400MB** | **+25-35%** | - |

### 優化後預期
- **記憶體使用**: 350-400MB (從 750MB)
- **啟動時間**: <10 秒
- **API 平均回應時間**: <200ms
- **資料庫連接**: 穩定在 3-5 個活動連接

---

## 🔍 監控與驗證

### 記憶體監控端點
```python
# app/api/v1/endpoints/health.py
import psutil
import os

@router.get("/metrics")
async def get_metrics():
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    return {
        "memory": {
            "rss_mb": memory_info.rss / 1024 / 1024,
            "vms_mb": memory_info.vms / 1024 / 1024,
            "percent": process.memory_percent()
        },
        "cpu_percent": process.cpu_percent(interval=1),
        "connections": len(process.connections()),
        "num_threads": process.num_threads()
    }
```

### 負載測試腳本
```python
# tests/performance/test_memory.py
import pytest
import psutil
import os

@pytest.mark.performance
async def test_memory_under_load():
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024
    
    # 執行 1000 次請求
    for _ in range(1000):
        response = await client.get("/api/v1/cards")
        assert response.status_code == 200
    
    final_memory = process.memory_info().rss / 1024 / 1024
    memory_growth = final_memory - initial_memory
    
    # 確保記憶體增長小於 50MB
    assert memory_growth < 50, f"Memory growth too high: {memory_growth}MB"
```

---

## 📅 實施時間表

### Week 1: 快速優化
- [ ] Day 1-2: Worker 數量調整 + 測試
- [ ] Day 3-4: 資料庫連接池優化
- [ ] Day 5: 部署到 staging 環境驗證

### Week 2: 深度優化
- [ ] Day 1-3: AI Provider 重構
- [ ] Day 4-5: 實施應用快取
- [ ] Day 6-7: 效能測試與調整

### Week 3: 監控與穩定
- [ ] 實施監控端點
- [ ] 負載測試
- [ ] 部署到生產環境
- [ ] 持續監控一週

---

## 🚨 風險與注意事項

1. **Worker 數量減少**
   - ⚠️ 可能影響並發處理能力
   - ✅ 緩解: 實施快取，優化回應時間
   - ✅ 監控: QPS 與回應時間

2. **延遲載入**
   - ⚠️ 首次請求可能較慢
   - ✅ 緩解: 預熱關鍵 providers
   - ✅ 監控: 冷啟動時間

3. **記憶體快取**
   - ⚠️ 可能造成資料不一致
   - ✅ 緩解: 合理設定 TTL
   - ✅ 監控: 快取命中率

---

## 📚 參考資源

- [FastAPI Performance Tips](https://fastapi.tiangolo.com/deployment/concepts/)
- [Uvicorn Deployment Guide](https://www.uvicorn.org/deployment/)
- [SQLAlchemy Connection Pooling](https://docs.sqlalchemy.org/en/20/core/pooling.html)
- [Python Memory Profiling](https://pypi.org/project/memory-profiler/)

---

## ✅ 檢查清單

### 優化前
- [ ] 記錄當前記憶體使用基準
- [ ] 執行效能測試並記錄結果
- [ ] 備份當前配置

### 優化中
- [ ] 階段性實施，每次測試
- [ ] 保持監控數據
- [ ] 記錄所有變更

### 優化後
- [ ] 驗證記憶體降至目標範圍
- [ ] 確認 API 效能未降低
- [ ] 更新文檔
- [ ] 團隊培訓

---

**最後更新**: 2025-11-05
**負責人**: Backend Team
**狀態**: 📋 Planning
