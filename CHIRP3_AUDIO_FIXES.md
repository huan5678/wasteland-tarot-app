# Chirp3-HD Audio Synthesis Fixes

## 修正日期
2025-11-04

## 問題總結

使用者回報了以下問題：

1. **Audio Type Enum 錯誤**: API 收到 "story" 但資料庫期望 "STORY"（大寫），而 enum 中根本沒有 "STORY" 值
2. **重複鍵錯誤**: 儲存路徑衝突，因為相同的文字產生多次導致相同的檔案名
3. **語音未改變**: 所有角色使用相同的語音，儘管選擇了不同的角色
4. **語言代碼問題**: 後端日誌顯示 `cmn-TW-Wavenet-A` 這是 WaveNet 而非 Chirp3-HD
5. **語言代碼格式**: 需要支援官方文件的 `cmn-CN`, `cmn-TW`, `cmn-Hant-TW` 格式

## 修正項目

### 1. 修正 Audio Type Enum 映射 
**檔案**: `backend/app/api/v1/endpoints/audio.py`

- **移除 "story" 類型**: 從請求驗證模式中移除 "story" 選項
- **簡化映射**: 只保留 `ai_response` 和 `dynamic_reading` 兩種類型
- **變更前**:
  ```python
  pattern="^(ai_response|dynamic_reading|story)$"
  audio_type_map = {
      "ai_response": AudioType.AI_RESPONSE,
      "dynamic_reading": AudioType.DYNAMIC_READING,
      "story": AudioType.AI_RESPONSE
  }
  ```
- **變更後**:
  ```python
  pattern="^(ai_response|dynamic_reading)$"
  audio_type_map = {
      "ai_response": AudioType.AI_RESPONSE,
      "dynamic_reading": AudioType.DYNAMIC_READING,
  }
  ```

### 2. 更新預設語言代碼為 cmn-CN
**檔案**: `backend/app/api/v1/endpoints/audio.py`, `backend/app/services/tts_service.py`

根據使用者需求和官方文件，將預設語言從 `en-US` 改為 `cmn-CN`（簡體中文）：

- **API 端點**: 
  ```python
  language_code=request.language_code or "cmn-CN"  # 使用自訂語言代碼或預設簡體中文
  ```

- **TTS 服務**:
  ```python
  def synthesize_speech(
      self,
      text: str,
      character_key: str,
      language_code: str = "cmn-CN",  # 從 "zh-TW" 改為 "cmn-CN"
      ...
  ```

### 3. 擴展語言代碼驗證模式
**檔案**: `backend/app/api/v1/endpoints/audio.py`

更新正則表達式以支援 Chirp3-HD 的語言代碼格式：

- **變更前**: `pattern="^[a-z]{2}-[A-Z]{2}$"` (只支援 en-US, zh-TW 等)
- **變更後**: `pattern="^([a-z]{2,3}-[A-Z]{2}|[a-z]{3}-[A-Z][a-z]{3}-[A-Z]{2})$"`
  - 支援 `cmn-CN`, `cmn-TW` (2-3 個字母前綴)
  - 支援 `cmn-Hant-TW`, `yue-Hant-HK` (完整腳本代碼)

### 4. 修正儲存路徑衝突
**檔案**: `backend/app/api/v1/endpoints/audio.py`

使用 `cache_key` 代替 `text_hash` 來產生儲存路徑，避免不同語音參數產生相同路徑：

- **變更前**:
  ```python
  identifier=text_hash[:8],  # 使用 hash 前 8 字元
  ```
- **變更後**:
  ```python
  identifier=cache_key[:8],  # 使用 cache_key 前 8 字元以避免衝突
  ```

`cache_key` 包含了文字、角色、語音模型、自訂發音、語音控制等所有參數，確保唯一性。

### 5. 更新測試頁面
**檔案**: `src/app/test-chirp3-hd/page.tsx`

#### 5.1 強制使用 Chirp3-HD 模型
在所有請求中添加 `force_voice_model: 'chirp3-hd'`：

```typescript
const requestBody: any = {
  // ...
  force_voice_model: 'chirp3-hd', // 強制使用 Chirp 3:HD
};
```

#### 5.2 更新預設語言代碼
- 將預設語言從 `en-US` 改為 `cmn-CN`
- 將所有角色的 `languageCode` 從 `'en-US'` 更新為 `'cmn-CN'`

#### 5.3 簡化語音名稱格式
將語音名稱從完整格式改為星體名稱：

- **變更前**: `voice: 'en-US-Chirp3-HD-Algenib'`
- **變更後**: `voice: 'Algenib'`

後端會自動根據 `language_code` 構建完整的語音名稱：`{language_code}-Chirp3-HD-{star_name}`

#### 5.4 重新排序語言代碼列表
將中文選項移到最前面，並標記推薦選項：

```typescript
const LANGUAGE_CODES = [
  { value: 'cmn-CN', label: '中文 (中國) ✓ Chirp3 [推薦]', supported: true },
  { value: 'cmn-TW', label: '中文 (台灣) ✓ Chirp3', supported: true },
  { value: 'cmn-Hant-TW', label: '中文 (台灣-繁體) ✓ Chirp3', supported: true },
  // ... 其他語言
];
```

## 技術細節

### Chirp3-HD 語音名稱格式

根據 Google Cloud TTS 官方文件 (https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd):

1. **完整格式**: `{language_code}-Chirp3-HD-{star_name}`
   - 範例: `cmn-CN-Chirp3-HD-Algenib`
   
2. **星體名稱**: 使用真實的星體和衛星名稱
   - Algenib (飛馬座γ星) - 深沉低音
   - Aoede (木衛四十一) - 年輕活潑
   - Alnilam (獵戶座腰帶中央星) - 軍事權威
   - 等等...

### 語言代碼轉換

後端自動處理語言代碼轉換：

```python
language_map = {
    "zh-TW": "cmn-TW",      # 台灣繁體中文
    "zh-CN": "cmn-CN",      # 中國簡體中文
    "cmn-TW": "cmn-TW",     # 直接使用
    "cmn-CN": "cmn-CN",     # 直接使用
    "cmn-Hant-TW": "cmn-Hant-TW",  # 新格式繁體中文
    # ...
}
```

## 測試建議

1. **基本測試**:
   ```bash
   # 訪問測試頁面
   http://localhost:3000/test-chirp3-hd
   
   # 選擇不同角色，確認語音有明顯差異
   # 測試不同語言代碼 (cmn-CN, cmn-TW, en-US 等)
   ```

2. **驗證語音差異**:
   - 選擇 "Super Mutant" (極低音) 和 "Vault Dweller" (高音)
   - 使用相同文字測試
   - 確認音高、語速有明顯差異

3. **驗證語言切換**:
   - 使用自訂測試區域
   - 啟用自訂語音設定
   - 切換不同語言代碼
   - 確認語音能正確切換語言

4. **檢查後端日誌**:
   ```bash
   # 確認使用 Chirp3-HD 而非 WaveNet
   # 應該看到類似：
   # "voice_name=cmn-CN-Chirp3-HD-Algenib"
   # 而不是：
   # "voice_name=cmn-TW-Wavenet-A"
   ```

## 已知限制

1. **音檔緩存**: 測試時建議關閉快取 (`cache_enabled: false`)
2. **API Rate Limit**: 連續測試時可能遇到速率限制，建議間隔 1-2 秒
3. **語言支援**: 並非所有語言都支援 Chirp3-HD，不支援的會自動降級到 WaveNet

## 相關文件

- Google Cloud TTS Chirp3-HD 官方文件: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd
- 語言可用性: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#language_availability  
- 語音選項: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#voice_options

## 後續改進建議

1. **資料庫 Schema**: 更新 `audio_files` 表格以使用 `cache_key` 代替 `text_hash`
2. **錯誤處理**: 改善 Chirp3-HD 失敗時的錯誤訊息
3. **監控**: 添加 Chirp3-HD vs WaveNet 使用率的監控指標
4. **文件**: 更新 API 文件以反映新的語言代碼格式
