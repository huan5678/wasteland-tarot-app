import type { Metadata } from 'next';
import { getStaticPageContent } from '@/lib/contentParser';
import StaticPageLayout from '@/components/layout/StaticPageLayout';
import FAQAccordion, { type FAQItem } from '@/components/faq/FAQAccordion';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';

/**
 * FAQ Page Metadata
 * 常見問題頁面元資料
 */
export const metadata: Metadata = {
  title: '常見問題 FAQ | 廢土塔羅 - 使用指南與疑難排解',
  description:
    '廢土塔羅常見問題集。包含 Karma 系統、AI 準確度、離線功能、帳號管理、卡牌意義等問題的詳細解答。',
  keywords: [
    '常見問題',
    'FAQ',
    'Frequently Asked Questions',
    'Karma 系統',
    'AI 占卜',
    '使用指南',
    '疑難排解',
    '教學',
    'Help',
  ],
  openGraph: {
    title: 'FAQ - 廢土塔羅常見問題',
    description: '快速找到您需要的答案',
    type: 'website',
    locale: 'zh_TW',
  },
};

/**
 * FAQ Category Component
 * FAQ 類別元件
 */
interface FAQCategory {
  id: string;
  name: string;
  icon: string;
}

function CategoryCard({ category }: { category: FAQCategory }) {
  return (
    <a
      href={`#${category.id}`}
      className="flex items-center gap-3 border-2 border-green-800 bg-green-950/20 p-4 transition-all hover:border-green-600 hover:bg-green-950/30"
    >
      <span className="text-2xl" aria-hidden="true">
        {category.icon === 'balance-scale' && '⚖️'}
        {category.icon === 'brain' && '🧠'}
        {category.icon === 'user' && '👤'}
        {category.icon === 'cards' && '🃏'}
        {category.icon === 'wrench' && '🔧'}
      </span>
      <span className="font-bold text-green-500">{category.name}</span>
      <span className="ml-auto text-green-700" aria-hidden="true">
        →
      </span>
    </a>
  );
}

/**
 * FAQ Page Component
 * 常見問題頁面元件
 *
 * @description
 * Server component that displays:
 * - FAQ introduction (from Markdown)
 * - Category navigation cards
 * - FAQ accordion by category (from frontmatter JSON data)
 * - Contact CTA for unanswered questions
 */
export default function FAQPage() {
  // Load Markdown content and metadata
  const { metadata, content } = getStaticPageContent('faq');

  // Extract structured data from frontmatter
  const categories = metadata.categories as FAQCategory[] | undefined;
  const faqs = metadata.faqs as FAQItem[] | undefined;
  const lastUpdated = metadata.lastUpdated as string | undefined;

  // Group FAQs by category
  const faqsByCategory: Record<string, FAQItem[]> = {};
  if (faqs && categories) {
    categories.forEach((cat) => {
      faqsByCategory[cat.id] = faqs.filter((faq) => faq.category === cat.id);
    });
  }

  return (
    <StaticPageLayout
      title={metadata.title}
      subtitle={
        lastUpdated
          ? `最後更新：${lastUpdated} | ${faqs?.length || 0} 個問題`
          : `${faqs?.length || 0} 個常見問題`
      }
      variant="faq"
    >
      {/* Introduction */}
      <div className="mb-12 border-l-4 border-green-700 bg-green-950/20 p-6">
        <h2 className="mb-3 text-xl font-bold text-green-400">
          <span className="text-green-700" aria-hidden="true">
            [?]{' '}
          </span>
          常見問題集
        </h2>
        <p className="mb-2 text-sm leading-relaxed text-green-500">
          這裡收錄了廢土塔羅最常被問到的問題。使用
          <kbd className="mx-1 rounded border border-green-700 bg-green-950/50 px-2 py-0.5 text-xs">
            Ctrl+F
          </kbd>
          或
          <kbd className="mx-1 rounded border border-green-700 bg-green-950/50 px-2 py-0.5 text-xs">
            Cmd+F
          </kbd>
          搜尋關鍵字，或點擊下方類別快速導航。
        </p>
        <p className="text-xs text-green-700">
          <span aria-hidden="true">&gt;</span> 找不到答案？請
          <a
            href="/contact"
            className="mx-1 underline decoration-dotted hover:text-green-500"
          >
            聯絡我們
          </a>
          ，我們會盡快回覆。
        </p>
      </div>

      {/* Category Navigation */}
      {categories && categories.length > 0 && (
        <nav
          className="mb-12"
          aria-label="FAQ 類別導航"
        >
          <h2 className="mb-4 text-lg font-bold text-green-400">
            <span className="text-green-700" aria-hidden="true">
              ▣{' '}
            </span>
            快速導航
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </nav>
      )}

      {/* Main Markdown Content (if any) */}
      {content && content.trim().length > 0 && (
        <div className="mb-12">
          <MarkdownRenderer content={content} />
        </div>
      )}

      {/* FAQ Accordions by Category */}
      {categories &&
        categories.map((category) => {
          const categoryFAQs = faqsByCategory[category.id];
          if (!categoryFAQs || categoryFAQs.length === 0) return null;

          return (
            <section key={category.id} id={category.id} className="mb-8">
              <h2 className="mb-4 flex items-center border-l-4 border-green-700 pl-3 text-2xl font-bold text-green-400">
                <span className="mr-2 text-xl" aria-hidden="true">
                  {category.icon === 'balance-scale' && '⚖️'}
                  {category.icon === 'brain' && '🧠'}
                  {category.icon === 'user' && '👤'}
                  {category.icon === 'cards' && '🃏'}
                  {category.icon === 'wrench' && '🔧'}
                </span>
                {category.name}
              </h2>
              <FAQAccordion items={categoryFAQs} defaultExpandedIndex={0} />
            </section>
          );
        })}

      {/* Still Have Questions CTA */}
      <div className="mt-16 border-2 border-green-700 bg-green-950/30 p-6 text-center">
        <h3 className="mb-3 text-lg font-bold text-green-400">
          還有其他問題？
        </h3>
        <p className="mb-4 text-sm text-green-500">
          如果以上 FAQ 沒有回答您的疑問，歡迎聯絡我們。我們會在 24
          小時內回覆您的訊息。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/contact"
            className="inline-block rounded border-2 border-green-600 bg-green-700 px-6 py-2 font-bold text-black transition-colors hover:bg-green-600"
          >
            <span aria-hidden="true">📧 </span>
            聯絡我們
          </a>
          <a
            href="/about"
            className="inline-block rounded border-2 border-green-700 bg-transparent px-6 py-2 font-bold text-green-500 transition-colors hover:bg-green-950/50"
          >
            關於我們
          </a>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mt-12 border-t-2 border-green-900 pt-8">
        <h3 className="mb-4 text-lg font-bold text-green-400">
          其他資源
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <a
            href="/privacy"
            className="block border border-green-800 bg-green-950/20 p-4 transition-colors hover:border-green-600 hover:bg-green-950/30"
          >
            <h4 className="mb-2 font-bold text-green-500">隱私政策</h4>
            <p className="text-xs text-green-600">
              了解我們如何保護您的資料
            </p>
          </a>
          <a
            href="/terms"
            className="block border border-green-800 bg-green-950/20 p-4 transition-colors hover:border-green-600 hover:bg-green-950/30"
          >
            <h4 className="mb-2 font-bold text-green-500">服務條款</h4>
            <p className="text-xs text-green-600">
              平台使用規範與法律條款
            </p>
          </a>
          <a
            href="/readings/new"
            className="block border border-green-800 bg-green-950/20 p-4 transition-colors hover:border-green-600 hover:bg-green-950/30"
          >
            <h4 className="mb-2 font-bold text-green-500">開始占卜</h4>
            <p className="text-xs text-green-600">
              準備好探索命運了嗎？
            </p>
          </a>
        </div>
      </div>

      {/* Last Updated Notice */}
      {lastUpdated && (
        <div className="mt-8 border-t-2 border-green-900 pt-6 text-center text-xs text-green-700">
          <p>本 FAQ 最後更新日期：{lastUpdated}</p>
          <p className="mt-2">
            問題清單會持續更新，建議加入書籤以便隨時查閱。
          </p>
        </div>
      )}
    </StaticPageLayout>
  );
}
