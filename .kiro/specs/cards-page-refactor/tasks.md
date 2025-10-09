# 實作任務清單

## 概述

本文件定義卡牌頁面重構的實作任務,每個任務都經過精心設計,確保可在 1-3 小時內完成。任務按照依賴關係排序,並標註對應的需求編號。

---

## 第一階段:基礎設施與工具函式

### 任務 1.1:建立花色配置與型別定義 ✅

**描述**:建立花色相關的 TypeScript 型別、枚舉與配置常數,為整個重構提供型別安全的基礎。

**實作步驟**:
1. 建立檔案 `src/types/suits.ts`
2. 定義 `SuitType` 枚舉(major_arcana, nuka_cola, combat_weapons, bottle_caps, radiation_rods)
3. 定義 `SuitMetadata` 介面(suit, name_zh_tw, name_en, description, card_count)
4. 建立 `SUIT_CONFIG` 常數物件,包含所有 5 個花色的完整元資料
5. 匯出所有型別與常數

**驗收標準**:
- `SuitType` 枚舉包含所有 5 個花色
- `SUIT_CONFIG` 包含每個花色的中英文名稱、描述與卡牌數量
- TypeScript 編譯無錯誤
- 所有花色的 `card_count` 正確(Major Arcana: 22, Minor Arcana 各: 14)

**預估時間**:1 小時

_Requirements: 1.2, 10.1_

---

### 任務 1.2:實作卡牌圖片路徑映射工具函式 ✅

**描述**:建立 `getCardImageUrl()` 與 `getCardImageAlt()` 工具函式,根據卡牌資料生成正確的圖片路徑。

**實作步驟**:
1. 建立檔案 `src/lib/utils/cardImages.ts`
2. 實作 `getCardImageUrl(card: TarotCard): string`
   - 判斷是否為 Major Arcana(檢查 `is_major_arcana` 或 `suit === 'major_arcana'`)
   - Major Arcana:返回 `/assets/cards/major-arcana/{number}.png`(編號補零為兩位數)
   - Minor Arcana:使用 `suitFolderMap` 映射 suit 到資料夾名稱
   - 返回 `/assets/cards/minor-arcana/{suitFolder}/{number}.png`
   - 錯誤處理:未知 suit 返回 fallback 圖片
3. 實作 `getCardImageAlt(card: TarotCard): string`
   - 優先使用 `card.visuals?.image_alt_text`
   - Fallback: `{card.name} - Wasteland Tarot Card`
4. 實作 `getSuitDisplayName(suit: string): string` 輔助函式
5. 撰寫單元測試,涵蓋 Major/Minor Arcana、邊界情況與錯誤處理

**驗收標準**:
- `getCardImageUrl()` 正確處理 Major Arcana 卡牌(編號補零)
- `getCardImageUrl()` 正確處理 Minor Arcana 卡牌(suit 映射到資料夾)
- 未知 suit 返回 fallback 圖片路徑
- 單元測試覆蓋率 > 90%
- TypeScript 型別推斷正確

**預估時間**:2 小時

_Requirements: 8.6, 10.3_

---

### 任務 1.3:建立 Zustand 卡牌狀態 Store ✅

**描述**:建立 Zustand store 管理卡牌列表、分頁狀態與 sessionStorage 快取。

**實作步驟**:
1. 建立檔案 `src/stores/cardsStore.ts`
2. 定義 `CardsState` 介面:
   - `cardsBySuit`: 嵌套物件 `{ [suit]: { [page]: { data: TarotCard[], timestamp: number } } }`
   - `cardsById`: `{ [cardId]: TarotCard }`
   - `isLoading`: boolean
   - `error`: Error | null
   - `pagination`: `{ page: number, totalPages: number, hasMore: boolean }`
3. 實作 `useCardsStore` 使用 Zustand `persist` middleware
   - 設定 `sessionStorage` 為儲存後端
   - 快取有效期:5 分鐘
4. 實作 actions:
   - `fetchCardsBySuit(suit: string, page: number)`:檢查快取,未命中則呼叫 API
   - `fetchCardById(cardId: string)`:檢查快取,未命中則呼叫 API
   - `clearCache()`:清除所有快取資料
5. 錯誤處理:設定 `error` 狀態,保留 `isLoading` 為 false

**驗收標準**:
- Store 正確實作 sessionStorage 持久化
- 快取命中時不發送 API 請求
- 快取過期(> 5 分鐘)時重新請求
- 錯誤狀態正確設定
- TypeScript 型別推斷完整

**預估時間**:2.5 小時

_Requirements: 7.8, 8.8_

---

## 第二階段:UI 元件開發

### 任務 2.1:建立 Pip-Boy 風格的 UI 元件庫 ✅

**描述**:建立可重用的 Pip-Boy 主題 UI 元件,包含按鈕、卡片容器、載入動畫等。

**實作步驟**:
1. 建立目錄 `src/components/ui/pipboy/`
2. 實作 `PipBoyButton.tsx`:
   - Props: `children`, `onClick`, `disabled`, `variant` ('primary' | 'secondary')
   - Tailwind 類別:`border-2 border-pip-boy-green`, `font-mono`, `hover:bg-pip-boy-green/20`
   - 禁用狀態:`opacity-50 cursor-not-allowed`
3. 實作 `PipBoyCard.tsx`:
   - Props: `children`, `className`
   - 樣式:邊框、綠色陰影、終端機風格
4. 實作 `LoadingSpinner.tsx`:
   - Props: `size` ('sm' | 'md' | 'lg')
   - 動畫:旋轉的輻射符號或 Vault-Tec logo
5. 實作 `ErrorDisplay.tsx`:
   - Props: `error: Error`, `onRetry?: () => void`
   - 樣式:紅色邊框、錯誤訊息、重試按鈕
6. 撰寫 Storybook stories 或簡單的測試頁面

**驗收標準**:
- 所有元件符合 Pip-Boy 設計規範(綠色、monospace、終端機風格)
- 按鈕支援 hover 與 disabled 狀態
- 載入動畫流暢(60fps)
- 錯誤顯示元件包含重試功能
- 響應式設計支援行動裝置

**預估時間**:2.5 小時

_Requirements: 10.1, 10.2, 10.5_

---

### 任務 2.2:建立 SuitCard 元件 ✅

**描述**:建立花色選項卡片元件,顯示花色圖示、名稱與卡牌數量。

**實作步驟**:
1. 建立檔案 `src/components/cards/SuitCard.tsx`
2. Props 定義:
   - `suit: SuitType`
   - `onClick?: () => void`
3. 從 `SUIT_CONFIG` 取得花色元資料
4. 實作樣式:
   - Pip-Boy 風格卡片容器
   - 花色圖示(使用 SVG 或圖示庫)
   - 中英文名稱(中文為主標題,英文為副標題)
   - 卡牌數量指示器(例如:「22 張卡牌」)
5. 懸停效果:
   - 邊框高亮
   - 輕微縮放(`scale-105`)
   - 陰影增強
6. 無障礙性:
   - `role="button"`
   - `aria-label` 包含完整花色名稱
   - 鍵盤支援(Enter/Space 觸發點擊)
7. 響應式設計:行動裝置使用較小的圖示與字體

**驗收標準**:
- 顯示正確的花色名稱(中英文)與卡牌數量
- 懸停效果流暢且符合 Pip-Boy 風格
- 支援鍵盤導航(Tab 聚焦、Enter 觸發)
- 行動裝置上可觸控操作
- ARIA 標籤正確設定

**預估時間**:2 小時

_Requirements: 1.2, 1.5, 1.7, 6.1_

---

### 任務 2.3:建立 CardThumbnail 元件 ✅

**描述**:建立卡牌縮圖元件,顯示卡牌圖片、名稱與花色,支援點擊導航。

**實作步驟**:
1. 建立檔案 `src/components/cards/CardThumbnail.tsx`
2. Props 定義:`card: TarotCard`
3. 使用 `getCardImageUrl()` 取得圖片路徑
4. 使用 Next.js `<Link>` 包裹整個元件,導航至 `/cards/{card.suit}/{card.id}`
5. 圖片顯示:
   - 使用 `<img>` 或 Next.js `<Image>` 元件
   - 設定 `loading="lazy"` 延遲載入
   - 錯誤處理:`onError` 顯示 fallback 圖片
   - 固定高度容器(例如 `h-32`)
6. 顯示卡牌名稱與花色名稱(使用 `getSuitDisplayName()`)
7. 懸停效果:
   - 邊框高亮
   - 圖片輕微放大(`group-hover:scale-105`)
   - 游標變為 pointer
8. 無障礙性:
   - 圖片 `alt` 文字使用 `getCardImageAlt()`
   - Link 包含 `aria-label`

**驗收標準**:
- 圖片正確載入並延遲顯示
- 圖片載入失敗時顯示 fallback
- 點擊導航至正確的卡牌詳細頁面
- 懸停效果流暢
- 支援鍵盤導航
- 行動裝置可觸控點擊

**預估時間**:2 小時

_Requirements: 2.10, 3.1, 3.2, 7.3_

---

### 任務 2.4:建立 PaginationControls 元件 ✅

**描述**:建立分頁導航控制項,包含上一頁、下一頁按鈕與頁碼指示器。

**實作步驟**:
1. 建立檔案 `src/components/cards/PaginationControls.tsx`
2. Props 定義:
   - `currentPage: number`
   - `totalPages: number`
   - `baseUrl: string`(例如 `/cards/nuka-cola`)
   - `onPageChange?: (page: number) => void`(可選,用於客戶端導航)
3. 實作按鈕:
   - 上一頁按鈕:`<Link href={baseUrl}?page=${currentPage - 1}>`
   - 下一頁按鈕:`<Link href={baseUrl}?page=${currentPage + 1}>`
   - 禁用邏輯:第一頁禁用上一頁,最後一頁禁用下一頁
4. 頁碼指示器:
   - 顯示「第 X 頁 / 共 Y 頁」
   - 使用 Pip-Boy 風格字體與顏色
5. 無障礙性:
   - 按鈕 `aria-label`:「上一頁」、「下一頁」
   - 禁用按鈕 `aria-disabled="true"`
   - 頁碼指示器 `aria-live="polite"` 宣告當前頁碼
6. 響應式設計:行動裝置使用較大的按鈕尺寸(≥ 44x44px)

**驗收標準**:
- 第一頁時上一頁按鈕禁用
- 最後一頁時下一頁按鈕禁用
- 點擊按鈕正確導航至新頁面
- 頁碼指示器顯示正確
- 螢幕閱讀器正確宣告頁碼
- 支援鍵盤導航

**預估時間**:1.5 小時

_Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 6.5_

---

### 任務 2.5:建立 Breadcrumb 元件 ✅

**描述**:建立麵包屑導航元件,顯示當前頁面在導航階層中的位置。

**實作步驟**:
1. 建立檔案 `src/components/navigation/Breadcrumb.tsx`
2. 定義 `BreadcrumbItem` 介面:`{ label: string, href?: string }`
3. Props 定義:`items: BreadcrumbItem[]`
4. 渲染邏輯:
   - 使用 `<nav>` 標籤包裹
   - 每個項目使用 `<Link>` 或 `<span>`(無 href 時)
   - 項目間使用分隔符(例如 `/` 或 `>`)
5. 樣式:
   - Pip-Boy 風格文字顏色
   - 連結懸停效果
   - 當前頁面(最後一項)使用較亮的顏色
6. 無障礙性:
   - `aria-label="麵包屑導航"`
   - 當前頁面項目使用 `aria-current="page"`

**驗收標準**:
- 正確顯示所有階層項目
- 連結可點擊且導航正確
- 當前頁面項目不可點擊且視覺區分
- 符合 Pip-Boy 視覺風格
- 支援鍵盤導航
- ARIA 標籤正確

**預估時間**:1 小時

_Requirements: 2.13, 4.4, 6.6_

---

## 第三階段:頁面實作

### 任務 3.1:實作花色選擇頁面 (SuitSelectionPage) ✅

**描述**:重構 `/src/app/cards/page.tsx`,實作花色選擇介面作為卡牌瀏覽的入口。

**實作步驟**:
1. 重構 `src/app/cards/page.tsx`
2. 將元件設為 Server Component(移除 `'use client'`)
3. 頁面結構:
   - 頁面標題:「塔羅牌圖書館」
   - 副標題:「選擇花色開始探索廢土占卜」
   - 花色選項網格:使用 `<SuitCard>` 元件
4. 花色網格佈局:
   - 桌面:2x3 或 3x2 網格(5 個花色)
   - 平板:2 欄
   - 行動裝置:1 欄(垂直堆疊)
5. 使用 `SUIT_CONFIG` 動態渲染所有花色卡片
6. 每個 `<SuitCard>` 點擊導航至 `/cards/{suit}`(使用 Next.js Link)
7. 頁面元資料(SEO):
   - 標題:「塔羅牌圖書館 | Wasteland Tarot」
   - 描述:「探索 78 張 Wasteland Tarot 卡牌...」

**驗收標準**:
- 頁面顯示所有 5 個花色選項
- 點擊任一花色導航至對應的卡牌列表頁面
- 響應式佈局在所有裝置上正確顯示
- 符合 Pip-Boy 視覺風格
- 頁面元資料正確設定
- Lighthouse 效能分數 > 90

**預估時間**:2 小時

_Requirements: 1.1, 1.2, 1.4, 1.6, 5.5_

---

### 任務 3.2:實作卡牌列表頁面 (CardListPage) ✅

**描述**:建立 `/src/app/cards/[suit]/page.tsx`,顯示特定花色的卡牌列表與分頁控制項。

**實作步驟**:
1. 建立檔案 `src/app/cards/[suit]/page.tsx`
2. 設為 Client Component(`'use client'`,因需使用 Zustand)
3. 取得動態路由參數:
   - `params.suit`:花色識別碼
   - `searchParams.page`:當前頁碼(預設為 1)
4. 使用 `useCardsStore` hook 取得卡牌資料:
   ```typescript
   const { fetchCardsBySuit } = useCardsStore()
   const [cards, setCards] = useState<TarotCard[]>([])
   const [isLoading, setIsLoading] = useState(true)

   useEffect(() => {
     fetchCardsBySuit(params.suit, page).then(data => {
       setCards(data.cards)
       setIsLoading(false)
     })
   }, [params.suit, page])
   ```
5. 頁面結構:
   - `<Breadcrumb>`:花色選擇 > 當前花色
   - 花色標題與描述(從 `SUIT_CONFIG` 取得)
   - 卡牌網格:使用 `<CardGrid>` 包裹多個 `<CardThumbnail>`
   - `<PaginationControls>`:分頁導航
6. 卡牌網格佈局:
   - 桌面:4 欄(每頁 12 張)
   - 平板:3 欄
   - 行動裝置:2 欄(每頁 6 張)
7. 載入狀態:顯示骨架屏或 `<LoadingSpinner>`
8. 錯誤處理:顯示 `<ErrorDisplay>` 與重試按鈕
9. 返回花色選擇按鈕:導航回 `/cards`
10. 頁面元資料:動態設定標題(例如「Nuka-Cola 瓶 | 塔羅牌圖書館」)

**驗收標準**:
- 正確顯示選定花色的卡牌
- 分頁功能正常運作
- 點擊卡牌導航至詳細頁面
- 載入狀態與錯誤狀態正確顯示
- 響應式佈局在所有裝置上正確
- 瀏覽器前進/後退按鈕正常運作
- 快取機制運作(重新進入頁面時使用快取)

**預估時間**:3 小時

_Requirements: 2.1, 2.2, 2.3, 2.11, 2.12, 8.1, 8.2, 9.2_

---

### 任務 3.3:實作卡牌詳細頁面 (CardDetailPage) ✅

**描述**:建立 `/src/app/cards/[suit]/[cardId]/page.tsx`,顯示卡牌的完整詳細資訊。

**實作步驟**:
1. 建立檔案 `src/app/cards/[suit]/[cardId]/page.tsx`
2. 設為 Client Component(`'use client'`)
3. 取得動態路由參數:
   - `params.suit`:花色識別碼
   - `params.cardId`:卡牌唯一識別碼
4. 使用 `useCardsStore` 取得卡牌詳細資料:
   ```typescript
   const { fetchCardById } = useCardsStore()
   const [card, setCard] = useState<TarotCard | null>(null)

   useEffect(() => {
     fetchCardById(params.cardId).then(setCard)
   }, [params.cardId])
   ```
5. 頁面結構:
   - `<Breadcrumb>`:花色選擇 > 當前花色 > 卡牌名稱
   - 卡牌全尺寸圖像(使用 `<CardDetailImage>`)
   - 卡牌標題(中英文名稱、編號)
   - 正位牌義與逆位牌義
   - Fallout 主題描述與象徵
   - 關鍵字標籤
   - `<CardNavigation>`:上一張/下一張/返回按鈕
   - `<ShareButtons>`:分享功能
6. 實作相鄰卡牌導航:
   - 建立 `useAdjacentCards()` hook
   - 根據當前 suit 與 cardId,找出前一張與下一張卡牌
   - 邊界情況:第一張禁用上一張,最後一張禁用下一張
7. 詳細內容區塊:
   - 使用 Pip-Boy 風格的區塊(綠色邊框、終端機字體)
   - 每個區塊可摺疊(可選)
8. 載入狀態:顯示骨架屏
9. 錯誤處理:卡牌不存在時顯示 404 錯誤
10. 頁面元資料:動態設定標題(例如「The Wanderer | 大阿爾克那 | Wasteland Tarot」)

**驗收標準**:
- 顯示完整的卡牌詳細資訊
- 卡牌圖像正確載入(使用 `getCardImageUrl()`)
- 上一張/下一張導航正常運作
- 返回按鈕導航回卡牌列表(保持分頁狀態)
- 分享功能正常運作
- 響應式設計支援行動裝置
- 載入與錯誤狀態正確處理
- 瀏覽器前進/後退按鈕正常運作

**預估時間**:3 小時

_Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.10, 9.3_

---

## 第四階段:無障礙性與效能優化

### 任務 4.1:無障礙性改善與 ARIA 標籤 ✅

**描述**:為所有頁面與元件新增適當的 ARIA 標籤、鍵盤導航支援與語意化 HTML。

**實作步驟**:
1. 檢查所有互動元素(按鈕、連結、輸入框):
   - 確保 `tabindex` 正確(可聚焦元素 `tabindex="0"`)
   - 新增 `aria-label` 或 `aria-labelledby`
2. 為圖片新增描述性 `alt` 文字(使用 `getCardImageAlt()`)
3. 為分頁控制項新增 `aria-live="polite"` 宣告頁碼變化
4. 為卡牌網格新增 `role="list"` 與 `role="listitem"`
5. 為麵包屑導航新增 `aria-label` 與 `aria-current="page"`
6. 實作鍵盤導航:
   - Tab 鍵循序聚焦
   - Enter/Space 觸發按鈕與連結
   - Escape 關閉模態視窗(如有)
7. 新增視覺聚焦指示器(`:focus-visible`):
   - 綠色外框
   - 高對比度
8. 使用 axe DevTools 檢查無障礙性問題並修正

**驗收標準**:
- 所有互動元素可用鍵盤導航
- 螢幕閱讀器正確宣告所有元素
- ARIA 標籤正確設定
- 視覺聚焦指示器清晰可見
- axe DevTools 無嚴重錯誤
- 符合 WCAG 2.1 AA 標準

**預估時間**:2.5 小時

_Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 6.8_

---

### 任務 4.2:圖片延遲載入與效能優化 ✅

**描述**:為卡牌圖片實作延遲載入、預先載入與 Next.js Image 優化。

**實作步驟**:
1. 更新 `<CardThumbnail>` 元件:
   - 使用 Next.js `<Image>` 元件替代 `<img>`
   - 設定 `loading="lazy"`
   - 設定 `sizes` 屬性(響應式圖片大小)
   - 設定 `placeholder="blur"`(可選,需 base64 placeholder)
2. 更新 `<CardDetailImage>` 元件:
   - 使用 `priority={true}` 優先載入詳細頁面圖片
   - 設定正確的 `fill` 與 `object-fit`
3. 實作預先載入(Prefetch):
   - 在卡牌列表頁面預先載入下一頁的卡牌縮圖
   - 使用 `<link rel="prefetch">` 或 Next.js 自動 prefetch
4. 設定 `next.config.ts`:
   - 啟用 WebP 格式轉換
   - 設定 `deviceSizes` 與 `imageSizes`
5. 實作圖片錯誤處理:
   - `onError` 事件顯示 fallback 圖片
   - 記錄錯誤至 console(開發環境)
6. 使用 Lighthouse 測試效能並優化

**驗收標準**:
- 卡牌縮圖使用延遲載入
- 詳細頁面圖片優先載入
- 圖片格式自動轉換為 WebP
- 圖片載入失敗時顯示 fallback
- Lighthouse 效能分數 > 90
- LCP < 2.5 秒

**預估時間**:2 小時

_Requirements: 7.3, 7.4, 7.5, 7.6_

---

### 任務 4.3:程式碼分割與載入狀態優化 ✅

**描述**:實作程式碼分割、載入骨架屏與效能監控。

**實作步驟**:
1. 使用 Next.js 動態匯入(`dynamic()`)分割大型元件:
   - 卡牌詳細頁面的內容區塊
   - 分享功能元件
2. 建立骨架屏元件(Skeleton):
   - `CardGridSkeleton`:卡牌列表載入狀態
   - `CardDetailSkeleton`:卡牌詳細頁面載入狀態
   - 使用 Tailwind 的 `animate-pulse` 類別
3. 在所有資料載入時顯示骨架屏(替代 `<LoadingSpinner>`)
4. 實作載入狀態指示器:
   - 網路連線緩慢時顯示提示
   - 使用 `navigator.connection` API 偵測網路速度
5. 新增效能監控:
   - 使用 `performance.mark()` 與 `performance.measure()` 記錄關鍵指標
   - 記錄 FCP, LCP, TTI
6. 優化 bundle 大小:
   - 檢查 `npm run build` 的 bundle 分析
   - 移除未使用的依賴與程式碼

**驗收標準**:
- 程式碼分割正確實作
- 載入狀態使用骨架屏而非單一 spinner
- 網路緩慢時顯示提示
- 效能監控指標正確記錄
- 初始 JavaScript bundle < 200KB(gzipped)
- FCP < 1.5 秒

**預估時間**:2.5 小時

_Requirements: 7.1, 7.2, 7.7, 7.8_

---

## 第五階段:測試與文件

### 任務 5.1:撰寫單元測試 ✅

**描述**:為關鍵元件與工具函式撰寫單元測試。

**實作步驟**:
1. 測試工具函式:
   - `getCardImageUrl()` - 測試 Major/Minor Arcana、邊界情況、錯誤處理
   - `getSuitDisplayName()` - 測試所有花色
   - `getCardImageAlt()` - 測試 fallback 邏輯
2. 測試 UI 元件:
   - `<SuitCard>` - 測試顯示、點擊事件、無障礙性
   - `<CardThumbnail>` - 測試圖片載入、錯誤處理、導航
   - `<PaginationControls>` - 測試按鈕禁用邏輯、頁碼顯示
   - `<Breadcrumb>` - 測試階層顯示、連結導航
3. 測試 Zustand store:
   - `fetchCardsBySuit()` - 測試快取命中/未命中、錯誤處理
   - `fetchCardById()` - 測試資料取得與快取
4. 使用 React Testing Library 測試元件:
   - 渲染測試
   - 使用者互動測試(點擊、鍵盤導航)
   - 無障礙性測試(ARIA 標籤、角色)
5. 設定測試覆蓋率門檻:單元測試 > 80%

**驗收標準**:
- 所有工具函式測試覆蓋率 > 90%
- 關鍵 UI 元件測試覆蓋率 > 80%
- Zustand store 測試覆蓋率 > 85%
- 所有測試通過
- 無 flaky tests

**預估時間**:3 小時

_Requirements: 需求涵蓋範圍:全部_

---

### 任務 5.2:撰寫 E2E 測試(關鍵使用者流程) ✅

**描述**:使用 Playwright 撰寫關鍵使用者流程的端對端測試。

**實作步驟**:
1. 建立測試檔案 `tests/e2e/cards-flow.spec.ts`
2. **測試流程 1:完整卡牌瀏覽流程**
   - 訪問 `/cards`
   - 點擊「Nuka-Cola Bottles」
   - 驗證導航至 `/cards/nuka-cola`
   - 驗證卡牌網格顯示
   - 點擊第一張卡牌
   - 驗證導航至卡牌詳細頁面
   - 驗證卡牌詳細資訊顯示
3. **測試流程 2:分頁導航**
   - 訪問 `/cards/nuka-cola?page=1`
   - 點擊「下一頁」
   - 驗證 URL 變為 `?page=2`
   - 驗證新頁面卡牌載入
   - 點擊「上一頁」
   - 驗證返回 `?page=1`
4. **測試流程 3:瀏覽器前進/後退**
   - 完成流程 1
   - 點擊瀏覽器後退按鈕
   - 驗證返回卡牌列表
   - 點擊瀏覽器前進按鈕
   - 驗證返回卡牌詳細頁面
5. 設定 Playwright 設定檔(支援多瀏覽器測試)

**驗收標準**:
- 所有 3 個流程測試通過
- 測試在 Chromium、Firefox、WebKit 上通過
- 測試穩定且無 flaky
- 測試執行時間 < 2 分鐘

**預估時間**:2.5 小時

_Requirements: 需求涵蓋範圍:1, 2, 3, 4, 9_

---

### 任務 5.3:撰寫技術文件與 README ✅

**描述**:撰寫開發文件、API 使用說明與元件使用範例。

**實作步驟**:
1. 更新專案 README:
   - 新增「卡牌頁面重構」章節
   - 說明新的導航結構(花色選擇 → 卡牌列表 → 詳細頁面)
   - 新增架構圖(可使用 Mermaid)
2. 建立元件使用文件 `docs/cards-components.md`:
   - 列出所有新建元件
   - 每個元件的 Props 說明與使用範例
   - 元件組合範例
3. 建立工具函式文件 `docs/card-utils.md`:
   - `getCardImageUrl()` 使用說明與範例
   - 花色映射表
   - 圖片路徑規範
4. 新增 JSDoc 註解至所有公開函式與元件
5. 建立故障排除指南(常見問題與解決方案)

**驗收標準**:
- README 包含完整的功能說明
- 元件文件包含所有新建元件
- 工具函式文件清晰易懂
- JSDoc 註解完整
- 故障排除指南涵蓋常見問題

**預估時間**:2 小時

_Requirements: 需求涵蓋範圍:全部(文件支援)_

---

## 第六階段:整合與驗證

### 任務 6.1:整合測試與品質檢查

**描述**:執行完整的整合測試、程式碼品質檢查與效能驗證。

**實作步驟**:
1. 執行所有單元測試與 E2E 測試
2. 執行 ESLint 與 TypeScript 型別檢查
3. 執行 Prettier 格式化檢查
4. 使用 Lighthouse 測試所有頁面:
   - 花色選擇頁面
   - 卡牌列表頁面(每個花色)
   - 卡牌詳細頁面(至少 3 張卡牌)
5. 使用 axe DevTools 檢查無障礙性
6. 手動測試關鍵流程:
   - 在桌面、平板、行動裝置上測試
   - 使用不同瀏覽器測試(Chrome, Firefox, Safari)
7. 檢查快取功能:
   - 驗證 sessionStorage 正確儲存資料
   - 驗證快取過期機制
8. 驗證錯誤處理:
   - 模擬 API 錯誤
   - 模擬圖片載入失敗
   - 模擬無效的 URL 參數

**驗收標準**:
- 所有自動化測試通過
- 無 ESLint 錯誤或警告
- TypeScript 編譯無錯誤
- Lighthouse 效能分數 > 90(所有頁面)
- axe DevTools 無嚴重無障礙性問題
- 手動測試無阻擋性 bug
- 快取功能正常運作
- 錯誤處理正確顯示友善訊息

**預估時間**:2.5 小時

_Requirements: 需求涵蓋範圍:全部_

---

### 任務 6.2:部署準備與文件最終化

**描述**:準備部署所需的設定、更新文件並建立版本標籤。

**實作步驟**:
1. 檢查 `next.config.ts` 生產環境設定:
   - 圖片優化設定
   - 環境變數檢查
   - 快取策略設定
2. 更新 CHANGELOG.md:
   - 新增版本號(例如 v2.0.0)
   - 列出所有新功能、改善與修正
3. 更新專案文件:
   - 最終化 README
   - 檢查所有連結與參考
4. 建立部署檢查清單:
   - 環境變數設定
   - 資料庫索引檢查
   - 靜態資源檢查(卡牌圖片)
5. 建立 Git tag:`git tag -a v2.0.0 -m "Cards Page Refactor"`
6. 撰寫部署說明文件(如需)

**驗收標準**:
- 生產環境設定正確
- CHANGELOG 完整記錄所有變更
- 文件最終化且無錯誤
- 部署檢查清單完整
- Git tag 已建立
- 準備好進行部署

**預估時間**:1.5 小時

_Requirements: 需求涵蓋範圍:全部(部署支援)_

---

## 任務摘要

| 階段 | 任務數 | 預估總時間 | 依賴關係 |
|------|-------|----------|---------|
| 第一階段:基礎設施 | 3 | 5.5 小時 | 無 |
| 第二階段:UI 元件 | 5 | 10 小時 | 第一階段 |
| 第三階段:頁面實作 | 3 | 8 小時 | 第二階段 |
| 第四階段:優化 | 3 | 7 小時 | 第三階段 |
| 第五階段:測試與文件 | 3 | 7.5 小時 | 第四階段 |
| 第六階段:整合與部署 | 2 | 4 小時 | 第五階段 |
| **總計** | **19** | **42 小時** | - |

---

## 建議實作順序

**Sprint 1(第 1-2 週)**:第一階段 + 第二階段(基礎設施與 UI 元件)
**Sprint 2(第 3-4 週)**:第三階段(頁面實作)
**Sprint 3(第 5 週)**:第四階段(優化)
**Sprint 4(第 6 週)**:第五階段(測試與文件)
**Sprint 5(第 7 週)**:第六階段(整合與部署)

---

## 風險與緩解策略

| 風險 | 影響 | 緩解策略 |
|------|------|---------|
| API 回應時間過長 | 使用者體驗差 | 實作快取、載入狀態、預先載入 |
| 圖片載入失敗 | 視覺破損 | Fallback 圖片、錯誤處理 |
| 無障礙性問題 | 使用者無法使用 | 提前使用 axe DevTools 檢查、鍵盤測試 |
| 效能問題 | 載入時間長 | 延遲載入、程式碼分割、Lighthouse 監控 |
| 瀏覽器相容性 | 部分使用者無法使用 | 跨瀏覽器測試、Polyfills |

---

## 完成標準

**功能完整性**:
- ✅ 所有 10 項需求完全實現
- ✅ 花色選擇 → 卡牌列表 → 詳細頁面導航流程完整
- ✅ 分頁功能正常運作
- ✅ 圖片正確載入(使用 `getCardImageUrl()`)

**品質標準**:
- ✅ 單元測試覆蓋率 > 80%
- ✅ E2E 測試通過(3 個關鍵流程)
- ✅ Lighthouse 效能分數 > 90
- ✅ 無 ESLint 錯誤或 TypeScript 錯誤
- ✅ axe DevTools 無嚴重無障礙性問題

**使用者體驗**:
- ✅ 響應式設計在所有裝置上正確
- ✅ Pip-Boy 視覺風格一致
- ✅ 載入時間符合目標(FCP < 1.5s, LCP < 2.5s)
- ✅ 無障礙性符合 WCAG 2.1 AA 標準

**文件完整性**:
- ✅ README 更新
- ✅ 元件使用文件完整
- ✅ 工具函式文件清晰
- ✅ CHANGELOG 記錄所有變更
