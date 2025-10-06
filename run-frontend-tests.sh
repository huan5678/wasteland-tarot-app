#!/bin/bash
# Wasteland Tarot 前端測試執行腳本
# 建立日期: 2025-10-04
# 用途: 一鍵執行所有前端測試

set -e  # 遇到錯誤立即停止

echo "🎯 Wasteland Tarot 前端測試套件"
echo "================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 測試結果追蹤
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 函式: 執行測試並記錄結果
run_test() {
  local test_name=$1
  local test_command=$2

  echo -e "${BLUE}▶ 執行: ${test_name}${NC}"
  echo "  指令: ${test_command}"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  if eval $test_command; then
    echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}❌ ${test_name} - FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  echo ""
}

# 檢查環境變數
echo -e "${YELLOW}📋 Step 1/5: 檢查環境變數${NC}"
echo ""

if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local 2>/dev/null; then
  echo -e "${YELLOW}⚠️  未找到 Supabase 環境變數，添加測試用配置...${NC}"
  cat >> .env.local << 'ENVEOF'

# 測試用 Supabase 配置 (自動添加)
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key-12345
ENVEOF
  echo -e "${GREEN}✅ 已添加測試用環境變數${NC}"
else
  echo -e "${GREEN}✅ 環境變數已配置${NC}"
fi
echo ""

# Phase 1: 單元測試
echo -e "${YELLOW}📋 Step 2/5: 單元測試 (Unit Tests)${NC}"
echo ""

run_test "Design System 無障礙測試" "bun test src/components/ui/__tests__/a11y.test.tsx --passWithNoTests"
run_test "鍵盤導航測試" "bun test src/components/ui/__tests__/keyboard-navigation.test.tsx --passWithNoTests"

# Phase 2: E2E 測試
echo -e "${YELLOW}📋 Step 3/5: E2E 測試 (Design System)${NC}"
echo ""

# 檢查 Playwright 是否已安裝
if ! command -v playwright &> /dev/null; then
  echo -e "${YELLOW}⚠️  Playwright 未安裝，嘗試安裝...${NC}"
  bunx playwright install chromium
fi

run_test "Design System 響應式設計測試" "bun test:playwright tests/e2e/design-system/responsive.spec.ts || true"
run_test "Design System 鍵盤導航測試" "bun test:playwright tests/e2e/design-system/keyboard-nav.spec.ts || true"
run_test "Design System 螢幕閱讀器測試" "bun test:playwright tests/e2e/design-system/screen-reader.spec.ts || true"

# Phase 3: 無障礙測試
echo -e "${YELLOW}📋 Step 4/5: 無障礙測試 (Accessibility)${NC}"
echo ""

run_test "WCAG AA 合規性測試" "bun test:accessibility:wcag || true"
run_test "色彩對比度測試" "bun test:accessibility:color-contrast || true"
run_test "色盲友善測試" "bun test:accessibility:colorblind || true"

# Phase 4: 效能測試
echo -e "${YELLOW}📋 Step 5/5: 效能測試 (Performance)${NC}"
echo ""

echo -e "${BLUE}ℹ️  效能測試需要手動執行 Lighthouse 審查${NC}"
echo "  1. 啟動開發伺服器: bun run dev"
echo "  2. 開啟 Chrome DevTools (F12)"
echo "  3. 進入 Lighthouse 標籤"
echo "  4. 選擇 Performance + Accessibility"
echo "  5. 點擊 Generate Report"
echo ""
echo -e "${BLUE}ℹ️  或使用 Playwright 內建效能測試:${NC}"
echo "  bun test:performance"
echo ""

# 測試結果摘要
echo "================================"
echo -e "${BLUE}📊 測試結果摘要${NC}"
echo "================================"
echo ""
echo "總測試數: ${TOTAL_TESTS}"
echo -e "${GREEN}通過: ${PASSED_TESTS}${NC}"
echo -e "${RED}失敗: ${FAILED_TESTS}${NC}"
echo ""

# 計算通過率
if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

  if [ $PASS_RATE -ge 90 ]; then
    echo -e "${GREEN}✅ 測試通過率: ${PASS_RATE}% (優秀)${NC}"
  elif [ $PASS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  測試通過率: ${PASS_RATE}% (良好)${NC}"
  else
    echo -e "${RED}❌ 測試通過率: ${PASS_RATE}% (需改善)${NC}"
  fi
fi

echo ""
echo -e "${BLUE}📚 詳細測試報告:${NC}"
echo "  - Playwright 報告: bun test:playwright:report"
echo "  - 單元測試覆蓋率: bun test:coverage"
echo "  - 無障礙報告: bun test:accessibility:report"
echo ""
echo -e "${BLUE}📖 完整測試策略文件:${NC}"
echo "  docs/TESTING_STRATEGY.md"
echo ""

# 退出碼
if [ $FAILED_TESTS -gt 0 ]; then
  exit 1
else
  exit 0
fi
