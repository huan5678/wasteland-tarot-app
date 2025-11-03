# Chirp 3:HD 漸進式滾動發布計劃 (Phase 4)

## 概述

本文檔說明 Chirp 3:HD 語音模型的漸進式滾動發布計劃，確保穩定的遷移過程。

## 發布階段

### Stage 0: Staging 部署（Chirp 3:HD 關閉）

**目標**: 部署完整代碼到 Staging，驗證無回歸問題

**環境變數配置**:
```bash
CHIRP3_ENABLED=false
CHIRP3_ROLLOUT_PERCENTAGE=0
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

**驗證清單**:
- [ ] Staging 部署成功
- [ ] 所有現有測試通過
- [ ] 無回歸問題
- [ ] Metrics 顯示正常運作
- [ ] 所有 API 端點正常

**持續時間**: 1-2 天

---

### Stage 1: 測試角色 10% 滾動 (pip_boy)

**目標**: 單一測試角色啟用 10% 流量

**環境變數配置**:
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=10
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

**監控指標**:
- [ ] 合成成功率 > 95%
- [ ] 平均合成時間 < 2秒
- [ ] Fallback 率 < 5%
- [ ] 無使用者投訴
- [ ] 快取命中率維持
- [ ] 錯誤率無增加

**監控命令**:
```bash
# 檢查 Prometheus metrics
curl http://staging-api/metrics/prometheus | grep tts_synthesis_total

# 檢查 fallback 率
curl http://staging-api/metrics/prometheus | grep tts_chirp3_fallback_total
```

**持續時間**: 24 小時

**下一步決策**:
- ✅ 所有指標正常 → 進行 Stage 2
- ❌ 發現問題 → 回滾並調查

---

### Stage 2: 測試角色 50% 滾動

**目標**: 將測試角色滾動增加到 50%

**環境變數配置**:
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=50
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

**監控指標**: 同 Stage 1

**持續時間**: 48 小時

**下一步決策**:
- ✅ 所有指標正常 → 進行 Stage 3
- ❌ 發現問題 → 回滾到 10% 或關閉

---

### Stage 3: 多角色 25% 滾動

**目標**: 擴展到 3 個角色，每個 25% 流量

**環境變數配置**:
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=25
CHIRP3_ENABLED_CHARACTERS="pip_boy,vault_dweller,wasteland_trader"
CHIRP3_FALLBACK_TO_WAVENET=true
```

**監控指標**:
- [ ] 3 個角色都正常運作
- [ ] 各角色語音品質可接受
- [ ] 無角色特定問題
- [ ] 其他指標同 Stage 1

**持續時間**: 72 小時

**下一步決策**:
- ✅ 所有指標正常 → 進行 Stage 4
- ❌ 特定角色問題 → 從列表中移除該角色

---

### Stage 4: 所有角色 50% 滾動

**目標**: 所有 14 個角色啟用 50% 流量

**環境變數配置**:
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=50
CHIRP3_ENABLED_CHARACTERS=""  # 空字串 = 所有角色
CHIRP3_FALLBACK_TO_WAVENET=true
```

**監控指標**:
- [ ] 所有角色正常運作
- [ ] 語音品質可接受
- [ ] 系統效能穩定
- [ ] 其他指標同 Stage 1

**持續時間**: 1 週

**下一步決策**:
- ✅ 所有指標正常 → 進行 Stage 5
- ❌ 發現問題 → 回滾到 Stage 3

---

### Stage 5: 100% 滾動

**目標**: 完成 100% 滾動

**環境變數配置**:
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

**監控指標**:
- [ ] 100% 流量使用 Chirp 3:HD
- [ ] 錯誤率無增加
- [ ] 使用者回饋正面
- [ ] 準備進入生產環境

**持續時間**: 1 週

**下一步決策**:
- ✅ 所有指標正常 → 部署到生產環境

---

### Stage 6: 生產環境部署

**目標**: 在生產環境重複漸進式滾動

**部署計劃**:
- **Day 1-2**: 10% 滾動，密切監控
- **Day 3-7**: 50% 滾動（如果穩定）
- **Day 8-14**: 100% 滾動（如果穩定）

**環境變數配置**: 與 Staging 相同，逐步調整

**監控**: 24/7 監控，隨時準備回滾

---

## 回滾程序

### 快速回滾

如果發現嚴重問題，立即回滾：

```bash
# 方法 1: 關閉 Chirp 3:HD
CHIRP3_ENABLED=false

# 方法 2: 降低滾動百分比
CHIRP3_ROLLOUT_PERCENTAGE=0

# 方法 3: 移除特定角色
CHIRP3_ENABLED_CHARACTERS=""
```

### 回滾決策標準

**立即回滾**:
- 錯誤率 > 10%
- 合成時間 > 5秒（平均）
- Fallback 率 > 20%
- 使用者大量投訴
- 系統不穩定

**逐步回滾**:
- 錯誤率 5-10%
- 特定角色問題
- 效能輕微下降

---

## 監控儀表板

### Prometheus 查詢

**合成成功率**:
```promql
sum(rate(tts_synthesis_total{status="success"}[5m])) / sum(rate(tts_synthesis_total[5m])) * 100
```

**平均合成時間**:
```promql
rate(tts_synthesis_duration_seconds_sum[5m]) / rate(tts_synthesis_duration_seconds_count[5m])
```

**Fallback 率**:
```promql
sum(rate(tts_chirp3_fallback_total[5m])) / sum(rate(tts_synthesis_total{voice_model="chirp3-hd"}[5m])) * 100
```

**各模型使用率**:
```promql
sum(rate(tts_synthesis_total[5m])) by (voice_model)
```

### Grafana 儀表板

建議建立以下面板：
1. 合成成功率趨勢
2. 平均合成時間比較（Chirp 3:HD vs WaveNet）
3. Fallback 率趨勢
4. 各角色使用統計
5. 錯誤率趨勢
6. 快取命中率

---

## 溝通計劃

### 內部通知

- **Stage 0**: 通知團隊 Staging 部署
- **Stage 1**: 通知團隊開始測試
- **Stage 5**: 通知團隊準備生產部署
- **Stage 6**: 通知所有利害關係人生產部署

### 使用者溝通

- **Stage 6 (10%)**: 無需通知（內部測試）
- **Stage 6 (50%)**: 可選通知（如有明顯改善）
- **Stage 6 (100%)**: 發布公告（如有需要）

---

## 風險評估

### 低風險
- Staging 環境測試
- 10% 滾動
- 單一角色測試

### 中風險
- 50% 滾動
- 多角色啟用
- 生產環境 10%

### 高風險
- 100% 滾動
- 生產環境 50%+
- 關閉 fallback

### 緩解措施
- 完整的監控和告警
- 快速回滾機制
- 24/7 待命支援
- 詳細的測試計劃

---

## 成功標準

### 技術指標
- ✅ 合成成功率 > 95%
- ✅ 平均合成時間 < 2秒
- ✅ Fallback 率 < 5%
- ✅ 錯誤率無增加
- ✅ 快取命中率維持

### 業務指標
- ✅ 使用者回饋正面
- ✅ 無使用者投訴
- ✅ 語音品質提升
- ✅ 系統穩定性維持

---

## 更新記錄

- 2025-11-04: 初始滾動計劃建立
