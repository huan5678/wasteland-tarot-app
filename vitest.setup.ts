/**
 * Vitest Setup File
 * 配置測試環境
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Audio API
global.AudioContext = global.AudioContext || class AudioContext {
  sampleRate = 44100
  destination = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: (channel: number) => new Float32Array(length),
    }
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }
  }

  createOscillator() {
    return {
      frequency: { value: 440 },
      type: 'sine' as OscillatorType,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }

  resume() {
    return Promise.resolve()
  }

  close() {
    return Promise.resolve()
  }

  get state() {
    return 'running' as AudioContextState
  }
} as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.location
delete (window as any).location
window.location = {
  pathname: '/',
  search: '',
  hash: '',
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  toString: vi.fn(() => 'http://localhost:3000/'),
} as any

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
