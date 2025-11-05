# 🚀 Backend 效能優化 - 快速指南

## 📊 Phase 1 優化已完成

### ✅ 已實施的優化
- **Workers**: 4 → 2 (節省 ~380MB)
- **資料庫連接池**: 20 → 5 (節省 ~50-100MB)
- **日誌系統**: 檔案日誌關閉 (節省 ~30MB)
- **Scheduler**: 執行緒 10 → 3 (節省 ~20MB)
- **GZip 壓縮**: 啟用 (回應體積減少 60-80%)
- **記憶體監控**: 新增 `/api/v1/monitoring/metrics/memory` 端點

### 🎯 預期效果
```
記憶體使用: 750-770MB → 220-350MB
記憶體節省: 60-70% (480-530MB)
```

---

## 🧪 本地測試

### 1. 快速測試腳本
```bash
cd backend
./test_memory.sh
```

### 2. 手動測試步驟

#### 啟動服務
```bash
cd backend
uvicorn app.main:app --workers 2 --host 0.0.0.0 --port 8000
```

#### 檢查記憶體
```bash
curl http://localhost:8000/api/v1/monitoring/metrics/memory | jq
```

#### 預期輸出
```json
{
  "status": "success",
  "memory": {
    "rss_mb": 220-350,    // 目標範圍
    "vms_mb": ...,
    "percent": ...
  },
  "cpu": {
    "percent": ...
  },
  "process": {
    "num_threads": 8-15,   // 應該比之前少
    "num_connections": ...
  },
  "cache": {
    "size": ...,
    "max_size": 1000
  }
}
```

---

## 🚀 部署到生產環境

### 1. 推送代碼
```bash
git push origin main
```

### 2. Zeabur 自動部署
- Zeabur 會自動檢測 Dockerfile 變更
- 使用新的 worker 配置重新構建
- 預計部署時間: 3-5 分鐘

### 3. 驗證部署
```bash
# 替換為你的實際域名
BACKEND_URL="https://your-backend.zeabur.app"

# 健康檢查
curl $BACKEND_URL/api/v1/monitoring/health

# 記憶體檢查
curl $BACKEND_URL/api/v1/monitoring/metrics/memory | jq '.memory'
```

### 4. 監控指標

#### 記憶體使用
```bash
# 持續監控記憶體
watch -n 5 "curl -s $BACKEND_URL/api/v1/monitoring/metrics/memory | jq '.memory.rss_mb'"
```

#### API 效能
```bash
# 測試 API 回應時間
time curl -s $BACKEND_URL/api/v1/cards > /dev/null
```

#### GZip 壓縮效果
```bash
# 未壓縮
curl -s $BACKEND_URL/api/v1/cards | wc -c

# 壓縮
curl -s -H "Accept-Encoding: gzip" $BACKEND_URL/api/v1/cards | wc -c
```

---

## 📊 Zeabur 平台監控

### 使用 Zeabur Dashboard
1. 登入 Zeabur
2. 選擇你的 Backend 服務
3. 查看 Metrics 標籤
4. 觀察:
   - **Memory Usage**: 應該在 220-350MB
   - **CPU Usage**: 應該維持在合理範圍
   - **Request Rate**: 監控是否正常服務

### 設置告警 (建議)
```yaml
Memory Alert:
  - Warning: > 400MB
  - Critical: > 500MB

Response Time Alert:
  - Warning: > 1s
  - Critical: > 3s

Error Rate Alert:
  - Warning: > 1%
  - Critical: > 5%
```

---

## 🔍 常見問題排查

### Q1: 記憶體沒有明顯下降
**檢查項目**:
```bash
# 確認 worker 數量
curl $BACKEND_URL/api/v1/monitoring/metrics/memory | jq '.process.num_threads'
# 應該比之前少 (通常 8-15 個執行緒)

# 檢查連接數
curl $BACKEND_URL/api/v1/monitoring/metrics/memory | jq '.process.num_connections'

# 查看 Zeabur 日誌
# 確認啟動時使用了 "--workers 2"
```

### Q2: API 回應變慢
**檢查項目**:
```bash
# 測試回應時間
for i in {1..10}; do
  time curl -s $BACKEND_URL/api/v1/monitoring/health > /dev/null
done

# 如果 > 500ms，可能需要:
# 1. 檢查資料庫連接池是否足夠
# 2. 考慮增加 max_overflow
# 3. 啟用更多快取
```

### Q3: 偶爾出現連接超時
**解決方案**:
```python
# 臨時調整 (如需要)
# backend/app/config.py
database_max_overflow: int = 10  # 從 5 增加到 10
```

---

## 📈 效能基準測試

### 使用 wrk 進行負載測試
```bash
# 安裝 wrk (如果沒有)
# Linux: sudo apt install wrk
# macOS: brew install wrk

# 測試健康檢查端點
wrk -t4 -c100 -d30s --latency \
  $BACKEND_URL/api/v1/monitoring/health

# 測試卡牌查詢 (READ)
wrk -t4 -c100 -d30s --latency \
  $BACKEND_URL/api/v1/cards

# 觀察:
# - Requests/sec: 應該 > 500
# - Latency (avg): 應該 < 200ms
# - Latency (99%): 應該 < 1s
```

### 同時監控記憶體
```bash
# 終端 1: 運行負載測試
wrk -t4 -c100 -d60s $BACKEND_URL/api/v1/cards

# 終端 2: 監控記憶體
watch -n 2 "curl -s $BACKEND_URL/api/v1/monitoring/metrics/memory | jq '.memory'"
```

---

## 🎯 成功標準

### Phase 1 優化成功指標
✅ **記憶體使用**: 220-350MB (從 750-770MB)
✅ **API 回應時間**: P50 < 200ms, P99 < 1s
✅ **錯誤率**: < 0.5%
✅ **GZip 壓縮**: 回應體積減少 > 60%
✅ **穩定運行**: 24 小時無崩潰

### 如果達成以上指標
👉 **進入 Phase 2 優化**:
- AI Provider 延遲載入
- 應用層快取實施
- 依賴套件清理

### 如果未達成
👉 **回滾或調整**:
```bash
# 回滾到之前的版本
git revert HEAD
git push origin main

# 或調整配置
# 增加 workers, max_overflow 等
```

---

## 📚 相關文檔

- **完整優化計畫**: `PERFORMANCE_OPTIMIZATION_PLAN.md`
- **Phase 1 完成報告**: `OPTIMIZATION_PHASE1_COMPLETE.md`
- **測試腳本**: `test_memory.sh`

---

## 🆘 需要幫助？

### 檢查日誌
```bash
# Zeabur Dashboard
# Services > Backend > Logs

# 或使用 Zeabur CLI
zeabur logs backend --tail=100
```

### 聯絡團隊
- 如果記憶體超過 500MB
- 如果 API 錯誤率 > 5%
- 如果回應時間 P99 > 3s

---

**最後更新**: 2025-11-05
**當前狀態**: ✅ Phase 1 完成，準備部署
**下一步**: 部署 → 監控 24-48h → Phase 2 規劃
