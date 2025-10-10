# 花色路由快速參考

## 映射表

| 前端路由 | API 枚舉值 | 中文名稱 | 英文名稱 | 卡牌數量 |
|---------|-----------|---------|---------|---------|
| `/cards/major` | `major_arcana` | 大阿爾克那 | Major Arcana | 22 |
| `/cards/bottles` | `nuka_cola_bottles` | Nuka-Cola 瓶 | Nuka-Cola Bottles (Cups) | 14 |
| `/cards/weapons` | `combat_weapons` | 戰鬥武器 | Combat Weapons (Swords) | 14 |
| `/cards/caps` | `bottle_caps` | 瓶蓋 | Bottle Caps (Pentacles) | 14 |
| `/cards/rods` | `radiation_rods` | 輻射棒 | Radiation Rods (Wands) | 14 |

## 使用範例

### 在組件中使用

```typescript
import {
  convertRouteToApiSuit,
  convertApiToRouteSuit,
  isValidRouteSuit,
  getSuitDisplayName,
  getSuitDescription,
  getSuitCardCount,
} from '@/types/suits'

// 驗證路由參數
if (isValidRouteSuit('major')) {
  // 轉換為 API 枚舉值
  const apiSuit = convertRouteToApiSuit('major') // 'major_arcana'

  // 取得花色資訊
  const name = getSuitDisplayName(apiSuit)       // '大阿爾克那'
  const desc = getSuitDescription(apiSuit)        // '代表生命中的...'
  const count = getSuitCardCount(apiSuit)         // 22
}

// 生成路由 URL
const apiSuit = 'major_arcana'
const route = convertApiToRouteSuit(apiSuit)     // 'major'
const url = `/cards/${route}`                    // '/cards/major'
```

### 在 Store 中使用

```typescript
import { convertRouteToApiSuit } from '@/types/suits'

fetchCardsBySuit: async (suit: string, page: number = 1) => {
  // 自動轉換路由參數為 API 枚舉值
  const apiSuit = convertRouteToApiSuit(suit)

  // 使用轉換後的值呼叫 API
  const response = await apiRequest(
    `/api/v1/cards/suits/${apiSuit}?page=${page}`
  )
}
```

### API 呼叫範例

```bash
# ✅ 正確 - 使用 API 枚舉值
curl "http://localhost:8000/api/v1/cards/suits/major_arcana?page=1"

# ❌ 錯誤 - 使用路由參數
curl "http://localhost:8000/api/v1/cards/suits/major?page=1"
```

## 錯誤處理

```typescript
try {
  const apiSuit = convertRouteToApiSuit('invalid')
} catch (err) {
  // Error: Invalid route suit name: invalid.
  // Expected one of: major, bottles, weapons, caps, rods
}
```

## 測試

```bash
# 單元測試
bun run test-suit-mapping.ts

# 整合測試 (需要後端運行)
./test-integration.sh
```

## 相關檔案

- **實作**: `src/types/suits.ts`
- **Store**: `src/stores/cardsStore.ts`
- **頁面**: `src/app/cards/[suit]/page.tsx`
- **測試**: `test-suit-mapping.ts`, `test-integration.sh`
- **文檔**: `SUIT-MAPPING-FIX.md`, `TEST-REPORT.md`
