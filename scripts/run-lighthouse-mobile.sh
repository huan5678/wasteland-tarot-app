#!/bin/bash

##############################################################################
# Lighthouse Mobile Audit Script
# mobile-native-app-layout Phase 5: Performance Testing
#
# Target Score: ≥ 90
# Performance Metrics:
# - FCP ≤ 1.5s
# - LCP ≤ 2.5s
# - CLS ≤ 0.1
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_PORT=3000
LIGHTHOUSE_PORT=9001
OUTPUT_DIR="./lighthouse-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="${OUTPUT_DIR}/mobile_${TIMESTAMP}"

# URLs to test
URLS=(
  "http://localhost:${SERVER_PORT}"
  "http://localhost:${SERVER_PORT}/dashboard"
  "http://localhost:${SERVER_PORT}/cards"
  "http://localhost:${SERVER_PORT}/readings"
  "http://localhost:${SERVER_PORT}/achievements"
  "http://localhost:${SERVER_PORT}/profile"
)

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         LIGHTHOUSE MOBILE PERFORMANCE AUDIT                   ║${NC}"
echo -e "${BLUE}║         mobile-native-app-layout Phase 5                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create report directory
mkdir -p "${REPORT_DIR}"

# Check if server is running
echo -e "${YELLOW}Checking if development server is running on port ${SERVER_PORT}...${NC}"
if ! nc -z localhost ${SERVER_PORT} 2>/dev/null; then
  echo -e "${RED}❌ Server not running on port ${SERVER_PORT}${NC}"
  echo -e "${YELLOW}Please start the server with: bun run dev${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
  echo -e "${RED}❌ Lighthouse not found${NC}"
  echo -e "${YELLOW}Installing Lighthouse...${NC}"
  npm install -g lighthouse
fi

# Run Lighthouse for each URL
TOTAL_URLS=${#URLS[@]}
PASSED_URLS=0
FAILED_URLS=0

for i in "${!URLS[@]}"; do
  url="${URLS[$i]}"
  url_number=$((i + 1))

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Testing URL ${url_number}/${TOTAL_URLS}: ${url}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Generate safe filename
  url_name=$(echo "${url}" | sed 's/http:\/\/localhost:[0-9]*//g' | sed 's/\//-/g' | sed 's/^-//')
  if [ -z "$url_name" ]; then
    url_name="home"
  fi

  report_file="${REPORT_DIR}/${url_name}"

  # Run Lighthouse with mobile settings
  lighthouse "${url}" \
    --output html \
    --output json \
    --output-path="${report_file}" \
    --emulated-form-factor=mobile \
    --screenEmulation.mobile=true \
    --screenEmulation.width=375 \
    --screenEmulation.height=812 \
    --screenEmulation.deviceScaleFactor=3 \
    --throttling.rttMs=150 \
    --throttling.throughputKbps=1600 \
    --throttling.cpuSlowdownMultiplier=4 \
    --only-categories=performance,accessibility,best-practices \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --quiet

  # Parse scores from JSON
  json_file="${report_file}.report.json"
  if [ -f "${json_file}" ]; then
    performance_score=$(jq -r '.categories.performance.score' "${json_file}")
    accessibility_score=$(jq -r '.categories.accessibility.score' "${json_file}")
    best_practices_score=$(jq -r '.categories["best-practices"].score' "${json_file}")

    # Convert to percentage
    performance_pct=$(echo "${performance_score} * 100" | bc)
    accessibility_pct=$(echo "${accessibility_score} * 100" | bc)
    best_practices_pct=$(echo "${best_practices_score} * 100" | bc)

    # Get Core Web Vitals
    fcp=$(jq -r '.audits["first-contentful-paint"].numericValue' "${json_file}")
    lcp=$(jq -r '.audits["largest-contentful-paint"].numericValue' "${json_file}")
    cls=$(jq -r '.audits["cumulative-layout-shift"].numericValue' "${json_file}")

    # Convert to seconds
    fcp_sec=$(echo "scale=2; ${fcp} / 1000" | bc)
    lcp_sec=$(echo "scale=2; ${lcp} / 1000" | bc)

    echo ""
    echo -e "${BLUE}Scores:${NC}"
    echo -e "  Performance:      ${performance_pct}%"
    echo -e "  Accessibility:    ${accessibility_pct}%"
    echo -e "  Best Practices:   ${best_practices_pct}%"
    echo ""
    echo -e "${BLUE}Core Web Vitals:${NC}"
    echo -e "  FCP:  ${fcp_sec}s  (target: ≤1.5s)"
    echo -e "  LCP:  ${lcp_sec}s  (target: ≤2.5s)"
    echo -e "  CLS:  ${cls}    (target: ≤0.1)"
    echo ""

    # Check if passed (performance ≥ 90)
    if (( $(echo "${performance_score} >= 0.90" | bc -l) )); then
      echo -e "${GREEN}✅ PASSED - Performance score ≥ 90${NC}"
      PASSED_URLS=$((PASSED_URLS + 1))
    else
      echo -e "${RED}❌ FAILED - Performance score < 90${NC}"
      FAILED_URLS=$((FAILED_URLS + 1))
    fi

    echo -e "${BLUE}Report: ${report_file}.report.html${NC}"
  else
    echo -e "${RED}❌ Failed to generate report${NC}"
    FAILED_URLS=$((FAILED_URLS + 1))
  fi

  echo ""
done

# Summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      AUDIT SUMMARY                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total URLs tested:  ${TOTAL_URLS}"
echo -e "${GREEN}Passed:            ${PASSED_URLS}${NC}"
if [ ${FAILED_URLS} -gt 0 ]; then
  echo -e "${RED}Failed:            ${FAILED_URLS}${NC}"
else
  echo -e "${GREEN}Failed:            ${FAILED_URLS}${NC}"
fi
echo ""
echo -e "Reports saved to: ${REPORT_DIR}"
echo ""

if [ ${FAILED_URLS} -eq 0 ]; then
  echo -e "${GREEN}✅ All pages passed Lighthouse mobile audit!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some pages failed Lighthouse mobile audit${NC}"
  echo -e "${YELLOW}Review reports in: ${REPORT_DIR}${NC}"
  exit 1
fi
