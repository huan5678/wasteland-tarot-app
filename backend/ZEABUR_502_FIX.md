# Zeabur 502 錯誤修復

## 🔍 問題分析

502 錯誤通常表示：
1. ❌ Backend 服務啟動失敗
2. ❌ PORT 環境變數配置不正確
3. ❌ 健康檢查失敗

## ✅ 已修復的問題

### 1. PORT 環境變數支援
```bash
# start-zeabur.sh
PORT="${PORT:-8000}"  # 自動使用 Zeabur 提供的 PORT
```

### 2. 健康檢查路徑
```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1
```

### 3. Zeabur 配置
```json
// zbpack.json
{
  "dockerfile": "Dockerfile",
  "port": 8000,
  "healthcheck": {
    "path": "/health",
    "timeout": 10
  }
}
```

## 🚀 部署後驗證步驟

### 1. 檢查 Zeabur 日誌
```
1. 進入 Zeabur Dashboard
2. 選擇 Backend 服務
3. 點擊 "Logs" 標籤
4. 查找:
   ✅ "Starting Wasteland Tarot Backend on Zeabur"
   ✅ "Application startup complete"
   ❌ 任何錯誤訊息
```

### 2. 測試端點
```bash
# 替換為你的實際域名
BACKEND_URL="https://your-backend.zeabur.app"

# 1. 根路徑
curl $BACKEND_URL/
# 預期: JSON 回應包含 "Welcome to the Wasteland Tarot API"

# 2. 健康檢查
curl $BACKEND_URL/health
# 預期: {"status": "healthy"}

# 3. API v1 健康檢查
curl $BACKEND_URL/api/v1/monitoring/health
# 預期: {"status": "healthy"}

# 4. 記憶體監控
curl $BACKEND_URL/api/v1/monitoring/metrics/memory
# 預期: JSON 包含 memory 資訊
```

## 🔧 常見問題排查

### 問題 1: 仍然 502 錯誤

**檢查 Zeabur 環境變數**:
```
在 Zeabur Dashboard > Backend > Variables 確認:
✅ DATABASE_URL
✅ SUPABASE_URL
✅ SUPABASE_KEY
✅ SECRET_KEY
✅ 其他必要的環境變數
```

**檢查 Zeabur 日誌**:
```
查找錯誤關鍵字:
- "Connection refused"
- "ImportError"
- "ModuleNotFoundError"
- "Database connection failed"
```

### 問題 2: 啟動時間過長

**增加健康檢查寬限期**:
```dockerfile
# 如果啟動需要較長時間，增加 start-period
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3
```

### 問題 3: 資料庫連接失敗

**檢查 DATABASE_URL 格式**:
```bash
# Supabase 應該使用 Transaction Pooler (port 6543)
postgresql://postgres:[password]@[host]:6543/postgres

# 不是 Session Pooler (port 5432)
```

**驗證資料庫連接**:
```python
# 在 Zeabur Shell 中測試
python -c "from app.db.session import init_db; import asyncio; asyncio.run(init_db())"
```

### 問題 4: 記憶體不足

**當前配置已優化**:
```
Workers: 2
Database Pool: 5
Memory Target: 220-450MB
```

**如果仍然不足，可以調整**:
```bash
# 在 Zeabur 環境變數中設置
WORKERS=1  # 減少到 1 個 worker
```

## 📊 健康指標

### 正常運行指標
```
✅ Memory: 220-450MB
✅ CPU: < 50%
✅ Response Time: < 500ms
✅ Health Check: 200 OK
✅ Error Rate: < 1%
```

### 異常指標
```
❌ Memory: > 600MB
❌ CPU: > 90%
❌ Response Time: > 3s
❌ Health Check: Timeout
❌ Error Rate: > 5%
```

## 🎯 快速測試腳本

創建 `test-zeabur.sh`:
```bash
#!/bin/bash
BACKEND_URL="https://your-backend.zeabur.app"

echo "🔍 Testing Zeabur Backend..."
echo ""

echo "1. Root endpoint:"
curl -s $BACKEND_URL/ | jq -r '.message'

echo ""
echo "2. Health check:"
curl -s $BACKEND_URL/health | jq -r '.status'

echo ""
echo "3. Memory usage:"
curl -s $BACKEND_URL/api/v1/monitoring/metrics/memory | jq '.memory.rss_mb'

echo ""
echo "4. Response time test:"
time curl -s $BACKEND_URL/health > /dev/null

echo ""
echo "✅ Tests complete!"
```

## 📝 Zeabur 特定配置

### 必要的環境變數
```bash
# 在 Zeabur Dashboard 設置
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=warning

# 資料庫 (Transaction Pooler)
DATABASE_URL=postgresql://...@...zeabur.com:6543/...

# Supabase
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# 安全性
SECRET_KEY=your-secret-key-here

# AI Providers (可選)
OPENAI_API_KEY=...
GEMINI_API_KEY=...

# CORS (前端域名)
BACKEND_CORS_ORIGINS=https://your-frontend.zeabur.app
FRONTEND_URL=https://your-frontend.zeabur.app
```

### Zeabur 特定設置
```json
{
  "dockerfile": "Dockerfile",
  "port": 8000,
  "healthcheck": {
    "path": "/health",
    "timeout": 10
  },
  "build_args": {
    "ENVIRONMENT": "production"
  }
}
```

## 🆘 仍然無法解決？

### 1. 檢查 Zeabur 狀態
- https://status.zeabur.com

### 2. 查看完整日誌
```bash
# 在 Zeabur Dashboard
Services > Backend > Logs > 展開所有
```

### 3. 嘗試重新部署
```bash
# 方法 1: Zeabur Dashboard
Services > Backend > Redeploy

# 方法 2: Git 推送
git commit --allow-empty -m "trigger rebuild"
git push origin main
```

### 4. 回滾到上個版本
```bash
git revert HEAD
git push origin main
```

## ✅ 修復檢查清單

- [ ] 確認 Dockerfile 包含 start-zeabur.sh
- [ ] 確認 zbpack.json 配置正確
- [ ] 確認所有環境變數已設置
- [ ] 確認資料庫 URL 使用 port 6543
- [ ] 確認 CORS 允許前端域名
- [ ] 查看 Zeabur 部署日誌
- [ ] 測試 /health 端點
- [ ] 確認記憶體在 220-450MB 範圍

---

**創建時間**: 2025-11-05
**狀態**: 🔧 修復中
**預期**: 部署後應該正常運行
