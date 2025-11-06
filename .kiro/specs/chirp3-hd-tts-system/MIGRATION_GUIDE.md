# Chirp 3:HD 遷移指南

## 概述

本文檔說明從 WaveNet 遷移到 Chirp 3:HD 的完整過程和注意事項。

**遷移日期**: 2025-11-04
**遷移狀態**: 進行中

---

## 遷移概述

### 變更摘要

1. **新增 Chirp 3:HD 語音模型支援**
2. **保留 WaveNet 作為 fallback（可選）**
3. **新增自訂發音功能**
4. **新增語音控制功能**
5. **更新快取機制**

### 向後相容性

✅ **完全向後相容**: 現有 API 呼叫無需修改即可運作
- 所有新欄位都是可選的
- 預設行為不變（使用路由邏輯）
- 現有快取繼續有效

---

## 遷移步驟

### 階段 1: 準備（已完成）

- [x] 更新 Google Cloud TTS 依賴
- [x] 創建語音映射配置
- [x] 實作路由邏輯
- [x] 添加監控指標

### 階段 2: 部署（進行中）

- [x] 部署到 Staging（Chirp 3:HD 關閉）
- [ ] 驗證無回歸問題
- [ ] 開始漸進式滾動

### 階段 3: 滾動推出（計劃中）

- [ ] 10% 滾動（單一角色）
- [ ] 50% 滾動
- [ ] 多角色 25% 滾動
- [ ] 所有角色 50% 滾動
- [ ] 100% 滾動

### 階段 4: 穩定化（計劃中）

- [ ] 停用 fallback
- [ ] 清理代碼（標記為 deprecated）
- [ ] 更新文檔

---

## API 變更

### 請求格式

**舊格式**（仍然支援）:
```json
{
  "text": "測試文字",
  "character_key": "pip_boy"
}
```

**新格式**（可選功能）:
```json
{
  "text": "測試文字",
  "character_key": "pip_boy",
  "custom_pronunciations": [...],
  "voice_controls": {...},
  "force_voice_model": "chirp3-hd"
}
```

### 回應格式

**新增欄位**（向後相容）:
```json
{
  "url": "...",
  "duration": 1.5,
  "file_size": 1024,
  "cached": false,
  "source": "new",
  "voice_model": "chirp3-hd",      // NEW
  "voice_name": "en-US-Chirp3-HD-Regulus"  // NEW
}
```

---

## 環境變數配置

### 最小配置（向後相容）

```bash
# 不需要設置任何新變數，系統使用預設值
# CHIRP3_ENABLED=false (預設)
# 所有請求使用 WaveNet
```

### 啟用 Chirp 3:HD

```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=10
CHIRP3_FALLBACK_TO_WAVENET=true
```

詳細配置見 `CHIRP3_ENV_VARIABLES.md`。

---

## 快取機制變更

### 舊快取 key

```python
# 僅基於文字和角色
text_hash = hashlib.sha256(f"{text}:{character_key}".encode()).hexdigest()
```

### 新快取 key

```python
# 包含所有合成參數
cache_key = compute_cache_key(
    text=text,
    character_key=character_key,
    voice_model=voice_model,
    custom_pronunciations=custom_pronunciations,
    voice_controls=voice_controls
)
```

### 遷移影響

- ✅ **向後相容**: 舊快取繼續有效
- ⚠️ **注意**: 相同文字但不同參數會產生不同的快取
- ✅ **自動**: 新請求自動使用新快取機制

---

## 測試遷移

### 遷移前測試

```bash
# 執行所有測試
cd backend
uv run pytest tests/unit/test_chirp3*.py -v
uv run pytest tests/integration/test_chirp3_api.py -v
```

### 遷移後驗證

```bash
# 驗證部署
python scripts/verify_deployment.py

# 監控指標
python scripts/monitor_chirp3_rollout.py --watch
```

---

## 常見問題

### Q: 現有 API 呼叫需要修改嗎？

**A**: 不需要。所有新功能都是可選的，現有呼叫繼續運作。

### Q: 快取會失效嗎？

**A**: 不會。舊快取繼續有效，新請求會使用新的快取機制。

### Q: 如何強制使用 Chirp 3:HD？

**A**: 使用 `force_voice_model` 參數：
```json
{
  "force_voice_model": "chirp3-hd"
}
```

### Q: 如何回滾到 WaveNet？

**A**: 設置環境變數：
```bash
CHIRP3_ENABLED=false
```

### Q: Fallback 機制如何運作？

**A**: 當 Chirp 3:HD 失敗時，自動使用 WaveNet（如果啟用 fallback）。

---

## 遷移檢查清單

### 開發階段

- [x] 代碼實作完成
- [x] 單元測試通過
- [x] 整合測試通過
- [x] 效能測試通過

### 部署階段

- [x] 部署腳本準備完成
- [x] 監控工具準備完成
- [x] 回滾程序文檔完成
- [ ] Staging 部署成功
- [ ] 驗證無回歸

### 滾動推出階段

- [ ] 10% 滾動成功
- [ ] 50% 滾動成功
- [ ] 100% 滾動成功
- [ ] 生產部署成功

---

## 相關文檔

- **部署檢查清單**: `../backend/docs/DEPLOYMENT_CHECKLIST.md`
- **滾動推出計劃**: `../backend/docs/CHIRP3_ROLLOUT_PLAN.md`
- **環境變數配置**: `../backend/docs/CHIRP3_ENV_VARIABLES.md`
- **回滾程序**: `../backend/docs/CHIRP3_ROLLBACK_PROCEDURE.md`

---

**最後更新**: 2025-11-04
