import { logPerf, logEvent, logApiCall, logUserAction } from './logger'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

interface PerformanceThresholds {
  good: number
  needsImprovement: number
}

interface ResourceTiming {
  name: string
  duration: number
  size: number
  type: string
}

// ============================================================================
// Web Vitals Configuration
// ============================================================================

const WEB_VITALS_THRESHOLDS: Record<string, PerformanceThresholds> = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  LCP: { good: 2500, needsImprovement: 4000 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 }
}

// ============================================================================
// Web Vitals Initialization
// ============================================================================

let webVitalsInitialized = false
const vitalsBuffer: WebVitalMetric[] = []

export async function initWebVitals() {
  if (webVitalsInitialized) return
  webVitalsInitialized = true

  try {
    const { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals')

    onCLS(metric => handleMetric('CLS', metric))
    onFID(metric => handleMetric('FID', metric))
    onLCP(metric => handleMetric('LCP', metric))
    onFCP(metric => handleMetric('FCP', metric))
    onTTFB(metric => handleMetric('TTFB', metric))
    if (onINP) onINP(metric => handleMetric('INP', metric))

    // eslint-disable-next-line no-console
    console.info('[Metrics] Web Vitals monitoring initialized')
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Metrics] web-vitals import failed', e)
  }
}

function handleMetric(name: string, metric: any) {
  const value = metric.value
  const rating = getRating(name, value)

  const vitalMetric: WebVitalMetric = {
    name,
    value,
    rating,
    delta: metric.delta,
    id: metric.id
  }

  vitalsBuffer.push(vitalMetric)
  if (vitalsBuffer.length > 50) vitalsBuffer.shift()

  // Log performance metric
  logPerf(`webvital:${name}`, value, { rating, id: metric.id })

  // Alert on poor performance
  if (rating === 'poor') {
    // eslint-disable-next-line no-console
    console.warn(`[Metrics] Poor ${name} score:`, value, metric)
  }
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name]
  if (!thresholds) return 'good'

  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}

export function getWebVitalsSnapshot() {
  return [...vitalsBuffer]
}

// ============================================================================
// Enhanced Fetch Wrapper
// ============================================================================

export async function timedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const start = performance.now()
  const url = typeof input === 'string' ? input : (input as URL).toString()
  const method = init?.method || 'GET'

  try {
    const res = await fetch(input, init)
    const duration = performance.now() - start

    // Log API call with detailed info
    logApiCall(url, method, duration, res.status, {
      contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length')
    })

    return res
  } catch (e) {
    const duration = performance.now() - start

    // Log failed API call
    logApiCall(url, method, duration, 0, {
      error: e instanceof Error ? e.message : 'Unknown error'
    })

    throw e
  }
}

// ============================================================================
// Resource Performance Monitoring
// ============================================================================

export function analyzeResourcePerformance(): ResourceTiming[] {
  if (typeof window === 'undefined' || !window.performance) return []

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

  return resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize || 0,
    type: resource.initiatorType
  }))
}

export function getSlowResources(thresholdMs: number = 1000): ResourceTiming[] {
  return analyzeResourcePerformance().filter(r => r.duration > thresholdMs)
}

export function getLargeResources(thresholdBytes: number = 500000): ResourceTiming[] {
  return analyzeResourcePerformance().filter(r => r.size > thresholdBytes)
}

// ============================================================================
// Navigation Timing
// ============================================================================

export function getNavigationTiming() {
  if (typeof window === 'undefined' || !window.performance) return null

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!navigation) return null

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
    onLoad: navigation.loadEventEnd - navigation.loadEventStart,
    total: navigation.loadEventEnd - navigation.fetchStart
  }
}

// ============================================================================
// Memory Monitoring
// ============================================================================

export function getMemoryInfo() {
  if (typeof window === 'undefined') return null

  const memory = (performance as any).memory

  if (!memory) return null

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  }
}

export function monitorMemoryUsage() {
  const memory = getMemoryInfo()

  if (memory) {
    logPerf('memory:usage', memory.usagePercent, {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    })

    // Alert on high memory usage
    if (memory.usagePercent > 90) {
      // eslint-disable-next-line no-console
      console.warn('[Metrics] High memory usage:', memory.usagePercent.toFixed(2) + '%')
    }
  }
}

// ============================================================================
// User Actions Tracking
// ============================================================================

export function markUserAction(action: string, extra?: any) {
  logUserAction(action, extra)
}

export function trackPageView(page: string, metadata?: Record<string, any>) {
  logEvent('page_view', { page, ...metadata })
}

export function trackFeatureUsage(feature: string, metadata?: Record<string, any>) {
  logEvent('feature_usage', { feature, ...metadata })
}

export function trackConversion(type: string, value?: number, metadata?: Record<string, any>) {
  logEvent('conversion', { type, value, ...metadata })
}

// ============================================================================
// Performance Observer
// ============================================================================

let performanceObserverInitialized = false

export function initPerformanceObserver() {
  if (performanceObserverInitialized) return
  if (typeof window === 'undefined' || !window.PerformanceObserver) return

  performanceObserverInitialized = true

  try {
    // Observe long tasks (> 50ms)
    const longTaskObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          logPerf('long_task', entry.duration, {
            name: entry.name,
            startTime: entry.startTime
          })

          // eslint-disable-next-line no-console
          console.warn('[Metrics] Long task detected:', entry.duration.toFixed(2) + 'ms', entry)
        }
      }
    })

    longTaskObserver.observe({ entryTypes: ['longtask'] })

    // Observe layout shifts
    const layoutShiftObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any
        if (layoutShift.hadRecentInput) continue

        logPerf('layout_shift', layoutShift.value * 1000, {
          startTime: entry.startTime
        })
      }
    })

    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })

    // eslint-disable-next-line no-console
    console.info('[Metrics] Performance Observer initialized')
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Metrics] Performance Observer initialization failed', e)
  }
}

// ============================================================================
// Metrics Summary
// ============================================================================

export function getPerformanceSummary() {
  return {
    webVitals: getWebVitalsSnapshot(),
    navigation: getNavigationTiming(),
    memory: getMemoryInfo(),
    slowResources: getSlowResources(1000),
    largeResources: getLargeResources(500000)
  }
}

// ============================================================================
// Initialization
// ============================================================================

export function initMetrics() {
  initWebVitals()
  initPerformanceObserver()

  // Monitor memory usage every 30 seconds
  if (typeof window !== 'undefined') {
    setInterval(() => {
      monitorMemoryUsage()
    }, 30000)
  }

  // eslint-disable-next-line no-console
  console.info('[Metrics] Performance monitoring initialized')
}
