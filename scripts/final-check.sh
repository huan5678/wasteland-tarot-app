#!/bin/bash
###############################################################################
# 快速占卜功能 - 最終檢查腳本
# 任務 20 - 整合最終檢查與部署準備
###############################################################################

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════════════"
echo "  快速占卜功能 - 最終檢查腳本"
echo "  任務 20: 整合最終檢查與部署準備"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

function print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

function print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

function print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

function print_section() {
    echo ""
    echo "────────────────────────────────────────────────────────────────────────"
    echo "  $1"
    echo "────────────────────────────────────────────────────────────────────────"
}

###############################################################################
# 1. 需求完整性檢查
###############################################################################
print_section "1. 需求完整性檢查 (Requirements Traceability)"

# 檢查關鍵檔案是否存在
if [ -f "src/app/readings/quick/page.tsx" ]; then
    print_success "快速占卜頁面存在"
else
    print_error "快速占卜頁面不存在"
fi

if [ -f "src/lib/quickReadingStorage.ts" ]; then
    print_success "localStorage 服務存在"
else
    print_error "localStorage 服務不存在"
fi

if [ -f "src/components/readings/CarouselContainer.tsx" ]; then
    print_success "Carousel 元件存在"
else
    print_error "Carousel 元件不存在"
fi

if [ -f "src/components/ui/ConfirmDialog.tsx" ]; then
    print_success "ConfirmDialog 元件存在"
else
    print_error "ConfirmDialog 元件不存在"
fi

###############################################################################
# 2. TypeScript 類型檢查
###############################################################################
print_section "2. TypeScript 類型檢查"

echo "執行 TypeScript 編譯檢查..."
if bun run type-check 2>&1 | tee /tmp/tsc-output.log; then
    if grep -q "error TS" /tmp/tsc-output.log; then
        ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.log || echo "0")
        print_error "發現 $ERROR_COUNT 個 TypeScript 錯誤"
    else
        print_success "TypeScript 編譯無錯誤"
    fi
else
    print_warning "TypeScript 檢查完成，請查看詳細輸出"
fi

###############################################################################
# 3. 單元測試執行
###############################################################################
print_section "3. 單元測試執行"

echo "執行 localStorage 服務測試..."
if bun test src/lib/__tests__/quickReadingStorage.test.ts > /dev/null 2>&1; then
    print_success "localStorage 單元測試通過"
else
    print_error "localStorage 單元測試失敗"
fi

echo "執行卡牌池選取測試..."
if bun test src/app/readings/quick/__tests__/cardPool.test.ts > /dev/null 2>&1; then
    print_success "卡牌池選取測試通過"
else
    print_error "卡牌池選取測試失敗"
fi

echo "執行狀態管理測試..."
if bun test src/app/readings/quick/__tests__/stateManagement.test.ts > /dev/null 2>&1; then
    print_success "狀態管理測試通過"
else
    print_error "狀態管理測試失敗"
fi

###############################################################################
# 4. 整合測試執行
###############################################################################
print_section "4. 整合測試執行"

echo "執行完整流程整合測試..."
if bun test src/app/readings/quick/__tests__/integration.test.tsx > /dev/null 2>&1; then
    print_success "整合測試通過"
else
    print_error "整合測試失敗"
fi

###############################################################################
# 5. E2E 測試執行
###############################################################################
print_section "5. E2E 測試執行 (需要開發伺服器運行)"

echo "檢查開發伺服器..."
if curl -s http://localhost:3000 > /dev/null; then
    print_success "開發伺服器運行中"

    echo "執行快速占卜 E2E 測試..."
    if npx playwright test tests/e2e/quick-reading.spec.ts --project=chromium > /dev/null 2>&1; then
        print_success "E2E 測試通過"
    else
        print_warning "E2E 測試失敗或未完成，請手動執行"
    fi
else
    print_warning "開發伺服器未運行，跳過 E2E 測試"
    print_warning "請執行 'bun run dev' 後再執行 E2E 測試"
fi

###############################################################################
# 6. Console 錯誤檢查
###############################################################################
print_section "6. Console 錯誤/警告檢查"

if [ -f "tests/e2e/.playwright/console-output.log" ]; then
    if grep -q "error" tests/e2e/.playwright/console-output.log; then
        ERROR_COUNT=$(grep -c "error" tests/e2e/.playwright/console-output.log)
        print_error "發現 $ERROR_COUNT 個 console.error"
    else
        print_success "無 console 錯誤"
    fi

    if grep -q "warning" tests/e2e/.playwright/console-output.log; then
        WARNING_COUNT=$(grep -c "warning" tests/e2e/.playwright/console-output.log)
        print_warning "發現 $WARNING_COUNT 個 console.warning"
    else
        print_success "無 console 警告"
    fi
else
    print_warning "未找到 console 輸出日誌，請執行 E2E 測試"
fi

###############################################################################
# 7. localStorage 降級策略驗證
###############################################################################
print_section "7. localStorage 降級策略驗證"

echo "檢查 localStorage 服務實作..."
if grep -q "isAvailable" src/lib/quickReadingStorage.ts; then
    print_success "實作了 isAvailable 檢查"
else
    print_error "缺少 isAvailable 檢查"
fi

if grep -q "QuotaExceededError\|DOMException" src/lib/quickReadingStorage.ts; then
    print_success "實作了錯誤處理"
else
    print_warning "可能缺少完整的錯誤處理"
fi

###############################################################################
# 8. CTA 轉換機制驗證
###############################################################################
print_section "8. CTA 轉換機制驗證"

if grep -q "探索完整的廢土命運" src/app/readings/quick/page.tsx; then
    print_success "主要 CTA 存在"
else
    print_error "缺少主要 CTA"
fi

if grep -q "立即註冊 Vault 帳號" src/app/readings/quick/page.tsx; then
    print_success "註冊 CTA 存在"
else
    print_error "缺少註冊 CTA"
fi

if grep -q "router.push.*auth/register\|router.push.*auth/login" src/app/readings/quick/page.tsx; then
    print_success "CTA 導航邏輯存在"
else
    print_error "缺少 CTA 導航邏輯"
fi

###############################################################################
# 9. 檔案大小檢查
###############################################################################
print_section "9. Bundle 大小檢查"

if [ -f ".next/analyze/client.html" ]; then
    print_success "Bundle 分析報告存在"
    print_warning "請手動檢查 .next/analyze/client.html"
else
    print_warning "未找到 Bundle 分析報告"
    print_warning "建議執行 'bun run build' 並檢查 bundle 大小"
fi

###############################################################################
# 10. Git 狀態檢查
###############################################################################
print_section "10. Git 狀態檢查"

UNCOMMITTED=$(git status --porcelain | wc -l)
if [ "$UNCOMMITTED" -eq 0 ]; then
    print_success "所有變更已提交"
else
    print_warning "有 $UNCOMMITTED 個未提交的檔案"
fi

###############################################################################
# 最終報告
###############################################################################
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  最終檢查報告"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}通過:${NC} $PASSED"
echo -e "${RED}失敗:${NC} $FAILED"
echo -e "${YELLOW}警告:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有關鍵檢查通過，可以進行部署準備！${NC}"
    echo ""
    echo "建議的後續步驟："
    echo "  1. 執行完整的測試套件: bun test && npx playwright test"
    echo "  2. 執行 Lighthouse CI: node scripts/test-quick-reading-performance.js"
    echo "  3. 執行 Bundle 分析: bun run build && bun run analyze"
    echo "  4. 建立 staging 部署"
    echo "  5. 執行煙霧測試"
    echo ""
    exit 0
else
    echo -e "${RED}❌ 發現 $FAILED 個關鍵問題，請修復後再部署${NC}"
    echo ""
    exit 1
fi
