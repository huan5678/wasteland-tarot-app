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
 * 簡化的 token 檢查（僅檢查 cookies 是否存在）
 * 實際的 token 驗證由前端 authStore.initialize() 處理
 *
 * 重構原因：
 * - 避免 middleware 呼叫後端 API 導致超時
 * - 前端已有完整的認證檢查邏輯（authStore.initialize）
 * - middleware 只需做基本的路由保護即可
 */
function checkTokenExists(request: NextRequest): { isValid: boolean } {
  try {
    const cookieHeader = request.headers.get('cookie') || ''

    // 檢查是否有 access_token cookie
    const hasAccessToken = cookieHeader.includes('access_token=')

    // 檢查 localStorage 中的認證狀態（透過 cookie 傳遞）
    // 注意：middleware 無法直接訪問 localStorage，
    // 但前端會在有效登入狀態時設定 access_token cookie
    return { isValid: hasAccessToken }
  } catch (error) {
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

  // 檢查 token 是否存在（簡化版，實際驗證由前端處理）
  const { isValid } = checkTokenExists(request)

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

    // 注意：簡化版 middleware 無法檢查 is_admin
    // 實際的管理員權限檢查由後端 API 和前端頁面邏輯處理
    // 允許訪問（後端會在 API 層面驗證權限）
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
