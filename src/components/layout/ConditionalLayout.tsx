'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Header } from './Header'
import { FooterDrawer } from './FooterDrawer'
import { DynamicMainContent } from './DynamicMainContent'
import { PageTransition } from './PageTransition'
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useScrollRestoration } from '@/hooks/useNavigationState'

// 已知的有效路由（與 ZustandAuthProvider 同步）
const KNOWN_ROUTES = [
  '/',
  '/about',
  '/achievements',
  '/admin',
  '/auth',
  '/bingo',
  '/cards',
  '/contact',
  '/dashboard',
  '/faq',
  '/journal',
  '/offline',
  '/privacy',
  '/profile',
  '/readings',
  '/terms',
  '/test',
  '/icon-showcase',
  '/api',
]

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Enable scroll restoration for mobile
  useScrollRestoration()

  // 檢查是否為已知路由
  const isKnownRoute = KNOWN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // 如果不是已知路由（可能是 404），不顯示 Header 和 Footer
  if (!isKnownRoute) {
    return <>{children}</>
  }

  // Handle mobile navigation
  const handleMobileNavigate = (path: string) => {
    router.push(path)
  }

  // Unified responsive layout
  // Three-layer flex structure: Header -> Content (flex-1) -> Footer/MobileBottomNav
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <DynamicMainContent>
        <PageTransition>
          {children}
        </PageTransition>
      </DynamicMainContent>

      {/* Mobile: MobileBottomNav (hidden on desktop with sm:hidden) */}
      <div className="sm:hidden">
        <MobileBottomNav
          currentPath={pathname}
          onNavigate={handleMobileNavigate}
        />
      </div>

      {/* Desktop: FooterDrawer (hidden on mobile with hidden sm:block) */}
      <div className="hidden sm:block">
        <FooterDrawer />
      </div>
    </div>
  )
}
