# Bingo Testing Quick Start Guide

## 快速開始

### 執行測試
```bash
# 執行所有測試
bun test

# 執行 bingo 相關測試
bun test bingo

# Watch 模式
bun test:watch

# 覆蓋率報告
bun test:coverage
```

### 建立新測試

#### 1. 複製模板
```bash
# 從 docs/testing/BINGO_TEST_TEMPLATES.md 複製對應模板
```

#### 2. 基本元件測試結構
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YourComponent } from '../YourComponent'

describe('YourComponent', () => {
  it('應該渲染元件', () => {
    render(<YourComponent />)
    expect(screen.getByRole('...')).toBeInTheDocument()
  })

  it('應該處理使用者互動', async () => {
    const user = userEvent.setup()
    render(<YourComponent />)

    await user.click(screen.getByRole('button'))
    // assertions...
  })
})
```

#### 3. Store 測試結構
```typescript
import { renderHook, act } from '@testing-library/react'
import { useYourStore } from '../yourStore'

describe('useYourStore', () => {
  it('應該有正確的初始狀態', () => {
    const { result } = renderHook(() => useYourStore())
    expect(result.current.data).toBeNull()
  })

  it('應該執行 action', async () => {
    const { result } = renderHook(() => useYourStore())

    await act(async () => {
      await result.current.fetchData()
    })

    expect(result.current.data).toBeDefined()
  })
})
```

## 常用測試模式

### 使用者互動
```typescript
const user = userEvent.setup()

// 點擊
await user.click(element)

// 輸入文字
await user.type(input, 'text')

// 鍵盤操作
await user.keyboard('{Enter}')

// 選擇
await user.selectOptions(select, 'value')
```

### Queries 優先順序
```typescript
// 1️⃣ 最佳選擇 - Accessible queries
screen.getByRole('button', { name: '提交' })
screen.getByLabelText('電子郵件')
screen.getByPlaceholderText('輸入名稱')
screen.getByText('歡迎')

// 2️⃣ 語義化 queries
screen.getByAltText('圖片描述')
screen.getByTitle('標題')

// 3️⃣ 最後選擇 - Test IDs
screen.getByTestId('custom-element')
```

### 非同步測試
```typescript
// 使用 waitFor
await waitFor(() => {
  expect(screen.getByText('載入完成')).toBeInTheDocument()
})

// findBy queries (內建 waitFor)
const element = await screen.findByText('載入完成')

// 等待元素消失
await waitForElementToBeRemoved(() => screen.getByText('載入中'))
```

### MSW Handler 覆寫
```typescript
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

it('應該處理錯誤', async () => {
  server.use(
    http.get('*/api/endpoint', () => {
      return HttpResponse.json(
        { error: 'Error' },
        { status: 500 }
      )
    })
  )

  // test error handling...
})
```

## 可用的測試工具

### Test Fixtures
```typescript
import {
  mockBingoCard,
  mockBingoStatus,
  mockClaimResult,
  // ... 更多
} from '@/test/mocks/fixtures/bingoData'
```

### Test Helpers
```typescript
import { bingoTestHelpers } from '@/test/mocks/handlers/bingo'

bingoTestHelpers.setHasCard(true)
bingoTestHelpers.setHasClaimedToday(false)
bingoTestHelpers.reset()
```

### Custom Matchers
```typescript
// Jest DOM matchers
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveClass('className')
expect(element).toHaveAttribute('aria-label', 'value')

// Accessibility
const results = await axe(container)
expect(results).toHaveNoViolations()
```

## 除錯技巧

### 查看 DOM
```typescript
import { screen } from '@testing-library/react'

screen.debug() // 印出整個 DOM
screen.debug(element) // 印出特定元素
screen.logTestingPlaygroundURL() // 取得 Testing Playground URL
```

### 查詢失敗時的建議
```typescript
// 如果 getBy 失敗，會顯示可用的 roles
screen.getByRole('button') // ❌ 失敗時會列出所有可用 roles
```

### VSCode 測試擴充套件
- Jest Runner
- Test Explorer UI

## 覆蓋率目標

```
✅ Lines:      >85%
✅ Branches:   >80%
✅ Functions:  >90%
✅ Statements: >85%
```

## 常見問題

### Q: 測試超時？
```typescript
// 增加特定測試的超時時間
it('long test', async () => {
  // ...
}, 10000) // 10 秒
```

### Q: Act warning?
```typescript
// 確保 state 更新包在 act() 中
await act(async () => {
  await store.fetchData()
})
```

### Q: 找不到元素？
```typescript
// 使用 findBy 而非 getBy 處理非同步
const element = await screen.findByText('text')
```

### Q: 如何測試錯誤邊界？
```typescript
// 暫時關閉 console.error
const spy = jest.spyOn(console, 'error').mockImplementation()
// ... test error boundary
spy.mockRestore()
```

## 檔案位置

```
已實作的測試:
✅ src/lib/stores/__tests__/bingoStore.test.ts
✅ src/components/bingo/__tests__/BingoCardSetup.test.tsx

Test fixtures:
✅ src/test/mocks/fixtures/bingoData.ts

MSW handlers:
✅ src/test/mocks/handlers/bingo.ts

文件:
📄 docs/testing/BINGO_TESTING_GUIDE.md
📄 docs/testing/BINGO_TEST_TEMPLATES.md
📄 docs/testing/BINGO_TESTING_SUMMARY.md
```

## 下一步

1. 查看 `BINGO_TESTING_GUIDE.md` 了解完整策略
2. 使用 `BINGO_TEST_TEMPLATES.md` 中的模板
3. 執行 `bun test:coverage` 檢查覆蓋率
4. 參考已實作的測試檔案

## 有用的連結

- [React Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Jest Expect Matchers](https://jestjs.io/docs/expect)
- [MSW Examples](https://mswjs.io/docs/recipes)
- [Testing Playground](https://testing-playground.com/)
