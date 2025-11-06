# TTS 故障排除指南

## 概述

本文檔提供常見 TTS 問題的診斷和解決方法。

---

## 常見問題

### 1. TTS 合成失敗

#### 症狀
- API 返回 500 錯誤
- 錯誤訊息: "TTS service temporarily unavailable"
- 日誌顯示: "TTS client not initialized"

#### 診斷步驟

1. **檢查 Google Cloud 憑證**
   ```bash
   # 檢查環境變數
   echo $GOOGLE_CLOUD_CREDENTIALS_JSON | jq .project_id

   # 或檢查憑證檔案
   cat $GOOGLE_APPLICATION_CREDENTIALS
   ```

2. **檢查 TTS 服務狀態**
   ```bash
   # 檢查健康端點
   curl http://localhost:8000/api/v1/monitoring/health
   ```

3. **檢查服務日誌**
   ```bash
   # 查看最新錯誤
   tail -n 100 backend/backend.log | grep -i "tts\|error"
   ```

#### 解決方法

**問題**: 憑證未配置
```bash
# 設置環境變數
export GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'

# 或設置憑證檔案路徑
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

**問題**: 憑證過期或無效
- 重新生成 Google Cloud 服務帳號金鑰
- 確認服務帳號有 `Cloud Text-to-Speech API User` 角色

**問題**: API 配額用完
- 檢查 Google Cloud Console 的 API 使用量
- 確認配額限制
- 考慮升級配額

---

### 2. Chirp 3:HD 合成失敗，Fallback 到 WaveNet

#### 症狀
- Metrics 顯示高 fallback 率 (> 5%)
- 日誌顯示: "Chirp 3:HD failed, falling back to WaveNet"

#### 診斷步驟

1. **檢查錯誤類型**
   ```bash
   # 查看 fallback 錯誤類型
   python scripts/monitor_chirp3_rollout.py | grep "Fallback"
   ```

2. **檢查 Google Cloud TTS API 狀態**
   - 訪問 [Google Cloud Status](https://status.cloud.google.com/)
   - 檢查 Text-to-Speech API 狀態

3. **檢查語音名稱是否有效**
   ```python
   from app.services.tts_service import CHIRP3_VOICE_MAPPING
   # 確認語音名稱格式正確
   ```

#### 解決方法

**問題**: 無效的語音名稱
- 確認角色 key 在 `CHIRP3_VOICE_MAPPING` 中
- 驗證語音名稱格式: `en-US-Chirp3-HD-{VoiceName}`

**問題**: API 暫時不可用
- 等待 Google Cloud 恢復服務
- 暫時依賴 fallback 機制

**問題**: 配額限制
- 檢查 API 配額
- 考慮增加配額或優化使用

---

### 3. 合成時間過長

#### 症狀
- 平均合成時間 > 2 秒
- P95 合成時間 > 5 秒
- 使用者體驗受影響

#### 診斷步驟

1. **檢查網路連線**
   ```bash
   # 測試 Google Cloud API 連線
   curl -I https://texttospeech.googleapis.com
   ```

2. **檢查文字長度**
   - 長文字會導致更長的合成時間
   - 目標: < 2000 字元

3. **檢查快取命中率**
   ```bash
   python scripts/monitor_chirp3_rollout.py | grep "Cache"
   ```

#### 解決方法

**問題**: 文字過長
- 將長文字分段處理
- 使用批量合成 API

**問題**: 快取未命中
- 檢查 Redis 連線
- 確認快取配置正確
- 優化快取策略

**問題**: 網路延遲
- 檢查 Google Cloud 區域設定
- 考慮使用 CDN 加速

---

### 4. 語音品質問題

#### 症狀
- 語音聽起來不自然
- 特定角色語音不匹配
- 發音不正確

#### 診斷步驟

1. **檢查語音映射**
   ```python
   from app.services.tts_service import CHIRP3_VOICE_MAPPING
   # 確認角色使用正確的語音
   ```

2. **檢查語音參數**
   ```python
   from app.services.tts_service import DEFAULT_VOICE_CONFIGS
   # 確認 pitch/rate 參數合理
   ```

3. **測試自訂發音**
   - 使用自訂發音改善特定詞彙
   - 參考 `chirp3_voice_mapping.md` 調整語音

#### 解決方法

**問題**: 語音不匹配角色
- 參考 `chirp3_voice_mapping.md` 調整語音映射
- 調整 pitch/rate 參數

**問題**: 發音不正確
- 添加自訂發音（IPA 音標）
- 使用 `custom_pronunciations` 參數

**問題**: 語音參數不當
- 調整 `DEFAULT_VOICE_CONFIGS` 中的參數
- 使用 `voice_controls` 運行時調整

---

### 5. 快取問題

#### 症狀
- 快取命中率 < 90%
- 重複請求未使用快取
- Redis 連線錯誤

#### 診斷步驟

1. **檢查 Redis 連線**
   ```bash
   # 測試 Redis 連線
   redis-cli -u $REDIS_URL ping
   ```

2. **檢查快取 key 計算**
   ```python
   # 確認相同參數產生相同 key
   key1 = service.compute_cache_key(...)
   key2 = service.compute_cache_key(...)
   assert key1 == key2
   ```

3. **檢查快取 TTL**
   - Redis 快取: 5 分鐘
   - 資料庫快取: 永久

#### 解決方法

**問題**: Redis 未連線
```bash
# 檢查環境變數
echo $REDIS_URL

# 重啟 Redis 或更新連線字串
```

**問題**: 快取 key 不一致
- 確認所有參數都包含在 cache key 中
- 檢查參數順序是否影響 hash

**問題**: 快取過期太快
- 調整 Redis TTL（如果有需要）
- 確認資料庫快取正常運作

---

### 6. 角色相關問題

#### 症狀
- 特定角色合成失敗
- 錯誤: "No Chirp 3:HD voice for character"

#### 診斷步驟

1. **檢查角色 key 是否有效**
   ```python
   from app.services.tts_service import CHIRP3_VOICE_MAPPING, DEFAULT_VOICE_CONFIGS

   character_key = "your_character"
   assert character_key in CHIRP3_VOICE_MAPPING
   assert character_key in DEFAULT_VOICE_CONFIGS
   ```

2. **檢查語音名稱格式**
   ```python
   voice_name = CHIRP3_VOICE_MAPPING[character_key]
   assert voice_name.startswith("en-US-Chirp3-HD-")
   ```

#### 解決方法

**問題**: 無效的角色 key
- 使用有效的角色識別碼（14 個角色之一）
- 檢查拼寫和大小寫

**問題**: 語音映射缺失
- 在 `CHIRP3_VOICE_MAPPING` 中添加映射
- 參考 `chirp3_voice_mapping.md` 選擇合適的語音

---

## 診斷工具

### 監控腳本

```bash
# 檢查系統狀態
python scripts/monitor_chirp3_rollout.py --watch

# 驗證部署
python scripts/verify_deployment.py --exit-on-error
```

### Prometheus 查詢

```promql
# 錯誤率
sum(rate(tts_synthesis_total{status="error"}[5m])) / sum(rate(tts_synthesis_total[5m]))

# Fallback 率
sum(rate(tts_chirp3_fallback_total[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m]))

# 平均合成時間
rate(tts_synthesis_duration_seconds_sum[5m]) / rate(tts_synthesis_duration_seconds_count[5m])
```

---

## 支援資源

### 內部文檔
- **TTS 服務文檔**: `tts_service.md`
- **語音映射說明**: `chirp3_voice_mapping.md`
- **環境變數配置**: `CHIRP3_ENV_VARIABLES.md`
- **監控指標**: `TTS_METRICS.md`

### 外部資源
- [Google Cloud TTS 文檔](https://cloud.google.com/text-to-speech/docs)
- [Chirp 3:HD 文檔](https://cloud.google.com/text-to-speech/docs/chirp)
- [Prometheus 查詢語言](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

## 聯絡支援

如果問題無法解決：

1. **檢查日誌**: `backend/backend.log`
2. **收集診斷資訊**:
   - 錯誤訊息
   - 相關日誌
   - 環境變數（隱藏敏感資訊）
   - Metrics 數據
3. **聯絡技術團隊**

---

**最後更新**: 2025-11-04
