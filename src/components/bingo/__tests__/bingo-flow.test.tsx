/**
 * Daily Bingo 前端整合測試
 *
 * 測試完整 UI 流程:
 * 1. 設定賓果卡
 * 2. 領取號碼
 * 3. 檢視連線
 * 4. 接收獎勵通知
 *
 * 需求對應: All requirements frontend validation
 * Task: 28
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import BingoPage from '@/app/bingo/page'

// MSW Server Setup
const server = setupServer(
  // GET /api/v1/bingo/status
  http.get('/api/v1/bingo/status', () => {
    return HttpResponse.json({
      has_card: false,
      line_count: 0,
      has_claimed_today: false
    })
  }),

  // POST /api/v1/bingo/card
  http.post('/api/v1/bingo/card', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        card_id: 'test-card-123',
        grid: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15],
          [16, 17, 18, 19, 20],
          [21, 22, 23, 24, 25]
        ],
        month_year: '2025-10',
        created_at: new Date().toISOString()
      },
      { status: 201 }
    )
  }),

  // GET /api/v1/bingo/daily-number
  http.get('/api/v1/bingo/daily-number', () => {
    return HttpResponse.json({
      number: 13,
      date: new Date().toISOString().split('T')[0],
      cycle_number: 1
    })
  }),

  // POST /api/v1/bingo/claim
  http.post('/api/v1/bingo/claim', () => {
    return HttpResponse.json({
      number: 13,
      is_on_card: true,
      line_count: 1,
      has_reward: false,
      claimed_at: new Date().toISOString()
    })
  }),

  // GET /api/v1/bingo/lines
  http.get('/api/v1/bingo/lines', () => {
    return HttpResponse.json({
      line_count: 1,
      line_types: ['horizontal'],
      claimed_numbers: [13]
    })
  }),

  // GET /api/v1/bingo/rewards
  http.get('/api/v1/bingo/rewards', () => {
    return HttpResponse.json([])
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Bingo Game - Complete Flow', () => {
  it('完整流程: 設定賓果卡 → 領取號碼 → 查看連線', async () => {
    const user = userEvent.setup()
    render(<BingoPage />)

    // 1. 初始狀態：顯示賓果卡設定介面
    await waitFor(() => {
      expect(screen.getByText(/設定你的賓果卡/i)).toBeInTheDocument()
    })

    // 2. 選擇 25 個號碼
    const numberButtons = screen.getAllByRole('button', { name: /^[0-9]+$/ })
    expect(numberButtons).toHaveLength(25)

    // 點擊前 25 個號碼按鈕
    for (let i = 0; i < 25; i++) {
      await user.click(numberButtons[i])
    }

    // 3. 提交賓果卡
    const submitButton = screen.getByRole('button', { name: /確認設定/i })
    expect(submitButton).toBeEnabled()
    await user.click(submitButton)

    // 4. 等待卡片建立完成，應顯示遊戲介面
    await waitFor(() => {
      expect(screen.getByText(/今日號碼/i)).toBeInTheDocument()
    })

    // 5. 驗證賓果卡網格顯示
    const bingoGrid = screen.getByTestId('bingo-grid')
    expect(bingoGrid).toBeInTheDocument()

    // 6. 領取今日號碼
    const claimButton = screen.getByRole('button', { name: /領取今日號碼/i })
    await user.click(claimButton)

    // 7. 驗證領取成功
    await waitFor(() => {
      expect(screen.getByText(/已領取/i)).toBeInTheDocument()
    })

    // 8. 驗證連線數顯示
    await waitFor(() => {
      expect(screen.getByText(/1.*連線/i)).toBeInTheDocument()
    })
  })

  it('錯誤處理: 重複領取今日號碼', async () => {
    const user = userEvent.setup()

    // Mock 已有賓果卡的狀態
    server.use(
      http.get('/api/v1/bingo/status', () => {
        return HttpResponse.json({
          has_card: true,
          line_count: 0,
          has_claimed_today: true
        })
      }),
      http.get('/api/v1/bingo/card', () => {
        return HttpResponse.json({
          card_id: 'test-card-123',
          grid: [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25]
          ]
        })
      }),
      http.post('/api/v1/bingo/claim', () => {
        return HttpResponse.json(
          { detail: '今日已領取號碼' },
          { status: 409 }
        )
      })
    )

    render(<BingoPage />)

    // 等待頁面載入
    await waitFor(() => {
      expect(screen.getByTestId('bingo-grid')).toBeInTheDocument()
    })

    // 領取按鈕應該被禁用或顯示已領取
    const claimButton = screen.getByRole('button', { name: /已領取|領取/i })
    expect(claimButton).toBeDisabled()
  })

  it('錯誤處理: 建立賓果卡時號碼重複', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/api/v1/bingo/card', () => {
        return HttpResponse.json(
          { detail: '號碼不可重複' },
          { status: 422 }
        )
      })
    )

    render(<BingoPage />)

    // 選擇號碼（模擬選擇重複號碼）
    const numberButtons = screen.getAllByRole('button', { name: /^[0-9]+$/ })

    // 點擊第一個號碼兩次（模擬重複）
    await user.click(numberButtons[0])

    // 應顯示錯誤訊息
    await waitFor(() => {
      expect(screen.getByText(/號碼不可重複/i)).toBeInTheDocument()
    })
  })

  it('獎勵通知: 達成三連線時顯示獎勵', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/api/v1/bingo/status', () => {
        return HttpResponse.json({
          has_card: true,
          line_count: 2,
          has_claimed_today: false
        })
      }),
      http.get('/api/v1/bingo/card', () => {
        return HttpResponse.json({
          card_id: 'test-card-123',
          grid: [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25]
          ]
        })
      }),
      http.post('/api/v1/bingo/claim', () => {
        return HttpResponse.json({
          number: 13,
          is_on_card: true,
          line_count: 3,
          has_reward: true,
          claimed_at: new Date().toISOString()
        })
      })
    )

    render(<BingoPage />)

    // 等待頁面載入
    await waitFor(() => {
      expect(screen.getByTestId('bingo-grid')).toBeInTheDocument()
    })

    // 領取號碼
    const claimButton = screen.getByRole('button', { name: /領取/i })
    await user.click(claimButton)

    // 應顯示獎勵通知
    await waitFor(() => {
      expect(screen.getByText(/恭喜.*三連線/i)).toBeInTheDocument()
    })
  })

  it('歷史查詢: 顯示過去月份記錄', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/api/v1/bingo/status', () => {
        return HttpResponse.json({
          has_card: true,
          line_count: 0,
          has_claimed_today: false
        })
      }),
      http.get('/api/v1/bingo/card', () => {
        return HttpResponse.json({
          card_id: 'test-card-123',
          grid: [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25]
          ]
        })
      }),
      http.get('/api/v1/bingo/history/:month', ({ params }) => {
        return HttpResponse.json({
          card: {
            grid: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25]
            ]
          },
          claimed_numbers: [1, 5, 13, 21, 25],
          line_count: 1,
          has_reward: false,
          month_year: params.month
        })
      })
    )

    render(<BingoPage />)

    // 等待頁面載入
    await waitFor(() => {
      expect(screen.getByTestId('bingo-grid')).toBeInTheDocument()
    })

    // 點擊歷史查詢按鈕
    const historyButton = screen.getByRole('button', { name: /歷史記錄/i })
    await user.click(historyButton)

    // 選擇月份
    const monthSelect = screen.getByRole('combobox', { name: /選擇月份/i })
    await user.selectOptions(monthSelect, '2025-09')

    // 查詢按鈕
    const queryButton = screen.getByRole('button', { name: /查詢/i })
    await user.click(queryButton)

    // 驗證歷史記錄顯示
    await waitFor(() => {
      expect(screen.getByText(/2025-09/i)).toBeInTheDocument()
      expect(screen.getByText(/1.*連線/i)).toBeInTheDocument()
    })
  })
})

describe('Bingo Components - Unit Tests', () => {
  it('BingoCardSetup: 號碼選擇驗證', async () => {
    const user = userEvent.setup()
    render(<BingoPage />)

    await waitFor(() => {
      expect(screen.getByText(/設定你的賓果卡/i)).toBeInTheDocument()
    })

    // 選擇少於 25 個號碼
    const numberButtons = screen.getAllByRole('button', { name: /^[0-9]+$/ })
    await user.click(numberButtons[0])
    await user.click(numberButtons[1])

    // 提交按鈕應該被禁用
    const submitButton = screen.getByRole('button', { name: /確認設定/i })
    expect(submitButton).toBeDisabled()

    // 選擇至 25 個號碼
    for (let i = 2; i < 25; i++) {
      await user.click(numberButtons[i])
    }

    // 提交按鈕應該啟用
    await waitFor(() => {
      expect(submitButton).toBeEnabled()
    })
  })

  it('BingoGrid: 已領取號碼高亮顯示', async () => {
    server.use(
      http.get('/api/v1/bingo/status', () => {
        return HttpResponse.json({
          has_card: true,
          line_count: 1,
          has_claimed_today: true
        })
      }),
      http.get('/api/v1/bingo/card', () => {
        return HttpResponse.json({
          card_id: 'test-card-123',
          grid: [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25]
          ]
        })
      }),
      http.get('/api/v1/bingo/lines', () => {
        return HttpResponse.json({
          line_count: 1,
          line_types: ['horizontal'],
          claimed_numbers: [1, 2, 3, 4, 5]
        })
      })
    )

    render(<BingoPage />)

    await waitFor(() => {
      expect(screen.getByTestId('bingo-grid')).toBeInTheDocument()
    })

    // 驗證已領取號碼有特殊樣式
    const grid = screen.getByTestId('bingo-grid')
    const claimedCells = within(grid).getAllByTestId(/claimed-number/i)
    expect(claimedCells.length).toBeGreaterThan(0)
  })

  it('LineIndicator: 顯示正確連線數與類型', async () => {
    server.use(
      http.get('/api/v1/bingo/status', () => {
        return HttpResponse.json({
          has_card: true,
          line_count: 3,
          has_claimed_today: true
        })
      }),
      http.get('/api/v1/bingo/card', () => {
        return HttpResponse.json({
          card_id: 'test-card-123',
          grid: [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25]
          ]
        })
      }),
      http.get('/api/v1/bingo/lines', () => {
        return HttpResponse.json({
          line_count: 3,
          line_types: ['horizontal', 'vertical', 'diagonal'],
          claimed_numbers: [1, 2, 3, 4, 5, 6, 11, 16, 21, 13, 19, 7]
        })
      })
    )

    render(<BingoPage />)

    await waitFor(() => {
      expect(screen.getByText(/3.*連線/i)).toBeInTheDocument()
    })

    // 驗證連線類型顯示
    expect(screen.getByText(/橫向/i)).toBeInTheDocument()
    expect(screen.getByText(/直向/i)).toBeInTheDocument()
    expect(screen.getByText(/對角線/i)).toBeInTheDocument()
  })
})
