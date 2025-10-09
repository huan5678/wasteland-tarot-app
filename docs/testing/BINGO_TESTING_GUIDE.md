# Daily Bingo Check-in Frontend Testing Guide

## 概述

本文件記錄 daily-bingo-checkin 功能的前端測試策略、已實作的測試，以及測試最佳實踐。

## 已實作的測試基礎設施

### 1. Test Fixtures (`src/test/mocks/fixtures/bingoData.ts`)

建立了完整的測試資料：

- **mockBingoCard**: 標準 5x5 賓果卡
- **mockBingoStatus**: 基本賓果狀態
- **mockBingoStatusWithThreeLines**: 達成三連線的狀態
- **mockBingoStatusNoCard**: 無賓果卡狀態
- **mockClaimResult**: 領取結果
- **mockBingoHistory**: 歷史記錄
- **LINE_PATTERNS**: 位元遮罩連線模式
- **Helper Functions**: `createBitmask()`, `countLines()`

### 2. MSW API Handlers (`src/test/mocks/handlers/bingo.ts`)

實作了所有賓果 API 端點的 mock handlers：

```typescript
// 已實作的端點
GET  /api/v1/bingo/status        - 取得賓果狀態
POST /api/v1/bingo/card          - 建立賓果卡
GET  /api/v1/bingo/card          - 取得賓果卡
POST /api/v1/bingo/claim         - 領取每日號碼
GET  /api/v1/bingo/daily-number  - 取得今日號碼
GET  /api/v1/bingo/lines         - 查詢連線狀態
GET  /api/v1/bingo/history/:month - 查詢歷史記錄
GET  /api/v1/bingo/rewards       - 查詢獎勵記錄
```

**Test Helpers**:
```typescript
bingoTestHelpers.setHasCard(boolean)
bingoTestHelpers.setHasClaimedToday(boolean)
bingoTestHelpers.setCurrentStatus(status)
bingoTestHelpers.reset()
```

### 3. 已完成的測試檔案

#### a. BingoStore Tests (`src/lib/stores/__tests__/bingoStore.test.ts`)

涵蓋範圍：
- ✅ 初始狀態驗證
- ✅ fetchBingoStatus() - 成功、錯誤、無卡片情況
- ✅ createCard() - 號碼驗證、重複檢測、範圍檢查
- ✅ claimDailyNumber() - 成功領取、三連線、已領取錯誤
- ✅ checkLines() - 連線檢測
- ✅ reset() - 狀態重置
- ✅ 錯誤處理 - 網路錯誤、未授權
- ✅ 號碼驗證邏輯

**測試數量**: 20+ tests
**覆蓋率目標**: >90%

#### b. BingoCardSetup Tests (`src/components/bingo/__tests__/BingoCardSetup.test.tsx`)

涵蓋範圍：
- ✅ 渲染 - 25 個按鈕、計數器、提交按鈕
- ✅ 號碼選擇 - 選擇、取消、多選、限制
- ✅ 驗證 - 25 個號碼驗證、錯誤訊息
- ✅ 提交 - onSubmit 呼叫、號碼排序、5x5 轉換
- ✅ Loading 狀態 - 禁用按鈕、處理中訊息
- ✅ 錯誤處理 - API 錯誤顯示
- ✅ Accessibility - axe 檢查、ARIA 標籤、鍵盤導航
- ✅ UX - 即時計數、錯誤清除

**測試數量**: 25+ tests
**覆蓋率目標**: >85%

## 待實作的測試檔案

### Task 20: BingoGrid Component

**檔案**: `src/components/bingo/__tests__/BingoGrid.test.tsx`

**測試重點**:
```typescript
describe('BingoGrid Component', () => {
  it('應該渲染 5x5 網格')
  it('應該顯示正確的號碼')
  it('應該標示已領取號碼')
  it('應該高亮今日號碼')
  it('應該視覺化顯示連線')
  it('應該支援橫向、直向、對角線連線')
  it('應該響應式調整大小')
  it('應該無障礙合規')
})
```

**Props 介面**:
```typescript
interface BingoGridProps {
  card: number[][]
  claimedNumbers: Set<number>
  highlightNumber?: number
  lines?: LineType[]
}
```

### Task 21: DailyCheckin Component

**檔案**: `src/components/bingo/__tests__/DailyCheckin.test.tsx`

**測試重點**:
```typescript
describe('DailyCheckin Component', () => {
  it('應該顯示今日號碼')
  it('應該啟用未領取時的按鈕')
  it('應該禁用已領取時的按鈕')
  it('應該顯示已領取訊息')
  it('應該呼叫 onClaim 並顯示 loading')
  it('應該處理 API 錯誤')
  it('應該顯示成功訊息')
  it('應該與 BingoGrid 整合高亮顯示')
})
```

### Task 22: LineIndicator Component

**檔案**: `src/components/bingo/__tests__/LineIndicator.test.tsx`

**測試重點**:
```typescript
describe('LineIndicator Component', () => {
  it('應該顯示連線數量')
  it('應該顯示連線類型（橫、直、斜）')
  it('應該顯示進度條')
  it('應該在連線增加時播放動畫')
  it('應該高亮達成三連線')
  it('應該顯示連線圖示')
})
```

### Task 23: RewardNotification Component

**檔案**: `src/components/bingo/__tests__/RewardNotification.test.tsx`

**測試重點**:
```typescript
describe('RewardNotification Component', () => {
  it('應該在 hasReward=true 時顯示')
  it('應該顯示獎勵詳情')
  it('應該播放慶祝動畫')
  it('應該支援關閉按鈕')
  it('應該支援自動關閉')
  it('應該播放音效（mocked）')
  it('應該支援 Modal 和 Toast 模式')
})
```

### Task 24: BingoHistory Component

**檔案**: `src/components/bingo/__tests__/BingoHistory.test.tsx`

**測試重點**:
```typescript
describe('BingoHistory Component', () => {
  it('應該渲染月份選擇器')
  it('應該在點擊查詢時呼叫 API')
  it('應該顯示歷史賓果卡')
  it('應該顯示已領取號碼')
  it('應該顯示獎勵狀態')
  it('應該處理無資料情況')
  it('應該顯示 loading 狀態')
  it('應該處理 API 錯誤')
})
```

### Task 25: Bingo Page

**檔案**: `src/app/bingo/__tests__/page.test.tsx`

**測試重點**:
```typescript
describe('Bingo Page', () => {
  it('應該要求認證')
  it('應該載入初始狀態')
  it('應該在無卡片時顯示 BingoCardSetup')
  it('應該在有卡片時顯示遊戲介面')
  it('應該整合所有子元件')
  it('應該處理狀態更新')
  it('應該有錯誤邊界')
})
```

### Task 26: Navigation Integration

**檔案**: `src/components/__tests__/Navigation.test.tsx`

**測試重點**:
```typescript
describe('Navigation Integration', () => {
  it('應該顯示賓果連結')
  it('應該在未領取時顯示通知徽章')
  it('應該在已領取時隱藏徽章')
  it('應該導航至 /bingo')
})
```

## 測試工具與模式

### Testing Library 查詢優先順序

按照 React Testing Library 最佳實踐：

1. **Accessible Queries** (優先使用):
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`

2. **Test IDs** (最後選擇):
   - `getByTestId`

### 測試模式範例

#### 1. 使用者互動測試
```typescript
it('應該處理號碼選擇', async () => {
  const user = userEvent.setup()
  render(<BingoCardSetup />)

  const button = screen.getByRole('button', { name: '號碼 1' })
  await user.click(button)

  expect(button).toHaveAttribute('aria-pressed', 'true')
})
```

#### 2. 非同步操作測試
```typescript
it('應該領取每日號碼', async () => {
  const user = userEvent.setup()
  render(<DailyCheckin />)

  const claimButton = screen.getByRole('button', { name: /領取/i })
  await user.click(claimButton)

  await waitFor(() => {
    expect(screen.getByText(/成功/i)).toBeInTheDocument()
  })
})
```

#### 3. MSW Handler 覆寫
```typescript
it('應該處理 API 錯誤', async () => {
  server.use(
    http.post('*/api/v1/bingo/claim', () => {
      return HttpResponse.json(
        { error: 'ALREADY_CLAIMED' },
        { status: 409 }
      )
    })
  )

  // ... test error handling
})
```

#### 4. Store 測試
```typescript
it('應該更新狀態', async () => {
  const { result } = renderHook(() => useBingoStore())

  await act(async () => {
    await result.current.fetchBingoStatus()
  })

  expect(result.current.dailyNumber).toBe(8)
})
```

## 覆蓋率目標

### 全域目標
- **Lines**: >85%
- **Branches**: >80%
- **Functions**: >90%
- **Statements**: >85%

### 元件特定目標
- **BingoStore**: >90%
- **BingoCardSetup**: >85%
- **BingoGrid**: >85%
- **DailyCheckin**: >85%
- **其他元件**: >80%

## 執行測試

### 執行所有測試
```bash
bun test
```

### 執行特定檔案
```bash
bun test bingoStore.test.ts
```

### Watch 模式
```bash
bun test:watch
```

### 覆蓋率報告
```bash
bun test:coverage
```

## 常見測試問題

### 1. 非同步測試超時
```typescript
// ❌ 錯誤
it('test', async () => {
  await someAsyncAction()
  expect(result).toBe(expected) // 可能失敗
})

// ✅ 正確
it('test', async () => {
  await someAsyncAction()
  await waitFor(() => {
    expect(result).toBe(expected)
  })
})
```

### 2. State 更新未包在 act()
```typescript
// ❌ 錯誤
await store.fetchData()
expect(store.data).toBe(expected)

// ✅ 正確
await act(async () => {
  await store.fetchData()
})
expect(store.data).toBe(expected)
```

### 3. 未清理測試副作用
```typescript
afterEach(() => {
  bingoTestHelpers.reset()
  jest.clearAllMocks()
})
```

## 除錯技巧

### 1. 查看渲染的 DOM
```typescript
import { screen } from '@testing-library/react'
screen.debug() // 印出整個 DOM
screen.debug(element) // 印出特定元素
```

### 2. 查看可用的 Queries
```typescript
import { screen } from '@testing-library/react'
screen.logTestingPlaygroundURL() // 獲取 Testing Playground URL
```

### 3. MSW 除錯
```typescript
server.listen({ onUnhandledRequest: 'error' }) // 在測試中捕捉未處理的請求
```

## 最佳實踐

### ✅ DO
- 使用描述性的測試名稱
- 遵循 AAA 模式 (Arrange, Act, Assert)
- 測試使用者行為，而非實作細節
- 使用 `userEvent` 而非 `fireEvent`
- 每個測試應該獨立
- 使用 `waitFor` 處理非同步斷言

### ❌ DON'T
- 不要測試實作細節（如 state 變數名稱）
- 不要使用 `container.querySelector`
- 不要忘記清理副作用
- 不要跳過無障礙測試
- 不要依賴測試執行順序

## CI/CD 整合

測試會在以下情況自動執行：

1. **Pull Request**: 所有測試必須通過
2. **Staging 部署**: 整合測試
3. **Production 部署**: Smoke tests

## 參考資源

- [React Testing Library Docs](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library Queries Cheatsheet](https://testing-library.com/docs/queries/about)
