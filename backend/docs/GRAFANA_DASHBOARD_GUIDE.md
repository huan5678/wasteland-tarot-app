# Grafana Dashboard 使用指南

## 概述

本文檔說明如何導入和使用 Chirp 3:HD TTS 系統的 Grafana 監控儀表板。

**Dashboard JSON**: `backend/monitoring/grafana-chirp3-dashboard.json`

---

## 導入 Dashboard

### 方法 1: 通過 Grafana UI

1. **登入 Grafana**
   - 訪問 Grafana 實例
   - 使用管理員帳號登入

2. **導入 Dashboard**
   - 點擊側邊欄的 "+" → "Import"
   - 點擊 "Upload JSON file"
   - 選擇 `grafana-chirp3-dashboard.json`
   - 點擊 "Load"

3. **配置資料來源**
   - 選擇 Prometheus 資料來源
   - 確認 metrics 端點 URL
   - 點擊 "Import"

### 方法 2: 通過 API

```bash
# 使用 Grafana API 導入
curl -X POST \
  http://grafana.example.com/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <api-key>" \
  -d @backend/monitoring/grafana-chirp3-dashboard.json
```

---

## Dashboard 面板說明

### 面板 1-4: 關鍵指標總覽

**位置**: 頂部橫向排列

1. **Synthesis Success Rate** (合成成功率)
   - 目標: > 95%
   - 告警: < 90%

2. **Average Synthesis Time** (平均合成時間)
   - 目標: < 2 秒
   - 告警: > 5 秒

3. **P95 Synthesis Time** (P95 合成時間)
   - 目標: < 2.5 秒
   - 告警: > 5 秒

4. **Fallback Rate** (Fallback 率)
   - 目標: < 5%
   - 告警: > 10%

### 面板 5-6: 語音模型比較

**位置**: 第二行

5. **Voice Model Distribution** (語音模型分布)
   - 顯示 Chirp 3:HD vs WaveNet 的使用比例
   - 圓餅圖形式

6. **Synthesis Time by Model** (各模型合成時間)
   - 比較 Chirp 3:HD 和 WaveNet 的合成時間
   - 時間序列圖

### 面板 7-8: 角色統計

**位置**: 第三行

7. **Requests by Character** (各角色請求數)
   - 顯示各角色的 TTS 請求數
   - 條形圖

8. **Synthesis Time by Character** (各角色合成時間)
   - 顯示各角色的平均合成時間
   - 時間序列圖

### 面板 9-11: 快取和錯誤監控

**位置**: 第四行

9. **Cache Hit Rate** (快取命中率)
   - 目標: > 90%
   - 統計面板

10. **Cache Hits by Source** (各來源快取命中數)
    - 顯示 Redis、DB、New 的快取分布
    - 條形圖

11. **Error Rate** (錯誤率)
    - 目標: < 1%
    - 時間序列圖

### 面板 12-15: 詳細分析

**位置**: 第五行及以下

12. **Fallback by Error Type** (各錯誤類型 Fallback)
    - 顯示導致 fallback 的錯誤類型分布

13. **Audio File Size Distribution** (音檔大小分布)
    - 顯示音檔大小的分佈情況

14. **Text Length Distribution** (文字長度分布)
    - 顯示合成文字長度的分佈情況

15. **Synthesis Latency Percentiles** (合成延遲百分位)
    - 顯示 P50、P95、P99 延遲趨勢

---

## 告警配置

### 高優先級告警

```yaml
groups:
  - name: tts_critical
    interval: 1m
    rules:
      - alert: HighTTSErrorRate
        expr: sum(rate(tts_synthesis_total{status="error"}[5m])) / sum(rate(tts_synthesis_total[5m])) > 0.05
        for: 5m
        annotations:
          summary: "TTS 合成錯誤率過高"
          description: "錯誤率 {{ $value | humanizePercentage }} 超過 5% 閾值"

      - alert: HighChirp3FallbackRate
        expr: sum(rate(tts_chirp3_fallback_total[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m])) > 0.10
        for: 5m
        annotations:
          summary: "Chirp 3:HD 降級率過高"
          description: "Fallback 率 {{ $value | humanizePercentage }} 超過 10% 閾值"
```

### 中優先級告警

```yaml
      - alert: SlowTTSSynthesis
        expr: histogram_quantile(0.95, rate(tts_synthesis_duration_seconds_bucket[5m])) > 2.0
        for: 10m
        annotations:
          summary: "TTS 合成時間過長"
          description: "P95 合成時間 {{ $value }}s 超過 2 秒閾值"

      - alert: LowCacheHitRate
        expr: (sum(rate(tts_cache_hits_total{source="redis"}[5m])) + sum(rate(tts_cache_hits_total{source="db"}[5m]))) / sum(rate(tts_cache_hits_total[5m])) < 0.90
        for: 15m
        annotations:
          summary: "TTS 快取命中率過低"
          description: "快取命中率 {{ $value | humanizePercentage }} 低於 90% 目標"
```

---

## 自訂 Dashboard

### 添加新面板

1. 點擊 Dashboard 右上角的 "Add" → "Visualization"
2. 選擇圖表類型
3. 輸入 PromQL 查詢
4. 配置顯示選項
5. 保存面板

### 修改現有面板

1. 點擊面板標題 → "Edit"
2. 修改 PromQL 查詢
3. 調整顯示選項
4. 保存變更

---

## 常用查詢

### 成功率查詢

```promql
# 整體成功率
sum(rate(tts_synthesis_total{status="success"}[5m])) / sum(rate(tts_synthesis_total[5m]))

# Chirp 3:HD 成功率
sum(rate(tts_synthesis_total{voice_model="chirp3-hd", status="success"}[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m]))
```

### 效能查詢

```promql
# 平均合成時間
rate(tts_synthesis_duration_seconds_sum[5m]) / rate(tts_synthesis_duration_seconds_count[5m])

# P95 合成時間
histogram_quantile(0.95, rate(tts_synthesis_duration_seconds_bucket[5m]))
```

### 快取查詢

```promql
# 快取命中率
(sum(rate(tts_cache_hits_total{source="redis"}[5m])) + sum(rate(tts_cache_hits_total{source="db"}[5m]))) / sum(rate(tts_cache_hits_total[5m]))
```

---

## 最佳實踐

### 監控頻率

- **即時監控**: 30 秒刷新
- **日常監控**: 1-5 分鐘刷新
- **歷史分析**: 15 分鐘或更長

### 告警設置

- **P0 告警**: 立即通知（錯誤率 > 5%）
- **P1 告警**: 15 分鐘內通知（效能下降）
- **P2 告警**: 每日摘要（趨勢分析）

### Dashboard 組織

- **總覽頁**: 關鍵指標（4-6 個面板）
- **詳細頁**: 各子系統詳細指標
- **分析頁**: 歷史趨勢和比較

---

## 相關文檔

- **監控指標說明**: `TTS_METRICS.md`
- **部署監控**: `CHIRP3_ROLLOUT_PLAN.md`
- **故障排除**: `TTS_TROUBLESHOOTING.md`

---

**最後更新**: 2025-11-04
