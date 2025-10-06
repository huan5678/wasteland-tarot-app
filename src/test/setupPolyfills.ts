/**
 * Jest Polyfills Setup
 * Required polyfills for MSW v2 and modern browser APIs
 */

import 'whatwg-fetch'
import 'web-streams-polyfill/dist/polyfill'
import { TextDecoder, TextEncoder } from 'util'

// Global polyfills for Node.js test environment
Object.assign(global, {
  TextDecoder,
  TextEncoder,
})

// Mock crypto.randomUUID for Node.js environment
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
  } as any
}

// Structured Clone polyfill (required for MSW v2)
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj))
  }
}