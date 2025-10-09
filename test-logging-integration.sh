#!/bin/bash

echo "🔍 Testing Logging & Monitoring Integration"
echo "==========================================="
echo ""

# Check if backend is running
echo "1. Checking backend health..."
curl -s http://localhost:8000/health | jq '.status' || echo "❌ Backend not running"
echo ""

# Test monitoring endpoints
echo "2. Testing monitoring endpoints..."
echo ""

echo "   📊 Metrics:"
curl -s http://localhost:8000/api/v1/monitoring/metrics | jq '.data.timestamp' || echo "❌ Failed"
echo ""

echo "   📈 Metrics Averages (5min):"
curl -s http://localhost:8000/api/v1/monitoring/metrics/averages?minutes=5 | jq '.data' || echo "❌ Failed"
echo ""

echo "   ❌ Error Summary:"
curl -s http://localhost:8000/api/v1/monitoring/errors/summary | jq '.data' || echo "❌ Failed"
echo ""

echo "   📝 Recent Errors:"
curl -s http://localhost:8000/api/v1/monitoring/errors?limit=5 | jq '.count' || echo "❌ Failed"
echo ""

# Test making some API calls to generate logs
echo "3. Generating test logs..."
echo ""

echo "   Making API calls to generate metrics..."
for i in {1..5}; do
  curl -s http://localhost:8000/api/v1/cards?limit=1 > /dev/null
  echo "   Request $i/5 completed"
done
echo ""

# Check updated metrics
echo "4. Checking updated metrics..."
curl -s http://localhost:8000/api/v1/monitoring/metrics | jq '.data.recent_5min' || echo "❌ Failed"
echo ""

# Check log files
echo "5. Checking log files..."
if [ -d "backend/logs" ]; then
  echo "   ✅ Log directory exists"
  ls -lh backend/logs/
else
  echo "   ❌ Log directory not found"
fi
echo ""

echo "==========================================="
echo "✅ Integration test complete!"
echo ""
echo "Next steps:"
echo "1. Check logs at backend/logs/"
echo "2. View Swagger docs at http://localhost:8000/docs"
echo "3. Test frontend metrics in browser console"
