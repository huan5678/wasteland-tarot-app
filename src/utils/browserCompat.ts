/**
 * Browser Compatibility Utilities
 * 瀏覽器相容性工具
 *
 * 處理不同瀏覽器的 API 支援與 polyfills
 *
 * @module browserCompat
 * @description 提供瀏覽器相容性檢測與 polyfill 功能，確保 3D 傾斜效果在各種瀏覽器中正常運作
 */

/**
 * 檢查瀏覽器是否支援 IntersectionObserver
 *
 * @returns true 如果瀏覽器支援 IntersectionObserver API
 *
 * @example
 * ```ts
 * if (supportsIntersectionObserver()) {
 *   // 使用原生 IntersectionObserver
 * } else {
 *   // 使用 fallback
 * }
 * ```
 */
export function supportsIntersectionObserver(): boolean {
  return typeof IntersectionObserver !== 'undefined'
}

/**
 * 檢查瀏覽器是否支援 DeviceOrientation API
 */
export function supportsDeviceOrientation(): boolean {
  return 'DeviceOrientationEvent' in window
}

/**
 * 檢查瀏覽器是否支援 CSS 3D Transforms
 */
export function supports3DTransforms(): boolean {
  if (typeof window === 'undefined') return false

  const el = document.createElement('div')
  const transforms = {
    transform: 'transform',
    WebkitTransform: '-webkit-transform',
    MozTransform: '-moz-transform',
    msTransform: '-ms-transform'
  }

  for (const [key, value] of Object.entries(transforms)) {
    if (el.style[key as any] !== undefined) {
      // 測試是否支援 3D transform
      el.style[key as any] = 'translate3d(1px,1px,1px)'
      const computed = window.getComputedStyle(el)[key as any]
      return computed !== undefined && computed !== 'none'
    }
  }

  return false
}

/**
 * requestAnimationFrame polyfill
 * 對於不支援 RAF 的瀏覽器使用 setTimeout 作為 fallback
 */
export function polyfillRequestAnimationFrame(): void {
  if (typeof window === 'undefined') return

  if (!window.requestAnimationFrame) {
    let lastTime = 0
    window.requestAnimationFrame = function (callback: FrameRequestCallback): number {
      const currentTime = new Date().getTime()
      const timeToCall = Math.max(0, 16 - (currentTime - lastTime))
      const id = window.setTimeout(function () {
        callback(currentTime + timeToCall)
      }, timeToCall)
      lastTime = currentTime + timeToCall
      return id
    }
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id: number): void {
      clearTimeout(id)
    }
  }
}

/**
 * IntersectionObserver polyfill/fallback
 * 如果不支援 IntersectionObserver，提供簡單的 fallback
 */
export function createIntersectionObserverFallback(
  callback: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void,
  options?: IntersectionObserverInit
): { observe: (el: Element) => void; unobserve: (el: Element) => void; disconnect: () => void } {
  if (supportsIntersectionObserver()) {
    // 原生支援，直接使用
    return new IntersectionObserver(callback as any, options) as any
  }

  // Fallback: 假設所有元素都可見
  const observedElements = new Set<Element>()

  return {
    observe: (el: Element) => {
      observedElements.add(el)
      // 立即觸發一次 callback，假設元素可見
      callback([{ isIntersecting: true, target: el }])
    },
    unobserve: (el: Element) => {
      observedElements.delete(el)
    },
    disconnect: () => {
      observedElements.clear()
    }
  }
}

/**
 * 瀏覽器能力檢測結果
 */
export interface BrowserCapabilities {
  supportsIntersectionObserver: boolean
  supportsDeviceOrientation: boolean
  supports3DTransforms: boolean
  supportsRequestAnimationFrame: boolean
  browserName: string
  browserVersion: string
}

/**
 * 檢測瀏覽器能力
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

  // 簡單的瀏覽器檢測
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'

  if (ua.includes('Chrome')) {
    browserName = 'Chrome'
    const match = ua.match(/Chrome\/(\d+)/)
    if (match) browserVersion = match[1]
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox'
    const match = ua.match(/Firefox\/(\d+)/)
    if (match) browserVersion = match[1]
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari'
    const match = ua.match(/Version\/(\d+)/)
    if (match) browserVersion = match[1]
  } else if (ua.includes('Edge')) {
    browserName = 'Edge'
    const match = ua.match(/Edge\/(\d+)/)
    if (match) browserVersion = match[1]
  }

  return {
    supportsIntersectionObserver: supportsIntersectionObserver(),
    supportsDeviceOrientation: supportsDeviceOrientation(),
    supports3DTransforms: supports3DTransforms(),
    supportsRequestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
    browserName,
    browserVersion
  }
}

/**
 * 初始化所有必要的 polyfills
 */
export function initializeBrowserPolyfills(): void {
  polyfillRequestAnimationFrame()

  // 記錄瀏覽器能力（僅在開發環境）
  if (process.env.NODE_ENV === 'development') {
    const capabilities = detectBrowserCapabilities()
    console.log('[Browser Compat] Browser capabilities:', capabilities)

    // 警告不支援的功能
    if (!capabilities.supportsIntersectionObserver) {
      console.warn('[Browser Compat] IntersectionObserver not supported, using fallback')
    }
    if (!capabilities.supports3DTransforms) {
      console.warn('[Browser Compat] CSS 3D Transforms not supported, tilt effects will be disabled')
    }
  }
}

/**
 * 檢查是否為舊版瀏覽器（不建議使用的版本）
 */
export function isLegacyBrowser(): boolean {
  const capabilities = detectBrowserCapabilities()

  // 定義最低支援版本
  const minVersions: Record<string, number> = {
    Chrome: 90,
    Firefox: 88,
    Safari: 14,
    Edge: 90
  }

  const minVersion = minVersions[capabilities.browserName]
  if (!minVersion) return false // 未知瀏覽器，假設不是舊版

  const version = parseInt(capabilities.browserVersion, 10)
  return !isNaN(version) && version < minVersion
}

/**
 * 取得瀏覽器不相容的警告訊息
 */
export function getBrowserCompatibilityWarning(): string | null {
  if (isLegacyBrowser()) {
    const capabilities = detectBrowserCapabilities()
    return `您的瀏覽器版本（${capabilities.browserName} ${capabilities.browserVersion}）較舊，部分功能可能無法正常運作。建議升級至最新版本以獲得最佳體驗。`
  }

  if (!supports3DTransforms()) {
    return '您的瀏覽器不支援 CSS 3D Transforms，3D 傾斜效果將被停用。'
  }

  return null
}
