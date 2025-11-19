/**
 * Unified API Configuration
 * 統一的 API 配置模組 - Single Source of Truth
 *
 * Architecture:
 * Browser → Next.js (/api/v1/*) → API Route Proxy → Backend (internal)
 *          ↑ getClientApiBaseUrl() returns ''
 *                                    ↑ getServerApiBaseUrl() returns API_BASE_URL
 *
 * CRITICAL: Client-side code MUST use relative paths (empty string)
 * This ensures all requests go through Next.js API Route Proxy
 */

/**
 * Get API base URL for client-side code
 *
 * @returns Empty string - forces relative paths to use Next.js proxy
 *
 * IMPORTANT: Client-side ALWAYS returns empty string in production
 * - Development: '' → /api/v1/* → Next.js proxy → http://localhost:8000
 * - Production: '' → /api/v1/* → Next.js proxy → http://wasteland-tarot-app.zeabur.internal:8080
 */
export function getClientApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    throw new Error('getClientApiBaseUrl() should only be called on client-side')
  }

  // ALWAYS use relative path in browser
  // This routes through Next.js API proxy at /api/v1/[...path]
  return ''
}

/**
 * Get API base URL for server-side code (API routes, SSR)
 *
 * @returns API_BASE_URL or NEXT_PUBLIC_API_BASE_URL or fallback to localhost:8000
 *
 * Server-side fallback chain:
 * 1. API_BASE_URL (preferred, private internal domain)
 * 2. NEXT_PUBLIC_API_BASE_URL (legacy support)
 * 3. http://localhost:8000 (development only)
 */
export function getServerApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    throw new Error('getServerApiBaseUrl() should only be called on server-side')
  }

  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8000'
  )
}

/**
 * Get API base URL based on environment (client or server)
 *
 * This is the recommended helper for most use cases
 *
 * @returns Appropriate base URL for current environment
 */
export function getApiBaseUrl(): string {
  const isBrowser = typeof window !== 'undefined'

  return isBrowser
    ? getClientApiBaseUrl()  // '' - use Next.js proxy
    : getServerApiBaseUrl()  // Internal backend URL
}

/**
 * Get site base URL for metadata generation
 *
 * @returns Public site URL
 */
export function getSiteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
