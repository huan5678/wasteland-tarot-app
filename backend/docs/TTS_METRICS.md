# TTS 系統監控指標說明

本文檔說明 Chirp 3:HD TTS 系統的 Prometheus 監控指標。

## 指標端點

### Prometheus 格式指標
- **端點**: `/api/v1/monitoring/metrics/prometheus`
- **格式**: Prometheus exposition format
- **Content-Type**: `text/plain; version=0.0.4; charset=utf-8`

### JSON 格式指標（現有）
- **端點**: `/api/v1/monitoring/metrics`
- **格式**: JSON

## TTS 指標清單

### 1. tts_synthesis_total
**類型**: Counter
**說明**: TTS 合成請求總數
**標籤**:
- `voice_model`: 語音模型（`wavenet` 或 `chirp3-hd`）
- `character_key`: 角色識別碼（如 `pip_boy`, `vault_dweller`）
- `status`: 請求狀態（`success` 或 `error`）

**範例查詢**:
```promql
# 總合成請求數
sum(tts_synthesis_total)

# Chirp 3:HD 成功請求數
sum(tts_synthesis_total{voice_model="chirp3-hd", status="success"})

# 各角色的錯誤率
sum(tts_synthesis_total{status="error"}) by (character_key) / sum(tts_synthesis_total) by (character_key)
```

### 2. tts_synthesis_duration_seconds
**類型**: Histogram
**說明**: TTS 合成耗時（秒）
**標籤**:
- `voice_model`: 語音模型
- `character_key`: 角色識別碼

**Buckets**: `[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]`

**範例查詢**:
```promql
# 平均合成時間
rate(tts_synthesis_duration_seconds_sum[5m]) / rate(tts_synthesis_duration_seconds_count[5m])

# P95 合成時間
histogram_quantile(0.95, rate(tts_synthesis_duration_seconds_bucket[5m]))

# Chirp 3:HD vs WaveNet 平均時間比較
rate(tts_synthesis_duration_seconds_sum{voice_model="chirp3-hd"}[5m]) / rate(tts_synthesis_duration_seconds_count{voice_model="chirp3-hd"}[5m])
```

### 3. tts_cache_hits_total
**類型**: Counter
**說明**: 快取命中/未命中計數
**標籤**:
- `voice_model`: 語音模型
- `source`: 快取來源（`redis`, `db`, `new`）

**範例查詢**:
```promql
# 快取命中率
sum(rate(tts_cache_hits_total{source="redis"}[5m])) + sum(rate(tts_cache_hits_total{source="db"}[5m])) / sum(rate(tts_cache_hits_total[5m]))

# Redis 快取命中數
sum(rate(tts_cache_hits_total{source="redis"}[5m]))
```

### 4. tts_audio_file_size_bytes
**類型**: Histogram
**說明**: 音檔大小分佈（位元組）
**標籤**:
- `voice_model`: 語音模型
- `character_key`: 角色識別碼

**Buckets**: `[1000, 5000, 10000, 50000, 100000, 500000]`

**範例查詢**:
```promql
# 平均音檔大小
rate(tts_audio_file_size_bytes_sum[5m]) / rate(tts_audio_file_size_bytes_count[5m])

# P95 音檔大小
histogram_quantile(0.95, rate(tts_audio_file_size_bytes_bucket[5m]))
```

### 5. tts_chirp3_fallback_total
**類型**: Counter
**說明**: Chirp 3:HD 降級到 WaveNet 的次數
**標籤**:
- `character_key`: 角色識別碼
- `error_type`: 錯誤類型（如 `Exception`, `ValueError`）

**範例查詢**:
```promql
# 總降級次數
sum(tts_chirp3_fallback_total)

# 降級率（相對於 Chirp 3:HD 請求）
sum(rate(tts_chirp3_fallback_total[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m]))

# 各角色的降級次數
sum(rate(tts_chirp3_fallback_total[5m])) by (character_key)
```

### 6. tts_requests_by_character_total
**類型**: Counter
**說明**: 各角色的 TTS 請求總數
**標籤**:
- `character_key`: 角色識別碼
- `voice_model`: 語音模型

**範例查詢**:
```promql
# 各角色的請求數
sum(rate(tts_requests_by_character_total[5m])) by (character_key)

# 最受歡迎的角色
topk(5, sum(rate(tts_requests_by_character_total[1h])) by (character_key))
```

### 7. tts_text_length_characters
**類型**: Histogram
**說明**: TTS 合成文字長度分佈（字元數）
**標籤**:
- `voice_model`: 語音模型
- `character_key`: 角色識別碼

**Buckets**: `[10, 50, 100, 200, 500, 1000, 2000, 5000]`

**範例查詢**:
```promql
# 平均文字長度
rate(tts_text_length_characters_sum[5m]) / rate(tts_text_length_characters_count[5m])

# P95 文字長度
histogram_quantile(0.95, rate(tts_text_length_characters_bucket[5m]))
```

## 常用監控查詢

### 成功率監控
```promql
# 整體成功率
sum(rate(tts_synthesis_total{status="success"}[5m])) / sum(rate(tts_synthesis_total[5m]))

# Chirp 3:HD 成功率
sum(rate(tts_synthesis_total{voice_model="chirp3-hd", status="success"}[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m]))
```

### 效能監控
```promql
# 合成時間趨勢（5 分鐘滑動平均）
avg_over_time(tts_synthesis_duration_seconds[5m])

# 超過 2 秒的請求比例
sum(rate(tts_synthesis_duration_seconds_bucket{le="2.0"}[5m])) / sum(rate(tts_synthesis_duration_seconds_count[5m]))
```

### 降級監控
```promql
# Chirp 3:HD 降級率（目標：< 5%）
sum(rate(tts_chirp3_fallback_total[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m])) * 100
```

### 快取效率
```promql
# 快取命中率（目標：> 90%）
(sum(rate(tts_cache_hits_total{source="redis"}[5m])) + sum(rate(tts_cache_hits_total{source="db"}[5m]))) / sum(rate(tts_cache_hits_total[5m])) * 100
```

## Grafana Dashboard 建議

### 面板 1: 合成效能總覽
- **合成成功率**: `sum(rate(tts_synthesis_total{status="success"}[5m])) / sum(rate(tts_synthesis_total[5m]))`
- **平均合成時間**: `rate(tts_synthesis_duration_seconds_sum[5m]) / rate(tts_synthesis_duration_seconds_count[5m])`
- **P95 合成時間**: `histogram_quantile(0.95, rate(tts_synthesis_duration_seconds_bucket[5m]))`

### 面板 2: 語音模型比較
- **Chirp 3:HD vs WaveNet 請求數**: `sum(rate(tts_synthesis_total[5m])) by (voice_model)`
- **Chirp 3:HD vs WaveNet 平均時間**: `rate(tts_synthesis_duration_seconds_sum[5m]) / rate(tts_synthesis_duration_seconds_count[5m]) by (voice_model)`
- **Chirp 3:HD 降級率**: `sum(rate(tts_chirp3_fallback_total[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m]))`

### 面板 3: 角色使用統計
- **各角色請求數**: `sum(rate(tts_requests_by_character_total[5m])) by (character_key)`
- **各角色平均合成時間**: `rate(tts_synthesis_duration_seconds_sum[5m]) / rate(tts_synthesis_duration_seconds_count[5m]) by (character_key)`

### 面板 4: 快取效能
- **快取命中率**: `(sum(rate(tts_cache_hits_total{source="redis"}[5m])) + sum(rate(tts_cache_hits_total{source="db"}[5m]))) / sum(rate(tts_cache_hits_total[5m]))`
- **各來源快取命中數**: `sum(rate(tts_cache_hits_total[5m])) by (source)`

### 面板 5: 錯誤監控
- **錯誤率**: `sum(rate(tts_synthesis_total{status="error"}[5m])) / sum(rate(tts_synthesis_total[5m]))`
- **各錯誤類型**: `sum(rate(tts_chirp3_fallback_total[5m])) by (error_type)`

## 告警規則建議

### 高優先級告警
```yaml
# 合成錯誤率 > 5%
- alert: HighTTSErrorRate
  expr: sum(rate(tts_synthesis_total{status="error"}[5m])) / sum(rate(tts_synthesis_total[5m])) > 0.05
  for: 5m
  annotations:
    summary: "TTS 合成錯誤率過高"

# Chirp 3:HD 降級率 > 10%
- alert: HighChirp3FallbackRate
  expr: sum(rate(tts_chirp3_fallback_total[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m])) > 0.10
  for: 5m
  annotations:
    summary: "Chirp 3:HD 降級率過高"
```

### 中優先級告警
```yaml
# P95 合成時間 > 2 秒
- alert: SlowTTSSynthesis
  expr: histogram_quantile(0.95, rate(tts_synthesis_duration_seconds_bucket[5m])) > 2.0
  for: 10m
  annotations:
    summary: "TTS 合成時間過長"

# 快取命中率 < 90%
- alert: LowCacheHitRate
  expr: (sum(rate(tts_cache_hits_total{source="redis"}[5m])) + sum(rate(tts_cache_hits_total{source="db"}[5m]))) / sum(rate(tts_cache_hits_total[5m])) < 0.90
  for: 15m
  annotations:
    summary: "TTS 快取命中率過低"
```

## 相關文檔

- [Chirp 3:HD TTS 系統設計文檔](../.kiro/specs/chirp3-hd-tts-system/design.md)
- [Chirp 3:HD 環境變數配置](../docs/CHIRP3_ENV_VARIABLES.md)
- [Prometheus 官方文檔](https://prometheus.io/docs/)
