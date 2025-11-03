# Chirp 3:HD 滾動推出快速參考

## 快速命令參考

### 部署驗證

```bash
# 基本驗證
python backend/scripts/verify_deployment.py

# 指定 API URL
python backend/scripts/verify_deployment.py --url http://staging.example.com

# CI/CD 使用（錯誤時退出）
python backend/scripts/verify_deployment.py --exit-on-error
```

### 監控滾動推出

```bash
# 單次檢查
python backend/scripts/monitor_chirp3_rollout.py

# 即時監控（每 60 秒）
python backend/scripts/monitor_chirp3_rollout.py --watch

# 自訂間隔（每 5 分鐘）
python backend/scripts/monitor_chirp3_rollout.py --watch --interval 300

# 指定 metrics URL
python backend/scripts/monitor_chirp3_rollout.py \
  --url http://staging.example.com/api/v1/monitoring/metrics/prometheus \
  --watch
```

## 環境變數快速配置

### Stage 0: Chirp 3:HD 關閉（預設）

```bash
CHIRP3_ENABLED=false
CHIRP3_ROLLOUT_PERCENTAGE=0
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

### Stage 1: 10% 滾動

```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=10
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

### Stage 2: 50% 滾動

```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=50
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

### Stage 3: 多角色 25% 滾動

```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=25
CHIRP3_ENABLED_CHARACTERS="pip_boy,vault_dweller,wasteland_trader"
CHIRP3_FALLBACK_TO_WAVENET=true
```

### Stage 4: 所有角色 50% 滾動

```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=50
CHIRP3_ENABLED_CHARACTERS=""  # 空字串 = 所有角色
CHIRP3_FALLBACK_TO_WAVENET=true
```

### Stage 5: 100% 滾動

```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_FALLBACK_TO_WAVENET=true
```

### 緊急回滾

```bash
CHIRP3_ENABLED=false
# 重啟服務
```

## 檢查清單

### 部署前

- [ ] 代碼已部署
- [ ] 環境變數已設置
- [ ] 服務已重啟
- [ ] 執行 `verify_deployment.py`

### 滾動推出中

- [ ] 啟動 `monitor_chirp3_rollout.py --watch`
- [ ] 檢查關鍵指標：
  - [ ] 合成成功率 > 95%
  - [ ] 平均合成時間 < 2s
  - [ ] Fallback 率 < 5%
- [ ] 監控錯誤日誌
- [ ] 收集使用者回饋

### 回滾時

- [ ] 設置 `CHIRP3_ENABLED=false`
- [ ] 重啟服務
- [ ] 執行 `verify_deployment.py`
- [ ] 通知團隊
- [ ] 記錄回滾原因

## 關鍵指標

| 指標 | 目標 | 告警 |
|------|------|------|
| 合成成功率 | > 95% | < 90% |
| 平均合成時間 | < 2s | > 5s |
| Fallback 率 | < 5% | > 20% |
| 錯誤率 | < 1% | > 10% |

## 相關文檔

- **完整部署檢查清單**: `DEPLOYMENT_CHECKLIST.md`
- **滾動推出計劃**: `CHIRP3_ROLLOUT_PLAN.md`
- **環境變數指南**: `CHIRP3_ENV_VARIABLES.md`
- **回滾程序**: `CHIRP3_ROLLBACK_PROCEDURE.md`
- **Phase 4 總結**: `CHIRP3_PHASE4_SUMMARY.md`
