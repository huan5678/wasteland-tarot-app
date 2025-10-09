# 卡牌工具函式文件

## 概述

本文件詳細說明卡牌圖片路徑映射、alt 文字生成與相關工具函式的使用方式。

## 目錄

1. [圖片路徑映射](#圖片路徑映射)
2. [工具函式 API](#工具函式-api)
3. [花色映射表](#花色映射表)
4. [圖片資源規範](#圖片資源規範)
5. [錯誤處理](#錯誤處理)
6. [使用範例](#使用範例)

---

## 圖片路徑映射

### 路徑結構

```
/public/assets/cards/
├── major-arcana/
│   ├── 00.png  (The Wanderer)
│   ├── 01.png  (The Vault Dweller)
│   └── ... (共 22 張,00-21.png)
│
├── minor-arcana/
│   ├── nuka-cola-bottles/
│   │   └── 01.png - 14.png
│   ├── combat-weapons/
│   │   └── 01.png - 14.png
│   ├── bottle-caps/
│   │   └── 01.png - 14.png
│   └── radiation-rods/
│       └── 01.png - 14.png
│
└── card-backs/
    └── default.png (fallback 圖片)
```

### 路徑生成邏輯

#### Major Arcana (大阿爾克那)
- **條件**: `is_major_arcana === true` 或 `suit === 'major_arcana'`
- **路徑**: `/assets/cards/major-arcana/{number}.png`
- **編號**: 補零為兩位數(00-21)
- **範例**: 編號 0 → `00.png`, 編號 5 → `05.png`, 編號 21 → `21.png`

#### Minor Arcana (小阿爾克那)
- **條件**: `is_major_arcana === false` 且 suit 為其他花色
- **路徑**: `/assets/cards/minor-arcana/{suitFolder}/{number}.png`
- **編號**: 補零為兩位數(01-14)
- **範例**: Nuka-Cola Ace → `nuka-cola-bottles/01.png`

---

## 工具函式 API

### getCardImageUrl()

**用途**: 根據卡牌資料生成正確的圖片路徑

**簽名**:
```typescript
function getCardImageUrl(card: TarotCard): string
```

**參數**:
```typescript
interface TarotCard {
  id: string
  name: string
  suit: string
  number: number | null
  is_major_arcana: boolean
  // ... 其他欄位
}
```

**返回值**: 圖片路徑字串

**實作邏輯**:
```typescript
export function getCardImageUrl(card: TarotCard): string {
  const baseUrl = '/assets/cards'

  // Major Arcana 卡牌
  if (card.is_major_arcana || card.suit === 'major_arcana') {
    const cardNumber = String(card.number ?? 0).padStart(2, '0')
    return `${baseUrl}/major-arcana/${cardNumber}.png`
  }

  // Minor Arcana 卡牌
  const suitFolderMap: Record<string, string> = {
    'nuka_cola': 'nuka-cola-bottles',
    'combat_weapons': 'combat-weapons',
    'bottle_caps': 'bottle-caps',
    'radiation_rods': 'radiation-rods',
  }

  const suitFolder = suitFolderMap[card.suit]
  if (!suitFolder) {
    console.warn(`[getCardImageUrl] Unknown suit: ${card.suit}. Using fallback image.`)
    return `${baseUrl}/card-backs/default.png` // Fallback
  }

  const cardNumber = String(card.number ?? 1).padStart(2, '0')
  return `${baseUrl}/minor-arcana/${suitFolder}/${cardNumber}.png`
}
```

**使用範例**:
```typescript
import { getCardImageUrl } from '@/lib/utils/cardImages'

// Major Arcana 範例
const foolCard = {
  id: 'wanderer-000',
  name: 'The Wanderer',
  suit: 'major_arcana',
  number: 0,
  is_major_arcana: true,
}
const imageUrl = getCardImageUrl(foolCard)
// 結果: '/assets/cards/major-arcana/00.png'

// Minor Arcana 範例
const aceOfCups = {
  id: 'nuka-cola-01',
  name: 'Ace of Nuka-Cola',
  suit: 'nuka_cola',
  number: 1,
  is_major_arcana: false,
}
const imageUrl = getCardImageUrl(aceOfCups)
// 結果: '/assets/cards/minor-arcana/nuka-cola-bottles/01.png'
```

---

### getCardImageAlt()

**用途**: 為卡牌圖片生成無障礙的 alt 文字

**簽名**:
```typescript
function getCardImageAlt(card: TarotCard): string
```

**參數**: TarotCard 物件

**返回值**: alt 文字字串

**實作邏輯**:
```typescript
export function getCardImageAlt(card: TarotCard): string {
  // 優先使用 visuals.image_alt_text
  if (card.visuals?.image_alt_text) {
    return card.visuals.image_alt_text
  }

  // Fallback: 使用卡牌名稱
  return `${card.name} - Wasteland Tarot Card`
}
```

**使用範例**:
```typescript
import { getCardImageAlt } from '@/lib/utils/cardImages'

const card = {
  name: 'The Vault Dweller',
  visuals: {
    image_alt_text: '避難所居民塔羅牌 - 廢土主題',
  },
}

const alt = getCardImageAlt(card)
// 結果: '避難所居民塔羅牌 - 廢土主題'

// 無 visuals 時
const cardWithoutVisuals = {
  name: 'Ace of Nuka-Cola',
}

const alt = getCardImageAlt(cardWithoutVisuals)
// 結果: 'Ace of Nuka-Cola - Wasteland Tarot Card'
```

---

### getFallbackImageUrl()

**用途**: 取得 fallback 圖片路徑(當圖片載入失敗時使用)

**簽名**:
```typescript
function getFallbackImageUrl(): string
```

**返回值**: `'/assets/cards/card-backs/default.png'`

**使用範例**:
```typescript
import { getFallbackImageUrl } from '@/lib/utils/cardImages'

<Image
  src={imageUrl}
  alt={imageAlt}
  onError={(e) => {
    e.currentTarget.src = getFallbackImageUrl()
  }}
/>
```

---

### isValidCardImagePath()

**用途**: 驗證卡牌是否有有效的圖片路徑

**簽名**:
```typescript
function isValidCardImagePath(card: TarotCard): boolean
```

**參數**: TarotCard 物件

**返回值**: boolean

**驗證規則**:
- Major Arcana: number 必須在 0-21 範圍內
- Minor Arcana: number 必須在 1-14 範圍內
- suit 必須為已知的花色

**使用範例**:
```typescript
import { isValidCardImagePath } from '@/lib/utils/cardImages'

const card = {
  suit: 'nuka_cola',
  number: 5,
  is_major_arcana: false,
}

if (isValidCardImagePath(card)) {
  // 可以安全使用圖片路徑
  const imageUrl = getCardImageUrl(card)
} else {
  // 使用 fallback 圖片
  const imageUrl = getFallbackImageUrl()
}
```

---

### preloadCardImages()

**用途**: 預先載入卡牌圖片(用於效能優化)

**簽名**:
```typescript
function preloadCardImages(cards: TarotCard[]): void
```

**參數**: TarotCard 陣列

**功能**: 在瀏覽器中建立 `<link rel="prefetch">` 標籤預先載入圖片

**使用範例**:
```typescript
import { preloadCardImages } from '@/lib/utils/cardImages'

// 預先載入下一頁的卡牌圖片
useEffect(() => {
  if (nextPageCards.length > 0) {
    preloadCardImages(nextPageCards)
  }
}, [nextPageCards])
```

---

## 花色映射表

### 資料庫 Suit 值 → 資料夾名稱

| 資料庫 suit 值 | 資料夾名稱 | 中文名稱 | 英文名稱 | 卡牌數量 |
|---------------|-----------|---------|---------|---------|
| `major_arcana` | `major-arcana` | 大阿爾克那 | Major Arcana | 22 |
| `nuka_cola` | `nuka-cola-bottles` | Nuka-Cola 瓶(聖杯) | Nuka-Cola Bottles (Cups) | 14 |
| `combat_weapons` | `combat-weapons` | 戰鬥武器(寶劍) | Combat Weapons (Swords) | 14 |
| `bottle_caps` | `bottle-caps` | 瓶蓋(錢幣) | Bottle Caps (Pentacles) | 14 |
| `radiation_rods` | `radiation-rods` | 輻射棒(權杖) | Radiation Rods (Wands) | 14 |

### 程式碼常數

```typescript
export const SUIT_FOLDER_MAP: Record<string, string> = {
  'nuka_cola': 'nuka-cola-bottles',
  'combat_weapons': 'combat-weapons',
  'bottle_caps': 'bottle-caps',
  'radiation_rods': 'radiation-rods',
}
```

---

## 圖片資源規範

### 檔案命名規則

#### Major Arcana
- **格式**: `{number}.png`
- **編號**: 兩位數字,補零(00-21)
- **範例**:
  - The Wanderer (編號 0): `00.png`
  - The Vault Dweller (編號 1): `01.png`
  - The World (編號 21): `21.png`

#### Minor Arcana
- **格式**: `{number}.png`
- **編號**: 兩位數字,補零(01-14)
- **範例**:
  - Ace (編號 1): `01.png`
  - Five (編號 5): `05.png`
  - King (編號 14): `14.png`

### 圖片規格建議

- **格式**: PNG (支援透明背景)
- **尺寸**: 建議 800x1200px (2:3 比例)
- **檔案大小**: < 500KB/張(優化後)
- **色彩模式**: RGB
- **背景**: 可選透明或深色背景

### Next.js Image 優化配置

在 `next.config.ts` 中已配置:

```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

- **自動格式轉換**: WebP/AVIF 優先,PNG 作為後備
- **響應式圖片**: 根據裝置尺寸自動選擇合適大小
- **快取**: 最小快取 TTL 60 秒

---

## 錯誤處理

### 錯誤情境 1: 未知的 Suit

**問題**: 卡牌的 `suit` 欄位不在已知的花色列表中

**處理方式**:
```typescript
if (!suitFolder) {
  console.warn(`[getCardImageUrl] Unknown suit: ${card.suit}. Using fallback image.`)
  return `${baseUrl}/card-backs/default.png`
}
```

**範例**:
```typescript
const invalidCard = {
  suit: 'unknown_suit',
  number: 5,
  is_major_arcana: false,
}

const url = getCardImageUrl(invalidCard)
// 結果: '/assets/cards/card-backs/default.png'
// Console 警告: "[getCardImageUrl] Unknown suit: unknown_suit..."
```

---

### 錯誤情境 2: Null/Undefined Number

**問題**: 卡牌的 `number` 欄位為 null 或 undefined

**處理方式**:
```typescript
// Major Arcana: 使用 0
const cardNumber = String(card.number ?? 0).padStart(2, '0')

// Minor Arcana: 使用 1
const cardNumber = String(card.number ?? 1).padStart(2, '0')
```

**範例**:
```typescript
const cardWithoutNumber = {
  suit: 'nuka_cola',
  number: null,
  is_major_arcana: false,
}

const url = getCardImageUrl(cardWithoutNumber)
// 結果: '/assets/cards/minor-arcana/nuka-cola-bottles/01.png'
```

---

### 錯誤情境 3: 圖片載入失敗

**問題**: 圖片檔案不存在或網路錯誤

**處理方式**:
```typescript
<Image
  src={getCardImageUrl(card)}
  alt={getCardImageAlt(card)}
  onError={(e) => {
    // 顯示 fallback 圖片
    e.currentTarget.src = getFallbackImageUrl()
  }}
/>
```

**React 元件範例**:
```typescript
function CardImage({ card }: { card: TarotCard }) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = imageError
    ? getFallbackImageUrl()
    : getCardImageUrl(card)

  return (
    <Image
      src={imageUrl}
      alt={getCardImageAlt(card)}
      onError={() => setImageError(true)}
    />
  )
}
```

---

## 使用範例

### 範例 1: 在 React 元件中使用

```tsx
import Image from 'next/image'
import { getCardImageUrl, getCardImageAlt } from '@/lib/utils/cardImages'

function CardDisplay({ card }: { card: TarotCard }) {
  return (
    <div className="card-container">
      <Image
        src={getCardImageUrl(card)}
        alt={getCardImageAlt(card)}
        width={400}
        height={600}
        loading="lazy"
      />
      <h3>{card.name}</h3>
    </div>
  )
}
```

---

### 範例 2: 批次預先載入圖片

```tsx
import { useEffect } from 'react'
import { preloadCardImages } from '@/lib/utils/cardImages'

function CardList({ cards, nextPageCards }) {
  // 預先載入下一頁的圖片
  useEffect(() => {
    if (nextPageCards && nextPageCards.length > 0) {
      preloadCardImages(nextPageCards)
    }
  }, [nextPageCards])

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <CardThumbnail key={card.id} card={card} />
      ))}
    </div>
  )
}
```

---

### 範例 3: 驗證卡牌圖片有效性

```tsx
import { isValidCardImagePath, getCardImageUrl, getFallbackImageUrl } from '@/lib/utils/cardImages'

function SafeCardImage({ card }: { card: TarotCard }) {
  const imageUrl = isValidCardImagePath(card)
    ? getCardImageUrl(card)
    : getFallbackImageUrl()

  return (
    <Image
      src={imageUrl}
      alt={getCardImageAlt(card)}
      width={400}
      height={600}
    />
  )
}
```

---

### 範例 4: 動態生成 srcset

```tsx
import { getCardImageUrl } from '@/lib/utils/cardImages'

function ResponsiveCardImage({ card }: { card: TarotCard }) {
  const baseUrl = getCardImageUrl(card)

  return (
    <Image
      src={baseUrl}
      alt={getCardImageAlt(card)}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className="object-cover"
    />
  )
}
```

---

## 測試指南

### 單元測試範例

```typescript
import { describe, it, expect } from 'vitest'
import { getCardImageUrl } from '@/lib/utils/cardImages'

describe('getCardImageUrl', () => {
  it('should return correct path for Major Arcana card', () => {
    const card = {
      is_major_arcana: true,
      number: 0,
      suit: 'major_arcana',
    }
    expect(getCardImageUrl(card)).toBe('/assets/cards/major-arcana/00.png')
  })

  it('should return correct path for Minor Arcana card', () => {
    const card = {
      is_major_arcana: false,
      number: 5,
      suit: 'nuka_cola',
    }
    expect(getCardImageUrl(card)).toBe('/assets/cards/minor-arcana/nuka-cola-bottles/05.png')
  })

  it('should return fallback for unknown suit', () => {
    const card = {
      is_major_arcana: false,
      number: 5,
      suit: 'unknown',
    }
    expect(getCardImageUrl(card)).toBe('/assets/cards/card-backs/default.png')
  })
})
```

---

## 效能最佳實踐

### 1. 使用延遲載入

```tsx
<Image
  src={getCardImageUrl(card)}
  alt={getCardImageAlt(card)}
  loading="lazy" // 非首屏圖片使用延遲載入
  width={400}
  height={600}
/>
```

### 2. 首屏圖片優先載入

```tsx
<Image
  src={getCardImageUrl(card)}
  alt={getCardImageAlt(card)}
  priority // 首屏圖片優先載入
  width={400}
  height={600}
/>
```

### 3. 設定正確的 sizes

```tsx
<Image
  src={getCardImageUrl(card)}
  alt={getCardImageAlt(card)}
  fill
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
/>
```

### 4. 預先載入關鍵圖片

```tsx
useEffect(() => {
  const criticalCards = cards.slice(0, 4) // 前 4 張卡牌
  preloadCardImages(criticalCards)
}, [cards])
```

---

## 相關資源

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web Performance Best Practices](https://web.dev/fast/)
- [Image Accessibility](https://www.w3.org/WAI/tutorials/images/)
