# 部署指南

## 概述

本文檔詳細說明了塔羅牌解讀平台的部署流程，包含前端、後端、資料庫的完整部署策略和運維指南。

## 技術架構

### 部署架構圖

```
Internet
    ↓
Cloudflare CDN
    ↓
Zeabur (Frontend + Backend)
    │
    ├── Next.js 14 (Frontend)
    │
    └── FastAPI (Backend API)
    ↓
Supabase (Database + Auth + Scheduler)
    │
    ├── PostgreSQL (主資料庫)
    ├── pg_cron (排程系統)
    └── Edge Functions (Deno)
    ↓
Google Cloud (Gemini AI)
```

### 服務組件

1. **前端**: Next.js 14 應用部署在 Zeabur
2. **後端**: FastAPI 應用部署在 Zeabur
3. **資料庫**: Supabase 託管的 PostgreSQL
4. **排程系統**: Supabase pg_cron + Edge Functions (Deno)
5. **檔案存儲**: Supabase Storage
6. **AI 服務**: Google Gemini API / Anthropic Claude / OpenAI
7. **CDN**: Cloudflare
8. **監控**: Sentry + Zeabur Analytics

## 環境配置

### 開發環境

#### 前端環境變數 (.env.local)

```bash
# 應用基本配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_ENVIRONMENT=development

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI
GOOGLE_AI_API_KEY=your-gemini-api-key

# 第三方服務
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-your-id

# 功能開關
NEXT_PUBLIC_ENABLE_COMMUNITY=true
NEXT_PUBLIC_ENABLE_PAYMENTS=false
```

#### 後端環境變數 (.env)

```bash
# 應用配置
ENVIRONMENT=development
DEBUG=true
API_VERSION=v1
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:3000

# 資料庫配置
DATABASE_URL=postgresql://user:password@localhost:5432/tarot_db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 配置
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Google AI 配置
GOOGLE_AI_API_KEY=your-gemini-api-key
GOOGLE_AI_MODEL=gemini-1.5-pro

# Redis 配置 (快取)
REDIS_URL=redis://localhost:6379/0

# 監控和日誌
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO

# 郵件服務
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# 限流配置
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_PREMIUM_REQUESTS_PER_MINUTE=120
```

### 生產環境

#### Zeabur 前端環境變數

```bash
# 生產環境配置
NEXT_PUBLIC_APP_URL=https://tarot-app.zeabur.app
NEXT_PUBLIC_API_URL=https://tarot-api.zeabur.app/api/v1
NEXT_PUBLIC_ENVIRONMENT=production

# Supabase 生產環境
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key

# AI 服務配置
GOOGLE_AI_API_KEY=prod-gemini-api-key
ANTHROPIC_API_KEY=prod-claude-api-key
OPENAI_API_KEY=prod-openai-api-key

# 監控
NEXT_PUBLIC_SENTRY_DSN=prod-sentry-dsn
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-prod-id

# 功能開關
NEXT_PUBLIC_ENABLE_COMMUNITY=true
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_BINGO_ENABLE=true
```

#### Zeabur 後端環境變數

```bash
# 生產環境配置
ENVIRONMENT=production
DEBUG=false
API_VERSION=v1
ALLOWED_HOSTS=tarot-api.zeabur.app,tarot-app.zeabur.app
CORS_ORIGINS=https://tarot-app.zeabur.app

# 資料庫 (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key

# JWT 配置
JWT_SECRET_KEY=super-secret-production-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# AI 服務配置
AI_PROVIDER=anthropic  # anthropic, openai, google
ANTHROPIC_API_KEY=prod-claude-api-key
OPENAI_API_KEY=prod-openai-api-key
GOOGLE_AI_API_KEY=prod-gemini-api-key

# Redis (Zeabur Redis 或 Upstash)
REDIS_URL=redis://default:password@redis.zeabur.internal:6379

# Daily Bingo 配置
BINGO_RESET_TIMEZONE=Asia/Taipei
BINGO_CYCLE_LENGTH=25
BINGO_MIN_LINES_FOR_REWARD=3
EDGE_FUNCTION_DAILY_NUMBER_URL=https://prod-project.supabase.co/functions/v1/generate-daily-number

# 監控
SENTRY_DSN=prod-sentry-dsn
LOG_LEVEL=WARNING
```

## 前端部署 (Zeabur)

### 1. Zeabur 前端設定

#### zbpack.json 配置

```json
{
  "build_command": "bun run build",
  "install_command": "bun install",
  "start_command": "bun run start",
  "framework": "nextjs",
  "node_version": "20"
}
```

#### 部署步驟

1. **安裝 Zeabur CLI**
   ```bash
   # macOS / Linux
   curl -fsSL https://zeabur.com/install.sh | bash

   # Windows (PowerShell)
   irm https://zeabur.com/install.ps1 | iex

   # 登入 Zeabur
   zeabur auth login
   ```

2. **初始化專案**
   ```bash
   # 初始化專案
   zeabur init

   # 連接 Git Repository
   zeabur link
   ```

3. **設定環境變數**
   ```bash
   # 透過 CLI 設定環境變數
   zeabur env set NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   zeabur env set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   zeabur env set GOOGLE_AI_API_KEY=your-api-key
   zeabur env set ANTHROPIC_API_KEY=your-claude-key
   zeabur env set NEXT_PUBLIC_BINGO_ENABLE=true

   # 或透過 Zeabur Dashboard 設定
   ```

4. **設定自定義域名**
   ```bash
   # 透過 Dashboard 添加域名
   # 1. 前往 Zeabur Dashboard > Service > Domains
   # 2. 點擊 "Add Domain"
   # 3. 輸入域名並設定 DNS 記錄
   # CNAME: www -> xxx.zeabur.app
   ```

5. **部署配置**
   ```bash
   # 推送到 main 分支自動部署
   git push origin main

   # 或手動部署
   zeabur deploy
   ```

### 2. 自動化部署

#### GitHub Actions 工作流

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend to Zeabur

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Run tests
      run: bun test

    - name: Build application
      run: bun run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
        NEXT_PUBLIC_BINGO_ENABLE: true

    # Zeabur 會自動從 Git 部署，無需額外 action
    # 如需手動觸發：zeabur deploy
```

## 後端部署 (Zeabur)

### 1. Zeabur 後端設定

#### zbpack.json 配置

```json
{
  "build_command": "uv sync",
  "start_command": "cd backend && uv run gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}",
  "python_version": "3.11"
}
```

#### Dockerfile (推薦)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝 uv
RUN pip install uv

# 複製專案檔案
COPY backend/pyproject.toml backend/uv.lock ./
COPY backend/ ./

# 使用 uv 安裝依賴
RUN uv sync --frozen

# 建立非 root 用戶
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# 暴露端口
EXPOSE ${PORT:-8000}

# 啟動命令
CMD ["uv", "run", "gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:${PORT:-8000}"]
```

#### 部署步驟

1. **使用 Zeabur CLI 部署**
   ```bash
   # 進入後端目錄
   cd backend

   # 初始化 Zeabur 服務
   zeabur init --name tarot-api

   # 部署
   zeabur deploy
   ```

2. **設定環境變數**
   ```bash
   # 設定生產環境變數
   zeabur env set ENVIRONMENT=production
   zeabur env set DEBUG=false
   zeabur env set JWT_SECRET_KEY=your-secret-key
   zeabur env set SUPABASE_URL=https://xxx.supabase.co
   zeabur env set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   zeabur env set ANTHROPIC_API_KEY=your-claude-key
   zeabur env set BINGO_RESET_TIMEZONE=Asia/Taipei
   ```

3. **查看部署狀態**
   ```bash
   # 查看日誌
   zeabur logs --tail

   # 查看服務狀態
   zeabur status

   # 重啟服務
   zeabur restart
   ```

4. **配置健康檢查**
   ```bash
   # 透過 Dashboard 設定
   # Health Check Path: /health
   # Health Check Interval: 30s
   # Health Check Timeout: 10s
   ```

### 2. 資料庫遷移

#### 遷移腳本

```python
# migrations/migrate.py
from alembic import command
from alembic.config import Config
import os

def run_migrations():
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))
    command.upgrade(alembic_cfg, "head")

if __name__ == "__main__":
    run_migrations()
```

#### 自動遷移

```bash
# 在 Zeabur 部署時執行遷移
# 使用 prestart 鉤子
cat > prestart.sh << 'EOF'
#!/bin/bash
cd backend
uv run python migrations/migrate.py
EOF
chmod +x prestart.sh

# 在 zbpack.json 中配置
{
  "prestart": "./prestart.sh"
}
```

## 資料庫部署 (Supabase)

### 1. Supabase 設定

#### 資料庫遷移

```sql
-- migrations/001_initial_schema.sql
-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用戶資料表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    birth_date DATE,
    zodiac_sign VARCHAR(20),
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    total_readings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 塔羅牌解讀記錄
CREATE TABLE IF NOT EXISTS tarot_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question TEXT,
    spread_type VARCHAR(50) NOT NULL,
    cards_data JSONB NOT NULL,
    interpretation_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own readings" ON tarot_readings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own readings" ON tarot_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own readings" ON tarot_readings FOR UPDATE USING (auth.uid() = user_id);
```

#### 儲存桶設定

```sql
-- 建立儲存桶
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('card-images', 'card-images', true);

-- 儲存桶政策
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Card images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'card-images');
```

### 2. 備份策略

#### 自動備份腳本

```bash
#!/bin/bash
# backup.sh

# 設定變數
SUPABASE_PROJECT_ID="your-project-id"
BACKUP_DIR="/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)

# 建立備份目錄
mkdir -p $BACKUP_DIR

# 備份資料庫
supabase db dump --project-id $SUPABASE_PROJECT_ID > $BACKUP_DIR/database_$DATE.sql

# 壓縮備份
gzip $BACKUP_DIR/database_$DATE.sql

# 上傳到雲端存儲 (可選)
aws s3 cp $BACKUP_DIR/database_$DATE.sql.gz s3://your-backup-bucket/

# 清理舊備份 (保留 30 天)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: database_$DATE.sql.gz"
```

#### Cron 排程

```bash
# 每天凌晨 2 點執行備份
0 2 * * * /path/to/backup.sh
```

## 監控和日誌

### 1. 應用監控

#### Sentry 設定

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/tarot-api\.zeabur\.app/],
    }),
  ],
});
```

```python
# backend/monitoring.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT"),
    traces_sample_rate=1.0,
    integrations=[
        FastApiIntegration(auto_enabling_integrations=False),
        SqlalchemyIntegration(),
    ],
)
```

### 2. 效能監控

#### Zeabur Analytics (內建)

```typescript
// app/layout.tsx
// Zeabur 提供內建的 Analytics，無需額外配置
// 透過 Dashboard 查看即時監控資料

// 如需自定義追蹤，可使用 Web Vitals
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // 發送到自定義分析服務
    console.log(metric);
  });
}
```

#### 自定義監控

```python
# backend/monitoring/metrics.py
from prometheus_client import Counter, Histogram, generate_latest
import time

# 定義指標
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    REQUEST_DURATION.observe(process_time)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### 3. 日誌管理

#### 結構化日誌

```python
# backend/logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id

        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id

        return json.dumps(log_entry)

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)

logger = logging.getLogger(__name__)
logger.handlers[0].setFormatter(JSONFormatter())
```

## 安全配置

### 1. HTTPS 設定

#### Cloudflare SSL

```yaml
# cloudflare.yml
ssl: "strict"
always_use_https: true
automatic_https_rewrites: true
security_level: "medium"
browser_check: true
challenge_ttl: 1800
```

### 2. 安全標頭

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 3. API 安全

```python
# backend/security.py
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```

## 災難恢復

### 1. 備份恢復流程

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
SUPABASE_PROJECT_ID="your-project-id"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# 解壓縮備份檔案
gunzip -c $BACKUP_FILE > temp_restore.sql

# 恢復資料庫
supabase db reset --project-id $SUPABASE_PROJECT_ID
psql $DATABASE_URL < temp_restore.sql

# 清理暫存檔案
rm temp_restore.sql

echo "Database restored from $BACKUP_FILE"
```

### 2. 故障轉移

```yaml
# failover.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: failover-config
data:
  primary_api: "https://tarot-api.zeabur.app"
  backup_api: "https://tarot-api-backup.zeabur.app"
  health_check_interval: "30s"
  failover_threshold: "3"
```

## 運維指令

### 常用指令集

```bash
# Zeabur 前端操作
zeabur deploy                    # 部署前端應用
zeabur logs --tail              # 即時查看前端日誌
zeabur env ls                   # 列出環境變數
zeabur status                   # 查看前端服務狀態

# Zeabur 後端操作
cd backend
zeabur deploy                    # 部署後端應用
zeabur logs --tail              # 即時查看後端日誌
zeabur restart                  # 重啟後端服務
zeabur env set KEY=value        # 設定環境變數

# Supabase 操作
supabase start                   # 啟動本地環境
supabase db reset               # 重置資料庫
supabase gen types typescript   # 生成 TypeScript 類型
supabase storage update         # 更新存儲設定
supabase functions deploy       # 部署 Edge Functions

# 監控指令
curl -f https://tarot-app.zeabur.app/api/health || echo "Frontend down"
curl -f https://tarot-api.zeabur.app/health || echo "Backend down"
supabase functions list         # 查看 Edge Functions 狀態
```

### 緊急處理流程

```bash
#!/bin/bash
# emergency.sh

echo "=== 緊急故障處理 ==="

# 1. 檢查服務狀態
echo "檢查前端狀態..."
curl -f https://tarot-app.zeabur.app/api/health

echo "檢查後端狀態..."
curl -f https://tarot-api.zeabur.app/health

echo "檢查資料庫狀態..."
# 執行簡單查詢測試
supabase db ping

echo "檢查 Edge Functions 狀態..."
supabase functions list

# 2. 快速修復
echo "執行快速修復..."
zeabur deploy          # 重新部署前端
cd backend && zeabur deploy  # 重新部署後端

# 3. 重啟服務（如需要）
echo "重啟服務..."
zeabur restart

# 4. 通知團隊
echo "發送緊急通知..."
# 發送 Slack/Discord 通知

echo "=== 處理完成 ==="
```

## 效能優化

### 1. 前端優化

```typescript
// 程式碼分割
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});

// 圖片優化
import Image from 'next/image';

<Image
  src="/tarot-cards/the-fool.jpg"
  alt="The Fool"
  width={300}
  height={500}
  priority={true}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 2. 後端優化

```python
# 快取設定
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost", encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

@cache(expire=3600)
async def get_tarot_cards():
    # 快取塔羅牌資料 1 小時
    return await database.fetch_all("SELECT * FROM tarot_cards")
```

### 3. 資料庫優化

```sql
-- 建立索引
CREATE INDEX idx_tarot_readings_user_id ON tarot_readings(user_id);
CREATE INDEX idx_tarot_readings_created_at ON tarot_readings(created_at);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- 查詢優化
EXPLAIN ANALYZE SELECT * FROM tarot_readings WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 10;
```

## 版本發布

### 1. 語義化版本控制

```json
{
  "version": "1.2.3",
  "releases": {
    "1.0.0": "初始發布",
    "1.1.0": "新增社群功能",
    "1.2.0": "新增付費功能",
    "1.2.1": "修復解讀 bug",
    "1.2.2": "效能優化",
    "1.2.3": "安全更新"
  }
}
```

### 2. 發布流程

```bash
#!/bin/bash
# release.sh

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# 更新版本號
npm version $VERSION

# 執行測試
npm run test

# 建構應用
npm run build

# 標記 Git
git tag -a v$VERSION -m "Release version $VERSION"

# 推送
git push origin main
git push origin v$VERSION

# 部署到 Zeabur
zeabur deploy                    # 前端
cd backend && zeabur deploy     # 後端

echo "Released version $VERSION"
```

## Daily Bingo 排程系統部署

### Supabase Edge Functions 部署

```bash
# 1. 部署每日號碼生成 Function
cd supabase/functions/generate-daily-number
supabase functions deploy generate-daily-number

# 2. 部署每月重置 Function
cd ../monthly-reset
supabase functions deploy monthly-reset

# 3. 設定 pg_cron 排程
psql $DATABASE_URL << 'EOF'
-- 每日 00:00 (台北時間) 生成號碼
SELECT cron.schedule(
  'generate-daily-number',
  '0 0 * * *',
  $$SELECT net.http_post(
    url := 'https://xxx.supabase.co/functions/v1/generate-daily-number',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);

-- 每月 1 日 01:00 執行重置
SELECT cron.schedule(
  'monthly-reset',
  '0 1 1 * *',
  $$SELECT net.http_post(
    url := 'https://xxx.supabase.co/functions/v1/monthly-reset',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
EOF

# 4. 驗證排程設定
psql $DATABASE_URL -c "SELECT * FROM cron.job;"
```

### 監控 Daily Bingo 系統

```bash
# 查看 Edge Function 日誌
supabase functions logs generate-daily-number --tail
supabase functions logs monthly-reset --tail

# 查看 cron 執行歷史
psql $DATABASE_URL << 'EOF'
SELECT * FROM cron.job_run_details
WHERE job_name IN ('generate-daily-number', 'monthly-reset')
ORDER BY start_time DESC
LIMIT 10;
EOF

# 查看每月重置記錄
psql $DATABASE_URL -c "SELECT * FROM monthly_reset_logs ORDER BY executed_at DESC LIMIT 5;"
```

---

這份部署指南涵蓋了從開發到生產環境的完整部署流程，包含：
- Zeabur 前後端部署配置
- Supabase 資料庫與排程系統設定
- Daily Bingo 功能的 Edge Functions 部署
- 監控、安全、災難恢復等關鍵運維內容

遵循這些指南可以確保應用的穩定運行和高可用性。