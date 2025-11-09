#!/bin/bash

# Wasteland Tarot Backend Health Check Script
# ===========================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_header "☢️ Wasteland Tarot Backend 健康檢查 ☢️"

# Check 1: Virtual Environment
print_header "1. 虛擬環境檢查"
if [ -d ".venv" ]; then
    print_success "虛擬環境存在"
    source .venv/bin/activate
    PYTHON_VERSION=$(python --version 2>&1)
    print_success "$PYTHON_VERSION"
else
    print_error "虛擬環境不存在"
    echo "  執行: uv venv && uv sync"
    exit 1
fi

# Check 2: Environment Variables
print_header "2. 環境變數檢查"
if [ -f ".env" ]; then
    print_success ".env 檔案存在"

    # Check required variables
    source .env
    REQUIRED_VARS=("DATABASE_URL" "SECRET_KEY" "SUPABASE_URL" "SUPABASE_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            print_warning "$var 未設置"
        else
            print_success "$var 已設置"
        fi
    done
else
    print_error ".env 檔案不存在"
    if [ -f ".env.example" ]; then
        echo "  執行: cp .env.example .env"
    fi
fi

# Check 3: Python Dependencies
print_header "3. Python 套件檢查"
if python -c "import fastapi" 2>/dev/null; then
    print_success "FastAPI 已安裝"
else
    print_error "FastAPI 未安裝"
    echo "  執行: uv sync"
    exit 1
fi

if python -c "import sqlalchemy" 2>/dev/null; then
    print_success "SQLAlchemy 已安裝"
else
    print_error "SQLAlchemy 未安裝"
fi

if python -c "import pydantic" 2>/dev/null; then
    print_success "Pydantic 已安裝"
else
    print_error "Pydantic 未安裝"
fi

# Check 4: Configuration
print_header "4. 配置檢查"
if python -c "from app.config import get_settings; settings = get_settings(); print(f'Version: {settings.version}')" 2>/dev/null; then
    print_success "配置載入成功"
    python -c "from app.config import get_settings; settings = get_settings(); print(f'  版本: {settings.version}'); print(f'  環境: {settings.environment}'); print(f'  Debug: {settings.debug}')"
else
    print_error "配置載入失敗"
fi

# Check 5: Database
print_header "5. 資料庫檢查"
if python -c "from app.db.session import engine; conn = engine.connect(); print('Connection successful'); conn.close()" 2>/dev/null; then
    print_success "資料庫連線成功"
else
    print_warning "資料庫連線失敗或未配置"
fi

# Check 6: Main App Import
print_header "6. 應用程式模組檢查"
if python -c "from app.main import app; print(f'App: {app.title}')" 2>/dev/null; then
    print_success "主應用程式載入成功"
else
    print_error "主應用程式載入失敗"
fi

# Check 7: API Routes
print_header "7. API 路由檢查"
if python -c "from app.api.v1.api import api_router; print(f'Routes: {len(api_router.routes)}')" 2>/dev/null; then
    print_success "API 路由載入成功"
    python -c "from app.api.v1.api import api_router; print(f'  路由數量: {len(api_router.routes)}')"
else
    print_error "API 路由載入失敗"
fi

# Check 8: Port Availability
print_header "8. 端口檢查"
if lsof -ti:8000 >/dev/null 2>&1; then
    print_warning "端口 8000 已被占用"
    echo "  PID: $(lsof -ti:8000)"
    echo "  清理: lsof -ti:8000 | xargs kill -9"
else
    print_success "端口 8000 可用"
fi

# Check 9: Log Directory
print_header "9. 日誌目錄檢查"
if [ -d "logs" ]; then
    print_success "日誌目錄存在"
    LOG_COUNT=$(ls -1 logs/*.log 2>/dev/null | wc -l)
    echo "  日誌檔案數量: $LOG_COUNT"
else
    print_warning "日誌目錄不存在（首次啟動時會自動創建）"
fi

# Check 10: Alembic Migrations
print_header "10. 資料庫遷移檢查"
if [ -d "alembic" ]; then
    print_success "Alembic 目錄存在"
    MIGRATION_COUNT=$(ls -1 alembic/versions/*.py 2>/dev/null | wc -l)
    echo "  遷移檔案數量: $MIGRATION_COUNT"
else
    print_warning "Alembic 目錄不存在"
fi

# Final Summary
print_header "檢查完成"

echo -e "\n${GREEN}啟動伺服器：${NC}"
echo "  ./start.sh"
echo ""
echo -e "${BLUE}API 文件：${NC}"
echo "  http://localhost:8000/docs"
echo "  http://localhost:8000/redoc"
echo ""
