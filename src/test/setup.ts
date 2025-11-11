/**
 * Jest Test Setup for Wasteland Tarot Application
 * Fallout-themed test environment configuration
 */

import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers with axe-core accessibility testing
expect.extend(toHaveNoViolations)

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
  // Increase timeout for Pip-Boy interface animations
  asyncUtilTimeout: 5000,
})

// MSW 伺服器設定 (僅在需要時載入，避免 ESM 模組問題)
let server: any
try {
  const mswServer = require('./mocks/server')
  server = mswServer.server

  beforeAll(() => {
    server?.listen({
      onUnhandledRequest: 'warn'
    })
  })

  afterEach(() => {
    server?.resetHandlers()
    // 清理所有 DOM 元素
    document.body.innerHTML = ''
    // Clear all mocks after each test
    jest.clearAllMocks()
  })

  afterAll(() => {
    server?.close()
  })
} catch (error) {
  // MSW 無法載入時，僅清理 DOM 和 mocks
  afterEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })
}

// 模擬 Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    isReady: true,
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}))

// 模擬 Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// 模擬 IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// 模擬 ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// 模擬 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// 模擬 localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

// 模擬 sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock as any

// 設定環境變數
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8000'

// Mock Web Audio API for Pip-Boy sound effects
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    createOscillator: jest.fn().mockReturnValue({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 0 },
    }),
    createGain: jest.fn().mockReturnValue({
      connect: jest.fn(),
      gain: { value: 0 },
    }),
    destination: {},
  })),
})

// Fallout-specific mocks
global.WastelandTarot = {
  // Mock Pip-Boy interface
  PipBoyInterface: {
    playSound: jest.fn(),
    updateStats: jest.fn(),
    scanlineEffect: jest.fn(),
  },
  // Mock radiation calculations
  RadiationEngine: {
    calculateFactor: jest.fn().mockReturnValue(0.5),
    applyRadiation: jest.fn(),
  },
  // Mock karma system
  KarmaSystem: {
    calculateAlignment: jest.fn().mockReturnValue('NEUTRAL'),
    updateKarma: jest.fn(),
  },
}

// Mock react-markdown and related packages
const React = require('react')

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => {
    return React.createElement('div', { 'data-testid': 'markdown-content' }, children)
  },
}))

jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: () => () => {},
}))

jest.mock('rehype-highlight', () => ({
  __esModule: true,
  default: () => () => {},
}))

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => () => {},
}))

jest.mock('strip-markdown', () => ({
  __esModule: true,
  default: () => () => {},
}))

jest.mock('remark', () => ({
  remark: () => {
    let inputText = ''
    return {
      use: jest.fn().mockReturnThis(),
      process: jest.fn().mockImplementation((text: string) => {
        inputText = text
        // Simple markdown stripping - remove common markdown syntax
        const stripped = text
          .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
          .replace(/\*([^*]+)\*/g, '$1') // italic
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
          .replace(/^#+\s+/gm, '') // headings
          .replace(/^>\s+/gm, '') // blockquotes
          .replace(/^[-*+]\s+/gm, '') // lists
          .replace(/```[\s\S]*?```/g, '') // code blocks
          .replace(/`([^`]+)`/g, '$1') // inline code
          .trim()
        return Promise.resolve({
          toString: () => stripped,
        })
      }),
      processSync: jest.fn().mockImplementation((text: string) => {
        inputText = text
        // Same simple markdown stripping
        const stripped = text
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/^#+\s+/gm, '')
          .replace(/^>\s+/gm, '')
          .replace(/^[-*+]\s+/gm, '')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1')
          .trim()
        return {
          toString: () => stripped,
        }
      }),
    }
  },
}))

// Mock canvas for card animations
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn().mockReturnValue({ data: new Array(4) }),
  putImageData: jest.fn(),
  createImageData: jest.fn().mockReturnValue({}),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 0 }),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}))

// Custom Jest matchers for Fallout theme
expect.extend({
  toHavePipBoyStyle(received) {
    const pipBoyClasses = [
      'text-pip-boy-green',
      'bg-wasteland-dark',
      'font-mono',
      'border-pip-boy-green'
    ]

    const hasStyle = pipBoyClasses.some(className =>
      received.classList?.contains(className)
    )

    return {
      message: () =>
        hasStyle
          ? `Expected element not to have Pip-Boy styling`
          : `Expected element to have Pip-Boy styling (green text, dark background, monospace font)`,
      pass: hasStyle,
    }
  },

  toHaveRadiationEffect(received) {
    const radiationClasses = [
      'animate-radiation-pulse',
      'glow-radiation',
      'radiation-warning'
    ]

    const hasEffect = radiationClasses.some(className =>
      received.classList?.contains(className)
    )

    return {
      message: () =>
        hasEffect
          ? `Expected element not to have radiation effects`
          : `Expected element to have radiation effects (pulsing, glowing, or warning styles)`,
      pass: hasEffect,
    }
  },

  toBeAccessibleInVault(received) {
    // Custom accessibility check for Pip-Boy interface
    const hasAriaLabel = received.hasAttribute('aria-label')
    const hasRole = received.hasAttribute('role')
    const hasTabIndex = received.hasAttribute('tabindex')

    const isAccessible = hasAriaLabel || hasRole || hasTabIndex

    return {
      message: () =>
        isAccessible
          ? `Expected element not to be accessible in Vault interface`
          : `Expected element to be accessible in Vault interface (aria-label, role, or tabindex)`,
      pass: isAccessible,
    }
  }
})

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in tests:', reason)
})

// Console override for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})