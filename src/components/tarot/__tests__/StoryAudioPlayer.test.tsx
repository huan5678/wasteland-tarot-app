/**
 * StoryAudioPlayer Component Tests
 *
 * Tests for the story audio playback component including:
 * - Play/pause functionality
 * - Progress tracking
 * - Timeline interaction (click and drag)
 * - Loading states
 * - Error handling
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StoryAudioPlayer from '../StoryAudioPlayer'

// Create mock audio methods
const mockPlay = jest.fn().mockResolvedValue(undefined)
const mockPause = jest.fn()
const mockLoad = jest.fn()

// Create mock HTMLMediaElement if it doesn't exist
if (typeof HTMLMediaElement === 'undefined') {
  (global as any).HTMLMediaElement = class MockHTMLMediaElement {
    currentTime = 0
    duration = 100
    paused = true
    volume = 1.0
    play = mockPlay
    pause = mockPause
    load = mockLoad
  }
}

// Setup and cleanup
beforeEach(() => {
  // Reset mock functions
  mockPlay.mockClear().mockResolvedValue(undefined)
  mockPause.mockClear()
  mockLoad.mockClear()

  // Mock audio element properties and methods
  const audioProto = HTMLMediaElement.prototype || (global as any).HTMLMediaElement.prototype

  // Create properties with getters/setters to allow updating
  const state = {
    currentTime: 0,
    duration: 100,
    paused: true,
    volume: 1.0,
  }

  Object.defineProperty(audioProto, 'play', {
    value: mockPlay,
    writable: true,
    configurable: true,
  })

  Object.defineProperty(audioProto, 'pause', {
    value: mockPause,
    writable: true,
    configurable: true,
  })

  Object.defineProperty(audioProto, 'load', {
    value: mockLoad,
    writable: true,
    configurable: true,
  })

  Object.defineProperty(audioProto, 'currentTime', {
    get() { return state.currentTime },
    set(value) { state.currentTime = value },
    configurable: true,
  })

  Object.defineProperty(audioProto, 'duration', {
    get() { return state.duration },
    set(value) { state.duration = value },
    configurable: true,
  })

  Object.defineProperty(audioProto, 'paused', {
    get() { return state.paused },
    set(value) { state.paused = value },
    configurable: true,
  })

  Object.defineProperty(audioProto, 'volume', {
    get() { return state.volume },
    set(value) { state.volume = value },
    configurable: true,
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('StoryAudioPlayer', () => {
  const mockAudioUrl = 'https://example.com/audio/story.mp3'
  const mockCharacterName = 'Brotherhood Scribe'
  const mockCharacterKey = 'brotherhood_scribe'

  describe('Rendering', () => {
    it('應該正確渲染播放器元素', () => {
      render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      // 檢查播放按鈕存在
      expect(screen.getByRole('button', { name: /播放|play/i })).toBeInTheDocument()

      // 檢查角色名稱顯示
      expect(screen.getByText(mockCharacterName)).toBeInTheDocument()

      // 檢查時間顯示 (初始 00:00)
      expect(screen.getByText('00:00')).toBeInTheDocument()
    })

    it('應該渲染隱藏的 audio 元素', () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')
      expect(audioElement).toBeInTheDocument()
      expect(audioElement).toHaveAttribute('src', mockAudioUrl)
    })

    it('應該渲染波形可視化容器', () => {
      render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      // 檢查波形時間軸存在
      const waveformSlider = screen.getByRole('slider', { name: /音頻波形時間軸|時間軸|timeline/i })
      expect(waveformSlider).toBeInTheDocument()
      expect(waveformSlider).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('播放控制', () => {
    it('點擊播放按鈕應該開始播放', async () => {
      render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const playButton = screen.getByRole('button', { name: /播放|play/i })
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled()
      })

      // 按鈕應該變成暫停按鈕
      expect(screen.getByRole('button', { name: /暫停|pause/i })).toBeInTheDocument()
    })

    it('點擊暫停按鈕應該暫停播放', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const playButton = screen.getByRole('button', { name: /播放|play/i })

      // 先播放
      fireEvent.click(playButton)
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled()
      })

      // 再暫停
      const pauseButton = screen.getByRole('button', { name: /暫停|pause/i })
      fireEvent.click(pauseButton)

      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled()
      })

      // 應該變回播放按鈕
      expect(screen.getByRole('button', { name: /播放|play/i })).toBeInTheDocument()
    })

    it('播放結束時應該重置播放狀態', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 開始播放
      const playButton = screen.getByRole('button', { name: /播放|play/i })
      fireEvent.click(playButton)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /暫停|pause/i })).toBeInTheDocument()
      })

      // 模擬播放結束
      fireEvent.ended(audioElement)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /播放|play/i })).toBeInTheDocument()
      })
    })
  })

  describe('進度追蹤', () => {
    it('應該正確顯示當前時間', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 模擬時間更新到 65 秒 (1:05)
      Object.defineProperty(audioElement, 'currentTime', { value: 65, writable: true })
      fireEvent.timeUpdate(audioElement)

      await waitFor(() => {
        expect(screen.getByText('01:05')).toBeInTheDocument()
      })
    })

    it('應該正確顯示總時長', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 模擬總時長為 185 秒 (3:05)
      Object.defineProperty(audioElement, 'duration', { value: 185, writable: true })
      fireEvent.durationChange(audioElement)

      await waitFor(() => {
        expect(screen.getByText('03:05')).toBeInTheDocument()
      })
    })

    it('應該正確更新進度條百分比', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 設定總時長 100 秒，當前 50 秒（50%）
      Object.defineProperty(audioElement, 'duration', { value: 100, writable: true })
      Object.defineProperty(audioElement, 'currentTime', { value: 50, writable: true })

      fireEvent.durationChange(audioElement)
      fireEvent.timeUpdate(audioElement)

      await waitFor(() => {
        const waveformSlider = screen.getByRole('slider', { name: /音頻波形時間軸|時間軸|timeline/i })
        expect(waveformSlider).toHaveAttribute('aria-valuenow', '50')
      })
    })
  })

  describe('時間軸互動 - 點擊', () => {
    it('點擊時間軸應該跳轉到對應位置', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!
      const timeline = screen.getByRole('slider', { name: /時間軸|timeline/i })

      // 設定總時長為 100 秒
      Object.defineProperty(audioElement, 'duration', { value: 100, writable: true })
      fireEvent.durationChange(audioElement)

      // 模擬點擊時間軸 50% 位置
      const timelineRect = { left: 0, width: 200 }
      jest.spyOn(timeline, 'getBoundingClientRect').mockReturnValue(timelineRect as DOMRect)

      fireEvent.click(timeline, { clientX: 100 }) // 點擊中間位置

      await waitFor(() => {
        // currentTime 應該設為 50 秒（100秒 * 50%）
        expect(audioElement.currentTime).toBe(50)
      })
    })
  })

  describe('時間軸互動 - 拖曳', () => {
    it('拖曳時間軸應該更新播放位置', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!
      const timeline = screen.getByRole('slider', { name: /時間軸|timeline/i })

      // 設定總時長為 100 秒
      Object.defineProperty(audioElement, 'duration', { value: 100, writable: true })
      fireEvent.durationChange(audioElement)

      const timelineRect = { left: 0, width: 200 }
      jest.spyOn(timeline, 'getBoundingClientRect').mockReturnValue(timelineRect as DOMRect)

      // 開始拖曳
      fireEvent.mouseDown(timeline, { clientX: 0 })

      // 拖曳到 75% 位置
      fireEvent.mouseMove(document, { clientX: 150 })

      // 結束拖曳
      fireEvent.mouseUp(document)

      await waitFor(() => {
        expect(audioElement.currentTime).toBe(75)
      })
    })

    it('拖曳過程中應該暫停播放', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!
      const playButton = screen.getByRole('button', { name: /播放|play/i })
      const timeline = screen.getByRole('slider', { name: /時間軸|timeline/i })

      // 先開始播放
      fireEvent.click(playButton)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /暫停|pause/i })).toBeInTheDocument()
      })

      // 開始拖曳
      fireEvent.mouseDown(timeline, { clientX: 0 })

      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled()
      })
    })

    it('拖曳結束後應該恢復播放', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!
      const playButton = screen.getByRole('button', { name: /播放|play/i })
      const timeline = screen.getByRole('slider', { name: /時間軸|timeline/i })

      // 先開始播放
      fireEvent.click(playButton)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /暫停|pause/i })).toBeInTheDocument()
      })

      const timelineRect = { left: 0, width: 200 }
      jest.spyOn(timeline, 'getBoundingClientRect').mockReturnValue(timelineRect as DOMRect)

      // 拖曳時間軸
      fireEvent.mouseDown(timeline, { clientX: 50 })
      fireEvent.mouseMove(document, { clientX: 100 })
      fireEvent.mouseUp(document)

      // 應該恢復播放
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalledTimes(2) // 初始 + 恢復
      })
    })
  })

  describe('載入狀態', () => {
    it('音訊開始載入時應該顯示載入中狀態', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 觸發 loadstart 事件
      fireEvent.loadStart(audioElement)

      await waitFor(() => {
        expect(screen.getByText(/載入中|loading/i)).toBeInTheDocument()
      })
    })

    it('音訊可播放時應該隱藏載入狀態', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 先觸發載入
      fireEvent.loadStart(audioElement)
      await waitFor(() => {
        expect(screen.getByText(/載入中|loading/i)).toBeInTheDocument()
      })

      // 再觸發可播放
      fireEvent.canPlay(audioElement)

      await waitFor(() => {
        expect(screen.queryByText(/載入中|loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('錯誤處理', () => {
    it('音訊載入失敗時應該顯示錯誤訊息', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 模擬音訊錯誤
      const errorEvent = new Event('error')
      Object.defineProperty(errorEvent, 'target', {
        value: {
          error: { code: 4, message: 'Media loading failed' }
        }
      })

      fireEvent(audioElement, errorEvent)

      await waitFor(() => {
        expect(screen.getByText(/播放失敗|playback failed|錯誤|error/i)).toBeInTheDocument()
      })
    })

    it('錯誤狀態下播放按鈕應該被停用', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!
      const playButton = screen.getByRole('button', { name: /播放|play/i })

      // 模擬音訊錯誤
      const errorEvent = new Event('error')
      fireEvent(audioElement, errorEvent)

      await waitFor(() => {
        expect(playButton).toBeDisabled()
      })
    })

    it('應該顯示錯誤類型資訊', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 模擬網路錯誤 (code 2)
      const errorEvent = new Event('error')
      Object.defineProperty(audioElement, 'error', {
        value: { code: 2, message: 'Network error' },
        writable: true
      })

      fireEvent(audioElement, errorEvent)

      await waitFor(() => {
        const errorMessage = screen.getByText(/網路|network/i)
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })

  describe('無障礙性', () => {
    it('播放按鈕應該有正確的 ARIA 標籤', () => {
      render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const playButton = screen.getByRole('button', { name: /播放|play/i })
      expect(playButton).toHaveAttribute('aria-label')
    })

    it('波形時間軸應該有正確的 ARIA 屬性', async () => {
      const { container } = render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const audioElement = container.querySelector('audio')!

      // 設定進度
      Object.defineProperty(audioElement, 'duration', { value: 100, writable: true })
      Object.defineProperty(audioElement, 'currentTime', { value: 30, writable: true })

      fireEvent.durationChange(audioElement)
      fireEvent.timeUpdate(audioElement)

      await waitFor(() => {
        const waveformSlider = screen.getByRole('slider', { name: /音頻波形時間軸|時間軸|timeline/i })
        expect(waveformSlider).toHaveAttribute('aria-valuemin', '0')
        expect(waveformSlider).toHaveAttribute('aria-valuemax', '100')
        expect(waveformSlider).toHaveAttribute('aria-valuenow', '30')
      })
    })

    it('時間軸應該支援鍵盤導航', () => {
      render(
        <StoryAudioPlayer
          audioUrl={mockAudioUrl}
          characterName={mockCharacterName}
          characterKey={mockCharacterKey}
        />
      )

      const timeline = screen.getByRole('slider', { name: /時間軸|timeline/i })
      expect(timeline).toHaveAttribute('tabIndex', '0')
    })
  })
})
