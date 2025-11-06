# Bug Fix: 修復卡片詳情 Modal 角色解讀顯示問題

## 問題描述

在 readings 詳情頁點開卡片詳情 Modal 的「角色」tab 時，顯示：
```
暫無角色解讀資料
這張卡片尚未被廢土角色解讀
```

但實際上資料庫中有完整的角色解讀資料。

## 根本原因

### 鍵名稱不匹配問題

**資料庫欄位** → **to_dict() 輸出** → **過濾函數期望**

```python
# 修復前：
# backend/app/models/wasteland_card.py (第 311-317 行)
"character_voices": {
    "pip_boy_analysis": self.pip_boy_analysis,           # ❌ 錯誤的 key
    "vault_dweller_perspective": self.vault_dweller_perspective,
    "wasteland_trader_wisdom": self.wasteland_trader_wisdom,
    "super_mutant_simplicity": self.super_mutant_simplicity,
    "codsworth_analysis": self.codsworth_analysis,
}

# 過濾函數期望（faction_voice_mapping.py）
allowed_voices = ["pip_boy", "vault_dweller", ...]  # ✅ CharacterVoice enum 的值

# 結果：鍵不匹配，過濾後變成空字典 {}
```

### 問題流程

1. **後端 API**：
   ```python
   # backend/app/api/v1/endpoints/readings.py (第 606-612 行)
   card_dict = pos.card.to_dict()  # character_voices 有錯誤的 keys
   
   card_dict['character_voices'] = filter_character_voices_by_faction(
       card_dict['character_voices'],  # {"pip_boy_analysis": "...", ...}
       user_faction
   )
   # 過濾後：{} (空字典，因為 keys 不匹配)
   ```

2. **前端 Modal**：
   ```typescript
   // src/components/tarot/CardDetailModal.tsx (第 1040-1042 行)
   const filteredVoices = card.character_voices ? 
     filterCharacterVoicesByFaction(card.character_voices, factionInfluence) : 
     {};
   
   // card.character_voices 已經是空的了
   ```

3. **顯示結果**：
   ```typescript
   // src/components/tarot/CardDetailModal.tsx (第 1053 行)
   {Object.keys(filteredVoices).length > 0 ? ... : "暫無角色解讀資料"}
   // filteredVoices = {} → 顯示錯誤訊息
   ```

## 解決方案

### 修改 `to_dict()` 方法使用正確的鍵名稱

**檔案**：`backend/app/models/wasteland_card.py`

```python
# 修復後 (第 310-317 行)
# Character voices (使用 CharacterVoice enum 的值作為 key)
"character_voices": {
    CharacterVoice.PIP_BOY.value: self.pip_boy_analysis,           # ✅ "pip_boy"
    CharacterVoice.VAULT_DWELLER.value: self.vault_dweller_perspective,  # ✅ "vault_dweller"
    CharacterVoice.WASTELAND_TRADER.value: self.wasteland_trader_wisdom,  # ✅ "wasteland_trader"
    CharacterVoice.SUPER_MUTANT.value: self.super_mutant_simplicity,      # ✅ "super_mutant"
    CharacterVoice.CODSWORTH.value: self.codsworth_analysis,               # ✅ "codsworth"
},
```

### 為什麼這樣修改？

1. **一致性**：與 `CharacterVoice` enum 的定義一致
2. **可維護性**：如果 enum 更新，只需一處修改
3. **過濾正確**：`filter_character_voices_by_faction()` 可以正常工作
4. **類型安全**：使用 enum 值而非字串字面量

## 驗證方法

### 1. 檢查 API 回應

```bash
# 登入後取得 reading 詳情
curl "http://localhost:3000/api/v1/readings/<reading_id>" \
  -H "Cookie: access_token=<your_token>"

# 檢查 card_positions[].card.character_voices 的鍵
# 應該是：
{
  "pip_boy": "...",
  "vault_dweller": "...",
  "wasteland_trader": "...",
  ...
}
```

### 2. 前端測試

1. 進入任何 reading 詳情頁：`/readings/[id]`
2. 點擊任何卡片
3. 切換到「角色」tab
4. **預期結果**：
   - ✅ 顯示角色選擇器（CharacterVoiceSelector）
   - ✅ 顯示角色解讀內容
   - ✅ 可以切換不同角色
   - ✅ 可以播放語音（如果啟用）

### 3. 測試不同陣營的過濾

```python
# 測試過濾函數
from app.core.faction_voice_mapping import filter_character_voices_by_faction

character_voices = {
    "pip_boy": "Pip-Boy says...",
    "vault_dweller": "Vault dweller says...",
    "wasteland_trader": "Trader says...",
    "super_mutant": "SUPER MUTANT SAY...",
    "codsworth": "Codsworth remarks...",
}

# 測試不同陣營
filtered_vault = filter_character_voices_by_faction(character_voices, "vault_dweller")
print("Vault dweller sees:", list(filtered_vault.keys()))
# 預期：['pip_boy', 'vault_dweller', 'codsworth']

filtered_ncr = filter_character_voices_by_faction(character_voices, "ncr")
print("NCR sees:", list(filtered_ncr.keys()))
# 預期：['pip_boy', 'wasteland_trader'] (如果 NCR Ranger 在資料中)
```

## 影響範圍

### 受影響的組件

1. **後端**：
   - `backend/app/models/wasteland_card.py` - `to_dict()` 方法
   - `backend/app/api/v1/endpoints/readings.py` - 讀取詳情 API

2. **前端**：
   - `src/components/tarot/CardDetailModal.tsx` - 角色 tab 顯示
   - `src/app/readings/[id]/page.tsx` - Reading 詳情頁

### 相容性

- ✅ **向後相容**：不影響現有 API 結構
- ✅ **資料庫無需變更**：只改變 serialization 層
- ✅ **前端無需變更**：前端期望的格式現在正確了

## 相關檔案

- **Model**: `backend/app/models/wasteland_card.py`
- **過濾函數**: `backend/app/core/faction_voice_mapping.py`
- **API 端點**: `backend/app/api/v1/endpoints/readings.py`
- **前端 Modal**: `src/components/tarot/CardDetailModal.tsx`
- **Enum 定義**: `backend/app/models/wasteland_card.py` (CharacterVoice)

## 教訓與最佳實踐

### 1. 使用 Enum 值而非字串字面量

```python
# ❌ 不好
"character_voices": {
    "pip_boy_analysis": self.pip_boy_analysis,  # 手寫字串，容易出錯
}

# ✅ 好
"character_voices": {
    CharacterVoice.PIP_BOY.value: self.pip_boy_analysis,  # 使用 enum 值
}
```

### 2. 保持 API 合約的一致性

- 序列化輸出的鍵應該與 API 消費者（前端）期望的一致
- 如果有過濾/驗證邏輯，確保鍵名稱匹配

### 3. 測試序列化輸出

```python
# 建議添加單元測試
def test_card_to_dict_character_voices_keys():
    card = WastelandCard(...)
    card_dict = card.to_dict()
    
    expected_keys = {v.value for v in CharacterVoice}
    actual_keys = set(card_dict['character_voices'].keys())
    
    assert expected_keys == actual_keys, "character_voices keys mismatch"
```

## 總結

這是一個典型的**資料合約不匹配**問題：
- 資料生產者（`to_dict()`）使用了錯誤的鍵名稱
- 資料消費者（過濾函數）期望正確的鍵名稱
- 結果：資料被錯誤地過濾掉

修復只需**一行變更**，將字串字面量改為 enum 值，確保整個系統使用一致的鍵名稱。

---

**修復日期**：2025-11-05  
**問題嚴重性**：中等（影響使用者體驗但不影響系統穩定性）  
**修復複雜度**：低（單一檔案，一處修改）
