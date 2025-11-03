# Chirp 3:HD 環境變數配置指南

本文檔說明 Chirp 3:HD TTS 系統的功能開關環境變數配置。

## 環境變數清單

### CHIRP3_ENABLED
- **類型**: `boolean`
- **預設值**: `false`
- **說明**: 全域啟用 Chirp 3:HD 功能開關
- **範例**: `CHIRP3_ENABLED=true`

### CHIRP3_ROLLOUT_PERCENTAGE
- **類型**: `integer`
- **範圍**: `0-100`
- **預設值**: `0`
- **說明**: 使用 Chirp 3:HD 的請求百分比，用於漸進式滾動部署
  - `0`: 完全停用（即使 CHIRP3_ENABLED=true）
  - `1-99`: 指定百分比的使用者使用 Chirp 3:HD
  - `100`: 所有請求使用 Chirp 3:HD
- **一致性**: 當提供 `user_id` 時，同一使用者總是會得到相同的模型（deterministic routing）
- **範例**: `CHIRP3_ROLLOUT_PERCENTAGE=50` （50% 的使用者使用 Chirp 3:HD）

### CHIRP3_ENABLED_CHARACTERS
- **類型**: `string` (comma-separated)
- **預設值**: `""` (空字串)
- **說明**: 啟用 Chirp 3:HD 的角色列表（逗號分隔）
  - 空字串 (`""`): 所有角色都啟用（受 `CHIRP3_ROLLOUT_PERCENTAGE` 限制）
  - 非空字串: 只有列出的角色使用 Chirp 3:HD
- **範例**: `CHIRP3_ENABLED_CHARACTERS=pip_boy,vault_dweller,wasteland_trader`

### CHIRP3_FALLBACK_TO_WAVENET
- **類型**: `boolean`
- **預設值**: `true`
- **說明**: 當 Chirp 3:HD 合成失敗時，是否自動降級到 WaveNet
- **範例**: `CHIRP3_FALLBACK_TO_WAVENET=true`

## 配置範例

### 範例 1: 完全停用 Chirp 3:HD（預設）
```bash
CHIRP3_ENABLED=false
CHIRP3_ROLLOUT_PERCENTAGE=0
CHIRP3_ENABLED_CHARACTERS=
CHIRP3_FALLBACK_TO_WAVENET=true
```
**結果**: 所有請求使用 WaveNet

### 範例 2: 啟用單一測試角色
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=pip_boy
CHIRP3_FALLBACK_TO_WAVENET=true
```
**結果**: 只有 `pip_boy` 角色使用 Chirp 3:HD，其他角色使用 WaveNet

### 範例 3: 漸進式滾動（10% 使用者）
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=10
CHIRP3_ENABLED_CHARACTERS=
CHIRP3_FALLBACK_TO_WAVENET=true
```
**結果**: 10% 的使用者請求使用 Chirp 3:HD（所有角色），90% 使用 WaveNet

### 範例 4: 多角色漸進式滾動（25% 使用者，3 個角色）
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=25
CHIRP3_ENABLED_CHARACTERS=pip_boy,vault_dweller,wasteland_trader
CHIRP3_FALLBACK_TO_WAVENET=true
```
**結果**: 25% 的使用者對這 3 個角色的請求使用 Chirp 3:HD

### 範例 5: 完整啟用（100% 滾動）
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=
CHIRP3_FALLBACK_TO_WAVENET=true
```
**結果**: 所有請求使用 Chirp 3:HD，失敗時降級到 WaveNet

### 範例 6: 完整啟用，無降級
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=
CHIRP3_FALLBACK_TO_WAVENET=false
```
**結果**: 所有請求使用 Chirp 3:HD，失敗時直接拋出錯誤（不降級）

## 路由邏輯優先順序

`VoiceModelRouter` 的路由決策順序：

1. **全域啟用檢查**: 如果 `CHIRP3_ENABLED=false`，直接返回 WaveNet
2. **角色特定檢查**: 如果 `CHIRP3_ENABLED_CHARACTERS` 非空，檢查角色是否在列表中
   - 在列表中 → 繼續到步驟 3
   - 不在列表中 → 返回 WaveNet
3. **百分比滾動**: 根據 `CHIRP3_ROLLOUT_PERCENTAGE` 決定
   - 如果 `user_id` 提供 → 使用確定性雜湊（同一使用者總是相同結果）
   - 如果 `user_id` 未提供 → 使用隨機數（非確定性）

## 使用建議

### 開發階段
```bash
CHIRP3_ENABLED=false  # 保持停用，使用穩定的 WaveNet
```

### 測試階段
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=pip_boy  # 單一角色測試
CHIRP3_FALLBACK_TO_WAVENET=true
```

### 漸進式部署階段
```bash
# Day 1-2: 10% 滾動
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=10
CHIRP3_ENABLED_CHARACTERS=
CHIRP3_FALLBACK_TO_WAVENET=true

# Day 3-7: 50% 滾動
CHIRP3_ROLLOUT_PERCENTAGE=50

# Week 2: 100% 滾動
CHIRP3_ROLLOUT_PERCENTAGE=100
```

### 生產階段（穩定後）
```bash
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=
CHIRP3_FALLBACK_TO_WAVENET=false  # 可選：停用降級以強制使用 Chirp 3:HD
```

## 注意事項

1. **使用者一致性**: 提供 `user_id` 參數可確保同一使用者在多次請求中總是使用相同的模型，這對於 A/B 測試和用戶體驗一致性很重要。

2. **匿名使用者**: 如果未提供 `user_id`，路由將是隨機的，每次請求可能產生不同的結果。如果需要一致性，請使用 session ID 或其他識別碼。

3. **角色列表格式**: `CHIRP3_ENABLED_CHARACTERS` 使用逗號分隔，支援的角色名稱：
   - `super_mutant`
   - `brotherhood_paladin`
   - `legion_centurion`
   - `ghoul`
   - `wasteland_trader`
   - `ncr_ranger`
   - `pip_boy`
   - `minuteman`
   - `vault_dweller`
   - `railroad_agent`
   - `brotherhood_scribe`
   - `codsworth`
   - `raider`
   - `institute_scientist`

4. **降級機制**: 當 `CHIRP3_FALLBACK_TO_WAVENET=true` 時，如果 Chirp 3:HD 合成失敗，系統會自動降級到 WaveNet，確保服務可用性。

5. **環境變數更新**: 修改環境變數後，需要重啟應用程式才能生效（因為設定在啟動時載入並快取）。

## 相關文檔

- [Chirp 3:HD TTS 系統設計文檔](../.kiro/specs/chirp3-hd-tts-system/design.md)
- [Chirp 3:HD TTS 系統實作任務](../.kiro/specs/chirp3-hd-tts-system/tasks.md)
- [TTS Service 原始碼](../../app/services/tts_service.py)
