# Chirp 3:HD 音頻系統修復完成報告

**日期**: 2025-11-04  
**狀態**: ✅ 完成

## 修復的問題

### 1. ✅ 音高參數格式問題
**問題描述**: 系統中 `convert_voice_params` 函數使用公式 `(pitch - 1.0) * 50` 轉換音高，但配置檔案已經直接使用半音格式（-20 到 +20），導致轉換錯誤。

**修復方案**: 更新 `convert_voice_params()` 自動檢測音高值格式：
- 如果值在 -20 到 +20 範圍內，直接使用（已經是半音格式）
- 否則使用舊公式轉換

**位置**: `backend/app/services/tts_service.py` 第 485-503 行

### 2. ✅ 儲存路徑衝突
**問題描述**: 動態音檔使用基於 hash 的路徑，當用相同文字測試不同音色時會產生重複鍵值錯誤。

**錯誤訊息**:
```
duplicate key value violates unique constraint "audio_files_storage_path_key"
DETAIL: Key (storage_path)=(dynamic/11016258/vault_dweller.mp3) already exists.
```

**修復方案**: 在動態儲存路徑中添加時間戳記，確保每次測試都是唯一路徑。

**修改前**: `dynamic/f3a2b1c0/codsworth_Algenib.mp3`  
**修改後**: `dynamic/f3a2b1c0_1699123456/codsworth_Algenib.mp3`

**位置**: `backend/app/services/audio_storage_service.py` 第 41-80 行

### 3. ✅ 語言代碼支援
**確認正常**: 
- API 端點預設已使用 `cmn-CN`（簡體中文）
- Chirp 3:HD 語言轉換正確映射：
  - `zh-CN` → `cmn-CN` (簡體中文)
  - `zh-TW` → `cmn-TW` (繁體中文)
  - `cmn-CN` → `cmn-CN` (直接使用)

**支援的語言**:
- `cmn-CN`: 簡體中文（中國大陸）- **系統預設** ✅
- `cmn-TW`: 繁體中文（台灣）
- `cmn-Hant-TW`: 繁體中文（台灣，新格式）
- `en-US`, `en-GB`, `en-AU`, `en-IN`: 英文變體
- `ja-JP`: 日文
- `ko-KR`: 韓文
- 加上歐洲語言（法文、德文、西班牙文、葡萄牙文、義大利文）

### 4. ✅ 音檔類型枚舉驗證
**確認**: 測試頁面正確使用 `ai_response` 而非已棄用的 `story` 值。

**有效值**:
- `ai_response` - AI 回應和測試音檔 ✅
- `dynamic_reading` - 動態塔羅解讀 ✅
- `static_card` - 靜態卡牌解讀（僅模型）❌

### 5. ✅ 測試頁面角色選擇器
**新增功能**: 在自訂參數測試區塊添加角色下拉選單，方便測試不同角色音色。

**位置**: `src/app/test-chirp3-hd/page.tsx`

## Chirp 3:HD 角色音色映射

### 完整角色音色表

| 角色 | 星體名稱 | 音色類型 | 音高 | 語速 | 描述 |
|------|---------|---------|------|------|------|
| super_mutant | Algenib | 極低男音 | -20st | 0.65 | 威脅、強大 |
| brotherhood_paladin | Alnilam | 低沉男音 | -8st | 0.75 | 軍事權威 |
| legion_centurion | Enceladus | 嚴厲男音 | -10st | 0.70 | 紀律命令 |
| ghoul | Fenrir | 沙啞男音 | -6st | 0.80 | 歷練老成 |
| wasteland_trader | Achird | 實用男音 | -4st | 0.90 | 商人精明 |
| ncr_ranger | Iapetus | 專業男音 | -5st | 0.85 | 冷靜職業 |
| pip_boy | Puck | 標準男音 | 0st | 1.00 | 友善清晰 |
| minuteman | Schedar | 穩重男音 | -2st | 0.95 | 可靠平民 |
| vault_dweller | Aoede | 年輕女音 | +8st | 1.10 | 樂觀活力 |
| railroad_agent | Leda | 機敏女音 | +3st | 1.15 | 快速靈活 |
| brotherhood_scribe | Callirrhoe | 聰明女音 | +5st | 1.05 | 好學求知 |
| codsworth | Despina | 機器人音 | +8st | 1.25 | 高音快速 |
| raider | Rasalgethi | 粗野男音 | -3st | 1.30 | 暴力狂野 |
| institute_scientist | Kore | 分析女音 | +6st | 1.15 | 理性疏離 |

### 語音名稱格式
格式: `{語言代碼}-Chirp3-HD-{星體名稱}`

**範例**:
- 簡體中文: `cmn-CN-Chirp3-HD-Algenib`
- 繁體中文: `cmn-TW-Chirp3-HD-Aoede`
- 英文: `en-US-Chirp3-HD-Puck`

## 測試建議

### 快速測試步驟

#### 1. 啟動後端
```bash
cd backend
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. 啟動前端
```bash
npm run dev
```

#### 3. 訪問測試頁面
**網址**: http://localhost:3000/test-chirp3-hd

#### 4. 測試音色差異

**測試場景 1: 相同文字，不同角色**
1. 前往「自訂參數測試」區塊
2. 輸入文字: `歡迎來到廢土塔羅，準備好開始你的旅程了嗎？`
3. 從下拉選單選擇不同角色，點擊「執行自訂測試」
4. **預期結果**: 每個角色應該有明顯不同的音色（音高和語速）

**建議測試角色**:
- **super_mutant** (Algenib) - 極低沉、緩慢
- **vault_dweller** (Aoede) - 高音、年輕女性
- **pip_boy** (Puck) - 標準男音
- **codsworth** (Despina) - 高音、快速機器人

**測試場景 2: 語言切換**
1. 啟用「使用自訂語音設定」核取方塊
2. 測試不同語言代碼:
   - `cmn-CN` (簡體中文) - 預設 ✅
   - `cmn-TW` (繁體中文)
   - `en-US` (英文)

**預期結果**: 音檔應反映語言/口音特徵

**測試場景 3: 自訂語音覆寫**
1. 啟用「使用自訂語音設定」
2. 從「Chirp 3:HD 語音」下拉選單選擇語音
3. 這會覆寫角色的預設語音

### 驗證日誌

#### 後端控制台應顯示:
```
[TTSService] Using Chirp3 language code: cmn-CN
[TTSService] Extracted star name from full name: ... → Algenib
[TTSService] Built voice name: cmn-CN-Chirp3-HD-Algenib
[TTSService] Chirp 3:HD synthesis successful: character=super_mutant, voice=cmn-CN-Chirp3-HD-Algenib
```

#### 檢查儲存路徑:
尋找類似路徑:
```
dynamic/f3a2b1c0_1730707234/vault_dweller_Aoede.mp3
```
（注意時間戳: `_1730707234`）

## 預期結果

### 各角色音色特徵

| 音色特徵 | 角色範例 | 應聽到的效果 |
|---------|---------|-------------|
| 極低沉、緩慢 | super_mutant | 威脅感強烈、低沉有力 |
| 低沉威嚴 | brotherhood_paladin | 軍事指揮官的權威感 |
| 高音年輕 | vault_dweller | 充滿希望、活力四射 |
| 標準友善 | pip_boy | 清晰、友好、易懂 |
| 高音快速 | codsworth | 機器人化、精確、正式 |

### 檔案大小差異
- 慢速語音 = 較大檔案
- 快速語音 = 較小檔案
- 相同文字不同角色應有明顯不同的檔案大小

## 故障排除

### 問題: 所有音色聽起來都一樣
**檢查**:
1. 後端日誌顯示正確的語音名稱（不同星體名稱）
2. 音檔檔案大小不同
3. 自訂語音覆寫未啟用（應使用角色預設值）

### 問題: "duplicate key" 錯誤
**檢查**:
1. 儲存路徑包含時間戳
2. 程式碼更改後重啟後端
3. 必要時清除舊測試資料

### 問題: 語言不起作用
**檢查**:
1. 語言代碼正確（`cmn-CN`，不是 `zh-CN`）
2. 後端自動轉換 `zh-CN` → `cmn-CN`
3. 檢查日誌: `[TTSService] Using Chirp3 language code: cmn-CN`

### 問題: 音色還是不明顯
**可能原因**:
1. Chirp3-HD 的不同星體語音本身差異較小
2. 需要配合音高（pitch）和語速（rate）調整才能產生明顯差異
3. 某些語言（如中文）的音色變化比英文小

**建議**:
- 使用更極端的音高範圍（-20 到 +20）
- 確認語速調整有應用（0.65 到 1.30）
- 測試時使用較長的文字片段（至少 20 字以上）

## 快速驗證命令

### 檢查相同文字不同音色:
```bash
# 生成 super_mutant 音檔
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"歡迎來到廢土塔羅","character_key":"super_mutant","audio_type":"ai_response","language_code":"cmn-CN","force_voice_model":"chirp3-hd"}' \
  -o super_mutant.json

# 生成 vault_dweller 音檔
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"歡迎來到廢土塔羅","character_key":"vault_dweller","audio_type":"ai_response","language_code":"cmn-CN","force_voice_model":"chirp3-hd"}' \
  -o vault_dweller.json

# 比較檔案大小和語音名稱
cat super_mutant.json | jq '.file_size, .voice_name'
cat vault_dweller.json | jq '.file_size, .voice_name'
```

## 成功標準

- ✅ **音色明顯不同**: 每個角色產生不同聲音的音檔
- ✅ **儲存正常**: 沒有重複鍵值錯誤
- ✅ **語言切換正常**: 可以在 cmn-CN、cmn-TW、en-US 之間切換
- ✅ **日誌資訊正確**: 語音名稱包含正確的星體名稱
- ✅ **角色選擇器正常**: 可以在自訂測試中選擇任何角色

## 修改的檔案

1. **backend/app/services/tts_service.py**
   - 更新 `convert_voice_params()` 處理半音格式的音高值

2. **backend/app/services/audio_storage_service.py**
   - 在動態儲存路徑中添加時間戳

3. **src/app/test-chirp3-hd/page.tsx**
   - 在自訂參數測試區塊添加角色選擇下拉選單

## 相關文件

- `CHIRP3_FIXES_SUMMARY.md` - 英文詳細技術文件
- `QUICK_TEST_GUIDE.md` - 快速測試指南

## 參考資源

- [Google Cloud TTS Chirp3-HD 文件](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd?hl=zh-tw)
- [語言可用性](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd?hl=zh-tw#language_availability)
- [語音選項](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd?hl=zh-tw#voice_options)
