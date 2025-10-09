/**
 * useIntersectionTilt Hook - 可視區域偵測
 *
 * 使用 IntersectionObserver API 偵測元素是否在可視區域內
 * 用於效能優化，僅為可視的卡片啟用傾斜運算
 */

'use client'

import { useEffect, useState, RefObject } from 'react'
import type { UseIntersectionTiltReturn } from '@/types/tilt'

/**
 * 可視區域偵測 Hook
 *
 * @example
 * ```tsx
 * const cardRef = useRef<HTMLDivElement>(null)
 * const { isIntersecting } = useIntersectionTilt(cardRef)
 *
 * if (isIntersecting) {
 *   // 元素在可視區域內，啟用傾斜效果
 * }
 * ```
 *
 * @param ref - 要觀察的元素 ref
 * @param options - IntersectionObserver 選項
 * @returns 包含 isIntersecting 狀態的物件
 */
export function useIntersectionTilt(
  ref: RefObject<HTMLElement>,
  options?: IntersectionObserverInit
): UseIntersectionTiltReturn {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // 檢查瀏覽器是否支援 IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      // 不支援時，預設為可見（fallback）
      setIsIntersecting(true)
      return
    }

    // 建立 IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1, // 當 10% 的元素進入可視區域時觸發
        ...options
      }
    )

    observer.observe(element)

    // 清理函式
    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return {
    isIntersecting,
    observerRef: ref
  }
}
