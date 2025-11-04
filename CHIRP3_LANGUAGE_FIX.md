# Chirp3-HD Language Support Fix - 2025-11-04

## 問題摘要

1. ❌ 所有非英語語言被拒絕，自動降級到 WaveNet
2. ❌ 中文、日文、韓文無法使用 Chirp3-HD
3. ❌ 測試頁面顯示錯誤的語言支援狀態
4. ❌ 所有角色聽起來一樣（可能是語音沒有正確切換）

## 修復內容

### 1. 擴展語言支援 ✅
增加了 13 種 Chirp3-HD 官方支援的語言：
- 中文: cmn-CN (簡體), cmn-TW (繁體)
- 日文: ja-JP
- 韓文: ko-KR
- 法文: fr-FR
- 德文: de-DE
- 西班牙文: es-ES
- 葡萄牙文: pt-BR
- 義大利文: it-IT
- 英文變體: en-US, en-GB, en-AU, en-IN

### 2. 修正語言代碼轉換順序 ✅
**之前**: 先檢查支援性 → zh-TW 不在清單中 → 失敗
**現在**: 先轉換 zh-TW → cmn-TW → 再檢查 → 成功

### 3. 更新前端標籤 ✅
測試頁面現在正確顯示所有語言都支援 Chirp3-HD

## 測試驗證

執行 `test_chirp3_voices.py` 驗證結果：

```
語言轉換測試:
  zh-TW  → cmn-TW  ✓ SUPPORTED
  zh-CN  → cmn-CN  ✓ SUPPORTED  
  ja-JP  → ja-JP   ✓ SUPPORTED
  ko-KR  → ko-KR   ✓ SUPPORTED

語音路由測試:
  所有角色 → Use Chirp3: True → Model: chirp3-hd

語音名稱構建:
  vault_dweller + zh-TW → cmn-TW-Chirp3-HD-Aoede ✓
  super_mutant + ja-JP → ja-JP-Chirp3-HD-Algenib ✓
```

## 如何測試

### 測試中文語音
1. 前往 `/test-chirp3-hd` 頁面
2. 在「自訂測試」區塊
3. 啟用「使用自訂語音和語言設定」
4. 選擇語言：「中文 (台灣) ✓ Chirp3」
5. 輸入中文文字：「歡迎來到廢土世界」
6. 點擊「執行自訂測試」

**預期結果**:
- 後端 log 顯示: `zh-TW → cmn-TW`
- 語音名稱: `cmn-TW-Chirp3-HD-{StarName}`
- 模型: `chirp3-hd`
- 聽到中文語音，不同角色有不同音色

### 測試多角色音色差異
用相同文字測試不同角色，應該聽到明顯不同的音色：
- Super Mutant (Algenib) - 極低沉
- Vault Dweller (Aoede) - 年輕活潑
- Codsworth (Despina) - 機器人高音

## 修改的檔案

1. `backend/app/services/tts_service.py`
   - Line 1148-1170: `_is_chirp3_language_supported()` 
   - Line 1171-1238: `_convert_to_chirp_language_code()`
   - Line 1267-1276: `_synthesize_chirp3()` 轉換順序

2. `src/app/test-chirp3-hd/page.tsx`
   - Line 184-196: `LANGUAGE_CODES` 更新支援標籤

## 疑難排解

### 問題：還是聽到 WaveNet 聲音
檢查後端 log 中的 voice_name，如果包含 "Wavenet" 表示：
1. Chirp3 合成失敗，自動降級
2. 檢查 log 中的錯誤訊息
3. 觸摸檔案強制重新載入: `touch backend/app/services/tts_service.py`

### 問題：所有角色聽起來一樣
1. 在測試時設定 `cache_enabled: false`
2. 確認後端 log 中每個請求的 voice_name 不同
3. 檢查 storage_path 是否包含不同的星體名稱

## 官方文件參考

- Chirp3-HD 語言支援: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#language_availability
- 語音選項: https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#voice_options
- 根據官方文件，台灣的語言代碼應使用 `cmn-Hant-TW` 或 `cmn-TW`
