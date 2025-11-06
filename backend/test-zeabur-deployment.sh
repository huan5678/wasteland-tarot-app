#!/bin/bash
# Zeabur Deployment Test Script
# 測試 Backend 在 Zeabur 上的部署狀態

# 顏色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 請替換為你的 Zeabur backend 域名
BACKEND_URL="${1:-}"

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ 請提供 Backend URL${NC}"
    echo ""
    echo "用法:"
    echo "  $0 https://your-backend.zeabur.app"
    echo ""
    exit 1
fi

# 移除結尾的斜線
BACKEND_URL="${BACKEND_URL%/}"

echo -e "${BLUE}🔍 Testing Zeabur Backend Deployment${NC}"
echo "===================================="
echo "URL: $BACKEND_URL"
echo ""

# Test 1: 根路徑
echo -e "${YELLOW}1️⃣ Testing Root Endpoint (/)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    MESSAGE=$(echo "$BODY" | jq -r '.message' 2>/dev/null || echo "N/A")
    echo -e "${GREEN}   ✅ Status: $HTTP_CODE${NC}"
    echo "   Message: $MESSAGE"
else
    echo -e "${RED}   ❌ Status: $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: 健康檢查
echo -e "${YELLOW}2️⃣ Testing Health Check (/health)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null || echo "N/A")
    echo -e "${GREEN}   ✅ Status: $HTTP_CODE${NC}"
    echo "   Health: $STATUS"
else
    echo -e "${RED}   ❌ Status: $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: API v1 健康檢查
echo -e "${YELLOW}3️⃣ Testing API v1 Health (/api/v1/monitoring/health)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/v1/monitoring/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null || echo "N/A")
    echo -e "${GREEN}   ✅ Status: $HTTP_CODE${NC}"
    echo "   Status: $STATUS"
else
    echo -e "${RED}   ❌ Status: $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 4: 記憶體監控
echo -e "${YELLOW}4️⃣ Testing Memory Metrics (/api/v1/monitoring/metrics/memory)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/v1/monitoring/metrics/memory")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    RSS_MB=$(echo "$BODY" | jq -r '.memory.rss_mb' 2>/dev/null || echo "N/A")
    CPU=$(echo "$BODY" | jq -r '.cpu.percent' 2>/dev/null || echo "N/A")
    THREADS=$(echo "$BODY" | jq -r '.process.num_threads' 2>/dev/null || echo "N/A")
    
    echo -e "${GREEN}   ✅ Status: $HTTP_CODE${NC}"
    echo "   Memory (RSS): ${RSS_MB} MB"
    echo "   CPU: ${CPU}%"
    echo "   Threads: $THREADS"
    
    # 檢查記憶體是否在目標範圍
    RSS_INT=$(echo $RSS_MB | awk '{print int($1)}')
    if [ ! -z "$RSS_INT" ] && [ "$RSS_INT" -lt 500 ]; then
        echo -e "${GREEN}   🎯 Memory optimization successful!${NC}"
    elif [ ! -z "$RSS_INT" ] && [ "$RSS_INT" -lt 700 ]; then
        echo -e "${YELLOW}   ⚠️  Memory acceptable but could be better${NC}"
    else
        echo -e "${RED}   ❌ Memory usage high${NC}"
    fi
else
    echo -e "${RED}   ❌ Status: $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 5: 回應時間
echo -e "${YELLOW}5️⃣ Testing Response Time${NC}"
TOTAL_TIME=0
REQUESTS=5

for i in $(seq 1 $REQUESTS); do
    TIME=$(curl -o /dev/null -s -w '%{time_total}\n' "$BACKEND_URL/health")
    TOTAL_TIME=$(echo "$TOTAL_TIME + $TIME" | bc)
    echo "   Request $i: ${TIME}s"
done

AVG_TIME=$(echo "scale=3; $TOTAL_TIME / $REQUESTS" | bc)
echo "   Average: ${AVG_TIME}s"

AVG_MS=$(echo "$AVG_TIME * 1000" | bc | awk '{print int($1)}')
if [ $AVG_MS -lt 200 ]; then
    echo -e "${GREEN}   ✅ Excellent response time${NC}"
elif [ $AVG_MS -lt 500 ]; then
    echo -e "${GREEN}   ✅ Good response time${NC}"
elif [ $AVG_MS -lt 1000 ]; then
    echo -e "${YELLOW}   ⚠️  Acceptable response time${NC}"
else
    echo -e "${RED}   ❌ Slow response time${NC}"
fi
echo ""

# Summary
echo "===================================="
echo -e "${BLUE}📋 Test Summary${NC}"
echo "===================================="
echo ""

# 檢查所有測試是否通過
ALL_PASSED=true

# 重新測試關鍵端點
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/")
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/monitoring/health")
MEMORY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/monitoring/metrics/memory")

if [ "$ROOT_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Root endpoint working${NC}"
else
    echo -e "${RED}❌ Root endpoint failed ($ROOT_STATUS)${NC}"
    ALL_PASSED=false
fi

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health check working${NC}"
else
    echo -e "${RED}❌ Health check failed ($HEALTH_STATUS)${NC}"
    ALL_PASSED=false
fi

if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API v1 working${NC}"
else
    echo -e "${RED}❌ API v1 failed ($API_STATUS)${NC}"
    ALL_PASSED=false
fi

if [ "$MEMORY_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Memory monitoring working${NC}"
else
    echo -e "${RED}❌ Memory monitoring failed ($MEMORY_STATUS)${NC}"
    ALL_PASSED=false
fi

echo ""

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor memory usage for 24-48 hours"
    echo "  2. Check error rates in Zeabur logs"
    echo "  3. Test API functionality"
    echo "  4. Plan Phase 2 optimizations if stable"
else
    echo -e "${RED}⚠️  Some tests failed. Please check:${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check Zeabur logs: Dashboard > Backend > Logs"
    echo "  2. Verify environment variables are set"
    echo "  3. Check DATABASE_URL (should use port 6543)"
    echo "  4. See ZEABUR_502_FIX.md for detailed guide"
fi
echo ""
