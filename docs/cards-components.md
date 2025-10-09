# Cards Page 元件使用文件

## 概述

本文件說明卡牌頁面重構後的所有元件使用方式與 API 說明。

## 目錄

1. [頁面元件](#頁面元件)
2. [UI 元件](#ui-元件)
3. [工具函式](#工具函式)
4. [狀態管理](#狀態管理)
5. [使用範例](#使用範例)

---

## 頁面元件

### SuitSelectionPage (`/src/app/cards/page.tsx`)

**用途**: 花色選擇頁面,作為卡牌瀏覽的入口點

**特色**:
- Server Component (SSR)
- 顯示所有 5 個花色選項
- 完整的 SEO 元資料
- 響應式網格佈局

**路由**: `/cards`

**使用方式**:
```tsx
// 自動路由,無需手動導入
// 訪問 /cards 即可顯示此頁面
```

---

### CardListPage (`/src/app/cards/[suit]/page.tsx`)

**用途**: 顯示特定花色的卡牌列表,支援分頁

**特色**:
- Client Component (使用 Zustand store)
- 動態路由: `/cards/[suit]?page=N`
- 分頁顯示卡牌
- 載入狀態與錯誤處理
- SessionStorage 快取機制

**路由**: `/cards/[suit]` 或 `/cards/[suit]?page=N`

**參數**:
- `suit`: 花色識別碼 (major_arcana | nuka_cola | combat_weapons | bottle_caps | radiation_rods)
- `page`: 分頁編號(可選,預設為 1)

---

### CardDetailPage (`/src/app/cards/[suit]/[cardId]/page.tsx`)

**用途**: 顯示卡牌完整詳細資訊

**特色**:
- Client Component
- 動態路由: `/cards/[suit]/[cardId]`
- 上一張/下一張導航
- 完整卡牌資訊顯示

**路由**: `/cards/[suit]/[cardId]`

**參數**:
- `suit`: 花色識別碼
- `cardId`: 卡牌唯一識別碼

---

## UI 元件

### SuitCard

**用途**: 顯示單一花色選項,包含圖示、名稱與卡牌數量

**Props**:
```typescript
interface SuitCardProps {
  suit: SuitType // 花色類型
  className?: string // 自定義類別
}
```

**使用範例**:
```tsx
import { SuitCard } from '@/components/cards/SuitCard'
import { SuitType } from '@/types/suits'

<SuitCard suit={SuitType.MAJOR_ARCANA} />
<SuitCard suit={SuitType.NUKA_COLA} className="custom-class" />
```

**特色**:
- Pip-Boy 風格設計
- 懸停效果(縮放、發光)
- 完整的無障礙性支援
- 響應式字體大小

---

### SuitCardGrid

**用途**: 組織多個 SuitCard 元件的網格佈局

**Props**:
```typescript
interface SuitCardGridProps {
  children: React.ReactNode
  className?: string
}
```

**使用範例**:
```tsx
import { SuitCardGrid, SuitCard } from '@/components/cards/SuitCard'

<SuitCardGrid>
  <SuitCard suit={SuitType.MAJOR_ARCANA} />
  <SuitCard suit={SuitType.NUKA_COLA} />
  <SuitCard suit={SuitType.COMBAT_WEAPONS} />
</SuitCardGrid>
```

**響應式佈局**:
- 行動裝置: 1 欄
- 平板: 2 欄
- 桌面: 3 欄

---

### CardThumbnail

**用途**: 顯示卡牌縮圖,支援延遲載入與錯誤處理

**Props**:
```typescript
interface CardThumbnailProps {
  card: TarotCard // 卡牌資料
  className?: string // 自定義類別
  priority?: boolean // 是否優先載入(首屏卡牌)
}
```

**使用範例**:
```tsx
import { CardThumbnail } from '@/components/cards/CardThumbnail'

<CardThumbnail card={card} />
<CardThumbnail card={card} priority={true} /> // 首屏優先載入
```

**特色**:
- 使用 Next.js Image 元件
- 延遲載入(lazy loading)
- 錯誤 fallback 機制
- 載入骨架屏
- 懸停效果(圖片放大、發光)

---

### CardThumbnailGrid

**用途**: 組織多個 CardThumbnail 元件的網格佈局

**Props**:
```typescript
interface CardThumbnailGridProps {
  children: React.ReactNode
  className?: string
}
```

**使用範例**:
```tsx
import { CardThumbnailGrid, CardThumbnail } from '@/components/cards/CardThumbnail'

<CardThumbnailGrid>
  {cards.map((card, index) => (
    <CardThumbnail key={card.id} card={card} priority={index < 4} />
  ))}
</CardThumbnailGrid>
```

**響應式佈局**:
- 行動裝置: 2 欄
- 平板: 3 欄
- 桌面: 4 欄

---

### PaginationControls

**用途**: 分頁導航控制項,包含上一頁/下一頁按鈕與頁碼指示器

**Props**:
```typescript
interface PaginationControlsProps {
  currentPage: number // 當前頁碼(從 1 開始)
  totalPages: number // 總頁數
  baseUrl: string // 基礎 URL
  onPageChange?: (page: number) => void // 頁碼變更回調(可選)
  className?: string // 自定義類別
  clientSideNavigation?: boolean // 是否使用客戶端導航
}
```

**使用範例**:
```tsx
import { PaginationControls } from '@/components/cards/PaginationControls'

// Server-side navigation (使用 Link)
<PaginationControls
  currentPage={2}
  totalPages={5}
  baseUrl="/cards/nuka-cola"
/>

// Client-side navigation
<PaginationControls
  currentPage={page}
  totalPages={totalPages}
  baseUrl="/cards/nuka-cola"
  clientSideNavigation={true}
  onPageChange={(page) => setPage(page)}
/>
```

**特色**:
- 自動禁用邊界按鈕
- 完整的無障礙性支援(ARIA live regions)
- 響應式設計(行動裝置最小 44x44px 觸控尺寸)
- 支援 server-side 與 client-side 導航

---

### Breadcrumb

**用途**: 麵包屑導航,顯示當前頁面在導航階層中的位置

**Props**:
```typescript
interface BreadcrumbProps {
  items: BreadcrumbItem[] // 麵包屑項目列表
  separator?: React.ReactNode // 分隔符(預設為 '/')
  className?: string // 自定義類別
  showHome?: boolean // 是否顯示首頁連結
  homeLabel?: string // 首頁標籤(預設為 '首頁')
  homePath?: string // 首頁路徑(預設為 '/')
}

interface BreadcrumbItem {
  label: string // 顯示文字
  href?: string // 連結路徑(可選)
}
```

**使用範例**:
```tsx
import { Breadcrumb } from '@/components/navigation/Breadcrumb'

<Breadcrumb
  items={[
    { label: '塔羅牌圖書館', href: '/cards' },
    { label: 'Nuka-Cola 瓶', href: '/cards/nuka-cola' },
    { label: 'Ace of Nuka-Cola' } // 當前頁面(無 href)
  ]}
/>
```

**特色**:
- 當前頁面項目使用 `aria-current="page"`
- 連結項目支援懸停效果
- 響應式設計

---

## 工具函式

### getCardImageUrl()

**用途**: 根據卡牌資料生成正確的圖片路徑

**簽名**:
```typescript
function getCardImageUrl(card: TarotCard): string
```

**參數**:
- `card`: 卡牌資料物件

**返回值**: 圖片路徑字串

**使用範例**:
```typescript
import { getCardImageUrl } from '@/lib/utils/cardImages'

const imageUrl = getCardImageUrl(card)
// Major Arcana: '/assets/cards/major-arcana/00.png'
// Minor Arcana: '/assets/cards/minor-arcana/nuka-cola-bottles/01.png'
```

**邏輯**:
- Major Arcana: `/assets/cards/major-arcana/{number}.png`(編號補零為兩位數)
- Minor Arcana: `/assets/cards/minor-arcana/{suitFolder}/{number}.png`
- 錯誤處理: 未知 suit 返回 fallback 圖片

**Suit 映射表**:
```typescript
{
  'nuka_cola': 'nuka-cola-bottles',
  'combat_weapons': 'combat-weapons',
  'bottle_caps': 'bottle-caps',
  'radiation_rods': 'radiation-rods',
}
```

---

### getCardImageAlt()

**用途**: 為卡牌圖片生成 alt 文字

**簽名**:
```typescript
function getCardImageAlt(card: TarotCard): string
```

**參數**:
- `card`: 卡牌資料物件

**返回值**: alt 文字字串

**使用範例**:
```typescript
import { getCardImageAlt } from '@/lib/utils/cardImages'

const alt = getCardImageAlt(card)
// 優先使用: card.visuals?.image_alt_text
// Fallback: '{card.name} - Wasteland Tarot Card'
```

---

### getSuitDisplayName()

**用途**: 取得花色的顯示名稱(中英文)

**簽名**:
```typescript
function getSuitDisplayName(suit: string): string
```

**參數**:
- `suit`: 花色識別碼

**返回值**: 花色顯示名稱

**使用範例**:
```typescript
import { getSuitDisplayName } from '@/types/suits'

getSuitDisplayName('major_arcana') // '大阿爾克那'
getSuitDisplayName('nuka_cola') // 'Nuka-Cola 瓶(聖杯)'
```

---

## 狀態管理

### useCardsStore (Zustand)

**用途**: 管理卡牌列表、分頁狀態與 sessionStorage 快取

**使用範例**:
```typescript
import { useCardsStore } from '@/stores/cardsStore'

function CardListPage() {
  const { fetchCardsBySuit, isLoading, error, pagination } = useCardsStore()
  const [cards, setCards] = useState<TarotCard[]>([])

  useEffect(() => {
    const loadCards = async () => {
      const cardsData = await fetchCardsBySuit('nuka_cola', 1)
      setCards(cardsData)
    }
    loadCards()
  }, [])

  // ...
}
```

**Store Actions**:
- `fetchCardsBySuit(suit: string, page: number)`: 取得特定花色的卡牌(分頁)
- `fetchCardById(cardId: string)`: 取得單一卡牌詳細資料
- `clearCache()`: 清除所有快取資料
- `clearError()`: 清除錯誤狀態

**Store State**:
- `cardsBySuit`: 嵌套物件 `{ [suit]: { [page]: { data: TarotCard[], timestamp: number } } }`
- `cardsById`: `{ [cardId]: TarotCard }`
- `isLoading`: boolean
- `error`: Error | null
- `pagination`: `{ page: number, totalPages: number, hasMore: boolean }`

**快取機制**:
- 使用 sessionStorage 持久化
- 快取有效期: 5 分鐘
- 快取命中時不發送 API 請求

---

## 使用範例

### 範例 1: 建立自定義卡牌列表頁面

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useCardsStore } from '@/stores/cardsStore'
import { CardThumbnailGrid, CardThumbnail } from '@/components/cards/CardThumbnail'
import { PaginationControls } from '@/components/cards/PaginationControls'

export default function CustomCardList() {
  const { fetchCardsBySuit, pagination } = useCardsStore()
  const [cards, setCards] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchCardsBySuit('nuka_cola', page).then(setCards)
  }, [page])

  return (
    <div>
      <CardThumbnailGrid>
        {cards.map((card) => (
          <CardThumbnail key={card.id} card={card} />
        ))}
      </CardThumbnailGrid>

      {pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          baseUrl="/custom-cards"
        />
      )}
    </div>
  )
}
```

---

### 範例 2: 使用卡牌圖片工具函式

```tsx
import Image from 'next/image'
import { getCardImageUrl, getCardImageAlt } from '@/lib/utils/cardImages'

function CustomCardDisplay({ card }) {
  const imageUrl = getCardImageUrl(card)
  const imageAlt = getCardImageAlt(card)

  return (
    <div>
      <Image
        src={imageUrl}
        alt={imageAlt}
        width={400}
        height={600}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = '/assets/cards/card-backs/default.png'
        }}
      />
    </div>
  )
}
```

---

### 範例 3: 客製化分頁導航

```tsx
import { PaginationControls } from '@/components/cards/PaginationControls'

function CustomPagination({ currentPage, totalPages }) {
  const handlePageChange = (page: number) => {
    console.log('Navigating to page:', page)
    // 自定義導航邏輯
  }

  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      baseUrl="/cards/custom"
      clientSideNavigation={true}
      onPageChange={handlePageChange}
      className="mt-8"
    />
  )
}
```

---

## 無障礙性

所有元件都遵循 WCAG 2.1 AA 標準:

1. **鍵盤導航**: 所有互動元素支援 Tab、Enter、Space 鍵
2. **ARIA 標籤**: 完整的 `aria-label`、`aria-current`、`aria-disabled` 支援
3. **螢幕閱讀器**: 分頁變更使用 `aria-live="polite"` 宣告
4. **視覺聚焦指示器**: 清晰的 `focus-visible` ring 樣式
5. **語意化 HTML**: 使用 `<nav>`, `<main>`, `<h1>` 等語意標籤

---

## 效能優化

1. **圖片延遲載入**: 使用 Next.js Image 元件的 `loading="lazy"`
2. **圖片格式優化**: 自動轉換為 WebP/AVIF 格式
3. **程式碼分割**: Next.js 自動分割,初始 bundle < 200KB
4. **快取機制**: SessionStorage 快取,減少 API 請求
5. **預先載入**: 首屏卡牌使用 `priority={true}`

---

## 故障排除

### 問題 1: 圖片無法載入

**症狀**: 顯示 fallback 圖片或空白

**解決方案**:
1. 檢查圖片檔案是否存在於 `/public/assets/cards/` 路徑
2. 驗證檔案命名是否正確(Major Arcana: `00.png`, Minor Arcana: `01.png`)
3. 確認 `next.config.ts` 的 `images.formats` 包含 `image/webp` 和 `image/png`

---

### 問題 2: 分頁無法正常運作

**症狀**: 點擊分頁按鈕沒有反應

**解決方案**:
1. 確認 `totalPages` > 1
2. 檢查 `baseUrl` 是否正確
3. 驗證 URL 查詢參數 `?page=N` 是否正確更新

---

### 問題 3: 快取未生效

**症狀**: 每次都重新請求 API

**解決方案**:
1. 檢查 sessionStorage 是否可用(瀏覽器支援)
2. 確認快取未超過 5 分鐘有效期
3. 檢查 `useCardsStore` 是否正確初始化

---

## 相關連結

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Playwright E2E Testing](https://playwright.dev/)
