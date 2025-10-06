/**
 * Next.js Middleware - 路由保護和會話管理
 * 保護需要認證的路由，驗證會話有效性
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// 定義受保護的路由模式
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/readings',
  '/cards/favorites',
  '/settings',
]

// 定義公開路由（已登入使用者不應訪問）
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/callback',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 更新 Supabase 會話
  const { supabaseResponse, user } = await updateSession(request)

  // 檢查是否為受保護路由
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 檢查是否為公開路由
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 受保護路由：需要登入
  if (isProtectedRoute && !user) {
    // 儲存原始 URL 以便登入後返回
    const returnUrl = encodeURIComponent(pathname + request.nextUrl.search)
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnUrl', returnUrl)

    return NextResponse.redirect(loginUrl)
  }

  // 公開路由：已登入使用者重導向至 dashboard
  if (isPublicRoute && user && !pathname.startsWith('/auth/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 檢查會話是否即將過期（< 5 分鐘）
  if (user && supabaseResponse) {
    const sessionCookie = request.cookies.get('sb-access-token')
    if (sessionCookie) {
      try {
        // 解析 JWT 檢查過期時間
        const payload = JSON.parse(
          Buffer.from(sessionCookie.value.split('.')[1], 'base64').toString()
        )
        const expiresAt = payload.exp * 1000 // 轉換為毫秒
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        // 如果即將過期，在回應 header 中標記
        if (expiresAt - now < fiveMinutes) {
          supabaseResponse.headers.set('X-Session-Expiring', 'true')
        }
      } catch (error) {
        console.error('Failed to parse session token:', error)
      }
    }
  }

  return supabaseResponse
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
