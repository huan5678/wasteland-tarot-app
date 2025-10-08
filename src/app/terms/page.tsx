import type { Metadata } from 'next';
import { getStaticPageContent } from '@/lib/contentParser';
import StaticPageLayout from '@/components/layout/StaticPageLayout';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';

/**
 * Terms of Service Page Metadata
 * 服務條款頁面元資料
 */
export const metadata: Metadata = {
  title: '服務條款 | 廢土塔羅 - Wasteland Protocol',
  description:
    '廢土塔羅服務條款 - Wasteland Protocol V1.0。規範用戶使用本平台的權利與義務，適用中華民國法律管轄。',
  keywords: [
    '服務條款',
    'Terms of Service',
    'Wasteland Protocol',
    '使用者協議',
    '法律條款',
    '台灣法律',
    'Karma 系統',
    '智慧財產權',
  ],
  openGraph: {
    title: '服務條款 - 廢土塔羅（Wasteland Protocol）',
    description: '了解廢土塔羅的使用規範與法律條款',
    type: 'website',
    locale: 'zh_TW',
  },
};

/**
 * Terms of Service Page Component
 * 服務條款頁面元件
 *
 * @description
 * Server component that displays:
 * - Terms of service content (from Markdown)
 * - Version name and effective date (from frontmatter)
 * - Governing law and jurisdiction (from frontmatter)
 * - Taiwan legal compliance statements
 */
export default function TermsPage() {
  // Load Markdown content and metadata
  const { metadata, content } = getStaticPageContent('terms');

  // Extract structured data from frontmatter
  const version = metadata.version as string | undefined;
  const versionName = metadata.versionName as string | undefined;
  const effectiveDate = metadata.effectiveDate as string | undefined;
  const governingLaw = metadata.governingLaw as string | undefined;
  const jurisdiction = metadata.jurisdiction as string | undefined;

  return (
    <StaticPageLayout
      title={metadata.title}
      subtitle={
        versionName && effectiveDate
          ? `${versionName} | 生效日期：${effectiveDate}`
          : undefined
      }
      variant="terms"
    >
      {/* Legal Information Header */}
      <div className="mb-8 border-2 border-green-800 bg-green-950/30 p-4">
        <div className="mb-3 grid gap-3 text-sm text-green-500 sm:grid-cols-2">
          {version && (
            <div>
              <span className="font-bold text-green-600">版本：</span>
              {version}
            </div>
          )}
          {versionName && (
            <div>
              <span className="font-bold text-green-600">版本名稱：</span>
              {versionName}
            </div>
          )}
          {effectiveDate && (
            <div>
              <span className="font-bold text-green-600">生效日期：</span>
              {effectiveDate}
            </div>
          )}
          {governingLaw && (
            <div>
              <span className="font-bold text-green-600">管轄法律：</span>
              {governingLaw}
            </div>
          )}
          {jurisdiction && (
            <div className="sm:col-span-2">
              <span className="font-bold text-green-600">管轄法院：</span>
              {jurisdiction}
            </div>
          )}
        </div>
        <div className="border-t border-green-900 pt-3 text-xs text-green-700">
          <p>
            <span className="text-red-500" aria-hidden="true">
              ⚠{' '}
            </span>
            請仔細閱讀本使用者協議。一旦使用本平台，即表示您同意本條款的所有內容。
          </p>
        </div>
      </div>

      {/* Main Content */}
      <MarkdownRenderer content={content} className="mb-12" />

      {/* Important Sections Highlight */}
      <div className="mb-12 border-2 border-yellow-700 bg-yellow-950/20 p-6">
        <h3 className="mb-4 flex items-center text-lg font-bold text-yellow-400">
          <span className="mr-2 text-xl" aria-hidden="true">
            ⚠
          </span>
          重要條款提醒
        </h3>
        <ul className="space-y-3 text-sm text-yellow-300">
          <li className="flex items-start">
            <span className="mr-2 mt-1 flex-shrink-0 text-yellow-600">
              ▸
            </span>
            <span>
              <strong>非商業性質：</strong>
              本平台為完全免費的粉絲專案，不販賣任何商品或服務。
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 mt-1 flex-shrink-0 text-yellow-600">
              ▸
            </span>
            <span>
              <strong>占卜娛樂性質：</strong>
              占卜結果僅供娛樂與參考，不應作為重大決策的唯一依據。
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 mt-1 flex-shrink-0 text-yellow-600">
              ▸
            </span>
            <span>
              <strong>智慧財產權：</strong>
              Fallout 及相關元素歸 Bethesda Softworks LLC 所有，本平台為非商業粉絲創作。
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 mt-1 flex-shrink-0 text-yellow-600">
              ▸
            </span>
            <span>
              <strong>Karma 系統：</strong>
              虛擬獎勵無實際貨幣價值，不可轉讓或交易。
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 mt-1 flex-shrink-0 text-yellow-600">
              ▸
            </span>
            <span>
              <strong>帳號終止：</strong>
              違反條款者，帳號可能被暫停或永久封禁。
            </span>
          </li>
        </ul>
      </div>

      {/* Acceptance Notice */}
      <div className="mb-12 border-2 border-green-700 bg-green-950/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-green-400">
          接受本條款
        </h3>
        <p className="mb-4 text-sm text-green-500">
          繼續使用廢土塔羅，即表示您已閱讀、理解並同意本服務條款的所有內容。
        </p>
        <blockquote className="border-l-4 border-green-700 pl-4 text-sm italic text-green-600">
          <p>
            「一旦進入廢土，就沒有回頭路。但放心，這裡比真實的輻射區安全多了。」
          </p>
          <footer className="mt-2 text-xs text-green-700">
            — 廢土塔羅團隊
          </footer>
        </blockquote>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="/"
            className="inline-block rounded border-2 border-green-600 bg-green-700 px-6 py-2 text-sm font-bold text-black transition-colors hover:bg-green-600"
          >
            <span aria-hidden="true">✓ </span>
            我同意並繼續使用
          </a>
          <a
            href="/contact"
            className="inline-block rounded border-2 border-green-700 bg-transparent px-6 py-2 text-sm font-bold text-green-500 transition-colors hover:bg-green-950/50"
          >
            我有疑問
          </a>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="border-t-2 border-green-900 pt-6">
        <div className="mb-4 text-sm text-green-600">
          <h4 className="mb-2 font-bold text-green-500">爭議解決</h4>
          <p className="mb-2">
            若對本條款有任何疑問或爭議，請先透過
            <a
              href="/contact"
              className="mx-1 underline decoration-dotted hover:text-green-400"
            >
              聯絡我們
            </a>
            進行協商。
          </p>
          {governingLaw && jurisdiction && (
            <p className="text-xs text-green-700">
              本條款受{governingLaw}管轄，雙方同意以{jurisdiction}
              為第一審管轄法院。
            </p>
          )}
        </div>

        <div className="border-t border-green-900 pt-4 text-center text-xs text-green-700">
          <p>© 2287 Wasteland Tarot - {versionName || 'V1.0'}</p>
          <p className="mt-2">
            生效日期：{effectiveDate} | 管轄法律：{governingLaw}
          </p>
        </div>
      </div>
    </StaticPageLayout>
  );
}
