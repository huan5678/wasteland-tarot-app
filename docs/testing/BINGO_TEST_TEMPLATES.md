# Bingo Testing Templates

## Component Test Template

```typescript
/**
 * ComponentName Component Tests
 * Tests for [description]
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ComponentName } from '../ComponentName'

expect.extend(toHaveNoViolations)

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('應該渲染元件', () => {
      render(<ComponentName />)
      expect(screen.getByRole('...')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('應該處理點擊事件', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()
      render(<ComponentName onClick={onClick} />)

      await user.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('API Integration', () => {
    it('應該成功載入資料', async () => {
      render(<ComponentName />)

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument()
      })
    })

    it('應該處理 API 錯誤', async () => {
      server.use(
        http.get('*/api/...', () => {
          return HttpResponse.json({ error: 'Error' }, { status: 500 })
        })
      )

      render(<ComponentName />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('應該沒有無障礙違規', async () => {
      const { container } = render(<ComponentName />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
```

## Store Test Template

```typescript
/**
 * Store Tests
 * Tests for [description]
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useStore } from '../store'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state
  })

  describe('Initial State', () => {
    it('應該有正確的初始狀態', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.data).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Actions', () => {
    it('應該成功執行 action', async () => {
      const { result } = renderHook(() => useStore())

      await act(async () => {
        await result.current.fetchData()
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.error).toBeNull()
    })

    it('應該處理錯誤', async () => {
      server.use(
        http.get('*/api/data', () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useStore())

      await act(async () => {
        await result.current.fetchData()
      })

      expect(result.current.error).toBeTruthy()
    })
  })
})
```

## Integration Test Template

```typescript
/**
 * Integration Tests
 * Tests for [workflow description]
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Page } from '../page'

describe('Page Integration', () => {
  it('應該完成完整的使用者流程', async () => {
    const user = userEvent.setup()
    render(<Page />)

    // Step 1: 初始載入
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    // Step 2: 使用者互動
    await user.click(screen.getByRole('button', { name: /action/i }))

    // Step 3: 驗證結果
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    })
  })
})
```

## MSW Handler Template

```typescript
import { http, HttpResponse, delay } from 'msw'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const handlers = [
  // GET endpoint
  http.get(`${API_BASE}/api/v1/resource`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    await delay(100) // Simulate network latency

    return HttpResponse.json({
      data: []
    })
  }),

  // POST endpoint
  http.post(`${API_BASE}/api/v1/resource`, async ({ request }) => {
    const body = await request.json() as { field: string }

    // Validation
    if (!body.field) {
      return HttpResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Field is required' },
        { status: 400 }
      )
    }

    await delay(150)

    return HttpResponse.json(
      { success: true, id: 'new-id' },
      { status: 201 }
    )
  }),
]

// Test helpers
export const testHelpers = {
  setState: (state: any) => { /* ... */ },
  reset: () => { /* ... */ }
}
```

## E2E Test Template (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login or setup
    await page.goto('/login')
    // ...
  })

  test('應該完成完整流程', async ({ page }) => {
    // Arrange
    await page.goto('/feature')

    // Act
    await page.click('text=Action')
    await page.fill('[aria-label="Input"]', 'value')
    await page.click('button:has-text("Submit")')

    // Assert
    await expect(page.locator('[data-testid="success"]')).toBeVisible()
    await expect(page).toHaveURL('/success')
  })
})
```

## Accessibility Test Template

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
  it('應該符合 WCAG 2.1 AA 標準', async () => {
    const { container } = render(<Component />)
    const results = await axe(container, {
      rules: {
        // 可以自訂規則
        'color-contrast': { enabled: true }
      }
    })
    expect(results).toHaveNoViolations()
  })

  it('應該支援鍵盤導航', async () => {
    const user = userEvent.setup()
    render(<Component />)

    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()

    await user.keyboard('{Enter}')
    // 驗證 Enter 鍵行為
  })

  it('應該有適當的 ARIA 標籤', () => {
    render(<Component />)

    const element = screen.getByRole('button')
    expect(element).toHaveAttribute('aria-label')
    expect(element).toHaveAttribute('aria-pressed')
  })
})
```

## Performance Test Template

```typescript
import { renderHook } from '@testing-library/react'
import { performance } from 'perf_hooks'

describe('Performance', () => {
  it('應該在目標時間內完成操作', () => {
    const { result } = renderHook(() => useStore())

    const start = performance.now()

    // 執行操作
    result.current.computeHeavyOperation()

    const duration = performance.now() - start

    expect(duration).toBeLessThan(100) // <100ms
  })

  it('應該處理大量資料', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => i)

    const start = performance.now()
    render(<Component data={largeDataset} />)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(1000) // <1s
  })
})
```

## Snapshot Test Template

```typescript
describe('Snapshot Tests', () => {
  it('應該匹配快照', () => {
    const { container } = render(<Component />)
    expect(container).toMatchSnapshot()
  })

  it('應該匹配不同狀態的快照', () => {
    const { container: loadingContainer } = render(<Component loading />)
    expect(loadingContainer).toMatchSnapshot('loading')

    const { container: errorContainer } = render(<Component error="Error" />)
    expect(errorContainer).toMatchSnapshot('error')
  })
})
```

## Custom Hook Test Template

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCustomHook } from '../useCustomHook'

describe('useCustomHook', () => {
  it('應該返回正確的初始值', () => {
    const { result } = renderHook(() => useCustomHook())
    expect(result.current.value).toBe(initialValue)
  })

  it('應該更新值', () => {
    const { result } = renderHook(() => useCustomHook())

    act(() => {
      result.current.setValue(newValue)
    })

    expect(result.current.value).toBe(newValue)
  })

  it('應該處理副作用', async () => {
    const { result } = renderHook(() => useCustomHook())

    await act(async () => {
      await result.current.fetchData()
    })

    expect(result.current.data).toBeDefined()
  })
})
```

## Test Data Factory Template

```typescript
/**
 * Test Data Factories
 * Helper functions to generate test data
 */

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
})

export const createMockBingoCard = (overrides = {}) => {
  const defaultCard = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25]
  ]

  return {
    id: 'card-1',
    user_id: 'user-1',
    month_year: '2025-10',
    card_data: defaultCard,
    created_at: new Date().toISOString(),
    ...overrides
  }
}

export const createMockClaimResult = (overrides = {}) => ({
  success: true,
  daily_number: 8,
  is_on_card: true,
  line_count: 1,
  has_reward: false,
  claimed_at: new Date().toISOString(),
  ...overrides
})
```

## 使用方式

### 1. 複製相應的模板
```bash
cp docs/testing/BINGO_TEST_TEMPLATES.md src/components/NewComponent/__tests__/NewComponent.test.tsx
```

### 2. 修改測試名稱和邏輯

### 3. 執行測試
```bash
bun test NewComponent.test.tsx
```

### 4. 確認覆蓋率
```bash
bun test:coverage
```
