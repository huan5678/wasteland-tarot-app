'use client'

// Mobile accessibility utilities for enhanced user experience

export interface MobileAccessibilityOptions {
  enableVoiceOver?: boolean
  enableHighContrast?: boolean
  enableReducedMotion?: boolean
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
  enableScreenReader?: boolean
  enableKeyboardNavigation?: boolean
}

export class MobileAccessibilityManager {
  private static instance: MobileAccessibilityManager
  private options: MobileAccessibilityOptions
  private announcer: HTMLDivElement | null = null

  private constructor(options: MobileAccessibilityOptions = {}) {
    this.options = {
      enableVoiceOver: true,
      enableHighContrast: false,
      enableReducedMotion: this.prefersReducedMotion(),
      fontSize: 'medium',
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      ...options
    }

    this.initialize()
  }

  public static getInstance(options?: MobileAccessibilityOptions): MobileAccessibilityManager {
    if (!MobileAccessibilityManager.instance) {
      MobileAccessibilityManager.instance = new MobileAccessibilityManager(options)
    }
    return MobileAccessibilityManager.instance
  }

  private initialize() {
    if (typeof window !== 'undefined') {
      this.createScreenReaderAnnouncer()
      this.applyAccessibilityStyles()
      this.setupKeyboardNavigation()
      this.setupTouchAccessibility()
    }
  }

  // Screen reader announcements
  private createScreenReaderAnnouncer() {
    if (!this.announcer) {
      this.announcer = document.createElement('div')
      this.announcer.setAttribute('aria-live', 'polite')
      this.announcer.setAttribute('aria-atomic', 'true')
      this.announcer.style.position = 'absolute'
      this.announcer.style.left = '-10000px'
      this.announcer.style.width = '1px'
      this.announcer.style.height = '1px'
      this.announcer.style.overflow = 'hidden'
      document.body.appendChild(this.announcer)
    }
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.options.enableScreenReader || !this.announcer) return

    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = ''
      }
    }, 1000)
  }

  // High contrast mode
  public toggleHighContrast(enable?: boolean) {
    const shouldEnable = enable !== undefined ? enable : !this.options.enableHighContrast
    this.options.enableHighContrast = shouldEnable

    if (shouldEnable) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    this.announce(shouldEnable ? '高對比模式已啟用' : '高對比模式已關閉')
  }

  // Font size adjustment
  public setFontSize(size: MobileAccessibilityOptions['fontSize']) {
    this.options.fontSize = size

    const sizeClasses = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl'
    }

    // Remove existing font size classes
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl')

    if (size && sizeClasses[size]) {
      document.documentElement.classList.add(sizeClasses[size])
    }

    const sizeLabels = {
      small: '小',
      medium: '中',
      large: '大',
      xlarge: '特大'
    }

    if (size) {
      this.announce(`字體大小已調整為${sizeLabels[size]}`)
    }
  }

  // Reduced motion
  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  public toggleReducedMotion(enable?: boolean) {
    const shouldEnable = enable !== undefined ? enable : !this.options.enableReducedMotion
    this.options.enableReducedMotion = shouldEnable

    if (shouldEnable) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }

    this.announce(shouldEnable ? '動畫已簡化' : '動畫已啟用')
  }

  // Apply accessibility styles
  private applyAccessibilityStyles() {
    const styles = document.createElement('style')
    styles.textContent = `
      /* High contrast mode */
      .high-contrast {
        --color-background: #000000;
        --color-foreground: #ffffff;
        --color-pip-boy-green: #00ff00;
        --color-wasteland-dark: #ffffff;
        --color-wasteland-darker: #000000;
        filter: contrast(150%);
      }

      .high-contrast img {
        filter: contrast(120%);
      }

      .high-contrast .bg-gradient-to-br,
      .high-contrast .bg-gradient-to-r,
      .high-contrast .bg-gradient-to-t {
        background: var(--color-background) !important;
      }

      /* Reduced motion */
      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* Focus indicators for keyboard navigation */
      .focus-visible:focus {
        outline: 3px solid var(--color-pip-boy-green);
        outline-offset: 2px;
        border-radius: 4px;
      }

      /* Touch targets */
      .touch-target {
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Screen reader only text */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--color-pip-boy-green);
        color: var(--color-wasteland-dark);
        padding: 8px;
        text-decoration: none;
        z-index: 9999;
        border-radius: 4px;
        font-weight: bold;
      }

      .skip-link:focus {
        top: 6px;
      }
    `

    document.head.appendChild(styles)
  }

  // Keyboard navigation setup
  private setupKeyboardNavigation() {
    if (!this.options.enableKeyboardNavigation) return

    // Add skip links
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.className = 'skip-link'
    skipLink.textContent = '跳至主要內容'
    document.body.insertBefore(skipLink, document.body.firstChild)

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // Alt + H: Go to home
      if (event.altKey && event.key === 'h') {
        event.preventDefault()
        this.announce('導航至主頁')
        window.location.href = '/'
      }

      // Alt + C: Focus on cards
      if (event.altKey && event.key === 'c') {
        event.preventDefault()
        const cardsSection = document.querySelector('[data-section="cards"]')
        if (cardsSection instanceof HTMLElement) {
          cardsSection.focus()
          this.announce('聚焦在卡牌區域')
        }
      }

      // Alt + R: Focus on readings
      if (event.altKey && event.key === 'r') {
        event.preventDefault()
        const readingsSection = document.querySelector('[data-section="readings"]')
        if (readingsSection instanceof HTMLElement) {
          readingsSection.focus()
          this.announce('聚焦在占卜區域')
        }
      }

      // Escape: Close modals/overlays
      if (event.key === 'Escape') {
        const closeButton = document.querySelector('[data-close-modal], [aria-label*="關閉"]')
        if (closeButton instanceof HTMLElement) {
          closeButton.click()
          this.announce('已關閉對話框')
        }
      }
    })
  }

  // Touch accessibility improvements
  private setupTouchAccessibility() {
    // Minimum touch target size enforcement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element

            // Find clickable elements
            const clickableElements = element.querySelectorAll(
              'button, [role="button"], a, [onclick], input[type="button"], input[type="submit"]'
            )

            clickableElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                this.ensureTouchTargetSize(el)
              }
            })
          }
        })
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Initial scan
    document.querySelectorAll(
      'button, [role="button"], a, [onclick], input[type="button"], input[type="submit"]'
    ).forEach((el) => {
      if (el instanceof HTMLElement) {
        this.ensureTouchTargetSize(el)
      }
    })
  }

  private ensureTouchTargetSize(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element)
    const minSize = 44 // WCAG AA standard

    const width = parseInt(computedStyle.width)
    const height = parseInt(computedStyle.height)

    if (width < minSize || height < minSize) {
      element.style.minWidth = `${minSize}px`
      element.style.minHeight = `${minSize}px`
      element.style.display = 'inline-flex'
      element.style.alignItems = 'center'
      element.style.justifyContent = 'center'
      element.classList.add('touch-target')
    }
  }

  // Voice over support for dynamic content
  public announceCardAction(action: string, cardName: string) {
    const messages = {
      revealed: `已翻開 ${cardName}`,
      selected: `已選擇 ${cardName}`,
      focused: `聚焦在 ${cardName}`,
      loading: `正在載入 ${cardName}`,
      error: `載入 ${cardName} 時發生錯誤`
    }

    this.announce(messages[action as keyof typeof messages] || `${action} ${cardName}`)
  }

  public announceReadingProgress(current: number, total: number) {
    this.announce(`第 ${current} 張，共 ${total} 張卡牌`)
  }

  public announceNavigationChange(page: string) {
    const pageNames = {
      home: '主頁',
      cards: '卡牌',
      readings: '占卜',
      profile: '個人資料'
    }

    this.announce(`已導航到 ${pageNames[page as keyof typeof pageNames] || page}`)
  }

  // Gesture accessibility
  public addGestureDescription(element: HTMLElement, gestures: string[]) {
    const gestureText = gestures.join('，')
    const existingDescription = element.getAttribute('aria-describedby')

    const descriptionId = `gesture-desc-${Math.random().toString(36).substr(2, 9)}`
    const description = document.createElement('span')
    description.id = descriptionId
    description.className = 'sr-only'
    description.textContent = `可用手勢：${gestureText}`

    element.appendChild(description)

    const newDescription = existingDescription
      ? `${existingDescription} ${descriptionId}`
      : descriptionId

    element.setAttribute('aria-describedby', newDescription)
  }

  // Update options
  public updateOptions(newOptions: Partial<MobileAccessibilityOptions>) {
    this.options = { ...this.options, ...newOptions }
    this.applyChanges()
  }

  private applyChanges() {
    if (this.options.enableHighContrast) {
      this.toggleHighContrast(true)
    }

    if (this.options.enableReducedMotion) {
      this.toggleReducedMotion(true)
    }

    if (this.options.fontSize) {
      this.setFontSize(this.options.fontSize)
    }
  }

  // Get current options
  public getOptions(): MobileAccessibilityOptions {
    return { ...this.options }
  }

  // Cleanup
  public destroy() {
    if (this.announcer) {
      document.body.removeChild(this.announcer)
      this.announcer = null
    }
  }
}

// Utility functions
export function createAccessibleCard(
  cardElement: HTMLElement,
  cardName: string,
  cardMeaning: string,
  isRevealed: boolean
) {
  const accessibility = MobileAccessibilityManager.getInstance()

  // Set ARIA attributes
  cardElement.setAttribute('role', 'button')
  cardElement.setAttribute('tabindex', '0')
  cardElement.setAttribute('aria-label', `${cardName}${isRevealed ? ` - ${cardMeaning}` : ' - 未翻開'}`)

  // Add gesture descriptions
  accessibility.addGestureDescription(cardElement, [
    '點擊翻牌',
    '長按查看詳情',
    '滑動切換'
  ])

  // Keyboard support
  cardElement.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      cardElement.click()
    }
  })
}

export function announceCardState(cardName: string, state: 'loading' | 'revealed' | 'error') {
  const accessibility = MobileAccessibilityManager.getInstance()
  accessibility.announceCardAction(state, cardName)
}

export function createAccessibleNavigation(navigationElement: HTMLElement) {
  const accessibility = MobileAccessibilityManager.getInstance()

  navigationElement.setAttribute('role', 'navigation')
  navigationElement.setAttribute('aria-label', '主要導航')

  const navItems = navigationElement.querySelectorAll('button, a')
  navItems.forEach((item, index) => {
    if (item instanceof HTMLElement) {
      item.setAttribute('tabindex', '0')

      // Add position in set
      item.setAttribute('aria-setsize', navItems.length.toString())
      item.setAttribute('aria-posinset', (index + 1).toString())
    }
  })
}

// Export singleton instance creator
export const createMobileAccessibility = (options?: MobileAccessibilityOptions) => {
  return MobileAccessibilityManager.getInstance(options)
}