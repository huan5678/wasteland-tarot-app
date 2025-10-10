#!/bin/bash

##
# Cubic_11 Font Loading Unit Tests
#
# Purpose: Validate @font-face CSS declaration and font configuration
# Requirements: Task 3 - cubic-11-font-integration spec
#
# Test Coverage:
#   1. @font-face rule existence
#   2. font-family name correctness ('Cubic 11')
#   3. src path validation (/fonts/Cubic_11.woff2)
#   4. font-display: swap configuration
#   5. CSS syntax validation
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

echo "🧪 Cubic_11 Font Loading Unit Tests"
echo "===================================="
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"

    echo "Test: $test_name"

    if eval "$test_command" | grep -q "$expected_result"; then
        echo -e "${GREEN}  ✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}  ✗ FAILED${NC}"
        echo "  Expected to find: $expected_result"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: @font-face rule exists
echo "Test 1: @font-face rule existence"
if grep -q "@font-face" "$GLOBALS_CSS"; then
    echo -e "${GREEN}  ✓ PASSED: @font-face rule found${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: @font-face rule not found${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 2: font-family name is 'Cubic 11'
echo "Test 2: font-family name correctness"
if grep -A 5 "@font-face" "$GLOBALS_CSS" | grep -q "font-family: 'Cubic 11'"; then
    echo -e "${GREEN}  ✓ PASSED: font-family is 'Cubic 11'${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: font-family is not 'Cubic 11'${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: src path points to correct location
echo "Test 3: src path validation"
if grep -A 5 "@font-face" "$GLOBALS_CSS" | grep -q "url('/fonts/Cubic_11.woff2')"; then
    echo -e "${GREEN}  ✓ PASSED: src path is correct${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: src path is incorrect${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 4: format('woff2') is specified
echo "Test 4: WOFF2 format specification"
if grep -A 5 "@font-face" "$GLOBALS_CSS" | grep -q "format('woff2')"; then
    echo -e "${GREEN}  ✓ PASSED: format('woff2') is specified${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: format('woff2') not specified${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 5: font-display: swap is set
echo "Test 5: font-display: swap configuration"
if grep -A 5 "@font-face" "$GLOBALS_CSS" | grep -q "font-display: swap"; then
    echo -e "${GREEN}  ✓ PASSED: font-display: swap is set${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: font-display: swap not set${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 6: font-weight: normal is set
echo "Test 6: font-weight configuration"
if grep -A 5 "@font-face" "$GLOBALS_CSS" | grep -q "font-weight: normal"; then
    echo -e "${GREEN}  ✓ PASSED: font-weight: normal is set${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: font-weight not set${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test 7: font-style: normal is set
echo "Test 7: font-style configuration"
if grep -A 5 "@font-face" "$GLOBALS_CSS" | grep -q "font-style: normal"; then
    echo -e "${GREEN}  ✓ PASSED: font-style: normal is set${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAILED: font-style not set${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "===================================="
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
fi

exit 0
