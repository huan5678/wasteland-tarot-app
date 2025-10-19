/**
 * Next.js Middleware - 路由保護和會話管理
 * 保護需要認證的路由，驗證會話有效性
 *
 * 重構變更：
 * - 移除 Supabase middleware 依賴
 * - 改為透過後端 API 驗證 JWT token（/api/v1/auth/verify）
 * - Token 儲存在 httpOnly cookies 中
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 後端 API 基礎 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// 定義受保護的路由模式
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/readings',
  '/cards/favorites',
  '/settings',
]

// 定義需要管理員權限的路由
const adminRoutes = [
  '/admin',
]

// 定義公開路由（已登入使用者不應訪問）
const publicRoutes = [
  '/auth/login',
  '/auth/register',
]

// 定義訪客可訪問的路由（即使匹配受保護路由也允許）
const guestAllowedRoutes = [
  '/readings/quick',
]

/**
 * 透過後端 API 驗證 JWT token
 * 從 request cookies 中讀取 access_token 並發送至後端驗證
 */
async function verifyTokenWithBackend(request: NextRequest): Promise<{ isValid: boolean; user?: any }> {
  try {
    const cookieHeader = request.headers.get('cookie') || ''

    // 如果沒有 cookie，直接返回未驗證（避免不必要的 API 呼叫）
    if (!cookieHeader || !cookieHeader.includes('access_token')) {
      return { isValid: false }
    }

    // 呼叫後端驗證端點
    const verifyResponse = await fetch(`${API_BASE_URL}/api/v1/auth/verify`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      // 設定較短的 timeout，避免阻塞請求
      signal: AbortSignal.timeout(3000),
    })

    if (!verifyResponse.ok) {
      return { isValid: false }
    }

    const data = await verifyResponse.json()
    return {
      isValid: true,
      user: data.user,
    }
  } catch (error) {
    // Token 驗證失敗不應該阻止頁面載入
    // 只有在訪問受保護路由時才會重定向到登入頁
    // 靜默失敗，讓使用者以未登入狀態繼續
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Token verification failed:', error.message)
    }
    return { isValid: false }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 檢查是否為訪客允許的路由
  const isGuestAllowed = guestAllowedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 訪客允許的路由直接通過，不需驗證
  if (isGuestAllowed) {
    return NextResponse.next()
  }

  // 檢查是否為受保護路由
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 檢查是否為公開路由（不含 callback）
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  )

  // OAuth callback 路由需要特殊處理，不驗證 token
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  // 驗證 token（透過後端 API）
  const { isValid, user } = await verifyTokenWithBackend(request)

  // 檢查是否為管理員路由
  const isAdminRoute = adminRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 管理員路由：需要登入 + 管理員權限
  if (isAdminRoute) {
    if (!isValid) {
      // 未登入，重導向至登入頁
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')

      const returnUrl = encodeURIComponent(pathname + request.nextUrl.search)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', returnUrl)

      return NextResponse.redirect(loginUrl)
    }

    // 已登入但非管理員，重導向至 dashboard
    if (!user?.is_admin) {
      console.warn(`Non-admin user attempted to access admin route: ${pathname}`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 管理員，允許訪問
    return NextResponse.next()
  }

  // 受保護路由：需要登入
  if (isProtectedRoute && !isValid) {
    // 清除無效的 cookies
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')

    // 儲存原始 URL 以便登入後返回
    const returnUrl = encodeURIComponent(pathname + request.nextUrl.search)
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnUrl', returnUrl)

    return NextResponse.redirect(loginUrl)
  }

  // 公開路由：已登入使用者重導向至 dashboard
  if (isPublicRoute && isValid) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// 配置 middleware 運行的路徑
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
