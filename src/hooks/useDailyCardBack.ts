/**
 * useDailyCardBack Hook
 * 每日隨機卡背選擇功能
 *
 * 功能：
 * - 進入網站時從卡背資料夾隨機選擇一張卡背
 * - 記錄選擇時間到 localStorage
 * - 再次進入時檢查是否換日，若換日則重新隨機選擇
 * - 若未換日則使用已記錄的卡背
 */

import { useState, useEffect } from 'react'

// LocalStorage key
const STORAGE_KEY = 'pip-boy-daily-card-back'

/**
 * 卡背資料介面
 */
interface DailyCardBackData {
  /** 卡背檔案名稱 */
  cardBackFile: string
  /** 記錄日期 (YYYY-MM-DD) */
  date: string
  /** 記錄時間戳 */
  timestamp: number
}

/**
 * Hook 回傳介面
 */
interface UseDailyCardBackReturn {
  /** 當前卡背圖片路徑 */
  cardBackPath: string
  /** 是否正在載入 */
  isLoading: boolean
  /** 手動重新隨機選擇卡背 */
  refreshCardBack: () => void
}

/**
 * 取得今天的日期字串 (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * 檢查是否為同一天
 */
function isSameDay(dateString: string): boolean {
  return dateString === getTodayDateString()
}

/**
 * 從 localStorage 讀取卡背資料
 */
function loadCardBackData(): DailyCardBackData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    return JSON.parse(stored) as DailyCardBackData
  } catch (err) {
    console.error('[useDailyCardBack] Failed to load card back data:', err)
    return null
  }
}

/**
 * 儲存卡背資料到 localStorage
 */
function saveCardBackData(data: DailyCardBackData): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('[useDailyCardBack] Failed to save card back data:', err)
  }
}

/**
 * 從可用卡背列表中隨機選擇一張
 */
function selectRandomCardBack(availableCardBacks: string[]): string {
  if (availableCardBacks.length === 0) {
    return 'default.png' // fallback
  }

  const randomIndex = Math.floor(Math.random() * availableCardBacks.length)
  return availableCardBacks[randomIndex]
}

/**
 * 每日隨機卡背 Hook
 *
 * @param availableCardBacks - 可用的卡背檔案名稱列表
 * @param basePath - 卡背圖片的基礎路徑 (預設: '/assets/cards/card-backs')
 * @returns 卡背資訊和控制函數
 *
 * @example
 * ```tsx
 * const { cardBackPath, isLoading, refreshCardBack } = useDailyCardBack([
 *   'vault-tec-classic.png',
 *   'nuka-cola-quantum.png',
 *   'brotherhood-steel.png',
 * ])
 *
 * return (
 *   <div>
 *     {!isLoading && (
 *       <img src={cardBackPath} alt="Card Back" />
 *     )}
 *   </div>
 * )
 * ```
 */
export function useDailyCardBack(
  availableCardBacks: string[],
  basePath: string = '/assets/cards/card-backs'
): UseDailyCardBackReturn {
  const [cardBackFile, setCardBackFile] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 初始化或更新卡背
   */
  const initializeCardBack = (forceRefresh: boolean = false) => {
    setIsLoading(true)

    // 讀取已儲存的資料
    const savedData = loadCardBackData()

    // 判斷是否需要選擇新卡背
    const needsNewSelection =
      forceRefresh ||
      !savedData ||
      !isSameDay(savedData.date) ||
      !availableCardBacks.includes(savedData.cardBackFile)

    if (needsNewSelection) {
      // 選擇新卡背
      const newCardBack = selectRandomCardBack(availableCardBacks)
      const newData: DailyCardBackData = {
        cardBackFile: newCardBack,
        date: getTodayDateString(),
        timestamp: Date.now(),
      }

      // 儲存到 localStorage
      saveCardBackData(newData)
      setCardBackFile(newCardBack)

      console.log('[useDailyCardBack] Selected new card back:', newCardBack)
    } else {
      // 使用已儲存的卡背
      setCardBackFile(savedData.cardBackFile)
      console.log('[useDailyCardBack] Using saved card back:', savedData.cardBackFile)
    }

    setIsLoading(false)
  }

  /**
   * 手動重新隨機選擇卡背
   */
  const refreshCardBack = () => {
    initializeCardBack(true)
  }

  // 初始化
  useEffect(() => {
    initializeCardBack()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 建立完整路徑
  const cardBackPath = cardBackFile
    ? `${basePath}/${cardBackFile}`
    : `${basePath}/default.png`

  return {
    cardBackPath,
    isLoading,
    refreshCardBack,
  }
}

/**
 * 取得儲存的卡背資料 (用於調試)
 */
export function getDailyCardBackData(): DailyCardBackData | null {
  return loadCardBackData()
}

/**
 * 清除儲存的卡背資料 (用於調試)
 */
export function clearDailyCardBackData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  console.log('[useDailyCardBack] Cleared card back data')
}
