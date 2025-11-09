# CORS 修復 - 下一步驟

## ✅ 已完成的修復

### 1. 更新了後端 CORS 配置

**檔案**: `backend/.env` (第 53-55 行)

新增了以下允許的來源：
- ✅ `http://localhost:3000` (原有)
- ✅ `https://localhost:3000` (原有)
- ✅ `http://192.168.233.146:3000` **[新增]**
- ✅ `https://192.168.233.146:3000` **[新增]**
- ✅ `http://127.0.0.1:3000` **[新增]**
- ✅ `https://127.0.0.1:3000` **[新增]**

### 2. 驗證了配置正確性

- ✅ 前端 API 配置正確 (`src/lib/api.ts` - credentials: 'include')
- ✅ 後端 CORS middleware 配置正確 (`backend/app/main.py`)
- ✅ 配置檔案格式正確，可以正常載入

## ⚠️ 需要你執行的步驟

### 步驟 1: 重啟後端伺服器

**重要**：`.env` 檔案的變更不會觸發 uvicorn 的自動重載，你需要手動重啟後端伺服器。

#### 方法 A: 使用提供的重啟腳本（推薦）

```bash
# 在 WSL 終端中
cd /mnt/e/projects/wasteland-tarot-app/backend
./restart-server.sh
```

#### 方法 B: 手動重啟

```bash
# 在 WSL 終端中
cd /mnt/e/projects/wasteland-tarot-app/backend
source .venv/bin/activate

# 如果伺服器正在運行，先停止它（Ctrl+C）
# 或者執行：pkill -f "uvicorn app.main:app"

# 重新啟動伺服器
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info --reload --access-log
```

**預期輸出**：
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process...
INFO:     Started server process...
INFO:     Application startup complete.
```

### 步驟 2: 驗證 CORS 修復

#### 選項 A: 使用測試 HTML 頁面（推薦）

1. 在 Windows 瀏覽器中打開檔案：
   ```
   E:\projects\wasteland-tarot-app\test-cors.html
   ```

2. 確認 API URL 設定為 `http://192.168.233.146:8000`

3. 依序點擊測試按鈕：
   - **測試健康檢查** - 應該顯示綠色成功訊息
   - **測試卡牌 API** - 應該顯示取得的卡牌數量
   - **測試認證 API** - 應該顯示 401 (未登入，這是正常的)

4. 檢查是否有任何紅色錯誤訊息

#### 選項 B: 使用 curl 測試

```bash
# 在 WSL 終端中執行
curl -i -X OPTIONS http://192.168.233.146:8000/api/v1/cards/ \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
```

**預期結果**（應包含以下 headers）：
```
HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:3000
access-control-allow-credentials: true
access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
```

#### 選項 C: 使用前端應用測試

1. 啟動前端開發伺服器：
   ```bash
   # 在 Windows PowerShell/CMD 中
   cd E:\projects\wasteland-tarot-app
   bun dev
   ```

2. 打開瀏覽器訪問 `http://localhost:3000`

3. 開啟瀏覽器開發者工具 (F12)
   - 切換到 **Console** 標籤
   - 切換到 **Network** 標籤

4. 執行任何需要 API 的操作（如登入、查看卡牌等）

5. 在 Console 標籤中：
   - ✅ **沒有 CORS 錯誤** = 修復成功
   - ❌ **有 CORS 錯誤** = 需要進一步診斷

6. 在 Network 標籤中：
   - 點擊任一 API 請求
   - 查看 **Response Headers**
   - 確認包含：
     ```
     Access-Control-Allow-Origin: http://localhost:3000
     Access-Control-Allow-Credentials: true
     ```

### 步驟 3: 常見問題排查

#### 問題 1: 後端啟動失敗（資料庫連線錯誤）

如果看到類似以下錯誤：
```
DatabaseConnectionError: 503: 避難所資料庫連線中斷
```

**解決方案**：檢查 `backend/.env` 中的 `DATABASE_URL` 設定

參考現有的資料庫設定文件或諮詢專案文件了解正確的資料庫配置。

#### 問題 2: 仍然出現 CORS 錯誤

**檢查清單**：
1. ✅ 後端伺服器已重啟？
2. ✅ 後端伺服器正在運行在 `0.0.0.0:8000`？
3. ✅ 前端正在運行在 `localhost:3000`？
4. ✅ 瀏覽器 Console 中的錯誤訊息是什麼？

**診斷步驟**：
```bash
# 檢查後端是否運行
ps aux | grep uvicorn

# 檢查 CORS 配置載入
cd /mnt/e/projects/wasteland-tarot-app/backend
source .venv/bin/activate
python -c "
from app.config import get_settings
settings = get_settings()
for origin in settings.backend_cors_origins:
    print(origin)
"

# 測試 CORS
curl -i http://192.168.233.146:8000/health \
  -H "Origin: http://localhost:3000"
```

#### 問題 3: WSL IP 地址改變

如果 WSL IP 從 `192.168.233.146` 改變到其他地址：

1. 檢查新的 WSL IP：
   ```bash
   # 在 WSL 中
   ip addr show eth0 | grep inet
   ```

2. 更新 `backend/.env` 中的 CORS 配置，加入新的 IP

3. 更新前端 `.env.local` 中的 `NEXT_PUBLIC_API_BASE_URL`

4. 重啟後端和前端伺服器

## 📁 相關檔案

### 已修改的檔案
- ✅ `backend/.env` - CORS 配置已更新

### 已驗證無需修改的檔案
- ✅ `backend/app/main.py` - CORS middleware 配置正確
- ✅ `backend/app/config.py` - CORS 載入邏輯正確
- ✅ `src/lib/api.ts` - 前端 API credentials 配置正確
- ✅ `src/middleware.ts` - 前端 middleware 配置正確

### 新增的檔案
- 📄 `test-cors.html` - CORS 測試工具
- 📄 `backend/restart-server.sh` - 伺服器重啟腳本
- 📄 `CORS_FIX_REPORT.md` - 完整的修復報告
- 📄 `CORS_FIX_NEXT_STEPS.md` - 本檔案

## 🎯 完成標準

當你完成以下所有步驟時，CORS 修復即告完成：

- [ ] 後端伺服器已重啟並正常運行
- [ ] 測試工具顯示所有測試通過（綠色）
- [ ] 前端應用可以成功呼叫後端 API
- [ ] 瀏覽器 Console 沒有 CORS 錯誤訊息
- [ ] Network 標籤顯示正確的 CORS headers

## 📞 需要協助？

如果遇到問題，請提供以下資訊：

1. 後端啟動日誌（最後 50 行）
2. 瀏覽器 Console 的錯誤訊息（截圖或複製文字）
3. Network 標籤中失敗請求的 Headers（Request + Response）
4. 當前的 WSL IP 地址
5. 前端和後端的 `.env` 檔案中的 URL 配置

---

**修復日期**: 2025-10-07
**狀態**: ⚠️ 等待手動重啟後端伺服器
