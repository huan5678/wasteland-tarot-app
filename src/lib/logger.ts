import { useErrorStore } from './errorStore'

// ============================================================================
// Types & Interfaces
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogEventType = 'event' | 'perf' | 'error' | 'user_action' | 'api_call'

interface LogEvent {
  id: string
  name: string
  payload?: any
  ts: number
  type: LogEventType
  level?: LogLevel
  user_id?: string
  session_id?: string
  stack?: string
}

interface ErrorContext {
  url?: string
  user_agent?: string
  timestamp?: number
  user_id?: string
  session_id?: string
  component?: string
  action?: string
  [key: string]: any
}

interface PerformanceEntry {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

// ============================================================================
// State Management
// ============================================================================

const eventBuffer: LogEvent[] = []
const errorBuffer: LogEvent[] = []
const perfBuffer: PerformanceEntry[] = []

let sessionId: string = Math.random().toString(36).slice(2)
let userId: string | undefined = undefined

// ============================================================================
// Configuration
// ============================================================================

const MAX_BUFFER_SIZE = 100
const MAX_ERROR_BUFFER_SIZE = 50
const MAX_PERF_BUFFER_SIZE = 100
const BATCH_SEND_INTERVAL = 30000 // 30 seconds
const PERFORMANCE_THRESHOLD_MS = 1000 // Log warnings for operations > 1s

// ============================================================================
// Session & User Management
// ============================================================================

export function setUserId(id: string | undefined) {
  userId = id
}

export function getUserId(): string | undefined {
  return userId
}

export function getSessionId(): string {
  return sessionId
}

export function resetSession() {
  sessionId = Math.random().toString(36).slice(2)
}

// ============================================================================
// Error Tracking
// ============================================================================

export function logError(error: unknown, context?: ErrorContext) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
  const stack = error instanceof Error ? error.stack : undefined

  // Filter out harmless browser warnings that don't affect functionality
  if (typeof message === 'string') {
    // ResizeObserver errors are safe browser warnings from layout calculations
    if (message.includes('ResizeObserver loop')) {
      return
    }
    // Add other harmless errors here if needed in the future
  }

  // Enhanced error context
  const enrichedContext: ErrorContext = {
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: Date.now(),
    user_id: userId,
    session_id: sessionId,
    ...context
  }

  // Create error log event
  const errorEvent: LogEvent = {
    id: Math.random().toString(36).slice(2),
    name: 'error',
    payload: { message, context: enrichedContext },
    ts: Date.now(),
    type: 'error',
    level: 'error',
    user_id: userId,
    session_id: sessionId,
    stack
  }

  // Add to error buffer
  errorBuffer.push(errorEvent)
  if (errorBuffer.length > MAX_ERROR_BUFFER_SIZE) {
    errorBuffer.shift()
  }

  // Push to error store for UI display
  try {
    useErrorStore.getState().pushError({
      source: enrichedContext.component || 'unknown',
      message,
      detail: { raw: error, context: enrichedContext }
    })
  } catch {}

  // Console output
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[AppError]', message, { error, context: enrichedContext, stack })
  }

  // Send to external service in production
  if (process.env.NODE_ENV === 'production') {
    sendErrorToExternalService(errorEvent)
  }
}

export function logCritical(error: unknown, context?: ErrorContext) {
  logError(error, { ...context, level: 'critical' })

  // Additional handling for critical errors
  if (process.env.NODE_ENV === 'production') {
    // Could trigger alerts, notifications, etc.
  }
}

// ============================================================================
// Event Logging
// ============================================================================

export function logEvent(name: string, payload?: any, level: LogLevel = 'info') {
  const evt: LogEvent = {
    id: Math.random().toString(36).slice(2),
    name,
    payload,
    ts: Date.now(),
    type: 'event',
    level,
    user_id: userId,
    session_id: sessionId
  }

  eventBuffer.push(evt)
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift()
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[Event]', name, payload)
  }
}

export function logUserAction(action: string, metadata?: Record<string, any>) {
  const evt: LogEvent = {
    id: Math.random().toString(36).slice(2),
    name: `user_action:${action}`,
    payload: metadata,
    ts: Date.now(),
    type: 'user_action',
    level: 'info',
    user_id: userId,
    session_id: sessionId
  }

  eventBuffer.push(evt)
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift()
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[UserAction]', action, metadata)
  }
}

export function logApiCall(endpoint: string, method: string, duration: number, status: number, metadata?: Record<string, any>) {
  const evt: LogEvent = {
    id: Math.random().toString(36).slice(2),
    name: `api_call:${method}:${endpoint}`,
    payload: { endpoint, method, duration, status, ...metadata },
    ts: Date.now(),
    type: 'api_call',
    level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
    user_id: userId,
    session_id: sessionId
  }

  eventBuffer.push(evt)
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift()
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[API]', method, endpoint, `${duration}ms`, status, metadata)
  }
}

// ============================================================================
// Performance Logging
// ============================================================================

export function logPerf(name: string, durationMs: number, extra?: any) {
  const entry: PerformanceEntry = {
    name,
    duration: durationMs,
    timestamp: Date.now(),
    metadata: { ...extra, user_id: userId, session_id: sessionId }
  }

  perfBuffer.push(entry)
  if (perfBuffer.length > MAX_PERF_BUFFER_SIZE) {
    perfBuffer.shift()
  }

  // Log warning for slow operations
  if (durationMs > PERFORMANCE_THRESHOLD_MS) {
    // eslint-disable-next-line no-console
    console.warn('[Performance Warning]', name, `${durationMs}ms`, extra)
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[Perf]', name, `${durationMs}ms`, extra)
  }
}

export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start
    logPerf(name, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logPerf(`${name}:error`, duration)
    throw error
  }
}

export async function measurePerformanceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    logPerf(name, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logPerf(`${name}:error`, duration)
    throw error
  }
}

// ============================================================================
// Buffer Access
// ============================================================================

export function getBufferedEvents() {
  return [...eventBuffer]
}

export function getBufferedErrors() {
  return [...errorBuffer]
}

export function getBufferedPerformance() {
  return [...perfBuffer]
}

export function clearBuffers() {
  eventBuffer.length = 0
  errorBuffer.length = 0
  perfBuffer.length = 0
}

// ============================================================================
// Analytics & Aggregation
// ============================================================================

export function getErrorStats() {
  const errors = getBufferedErrors()
  const now = Date.now()
  const last5min = errors.filter(e => now - e.ts < 5 * 60 * 1000)
  const last1hour = errors.filter(e => now - e.ts < 60 * 60 * 1000)

  return {
    total: errors.length,
    last_5_minutes: last5min.length,
    last_hour: last1hour.length,
    by_level: errors.reduce((acc, e) => {
      acc[e.level || 'unknown'] = (acc[e.level || 'unknown'] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

export function getPerformanceStats() {
  const perf = getBufferedPerformance()

  if (perf.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0, p95: 0 }
  }

  const durations = perf.map(p => p.duration).sort((a, b) => a - b)
  const sum = durations.reduce((a, b) => a + b, 0)
  const p95Index = Math.floor(durations.length * 0.95)

  return {
    count: perf.length,
    avg: sum / perf.length,
    min: durations[0],
    max: durations[durations.length - 1],
    p95: durations[p95Index] || 0
  }
}

// ============================================================================
// External Service Integration
// ============================================================================

async function sendErrorToExternalService(errorEvent: LogEvent) {
  // Placeholder for external error tracking service (e.g., Sentry, LogRocket)
  // This would be configured with API keys and endpoints

  try {
    // Example: send to backend logging endpoint
    if (typeof fetch !== 'undefined') {
      await fetch('/api/logs/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorEvent)
      }).catch(() => {
        // Silently fail - don't break the app due to logging issues
      })
    }
  } catch {
    // Silently fail
  }
}

// ============================================================================
// Batch Sending
// ============================================================================

let batchInterval: NodeJS.Timeout | null = null

export function startBatchLogging() {
  if (batchInterval) return

  batchInterval = setInterval(() => {
    const events = getBufferedEvents()
    const errors = getBufferedErrors()

    if (events.length > 0 || errors.length > 0) {
      sendBatchToServer({ events, errors })
    }
  }, BATCH_SEND_INTERVAL)
}

export function stopBatchLogging() {
  if (batchInterval) {
    clearInterval(batchInterval)
    batchInterval = null
  }
}

async function sendBatchToServer(data: { events: LogEvent[], errors: LogEvent[] }) {
  try {
    if (typeof fetch !== 'undefined' && process.env.NODE_ENV === 'production') {
      await fetch('/api/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {
        // Silently fail
      })
    }
  } catch {
    // Silently fail
  }
}

// ============================================================================
// Global Error Handler
// ============================================================================

if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    const errorMessage = event.error?.message || event.message || ''

    // Filter out harmless ResizeObserver errors
    // These are safe browser warnings that don't affect functionality
    if (
      typeof errorMessage === 'string' &&
      errorMessage.includes('ResizeObserver loop')
    ) {
      // Silently ignore - this is a harmless browser warning from third-party libraries
      event.preventDefault()
      return
    }

    logError(event.error || event.message, {
      component: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, {
      component: 'unhandledRejection',
      promise: event.promise
    })
  })
}

// ============================================================================
// Default Export Object (for convenient imports)
// ============================================================================

export const logger = {
  // Logging methods
  debug: (message: string, meta?: any) => logEvent(message, meta, 'debug'),
  info: (message: string, meta?: any) => logEvent(message, meta, 'info'),
  warn: (message: string, meta?: any) => logEvent(message, meta, 'warn'),
  error: logError,
  critical: logCritical,

  // Event logging
  event: logEvent,
  userAction: logUserAction,
  apiCall: logApiCall,

  // Performance tracking
  perf: logPerf,
  measurePerformance,
  measurePerformanceAsync,

  // Session management
  setUserId,
  getUserId,
  getSessionId,
  resetSession,

  // Buffer access
  getBufferedEvents,
  getBufferedErrors,
  getBufferedPerformance,
  clearBuffers,

  // Analytics
  getErrorStats,
  getPerformanceStats,

  // Batch logging
  startBatchLogging,
  stopBatchLogging,
} as const;
