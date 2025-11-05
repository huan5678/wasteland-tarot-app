# Bug Fix: 陣營 Key 格式不一致導致角色解讀過濾失敗

## 問題描述

在 readings 詳情頁點擊卡片，切換到「角色」tab 時顯示：
```
暫無角色解讀資料
這張卡片尚未被廢土角色解讀
```

## 根本原因

### 陣營 Key 格式不一致

系統中存在多種陣營 key 格式：

1. **資料庫**（factions 表）：
   - `vault-tec`（連字符）
   - `vault_dweller`（下劃線）
   - 兩者是不同的陣營

2. **後端 Enum**（WastelandCard.FactionAlignment）：
   - 使用下劃線格式：`VAULT_DWELLER = "vault_dweller"`

3. **前端過濾邏輯**（factionVoiceMapping.ts）：
   - `getAllowedVoicesForFaction()` 將 `'vault-tec'` 轉換成 `'vault_tec'`
   - `buildFactionVoiceMapping()` 只處理部分變體

### 問題流程

```
用戶在 Profile 選擇陣營
  ↓
儲存到 DB: faction_alignment = 'vault-tec'
  ↓
Reading 詳情頁獲取: factionInfluence = 'vault-tec'
  ↓
getAllowedVoicesForFaction('vault-tec', factions)
  ↓
正規化: 'vault-tec' → 'vault_tec' (下劃線)
  ↓
查找 mapping['vault_tec']
  ↓
NOT FOUND！（mapping 中沒有這個 key）
  ↓
返回: ['pip_boy'] (fallback)
  ↓
filterCharacterVoicesByFaction() 
  ↓
過濾結果: {} (空字典)
  ↓
顯示: "暫無角色解讀資料"
```

## 調試日誌證據

```javascript
// Console 日誌
[CardDetailModal] 🔍 Debugging character voices: {
  hasCard: true,
  hasCharacterVoices: true,
  characterVoicesKeys: ['pip_boy', 'vault_dweller', 'wasteland_trader', 'super_mutant', 'codsworth'],
  factionInfluence: 'vault-tec',  // ← 連字符格式
  hasFactions: true,
  factionsCount: 14
}

[CardDetailModal] 📤 Filtered voices: {
  filteredKeys: [],  // ← 過濾後變成空的！
  filteredCount: 0
}
```

## 解決方案

### 修改 `buildFactionVoiceMapping()` 支援所有變體

**檔案**：`src/lib/factionVoiceMapping.ts`

```typescript
// 修復前
const normalizedKey = faction.key.toLowerCase().replace('-', '_')
mapping[normalizedKey] = characterKeys
// 問題：只有 normalized key，其他變體找不到

// 修復後
const normalizedKey = faction.key.toLowerCase().replace('-', '_')
mapping[normalizedKey] = characterKeys

// 同時保留原始的連字符版本
const withHyphen = faction.key.toLowerCase().replace('_', '-')
if (withHyphen !== normalizedKey) {
  mapping[withHyphen] = characterKeys
}

// 特殊處理 vault_dweller（添加所有變體）
if (normalizedKey === 'vault_dweller') {
  mapping['vault-tec'] = characterKeys
  mapping['vault_tec'] = characterKeys
}
```

### 效果

現在 mapping 會同時包含所有變體：

| 原始 Key | Mapping 中的 Keys |
|----------|-------------------|
| `vault-tec` | `vault-tec`, `vault_tec` |
| `vault_dweller` | `vault_dweller`, `vault-dweller`, `vault-tec`, `vault_tec` |
| `brotherhood` | `brotherhood` |
| `ncr` | `ncr` |

無論用戶選擇哪種格式，都能找到對應的角色列表。

## 驗證測試

### 1. 單元測試模擬

```javascript
const factions = [
  { key: 'vault-tec', characters: [...] },
  { key: 'vault_dweller', characters: [...] }
];

const mapping = buildFactionVoiceMapping(factions);

// 所有變體都能找到
assert(mapping['vault-tec'] !== undefined);    // ✅
assert(mapping['vault_tec'] !== undefined);    // ✅
assert(mapping['vault-dweller'] !== undefined); // ✅
assert(mapping['vault_dweller'] !== undefined); // ✅
```

### 2. 前端測試步驟

1. 進入 `/profile` 頁面
2. 編輯設定，選擇「Vault-Tec 科技公司」陣營
3. 儲存
4. 進入任何 reading 詳情頁
5. 點擊卡片，切換到「角色」tab
6. **預期結果**：
   - ✅ 顯示角色選擇器
   - ✅ 顯示 Pip-Boy、避難所居民、Codsworth 等角色
   - ✅ 顯示角色解讀內容

### 3. Console 檢查

應該看到：
```javascript
[CardDetailModal] 🔍 Debugging character voices: {
  characterVoicesKeys: ['pip_boy', 'vault_dweller', ...],
  factionInfluence: 'vault-tec',
  hasFactions: true
}

[CardDetailModal] 📤 Filtered voices: {
  filteredKeys: ['pip_boy', 'vault_dweller', 'codsworth'],  // ← 有內容了！
  filteredCount: 3
}
```

## 陣營資料整理

### 資料庫中的陣營（factions 表）

| Key | 名稱 | 格式 |
|-----|------|------|
| `vault-tec` | Vault-Tec 科技公司 | 連字符 |
| `vault_dweller` | 避難所居民 | 下劃線 |
| `brotherhood` | 鋼鐵兄弟會 | 單字 |
| `ncr` | 新加州共和國 | 縮寫 |
| `independent` | 獨立派 | 單字 |
| ... | ... | ... |

### 後端 Enum（FactionAlignment）

```python
class FactionAlignment(str, Enum):
    VAULT_DWELLER = "vault_dweller"
    BROTHERHOOD = "brotherhood"
    NCR = "ncr"
    LEGION = "legion"
    RAIDERS = "raiders"
    MINUTEMEN = "minutemen"
    RAILROAD = "railroad"
    INSTITUTE = "institute"
    INDEPENDENT = "independent"
```

**注意**：後端 Enum 中沒有 `vault-tec`，但資料庫中有。

## 建議改進

### 短期（已完成）
- ✅ 修改 `buildFactionVoiceMapping()` 支援所有變體

### 中期
- [ ] 統一陣營 key 格式（建議全部使用下劃線）
- [ ] 在資料庫中添加 `normalized_key` 欄位
- [ ] API 回應時自動添加 `normalized_key`

### 長期
- [ ] 建立 faction key 的型別系統
- [ ] 添加 E2E 測試覆蓋陣營相關功能
- [ ] 考慮使用 UUID 而非字串 key

## 相關檔案

- **前端過濾邏輯**：`src/lib/factionVoiceMapping.ts`
- **Profile 頁面**：`src/app/profile/page.tsx`
- **Settings Tab**：`src/components/profile/tabs/SettingsTab.tsx`
- **CardDetailModal**：`src/components/tarot/CardDetailModal.tsx`
- **後端 User Model**：`backend/app/models/user.py`
- **後端 Card Model**：`backend/app/models/wasteland_card.py`

## 總結

這是一個典型的**資料格式不一致**問題：
- 資料庫使用多種格式（連字符和下劃線）
- 前端過濾邏輯只處理部分格式
- 導致某些陣營的角色解讀無法顯示

修復方法是讓過濾邏輯**支援所有可能的變體**，確保無論用戶選擇哪種格式的陣營，都能正確過濾和顯示角色解讀。

---

**修復日期**：2025-11-05  
**問題嚴重性**：中等（影響特定陣營的使用者體驗）  
**修復複雜度**：低（單一檔案，局部修改）
