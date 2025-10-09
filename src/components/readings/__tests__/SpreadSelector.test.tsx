/**
 * Tests for SpreadSelector component
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SpreadSelector } from '../SpreadSelector'
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore'

// Mock spreadTemplatesStore
jest.mock('@/lib/spreadTemplatesStore')
// Mock actionTracker
jest.mock('@/lib/actionTracker', () => ({
  track: jest.fn(),
}))

describe('SpreadSelector', () => {
  const mockUseSpreadTemplatesStore = useSpreadTemplatesStore as jest.MockedFunction<
    typeof useSpreadTemplatesStore
  >

  const mockTemplates = [
    {
      id: '1',
      name: 'Celtic Cross',
      display_name: '塞爾特十字牌陣',
      spread_type: 'celtic_cross',
      card_count: 10,
      difficulty_level: 'advanced',
      usage_count: 150,
      description: '經典的十字牌陣',
      tags: ['經典', '全面'],
      interpretation_guide: '這是一個全面的牌陣，適合深入分析問題。',
    },
    {
      id: '2',
      name: 'Past Present Future',
      display_name: '過去現在未來',
      spread_type: 'past_present_future',
      card_count: 3,
      difficulty_level: 'beginner',
      usage_count: 300,
      description: '簡單的三張牌陣',
      tags: ['簡單', '時間'],
      interpretation_guide: '這個牌陣幫助你理解事物的發展時間線。',
    },
  ]

  const mockFetchAll = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    mockUseSpreadTemplatesStore.mockImplementation((selector: any) => {
      const state = {
        templates: mockTemplates,
        isLoading: false,
        fetchAll: mockFetchAll,
      }
      return selector(state)
    })
  })

  it('應該渲染基本牌陣選項', () => {
    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    expect(screen.getByText('選擇牌陣')).toBeInTheDocument()
    expect(screen.getByDisplayValue('單張占卜 (內建)')).toBeInTheDocument()
  })

  it('應該在掛載時獲取牌陣模板', async () => {
    mockFetchAll.mockResolvedValue(undefined)
    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    await waitFor(() => {
      expect(mockFetchAll).toHaveBeenCalled()
    })
  })

  it('應該顯示載入狀態', () => {
    mockUseSpreadTemplatesStore.mockImplementation((selector: any) => {
      const state = {
        templates: [],
        isLoading: true,
        fetchAll: mockFetchAll,
      }
      return selector(state)
    })

    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    expect(screen.getByText('載入牌陣中...')).toBeInTheDocument()
  })

  it('應該顯示無可用模板訊息', () => {
    mockUseSpreadTemplatesStore.mockImplementation((selector: any) => {
      const state = {
        templates: [],
        isLoading: false,
        fetchAll: mockFetchAll,
      }
      return selector(state)
    })

    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    expect(screen.getByText('尚無可用牌陣模板')).toBeInTheDocument()
  })

  it('應該渲染自訂牌陣模板', () => {
    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    expect(screen.getByText(/塞爾特十字牌陣/)).toBeInTheDocument()
    expect(screen.getByText(/過去現在未來/)).toBeInTheDocument()
  })

  it('應該按照難度和使用次數排序模板', () => {
    const onChange = jest.fn()

    const { container } = render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    const options = container.querySelectorAll('option')
    // 第一個和第二個是內建選項
    // 第三個應該是 beginner (past_present_future)
    // 第四個應該是 advanced (celtic_cross)
    expect(options[2]?.textContent).toContain('過去現在未來')
    expect(options[3]?.textContent).toContain('塞爾特十字牌陣')
  })

  it('應該在選擇改變時呼叫 onChange', () => {
    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'celtic_cross' } })

    expect(onChange).toHaveBeenCalledWith('celtic_cross')
  })

  it('應該顯示選中牌陣的詳細資訊', () => {
    const onChange = jest.fn()

    render(<SpreadSelector value="celtic_cross" onChange={onChange} />)

    expect(screen.getByText(/牌數:/)).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText(/難度:/)).toBeInTheDocument()
    expect(screen.getByText('advanced')).toBeInTheDocument()
    expect(screen.getByText('經典')).toBeInTheDocument()
    expect(screen.getByText('全面')).toBeInTheDocument()
  })

  it('應該不顯示內建牌陣的詳細資訊', () => {
    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    expect(screen.queryByText(/牌數:/)).not.toBeInTheDocument()
  })

  it('應該截斷過長的解讀指南', () => {
    const longGuide = 'A'.repeat(200)

    mockUseSpreadTemplatesStore.mockImplementation((selector: any) => {
      const state = {
        templates: [
          {
            ...mockTemplates[0],
            interpretation_guide: longGuide,
          },
        ],
        isLoading: false,
        fetchAll: mockFetchAll,
      }
      return selector(state)
    })

    const onChange = jest.fn()

    render(<SpreadSelector value="celtic_cross" onChange={onChange} />)

    const guide = screen.getByText(/A{160}\.\.\./)
    expect(guide).toBeInTheDocument()
  })

  it('應該顯示牌陣的標籤（最多6個）', () => {
    mockUseSpreadTemplatesStore.mockImplementation((selector: any) => {
      const state = {
        templates: [
          {
            ...mockTemplates[0],
            tags: ['標籤1', '標籤2', '標籤3', '標籤4', '標籤5', '標籤6', '標籤7', '標籤8'],
          },
        ],
        isLoading: false,
        fetchAll: mockFetchAll,
      }
      return selector(state)
    })

    const onChange = jest.fn()

    render(<SpreadSelector value="celtic_cross" onChange={onChange} />)

    expect(screen.getByText('標籤1')).toBeInTheDocument()
    expect(screen.getByText('標籤6')).toBeInTheDocument()
    expect(screen.queryByText('標籤7')).not.toBeInTheDocument()
  })

  it('應該追蹤牌陣選擇事件', async () => {
    const actionTracker = require('@/lib/actionTracker')
    const onChange = jest.fn()

    render(<SpreadSelector value="single_wasteland" onChange={onChange} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'celtic_cross' } })

    await waitFor(() => {
      expect(actionTracker.track).toHaveBeenCalledWith('spread:select', {
        spread: 'celtic_cross',
      })
    })
  })
})
