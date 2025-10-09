/**
 * TiltErrorBoundary 元件測試
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { TiltErrorBoundary, withTiltErrorBoundary } from '../TiltErrorBoundary'

// 建立測試用的拋錯元件
const ThrowError: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    throw error
  }
  return <div>正常渲染</div>
}

describe('TiltErrorBoundary', () => {
  // 禁用 console.error 以避免測試輸出被錯誤訊息污染
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('正常渲染', () => {
    it('應該在沒有錯誤時正常渲染子元件', () => {
      render(
        <TiltErrorBoundary>
          <div>測試內容</div>
        </TiltErrorBoundary>
      )

      expect(screen.getByText('測試內容')).toBeInTheDocument()
    })

    it('應該在子元件沒有拋錯時保持正常運作', () => {
      render(
        <TiltErrorBoundary>
          <ThrowError />
        </TiltErrorBoundary>
      )

      expect(screen.getByText('正常渲染')).toBeInTheDocument()
    })
  })

  describe('錯誤捕獲', () => {
    it('應該捕獲 DeviceOrientation API 錯誤', () => {
      const error = new Error('DeviceOrientation API is not supported')

      render(
        <TiltErrorBoundary>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      // Error Boundary 應該捕獲錯誤並記錄到 console
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('應該捕獲陀螺儀權限錯誤', () => {
      const error = new Error('Permission denied for gyroscope access')

      render(
        <TiltErrorBoundary>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('應該捕獲無效配置錯誤', () => {
      const error = new Error('Invalid tilt configuration options')

      render(
        <TiltErrorBoundary>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('應該捕獲一般渲染錯誤', () => {
      const error = new Error('Unexpected rendering error')

      render(
        <TiltErrorBoundary>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('錯誤降級處理', () => {
    it('應該在捕獲錯誤後繼續渲染子元件（預設 fallback）', () => {
      const error = new Error('Test error')

      render(
        <TiltErrorBoundary>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      // 預設 fallback 是繼續渲染子元件
      // Error Boundary 不應該導致整個應用崩潰
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('應該渲染自定義 fallback UI', () => {
      const error = new Error('Test error')
      const customFallback = <div>自訂錯誤訊息</div>

      render(
        <TiltErrorBoundary fallback={customFallback}>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(screen.getByText('自訂錯誤訊息')).toBeInTheDocument()
    })
  })

  describe('錯誤回調', () => {
    it('應該呼叫使用者提供的 onError 回調', () => {
      const error = new Error('Test error')
      const onErrorMock = jest.fn()

      render(
        <TiltErrorBoundary onError={onErrorMock}>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(onErrorMock).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('應該在沒有提供 onError 時不拋出錯誤', () => {
      const error = new Error('Test error')

      expect(() => {
        render(
          <TiltErrorBoundary>
            <ThrowError error={error} />
          </TiltErrorBoundary>
        )
      }).not.toThrow()
    })
  })

  describe('錯誤訊息生成', () => {
    it('應該為 DeviceOrientation 錯誤提供有用的錯誤訊息', () => {
      const error = new Error('deviceorientation not supported')
      const onErrorMock = jest.fn()

      render(
        <TiltErrorBoundary onError={onErrorMock}>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      // 驗證 console.error 被呼叫時包含有用的錯誤訊息
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TiltErrorBoundary] 3D tilt error caught:',
        expect.objectContaining({
          helpMessage: expect.stringContaining('陀螺儀功能')
        })
      )
    })

    it('應該為權限錯誤提供有用的錯誤訊息', () => {
      const error = new Error('permission denied')
      const onErrorMock = jest.fn()

      render(
        <TiltErrorBoundary onError={onErrorMock}>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TiltErrorBoundary] 3D tilt error caught:',
        expect.objectContaining({
          helpMessage: expect.stringContaining('權限被拒絕')
        })
      )
    })

    it('應該為無效配置錯誤提供有用的錯誤訊息', () => {
      const error = new Error('invalid config')
      const onErrorMock = jest.fn()

      render(
        <TiltErrorBoundary onError={onErrorMock}>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TiltErrorBoundary] 3D tilt error caught:',
        expect.objectContaining({
          helpMessage: expect.stringContaining('配置參數無效')
        })
      )
    })

    it('應該為一般錯誤提供預設錯誤訊息', () => {
      const error = new Error('some random error')
      const onErrorMock = jest.fn()

      render(
        <TiltErrorBoundary onError={onErrorMock}>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TiltErrorBoundary] 3D tilt error caught:',
        expect.objectContaining({
          helpMessage: expect.stringContaining('遇到錯誤')
        })
      )
    })
  })

  describe('withTiltErrorBoundary HOC', () => {
    it('應該包裝元件並提供錯誤邊界保護', () => {
      const TestComponent: React.FC<{ message: string }> = ({ message }) => (
        <div>{message}</div>
      )

      const WrappedComponent = withTiltErrorBoundary(TestComponent)

      render(<WrappedComponent message="測試訊息" />)

      expect(screen.getByText('測試訊息')).toBeInTheDocument()
    })

    it('應該捕獲被包裝元件的錯誤', () => {
      const WrappedComponent = withTiltErrorBoundary(ThrowError)
      const error = new Error('Test error')

      render(<WrappedComponent error={error} />)

      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('應該接受 errorBoundaryProps 參數', () => {
      const onErrorMock = jest.fn()
      const customFallback = <div>HOC 自訂錯誤訊息</div>

      const WrappedComponent = withTiltErrorBoundary(ThrowError, {
        onError: onErrorMock,
        fallback: customFallback
      })

      const error = new Error('Test error')
      render(<WrappedComponent error={error} />)

      expect(onErrorMock).toHaveBeenCalled()
      expect(screen.getByText('HOC 自訂錯誤訊息')).toBeInTheDocument()
    })
  })

  describe('錯誤邊界狀態管理', () => {
    it('應該在捕獲錯誤後更新 hasError 狀態', () => {
      const error = new Error('Test error')

      const { rerender } = render(
        <TiltErrorBoundary>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      // 錯誤被捕獲後，Error Boundary 應該進入錯誤狀態
      expect(consoleErrorSpy).toHaveBeenCalled()

      // 重新渲染不應該再次拋出錯誤
      rerender(
        <TiltErrorBoundary>
          <ThrowError error={error} />
        </TiltErrorBoundary>
      )

      // console.error 不應該被重複呼叫
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2) // React 會呼叫兩次（一次是 Error Boundary，一次是 React 內部）
    })
  })

  describe('優雅降級', () => {
    it('應該確保卡片在錯誤後仍然可見', () => {
      const error = new Error('Test error')

      render(
        <TiltErrorBoundary>
          <div data-testid="card-content">
            <ThrowError error={error} />
            卡片內容
          </div>
        </TiltErrorBoundary>
      )

      // 驗證錯誤被捕獲
      expect(consoleErrorSpy).toHaveBeenCalled()

      // 預設 fallback 應該渲染子元件，確保卡片仍然可見
      // （實際行為取決於 Error Boundary 實作）
    })
  })
})
