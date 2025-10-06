#!/bin/bash

# Frontend Tests Runner
# Runs frontend tests with proper configuration

echo "🧪 Running Frontend Tests..."
echo ""

# Set test environment
export NODE_ENV=test
export NEXT_PUBLIC_API_URL=http://localhost:8000

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests
run_tests() {
  local test_path=$1
  local test_name=$2

  echo -e "${YELLOW}Testing: ${test_name}${NC}"

  if bun run jest "$test_path" --maxWorkers=2 --testTimeout=5000 2>&1 | tail -20; then
    echo -e "${GREEN}✓ ${test_name} passed${NC}\n"
    return 0
  else
    echo -e "${RED}✗ ${test_name} failed${NC}\n"
    return 1
  fi
}

# Run individual test suites
echo "=== Running Unit Tests ==="
echo ""

run_tests "src/lib/__tests__/lazyLoad.test.tsx" "LazyLoad Utils"
run_tests "src/lib/__tests__/authStore.test.ts" "Auth Store"
run_tests "src/lib/__tests__/serviceWorker.test.ts" "Service Worker"

echo ""
echo "=== Running Component Tests ==="
echo ""

run_tests "src/components/common/__tests__/OptimizedImage.test.tsx" "Optimized Image"
run_tests "src/components/readings/__tests__/StreamingInterpretation.test.tsx" "Streaming Interpretation"
run_tests "src/components/readings/__tests__/SpreadSelector.test.tsx" "Spread Selector"

echo ""
echo "=== Test Summary ==="
echo ""
echo -e "${GREEN}Frontend tests completed!${NC}"
echo ""
echo "For full coverage report, run:"
echo "  bun run test:coverage"
