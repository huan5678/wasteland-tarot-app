/**
 * TiltErrorBoundary - 3D 傾斜效果錯誤邊界元件
 *
 * 捕獲 use3DTilt hook 或 TiltVisualEffects 元件的錯誤，提供優雅的降級處理
 */

'use client'

import React from 'react'

/**
 * TiltErrorBoundary Props 介面
 */
export interface TiltErrorBoundaryProps {
  /**
   * 子元件
   */
  children: React.ReactNode

  /**
   * 自定義錯誤降級元件（可選）
   */
  fallback?: React.ReactNode

  /**
   * 錯誤回調函式（可選）
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * TiltErrorBoundary State 介面
 */
interface TiltErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * TiltErrorBoundary - 3D 傾斜效果錯誤邊界元件
 *
 * 捕獲並處理以下常見錯誤：
 * - DeviceOrientation API 不支援
 * - 陀螺儀權限被拒絕
 * - 無效的配置參數
 * - 渲染過程中的錯誤
 *
 * @example
 * ```tsx
 * <TiltErrorBoundary onError={(error) => console.error(error)}>
 *   <TarotCard enable3DTilt={true} />
 * </TiltErrorBoundary>
 * ```
 */
export class TiltErrorBoundary extends React.Component<
  TiltErrorBoundaryProps,
  TiltErrorBoundaryState
> {
  constructor(props: TiltErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  /**
   * 捕獲錯誤並更新 state
   */
  static getDerivedStateFromError(error: Error): TiltErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  /**
   * 記錄錯誤詳細資訊並呼叫錯誤回調
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 分析錯誤類型並提供有用的錯誤訊息
    const errorMessage = this.getHelpfulErrorMessage(error)

    console.error('[TiltErrorBoundary] 3D tilt error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      helpMessage: errorMessage
    })

    // 呼叫使用者提供的錯誤回調
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  /**
   * 根據錯誤類型提供有用的錯誤訊息
   */
  private getHelpfulErrorMessage(error: Error): string {
    const errorMessage = error.message.toLowerCase()

    // DeviceOrientation API 不支援
    if (
      errorMessage.includes('deviceorientation') ||
      errorMessage.includes('gyroscope') ||
      errorMessage.includes('orientation')
    ) {
      return '您的裝置或瀏覽器不支援陀螺儀功能。3D 傾斜效果將被停用，但不影響其他功能。'
    }

    // 權限被拒絕
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('denied') ||
      errorMessage.includes('not allowed')
    ) {
      return '陀螺儀權限被拒絕。請至裝置設定中允許「動作與方向」存取權限，或使用桌面版本體驗滑鼠追蹤效果。'
    }

    // 無效配置
    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('config') ||
      errorMessage.includes('option')
    ) {
      return '3D 傾斜效果配置參數無效。已使用預設設定繼續渲染。'
    }

    // 一般錯誤
    return '3D 傾斜效果遇到錯誤，已自動停用。其他功能不受影響。'
  }

  /**
   * 重置錯誤狀態（可用於重試機制）
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // 如果使用者提供了自定義 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 預設降級：渲染子元件但不套用 3D 傾斜效果
      // 這樣可以確保卡片仍然可見和可互動
      return this.props.children
    }

    return this.props.children
  }
}

/**
 * withTiltErrorBoundary HOC - 為元件包裝 TiltErrorBoundary
 *
 * @example
 * ```tsx
 * export default withTiltErrorBoundary(TarotCard)
 * ```
 */
export function withTiltErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<TiltErrorBoundaryProps, 'children'>
) {
  return function WithTiltErrorBoundary(props: P) {
    return (
      <TiltErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </TiltErrorBoundary>
    )
  }
}
