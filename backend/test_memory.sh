#!/bin/bash
# Memory Optimization Test Script
# Tests the Phase 1 optimizations locally

echo "🔍 Backend Memory Optimization Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
if ! curl -s http://localhost:8000/api/v1/monitoring/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on localhost:8000${NC}"
    echo "Please start the backend first:"
    echo "  cd backend"
    echo "  uvicorn app.main:app --workers 2 --host 0.0.0.0 --port 8000"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Test health check
echo "1️⃣ Testing Health Check..."
HEALTH=$(curl -s http://localhost:8000/api/v1/monitoring/health | jq -r '.status')
if [ "$HEALTH" = "healthy" ]; then
    echo -e "${GREEN}   ✅ Health check passed${NC}"
else
    echo -e "${RED}   ❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test memory metrics
echo "2️⃣ Fetching Memory Metrics..."
MEMORY_RESPONSE=$(curl -s http://localhost:8000/api/v1/monitoring/metrics/memory)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Memory endpoint accessible${NC}"
    echo ""
    
    # Parse memory metrics
    RSS_MB=$(echo $MEMORY_RESPONSE | jq -r '.memory.rss_mb')
    VMS_MB=$(echo $MEMORY_RESPONSE | jq -r '.memory.vms_mb')
    PERCENT=$(echo $MEMORY_RESPONSE | jq -r '.memory.percent')
    CPU=$(echo $MEMORY_RESPONSE | jq -r '.cpu.percent')
    THREADS=$(echo $MEMORY_RESPONSE | jq -r '.process.num_threads')
    
    echo "   📊 Memory Usage:"
    echo "      RSS: ${RSS_MB} MB"
    echo "      VMS: ${VMS_MB} MB"
    echo "      Memory %: ${PERCENT}%"
    echo ""
    echo "   📊 Process Info:"
    echo "      CPU %: ${CPU}%"
    echo "      Threads: ${THREADS}"
    echo ""
    
    # Check if memory is within target range
    RSS_INT=$(echo $RSS_MB | awk '{print int($1)}')
    
    if [ $RSS_INT -lt 400 ]; then
        echo -e "${GREEN}   ✅ Memory usage is optimal (< 400 MB)${NC}"
        echo -e "${GREEN}   🎯 Target achieved!${NC}"
    elif [ $RSS_INT -lt 550 ]; then
        echo -e "${YELLOW}   ⚠️  Memory usage is acceptable (400-550 MB)${NC}"
        echo -e "${YELLOW}   📝 Consider Phase 2 optimizations${NC}"
    else
        echo -e "${RED}   ❌ Memory usage is high (> 550 MB)${NC}"
        echo -e "${RED}   🔧 Phase 1 optimizations may not be applied${NC}"
    fi
else
    echo -e "${RED}   ❌ Failed to fetch memory metrics${NC}"
    exit 1
fi
echo ""

# Test GZip compression
echo "3️⃣ Testing GZip Compression..."
UNCOMPRESSED=$(curl -s http://localhost:8000/api/v1/cards | wc -c)
COMPRESSED=$(curl -s -H "Accept-Encoding: gzip" http://localhost:8000/api/v1/cards | wc -c)

if [ $COMPRESSED -lt $UNCOMPRESSED ]; then
    RATIO=$(echo "scale=1; ($UNCOMPRESSED - $COMPRESSED) * 100 / $UNCOMPRESSED" | bc)
    echo -e "${GREEN}   ✅ GZip compression working${NC}"
    echo "      Uncompressed: $UNCOMPRESSED bytes"
    echo "      Compressed: $COMPRESSED bytes"
    echo "      Savings: ${RATIO}%"
else
    echo -e "${YELLOW}   ⚠️  GZip compression may not be working${NC}"
fi
echo ""

# Test cache
echo "4️⃣ Testing Cache System..."
CACHE_STATS=$(curl -s http://localhost:8000/api/v1/monitoring/metrics/memory | jq -r '.cache')
if [ "$CACHE_STATS" != "null" ]; then
    echo -e "${GREEN}   ✅ Cache system is active${NC}"
    echo "      Cache: $CACHE_STATS"
else
    echo -e "${YELLOW}   ⚠️  Cache stats not available${NC}"
fi
echo ""

# Performance test (simple)
echo "5️⃣ Running Quick Performance Test..."
echo "   Testing 10 concurrent requests..."

START_TIME=$(date +%s%N)
for i in {1..10}; do
    curl -s http://localhost:8000/api/v1/monitoring/health > /dev/null &
done
wait
END_TIME=$(date +%s%N)

DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))
AVG_RESPONSE=$(( $DURATION / 10 ))

if [ $AVG_RESPONSE -lt 100 ]; then
    echo -e "${GREEN}   ✅ Performance excellent (avg: ${AVG_RESPONSE}ms)${NC}"
elif [ $AVG_RESPONSE -lt 500 ]; then
    echo -e "${GREEN}   ✅ Performance good (avg: ${AVG_RESPONSE}ms)${NC}"
else
    echo -e "${YELLOW}   ⚠️  Performance acceptable (avg: ${AVG_RESPONSE}ms)${NC}"
fi
echo ""

# Summary
echo "===================================="
echo "📋 Test Summary"
echo "===================================="
echo ""
echo "Phase 1 Optimization Status:"
echo "  • Workers: Expected 2"
echo "  • Memory Target: < 400 MB"
echo "  • Current Memory: ${RSS_MB} MB"
echo ""

if [ $RSS_INT -lt 400 ]; then
    echo -e "${GREEN}✅ Phase 1 optimization is successful!${NC}"
    echo ""
    echo "Next Steps:"
    echo "  1. Monitor for 24-48 hours"
    echo "  2. Check error rates and performance"
    echo "  3. Deploy to production if stable"
    echo "  4. Plan Phase 2 optimizations"
else
    echo -e "${YELLOW}⚠️  Phase 1 optimization partially applied${NC}"
    echo ""
    echo "Recommendations:"
    echo "  1. Verify Docker configuration"
    echo "  2. Check if all changes are deployed"
    echo "  3. Review logs for any issues"
    echo "  4. Consider Phase 2 optimizations"
fi
echo ""
