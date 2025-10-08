import type { Metadata } from 'next';
import { getStaticPageContent } from '@/lib/contentParser';
import StaticPageLayout from '@/components/layout/StaticPageLayout';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';

/**
 * Privacy Policy Page Metadata
 * 隱私政策頁面元資料
 */
export const metadata: Metadata = {
  title: '隱私政策 | 廢土塔羅 - 個資法合規聲明',
  description:
    '廢土塔羅隱私政策 - 嚴格遵循中華民國個人資料保護法（PDPA），詳細說明我們如何蒐集、使用、保護您的個人資料。',
  keywords: [
    '隱私政策',
    'Privacy Policy',
    '個資法',
    'PDPA',
    '資料保護',
    '個人資料',
    'GDPR',
    '第三方服務',
    'Cookie 政策',
  ],
  openGraph: {
    title: '隱私政策 - 廢土塔羅（PDPA 合規）',
    description: '了解我們如何保護您的個人資料與隱私權',
    type: 'website',
    locale: 'zh_TW',
  },
};

/**
 * Third Party Service Card Component
 * 第三方服務卡片元件
 */
interface ThirdPartyService {
  name: string;
  purpose: string;
  dataShared: string[];
  privacyPolicyUrl: string;
  location: string;
}

function ThirdPartyServiceCard({ service }: { service: ThirdPartyService }) {
  return (
    <div className="border-l-4 border-green-700 bg-green-950/20 p-4">
      <div className="mb-3 flex items-start justify-between">
        <h4 className="text-lg font-bold text-green-400">{service.name}</h4>
        <span className="rounded border border-green-800 bg-green-950/50 px-2 py-1 text-xs text-green-600">
          {service.location}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-xs font-bold text-green-700">用途：</p>
        <p className="text-sm text-green-500">{service.purpose}</p>
      </div>

      <div className="mb-3">
        <p className="text-xs font-bold text-green-700">分享資料：</p>
        <ul className="ml-4 mt-1 space-y-1">
          {service.dataShared.map((data, index) => (
            <li key={index} className="text-sm text-green-500">
              <span className="text-green-700" aria-hidden="true">
                ▸{' '}
              </span>
              {data}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <a
          href={service.privacyPolicyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-green-400 underline decoration-dotted hover:text-green-300"
        >
          查看隱私政策
          <span className="ml-1" aria-label="開啟新視窗">
            ↗
          </span>
        </a>
      </div>
    </div>
  );
}

/**
 * Privacy Policy Page Component
 * 隱私政策頁面元件
 *
 * @description
 * Server component that displays:
 * - Privacy policy content (from Markdown)
 * - Version and effective date (from frontmatter)
 * - Third-party services table (from frontmatter JSON data)
 * - Taiwan PDPA compliance statements
 */
export default function PrivacyPage() {
  // Load Markdown content and metadata
  const { metadata, content } = getStaticPageContent('privacy');

  // Extract structured data from frontmatter
  const version = metadata.version as string | undefined;
  const effectiveDate = metadata.effectiveDate as string | undefined;
  const lastUpdated = metadata.lastUpdated as string | undefined;
  const thirdPartyServices = metadata.thirdPartyServices as
    | ThirdPartyService[]
    | undefined;

  return (
    <StaticPageLayout
      title={metadata.title}
      subtitle={
        version && effectiveDate
          ? `版本 ${version} | 生效日期：${effectiveDate}`
          : undefined
      }
      variant="privacy"
    >
      {/* Version Information */}
      <div className="mb-8 border-2 border-green-800 bg-green-950/30 p-4">
        <div className="flex flex-wrap gap-4 text-sm text-green-500">
          {version && (
            <div>
              <span className="font-bold text-green-600">版本：</span>
              {version}
            </div>
          )}
          {effectiveDate && (
            <div>
              <span className="font-bold text-green-600">生效日期：</span>
              {effectiveDate}
            </div>
          )}
          {lastUpdated && (
            <div>
              <span className="font-bold text-green-600">最後更新：</span>
              {lastUpdated}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-green-700">
          <span className="text-yellow-600" aria-hidden="true">
            ⚠{' '}
          </span>
          本政策嚴格遵循中華民國《個人資料保護法》之規定
        </p>
      </div>

      {/* Main Content */}
      <MarkdownRenderer content={content} className="mb-12" />

      {/* Third-Party Services Section */}
      {thirdPartyServices && thirdPartyServices.length > 0 && (
        <section className="mb-12">
          <h2
            id="third-party-services"
            className="mb-6 border-l-4 border-green-700 pl-3 text-2xl font-bold text-green-400"
          >
            <span className="text-green-700" aria-hidden="true">
              ##{' '}
            </span>
            第三方服務商詳細清單
          </h2>
          <p className="mb-6 text-sm text-green-600">
            以下為本平台使用的所有第三方服務商，包含其用途、分享資料範圍與隱私政策連結：
          </p>
          <div className="space-y-4">
            {thirdPartyServices.map((service, index) => (
              <ThirdPartyServiceCard key={index} service={service} />
            ))}
          </div>
        </section>
      )}

      {/* User Rights Reminder */}
      <div className="mt-16 border-2 border-green-700 bg-green-950/30 p-6">
        <h3 className="mb-4 text-lg font-bold text-green-400">
          <span className="text-yellow-600" aria-hidden="true">
            ◈{' '}
          </span>
          您的權利
        </h3>
        <p className="mb-4 text-sm text-green-500">
          依據個資法第 3 條，您擁有以下權利：
        </p>
        <ul className="mb-4 space-y-2 text-sm text-green-500">
          <li>
            <span className="font-bold text-green-600">✓ 查詢權</span> -
            查詢您的個人資料
          </li>
          <li>
            <span className="font-bold text-green-600">✓ 更正權</span> -
            要求更正錯誤資料
          </li>
          <li>
            <span className="font-bold text-green-600">✓ 刪除權</span> -
            要求刪除個人資料（被遺忘權）
          </li>
          <li>
            <span className="font-bold text-green-600">✓ 停止處理權</span>{' '}
            - 要求停止特定資料處理
          </li>
          <li>
            <span className="font-bold text-green-600">✓ 資料可攜權</span>{' '}
            - 匯出您的資料（JSON/CSV 格式）
          </li>
        </ul>
        <div className="flex flex-wrap gap-4">
          <a
            href="/profile/privacy"
            className="inline-block rounded border-2 border-green-600 bg-green-700 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-green-600"
          >
            管理我的資料
          </a>
          <a
            href="/contact"
            className="inline-block rounded border-2 border-green-700 bg-transparent px-4 py-2 text-sm font-bold text-green-500 transition-colors hover:bg-green-950/50"
          >
            聯絡資料保護負責人
          </a>
        </div>
      </div>

      {/* Last Updated Notice */}
      {lastUpdated && (
        <div className="mt-8 border-t-2 border-green-900 pt-6 text-center text-xs text-green-700">
          <p>本隱私政策最後更新日期：{lastUpdated}</p>
          <p className="mt-2">
            如有任何疑問，請
            <a
              href="/contact"
              className="ml-1 underline decoration-dotted hover:text-green-500"
            >
              聯絡我們
            </a>
          </p>
        </div>
      )}
    </StaticPageLayout>
  );
}
