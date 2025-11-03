# 停用 WaveNet Fallback 指南 (Task 5.1)

## 概述

當 Chirp 3:HD 已經穩定運行 2 週以上後，可以考慮停用自動降級到 WaveNet 的功能。這可以簡化系統邏輯並確保所有請求都使用高品質的 Chirp 3:HD 語音。

**重要**: 只有在確認 Chirp 3:HD 穩定且不需要 fallback 時才執行此操作。

---

## 前提條件

在停用 fallback 之前，必須確認：

### 穩定性檢查清單

- [ ] **Chirp 3:HD 已穩定運行 2 週以上**
- [ ] **錯誤率 < 1%** (過去 2 週)
- [ ] **Fallback 率 < 1%** (過去 2 週)
- [ ] **平均合成時間 < 2 秒** (過去 2 週)
- [ ] **P95 合成時間 < 3 秒** (過去 2 週)
- [ ] **無使用者投訴** (過去 2 週)
- [ ] **無系統穩定性問題** (過去 2 週)

### 監控數據驗證

執行以下命令檢查過去 2 週的數據：

```bash
# 檢查錯誤率
python scripts/monitor_chirp3_rollout.py --url <metrics-url>

# 或從 Prometheus 查詢
# 過去 2 週的錯誤率
sum(rate(tts_synthesis_total{voice_model="chirp3-hd", status="error"}[14d])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[14d])) * 100

# 過去 2 週的 fallback 率
sum(rate(tts_chirp3_fallback_total[14d])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[14d])) * 100
```

---

## 停用步驟

### 步驟 1: 更新環境變數

**Staging 環境**:
```bash
CHIRP3_FALLBACK_TO_WAVENET=false
```

**生產環境**:
```bash
CHIRP3_FALLBACK_TO_WAVENET=false
```

### 步驟 2: 重啟服務

根據部署平台重啟服務以應用新的環境變數。

### 步驟 3: 驗證配置

```bash
# 檢查配置是否生效
python scripts/verify_deployment.py --url <api-url>

# 應該看到：
# CHIRP3_FALLBACK_TO_WAVENET=false
```

### 步驟 4: 監控 24 小時

停用 fallback 後，密切監控 24 小時：

```bash
# 啟動即時監控
python scripts/monitor_chirp3_rollout.py --watch --interval 300
```

**監控重點**:
- 錯誤率不應增加
- 合成時間應保持穩定
- 使用者體驗不受影響

---

## 風險評估

### 潛在風險

1. **Chirp 3:HD API 暫時不可用**
   - **影響**: 所有 TTS 請求會失敗
   - **緩解**: 監控 Google Cloud TTS API 狀態，設置告警

2. **Chirp 3:HD API 限流**
   - **影響**: 請求被限流，返回錯誤
   - **緩解**: 監控 API 使用量，設置限流告警

3. **特定角色語音問題**
   - **影響**: 特定角色的合成失敗
   - **緩解**: 監控各角色的錯誤率

### 回滾計劃

如果停用 fallback 後出現問題，立即回滾：

```bash
# 快速回滾
CHIRP3_FALLBACK_TO_WAVENET=true
# 重啟服務
```

---

## 停用後的監控

### 關鍵指標

在停用 fallback 的第一週，密切監控：

1. **錯誤率趨勢**
   ```promql
   sum(rate(tts_synthesis_total{voice_model="chirp3-hd", status="error"}[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m]))
   ```

2. **合成時間趨勢**
   ```promql
   histogram_quantile(0.95, rate(tts_synthesis_duration_seconds_bucket{voice_model="chirp3-hd"}[5m]))
   ```

3. **使用者影響**
   - 監控使用者投訴
   - 檢查錯誤日誌
   - 追蹤 API 使用模式

### 告警設置

設置以下告警：

```yaml
# Chirp 3:HD 錯誤率 > 2%
- alert: Chirp3HighErrorRate
  expr: sum(rate(tts_synthesis_total{voice_model="chirp3-hd", status="error"}[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m])) > 0.02
  for: 5m
  annotations:
    summary: "Chirp 3:HD 錯誤率過高（fallback 已停用）"
    action: "檢查 Google Cloud TTS API 狀態，考慮重新啟用 fallback"
```

---

## 檢查清單

### 停用前

- [ ] 確認穩定性檢查清單全部通過
- [ ] 審查過去 2 週的監控數據
- [ ] 獲得團隊批准
- [ ] 準備回滾計劃
- [ ] 設置額外告警

### 停用執行

- [ ] 更新環境變數
- [ ] 重啟服務
- [ ] 驗證配置生效
- [ ] 啟動監控

### 停用後（第一週）

- [ ] 每日檢查錯誤率
- [ ] 每日檢查合成時間
- [ ] 收集使用者回饋
- [ ] 檢查錯誤日誌
- [ ] 記錄任何異常

---

## 預期結果

停用 fallback 後，預期：

1. ✅ **錯誤率保持 < 1%**
2. ✅ **合成時間保持穩定**
3. ✅ **無使用者影響**
4. ✅ **系統邏輯簡化**
5. ✅ **所有請求使用 Chirp 3:HD**

---

## 相關文檔

- **回滾程序**: `CHIRP3_ROLLBACK_PROCEDURE.md`
- **監控指標**: `TTS_METRICS.md`
- **環境變數配置**: `CHIRP3_ENV_VARIABLES.md`

---

**最後更新**: 2025-11-04
