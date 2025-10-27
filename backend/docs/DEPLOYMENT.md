# Passkey 無密碼認證系統 - 部署檢查清單

> **專案**: Wasteland Tarot - Passkey Authentication System
> **版本**: 1.0.0
> **最後更新**: 2025-10-28

---

## 目錄

1. [環境變數配置](#環境變數配置)
2. [資料庫遷移](#資料庫遷移)
3. [Redis 配置](#redis-配置)
4. [HTTPS 設定](#https-設定)
5. [CORS 設定](#cors-設定)
6. [Rate Limiting 配置](#rate-limiting-配置)
7. [安全檢查](#安全檢查)
8. [監控與日誌](#監控與日誌)
9. [測試驗證](#測試驗證)
10. [部署後驗證](#部署後驗證)

---

## 環境變數配置

### 必要變數

請確保以下環境變數已正確設定：

```bash
# 資料庫連線
DATABASE_URL=postgresql://user:password@localhost:5432/wasteland_tarot

# Redis 連線（Rate Limiting 和 Challenge Store）
REDIS_URL=redis://localhost:6379/0

# JWT 安全密鑰（至少 32 字元）
SECRET_KEY=your-secret-key-minimum-32-characters-long

# 環境設定
ENVIRONMENT=production  # or development

# CORS 設定
BACKEND_CORS_ORIGINS=https://wastelandtarot.com,https://www.wastelandtarot.com
```

### WebAuthn 專用變數

```bash
# WebAuthn 功能開關
WEBAUTHN_ENABLED=true

# Relying Party 資訊
WEBAUTHN_RP_NAME="Wasteland Tarot"
WEBAUTHN_RP_ID=wastelandtarot.com  # 不包含 https://，只有 domain
WEBAUTHN_ORIGIN=https://wastelandtarot.com  # 包含協議

# Challenge 有效期限（秒）
WEBAUTHN_CHALLENGE_TIMEOUT=300  # 5 分鐘
```

### 可選變數

```bash
# Sentry 錯誤監控（推薦但非必要）
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# 日誌級別
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# JWT Token 有效期限
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 環境變數檢查腳本

使用以下腳本驗證環境變數設定：

```bash
# backend/scripts/check_env.py
import os
import sys

REQUIRED_VARS = [
    "DATABASE_URL",
    "REDIS_URL",
    "SECRET_KEY",
    "ENVIRONMENT",
    "BACKEND_CORS_ORIGINS",
    "WEBAUTHN_ENABLED",
    "WEBAUTHN_RP_NAME",
    "WEBAUTHN_RP_ID",
    "WEBAUTHN_ORIGIN",
]

def check_env():
    missing = []
    for var in REQUIRED_VARS:
        if not os.getenv(var):
            missing.append(var)

    if missing:
        print("❌ 缺少以下環境變數:")
        for var in missing:
            print(f"  - {var}")
        sys.exit(1)

    print("✅ 所有必要環境變數已設定")

    # 額外檢查
    if len(os.getenv("SECRET_KEY", "")) < 32:
        print("⚠️  警告: SECRET_KEY 應至少 32 字元")

    if os.getenv("ENVIRONMENT") == "production":
        if "http://" in os.getenv("WEBAUTHN_ORIGIN", ""):
            print("❌ Production 環境必須使用 HTTPS")
            sys.exit(1)

    print("✅ 環境變數驗證通過")

if __name__ == "__main__":
    check_env()
```

執行檢查：

```bash
cd backend
python scripts/check_env.py
```

---

## 資料庫遷移

### 步驟 1：備份現有資料庫

**重要**: 部署前務必備份資料庫！

```bash
# PostgreSQL 備份
pg_dump -U user -d wasteland_tarot > backup_$(date +%Y%m%d_%H%M%S).sql

# 或使用完整備份（包含所有資料庫）
pg_dumpall -U user > full_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步驟 2：檢查待執行的遷移

```bash
cd backend
alembic current  # 查看當前版本
alembic heads    # 查看最新版本
alembic history  # 查看遷移歷史
```

### 步驟 3：執行資料庫遷移

```bash
# 執行所有待執行的遷移
alembic upgrade head

# 如果需要執行特定版本
# alembic upgrade <revision_id>
```

### 步驟 4：驗證遷移結果

```bash
# 檢查 credentials 資料表是否存在
psql -U user -d wasteland_tarot -c "\d credentials"

# 檢查 users.last_login_method 欄位是否存在
psql -U user -d wasteland_tarot -c "\d users"

# 檢查索引是否建立
psql -U user -d wasteland_tarot -c "\di"
```

預期的索引：

- `idx_credentials_user_id` - credentials(user_id)
- `idx_credentials_credential_id` - credentials(credential_id) UNIQUE
- `idx_credentials_last_used_at` - credentials(last_used_at)

### 步驟 5：準備 Rollback 腳本

如果遷移失敗，請使用 rollback：

```bash
# 回退一個版本
alembic downgrade -1

# 回退到特定版本
alembic downgrade <revision_id>

# 完全回退（危險！）
# alembic downgrade base
```

**Rollback 檢查清單**：

- [ ] 備份已完成
- [ ] Rollback 腳本已測試
- [ ] 團隊成員已通知
- [ ] 監控儀表板已準備

---

## Redis 配置

### 安裝 Redis

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# macOS (使用 Homebrew)
brew install redis

# 啟動 Redis
sudo systemctl start redis-server  # Linux
brew services start redis           # macOS
```

### Redis 配置檢查

編輯 `/etc/redis/redis.conf` (Linux) 或 `/usr/local/etc/redis.conf` (macOS)：

```conf
# 綁定地址（production 建議只綁定 localhost）
bind 127.0.0.1

# 密碼保護（production 必須）
requirepass your-strong-redis-password

# 持久化（建議使用 AOF）
appendonly yes
appendfsync everysec

# 記憶體限制
maxmemory 256mb
maxmemory-policy allkeys-lru

# 日誌
loglevel notice
logfile /var/log/redis/redis-server.log
```

### 驗證 Redis 連線

```bash
# 測試連線
redis-cli ping
# 預期輸出: PONG

# 測試認證（如果設定密碼）
redis-cli -a your-redis-password ping

# 檢查 Redis 資訊
redis-cli info
```

### 更新環境變數

```bash
# 如果設定密碼
REDIS_URL=redis://:your-redis-password@localhost:6379/0
```

---

## HTTPS 設定

### Production 環境必要條件

- [ ] 已取得有效的 SSL/TLS 證書
- [ ] 證書已安裝到 Web Server（Nginx/Apache）
- [ ] HTTP 自動重導向至 HTTPS
- [ ] HSTS Header 已啟用

### SSL 證書取得（使用 Let's Encrypt）

```bash
# 安裝 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 取得證書（Nginx）
sudo certbot --nginx -d wastelandtarot.com -d www.wastelandtarot.com

# 自動更新證書
sudo certbot renew --dry-run
```

### Nginx 設定範例

```nginx
server {
    listen 80;
    server_name wastelandtarot.com www.wastelandtarot.com;

    # HTTP 重導向至 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wastelandtarot.com www.wastelandtarot.com;

    # SSL 證書
    ssl_certificate /etc/letsencrypt/live/wastelandtarot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wastelandtarot.com/privkey.pem;

    # SSL 設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS (31536000 seconds = 1 year)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 反向代理到 FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 前端靜態檔案
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 驗證 HTTPS

```bash
# 測試 SSL 配置
curl -I https://wastelandtarot.com

# 檢查 HSTS Header
curl -I https://wastelandtarot.com | grep Strict-Transport-Security

# 使用 SSL Labs 測試（推薦）
# https://www.ssllabs.com/ssltest/
```

---

## CORS 設定

### Development 環境

```python
# backend/app/core/config.py
BACKEND_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
```

### Production 環境

```python
# 嚴格白名單（只允許信任的 origin）
BACKEND_CORS_ORIGINS = [
    "https://wastelandtarot.com",
    "https://www.wastelandtarot.com"
]
```

### 驗證 CORS

```bash
# 測試 CORS preflight request
curl -X OPTIONS https://wastelandtarot.com/api/v1/webauthn/register-new/options \
  -H "Origin: https://wastelandtarot.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# 預期輸出應包含:
# Access-Control-Allow-Origin: https://wastelandtarot.com
# Access-Control-Allow-Methods: POST, GET, OPTIONS
```

---

## Rate Limiting 配置

### Redis 儲存（Production 推薦）

Rate Limiting 使用 Redis 儲存請求計數。

```python
# backend/app/middleware/rate_limit.py
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL")  # 使用 Redis
)
```

### 記憶體儲存（僅 Development）

```python
# 如果 Redis 不可用，會自動降級到記憶體儲存
# ⚠️  注意：記憶體儲存不適合 production（無法跨 worker 共享）
limiter = Limiter(
    key_func=get_remote_address
)
```

### Rate Limit 設定

當前限制：

| 端點 | 限制 | 說明 |
|-----|------|------|
| `/register-new/options` | 10/minute | 新用戶註冊選項 |
| `/register-new/verify` | 10/minute | 新用戶註冊驗證 |
| `/authenticate/options` | 20/minute | 登入選項 |
| `/authenticate/verify` | 20/minute | 登入驗證 |
| `/credentials` | 30/minute | 列出 Passkeys |
| `/register/options` | 10/minute | 新增 Passkey |
| `/credentials/:id/name` | 20/minute | 更新名稱 |
| `/credentials/:id` | 10/minute | 刪除 Passkey |

### 驗證 Rate Limiting

```bash
# 快速連續發送請求測試限流
for i in {1..15}; do
  curl https://wastelandtarot.com/api/v1/webauthn/register-new/options \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","name":"Test"}' &
done

# 預期第 11 個請求開始回傳 429 Too Many Requests
```

---

## 安全檢查

### Security Headers 檢查

後端已自動啟用以下 Security Headers（通過 `SecurityHeadersMiddleware`）：

```python
# Production 環境自動啟用
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: geolocation=(), microphone=(), camera=()
Referrer-Policy: strict-origin-when-cross-origin
```

驗證：

```bash
curl -I https://wastelandtarot.com/api/health | grep -E "X-|Strict|Content-Security"
```

### 敏感資訊檢查

- [ ] 環境變數不包含在原始碼中
- [ ] `.env` 檔案已加入 `.gitignore`
- [ ] 日誌不包含敏感資訊（已自動過濾 password, token, api_key）
- [ ] 錯誤訊息不洩漏內部實作細節
- [ ] Credential ID 已截斷顯示（only first 20 chars + "..."）

### SQL Injection 防護

- [x] 使用 SQLAlchemy ORM（自動參數化查詢）
- [x] 所有查詢使用 ORM 而非原始 SQL
- [x] 用戶輸入經過驗證（Pydantic schemas）

### XSS 防護

- [x] API 只回傳 JSON（不渲染 HTML）
- [x] 前端使用 React（自動 escape）
- [x] CSP Header 已啟用

### CSRF 防護

- [x] JWT tokens 使用 httpOnly cookies（防止 XSS）
- [x] SameSite=Lax 設定（防止 CSRF）
- [x] CORS 嚴格白名單

---

## 監控與日誌

### 健康檢查端點

```bash
# 檢查 API 健康狀態
curl https://wastelandtarot.com/api/health

# 預期輸出:
# {"status":"healthy"}
```

### 日誌配置

日誌已自動配置（`app/core/logging_config.py`）：

```python
# 日誌級別（環境變數控制）
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# 日誌格式（JSON 格式，易於解析）
{
    "timestamp": "2025-10-28T12:00:00Z",
    "level": "INFO",
    "message": "Passkey registration successful",
    "user_id": "uuid",
    "event_type": "passkey_registration"
}
```

### 安全事件日誌

所有 WebAuthn 相關操作已自動記錄：

- Passkey 註冊（成功/失敗）
- Passkey 登入（成功/失敗）
- Credential 新增/更新/刪除
- Counter 回退錯誤（CRITICAL 級別）
- 驗證失敗（WARNING 級別）

查看日誌：

```bash
# 查看所有日誌
tail -f /var/log/wasteland_tarot/app.log

# 只看安全事件
grep "SecurityEvent" /var/log/wasteland_tarot/app.log

# 只看錯誤
grep "ERROR\|CRITICAL" /var/log/wasteland_tarot/app.log
```

### Sentry 整合（可選）

如果已設定 `SENTRY_DSN`：

```bash
# 驗證 Sentry 連線
curl -X POST https://your-sentry-dsn@sentry.io/api/test
```

---

## 測試驗證

### 後端測試

```bash
cd backend

# 執行所有測試
pytest

# 執行 WebAuthn 相關測試
pytest tests/unit/webauthn/
pytest tests/unit/middleware/
pytest tests/performance/

# 測試覆蓋率
pytest --cov=app --cov-report=html
```

預期結果：

- 所有測試通過
- 覆蓋率 ≥85%

### 前端測試

```bash
cd frontend

# 執行所有測試
bun test

# 執行 WebAuthn 相關測試
bun test src/lib/webauthn
bun test src/components/auth

# E2E 測試（需要前後端運行）
bun test:e2e
```

### 整合測試

```bash
# 啟動後端
cd backend
uvicorn app.main:app --reload

# 啟動前端
cd frontend
bun dev

# 執行 E2E 測試
cd tests/e2e
bun test
```

### 手動測試流程

#### 1. 新用戶 Passkey 註冊

- [ ] 訪問 `/register`
- [ ] 輸入 email 和 name
- [ ] 點擊「使用 Passkey 註冊」
- [ ] 完成生物辨識
- [ ] 驗證成功重導向至 dashboard
- [ ] 檢查 Karma 獎勵（+50）

#### 2. Passkey 登入

- [ ] 訪問 `/login`
- [ ] 輸入 email（Email-guided）
- [ ] 點擊「使用 Passkey 登入」
- [ ] 完成生物辨識
- [ ] 驗證成功重導向至 dashboard

#### 3. Credential 管理

- [ ] 訪問 `/settings/passkeys`
- [ ] 查看所有 Passkeys
- [ ] 新增 Passkey
- [ ] 編輯 Passkey 名稱
- [ ] 刪除 Passkey（驗證無法刪除最後一個）

---

## 部署後驗證

### 1. API 端點檢查

```bash
# 健康檢查
curl https://wastelandtarot.com/api/health

# API 文件
curl https://wastelandtarot.com/api/docs
curl https://wastelandtarot.com/api/redoc

# WebAuthn 註冊選項（應回傳 200）
curl -X POST https://wastelandtarot.com/api/v1/webauthn/register-new/options \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### 2. 功能驗證

- [ ] 新用戶可使用 Passkey 註冊
- [ ] 已登入用戶可新增 Passkey
- [ ] 使用者可使用 Passkey 登入
- [ ] 使用者可管理 Passkeys（列表、編輯、刪除）
- [ ] Rate Limiting 正常運作（超過限制回傳 429）
- [ ] Security Headers 已啟用
- [ ] HTTPS 強制執行（HTTP 自動重導向）

### 3. 瀏覽器相容性測試

在以下瀏覽器測試：

- [ ] Chrome/Edge（Chromium）- Desktop
- [ ] Firefox - Desktop
- [ ] Safari - Desktop
- [ ] Chrome - Android
- [ ] Safari - iOS

### 4. 效能驗證

```bash
# 使用 Apache Bench 測試
ab -n 100 -c 10 https://wastelandtarot.com/api/health

# 預期：
# - 所有請求成功（200 OK）
# - 平均回應時間 < 200ms
# - 無 5xx 錯誤
```

### 5. 監控儀表板

- [ ] 檢查日誌系統正常運作
- [ ] 檢查 Sentry 錯誤監控（如果啟用）
- [ ] 設定告警規則（錯誤率、回應時間）

---

## 回滾計畫

如果部署失敗，請依照以下步驟回滾：

### 1. 資料庫回滾

```bash
# 回退遷移
alembic downgrade -1

# 或恢復備份
psql -U user -d wasteland_tarot < backup_20251028_120000.sql
```

### 2. 程式碼回滾

```bash
# Git 回滾到上一個穩定版本
git revert HEAD
# 或
git reset --hard <previous-stable-commit>

# 重新部署
git push origin main --force
```

### 3. 服務重啟

```bash
# 重啟後端
sudo systemctl restart wasteland-tarot-backend

# 重啟前端
sudo systemctl restart wasteland-tarot-frontend

# 重啟 Nginx
sudo systemctl restart nginx
```

### 4. 通知使用者

如果需要停機維護：

- 在網站首頁顯示維護公告
- 發送 email 通知已註冊用戶
- 更新社群媒體狀態

---

## 支援與聯絡

如果遇到問題，請聯絡：

- **技術支援**: tech@wastelandtarot.com
- **緊急聯絡**: +886-XXX-XXXXXX
- **文件**: https://docs.wastelandtarot.com

---

## 附錄

### A. 常見錯誤與解決方案

#### 問題 1: Redis 連線失敗

**錯誤訊息**: `redis.exceptions.ConnectionError: Error connecting to Redis`

**解決方案**:

1. 檢查 Redis 是否運行：`redis-cli ping`
2. 檢查 `REDIS_URL` 環境變數
3. 檢查防火牆設定

#### 問題 2: 資料庫遷移失敗

**錯誤訊息**: `alembic.util.exc.CommandError: Target database is not up to date.`

**解決方案**:

1. 檢查當前版本：`alembic current`
2. 查看遷移歷史：`alembic history`
3. 手動執行遷移：`alembic upgrade head`

#### 問題 3: CORS 錯誤

**錯誤訊息**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**解決方案**:

1. 檢查 `BACKEND_CORS_ORIGINS` 包含正確的 origin
2. 確認 origin 包含協議（http:// 或 https://）
3. 重啟後端服務

### B. 效能調校建議

#### 資料庫連線池

```python
# backend/app/db/session.py
engine = create_engine(
    SQLALCHEMY_DATABASE_URI,
    pool_size=20,           # 連線池大小
    max_overflow=10,        # 最大溢出連線
    pool_pre_ping=True,     # 檢查連線有效性
    pool_recycle=3600       # 連線回收時間（1 小時）
)
```

#### Redis 連線池

```python
# backend/app/core/redis.py
redis_pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    db=0,
    max_connections=50
)
```

#### Gunicorn Worker 設定

```bash
# Production 部署建議
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 300 \
  --access-logfile /var/log/wasteland_tarot/access.log \
  --error-logfile /var/log/wasteland_tarot/error.log
```

Worker 數量建議：`(2 x CPU cores) + 1`

---

**部署檢查清單最後更新**: 2025-10-28
**維護者**: Wasteland Tarot DevOps Team
