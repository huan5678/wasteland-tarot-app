/**
 * 3D 傾斜效果類型定義
 *
 * 此檔案包含所有 3D 傾斜效果相關的 TypeScript 介面與類型定義
 */

/**
 * 3D 傾斜狀態
 */
export interface TiltState {
  /** X 軸旋轉角度（度） */
  rotateX: number

  /** Y 軸旋轉角度（度） */
  rotateY: number

  /** 是否正在追蹤輸入（滑鼠或陀螺儀） */
  isActive: boolean

  /** 是否當前處於傾斜狀態 */
  isTilted: boolean

  /** 傾斜來源 */
  source: 'mouse' | 'gyroscope' | null
}

/**
 * 陀螺儀權限狀態
 */
export type GyroscopePermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported'

/**
 * 裝置能力偵測結果
 */
export interface DeviceCapabilities {
  /** 是否為觸控裝置 */
  isTouchDevice: boolean

  /** 使用者是否偏好減少動畫 */
  prefersReducedMotion: boolean

  /** 螢幕尺寸類型 */
  screenSize: 'mobile' | 'tablet' | 'desktop'

  /** 是否為 iOS */
  isIOS: boolean

  /** CPU 核心數 */
  hardwareConcurrency: number

  /** 記憶體容量（GB，若支援） */
  deviceMemory?: number
}

/**
 * 3D 傾斜配置（元件 props）
 */
export interface TiltComponentProps {
  /** 是否啟用 3D 傾斜效果（預設: true） */
  enable3DTilt?: boolean

  /** 最大傾斜角度（度），預設 15 */
  tiltMaxAngle?: number

  /** 復原動畫時長（毫秒），預設 400 */
  tiltTransitionDuration?: number

  /** 是否啟用陀螺儀（行動裝置），預設 true */
  enableGyroscope?: boolean

  /** 是否啟用光澤效果，預設 true */
  enableGloss?: boolean

  /** 卡片尺寸（small 會自動減少角度至 60%） */
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
}

/**
 * use3DTilt Hook 選項
 */
export interface Use3DTiltOptions extends TiltComponentProps {
  /** 是否正在進行翻牌動畫（停用傾斜） */
  isFlipping?: boolean

  /** 是否處於 loading 狀態（停用傾斜） */
  loading?: boolean
}

/**
 * use3DTilt Hook 返回值
 */
export interface Use3DTiltReturn {
  /** 綁定至卡片根元素的 ref */
  tiltRef: React.RefObject<HTMLDivElement>

  /** 綁定至卡片根元素的事件處理器 */
  tiltHandlers: {
    onMouseEnter: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseLeave: () => void
  }

  /** 當前的傾斜狀態 */
  tiltState: TiltState

  /** CSS transform string（可直接套用至 style） */
  tiltStyle: React.CSSProperties

  /** 光澤效果的 CSS（gradient overlay） */
  glossStyle: React.CSSProperties

  /** 陀螺儀權限狀態（iOS 13+） */
  gyroscopePermission: {
    status: GyroscopePermissionStatus
    requestPermission: () => Promise<void>
    error: string | null
  }
}

/**
 * useGyroscopePermission Hook 返回值
 */
export interface UseGyroscopePermissionReturn {
  /** 權限狀態 */
  status: GyroscopePermissionStatus

  /** 請求權限函式（必須在 user gesture 中呼叫） */
  requestPermission: () => Promise<void>

  /** 錯誤訊息 */
  error: string | null
}

/**
 * useIntersectionTilt Hook 返回值
 */
export interface UseIntersectionTiltReturn {
  /** 元素是否在可視區域內 */
  isIntersecting: boolean

  /** Observer ref（內部使用） */
  observerRef: React.RefObject<HTMLDivElement>
}

/**
 * 3D 傾斜全域配置
 */
export interface TiltConfig {
  /** 全域預設最大傾斜角度 */
  defaultMaxAngle: number

  /** 是否全域啟用陀螺儀 */
  enableGyroscopeGlobal: boolean

  /** 是否全域啟用光澤效果 */
  enableGlossGlobal: boolean

  /** 是否為低效能裝置（自動偵測） */
  isLowPerformanceDevice: boolean

  /** 效能降級設定 */
  performanceDegradation: {
    /** 減少傾斜角度至 60% */
    reduceAngle: boolean
    /** 停用光澤效果 */
    disableGloss: boolean
    /** 停用陀螺儀 */
    disableGyroscope: boolean
  }
}

/**
 * TiltVisualEffects 元件 Props
 */
export interface TiltVisualEffectsProps {
  /** 傾斜狀態（來自 use3DTilt） */
  tiltState: TiltState

  /** 是否啟用光澤效果 */
  enableGloss?: boolean

  /** 自訂類別 */
  className?: string
}

/**
 * DeviceOrientationEvent 類型擴充（iOS 13+ 權限 API）
 */
export interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>
}
