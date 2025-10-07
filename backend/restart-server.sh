#!/bin/bash
# 重啟 Wasteland Tarot 後端伺服器
# 用於應用 .env 配置變更

echo "☢️ 廢土塔羅後端伺服器重啟腳本"
echo "================================"
echo ""

# 檢查是否在正確的目錄
if [ ! -f "app/main.py" ]; then
    echo "❌ 錯誤：請在 backend 目錄下執行此腳本"
    exit 1
fi

# 啟動虛擬環境
echo "📦 啟動虛擬環境..."
source .venv/bin/activate

# 檢查是否有正在運行的伺服器
echo "🔍 檢查正在運行的伺服器..."
PID=$(ps aux | grep "uvicorn app.main:app" | grep -v grep | awk '{print $2}')

if [ -n "$PID" ]; then
    echo "🛑 發現運行中的伺服器 (PID: $PID)"
    echo "   正在停止..."
    kill $PID
    sleep 2

    # 確認已停止
    if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️  強制停止伺服器..."
        kill -9 $PID
    fi
    echo "✅ 伺服器已停止"
else
    echo "ℹ️  沒有發現運行中的伺服器"
fi

# 驗證 .env 配置
echo ""
echo "🔧 驗證 CORS 配置..."
python -c "
from app.config import get_settings
get_settings.cache_clear()
settings = get_settings()
print(f'允許的 CORS 來源數量: {len(settings.backend_cors_origins)}')
for i, origin in enumerate(settings.backend_cors_origins, 1):
    print(f'  {i}. {origin}')
"

echo ""
echo "🚀 啟動伺服器..."
echo "   Host: 0.0.0.0"
echo "   Port: 8000"
echo "   Mode: Development (--reload)"
echo ""
echo "按 Ctrl+C 停止伺服器"
echo "================================"
echo ""

# 啟動伺服器
python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --log-level info \
    --reload \
    --access-log
