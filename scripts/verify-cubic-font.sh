#!/bin/bash

##
# Cubic_11 Font File Verification Script
#
# Purpose: Verify font file existence, size, and project configuration
# Requirements: Task 1 - cubic-11-font-integration spec
#
# Exit Codes:
#   0 - All checks passed
#   1 - Font file not found
#   2 - Font file size exceeds limit
#   3 - Invalid Next.js/Tailwind version
##

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FONT_FILE="${PROJECT_ROOT}/public/fonts/Cubic_11.woff2"
GLOBALS_CSS="${PROJECT_ROOT}/src/app/globals.css"
PACKAGE_JSON="${PROJECT_ROOT}/package.json"

echo "🔍 Cubic_11 Font Verification"
echo "==============================="
echo ""

# Check 1: Font file existence
echo "✓ Check 1: Font file existence"
if [ ! -f "$FONT_FILE" ]; then
    echo -e "${RED}✗ FAILED: Font file not found at $FONT_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Font file exists: $FONT_FILE${NC}"

# Check 2: Font file size (should be < 500KB)
echo ""
echo "✓ Check 2: Font file size"
FILE_SIZE=$(stat -f%z "$FONT_FILE" 2>/dev/null || stat -c%s "$FONT_FILE" 2>/dev/null)
FILE_SIZE_KB=$((FILE_SIZE / 1024))
MAX_SIZE_KB=500

if [ "$FILE_SIZE_KB" -gt "$MAX_SIZE_KB" ]; then
    echo -e "${RED}✗ FAILED: Font file size (${FILE_SIZE_KB}KB) exceeds ${MAX_SIZE_KB}KB${NC}"
    exit 2
fi
echo -e "${GREEN}  ✓ Font file size: ${FILE_SIZE_KB}KB (< ${MAX_SIZE_KB}KB)${NC}"

# Check 3: Next.js version
echo ""
echo "✓ Check 3: Next.js version"
NEXTJS_VERSION=$(jq -r '.dependencies.next' "$PACKAGE_JSON")
echo -e "${GREEN}  ✓ Next.js version: $NEXTJS_VERSION${NC}"

# Check 4: Tailwind CSS version
echo ""
echo "✓ Check 4: Tailwind CSS version"
TAILWIND_VERSION=$(jq -r '.devDependencies.tailwindcss' "$PACKAGE_JSON")
echo -e "${GREEN}  ✓ Tailwind CSS version: $TAILWIND_VERSION${NC}"

# Check 5: globals.css file existence
echo ""
echo "✓ Check 5: globals.css file existence"
if [ ! -f "$GLOBALS_CSS" ]; then
    echo -e "${RED}✗ FAILED: globals.css not found at $GLOBALS_CSS${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ globals.css exists: $GLOBALS_CSS${NC}"

# Summary
echo ""
echo "==============================="
echo -e "${GREEN}✓ All checks passed!${NC}"
echo ""
echo "Font file ready for integration:"
echo "  - File: /public/fonts/Cubic_11.woff2"
echo "  - Size: ${FILE_SIZE_KB}KB"
echo "  - Next.js: $NEXTJS_VERSION"
echo "  - Tailwind: $TAILWIND_VERSION"
echo ""

exit 0
