import Link from 'next/link';

/**
 * Static Page Variant Types
 * 靜態頁面變體類型
 */
export type StaticPageVariant = 'about' | 'privacy' | 'terms' | 'contact' | 'faq';

/**
 * Static Page Layout Props
 * 靜態頁面佈局元件屬性
 */
export interface StaticPageLayoutProps {
  /** Page title displayed in header (頁面標題) */
  title: string;

  /** Optional subtitle or tagline (副標題或標語) */
  subtitle?: string;

  /** Page variant for specific styling (頁面變體，用於特定樣式) */
  variant?: StaticPageVariant;

  /** Page content (頁面內容) */
  children: React.ReactNode;

  /** Optional breadcrumb override (自訂麵包屑) */
  breadcrumbLabel?: string;
}

/**
 * Get ASCII art decoration based on page variant
 * 根據頁面變體取得 ASCII 藝術裝飾
 */
function getAsciiDecoration(variant?: StaticPageVariant): string {
  switch (variant) {
    case 'about':
      return '═══════════════════════════════';
    case 'privacy':
      return '▓▓▓▓▓ CLASSIFIED ▓▓▓▓▓';
    case 'terms':
      return '╔════════════════════════════╗';
    case 'contact':
      return '<<<═══ INCOMING SIGNAL ═══>>>';
    case 'faq':
      return '? ? ? ? ? ? ? ? ? ? ? ? ? ? ?';
    default:
      return '═══════════════════════════════';
  }
}

/**
 * Get terminal prefix based on page variant
 * 根據頁面變體取得終端機前綴
 */
function getTerminalPrefix(variant?: StaticPageVariant): string {
  switch (variant) {
    case 'about':
      return '[INFO]';
    case 'privacy':
      return '[SECURE]';
    case 'terms':
      return '[LEGAL]';
    case 'contact':
      return '[COMM]';
    case 'faq':
      return '[HELP]';
    default:
      return '[SYSTEM]';
  }
}

/**
 * Static Page Layout Component
 * 靜態頁面統一佈局元件
 *
 * @description
 * Provides consistent layout for all static information pages with:
 * - Dithered background effect
 * - Terminal-style header with ASCII art
 * - Breadcrumb navigation
 * - Pip-Boy green color scheme
 * - Monospace font styling
 * - Responsive container with max-width
 *
 * @example
 * ```tsx
 * <StaticPageLayout
 *   title="關於我們"
 *   subtitle="廢土倖存者日誌 - Entry #001"
 *   variant="about"
 * >
 *   <p>Page content here...</p>
 * </StaticPageLayout>
 * ```
 *
 * @component
 * @since 1.0.0
 */
export default function StaticPageLayout({
  title,
  subtitle,
  variant,
  children,
  breadcrumbLabel,
}: StaticPageLayoutProps) {
  const asciiDecoration = getAsciiDecoration(variant);
  const terminalPrefix = getTerminalPrefix(variant);
  const displayBreadcrumb = breadcrumbLabel || title;

  return (
    <div className="relative min-h-screen bg-black text-green-500">
      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-12">
        {/* Breadcrumb Navigation */}
        <nav
          className="mb-8 text-sm text-green-600"
          aria-label="麵包屑導航"
        >
          <ol className="flex items-center space-x-2">
            <li>
              <Link
                href="/"
                className="hover:text-green-400 transition-colors underline decoration-dotted"
              >
                首頁
              </Link>
            </li>
            <li aria-hidden="true">&gt;</li>
            <li aria-current="page" className="text-green-500">
              {displayBreadcrumb}
            </li>
          </ol>
        </nav>

        {/* Terminal-Style Page Header */}
        <header className="mb-12 border-2 border-green-600 bg-black/80 p-6">
          {/* ASCII Decoration */}
          <div
            className="mb-4 text-center text-xs text-green-700"
            aria-hidden="true"
          >
            {asciiDecoration}
          </div>

          {/* Terminal Prefix + Title */}
          <h1 className="mb-2 text-2xl font-bold text-green-500 sm:text-3xl">
            <span className="text-green-700">{terminalPrefix}</span>{' '}
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-green-600 sm:text-base">{subtitle}</p>
          )}

          {/* Bottom ASCII Decoration */}
          <div
            className="mt-4 text-center text-xs text-green-700"
            aria-hidden="true"
          >
            {asciiDecoration}
          </div>

          {/* Terminal Prompt Indicator */}
          <div className="mt-4 flex items-center text-xs text-green-700">
            <span aria-hidden="true">&gt;_</span>
            <span className="ml-2 animate-pulse">█</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="text-green-500">{children}</main>

        {/* Terminal Footer */}
        <footer className="mt-16 border-t-2 border-green-900 pt-8 text-center text-xs text-green-700">
          <p>
            <span aria-hidden="true">&gt;&gt;&gt;</span>{' '}
            <span className="text-green-600">END OF DOCUMENT</span>{' '}
            <span aria-hidden="true">&lt;&lt;&lt;</span>
          </p>
          <p className="mt-2">
            © 2287 Wasteland Tarot - 廢土塔羅 |{' '}
            <Link
              href="/"
              className="underline decoration-dotted hover:text-green-500"
            >
              返回首頁
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
