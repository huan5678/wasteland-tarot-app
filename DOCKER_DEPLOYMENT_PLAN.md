# Zeabur 部署架構規劃

## 目錄
1. [架構概覽](#架構概覽)
2. [Zeabur 平台特性](#zeabur-平台特性)
3. [服務組成](#服務組成)
4. [Docker 檔案規劃](#docker-檔案規劃)
5. [環境配置](#環境配置)
6. [部署流程](#部署流程)
7. [監控與日誌](#監控與日誌)

---

## 架構概覽

### 系統架構圖 (Zeabur)
```
┌─────────────────────────────────────────────────────────────┐
│                    Zeabur Edge Network                      │
│              (Automatic Load Balancing + CDN)               │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
    ┌──────────────┐           ┌──────────────┐
    │   Frontend   │           │   Backend    │
    │  (Next.js)   │◄─────────►│  (FastAPI)   │
    │ Standalone   │  Private  │  Container   │
    │   Output     │  Network  │              │
    └──────────────┘           └──────┬───────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │ PostgreSQL  │   │    Redis    │   │  Supabase   │
            │  (Zeabur    │   │  (Zeabur    │   │  (External) │
            │  Managed)   │   │  Managed)   │   │             │
            └─────────────┘   └─────────────┘   └─────────────┘
                ▲                     ▲
                │                     │
                └─────────────────────┘
              Auto Injection of Connection Vars
```

### 技術棧
- **Platform**: Zeabur (PaaS with automatic scaling)
- **Frontend**: Next.js 15 (React 19) + Bun + Standalone Output
- **Backend**: FastAPI + Python 3.11 + uv
- **Database**: PostgreSQL 15 (Zeabur Managed) + Supabase
- **Cache**: Redis 7 (Zeabur Managed)
- **Edge Network**: Zeabur's built-in CDN
- **CI/CD**: Git-based auto deployment

---

## Zeabur 平台特性

### 為什麼選擇 Zeabur？

#### 1. **簡化部署流程**
- ✅ One-click 部署 (連接 GitHub 即可)
- ✅ 自動代碼分析與框架檢測
- ✅ 內建 CI/CD (git push 自動部署)
- ✅ 零配置的服務連接

#### 2. **Managed Services**
- ✅ PostgreSQL (一鍵部署 + 自動備份)
- ✅ Redis (持久化 + 叢集支援)
- ✅ 自動注入連接變數
- ✅ 內網通訊 (*.zeabur.internal)

#### 3. **成本優勢**
```
Free Tier:      $0/month  - 靜態站點 + Serverless
Developer Plan: $5/month  - 包含 $5 credit
Team Plan:      $80/month - 企業級資源

計費模式:
- Memory:  $0.00025/GB-min
- Network: $0.10/GB egress
- Storage: $0.20/GB-month
- CPU:     目前免費 (shared cluster)
```

#### 4. **開發者體驗**
- ✅ 多環境支援 (dev/staging/prod)
- ✅ 強大的環境變數系統
- ✅ 服務間自動連接
- ✅ 實時日誌與指標
- ✅ CLI + Web 雙重管理

#### 5. **效能優勢**
- ✅ Edge Network (全球 CDN)
- ✅ 自動擴展
- ✅ 低冷啟動延遲
- ✅ HTTP/2 + 壓縮

### Zeabur vs 傳統部署

| 特性 | 傳統 Docker | Zeabur |
|------|------------|--------|
| 部署時間 | 15-30 分鐘 | 2-5 分鐘 |
| 資料庫設定 | 手動配置 | One-click |
| 環境變數 | .env 檔案 | Web UI 管理 |
| 服務連接 | 手動配置 | 自動注入 |
| SSL 憑證 | 需設定 | 自動 HTTPS |
| 監控 | 需額外工具 | 內建 |
| 擴展 | 手動 | 自動 |
| 成本 | 固定 | 按用量 |

---

## 服務組成

### 1. Frontend (Next.js) - Zeabur Service
- **技術**: Next.js 15 + Bun + **Standalone Output**
- **功能**: SSR, API Routes, Static Assets
- **部署方式**: Git-based auto deployment
- **構建命令**: `bun run build`
- **啟動命令**: `node .next/standalone/server.js`
- **環境變數**: 
  - `NEXT_PUBLIC_API_URL` (自動注入 Backend URL)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **特性**:
  - ✅ 使用 Standalone output 減少 90% 映像大小
  - ✅ Zeabur 自動處理靜態資源
  - ✅ 自動 HTTPS + CDN 加速

### 2. Backend (FastAPI) - Zeabur Service
- **技術**: FastAPI + Python 3.11 + uv
- **功能**: REST API, WebSocket, AI Integration
- **部署方式**: Docker (Dockerfile)
- **環境變數**: 
  - `POSTGRES_CONNECTION_STRING` (Zeabur 自動注入)
  - `REDIS_CONNECTION_STRING` (Zeabur 自動注入)
  - `SUPABASE_URL`, `SUPABASE_KEY`
  - AI API Keys (手動設定)
- **特性**:
  - ✅ 使用 uv 加速依賴安裝
  - ✅ 健康檢查端點
  - ✅ 自動重啟機制

### 3. Database (PostgreSQL) - Zeabur Managed
- **版本**: PostgreSQL 15
- **功能**: 主資料庫
- **部署方式**: One-click deployment
- **自動注入變數**:
  - `POSTGRES_CONNECTION_STRING`
  - `POSTGRES_HOST` (*.zeabur.internal)
  - `POSTGRES_PORT`
  - `POSTGRES_DATABASE`
  - `POSTGRES_USERNAME`
  - `POSTGRES_PASSWORD`
- **特性**:
  - ✅ 自動備份
  - ✅ 一鍵還原
  - ✅ Config Editor 可調整 postgresql.conf
  - ✅ 支援 PostGIS 擴展
  - ✅ 支援 TLS/SSL

### 4. Cache (Redis) - Zeabur Managed
- **版本**: Redis 7
- **功能**: Session, Rate Limiting, Cache
- **部署方式**: One-click deployment
- **自動注入變數**:
  - `REDIS_CONNECTION_STRING`
  - `REDIS_HOST` (*.zeabur.internal)
  - `REDIS_PORT`
  - `REDIS_PASSWORD`
- **特性**:
  - ✅ 持久化 (AOF)
  - ✅ 叢集支援
  - ✅ 自動重啟

### 5. Reverse Proxy & CDN - Zeabur Built-in
- **功能**: 
  - SSL termination (自動 Let's Encrypt)
  - Load balancing (自動)
  - Static asset CDN
  - HTTP/2 + Gzip 壓縮
- **特性**:
  - ✅ 零配置
  - ✅ 全球 Edge Network
  - ✅ 自定義域名支援

---

## Docker 檔案規劃

### 目錄結構
```
tarot-card-nextjs-app/
├── Dockerfile.frontend          # Frontend production build
├── Dockerfile.frontend.dev      # Frontend development
├── backend/
│   ├── Dockerfile               # Backend production build
│   └── Dockerfile.dev           # Backend development
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── docker-compose.test.yml      # Testing environment
├── nginx/
│   ├── Dockerfile               # Nginx image
│   ├── nginx.conf               # Main config
│   ├── conf.d/
│   │   ├── default.conf         # Default site
│   │   └── ssl.conf             # SSL config
│   └── ssl/
│       ├── cert.pem
│       └── key.pem
└── .dockerignore                # Ignore patterns
```

### 關鍵檔案清單

#### 需要建立的檔案
1. ✅ `Dockerfile.frontend` (已存在，需優化)
2. ❌ `Dockerfile.frontend.dev` (新增)
3. ❌ `backend/Dockerfile` (需建立)
4. ❌ `backend/Dockerfile.dev` (新增)
5. ✅ `docker-compose.yml` (已存在，需優化)
6. ❌ `docker-compose.prod.yml` (新增)
7. ❌ `nginx/Dockerfile` (新增)
8. ❌ `nginx/nginx.conf` (新增)
9. ❌ `.dockerignore` (新增)

---

## Docker 檔案詳細規劃

### 1. Frontend (Next.js) - Zeabur Optimized

**關鍵配置**: `next.config.ts`
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ 啟用 Standalone 輸出 (減少 90% 部署大小)
  output: 'standalone',
  
  // ✅ 圖片優化
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // ✅ 壓縮
  compress: true,
  
  // ✅ 實驗性功能
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
};

export default nextConfig;
```

**Zeabur 配置**: `zbpack.json` (可選)
```json
{
  "build_command": "bun install && bun run build",
  "start_command": "node .next/standalone/server.js",
  "node_version": "18"
}
```

**Dockerfile** (如果使用 Docker 部署方式):
```dockerfile
# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Stage 3: Runner (Standalone)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

**重要**: 
- ✅ 使用 `output: 'standalone'` 減少部署大小從 ~500MB 到 ~50MB
- ✅ Zeabur 會自動處理 `public/` 和 `.next/static/` 的複製
- ✅ 使用 Node.js runtime 而非 Bun runtime (更穩定)

### 2. Frontend Dockerfile (Development)

**新增開發環境**:
```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]
```

### 2. Backend (FastAPI) - Production Dockerfile

**使用 uv 加速安裝 (10-100x 更快)**:
```dockerfile
# Stage 1: Base with uv
FROM python:3.11-slim AS base

# Install uv (faster than pip)
RUN pip install --no-cache-dir uv

WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps

# Copy dependency files
COPY pyproject.toml ./
# If you have uv.lock, copy it
# COPY uv.lock ./

# Install dependencies using uv
# Use --system to install directly (not in venv)
RUN uv pip install --system --no-cache-dir -e .

# Stage 3: Runtime
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install runtime dependencies (curl for health check)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY ./app ./app
COPY ./alembic ./alembic
COPY ./alembic.ini ./alembic.ini

# Create non-root user for security
RUN useradd -m -u 1001 fastapi && \
    chown -R fastapi:fastapi /app

USER fastapi

EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Use uvicorn with production settings
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--log-level", "info"]
```

**Zeabur 配置**: `backend/zbpack.json` (可選)
```json
{
  "dockerfile": "Dockerfile",
  "build_args": {
    "ENVIRONMENT": "production"
  }
}
```

### 4. Backend Dockerfile (Development)

```dockerfile
FROM python:3.11-slim

RUN pip install uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv pip install --system --no-cache -r pyproject.toml

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 5. Nginx Dockerfile

```dockerfile
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificates (if using self-signed for dev)
COPY ssl/ /etc/nginx/ssl/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

---

## 環境配置

### .env.example (Frontend)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development

# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### .env.example (Backend)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/wasteland_tarot
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://redis:6379

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key

# TTS Configuration
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/google-credentials.json

# Environment
ENVIRONMENT=production
DEBUG=false

# CORS
ALLOWED_ORIGINS=https://your-domain.com
```

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    restart: always
    networks:
      - wasteland_network

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_APP_ENV: production
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - backend
    restart: always
    networks:
      - wasteland_network

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - ENVIRONMENT=production
      - DEBUG=false
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/credentials:/app/credentials:ro
    restart: always
    networks:
      - wasteland_network

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wasteland_network

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wasteland_network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  wasteland_network:
    driver: bridge
```

---

## 部署流程

### Zeabur 部署步驟

#### 1. 初始設定 (一次性)

**Step 1: 建立 Zeabur 專案**
```bash
# 選項 A: Web UI
1. 訪問 https://zeabur.com
2. 連接 GitHub 帳號
3. 建立新專案 "wasteland-tarot"

# 選項 B: CLI
bun install -g @zeabur/cli
zeabur login
zeabur project create wasteland-tarot
```

**Step 2: 部署 PostgreSQL (Managed)**
```bash
# Web UI:
1. 點擊 "Add Service"
2. 選擇 "PostgreSQL"
3. 點擊 "Deploy"
4. 等待部署完成 (~1 分鐘)

# 自動注入的環境變數:
# - POSTGRES_CONNECTION_STRING
# - POSTGRES_HOST
# - POSTGRES_PORT
# - POSTGRES_DATABASE
# - POSTGRES_USERNAME
# - POSTGRES_PASSWORD
```

**Step 3: 部署 Redis (Managed)**
```bash
# Web UI:
1. 點擊 "Add Service"
2. 選擇 "Redis"
3. 點擊 "Deploy"

# 自動注入的環境變數:
# - REDIS_CONNECTION_STRING
# - REDIS_HOST
# - REDIS_PORT
# - REDIS_PASSWORD
```

**Step 4: 部署 Backend**
```bash
# Web UI:
1. 點擊 "Add Service"
2. 選擇 "Git"
3. 選擇你的 repo
4. 設定 Root Directory: "./backend"
5. Zeabur 會自動偵測 Dockerfile

# 設定環境變數 (手動):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GOOGLE_API_KEY=your-key
ENVIRONMENT=production
DEBUG=false
```

**Step 5: 部署 Frontend**
```bash
# Web UI:
1. 點擊 "Add Service"
2. 選擇 "Git"
3. 選擇你的 repo
4. 設定 Root Directory: "./" (根目錄)
5. Zeabur 會自動偵測 Next.js

# 設定環境變數:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend URL 會自動注入為:
NEXT_PUBLIC_API_URL=${BACKEND_URL}
```

**Step 6: 資料庫遷移**
```bash
# 選項 A: 本地執行遷移 (推薦)
# 1. 從 Zeabur 複製 PostgreSQL 連接字串
# 2. 在本地執行:
cd backend
export DATABASE_URL="postgresql://..."
uv run alembic upgrade head

# 選項 B: 使用 Zeabur Service (一次性)
# 1. 建立臨時 Service
# 2. 設定 Command: "alembic upgrade head"
# 3. 執行後刪除
```

#### 2. 日常部署 (Git Push 自動部署)

```bash
# 1. 提交代碼
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. Zeabur 自動執行:
# - 偵測變更
# - 構建映像/Bundle
# - 運行測試 (如果有)
# - 部署新版本
# - 健康檢查
# - 自動 Rollback (如果失敗)

# 3. 查看部署狀態
# Web UI: Dashboard > Deployments
# CLI: zeabur service logs <service-name>
```

#### 3. 環境變數管理

```bash
# Web UI:
1. 選擇 Service
2. 點擊 "Variables"
3. 新增/編輯變數
4. 儲存 (自動重啟)

# CLI:
zeabur variable set KEY=value --service=backend
zeabur variable set KEY=value --service=frontend

# 批次匯入:
zeabur variable import .env --service=backend
```

#### 4. 監控與除錯

```bash
# 即時日誌
zeabur service logs backend --follow
zeabur service logs frontend --follow

# Web UI:
1. Dashboard > Service
2. "Logs" tab (即時串流)
3. "Metrics" tab (CPU/Memory/Network)

# 健康檢查
curl https://your-backend.zeabur.app/health
curl https://your-frontend.zeabur.app/api/health
```

#### 5. Rollback

```bash
# Web UI:
1. Dashboard > Service > Deployments
2. 選擇先前的成功版本
3. 點擊 "Redeploy"

# CLI:
zeabur service redeploy <service-name> --deployment-id=<id>
```

### 本地開發環境 (Docker Compose)

```bash
# 使用 Docker Compose 進行本地開發
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 執行遷移
docker-compose exec backend alembic upgrade head

# 停止
docker-compose down
```

---

## 監控與日誌

### Prometheus + Grafana (Optional)

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

### 日誌聚合
- **Frontend**: stdout/stderr → Docker logs
- **Backend**: stdout/stderr → Docker logs
- **Nginx**: access.log, error.log → Volume mount
- **集中化**: ELK Stack / Loki / CloudWatch

---

## 安全性考量

### 1. 容器安全
- ✅ 使用非 root 用戶
- ✅ 最小化映像大小 (Alpine/Slim)
- ✅ 多階段構建
- ✅ 掃描漏洞 (Trivy, Snyk)

### 2. 網路安全
- ✅ 使用私有網路
- ✅ 僅暴露必要端口
- ✅ HTTPS/TLS 加密
- ✅ Rate limiting (Nginx + Redis)

### 3. 密鑰管理
- ❌ 不要將密鑰寫入映像
- ✅ 使用環境變數
- ✅ Docker Secrets (Swarm mode)
- ✅ Kubernetes Secrets
- ✅ HashiCorp Vault (企業級)

### 4. 資料持久化
- ✅ 使用 Docker Volumes
- ✅ 定期備份
- ✅ 災難恢復計畫

---

## 效能優化

### 1. 映像優化
- 多階段構建減少層數
- 使用 .dockerignore 排除檔案
- 合併 RUN 命令減少層數
- 使用映像緩存

### 2. 資源限制
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. 網路優化
- 啟用 HTTP/2
- 啟用 Gzip 壓縮
- 設定適當的 Keep-Alive
- CDN 加速靜態資源

---

## Zeabur 部署檢查清單

### Phase 1: 準備階段 (1-2 小時)

- [ ] **程式碼準備**
  - [ ] 更新 `next.config.ts` 添加 `output: 'standalone'`
  - [ ] 建立 `backend/Dockerfile`
  - [ ] 建立 `.dockerignore` (frontend & backend)
  - [ ] 測試本地 Docker build
  - [ ] 確認環境變數清單

- [ ] **Zeabur 帳號設定**
  - [ ] 註冊 Zeabur 帳號
  - [ ] 連接 GitHub
  - [ ] 選擇計費方案 (Developer: $5/月)
  - [ ] 建立專案 "wasteland-tarot"

### Phase 2: 資料庫部署 (5-10 分鐘)

- [ ] **PostgreSQL**
  - [ ] One-click 部署 PostgreSQL
  - [ ] 記錄連接字串
  - [ ] 測試連接
  - [ ] 執行資料庫遷移

- [ ] **Redis**
  - [ ] One-click 部署 Redis
  - [ ] 記錄連接字串
  - [ ] 測試連接

### Phase 3: 後端部署 (10-15 分鐘)

- [ ] **Backend Service**
  - [ ] 連接 Git repository
  - [ ] 設定 Root Directory: `./backend`
  - [ ] 設定環境變數 (Supabase, AI Keys)
  - [ ] 確認自動注入的 DB/Redis 變數
  - [ ] 部署並等待建置完成
  - [ ] 測試 Health Check endpoint
  - [ ] 測試 API endpoints

### Phase 4: 前端部署 (10-15 分鐘)

- [ ] **Frontend Service**
  - [ ] 連接 Git repository
  - [ ] 設定 Root Directory: `./`
  - [ ] 設定環境變數 (Supabase Public Keys)
  - [ ] 確認 Backend URL 自動注入
  - [ ] 部署並等待建置完成
  - [ ] 測試首頁載入
  - [ ] 測試 Frontend → Backend 連接

### Phase 5: 域名與 SSL (5-10 分鐘)

- [ ] **自定義域名**
  - [ ] 在 DNS 設定 CNAME 記錄
  - [ ] 在 Zeabur 添加域名
  - [ ] 等待 SSL 憑證生成 (~5 分鐘)
  - [ ] 測試 HTTPS 連接

### Phase 6: 監控與測試 (15-20 分鐘)

- [ ] **功能測試**
  - [ ] 用戶註冊/登入
  - [ ] 占卜功能
  - [ ] AI 解讀
  - [ ] 語音功能
  - [ ] 成就系統
  - [ ] 賓果遊戲

- [ ] **效能測試**
  - [ ] 首頁載入速度
  - [ ] API 回應時間
  - [ ] 資料庫查詢效能

- [ ] **監控設定**
  - [ ] 查看 Zeabur Metrics
  - [ ] 設定告警通知
  - [ ] 測試自動擴展

---

## 成本估算

### Zeabur 月費 (Developer Plan)

```
基本費用:          $5/月 (包含 $5 credit)

預估用量:
- Memory:          100 GB-hours  × $0.00025 = $0.025
- Network Egress:  10 GB         × $0.10    = $1.00
- Storage:         5 GB          × $0.20    = $1.00
- CPU:             Free (shared cluster)

總計: $5 (基本費) + $2.025 (用量) - $5 (credit) = $2.025/月
```

### 第三方服務

```
Supabase:          Free tier (夠用)
AI APIs:           按使用量計費
  - Claude:        ~$5-20/月
  - OpenAI:        ~$5-15/月
  - Google TTS:    ~$2-10/月

總計: ~$15-47/月 (取決於使用量)
```

**總成本**: $2-47/月 (遠低於傳統 VPS $50-100/月)

---

## 優勢總結

### vs 傳統 VPS

| 項目 | VPS | Zeabur |
|------|-----|--------|
| 部署時間 | 4-8 小時 | 30-60 分鐘 |
| 資料庫設定 | 1-2 小時 | 2 分鐘 |
| SSL 憑證 | 30 分鐘 | 自動 |
| 監控設定 | 1-2 小時 | 內建 |
| 擴展設定 | 手動 | 自動 |
| 維護成本 | 高 | 極低 |
| 月費 | $50-100 | $2-47 |

### vs Vercel/Netlify

| 項目 | Vercel | Zeabur |
|------|--------|--------|
| Backend 支援 | Serverless only | Full container |
| PostgreSQL | 需外部服務 | Managed (內建) |
| Redis | 需外部服務 | Managed (內建) |
| WebSocket | 有限制 | 完全支援 |
| 成本 | 高 | 中等 |

---

## 故障排除

### 常見問題

**Q1: Build 失敗 - "Cannot find module"**
```bash
# 解決方案: 確認 package.json/pyproject.toml 正確
# Frontend: 檢查 bun.lockb 是否提交
# Backend: 檢查 uv.lock 是否存在
```

**Q2: 連接資料庫失敗**
```bash
# 解決方案: 確認環境變數正確注入
# 查看 Service > Variables
# 確認 POSTGRES_CONNECTION_STRING 已存在
```

**Q3: Frontend 無法連接 Backend**
```bash
# 解決方案: 檢查 NEXT_PUBLIC_API_URL
# 應該使用 Backend 的 Zeabur URL
# 例如: https://backend-xxx.zeabur.app
```

**Q4: 部署後出現 502 錯誤**
```bash
# 解決方案: 檢查服務健康狀態
# 1. 查看 Logs
# 2. 確認 Health Check 端點運作
# 3. 確認端口設定 (Frontend: 3000, Backend: 8000)
```

---

## 參考資源

### Zeabur 官方文件
- [Zeabur 文檔](https://zeabur.com/docs)
- [部署 Next.js](https://zeabur.com/docs/en-US/guides/nodejs/nextjs)
- [部署 Python](https://zeabur.com/docs/en-US/guides/python)
- [PostgreSQL 管理](https://zeabur.com/templates/B20CX0)
- [Redis 管理](https://zeabur.com/templates/JM0DSX)
- [環境變數管理](https://zeabur.com/docs/en-US/deploy/variables)

### 最佳實踐
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### 社群資源
- [Zeabur Discord](https://discord.gg/zeabur)
- [GitHub Discussions](https://github.com/zeabur/zeabur/discussions)
