# 記憶體優化快速開始 🚀

**目標**: 將後端記憶體使用從 ~400MB 降低到 ~280-320MB

---

## 快速設定（3 步驟）

### 1️⃣ 更新 `.env` 檔案

在你的 `.env` 檔案中加入或修改以下設定：

```bash
# 記憶體優化配置
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=5
ENABLE_BINGO_COLD_START_CHECK=false
ENABLE_SCHEDULER=true
```

**說明**:
- `DATABASE_POOL_SIZE=3`: 減少資料庫連線池（從 5 降到 3）
- `ENABLE_BINGO_COLD_START_CHECK=false`: 關閉啟動時的 Bingo 號碼檢查（節省 ~10MB）
- `ENABLE_SCHEDULER=true`: 保持排程器啟用（如果不需要 Bingo 功能可設為 `false`）

### 2️⃣ 重新安裝依賴

```bash
cd backend
uv sync
```

這會移除未使用的 TTS 套件（edge-tts 和 gtts），節省 ~20-30MB。

### 3️⃣ 重啟後端

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 驗證優化效果

### 方法 1: 使用檢查腳本（推薦）

```bash
cd backend
python check_memory.py
```

**預期輸出**:
```
🧠 後端記憶體使用情況檢查
============================================================

🔍 搜尋 Python/Uvicorn 進程...

✅ 找到 1 個相關進程

📊 PID 12345 (python3.11)
   RSS: 285.43 MB
   CPU: 2.1%
   執行緒: 8

💰 總記憶體使用: 285.43 MB

📈 分析結果:
   🟢 記憶體使用良好 (285MB)
```

### 方法 2: 使用 API Endpoint

```bash
curl http://localhost:8000/api/v1/monitoring/metrics/memory | jq
```

**預期回應**:
```json
{
  "status": "success",
  "memory": {
    "rss_mb": 285.43,
    "vms_mb": 512.18,
    "percent": 3.52
  },
  "cpu": {
    "percent": 2.1
  }
}
```

### 方法 3: 手動檢查（macOS/Linux）

```bash
# 找到進程
ps aux | grep uvicorn | grep -v grep

# 詳細記憶體資訊
top -pid $(pgrep -f "uvicorn app.main")
```

---

## 結果評估

| 記憶體使用 | 評級 | 說明 |
|----------|------|------|
| < 200MB | ✅ 優秀 | 極度優化 |
| 200-300MB | 🟢 良好 | 達成目標 |
| 300-350MB | 🟡 中等 | 可接受，可進一步優化 |
| > 350MB | ⚠️ 偏高 | 需要檢查配置 |

---

## 啟動日誌檢查

優化成功後，你應該看到以下日誌：

```log
🏭 Starting Wasteland Tarot API...
💾 Database initialized
⏰ Scheduler disabled (ENABLE_SCHEDULER=false)  # 如果你關閉了排程器
🔍 Bingo cold start check disabled (ENABLE_BINGO_COLD_START_CHECK=false)
```

或者（如果保留排程器）：

```log
🏭 Starting Wasteland Tarot API...
💾 Database initialized
⏰ APScheduler started with bingo jobs registered
🔍 Bingo cold start check disabled (ENABLE_BINGO_COLD_START_CHECK=false)
```

---

## 常見問題

### Q: 關閉 `ENABLE_BINGO_COLD_START_CHECK` 會影響功能嗎？

**A**: 不會。這個檢查只是在啟動時確保當天的 Bingo 號碼存在。如果號碼不存在，排程器會在每日 00:00 自動生成。唯一的差異是：

- **啟用**: 啟動時立即生成（如果缺失）
- **關閉**: 等到排程器執行時生成

如果你的服務持續運行（不頻繁重啟），關閉這個檢查沒有問題。

### Q: 我應該關閉 `ENABLE_SCHEDULER` 嗎？

**A**: 僅在以下情況關閉：
- ✅ 你不使用 Bingo 功能
- ✅ 你不需要每日自動任務

如果你使用 Bingo 系統，**必須保持 `ENABLE_SCHEDULER=true`**。

### Q: 記憶體還是沒降到預期值？

**檢查清單**:
1. 確認 `.env` 配置正確
2. 確認執行了 `uv sync`
3. 確認完全重啟了服務（不是 reload）
4. 檢查是否有多個 Python 進程在運行：`ps aux | grep python`
5. 等待 1-2 分鐘讓記憶體穩定

### Q: 如何恢復原始配置？

修改 `.env`:
```bash
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
ENABLE_BINGO_COLD_START_CHECK=true
ENABLE_SCHEDULER=true
```

然後重啟服務。

---

## 進一步優化

如果還需要更低的記憶體使用，參考：

- 📋 **完整計畫**: `MEMORY_OPTIMIZATION_PLAN.md`
- 📝 **詳細總結**: `MEMORY_OPTIMIZATION_SUMMARY.md`

**進階選項**:
- Phase 2: 條件式載入非核心 endpoints (~100MB)
- Phase 3: AI Provider 外部化 (~50MB)

---

## 支援

遇到問題？檢查：
1. 日誌檔案: `backend/logs/`
2. 啟動日誌中的錯誤訊息
3. 執行 `python check_memory.py` 取得詳細資訊

---

**優化完成時間**: 3-5 分鐘  
**預期效果**: 記憶體使用 ↓ 20-30% (80-120MB)  
**難度**: ⭐ 簡單
