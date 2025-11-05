#!/bin/bash
echo "🧪 記憶體負載測試"
echo "=========================================="

# 記錄初始記憶體
INITIAL_MEM=$(curl -s http://localhost:8000/api/v1/monitoring/metrics/memory | jq -r '.memory.rss_mb')
echo "📊 初始記憶體: ${INITIAL_MEM} MB"

# 發送 20 個請求
echo "📡 發送 20 個 API 請求..."
for i in {1..20}; do
  curl -s http://localhost:8000/api/v1/cards?limit=10 > /dev/null
done

# 等待穩定
sleep 2

# 記錄負載後記憶體
AFTER_MEM=$(curl -s http://localhost:8000/api/v1/monitoring/metrics/memory | jq -r '.memory.rss_mb')
echo "📊 負載後記憶體: ${AFTER_MEM} MB"

# 計算差異
DIFF=$(echo "$AFTER_MEM - $INITIAL_MEM" | bc)
echo "📈 記憶體增長: ${DIFF} MB"

# 獲取完整資訊
echo ""
echo "📋 詳細記憶體報告:"
curl -s http://localhost:8000/api/v1/monitoring/metrics/memory | jq '.'
