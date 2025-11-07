# Zeabur 極限記憶體優化方案 🚀

## 當前狀況

**優化前**: 420 MB  
**目前**: 220 MB (-48%) ✅  
**目標**: 150-180 MB (額外 -20-30%)

---

## 可行的進一步優化

### 🎯 方案 1: 使用 Alpine Linux Base（節省 ~30-40MB）

**目標**: 220MB → ~180-190MB

Alpine 是超輕量的 Linux 發行版（5MB vs Debian 50MB）。

#### 修改 Dockerfile

```dockerfile
# 從 Debian slim 改為 Alpine
FROM python:3.11-alpine AS base

# Alpine 使用 apk 而非 apt-get
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev \
    curl \
    ca-certificates

WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps

COPY pyproject.toml ./

# Alpine 需要編譯某些包，所以需要 build dependencies
RUN apk add --no-cache --virtual .build-deps \
    g++ \
    make \
    && pip install --no-cache-dir uv \
    && uv pip install --system --no-cache-dir -e . \
    && apk del .build-deps

# Stage 3: Runtime
FROM python:3.11-alpine AS runtime

WORKDIR /app

# 只安裝 runtime 需要的包
RUN apk add --no-cache \
    curl \
    ca-certificates \
    libpq

# Copy from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY ./app ./app
COPY ./alembic ./alembic
COPY ./alembic.ini ./alembic.ini
COPY ./main.py ./main.py
COPY ./start-zeabur.sh ./start-zeabur.sh

# Create non-root user
RUN adduser -D -u 1001 fastapi && \
    chmod +x /app/start-zeabur.sh && \
    chown -R fastapi:fastapi /app

USER fastapi

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD ["/bin/sh", "/app/start-zeabur.sh"]
```

**優點**:
- 基礎映像僅 5MB（vs Debian 50MB）
- 總記憶體可降到 ~180-190MB

**缺點**:
- 編譯時間較長（某些包需要從源碼編譯）
- 某些 Python 包可能不相容（需測試）
- 使用 musl libc 而非 glibc（可能有微小性能差異）

---

### 🎯 方案 2: 移除不必要的 Python 包（節省 ~10-20MB）

**目標**: 220MB → ~200-210MB

檢查並移除未使用的依賴。

#### Step 1: 分析依賴樹

```bash
cd backend
uv pip tree
```

#### Step 2: 移除可能不需要的包

檢查這些包是否真的需要：

```toml
# pyproject.toml

# 🔍 檢查這些是否真的在用
dependencies = [
    # "anthropic>=0.39.0",  # 如果沒用 Anthropic，移除
    # "openai>=1.54.0",     # 如果只用 Gemini，移除
    "google-generativeai>=0.8.0",  # 保留
    
    # "redis>=5.0.0",       # 如果沒用 Redis，移除
    # "aiosqlite>=0.21.0",  # 如果不用 SQLite 測試，移除
    
    "slowapi>=0.1.9",       # Rate limiting - 需要
    "prometheus-client>=0.20.0",  # Monitoring - 建議保留
]
```

#### Step 3: 評估並移除

```bash
# 檢查 Anthropic 使用
rg "anthropic" app/ --type py

# 檢查 OpenAI 使用（如果只用 Gemini）
rg "openai|OpenAI" app/ --type py

# 檢查 Redis 使用
rg "redis|Redis" app/ --type py
```

**預期節省**:
- 移除 anthropic: ~15MB
- 移除 openai: ~12MB
- 移除 redis: ~3MB

---

### 🎯 方案 3: Python Slim 版本（節省 ~15-20MB）

**目標**: 220MB → ~200-205MB

使用更輕量的 Python 安裝。

```dockerfile
# 在 Dockerfile 的 deps stage
FROM python:3.11-slim AS deps

# 在安裝依賴後清理不需要的檔案
RUN uv pip install --system --no-cache-dir -e . && \
    find /usr/local/lib/python3.11 -type d -name '__pycache__' -exec rm -rf {} + && \
    find /usr/local/lib/python3.11 -type f -name '*.pyc' -delete && \
    find /usr/local/lib/python3.11 -type f -name '*.pyo' -delete && \
    rm -rf /root/.cache
```

---

### 🎯 方案 4: 移除測試相關依賴（節省 ~20-30MB）

**目標**: 220MB → ~190-200MB

生產環境不需要測試套件。

#### 分離測試依賴

```toml
# pyproject.toml

dependencies = [
    # 只保留 production 需要的
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    # ... 其他 production 依賴
]

[project.optional-dependencies]
test = [
    # 移到這裡，production 不安裝
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    # ... 其他測試依賴
]
```

#### Dockerfile 不安裝測試依賴

```dockerfile
# 在 deps stage
RUN uv pip install --system --no-cache-dir --no-deps -e .
# --no-deps 不安裝 optional dependencies
```

---

### 🎯 方案 5: 關閉不需要的功能（節省 ~10-15MB）

**目標**: 220MB → ~205-210MB

#### 如果不需要 Scheduler

```bash
# Zeabur 環境變數
ENABLE_SCHEDULER=false
```

**節省**: ~10-15MB（APScheduler + 相關依賴）

#### 如果不需要 Monitoring

移除 Prometheus:
```toml
# pyproject.toml
# "prometheus-client>=0.20.0",  # 移除
```

**節省**: ~5MB

---

## 推薦優化路徑

### 🌟 保守路徑（推薦）

**目標**: 220MB → ~180-200MB  
**風險**: 低  
**工作量**: 中等

1. ✅ **移除未使用的 AI Provider** (如果確定只用 Gemini)
   - 移除 anthropic: -15MB
   - 移除 openai: -12MB

2. ✅ **清理 Python cache**
   - 修改 Dockerfile 清理 `__pycache__`
   - 節省: -10MB

3. ✅ **分離測試依賴**
   - Production 不安裝測試套件
   - 節省: -20MB

**預期結果**: ~180-200MB

---

### 🚀 激進路徑（高級用戶）

**目標**: 220MB → ~150-170MB  
**風險**: 中等  
**工作量**: 高

1. ✅ **使用 Alpine Linux**
   - 基礎映像從 50MB → 5MB
   - 節省: -40MB

2. ✅ **移除所有非必要依賴**
   - 只保留核心功能需要的包
   - 節省: -20MB

3. ✅ **關閉 Scheduler**（如果不需要 Bingo）
   - 節省: -10MB

**預期結果**: ~150-170MB

---

## 立即可行的優化（最小風險）

### Step 1: 清理 Python Cache

修改 `Dockerfile`:

```dockerfile
# 在 deps stage 最後加入
RUN find /usr/local/lib/python3.11 -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11 -type f -name '*.pyc' -delete && \
    find /usr/local/lib/python3.11 -type f -name '*.pyo' -delete
```

**節省**: ~10MB

### Step 2: 檢查 AI Providers

```bash
# 檢查是否使用 Anthropic
cd backend
rg "from anthropic|import anthropic" app/ --type py

# 如果沒有結果，可以安全移除
```

如果沒用，註解掉：
```toml
# "anthropic>=0.39.0",
```

**節省**: ~15MB

### Step 3: 檢查 Redis

```bash
rg "import redis|from redis" app/ --type py
```

如果沒用：
```toml
# "redis>=5.0.0",
```

**節省**: ~3MB

---

## 測試計劃

每次優化後測試：

```bash
# 1. 本地 Docker 測試
docker build -t backend-test .
docker run -p 8000:8000 backend-test

# 2. 檢查記憶體
curl http://localhost:8000/api/v1/monitoring/metrics/memory

# 3. 功能測試
curl http://localhost:8000/docs
curl http://localhost:8000/api/v1/cards?limit=5

# 4. 如果都正常，提交並推送到 Zeabur
```

---

## 現實評估

### 當前 220MB 的評價

| 方面 | 評分 | 說明 |
|-----|------|------|
| **記憶體效率** | ⭐⭐⭐⭐⭐ | 非常優秀 |
| **成本** | 💰 | 很便宜 |
| **穩定性** | ✅ | 完全穩定 |
| **性能** | ⚡ | 無影響 |

### 繼續優化的必要性

**220MB 已經很優秀了！**

- Zeabur 512MB plan: 你只用了 43%
- Zeabur 1GB plan: 你只用了 22%
- 成本已經很低

**繼續優化的成本/收益比**:
- 節省記憶體: 40-70MB（18-32%）
- 開發時間: 2-4 小時
- 維護風險: 增加（Alpine 相容性、缺少依賴）
- **建議**: 除非預算非常緊張，否則 220MB 已經足夠

---

## 建議

### 🎯 當前最優解（220MB）

**保持現狀**，因為：
1. ✅ 已經節省 48%（420MB → 220MB）
2. ✅ 記憶體使用健康（< 512MB 的 50%）
3. ✅ 零功能損失
4. ✅ 維護簡單

### 🤔 如果真的要再優化

**只推薦**: 移除未使用的 AI Providers（低風險，節省 ~30MB）

**步驟**:
1. 檢查是否使用 anthropic/openai
2. 如果沒用，從 pyproject.toml 移除
3. 測試並部署
4. 預期: 220MB → ~190MB

### ❌ 不建議

- Alpine Linux（高風險，相容性問題）
- 移除 Monitoring（失去可觀測性）
- 移除 Scheduler（功能受損）

---

## 總結

| 方案 | 節省 | 風險 | 工作量 | 推薦度 |
|-----|------|------|--------|--------|
| **保持現狀 (220MB)** | - | 無 | 無 | ⭐⭐⭐⭐⭐ |
| 移除未用 AI Provider | ~30MB | 低 | 30分鐘 | ⭐⭐⭐⭐ |
| 清理 Python Cache | ~10MB | 無 | 15分鐘 | ⭐⭐⭐ |
| Alpine Linux | ~40MB | 中 | 2小時 | ⭐⭐ |
| 移除測試依賴 | ~20MB | 低 | 1小時 | ⭐⭐⭐ |

**最終建議**: 220MB 已經非常優秀，建議保持現狀。如果真的需要，只做「移除未用 AI Provider」即可。

---

**當前記憶體**: 220 MB  
**行業標準**: 
- 小型 FastAPI: 200-400 MB
- 中型應用: 400-800 MB
- 大型應用: 800MB+

**結論**: 你已經在「小型 FastAPI」的下限了！🎉
