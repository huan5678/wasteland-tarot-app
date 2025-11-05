# Zeabur 部署快速指南

## ✅ 已完成準備工作

### 1. 代碼配置 ✅
- [x] Next.js 啟用 standalone output
- [x] Backend Dockerfile (使用 uv)
- [x] .dockerignore 檔案 (frontend & backend)
- [x] zbpack.json 配置檔
- [x] Auth 頁面 Suspense boundary 修復
- [x] 測試建置成功 (63MB standalone)

### 2. Git 提交 ✅
- [x] 所有更改已提交
- [x] 已推送到 GitHub main branch

## 📋 下一步：Zeabur 部署

### Phase 1: 帳號設定 (5 分鐘)

1. **註冊 Zeabur**
   - 訪問: https://zeabur.com
   - 使用 GitHub 登入
   - 連接你的 GitHub 帳號

2. **選擇計費方案**
   - 推薦: Developer Plan ($5/月，包含 $5 credit)
   - 或: Free Trial (測試用)

3. **建立專案**
   ```bash
   專案名稱: wasteland-tarot
   區域: 選擇最近的區域 (建議 Tokyo/Singapore)
   ```

### Phase 2: 資料庫部署 (5 分鐘)

#### PostgreSQL
1. 點擊 "Add Service" → "PostgreSQL"
2. 點擊 "Deploy"
3. 等待部署完成
4. 複製連接字串 (保存備用)

#### Redis
1. 點擊 "Add Service" → "Redis"  
2. 點擊 "Deploy"
3. 等待部署完成
4. 連接變數會自動注入

### Phase 3: 後端部署 (15 分鐘)

1. **添加服務**
   - 點擊 "Add Service" → "Git Repository"
   - 選擇 `wasteland-tarot-app` repo
   - Branch: `main`

2. **配置設定**
   ```
   Service Name: backend
   Root Directory: ./backend
   Build Command: (自動偵測 Dockerfile)
   Start Command: (自動偵測)
   ```

3. **環境變數** (手動設定)
   ```bash
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-service-role-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # AI APIs
   ANTHROPIC_API_KEY=sk-...
   OPENAI_API_KEY=sk-...
   GOOGLE_API_KEY=...
   
   # Environment
   ENVIRONMENT=production
   DEBUG=false
   LOG_LEVEL=INFO
   
   # Database (自動注入)
   # POSTGRES_CONNECTION_STRING - 自動
   # REDIS_CONNECTION_STRING - 自動
   ```

4. **部署**
   - 點擊 "Deploy"
   - 等待建置 (約 3-5 分鐘)
   - 檢查日誌確認成功

5. **測試 Health Check**
   ```bash
   curl https://your-backend-url.zeabur.app/health
   ```

### Phase 4: 前端部署 (15 分鐘)

1. **添加服務**
   - 點擊 "Add Service" → "Git Repository"
   - 選擇相同的 repo
   - Branch: `main`

2. **配置設定**
   ```
   Service Name: frontend
   Root Directory: ./
   Framework: Next.js (自動偵測)
   Build Command: bun install && bun run build
   Start Command: node .next/standalone/server.js
   Node Version: 18
   ```

3. **環境變數** ⚠️ **重要：正確配置內部域名**
   ```bash
   # Supabase (前端可見)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # 🔒 Backend API URL (伺服器端專用 - 使用 Zeabur 內部域名)
   # ⚠️ 注意：不要使用 NEXT_PUBLIC_ 前綴！
   # ⚠️ 格式：http://<service-name>.zeabur.internal:<port>
   API_BASE_URL=http://wasteland-tarot-app.zeabur.internal:8080
   
   # 網站 URL
   NEXT_PUBLIC_SITE_URL=https://wt.ai-404.app
   
   # ❌ 錯誤示範：
   # NEXT_PUBLIC_API_URL=wasteland-tarot-app.zeabur.internal:8080
   # ↑ 瀏覽器無法訪問內部域名！
   
   # ✅ 正確架構：
   # 瀏覽器 → /api/v1/* → Next.js Proxy → 內部後端
   #                      ↑ 使用 API_BASE_URL
   ```

4. **部署**
   - 點擊 "Deploy"
   - 等待建置 (約 2-4 分鐘)
   - 建置成功後會自動提供 URL

5. **測試網站**
   - 訪問提供的 URL
   - 測試首頁載入
   - 測試登入/註冊功能

### Phase 5: 資料庫遷移 (10 分鐘)

#### 選項 A: 本地執行 (推薦)

1. **取得 PostgreSQL 連接字串**
   - 從 Zeabur Dashboard 複製

2. **執行遷移**
   ```bash
   cd backend
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   uv run alembic upgrade head
   ```

#### 選項 B: 使用 Zeabur 臨時服務

1. 建立新服務 (Docker)
2. 使用 backend Dockerfile
3. 覆蓋 CMD: `["alembic", "upgrade", "head"]`
4. 運行後刪除服務

### Phase 6: 域名設定 (10 分鐘)

1. **添加自定義域名** (可選)
   ```
   Frontend Service → Settings → Domains
   添加你的域名: wastelandtarot.com
   ```

2. **DNS 設定**
   ```
   Type: CNAME
   Name: @ (or www)
   Value: <zeabur-provided-domain>
   ```

3. **等待 SSL 憑證生成**
   - 約 5 分鐘
   - 自動 Let's Encrypt

## 🔍 驗證部署

### 功能測試清單

- [ ] 首頁載入正常
- [ ] 用戶註冊成功
- [ ] 用戶登入成功
- [ ] Google OAuth 登入
- [ ] Passkey 登入 (如已設定)
- [ ] 占卜功能正常
- [ ] AI 解讀功能
- [ ] 語音播放功能
- [ ] 成就系統
- [ ] 賓果遊戲
- [ ] 音樂播放器

### 效能測試

```bash
# 1. API 回應時間
curl -w "@-" -o /dev/null -s https://your-backend-url/health <<'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_starttransfer: %{time_starttransfer}\n
----------\n
time_total:       %{time_total}\n
EOF

# 2. Frontend 首頁載入
# 使用 Chrome DevTools > Network > Performance
```

## 📊 監控設定

### Zeabur Dashboard

1. **實時日誌**
   ```
   Service → Logs tab
   可過濾、搜尋
   ```

2. **指標查看**
   ```
   Service → Metrics tab
   - CPU 使用率
   - Memory 使用率
   - Network 流量
   ```

3. **告警設定** (可選)
   - Service down 時發送通知
   - 設定 Email/Slack webhook

## 🔄 日常部署流程

### 自動部署 (推薦)

```bash
# 1. 修改代碼
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. Zeabur 自動執行:
# - 偵測 push 事件
# - 拉取最新代碼
# - 建置映像
# - 運行測試
# - 部署新版本
# - 健康檢查
# - 失敗時自動 rollback
```

### 手動部署

```
Dashboard → Service → Deployments → "Redeploy"
```

## 🐛 故障排除

### 常見問題

**Q1: 靜態資源 404 錯誤 (CSS/JS 找不到)**
```bash
# 症狀:
# - 網頁可以打開但樣式全無
# - Console 顯示大量 404 錯誤：*.css, *.js 找不到
# - 錯誤: Failed to load resource: the server responded with a status of 404

# 原因:
# Next.js standalone 模式需要手動複製 public/ 和 .next/static/

# 解決方案:
# 1. 檢查 zbpack.json 的 build_command:
#    應該包含: && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
# 2. 重新部署
# 3. 已修復 ✅ (commit: fix: copy static assets for Zeabur standalone deployment)
```

**Q2: 瀏覽器無法連接後端 (URL scheme not supported)**
```bash
# 症狀:
# - Console 錯誤: URL scheme "wasteland-tarot-app.zeabur.internal" is not supported
# - 或: Fetch API cannot load wasteland-tarot-app.zeabur.internal:8080

# 原因:
# ❌ 前端代碼直接使用了內部域名 (瀏覽器無法訪問)

# 解決方案:
# 1. 客戶端代碼應該使用相對路徑: /api/v1/*
# 2. Next.js API Route Proxy 使用 API_BASE_URL (server-side) 轉發到內部後端
# 3. 檢查環境變數設置:
#    ✓ API_BASE_URL=http://wasteland-tarot-app.zeabur.internal:8080  (server-side)
#    ❌ 不要使用 NEXT_PUBLIC_API_URL (瀏覽器無法訪問內部域名)
# 4. 已修復 ✅ (使用 apiClient 和相對路徑)
```

**Q3: Frontend 建置失敗**
```bash
# 檢查:
1. bun.lockb 是否已提交
2. .env 變數是否正確設定
3. Build logs 中的具體錯誤
```

**Q4: Backend 無法連接資料庫**
```bash
# 檢查:
1. POSTGRES_CONNECTION_STRING 是否自動注入
2. PostgreSQL 服務是否正常運行
3. Backend logs 中的連接錯誤
```

**Q5: 502 Bad Gateway**
```bash
# 檢查:
1. Backend 服務健康狀態
2. Port 設定 (應為 8000)
3. Health check endpoint 是否正常
```

**Q6: Environment variables 沒有生效**
```bash
# 解決:
1. 檢查變數名稱拼寫
2. 重新部署服務 (變數更新需要重啟)
3. 確認 NEXT_PUBLIC_ 前綴 (frontend public vars)
```

## 💰 成本估算

### 預估月費

```
Zeabur Developer Plan:  $5/月 (base + credit)
預估用量:
  - Memory:             $0.03
  - Network:            $1.00
  - Storage:            $1.00
  
實際成本: ~$2-5/月

AI Services:
  - Claude API:         $5-20/月
  - OpenAI API:         $5-15/月
  - Google TTS:         $2-10/月
  
總計: $14-50/月
```

## 📚 參考資源

- [Zeabur 官方文檔](https://zeabur.com/docs)
- [Next.js Standalone 文檔](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL on Zeabur](https://zeabur.com/templates/B20CX0)
- [Redis on Zeabur](https://zeabur.com/templates/JM0DSX)

## 🎉 部署完成

恭喜！你的廢土塔羅應用已成功部署到 Zeabur！

**下一步建議**:
1. 設定 Google Analytics (追蹤使用數據)
2. 設定 Sentry (錯誤追蹤)
3. 優化 SEO (meta tags, sitemap)
4. 實施 A/B Testing
5. 監控效能指標

有問題請參考 `DOCKER_DEPLOYMENT_PLAN.md` 獲取更詳細的技術文檔。
