import { SpreadTemplate } from './spreadTemplatesStore'
import { useEffect, useState } from 'react'

// Hook for responsive layout detection
export function useResponsiveLayout() {
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return deviceType
}

export interface SpreadPosition {
  id: string
  label: string
  x: number
  y: number
  rotation?: number
  scale?: number
  zIndex?: number
  animationDelay?: number
}

export interface ResponsiveLayout {
  desktop: SpreadPosition[]
  tablet: SpreadPosition[]
  mobile: SpreadPosition[]
}

export interface LayoutOptions {
  containerWidth?: number
  containerHeight?: number
  cardAspectRatio?: number
  minCardSpacing?: number
  maxCardsPerRow?: number
}

// Enhanced layout calculator
export function calculateOptimalSpacing(
  cardCount: number,
  containerWidth: number,
  containerHeight: number,
  cardWidth: number,
  minSpacing: number = 16
) {
  const totalCardWidth = cardCount * cardWidth
  const totalSpacing = (cardCount - 1) * minSpacing
  const requiredWidth = totalCardWidth + totalSpacing

  if (requiredWidth <= containerWidth) {
    return {
      spacing: minSpacing,
      scale: 1,
      arrangement: 'horizontal' as const
    }
  }

  // Try reducing scale first
  const maxScale = containerWidth / requiredWidth
  if (maxScale >= 0.7) {
    return {
      spacing: minSpacing * maxScale,
      scale: maxScale,
      arrangement: 'horizontal' as const
    }
  }

  // Switch to grid layout
  const cardsPerRow = Math.floor(Math.sqrt(cardCount))
  const rows = Math.ceil(cardCount / cardsPerRow)
  return {
    spacing: minSpacing,
    scale: 1,
    arrangement: 'grid' as const,
    cardsPerRow,
    rows
  }
}

// Generate responsive positions for grid layouts
export function generateResponsivePositions(
  positions: SpreadPosition[],
  options: LayoutOptions = {}
): ResponsiveLayout {
  const {
    containerWidth = 1200,
    containerHeight = 800,
    cardAspectRatio = 0.67,
    minCardSpacing = 16
  } = options

  const cardWidth = 128 // medium size
  const cardHeight = cardWidth / cardAspectRatio

  // Desktop layout (original positions)
  const desktop = positions

  // Tablet layout (more compact)
  const tablet = positions.map((pos, index) => ({
    ...pos,
    scale: 0.85,
    animationDelay: index * 100
  }))

  // Mobile layout (single column or grid)
  let mobile: SpreadPosition[]
  if (positions.length <= 3) {
    // Single column for small counts
    mobile = positions.map((pos, index) => ({
      ...pos,
      x: 0.5,
      y: 0.2 + (index * 0.25),
      scale: 0.75,
      animationDelay: index * 150
    }))
  } else {
    // Grid layout for larger counts
    const cardsPerRow = Math.min(3, Math.ceil(Math.sqrt(positions.length)))
    const rows = Math.ceil(positions.length / cardsPerRow)

    mobile = positions.map((pos, index) => {
      const row = Math.floor(index / cardsPerRow)
      const col = index % cardsPerRow
      const totalCols = Math.min(cardsPerRow, positions.length - row * cardsPerRow)

      return {
        ...pos,
        x: (col + 0.5) / totalCols * 0.8 + 0.1,
        y: 0.15 + (row / (rows - 1 || 1)) * 0.7,
        scale: 0.65,
        animationDelay: index * 120
      }
    })
  }

  return { desktop, tablet, mobile }
}

// Basic predefined layouts (normalized coordinates 0..1)
// Position meanings for each spread type
export const spreadPositionMeanings: Record<string, Array<{ name: string; meaning: string }>> = {
  single_wasteland: [
    { name: '核心', meaning: '今日的生存建議與核心指引' }
  ],
  vault_tec_spread: [
    { name: '過去', meaning: '過去的影響與根源' },
    { name: '現在', meaning: '當前的情況與挑戰' },
    { name: '未來', meaning: '未來的發展與可能性' }
  ],
  wasteland_survival: [
    { name: '自己', meaning: '你在這個情境中的位置' },
    { name: '威脅', meaning: '面臨的挑戰與危機' },
    { name: '資源', meaning: '可用的工具與機會' },
    { name: '同盟', meaning: '支持與協助' },
    { name: '結果', meaning: '最終的發展方向' }
  ],
  brotherhood_council: [
    { name: '戰略', meaning: '整體策略方向' },
    { name: '科技', meaning: '知識與技術面向' },
    { name: '情報', meaning: '資訊與洞察' },
    { name: '資源', meaning: '可用資源狀況' },
    { name: '核心', meaning: '核心議題與焦點' },
    { name: '防禦', meaning: '保護與防範措施' },
    { name: '結論', meaning: '最終建議與方向' }
  ],
  raider_chaos: [
    { name: '混亂', meaning: '不確定與變數' },
    { name: '機會', meaning: '可能的突破口' },
    { name: '生存', meaning: '生存的關鍵要素' },
    { name: '萬能牌', meaning: '完全未知的因素' }
  ],
  ncr_strategic: [
    { name: '形勢', meaning: '當前局勢分析' },
    { name: '民意', meaning: '外部觀點與反饋' },
    { name: '資源', meaning: '可動用的力量' },
    { name: '戰略', meaning: '行動方案' },
    { name: '長期', meaning: '長遠影響' },
    { name: '共和', meaning: '共同利益與結果' }
  ],
  // Aliases
  single_wasteland_reading: [
    { name: '核心', meaning: '今日的生存建議與核心指引' }
  ],
  raider_chaos_spread: [
    { name: '混亂', meaning: '不確定與變數' },
    { name: '機會', meaning: '可能的突破口' },
    { name: '生存', meaning: '生存的關鍵要素' },
    { name: '萬能牌', meaning: '完全未知的因素' }
  ],
  ncr_strategic_spread: [
    { name: '形勢', meaning: '當前局勢分析' },
    { name: '民意', meaning: '外部觀點與反饋' },
    { name: '資源', meaning: '可動用的力量' },
    { name: '戰略', meaning: '行動方案' },
    { name: '長期', meaning: '長遠影響' },
    { name: '共和', meaning: '共同利益與結果' }
  ],
  wasteland_survival_spread: [
    { name: '自己', meaning: '你在這個情境中的位置' },
    { name: '威脅', meaning: '面臨的挑戰與危機' },
    { name: '資源', meaning: '可用的工具與機會' },
    { name: '同盟', meaning: '支持與協助' },
    { name: '結果', meaning: '最終的發展方向' }
  ],
  brotherhood_council_spread: [
    { name: '戰略', meaning: '整體策略方向' },
    { name: '科技', meaning: '知識與技術面向' },
    { name: '情報', meaning: '資訊與洞察' },
    { name: '資源', meaning: '可用資源狀況' },
    { name: '核心', meaning: '核心議題與焦點' },
    { name: '防禦', meaning: '保護與防範措施' },
    { name: '結論', meaning: '最終建議與方向' }
  ],
  celtic_cross: [
    { name: '現況', meaning: '當前情況' },
    { name: '挑戰', meaning: '面臨的阻礙' },
    { name: '過去', meaning: '過往影響' },
    { name: '未來', meaning: '即將發生' },
    { name: '顯意識', meaning: '意識層面' },
    { name: '潛意識', meaning: '潛在因素' },
    { name: '自我', meaning: '自我認知' },
    { name: '環境', meaning: '外部環境' },
    { name: '盼望/恐懼', meaning: '內心期待與擔憂' },
    { name: '最終結果', meaning: '最終發展' }
  ],
  horseshoe: [
    { name: '過去', meaning: '過往影響' },
    { name: '現在', meaning: '當前狀況' },
    { name: '未來', meaning: '未來發展' },
    { name: '建議', meaning: '行動建議' },
    { name: '外在影響', meaning: '外部因素' },
    { name: '希望與恐懼', meaning: '內心期待與擔憂' },
    { name: '結果', meaning: '最終結果' }
  ]
}

export const defaultLayouts: Record<string, SpreadPosition[]> = {
  single_wasteland: [
    { id: 'pos1', label: '核心', x: 0.5, y: 0.5, scale: 1.1, zIndex: 10, animationDelay: 0 }
  ],
  vault_tec_spread: [
    { id: 'past', label: '過去', x: 0.25, y: 0.5, animationDelay: 0 },
    { id: 'present', label: '現在', x: 0.5, y: 0.5, scale: 1.05, zIndex: 5, animationDelay: 150 },
    { id: 'future', label: '未來', x: 0.75, y: 0.5, animationDelay: 300 }
  ],
  wasteland_survival: [
    { id: 'you', label: '自己', x: 0.5, y: 0.15, scale: 1.05, zIndex: 10, animationDelay: 0 },
    { id: 'threat', label: '威脅', x: 0.15, y: 0.5, rotation: -15, animationDelay: 150 },
    { id: 'resource', label: '資源', x: 0.85, y: 0.5, rotation: 15, animationDelay: 300 },
    { id: 'ally', label: '同盟', x: 0.3, y: 0.85, animationDelay: 450 },
    { id: 'outcome', label: '結果', x: 0.7, y: 0.85, scale: 1.1, zIndex: 5, animationDelay: 600 }
  ],
  brotherhood_council: [
    { id: 'one', label: '戰略', x: 0.12, y: 0.2, animationDelay: 0 },
    { id: 'two', label: '科技', x: 0.5, y: 0.15, scale: 1.05, zIndex: 5, animationDelay: 100 },
    { id: 'three', label: '情報', x: 0.88, y: 0.2, animationDelay: 200 },
    { id: 'four', label: '資源', x: 0.12, y: 0.55, animationDelay: 300 },
    { id: 'five', label: '核心', x: 0.5, y: 0.5, scale: 1.05, zIndex: 5, animationDelay: 400 },
    { id: 'six', label: '防禦', x: 0.88, y: 0.55, animationDelay: 500 },
    { id: 'seven', label: '結論', x: 0.5, y: 0.88, scale: 1.1, zIndex: 10, animationDelay: 600 }
  ],
  raider_chaos: [
    { id: 'chaos', label: '混亂', x: 0.25, y: 0.4, rotation: -25, animationDelay: 0 },
    { id: 'opportunity', label: '機會', x: 0.75, y: 0.35, rotation: 15, animationDelay: 150 },
    { id: 'survival', label: '生存', x: 0.35, y: 0.7, rotation: 10, animationDelay: 300 },
    { id: 'wild_card', label: '萬能牌', x: 0.65, y: 0.65, rotation: -20, scale: 1.05, zIndex: 5, animationDelay: 450 }
  ],
  raider_chaos_spread: [
    { id: 'chaos', label: '混亂', x: 0.25, y: 0.4, rotation: -25, animationDelay: 0 },
    { id: 'opportunity', label: '機會', x: 0.75, y: 0.35, rotation: 15, animationDelay: 150 },
    { id: 'survival', label: '生存', x: 0.35, y: 0.7, rotation: 10, animationDelay: 300 },
    { id: 'wild_card', label: '萬能牌', x: 0.65, y: 0.65, rotation: -20, scale: 1.05, zIndex: 5, animationDelay: 450 }
  ],
  ncr_strategic: [
    { id: 'situation', label: '形勢', x: 0.22, y: 0.15, animationDelay: 0 },
    { id: 'opinion', label: '民意', x: 0.78, y: 0.15, animationDelay: 100 },
    { id: 'resources', label: '資源', x: 0.12, y: 0.5, animationDelay: 200 },
    { id: 'strategy', label: '戰略', x: 0.5, y: 0.5, scale: 1.05, zIndex: 5, animationDelay: 300 },
    { id: 'long_term', label: '長期', x: 0.88, y: 0.5, animationDelay: 400 },
    { id: 'benefit', label: '共和', x: 0.5, y: 0.85, scale: 1.1, zIndex: 10, animationDelay: 500 }
  ],
  ncr_strategic_spread: [
    { id: 'situation', label: '形勢', x: 0.22, y: 0.15, animationDelay: 0 },
    { id: 'opinion', label: '民意', x: 0.78, y: 0.15, animationDelay: 100 },
    { id: 'resources', label: '資源', x: 0.12, y: 0.5, animationDelay: 200 },
    { id: 'strategy', label: '戰略', x: 0.5, y: 0.5, scale: 1.05, zIndex: 5, animationDelay: 300 },
    { id: 'long_term', label: '長期', x: 0.88, y: 0.5, animationDelay: 400 },
    { id: 'benefit', label: '共和', x: 0.5, y: 0.85, scale: 1.1, zIndex: 10, animationDelay: 500 }
  ],
  wasteland_survival_spread: [
    { id: 'you', label: '自己', x: 0.5, y: 0.15, scale: 1.05, zIndex: 10, animationDelay: 0 },
    { id: 'threat', label: '威脅', x: 0.15, y: 0.5, rotation: -15, animationDelay: 150 },
    { id: 'resource', label: '資源', x: 0.85, y: 0.5, rotation: 15, animationDelay: 300 },
    { id: 'ally', label: '同盟', x: 0.3, y: 0.85, animationDelay: 450 },
    { id: 'outcome', label: '結果', x: 0.7, y: 0.85, scale: 1.1, zIndex: 5, animationDelay: 600 }
  ],
  brotherhood_council_spread: [
    { id: 'one', label: '戰略', x: 0.12, y: 0.2, animationDelay: 0 },
    { id: 'two', label: '科技', x: 0.5, y: 0.15, scale: 1.05, zIndex: 5, animationDelay: 100 },
    { id: 'three', label: '情報', x: 0.88, y: 0.2, animationDelay: 200 },
    { id: 'four', label: '資源', x: 0.12, y: 0.55, animationDelay: 300 },
    { id: 'five', label: '核心', x: 0.5, y: 0.5, scale: 1.05, zIndex: 5, animationDelay: 400 },
    { id: 'six', label: '防禦', x: 0.88, y: 0.55, animationDelay: 500 },
    { id: 'seven', label: '結論', x: 0.5, y: 0.88, scale: 1.1, zIndex: 10, animationDelay: 600 }
  ],
  celtic_cross: [
    { id: '1', label: '現況', x: 0.5, y: 0.5, scale: 1.1, zIndex: 10, animationDelay: 0 },
    { id: '2', label: '挑戰', x: 0.55, y: 0.5, rotation: 90, zIndex: 8, animationDelay: 150 },
    { id: '3', label: '過去', x: 0.5, y: 0.35, animationDelay: 300 },
    { id: '4', label: '未來', x: 0.5, y: 0.65, animationDelay: 450 },
    { id: '5', label: '顯意識', x: 0.35, y: 0.5, animationDelay: 600 },
    { id: '6', label: '潛意識', x: 0.65, y: 0.5, animationDelay: 750 },
    { id: '7', label: '自我', x: 0.8, y: 0.3, animationDelay: 900 },
    { id: '8', label: '環境', x: 0.8, y: 0.45, animationDelay: 1050 },
    { id: '9', label: '盼望/恐懼', x: 0.8, y: 0.6, animationDelay: 1200 },
    { id: '10', label: '最終結果', x: 0.8, y: 0.75, scale: 1.05, zIndex: 5, animationDelay: 1350 }
  ],
  horseshoe: [
    { id: '1', label: '過去', x: 0.2, y: 0.7, rotation: -20, animationDelay: 0 },
    { id: '2', label: '現在', x: 0.3, y: 0.45, rotation: -10, animationDelay: 150 },
    { id: '3', label: '未來', x: 0.4, y: 0.25, rotation: -5, animationDelay: 300 },
    { id: '4', label: '建議', x: 0.5, y: 0.2, scale: 1.1, zIndex: 10, animationDelay: 450 },
    { id: '5', label: '外在影響', x: 0.6, y: 0.25, rotation: 5, animationDelay: 600 },
    { id: '6', label: '希望與恐懼', x: 0.7, y: 0.45, rotation: 10, animationDelay: 750 },
    { id: '7', label: '結果', x: 0.8, y: 0.7, rotation: 20, scale: 1.05, zIndex: 5, animationDelay: 900 }
  ]
}

// Get layout with responsive support
// Priority: API template.positions.layout > hardcoded defaultLayouts
export function getLayout(
  spreadType: string,
  template?: SpreadTemplate,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
) {
  let baseLayout: SpreadPosition[]

  // Try to use API positions with layout data
  if (template?.positions && Array.isArray(template.positions)) {
    const apiPositions = template.positions
      .filter((pos: any) => pos.layout) // Only positions with layout data
      .map((pos: any) => ({
        id: pos.name?.toLowerCase().replace(/\s+/g, '_') || `pos${pos.number}`,
        label: pos.chinese_name || pos.name || `位置 ${pos.number}`,
        x: pos.layout.x || 0.5,
        y: pos.layout.y || 0.5,
        rotation: pos.layout.rotation || 0,
        scale: pos.layout.scale || 1.0,
        zIndex: pos.layout.zIndex || 1,
        animationDelay: pos.layout.animationDelay || (pos.number - 1) * 100
      }))

    if (apiPositions.length > 0) {
      baseLayout = apiPositions
    } else {
      // Fallback to hardcoded layouts
      baseLayout = defaultLayouts[spreadType] || defaultLayouts['single_wasteland']
    }
  } else {
    // Fallback to hardcoded layouts
    baseLayout = defaultLayouts[spreadType] || defaultLayouts['single_wasteland']
  }

  if (deviceType === 'desktop') {
    return baseLayout
  }

  const responsiveLayout = generateResponsivePositions(baseLayout)
  return responsiveLayout[deviceType]
}

// Get optimal layout based on container size
export function getAdaptiveLayout(
  spreadType: string,
  containerWidth: number,
  containerHeight: number,
  template?: SpreadTemplate
) {
  const baseLayout = defaultLayouts[spreadType] || defaultLayouts['single_wasteland']

  // Determine device type based on container size
  let deviceType: 'desktop' | 'tablet' | 'mobile'
  if (containerWidth < 640) {
    deviceType = 'mobile'
  } else if (containerWidth < 1024) {
    deviceType = 'tablet'
  } else {
    deviceType = 'desktop'
  }

  return getLayout(spreadType, template, deviceType)
}

// Calculate card transform styles for positioning
export function getCardTransform(position: SpreadPosition) {
  const transforms = []

  if (position.scale && position.scale !== 1) {
    transforms.push(`scale(${position.scale})`)
  }

  if (position.rotation) {
    transforms.push(`rotate(${position.rotation}deg)`)
  }

  return transforms.length > 0 ? transforms.join(' ') : undefined
}
