/**
 * Tests for StreamingInterpretation component
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { StreamingInterpretation } from '../StreamingInterpretation'
import * as useStreamingTextHook from '@/hooks/useStreamingText'

// Mock useStreamingText hook
jest.mock('@/hooks/useStreamingText')

describe('StreamingInterpretation', () => {
  const mockUseStreamingText = useStreamingTextHook.useStreamingText as jest.MockedFunction<
    typeof useStreamingTextHook.useStreamingText
  >

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('應該渲染載入狀態', () => {
    mockUseStreamingText.mockReturnValue({
      displayText: '',
      isLoading: true,
      isComplete: false,
      error: null,
      skip: jest.fn(),
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
      />
    )

    expect(screen.getByText(/正在連接.*解讀系統/)).toBeInTheDocument()
  })

  it('應該顯示串流文字', async () => {
    mockUseStreamingText.mockReturnValue({
      displayText: '這張牌代表新的開始...',
      isLoading: false,
      isComplete: false,
      error: null,
      skip: jest.fn(),
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('這張牌代表新的開始...')).toBeInTheDocument()
    })
  })

  it('應該顯示完成狀態', () => {
    mockUseStreamingText.mockReturnValue({
      displayText: '完整的解讀內容已顯示',
      isLoading: false,
      isComplete: true,
      error: null,
      skip: jest.fn(),
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
      />
    )

    expect(screen.getByText('完整的解讀內容已顯示')).toBeInTheDocument()
  })

  it('應該顯示錯誤訊息', () => {
    mockUseStreamingText.mockReturnValue({
      displayText: '',
      isLoading: false,
      isComplete: false,
      error: new Error('連接失敗'),
      skip: jest.fn(),
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
      />
    )

    expect(screen.getByText(/系統連接失敗/)).toBeInTheDocument()
  })

  it('應該能夠跳過串流動畫', () => {
    const skipFn = jest.fn()
    mockUseStreamingText.mockReturnValue({
      displayText: '這張牌代表新的開始...',
      isLoading: false,
      isComplete: false,
      error: null,
      skip: skipFn,
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
      />
    )

    const skipButton = screen.getByText(/跳過動畫|顯示完整內容/)
    fireEvent.click(skipButton)

    expect(skipFn).toHaveBeenCalled()
  })

  it('應該能夠重試失敗的請求', () => {
    const retryFn = jest.fn()
    mockUseStreamingText.mockReturnValue({
      displayText: '',
      isLoading: false,
      isComplete: false,
      error: new Error('連接失敗'),
      skip: jest.fn(),
      retry: retryFn,
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
      />
    )

    const retryButton = screen.getByText(/重試/)
    fireEvent.click(retryButton)

    expect(retryFn).toHaveBeenCalled()
  })

  it('應該在完成時呼叫 onComplete callback', () => {
    const onComplete = jest.fn()
    mockUseStreamingText.mockReturnValue({
      displayText: '完整的解讀內容',
      isLoading: false,
      isComplete: true,
      error: null,
      skip: jest.fn(),
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
        onComplete={onComplete}
      />
    )

    // onComplete 應該在 useEffect 中被呼叫
    waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('完整的解讀內容')
    })
  })

  it('應該在錯誤時呼叫 onError callback', () => {
    const onError = jest.fn()
    const error = new Error('連接失敗')
    mockUseStreamingText.mockReturnValue({
      displayText: '',
      isLoading: false,
      isComplete: false,
      error,
      skip: jest.fn(),
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={true}
        onError={onError}
      />
    )

    waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  it('應該在 disabled 時不顯示內容', () => {
    mockUseStreamingText.mockReturnValue({
      displayText: '這張牌代表新的開始...',
      isLoading: false,
      isComplete: false,
      error: null,
      skip: jest.fn(),
      retry: jest.fn(),
    })

    const { container } = render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        enabled={false}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('應該傳遞正確的參數到 useStreamingText', () => {
    mockUseStreamingText.mockReturnValue({
      displayText: '',
      isLoading: true,
      isComplete: false,
      error: null,
      skip: jest.fn(),
      retry: jest.fn(),
    })

    render(
      <StreamingInterpretation
        cardId="the-fool"
        question="我的未來如何？"
        characterVoice="mysterious"
        karmaAlignment="good"
        factionAlignment="brotherhood-of-steel"
        positionMeaning="過去"
        apiUrl="/custom/api/url"
        enabled={true}
        charsPerSecond={100}
      />
    )

    expect(mockUseStreamingText).toHaveBeenCalledWith({
      cardId: 'the-fool',
      question: '我的未來如何？',
      characterVoice: 'mysterious',
      karmaAlignment: 'good',
      factionAlignment: 'brotherhood-of-steel',
      positionMeaning: '過去',
      apiUrl: '/custom/api/url',
      enabled: true,
      charsPerSecond: 100,
    })
  })
})
