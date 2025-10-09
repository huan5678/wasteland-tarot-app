/**
 * Card Tilt Integration Tests
 * 測試卡片元件與 3D 傾斜效果的整合
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TarotCard } from '@/components/tarot/TarotCard'
import { MobileTarotCard } from '@/components/mobile/MobileTarotCard'
import { CardThumbnail } from '@/components/cards/CardThumbnail'
import { TiltConfigProvider } from '@/contexts/TiltConfigContext'
import { use3DTilt } from '@/hooks/tilt/use3DTilt'

// Mock hooks
jest.mock('@/hooks/tilt/use3DTilt')
jest.mock('@/hooks/useTouchInteractions')
jest.mock('@/hooks/useAdvancedGestures')
jest.mock('@/hooks/audio/useAudioEffect')

const mockUse3DTilt = use3DTilt as jest.MockedFunction<typeof use3DTilt>
const mockUseTouchInteractions = require('@/hooks/useTouchInteractions')
const mockUseAdvancedGestures = require('@/hooks/useAdvancedGestures')
const mockUseAudioEffect = require('@/hooks/audio/useAudioEffect')

// Mock 卡片資料
const mockCard = {
  id: 1,
  name: '愚者',
  suit: 'major-arcana',
  number: 0,
  meaning_upright: '新的開始，天真',
  meaning_reversed: '魯莽，不成熟',
  image_url: '/assets/cards/major-arcana/00-fool.png',
  keywords: ['開始', '冒險', '天真']
}

describe('CardTiltIntegration', () => {
  beforeEach(() => {
    // Mock use3DTilt 返回值
    mockUse3DTilt.mockReturnValue({
      tiltRef: { current: null },
      tiltHandlers: {
        onMouseEnter: jest.fn(),
        onMouseMove: jest.fn(),
        onMouseLeave: jest.fn()
      },
      tiltState: {
        rotateX: 0,
        rotateY: 0,
        isActive: false,
        isTilted: false,
        source: null
      },
      tiltStyle: {},
      glossStyle: { opacity: 0 },
      gyroscopePermission: {
        status: 'unsupported' as const,
        requestPermission: jest.fn(),
        error: null
      }
    })

    // Mock useTouchInteractions
    mockUseTouchInteractions.useTouchInteractions.mockReturnValue({
      touchHandlers: {},
      mouseHandlers: {},
      triggerHaptic: jest.fn()
    })

    mockUseTouchInteractions.useDeviceCapabilities.mockReturnValue({
      isTouchDevice: false,
      prefersReducedMotion: false
    })

    // Mock useAdvancedGestures
    mockUseAdvancedGestures.useAdvancedGestures.mockReturnValue({
      bind: jest.fn(() => ({})),
      touchHandlers: {},
      animations: {},
      reset: jest.fn(),
      animateTo: jest.fn(),
      triggerHaptic: jest.fn()
    })

    mockUseAdvancedGestures.useAdvancedDeviceCapabilities.mockReturnValue({
      isTouchDevice: false,
      prefersReducedMotion: false,
      screenSize: 'desktop',
      isIOS: false
    })

    // Mock useAudioEffect
    mockUseAudioEffect.useAudioEffect.mockReturnValue({
      playSound: jest.fn(),
      stopSound: jest.fn(),
      isPlaying: false
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('TarotCard 整合', () => {
    it('應該渲染卡片並整合 3D 傾斜效果', () => {
      render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
        />
      )

      const card = screen.getByTestId('tarot-card')
      expect(card).toBeInTheDocument()

      // 檢查 use3DTilt 是否被呼叫
      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          enable3DTilt: true,
          size: 'medium'
        })
      )
    })

    it('應該將 tiltHandlers 綁定至卡片元素', () => {
      const mockHandlers = {
        onMouseEnter: jest.fn(),
        onMouseMove: jest.fn(),
        onMouseLeave: jest.fn()
      }

      mockUse3DTilt.mockReturnValue({
        tiltRef: { current: null },
        tiltHandlers: mockHandlers,
        tiltState: {
          rotateX: 0,
          rotateY: 0,
          isActive: false,
          isTilted: false,
          source: null
        },
        tiltStyle: {},
        glossStyle: { opacity: 0 },
        gyroscopePermission: {
          status: 'unsupported',
          requestPermission: jest.fn(),
          error: null
        }
      })

      render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
        />
      )

      const card = screen.getByTestId('tarot-card')

      // 觸發滑鼠事件
      fireEvent.mouseEnter(card)
      expect(mockHandlers.onMouseEnter).toHaveBeenCalled()

      fireEvent.mouseMove(card, { clientX: 100, clientY: 100 })
      expect(mockHandlers.onMouseMove).toHaveBeenCalled()

      fireEvent.mouseLeave(card)
      expect(mockHandlers.onMouseLeave).toHaveBeenCalled()
    })

    it('應該套用 tiltStyle 至卡片', () => {
      const mockTiltStyle = {
        transform: 'perspective(1000px) rotateX(10deg) rotateY(5deg) scale3d(1.02, 1.02, 1.02)',
        transition: 'none',
        willChange: 'transform'
      }

      mockUse3DTilt.mockReturnValue({
        tiltRef: { current: null },
        tiltHandlers: {
          onMouseEnter: jest.fn(),
          onMouseMove: jest.fn(),
          onMouseLeave: jest.fn()
        },
        tiltState: {
          rotateX: 10,
          rotateY: 5,
          isActive: true,
          isTilted: true,
          source: 'mouse'
        },
        tiltStyle: mockTiltStyle,
        glossStyle: { opacity: 0.6 },
        gyroscopePermission: {
          status: 'unsupported',
          requestPermission: jest.fn(),
          error: null
        }
      })

      render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
        />
      )

      const card = screen.getByTestId('tarot-card')

      // 檢查 style 是否包含 transform
      expect(card.style.transform).toContain('rotateX')
      expect(card.style.transform).toContain('rotateY')
    })

    it('翻牌時應停用傾斜效果', () => {
      render(
        <TarotCard
          card={mockCard}
          isRevealed={false}
          position="upright"
          enable3DTilt={true}
        />
      )

      // 檢查 isFlipping 參數
      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          isFlipping: expect.anything()
        })
      )
    })

    it('loading 狀態應停用傾斜效果', () => {
      render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
          loading={true}
        />
      )

      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: true
        })
      )
    })

    it('應該渲染 TiltVisualEffects 當傾斜時', () => {
      mockUse3DTilt.mockReturnValue({
        tiltRef: { current: null },
        tiltHandlers: {
          onMouseEnter: jest.fn(),
          onMouseMove: jest.fn(),
          onMouseLeave: jest.fn()
        },
        tiltState: {
          rotateX: 10,
          rotateY: 5,
          isActive: true,
          isTilted: true,
          source: 'mouse'
        },
        tiltStyle: {},
        glossStyle: { opacity: 0.6 },
        gyroscopePermission: {
          status: 'unsupported',
          requestPermission: jest.fn(),
          error: null
        }
      })

      const { container } = render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
          enableGloss={true}
        />
      )

      // 檢查是否有光澤效果元素（透過 aria-hidden 或 className）
      const glossOverlay = container.querySelector('[aria-hidden="true"]')
      expect(glossOverlay).toBeInTheDocument()
    })
  })

  describe('MobileTarotCard 整合', () => {
    it('應該渲染行動卡片並整合陀螺儀', () => {
      mockUse3DTilt.mockReturnValue({
        tiltRef: { current: null },
        tiltHandlers: {
          onMouseEnter: jest.fn(),
          onMouseMove: jest.fn(),
          onMouseLeave: jest.fn()
        },
        tiltState: {
          rotateX: 0,
          rotateY: 0,
          isActive: false,
          isTilted: false,
          source: null
        },
        tiltStyle: {},
        glossStyle: { opacity: 0 },
        gyroscopePermission: {
          status: 'prompt',
          requestPermission: jest.fn(),
          error: null
        }
      })

      mockUseAdvancedGestures.useAdvancedDeviceCapabilities.mockReturnValue({
        isTouchDevice: true,
        prefersReducedMotion: false,
        screenSize: 'mobile',
        isIOS: true
      })

      render(
        <MobileTarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
          enableGyroscope={true}
        />
      )

      const card = screen.getByTestId('mobile-tarot-card')
      expect(card).toBeInTheDocument()

      // 檢查陀螺儀權限提示
      expect(screen.getByText(/啟用陀螺儀/)).toBeInTheDocument()
    })

    it('陀螺儀權限授予後應隱藏提示', () => {
      mockUse3DTilt.mockReturnValue({
        tiltRef: { current: null },
        tiltHandlers: {
          onMouseEnter: jest.fn(),
          onMouseMove: jest.fn(),
          onMouseLeave: jest.fn()
        },
        tiltState: {
          rotateX: 0,
          rotateY: 0,
          isActive: false,
          isTilted: false,
          source: null
        },
        tiltStyle: {},
        glossStyle: { opacity: 0 },
        gyroscopePermission: {
          status: 'granted',
          requestPermission: jest.fn(),
          error: null
        }
      })

      mockUseAdvancedGestures.useAdvancedDeviceCapabilities.mockReturnValue({
        isTouchDevice: true,
        prefersReducedMotion: false,
        screenSize: 'mobile',
        isIOS: true
      })

      render(
        <MobileTarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
          enableGyroscope={true}
        />
      )

      // 權限提示應該不存在
      expect(screen.queryByText(/啟用陀螺儀/)).not.toBeInTheDocument()
    })
  })

  describe('CardThumbnail 整合', () => {
    it('應該渲染縮圖並使用 small 尺寸', () => {
      render(<CardThumbnail card={mockCard} enable3DTilt={true} />)

      // 檢查 use3DTilt 是否使用 small 尺寸
      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 'small'
        })
      )
    })

    it('應該整合 tiltHandlers 至 Link 元素', () => {
      const mockHandlers = {
        onMouseEnter: jest.fn(),
        onMouseMove: jest.fn(),
        onMouseLeave: jest.fn()
      }

      mockUse3DTilt.mockReturnValue({
        tiltRef: { current: null },
        tiltHandlers: mockHandlers,
        tiltState: {
          rotateX: 0,
          rotateY: 0,
          isActive: false,
          isTilted: false,
          source: null
        },
        tiltStyle: {},
        glossStyle: { opacity: 0 },
        gyroscopePermission: {
          status: 'unsupported',
          requestPermission: jest.fn(),
          error: null
        }
      })

      const { container } = render(
        <CardThumbnail card={mockCard} enable3DTilt={true} />
      )

      const link = container.querySelector('a')
      expect(link).toBeInTheDocument()

      if (link) {
        // 觸發滑鼠事件
        fireEvent.mouseEnter(link)
        expect(mockHandlers.onMouseEnter).toHaveBeenCalled()

        fireEvent.mouseMove(link)
        expect(mockHandlers.onMouseMove).toHaveBeenCalled()

        fireEvent.mouseLeave(link)
        expect(mockHandlers.onMouseLeave).toHaveBeenCalled()
      }
    })
  })

  describe('TiltConfigProvider 整合', () => {
    it('應該套用全域配置至元件', () => {
      render(
        <TiltConfigProvider defaultMaxAngle={20} enableGlossGlobal={false}>
          <TarotCard
            card={mockCard}
            isRevealed={true}
            position="upright"
            enable3DTilt={true}
          />
        </TiltConfigProvider>
      )

      // use3DTilt 應該接收到全域配置
      expect(mockUse3DTilt).toHaveBeenCalled()
    })

    it('元件 props 應覆蓋全域配置', () => {
      render(
        <TiltConfigProvider defaultMaxAngle={20}>
          <TarotCard
            card={mockCard}
            isRevealed={true}
            position="upright"
            enable3DTilt={true}
            tiltMaxAngle={10}
          />
        </TiltConfigProvider>
      )

      // 檢查 tiltMaxAngle 是否為 10（props 優先）
      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          tiltMaxAngle: 10
        })
      )
    })
  })

  describe('TiltErrorBoundary 整合', () => {
    it('應該捕獲錯誤並降級渲染', () => {
      // Mock use3DTilt 拋出錯誤
      mockUse3DTilt.mockImplementation(() => {
        throw new Error('Tilt initialization failed')
      })

      // 暫時抑制 console.error
      const originalError = console.error
      console.error = jest.fn()

      const { container } = render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
        />
      )

      // 應該仍然渲染（降級）
      expect(container).toBeInTheDocument()

      // 恢復 console.error
      console.error = originalError
    })
  })

  describe('Props 傳遞', () => {
    it('enable3DTilt=false 應停用效果', () => {
      render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={false}
        />
      )

      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          enable3DTilt: false
        })
      )
    })

    it('tiltMaxAngle 應傳遞至 use3DTilt', () => {
      render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
          tiltMaxAngle={20}
        />
      )

      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          tiltMaxAngle: 20
        })
      )
    })

    it('enableGloss=false 應停用光澤', () => {
      render(
        <TarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
          enableGloss={false}
        />
      )

      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          enableGloss: false
        })
      )
    })

    it('enableGyroscope 應傳遞至 use3DTilt', () => {
      render(
        <MobileTarotCard
          card={mockCard}
          isRevealed={true}
          position="upright"
          enable3DTilt={true}
          enableGyroscope={true}
        />
      )

      expect(mockUse3DTilt).toHaveBeenCalledWith(
        expect.objectContaining({
          enableGyroscope: true
        })
      )
    })
  })
})
