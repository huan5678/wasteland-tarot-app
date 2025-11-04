# Chirp 3:HD 測試指南

## 🚀 快速開始

### 1. 確認配置
```bash
cd backend
.venv/bin/python test_chirp3_config.py
```
應該看到: `✅ 配置檢查通過！`

### 2. 訪問測試頁面
瀏覽器打開: `http://localhost:3000/test-chirp3-hd`

## 📋 測試清單

### ✅ 測試 1: 不同角色的音色
1. 選擇 "Vault Dweller" (年輕女性)
2. 選擇 "基本語音" 測試場景
3. 點擊 "執行測試"
4. 播放音檔，聽到年輕女性聲音

5. 選擇 "Super Mutant" (極低音)
6. 再次執行 "基本語音" 測試
7. 播放音檔，聽到深沉低音

**預期結果**: 兩個音色明顯不同

### ✅ 測試 2: 語言切換 (重要!)
1. 點擊 "顯示高級設定"
2. 勾選 "啟用自訂語音設定"
3. 語言代碼選擇 "zh-TW"
4. **注意**: 應該看到警告 "⚠️ 此語言不支援 Chirp3-HD，將使用 WaveNet"
5. 輸入中文測試文字
6. 點擊 "執行自訂測試"
7. 應該仍然能生成語音 (使用 WaveNet)

**預期結果**: 中文模式下會自動使用 WaveNet (不是錯誤!)

### ✅ 測試 3: 所有角色快速測試
1. 保持語言為 "en-US"
2. 點擊 "執行所有測試"
3. 系統會依序測試所有角色和場景

**預期結果**: 所有測試應該成功，每個角色音色不同

## 🔧 問題排查

### 問題: 所有角色聲音一樣
**原因**: 可能使用了中文語言
**解決**: 
- 檢查語言代碼是否為 "en-US" 或 "en-GB"
- Chirp3 只支援英文，中文會用 WaveNet (所有角色用同一組中文語音)

### 問題: 看到 "invalid input value for enum" 錯誤
**原因**: 舊版本問題
**解決**: 
- 確認 backend 已重啟並載入新代碼
- 檢查 `backend/app/models/audio_file.py` 第 18-19 行應該是:
  ```python
  AI_RESPONSE = "ai_response"  # AI 回答 & 故事/測試音檔
  ```

### 問題: "duplicate key value" 錯誤
**原因**: 舊版本問題
**解決**:
- 確認 `audio_storage_service.py` 的 `generate_storage_path` 函數有 `voice_name` 參數
- 清空資料庫測試資料重試

## 📊 正確的日誌範例

### Chirp3 成功 (英文):
```
[TTSService] Using star name directly: Aoede
[TTSService] Built voice name: en-US-Chirp3-HD-Aoede
[TTSService] Synthesized speech: character=vault_dweller, model=chirp3-hd
```

### WaveNet Fallback (中文):
```
[TTSService] Language 'zh-TW' not supported by Chirp 3:HD
[TTSService] Synthesized speech: character=vault_dweller, model=wavenet, voice=cmn-TW-Wavenet-A
```

## 💡 重要提醒

1. **Chirp3 只支援英文**: 這不是 bug，是 Google 的限制
2. **音色差異在英文模式最明顯**: 14 個不同的星體語音
3. **中文會自動用 WaveNet**: 這是正常的 fallback 機制
4. **測試時用英文文字**: 例如 "Welcome to the wasteland"

## 🎭 14 個角色語音特色

| 角色 | 星體名稱 | 音色特色 |
|------|---------|---------|
| Super Mutant | Algenib | 極低音、威脅感 |
| Brotherhood Paladin | Alnilam | 低沉、軍事權威 |
| Legion Centurion | Enceladus | 嚴厲、紀律性 |
| Ghoul | Fenrir | 沙啞、歷經風霜 |
| Wasteland Trader | Achird | 商人、精明 |
| NCR Ranger | Iapetus | 專業、冷靜 |
| Pip-Boy | Puck | 標準、友善 |
| Minuteman | Schedar | 穩重、可靠 |
| Vault Dweller | Aoede | **年輕女性、樂觀** |
| Railroad Agent | Leda | 機敏、快速女性 |
| Brotherhood Scribe | Callirrhoe | 聰明女性、好學 |
| Codsworth | Despina | 機器人、高音快速 |
| Raider | Rasalgethi | 粗野、攻擊性 |
| Institute Scientist | Kore | 理性女性、分析性 |

---
**測試前必讀**: Chirp3-HD 是英文專用，中文請用 WaveNet!
