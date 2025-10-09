#!/bin/bash

# Daily Bingo Edge Functions 測試腳本
# 用於手動測試 Supabase Edge Functions

# ============================================
# 設定環境變數
# ============================================

# 請替換為你的 Supabase 專案資訊
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 顏色輸出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 測試函式
# ============================================

test_daily_number_generation() {
    echo -e "${YELLOW}Testing: Daily Number Generation${NC}"

    response=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/generate-daily-number" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{}')

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ Daily Number Generation Response:${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}✗ Daily Number Generation Failed${NC}"
        echo "$response"
    fi

    echo ""
}

test_monthly_reset() {
    echo -e "${YELLOW}Testing: Monthly Reset${NC}"

    response=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/monthly-reset" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{}')

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ Monthly Reset Response:${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}✗ Monthly Reset Failed${NC}"
        echo "$response"
    fi

    echo ""
}

test_pg_cron_jobs() {
    echo -e "${YELLOW}Checking pg_cron Jobs${NC}"

    # 需要使用 psql 連接到資料庫
    # 請替換為你的資料庫連接字串
    psql "${DATABASE_URL}" -c "SELECT jobname, schedule, active FROM cron.job;" 2>/dev/null

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ pg_cron jobs listed successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Could not connect to database (psql required)${NC}"
    fi

    echo ""
}

test_edge_function_health() {
    echo -e "${YELLOW}Testing Edge Function Health${NC}"

    # 測試每日號碼生成函式健康狀態
    status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS \
        "${SUPABASE_URL}/functions/v1/generate-daily-number")

    if [[ $status_code -eq 200 ]]; then
        echo -e "${GREEN}✓ generate-daily-number: Healthy (${status_code})${NC}"
    else
        echo -e "${RED}✗ generate-daily-number: Unhealthy (${status_code})${NC}"
    fi

    # 測試每月重置函式健康狀態
    status_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS \
        "${SUPABASE_URL}/functions/v1/monthly-reset")

    if [[ $status_code -eq 200 ]]; then
        echo -e "${GREEN}✓ monthly-reset: Healthy (${status_code})${NC}"
    else
        echo -e "${RED}✗ monthly-reset: Unhealthy (${status_code})${NC}"
    fi

    echo ""
}

# ============================================
# 主程式
# ============================================

echo "================================================"
echo "  Daily Bingo Edge Functions Test Suite"
echo "================================================"
echo ""

# 檢查必要工具
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed (JSON formatting disabled)${NC}"
fi

# 執行測試
case "${1:-all}" in
    "daily")
        test_daily_number_generation
        ;;
    "monthly")
        test_monthly_reset
        ;;
    "health")
        test_edge_function_health
        ;;
    "cron")
        test_pg_cron_jobs
        ;;
    "all")
        test_edge_function_health
        test_daily_number_generation
        test_monthly_reset
        test_pg_cron_jobs
        ;;
    *)
        echo "Usage: $0 {all|daily|monthly|health|cron}"
        echo ""
        echo "Commands:"
        echo "  all     - Run all tests (default)"
        echo "  daily   - Test daily number generation only"
        echo "  monthly - Test monthly reset only"
        echo "  health  - Check Edge Function health status"
        echo "  cron    - List pg_cron jobs"
        exit 1
        ;;
esac

echo "================================================"
echo "  Test Complete"
echo "================================================"
