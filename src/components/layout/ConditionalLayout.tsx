'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
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
  '/privacy',
  '/profile',
  '/reading',
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
  const isMobile = useIsMobile()
  
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

  // On mobile: show Header + MobileBottomNav, hide Footer, enable page transitions
  // On desktop: show Header + Footer as usual
  if (isMobile) {
    return (
      <>
        <Header />
        <DynamicMainContent className="pb-[calc(64px+env(safe-area-inset-bottom))]">
          <PageTransition>
            {children}
          </PageTransition>
        </DynamicMainContent>
        <MobileBottomNav 
          currentPath={pathname}
          onNavigate={handleMobileNavigate}
        />
      </>
    )
  }

  // Desktop layout (no transitions)
  return (
    <>
      <Header />
      <DynamicMainContent>
        {children}
      </DynamicMainContent>
      <Footer />
    </>
  )
}
