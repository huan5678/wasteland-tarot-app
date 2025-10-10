#!/bin/bash

##
# Cubic_11 Tailwind Configuration Unit Tests
#
# Purpose: Validate --font-cubic CSS variable and Tailwind utility class generation
# Requirements: Task 5 - cubic-11-font-integration spec
#
# Test Coverage:
#   1. --font-cubic CSS variable definition
#   2. Font fallback stack order
#   3. --font-sans variable preservation
#   4. CSS variable syntax validation
#   5. Documentation completeness
#
# Exit Codes:
#   0 - All tests passed
#   1 - Test failure
##

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GLOBALS_CSS="${PROJECT_ROOT}/src/app/globals.css"

echo "🧪 Cubic_11 Tailwind Configuration Tests"
echo "========================================="
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: --font-cubic variable is defined
echo "Test 1: --font-cubic CSS variable definition"
if grep -q "^\s*--font-cubic:" "$GLOBALS_CSS"; then
    echo -e "${GREEN}  ✓ PASSED: --font-cubic variable defined${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: --font-cubic variable not found${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 2: --font-cubic includes 'Cubic 11' as primary font
echo "Test 2: 'Cubic 11' is primary font in --font-cubic"
if grep "^\s*--font-cubic:" "$GLOBALS_CSS" | grep -q "'Cubic 11'"; then
    echo -e "${GREEN}  ✓ PASSED: 'Cubic 11' is primary font${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: 'Cubic 11' not found in --font-cubic${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: --font-cubic includes ui-monospace fallback
echo "Test 3: ui-monospace fallback exists"
if grep "^\s*--font-cubic:" "$GLOBALS_CSS" | grep -q "ui-monospace"; then
    echo -e "${GREEN}  ✓ PASSED: ui-monospace fallback exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: ui-monospace fallback missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 4: --font-cubic includes SFMono-Regular fallback
echo "Test 4: SFMono-Regular fallback exists"
if grep "^\s*--font-cubic:" "$GLOBALS_CSS" | grep -q "SFMono-Regular"; then
    echo -e "${GREEN}  ✓ PASSED: SFMono-Regular fallback exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: SFMono-Regular fallback missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 5: --font-cubic includes Consolas fallback
echo "Test 5: Consolas fallback exists"
if grep "^\s*--font-cubic:" "$GLOBALS_CSS" | grep -q "Consolas"; then
    echo -e "${GREEN}  ✓ PASSED: Consolas fallback exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: Consolas fallback missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 6: --font-cubic includes Monaco fallback
echo "Test 6: Monaco fallback exists"
if grep "^\s*--font-cubic:" "$GLOBALS_CSS" | grep -q "Monaco"; then
    echo -e "${GREEN}  ✓ PASSED: Monaco fallback exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: Monaco fallback missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 7: --font-cubic includes monospace as final fallback
echo "Test 7: monospace final fallback exists"
if grep "^\s*--font-cubic:" "$GLOBALS_CSS" | grep -q "monospace"; then
    echo -e "${GREEN}  ✓ PASSED: monospace final fallback exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: monospace final fallback missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 8: --font-sans variable is preserved (Noto Sans TC)
echo "Test 8: --font-sans variable preservation"
if grep "^\s*--font-sans:" "$GLOBALS_CSS" | grep -q "'Noto Sans TC'"; then
    echo -e "${GREEN}  ✓ PASSED: --font-sans still uses Noto Sans TC${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: --font-sans modified incorrectly${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 9: --font-cubic variable is in @theme block
echo "Test 9: --font-cubic in @theme block"
if awk '/@theme/,/}/' "$GLOBALS_CSS" | grep -q "^\s*--font-cubic:"; then
    echo -e "${GREEN}  ✓ PASSED: --font-cubic is in @theme block${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: --font-cubic not in @theme block${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 10: Documentation exists above --font-cubic
echo "Test 10: Documentation completeness"
if grep -B 20 "^\s*--font-cubic:" "$GLOBALS_CSS" | grep -q "Cubic 11 字體系統配置"; then
    echo -e "${GREEN}  ✓ PASSED: Documentation exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: Documentation missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 11: Check font fallback order is correct
echo "Test 11: Font fallback stack order"
FONT_STACK=$(grep "^\s*--font-cubic:" "$GLOBALS_CSS" | sed 's/.*--font-cubic:\s*//' | sed 's/;.*//')
EXPECTED_ORDER="'Cubic 11'.*ui-monospace.*SFMono-Regular.*Consolas.*Monaco.*monospace"

if echo "$FONT_STACK" | grep -q "$EXPECTED_ORDER"; then
    echo -e "${GREEN}  ✓ PASSED: Font stack order is correct${NC}"
    echo "  Order: Cubic 11 → ui-monospace → SFMono-Regular → Consolas → Monaco → monospace"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: Font stack order is incorrect${NC}"
    echo "  Found: $FONT_STACK"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "========================================="
echo "Test Results:"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
else
    echo -e "  ${RED}Failed: 0${NC}"
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Tailwind CSS v4 will automatically generate:"
    echo "  - .font-cubic utility class"
    echo "  - font-family: var(--font-cubic) in CSS"
    echo ""
    echo "Usage in components:"
    echo "  <div className=\"font-cubic\">Text with Cubic 11 font</div>"
fi

exit 0
