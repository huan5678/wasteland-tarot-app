# Tasks Reset Cron Job 設定指南

此文檔說明如何設定自動任務重置的 Cron Job。

## 📋 前置要求

1. **專案路徑**：確認你的專案完整路徑
   ```bash
   pwd  # 在專案根目錄執行
   # 輸出例如：/Users/sean/Documents/React/tarot-card-nextjs-app
   ```

2. **Python 環境**：確認 uv 已安裝
   ```bash
   which uv
   # 輸出例如：/usr/local/bin/uv
   ```

3. **資料庫連線**：確認 `.env` 檔案包含正確的 DATABASE_URL

---

## 🧪 測試腳本

在設定 Cron Job 之前，先手動測試腳本是否正常運作：

### 1. 測試每日重置
```bash
cd /Users/sean/Documents/React/tarot-card-nextjs-app
cd backend && uv run python app/scripts/reset_tasks_cron.py --daily
```

**預期輸出**：
```
============================================================
Starting Daily Tasks Reset
============================================================
[日期時間] - INFO - [Reset] Successfully reset X daily task records
[日期時間] - INFO - [Cleanup] Deleted X old weekly task records
[日期時間] - INFO - Daily reset completed successfully
============================================================
```

### 2. 測試每週重置
```bash
cd /Users/sean/Documents/React/tarot-card-nextjs-app
cd backend && uv run python app/scripts/reset_tasks_cron.py --weekly
```

**預期輸出**：
```
============================================================
Starting Weekly Tasks Reset
============================================================
[日期時間] - INFO - [Reset] Successfully reset X weekly task records
[日期時間] - INFO - Weekly reset completed successfully
============================================================
```

---

## ⚙️ Cron Job 設定

### Step 1: 編輯 Crontab

```bash
crontab -e
```

### Step 2: 添加以下內容

**重要**：將 `/Users/sean/Documents/React/tarot-card-nextjs-app` 替換為你的實際專案路徑！

```cron
# Dashboard Gamification - Tasks Auto Reset
# 時區：UTC+8 (台北時間)

# 每日重置（每天 00:00 UTC+8 = 前一天 16:00 UTC）
0 16 * * * cd /Users/sean/Documents/React/tarot-card-nextjs-app/backend && /usr/local/bin/uv run python app/scripts/reset_tasks_cron.py --daily >> /Users/sean/Documents/React/tarot-card-nextjs-app/backend/logs/tasks_reset.log 2>&1

# 每週重置（每週一 00:00 UTC+8 = 週日 16:00 UTC）
0 16 * * 0 cd /Users/sean/Documents/React/tarot-card-nextjs-app/backend && /usr/local/bin/uv run python app/scripts/reset_tasks_cron.py --weekly >> /Users/sean/Documents/React/tarot-card-nextjs-app/backend/logs/tasks_reset.log 2>&1
```

### Step 3: 儲存並退出

- **vim**: 按 `:wq` 然後 Enter
- **nano**: 按 `Ctrl+X`, 然後 `Y`, 然後 Enter

### Step 4: 確認 Cron Job 已設定

```bash
crontab -l
```

應該能看到你剛才添加的兩行 Cron Job。

---

## 📅 Cron 時間說明

### 每日重置
- **Cron 表達式**: `0 16 * * *`
- **UTC 時間**: 每天 16:00
- **台北時間**: 每天 00:00 (隔天)
- **執行內容**: 重置所有每日任務

### 每週重置
- **Cron 表達式**: `0 16 * * 0`
- **UTC 時間**: 每週日 16:00
- **台北時間**: 每週一 00:00
- **執行內容**: 重置所有每週任務（刪除非本週的記錄）

---

## 📊 查看日誌

Cron Job 執行後會將輸出寫入日誌檔案：

```bash
# 查看最新日誌
tail -f backend/logs/tasks_reset.log

# 查看最近 50 行
tail -50 backend/logs/tasks_reset.log

# 搜尋錯誤
grep -i "error" backend/logs/tasks_reset.log
```

---

## 🔍 驗證 Cron Job 是否運作

### 方法 1：手動觸發（推薦用於測試）

暫時修改 Cron 時間為 1 分鐘後執行：

```bash
# 假設現在是 15:30，設定 15:31 執行
31 15 * * * cd /path/to/project/backend && uv run python app/scripts/reset_tasks_cron.py --daily >> /path/to/project/backend/logs/tasks_reset.log 2>&1
```

等待 1 分鐘後檢查日誌：

```bash
tail -20 backend/logs/tasks_reset.log
```

### 方法 2：檢查 Cron 執行記錄（macOS）

```bash
# macOS
log show --predicate 'process == "cron"' --last 1h

# Linux
grep CRON /var/log/syslog  # Debian/Ubuntu
grep CRON /var/log/cron    # CentOS/RHEL
```

---

## ⚠️ 常見問題

### 問題 1：Cron Job 沒有執行

**可能原因**：
1. Cron 服務未啟動
2. 路徑錯誤
3. 權限不足

**解決方案**：
```bash
# 檢查 Cron 服務狀態（Linux）
sudo systemctl status cron

# 檢查 Cron 日誌
tail -50 /var/log/syslog | grep CRON

# 確認腳本權限
ls -la backend/app/scripts/reset_tasks_cron.py
# 應顯示 -rwxr-xr-x（有執行權限）
```

### 問題 2：找不到 Python 模組

**可能原因**：Cron 環境變數與 shell 環境不同

**解決方案**：在 Crontab 開頭添加環境變數：
```cron
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

# 你的 Cron Jobs...
```

### 問題 3：資料庫連線失敗

**可能原因**：.env 檔案路徑錯誤或環境變數未載入

**解決方案**：在腳本執行前設定環境變數：
```bash
# 方法 1：在 Cron Job 中明確指定 .env 路徑
cd /path/to/project/backend && export $(cat .env | xargs) && uv run python app/scripts/reset_tasks_cron.py --daily

# 方法 2：在 backend/.env 中確認 DATABASE_URL 正確
```

---

## 🛠️ 進階設定

### 自訂重置時間

如果你想在不同時間執行重置：

```cron
# 每天凌晨 2:00 UTC+8 重置（前一天 18:00 UTC）
0 18 * * * cd /path/to/project/backend && uv run python app/scripts/reset_tasks_cron.py --daily >> logs/tasks_reset.log 2>&1

# 每週三 00:00 UTC+8 重置（週二 16:00 UTC）
0 16 * * 2 cd /path/to/project/backend && uv run python app/scripts/reset_tasks_cron.py --weekly >> logs/tasks_reset.log 2>&1
```

### 添加通知

當重置失敗時發送郵件通知：

```bash
# 安裝 mailutils（Linux）
sudo apt-get install mailutils

# 修改 Cron Job
0 16 * * * cd /path/to/project/backend && uv run python app/scripts/reset_tasks_cron.py --daily >> logs/tasks_reset.log 2>&1 || echo "Daily reset failed" | mail -s "Cron Job Failed" your@email.com
```

---

## ✅ 設定檢查清單

完成以下檢查後，你的 Cron Job 設定應該是正確的：

- [ ] 專案路徑正確無誤
- [ ] `uv` 命令路徑正確（使用 `which uv` 確認）
- [ ] 手動執行腳本成功（`--daily` 和 `--weekly` 都測試過）
- [ ] logs 目錄存在且可寫入
- [ ] Crontab 已正確設定（使用 `crontab -l` 確認）
- [ ] 時區設定正確（UTC+8 台北時間）
- [ ] 日誌檔案在預期時間後有新內容

---

## 📝 維護建議

1. **定期檢查日誌**：每週查看一次日誌，確保重置正常執行
2. **日誌輪替**：設定 logrotate 避免日誌檔案過大
3. **監控告警**：設定監控系統，當重置失敗時發送通知
4. **測試環境**：在測試環境先驗證 Cron Job 設定

---

**設定完成時間**：[填寫日期]
**最後檢查日期**：[填寫日期]
