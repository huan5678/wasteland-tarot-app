# Frontend Faction & Character Synchronization

## 📋 概要

本文檔記錄前端陣營與角色系統的同步更新，確保與後端資料庫的完整一致性。

## 🔄 更新內容

### 1. 陣營列表更新 (`src/data/factions.ts`)

**新增陣營**：
- ✅ `vault_tec` - Vault-Tec 公司
- ✅ `enclave` - 英克雷
- ✅ `children_of_atom` - 原子教

**完整陣營列表**（12 個活躍陣營）：
1. `independent` - 獨立派
2. `vault_dweller` - 避難所居民
3. `vault_tec` - Vault-Tec
4. `brotherhood` - 鋼鐵兄弟會
5. `enclave` - 英克雷
6. `ncr` - 新加州共和國
7. `legion` - 凱薩軍團
8. `minutemen` - 民兵組織
9. `railroad` - 地下鐵路
10. `institute` - 學院
11. `children_of_atom` - 原子教
12. `raiders` - 掠奪者

**陣營 Key 正規化**：
- ❌ `caesars_legion` → ✅ `legion`
- ❌ `brotherhood_of_steel` → ✅ `brotherhood`
- ❌ `vault-tec` → ✅ `vault_dweller` (內部使用)

---

### 2. 角色聲音類型更新 (`src/types/api.ts`)

**CharacterVoicesSchema 擴展**：

新增 6 個角色解讀欄位：

```typescript
export const CharacterVoicesSchema = z.object({
  // 基礎角色（5）
  pip_boy_analysis: z.string().optional().nullable(),
  vault_dweller_perspective: z.string().optional().nullable(),
  wasteland_trader_wisdom: z.string().optional().nullable(),
  super_mutant_simplicity: z.string().optional().nullable(),
  codsworth_analysis: z.string().optional().nullable(),
  
  // 已有角色（3）
  brotherhood_scribe_commentary: z.string().optional().nullable(),
  ghoul_survivor_insight: z.string().optional().nullable(),
  raider_chaos_reading: z.string().optional().nullable(),
  
  // ✅ 新增角色（6）
  brotherhood_paladin_combat_wisdom: z.string().optional().nullable(),
  ncr_ranger_tactical_analysis: z.string().optional().nullable(),
  legion_centurion_command: z.string().optional().nullable(),
  minuteman_hope_message: z.string().optional().nullable(),
  railroad_agent_liberation_view: z.string().optional().nullable(),
  institute_scientist_research_notes: z.string().optional().nullable(),
})
```

**影響範圍**：
- 所有使用 `TarotCard` 型別的組件
- API 回應驗證
- TypeScript 類型檢查

---

### 3. 讀牌頁面更新 (`src/app/readings/[id]/page.tsx`)

**Faction Mapping 擴展**：

```typescript
const factionMapping: Record<string, string> = {
  // 獨立派
  'independent': 'independent',
  
  // 避難所系統
  'vault-tec': 'vault_dweller',
  'vault_tec': 'vault_dweller',
  'vault_dweller': 'vault_dweller',
  
  // 主要陣營
  'brotherhood': 'brotherhood',
  'brotherhood-of-steel': 'brotherhood',
  'brotherhood_of_steel': 'brotherhood',
  'enclave': 'enclave',
  'ncr': 'ncr',
  'legion': 'legion',
  'caesars-legion': 'legion',
  'caesars_legion': 'legion',
  
  // Fallout 4 陣營
  'minutemen': 'minutemen',
  'railroad': 'railroad',
  'institute': 'institute',
  
  // 其他陣營
  'children-of-atom': 'children_of_atom',
  'children_of_atom': 'children_of_atom',
  'raiders': 'raiders'
};
```

**支援多種格式**：
- 連字符版本：`vault-tec`, `brotherhood-of-steel`
- 底線版本：`vault_tec`, `brotherhood_of_steel`
- 簡化版本：`brotherhood`, `legion`

---

### 4. 新讀牌頁面更新 (`src/app/readings/new/page.tsx`)

**預設值修正**：

```typescript
// Before (錯誤)
character_voice: 'pip-boy',          // ❌ 錯誤格式
faction_influence: 'vault-tec'       // ❌ 前端格式

// After (正確)
character_voice: 'pip_boy',          // ✅ 使用底線
faction_influence: 'independent'     // ✅ 預設獨立派
```

**CardDetailModal 顯示**：
```typescript
// Before
factionInfluence="vault-tec"

// After
factionInfluence="independent"  // 預設使用獨立派
```

---

## 📊 陣營-角色映射（API 驅動）

### 使用 API Hook

```typescript
import { useFactions } from '@/hooks/useFactions'
import { buildFactionVoiceMapping } from '@/lib/factionVoiceMapping'

const { factions, isLoading } = useFactions()
const mapping = buildFactionVoiceMapping(factions)
```

### 陣營-角色關係示例

| 陣營 | 關聯角色 |
|------|----------|
| `independent` | Pip-Boy, 避難所居民, 廢土商人, Codsworth |
| `brotherhood` | 兄弟會書記員, 兄弟會聖騎士 |
| `ncr` | NCR 遊騎兵 |
| `legion` | 軍團百夫長 |
| `minutemen` | 民兵 |
| `railroad` | 鐵路特工 |
| `institute` | 學院科學家 |
| `raiders` | 掠奪者 |
| `vault_dweller` | Pip-Boy, 避難所居民 |
| `vault_tec` | Pip-Boy, 避難所居民 |
| `enclave` | 兄弟會書記員 |
| `children_of_atom` | 超級變種人 |

---

## ✅ 驗證清單

### 前端組件
- [x] `src/data/factions.ts` - 陣營列表更新
- [x] `src/data/voices.ts` - 角色列表（已包含 14 個角色）
- [x] `src/types/api.ts` - CharacterVoicesSchema 擴展
- [x] `src/types/character-voice.ts` - 型別定義（已完整）
- [x] `src/app/readings/[id]/page.tsx` - Faction mapping
- [x] `src/app/readings/new/page.tsx` - 預設值修正
- [x] `src/components/tarot/CardDetailModal.tsx` - API 驅動（已驗證）
- [x] `src/app/profile/page_tabs.tsx` - API 驅動（已驗證）
- [x] `src/lib/factionVoiceMapping.ts` - API 驅動（已驗證）

### Admin 介面
- [x] `src/app/admin/factions/page.tsx` - 使用 `useFactions()`
- [x] `src/app/admin/characters/page.tsx` - 使用 `useCharacters()`
- [x] `src/app/admin/faction-characters/page.tsx` - 使用兩者
- [x] `src/app/admin/interpretations/page.tsx` - 使用兩者

### API Hooks
- [x] `useFactions()` - 載入所有陣營
- [x] `useCharacters()` - 載入所有角色
- [x] `buildFactionVoiceMapping()` - 建立陣營-角色映射
- [x] `filterCharacterVoicesByFaction()` - 過濾角色解讀

---

## 🎯 使用指南

### 1. 獲取陣營資料

```typescript
import { useFactions } from '@/hooks/useFactions'

const MyComponent = () => {
  const { factions, isLoading, error } = useFactions()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <select>
      {factions?.map(faction => (
        <option key={faction.id} value={faction.key}>
          {faction.name}
        </option>
      ))}
    </select>
  )
}
```

### 2. 過濾角色解讀

```typescript
import { filterCharacterVoicesByFaction } from '@/lib/factionVoiceMapping'
import { useFactions } from '@/hooks/useFactions'

const CardDisplay = ({ card, userFaction }) => {
  const { factions } = useFactions()
  
  const filteredVoices = filterCharacterVoicesByFaction(
    card.character_voices,
    userFaction,
    factions
  )
  
  return (
    <div>
      {Object.entries(filteredVoices).map(([voice, text]) => (
        <div key={voice}>
          <h3>{voice}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  )
}
```

### 3. 陣營 Key 正規化

```typescript
// 自動處理多種格式
const normalizedKey = faction.toLowerCase().replace('-', '_')

// 範例：
'vault-tec' → 'vault_tec'
'Brotherhood-of-Steel' → 'brotherhood_of_steel'
'caesars_legion' → 'caesars_legion'
```

---

## 🔗 相關文檔

- [Character Interpretations Expansion Plan](./CHARACTER_INTERPRETATIONS_EXPANSION_PLAN.md)
- [Bug Fix: Character Voices](./BUGFIX_CHARACTER_VOICES.md)
- [Bug Fix: Faction Key Mapping](./BUGFIX_FACTION_KEY_MAPPING.md)
- [Backend Character Voice Types](../backend/app/schemas/character_voice.py)

---

## 📈 統計

- **陣營總數**: 12 個（活躍）
- **角色總數**: 14 個
- **解讀總數**: 1,092 條（14 × 78 張卡片）
- **覆蓋率**: 100% ✅

---

## ⚠️ 注意事項

1. **使用 API Hook**：優先使用 `useFactions()` 和 `useCharacters()` 而不是靜態資料
2. **Key 格式**：內部統一使用底線 `_` 格式
3. **Mapping 正規化**：支援多種輸入格式（連字符、底線、混合）
4. **向後兼容**：保留舊的 key 映射以支援既有資料
5. **Type Safety**：所有 API 回應都有 Zod schema 驗證

---

最後更新：2025-11-05
版本：v2.0.0
