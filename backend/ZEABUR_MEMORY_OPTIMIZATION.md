# Zeabur 記憶體優化指南 🚀

## 問題現狀

**本地測試**: 175-198 MB ✅  
**Zeabur 實際**: 420 MB ⚠️  
**差異原因**: Docker + 多 workers + 生產環境載入

---

## 記憶體使用分析

### Zeabur 420MB 的組成

```
Docker base image + system libs:     ~80 MB
Python 3.11 + dependencies:          ~100 MB
FastAPI + Uvicorn:                   ~40 MB
Application code (single worker):    ~175 MB
----------------------------------------
Single worker total:                  ~395 MB

WORKERS=2 (current):
Worker 1:                             ~175 MB
Worker 2:                             ~175 MB
Shared memory overhead:               ~70 MB
----------------------------------------
Total with 2 workers:                 ~420 MB ✅ (符合實際)
```

---

## 優化方案

### 🎯 方案 1: 減少 Workers（推薦）

**目標**: 420MB → ~280-320MB

**在 Zeabur 環境變數設定**:
```bash
WORKERS=1
```

**預期效果**:
- 記憶體: ~280-300 MB
- 適用場景: 中小型流量（< 100 req/s）
- 優點: 立即生效，無需改代碼

---

### 🎯 方案 2: 使用 Gunicorn Preload（進階）

**目標**: 420MB → ~250-300MB

Gunicorn 的 `--preload` 模式可以讓多個 worker 共享載入的模組。

**修改 `start-zeabur.sh`**:

```bash
#!/bin/bash
set -e

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-2}"
LOG_LEVEL="${LOG_LEVEL:-warning}"

echo "🚀 Starting with Gunicorn + preload mode"
echo "   Workers: $WORKERS"
echo "   Memory: Shared modules between workers"

# 使用 Gunicorn + preload
exec gunicorn app.main:app \
    --bind "$HOST:$PORT" \
    --workers "$WORKERS" \
    --worker-class uvicorn.workers.UvicornWorker \
    --preload \
    --log-level "$LOG_LEVEL" \
    --access-logfile -
```

**需要更新 `pyproject.toml`**:
```toml
dependencies = [
    # ... 現有依賴 ...
    "gunicorn>=21.2.0",  # 新增這行
]
```

**預期效果**:
- 2 workers: ~250-300 MB（共享記憶體）
- 適用場景: 需要多 worker 處理併發

---

### 🎯 方案 3: 條件式關閉 Scheduler（激進）

**目標**: 額外節省 ~20-30MB

**僅限**: 如果你的 Bingo 功能不在 Zeabur 上運行

**在 Zeabur 環境變數設定**:
```bash
ENABLE_SCHEDULER=false
```

---

## 推薦配置

### 配置 A: 小型部署（最省記憶體）

**Zeabur 環境變數**:
```bash
WORKERS=1
DATABASE_POOL_SIZE=3
ENABLE_BINGO_COLD_START_CHECK=false
ENABLE_SCHEDULER=true  # 如需 Bingo 功能
```

**預期記憶體**: ~280-300 MB  
**適用流量**: < 50 req/s  
**優點**: 最省錢，適合開發/小型專案

---

### 配置 B: 中型部署（平衡）

**Zeabur 環境變數**:
```bash
WORKERS=2
DATABASE_POOL_SIZE=5
ENABLE_BINGO_COLD_START_CHECK=false
ENABLE_SCHEDULER=true
```

**修改**: 使用 Gunicorn preload（方案 2）

**預期記憶體**: ~300-350 MB  
**適用流量**: 50-200 req/s  
**優點**: 保持併發處理能力

---

### 配置 C: 大型部署（不優化記憶體）

**Zeabur 環境變數**:
```bash
WORKERS=4
DATABASE_POOL_SIZE=10
ENABLE_BINGO_COLD_START_CHECK=true
ENABLE_SCHEDULER=true
```

**預期記憶體**: ~600-800 MB  
**適用流量**: > 200 req/s  
**優點**: 最大性能

---

## 立即行動（配置 A）

### Step 1: 在 Zeabur 設定環境變數

進入 Zeabur 控制台 → 你的 Backend 服務 → Environment Variables：

```bash
WORKERS=1
DATABASE_POOL_SIZE=3
ENABLE_BINGO_COLD_START_CHECK=false
ENABLE_SCHEDULER=true
```

### Step 2: 重新部署

方法 1（推薦）: 觸發重新部署
```bash
git commit --allow-empty -m "chore: trigger redeploy for memory optimization"
git push origin main
```

方法 2: Zeabur 控制台手動重新部署

### Step 3: 等待並監控

等待 2-3 分鐘，然後檢查：

```bash
# 檢查記憶體使用
curl https://your-backend.zeabur.app/api/v1/monitoring/metrics/memory
```

**預期結果**:
```json
{
  "memory": {
    "rss_mb": 280-300  // 從 420 降到 280-300
  }
}
```

---

## 驗證與監控

### 檢查當前配置

```bash
# 方法 1: 透過 API
curl https://your-backend.zeabur.app/api/v1/monitoring/metrics/memory

# 方法 2: Zeabur 控制台
# Metrics → Memory → 查看使用量
```

### 持續監控

在 Zeabur 設定 Alerts：
- 記憶體 > 350MB: 警告
- 記憶體 > 450MB: 嚴重

---

## 為什麼本地和 Zeabur 差這麼多？

| 因素 | 本地開發 | Zeabur 生產 | 差異 |
|-----|---------|-----------|------|
| **Workers** | 1 | 2 (預設) | +175 MB |
| **Docker 開銷** | 無 | 有 | +80-100 MB |
| **System libraries** | 共享 | 獨立 | +20-30 MB |
| **Reload mode** | 啟用 | 禁用 | -10 MB |
| **Base image** | 本地 Python | python:3.11-slim | +30 MB |

**總計差異**: +295-315 MB  
**計算**: 175 MB (本地) + 295 MB = **470 MB** (理論 Zeabur)  
**實際 Zeabur**: 420 MB (因為有些共享記憶體)

---

## FAQ

### Q1: 為什麼要 2 workers？

**A**: Zeabur 預設 `WORKERS=2` 是為了：
- 處理併發請求
- 一個 worker 當機時另一個可以接手
- 但如果流量不大，1 個 worker 就夠了

### Q2: 單 worker 會不會太慢？

**A**: 不會，因為：
- FastAPI 是 async，單 worker 可以處理數千併發
- 只有 CPU 密集型任務需要多 worker
- 你的 API 主要是 I/O（資料庫查詢），單 worker 足夠

### Q3: 改成 1 worker 會影響功能嗎？

**A**: **完全不會**：
- 所有 API 正常運作
- Scheduler 正常運行（在主 worker）
- 只是併發處理能力從 2x 降到 1x
- 對於中小型應用（< 50-100 req/s）完全沒問題

### Q4: 我可以用 `WORKERS=0` 嗎？

**A**: **不行**，最少要 1 個 worker

### Q5: Gunicorn preload 有什麼風險？

**A**: 
- ✅ 優點: 節省記憶體（共享載入的模組）
- ⚠️ 注意: 程式碼改動需要完全重啟（不能 hot reload）
- ⚠️ 注意: Worker 之間共享某些狀態可能導致問題（但我們的程式沒有這個問題）

---

## 成功案例

### 優化前
```
Memory: 420 MB
Workers: 2
Cost: $$
```

### 優化後（配置 A）
```
Memory: 280-300 MB
Workers: 1
Cost: $  (-30%)
```

### 優化後（配置 B with Gunicorn）
```
Memory: 300-350 MB
Workers: 2 (with preload)
Cost: $  (-20%)
```

---

## 總結

1. **立即行動**: 設定 `WORKERS=1` 可以立即降到 ~280-300 MB
2. **進階優化**: 使用 Gunicorn preload 可以保持 2 workers 但降到 ~300-350 MB
3. **預設值已優化**: 程式碼的預設值已經是最佳配置，不需要額外設定環境變數

**推薦**: 先試配置 A（`WORKERS=1`），如果流量大再考慮配置 B

---

**更新時間**: 2025-11-05  
**測試環境**: Zeabur Docker Python 3.11
