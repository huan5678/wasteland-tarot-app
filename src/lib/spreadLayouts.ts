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
    { id: 'you', label: '自己', x: 0.5, y: 0.2, scale: 1.05, zIndex: 10, animationDelay: 0 },
    { id: 'threat', label: '威脅', x: 0.2, y: 0.5, rotation: -15, animationDelay: 150 },
    { id: 'resource', label: '資源', x: 0.8, y: 0.5, rotation: 15, animationDelay: 300 },
    { id: 'ally', label: '同盟', x: 0.35, y: 0.8, animationDelay: 450 },
    { id: 'outcome', label: '結果', x: 0.65, y: 0.8, scale: 1.1, zIndex: 5, animationDelay: 600 }
  ],
  brotherhood_council: [
    { id: 'one', label: '1', x: 0.2, y: 0.3, animationDelay: 0 },
    { id: 'two', label: '2', x: 0.5, y: 0.25, scale: 1.05, zIndex: 5, animationDelay: 100 },
    { id: 'three', label: '3', x: 0.8, y: 0.3, animationDelay: 200 },
    { id: 'four', label: '4', x: 0.2, y: 0.6, animationDelay: 300 },
    { id: 'five', label: '5', x: 0.5, y: 0.55, scale: 1.05, zIndex: 5, animationDelay: 400 },
    { id: 'six', label: '6', x: 0.8, y: 0.6, animationDelay: 500 },
    { id: 'seven', label: '7', x: 0.5, y: 0.85, scale: 1.1, zIndex: 10, animationDelay: 600 }
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
export function getLayout(
  spreadType: string,
  template?: SpreadTemplate,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
) {
  const baseLayout = defaultLayouts[spreadType] || defaultLayouts['single_wasteland']

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
