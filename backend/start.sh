#!/bin/bash

# Wasteland Tarot Backend Server Startup Script
# =============================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_info "☢️ Wasteland Tarot Backend Server Startup ☢️"
echo ""

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    print_error "虛擬環境 .venv 不存在！"
    print_info "執行以下指令創建虛擬環境："
    echo "  cd backend && uv venv"
    exit 1
fi

# Activate virtual environment
print_info "啟動虛擬環境..."
source .venv/bin/activate

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
print_info "Python 版本: $PYTHON_VERSION"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env 檔案不存在！"
    print_info "複製 .env.example 到 .env 並配置環境變數"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_info "已創建 .env 檔案，請編輯並配置必要的環境變數"
    fi
else
    print_info "環境變數檔案已載入"
fi

# Check if database is accessible (optional)
print_info "檢查資料庫連線..."
if python -c "from app.config import get_settings; settings = get_settings(); print(f'Database: {settings.DATABASE_URL[:30]}...')" 2>/dev/null; then
    print_info "資料庫配置正常"
else
    print_warning "無法驗證資料庫配置"
fi

# Parse command line arguments
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
RELOAD="--reload"
LOG_LEVEL="${LOG_LEVEL:-info}"

# Check for production flag
if [ "$1" == "prod" ] || [ "$1" == "production" ]; then
    print_info "生產模式啟動"
    RELOAD=""
    LOG_LEVEL="warning"
elif [ "$1" == "dev" ] || [ "$1" == "development" ]; then
    print_info "開發模式啟動（自動重載）"
fi

# Kill any existing server on the port
if lsof -ti:$PORT >/dev/null 2>&1; then
    print_warning "端口 $PORT 已被占用，正在清理..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 1
    print_info "端口已清理"
fi

# Start the server
print_info "啟動 FastAPI 伺服器..."
print_info "  主機: $HOST"
print_info "  端口: $PORT"
print_info "  日誌級別: $LOG_LEVEL"
print_info "  自動重載: $([ -n "$RELOAD" ] && echo '是' || echo '否')"
echo ""
print_info "API 文件："
print_info "  Swagger UI: http://localhost:$PORT/docs"
print_info "  ReDoc: http://localhost:$PORT/redoc"
echo ""
print_info "按 Ctrl+C 停止伺服器"
echo ""

# Run the server
python -m uvicorn app.main:app \
    --host "$HOST" \
    --port "$PORT" \
    --log-level "$LOG_LEVEL" \
    $RELOAD \
    --access-log

# Cleanup message
print_info "伺服器已關閉"
