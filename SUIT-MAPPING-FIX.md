# Suit Mapping Fix Documentation

## 問題描述

前端使用簡短的路由名稱 (如 `/cards/major`)，但後端 API 期望完整的枚舉值 (如 `major_arcana`)，導致 HTTP 503 錯誤。

### 錯誤堆疊
```
Error: HTTP 503
    at apiRequest (cardsStore.ts:48:19)
    at async fetchCardsBySuit (cardsStore.ts:80:34)
```

### 後端驗證
```bash
# 錯誤: 使用簡短名稱
curl "http://localhost:8000/api/v1/cards/suits/major?page=1"
# 返回: VALIDATION_ERROR - expected 'major_arcana'

# 正確: 使用完整枚舉值
curl "http://localhost:8000/api/v1/cards/suits/major_arcana?page=1"
# 返回: 成功的 cards 列表
```

## 解決方案

### 1. 新增花色映射系統 (`src/types/suits.ts`)

新增三個核心函數:

#### `convertRouteToApiSuit(routeSuit: string): SuitType`
- 將路由參數轉換為 API 枚舉值
- 向後相容: 如果已經是 API 枚舉值,直接返回
- 錯誤處理: 無效的路由名稱會拋出錯誤

#### `convertApiToRouteSuit(apiSuit: SuitType): RouteSuitName`
- 將 API 枚舉值轉換為路由參數
- 用於生成正確的路由 URL

#### `isValidRouteSuit(routeSuit: string): boolean`
- 驗證路由參數是否有效
- 接受簡短名稱和完整枚舉值

### 映射表

| 前端路由 | 後端 API 枚舉值 | 中文名稱 |
|---------|-----------------|---------|
| `/cards/major` | `major_arcana` | 大阿爾克那 |
| `/cards/bottles` | `nuka_cola_bottles` | Nuka-Cola 瓶 |
| `/cards/weapons` | `combat_weapons` | 戰鬥武器 |
| `/cards/caps` | `bottle_caps` | 瓶蓋 |
| `/cards/rods` | `radiation_rods` | 輻射棒 |

### 2. 更新 Cards Store (`src/stores/cardsStore.ts`)

在 `fetchCardsBySuit` 函數中:
1. 接收路由參數 (如 `'major'`)
2. 使用 `convertRouteToApiSuit()` 轉換為 API 枚舉值 (如 `'major_arcana'`)
3. 使用轉換後的值呼叫後端 API
4. 快取鍵仍使用原始路由參數 (保持一致性)

```typescript
fetchCardsBySuit: async (suit: string, page: number = 1): Promise<TarotCard[]> => {
  // 將路由參數轉換為 API 枚舉值
  let apiSuit: string
  try {
    apiSuit = convertRouteToApiSuit(suit)
  } catch (err) {
    const error = new Error(`無效的花色參數: ${suit}`)
    set({ error, isLoading: false })
    throw error
  }

  // 使用轉換後的 API 枚舉值呼叫後端
  const response = await apiRequest<CardsAPIResponse>(
    `/api/v1/cards/suits/${apiSuit}?page=${page}`
  )
  // ...
}
```

### 3. 更新頁面組件 (`src/app/cards/[suit]/page.tsx`)

使用新的驗證和轉換函數:

```typescript
import {
  isValidRouteSuit,
  convertRouteToApiSuit,
  getSuitDisplayName,
  getSuitDescription,
  getSuitCardCount,
} from '@/types/suits'

// 驗證路由參數
const isValidSuitType = isValidRouteSuit(suit)

// 轉換為 API 枚舉值以取得元資料
const apiSuit = convertRouteToApiSuit(suit)
const suitName = getSuitDisplayName(apiSuit)
```

## 測試

### 單元測試 (`test-suit-mapping.ts`)

測試覆蓋:
1. ✅ 路由 -> API 轉換 (5 個花色)
2. ✅ API -> 路由轉換 (5 個花色)
3. ✅ 無效路由驗證 (4 個測試案例)
4. ✅ 向後相容性 (5 個 API 枚舉值)

**結果: 19/19 測試通過 (100%)**

### 整合測試 (`test-integration.sh`)

測試覆蓋:
1. ✅ Major Arcana (`/cards/major` -> `major_arcana`)
2. ✅ Nuka-Cola Bottles (`/cards/bottles` -> `nuka_cola_bottles`)
3. ✅ Combat Weapons (`/cards/weapons` -> `combat_weapons`)
4. ✅ Bottle Caps (`/cards/caps` -> `bottle_caps`)
5. ✅ Radiation Rods (`/cards/rods` -> `radiation_rods`)
6. ✅ 無效路由錯誤處理

**結果: 6/6 測試通過 (100%)**

### 執行測試

```bash
# 單元測試
bun run test-suit-mapping.ts

# 整合測試 (需要後端運行)
./test-integration.sh
```

## 架構優勢

1. **關注點分離**: 路由邏輯與 API 邏輯解耦
2. **型別安全**: TypeScript 確保映射正確性
3. **向後相容**: 支持直接使用 API 枚舉值
4. **錯誤處理**: 清晰的錯誤訊息和驗證
5. **可維護性**: 集中式映射配置,易於擴展

## 相關檔案

- `/src/types/suits.ts` - 花色型別定義和映射邏輯
- `/src/stores/cardsStore.ts` - Zustand store (使用映射)
- `/src/app/cards/[suit]/page.tsx` - 花色列表頁面
- `/test-suit-mapping.ts` - 單元測試
- `/test-integration.sh` - 整合測試

## 向後相容性

✅ 現有使用完整 API 枚舉值的代碼繼續正常工作
✅ 快取機制保持不變
✅ 錯誤處理行為一致

## 下一步

1. ✅ 實作映射系統
2. ✅ 更新 store 和頁面
3. ✅ 編寫測試
4. ✅ 驗證所有路由
5. ⏭️ (可選) 更新其他使用花色的組件

---

**修正日期**: 2025-10-09
**狀態**: ✅ 完成
**測試覆蓋率**: 100%
