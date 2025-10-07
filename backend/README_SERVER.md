# Wasteland Tarot Backend Server

## 快速啟動

### 方法 1: 使用啟動腳本（推薦）

```bash
# 開發模式（自動重載）
./start.sh

# 或明確指定開發模式
./start.sh dev

# 生產模式（無自動重載）
./start.sh prod
```

### 方法 2: 直接使用 uvicorn

```bash
# 啟動虛擬環境
source .venv/bin/activate

# 開發模式
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生產模式
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 方法 3: 自定義配置

```bash
# 使用環境變數自定義
HOST=127.0.0.1 PORT=8080 LOG_LEVEL=debug ./start.sh
```

## API 文件

啟動後，可以訪問以下 API 文件：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 環境變數設置

首次運行前，請確保配置 `.env` 檔案：

```bash
# 複製範例檔案
cp .env.example .env

# 編輯環境變數
nano .env  # 或使用你喜歡的編輯器
```

必要的環境變數：
- `DATABASE_URL`: PostgreSQL 資料庫連線字串
- `SUPABASE_URL`: Supabase 專案 URL
- `SUPABASE_KEY`: Supabase anon key
- `SECRET_KEY`: JWT 加密金鑰

## 故障排除

### 端口已被占用

```bash
# 查找占用 8000 端口的進程
lsof -ti:8000

# 結束該進程
lsof -ti:8000 | xargs kill -9

# 或讓啟動腳本自動處理（推薦）
./start.sh
```

### 虛擬環境問題

```bash
# 重新創建虛擬環境
rm -rf .venv
uv venv
source .venv/bin/activate
uv sync
```

### 資料庫連線問題

```bash
# 檢查資料庫配置
source .venv/bin/activate
python -c "from app.config import get_settings; print(get_settings().DATABASE_URL)"

# 測試資料庫連線
python -c "from app.db.session import engine; engine.connect()"
```

### 模組導入錯誤

```bash
# 確保所有依賴已安裝
source .venv/bin/activate
uv sync

# 檢查 Python 路徑
python -c "import sys; print('\n'.join(sys.path))"
```

## 開發模式 vs 生產模式

### 開發模式特點
- ✅ 自動重載（檔案變更時自動重啟）
- ✅ 詳細的日誌輸出
- ✅ Debug 模式啟用
- ✅ CORS 寬鬆設置

### 生產模式特點
- ✅ 多 worker 處理
- ✅ 最小化日誌輸出
- ✅ 安全性強化
- ✅ 效能優化

## 健康檢查

```bash
# 檢查伺服器狀態
curl http://localhost:8000/health

# 檢查 API 版本
curl http://localhost:8000/
```

## 日誌檔案

日誌儲存位置：
- `logs/app.log`: 應用程式日誌
- `logs/error.log`: 錯誤日誌
- `logs/access.log`: 訪問日誌

## 效能監控

伺服器啟動後會自動啟用：
- ✅ 請求日誌中間件
- ✅ 效能監控中間件
- ✅ 錯誤追蹤與聚合
- ✅ APScheduler 背景任務

## 背景任務

伺服器啟動時會自動註冊以下背景任務：
- **每日號碼生成**: 每天 00:00 (UTC+8) 執行
- **每月重置**: 每月 1 日 00:00 (UTC+8) 執行

## 停止伺服器

在終端機中按 `Ctrl+C` 優雅地關閉伺服器。

伺服器會自動：
1. 停止接受新請求
2. 等待現有請求完成
3. 關閉 APScheduler
4. 關閉資料庫連線
5. 清理資源

## 技術棧

- **FastAPI**: 現代化高效能 Web 框架
- **Uvicorn**: ASGI 伺服器
- **SQLAlchemy**: ORM
- **Pydantic**: 資料驗證
- **APScheduler**: 背景任務排程
- **PostgreSQL**: 主資料庫
