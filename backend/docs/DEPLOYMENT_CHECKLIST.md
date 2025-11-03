# Chirp 3:HD 部署檢查清單

## Pre-Deployment Checklist

### 代碼準備
- [ ] 所有 Phase 1-3 任務完成
- [ ] 所有測試通過（單元、整合、效能）
- [ ] 代碼審查完成
- [ ] 無已知嚴重 bug
- [ ] 文檔完整

### 環境配置
- [ ] Staging 環境變數配置正確
- [ ] 生產環境變數配置準備完成
- [ ] Google Cloud TTS API 憑證配置正確
- [ ] Prometheus metrics 端點可訪問
- [ ] 監控儀表板設置完成

### 監控準備
- [ ] Prometheus 查詢設置完成
- [ ] Grafana 儀表板建立
- [ ] 告警規則配置
- [ ] 監控腳本測試通過
- [ ] 通知渠道設置完成

---

## Stage 0: Staging Deployment (Chirp 3:HD Disabled)

### 部署前
- [ ] 備份當前 Staging 環境
- [ ] 確認部署時間窗口
- [ ] 通知團隊部署計劃

### 部署步驟
- [ ] 部署代碼到 Staging
- [ ] 驗證環境變數：
  ```bash
  CHIRP3_ENABLED=false
  CHIRP3_ROLLOUT_PERCENTAGE=0
  CHIRP3_ENABLED_CHARACTERS=""
  CHIRP3_FALLBACK_TO_WAVENET=true
  ```
- [ ] 重啟服務
- [ ] 驗證服務健康狀態

### 驗證檢查
- [ ] 所有 API 端點正常
- [ ] TTS 合成功能正常（使用 WaveNet）
- [ ] Metrics 端點可訪問
- [ ] 無錯誤日誌
- [ ] 效能正常

### 測試
- [ ] 執行 smoke tests
- [ ] 執行回歸測試
- [ ] 驗證現有功能無回歸

**完成標準**: 所有檢查通過，無回歸問題

---

## Stage 1: 10% Rollout (pip_boy)

### 配置更新
- [ ] 更新環境變數：
  ```bash
  CHIRP3_ENABLED=true
  CHIRP3_ROLLOUT_PERCENTAGE=10
  CHIRP3_ENABLED_CHARACTERS=""
  CHIRP3_FALLBACK_TO_WAVENET=true
  ```
- [ ] 重啟服務
- [ ] 驗證配置生效

### 監控設置
- [ ] 啟動監控腳本：`python scripts/monitor_chirp3_rollout.py --watch`
- [ ] 設置告警
- [ ] 準備回滾計劃

### 24 小時監控
- [ ] 每小時檢查一次 metrics
- [ ] 檢查錯誤日誌
- [ ] 檢查使用者回饋
- [ ] 記錄任何異常

### 驗證指標
- [ ] 合成成功率 > 95%
- [ ] 平均合成時間 < 2s
- [ ] Fallback 率 < 5%
- [ ] 無使用者投訴
- [ ] 快取命中率維持

**完成標準**: 24 小時穩定運行，所有指標正常

---

## Stage 2: 50% Rollout

### 配置更新
- [ ] 更新環境變數：
  ```bash
  CHIRP3_ROLLOUT_PERCENTAGE=50
  ```
- [ ] 重啟服務
- [ ] 驗證配置生效

### 48 小時監控
- [ ] 持續監控 metrics
- [ ] 檢查錯誤率變化
- [ ] 檢查效能變化

**完成標準**: 48 小時穩定運行，指標無惡化

---

## Stage 3: 多角色 25% Rollout

### 配置更新
- [ ] 更新環境變數：
  ```bash
  CHIRP3_ROLLOUT_PERCENTAGE=25
  CHIRP3_ENABLED_CHARACTERS="pip_boy,vault_dweller,wasteland_trader"
  ```
- [ ] 重啟服務
- [ ] 驗證配置生效

### 72 小時監控
- [ ] 監控所有 3 個角色
- [ ] 檢查角色特定問題
- [ ] 驗證語音品質

**完成標準**: 72 小時穩定運行，所有角色正常

---

## Stage 4: 所有角色 50% Rollout

### 配置更新
- [ ] 更新環境變數：
  ```bash
  CHIRP3_ROLLOUT_PERCENTAGE=50
  CHIRP3_ENABLED_CHARACTERS=""  # 空字串 = 所有角色
  ```
- [ ] 重啟服務
- [ ] 驗證配置生效

### 1 週監控
- [ ] 監控所有角色
- [ ] 檢查系統整體效能
- [ ] 收集使用者回饋

**完成標準**: 1 週穩定運行，系統效能穩定

---

## Stage 5: 100% Rollout

### 配置更新
- [ ] 更新環境變數：
  ```bash
  CHIRP3_ROLLOUT_PERCENTAGE=100
  ```
- [ ] 重啟服務
- [ ] 驗證配置生效

### 1 週監控
- [ ] 持續監控所有指標
- [ ] 收集使用者回饋
- [ ] 準備生產部署

**完成標準**: 1 週穩定運行，準備生產部署

---

## Stage 6: Production Deployment

### 部署前
- [ ] 確認 Staging 100% 滾動成功
- [ ] 準備生產環境變數
- [ ] 通知所有利害關係人
- [ ] 準備回滾計劃

### 部署步驟
- [ ] 部署代碼到生產環境（Chirp 3:HD 關閉）
- [ ] 驗證部署成功
- [ ] 執行 smoke tests

### 漸進式滾動
- [ ] **Day 1-2**: 10% 滾動
- [ ] **Day 3-7**: 50% 滾動（如果穩定）
- [ ] **Day 8-14**: 100% 滾動（如果穩定）

### 監控
- [ ] 24/7 監控
- [ ] 每小時檢查 metrics
- [ ] 隨時準備回滾

**完成標準**: 2 週穩定運行，100% 滾動成功

---

## 回滾程序

### 快速回滾步驟
1. 更新環境變數：`CHIRP3_ENABLED=false`
2. 重啟服務
3. 驗證回滾成功
4. 調查問題
5. 修復後重新部署

### 回滾決策標準
- **立即回滾**: 錯誤率 > 10%, 合成時間 > 5s, Fallback 率 > 20%
- **逐步回滾**: 錯誤率 5-10%, 特定角色問題

---

## 緊急聯絡

- **技術負責人**: [填寫]
- **DevOps 團隊**: [填寫]
- **產品經理**: [填寫]

---

## 更新記錄

- 2025-11-04: 初始部署檢查清單建立
