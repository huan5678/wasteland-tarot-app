# CORS 修復快速參考

## 🚀 立即執行（3 步驟）

### 1️⃣ 重啟後端伺服器

```bash
# 在 WSL 終端中
cd /mnt/e/projects/wasteland-tarot-app/backend
./restart-server.sh
```

或手動：
```bash
cd /mnt/e/projects/wasteland-tarot-app/backend
source .venv/bin/activate
# 停止舊的伺服器（如果有）
pkill -f "uvicorn app.main:app"
# 啟動新的伺服器
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2️⃣ 啟動前端

```bash
# 在 Windows PowerShell/CMD 中
cd E:\projects\wasteland-tarot-app
bun dev
```

### 3️⃣ 測試

在瀏覽器中打開：
- **前端**: http://localhost:3000
- **測試頁面**: `E:\projects\wasteland-tarot-app\test-cors.html`

按 F12 開啟 DevTools，檢查 Console 是否有 CORS 錯誤。

---

## ✅ 已修復的內容

### 後端 CORS 配置 (`backend/.env`)

**新增了 8 個允許的來源：**
```
http://localhost:3000
https://localhost:3000
http://localhost
https://localhost
http://192.168.233.146:3000  ← 新增
https://192.168.233.146:3000 ← 新增
http://127.0.0.1:3000        ← 新增
https://127.0.0.1:3000       ← 新增
```

---

## 🔍 快速驗證

### 測試 1: Curl 測試（在 WSL 中）

```bash
curl -i http://192.168.233.146:8000/health -H "Origin: http://localhost:3000"
```

**預期結果**：看到 `access-control-allow-origin: http://localhost:3000`

### 測試 2: 瀏覽器測試

1. 打開 http://localhost:3000
2. 按 F12 開啟 DevTools
3. 執行任何 API 操作
4. 檢查 Console：**沒有 CORS 錯誤** = ✅ 成功

---

## ❌ 如果還有問題

### 檢查後端是否運行

```bash
ps aux | grep uvicorn
```

應該看到類似：
```
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 檢查 CORS 配置

```bash
cd /mnt/e/projects/wasteland-tarot-app/backend
source .venv/bin/activate
python -c "from app.config import get_settings; print(get_settings().backend_cors_origins)"
```

應該看到 8 個來源。

### 檢查網路連線

```bash
# 從 WSL 測試
curl http://192.168.233.146:8000/health

# 從 Windows 測試（PowerShell）
curl http://192.168.233.146:8000/health
```

兩個都應該成功。

---

## 📚 詳細文件

- **完整報告**: `CORS_FIX_REPORT.md`
- **詳細步驟**: `CORS_FIX_NEXT_STEPS.md`
- **測試工具**: `test-cors.html`

---

## 🎯 成功標準

✅ 後端運行在 `0.0.0.0:8000`
✅ 前端運行在 `localhost:3000`
✅ 瀏覽器 Console 無 CORS 錯誤
✅ API 請求成功（200/201 狀態碼）
✅ Response headers 包含正確的 `Access-Control-Allow-Origin`

---

**修復日期**: 2025-10-07
**狀態**: 等待重啟後端伺服器
