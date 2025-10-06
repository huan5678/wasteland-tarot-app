/**
 * Tests for lazyLoad utility
 */
import { render, screen, waitFor } from '@testing-library/react'
import { lazyLoad, lazyLoadWithErrorBoundary, lazyLoadWithTimeout } from '../lazyLoad'

describe('lazyLoad', () => {
  it('應該延遲載入組件', async () => {
    const LazyComponent = lazyLoad(
      () => Promise.resolve({ default: () => <div>延遲載入的組件</div> })
    )

    render(<LazyComponent />)

    await waitFor(() => {
      expect(screen.getByText('延遲載入的組件')).toBeInTheDocument()
    })
  })

  it('應該顯示自訂的 fallback', async () => {
    const LazyComponent = lazyLoad(
      () => new Promise(resolve => setTimeout(() => resolve({ default: () => <div>組件已載入</div> }), 100)),
      { fallback: <div>載入中...</div> }
    )

    render(<LazyComponent />)

    expect(screen.getByText('載入中...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('組件已載入')).toBeInTheDocument()
    })
  })

  it('應該傳遞 props 到延遲載入的組件', async () => {
    const LazyComponent = lazyLoad<{ name: string }>(
      () => Promise.resolve({ default: ({ name }) => <div>你好 {name}</div> })
    )

    render(<LazyComponent name="廢土居民" />)

    await waitFor(() => {
      expect(screen.getByText('你好 廢土居民')).toBeInTheDocument()
    })
  })
})

describe('lazyLoadWithErrorBoundary', () => {
  // 暫時關閉 console.error
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  it('應該處理載入錯誤', async () => {
    const LazyComponent = lazyLoadWithErrorBoundary(
      () => Promise.reject(new Error('載入失敗')),
      {
        fallback: <div>載入中...</div>,
        errorFallback: <div>載入失敗，請重試</div>,
      }
    )

    render(<LazyComponent />)

    await waitFor(() => {
      expect(screen.getByText('載入失敗，請重試')).toBeInTheDocument()
    })
  })

  it('應該成功載入組件', async () => {
    const LazyComponent = lazyLoadWithErrorBoundary(
      () => Promise.resolve({ default: () => <div>組件成功載入</div> }),
      {
        fallback: <div>載入中...</div>,
        errorFallback: <div>載入失敗</div>,
      }
    )

    render(<LazyComponent />)

    await waitFor(() => {
      expect(screen.getByText('組件成功載入')).toBeInTheDocument()
    })
  })
})

describe('lazyLoadWithTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('應該在超時後顯示超時訊息', async () => {
    const LazyComponent = lazyLoadWithTimeout(
      () => new Promise(() => {}), // 永遠不會 resolve
      100,
      {
        fallback: <div>載入中...</div>,
        timeoutFallback: <div>載入超時</div>,
      }
    )

    render(<LazyComponent />)

    expect(screen.getByText('載入中...')).toBeInTheDocument()

    jest.advanceTimersByTime(150)

    await waitFor(() => {
      expect(screen.getByText('載入超時')).toBeInTheDocument()
    })
  })

  it('應該在超時前成功載入組件', async () => {
    const LazyComponent = lazyLoadWithTimeout(
      () => Promise.resolve({ default: () => <div>組件已載入</div> }),
      1000,
      {
        fallback: <div>載入中...</div>,
        timeoutFallback: <div>載入超時</div>,
      }
    )

    render(<LazyComponent />)

    await waitFor(() => {
      expect(screen.getByText('組件已載入')).toBeInTheDocument()
    })
  })
})
