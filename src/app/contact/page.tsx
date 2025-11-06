import type { Metadata } from 'next';
import StaticPageLayout from '@/components/layout/StaticPageLayout';
import ContactForm from '@/components/forms/ContactForm';
import { PixelIcon } from '@/components/ui/icons';

/**
 * Contact Page Metadata
 * 聯絡頁面元資料
 */
export const metadata: Metadata = {
  title: '聯絡我們 | 廢土塔羅 - 技術支援與客服',
  description:
    '聯絡廢土塔羅團隊。提供技術支援、帳號問題處理、建議回饋等服務。我們會在 24 小時內回覆您的訊息。',
  keywords: [
    '聯絡我們',
    'Contact Us',
    '客服',
    '技術支援',
    '帳號問題',
    '建議回饋',
    '意見反饋',
    'Support',
  ],
  openGraph: {
    title: '聯絡我們 - 廢土塔羅',
    description: '需要協助？聯絡我們的團隊',
    type: 'website',
    locale: 'zh_TW',
  },
};

/**
 * Contact Information Card Component
 * 聯絡資訊卡片元件
 */
interface ContactMethod {
  icon: string;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

function ContactMethodCard({ method }: { method: ContactMethod }) {
  return (
    <div className="border-2 border-green-800 bg-green-950/20 p-4 transition-colors hover:border-green-600 hover:bg-green-950/30">
      <div className="mb-2 text-green-600">
        <PixelIcon name={method.icon as any} size={32} decorative />
      </div>
      <h3 className="mb-2 text-lg font-bold text-green-400">
        {method.title}
      </h3>
      <p className="mb-3 text-sm text-green-500">{method.description}</p>
      {method.link && method.linkText && (
        <a
          href={method.link}
          className="text-sm text-green-400 underline decoration-dotted hover:text-green-300"
          {...(method.link.startsWith('http')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {method.linkText}
          {method.link.startsWith('http') && (
            <span className="ml-1" aria-label="開啟新視窗">
              ↗
            </span>
          )}
        </a>
      )}
    </div>
  );
}

/**
 * Contact Page Component
 * 聯絡頁面元件
 *
 * @description
 * Server component that displays:
 * - Contact form (Client Component)
 * - Multiple contact methods
 * - Response time information
 * - Support categories
 */
export default function ContactPage() {
  const contactMethods: ContactMethod[] = [
    {
      icon: 'mail',
      title: '電子郵件',
      description: '一般諮詢與問題回報',
      link: 'mailto:support@wasteland-tarot.vault',
      linkText: 'support@wasteland-tarot.vault',
    },
    {
      icon: 'bug',
      title: 'Bug 回報',
      description: '發現技術問題或錯誤',
      link: 'mailto:bugs@wasteland-tarot.vault',
      linkText: 'bugs@wasteland-tarot.vault',
    },
    {
      icon: 'lightbulb',
      title: '功能建議',
      description: '分享您的創意與想法',
      link: 'mailto:feedback@wasteland-tarot.vault',
      linkText: 'feedback@wasteland-tarot.vault',
    },
    {
      icon: 'file-text',
      title: '法律相關',
      description: '隱私、條款與智財問題',
      link: 'mailto:legal@wasteland-tarot.vault',
      linkText: 'legal@wasteland-tarot.vault',
    },
  ];

  return (
    <StaticPageLayout
      title="聯絡我們"
      subtitle="Incoming Signal... Awaiting Transmission"
      variant="contact"
    >
      {/* Introduction */}
      <div className="mb-12 border-l-4 border-green-700 bg-green-950/20 p-6">
        <h2 className="mb-3 text-xl font-bold text-green-400">
          <span className="text-green-700" aria-hidden="true">
            [COMM]{' '}
          </span>
          歡迎聯絡廢土塔羅團隊
        </h2>
        <p className="mb-2 text-sm leading-relaxed text-green-500">
          無論您遇到技術問題、需要帳號協助，或想分享建議與回饋，我們都樂意為您服務。請填寫以下表單，我們會在
          <strong className="text-green-400"> 24 小時內</strong>
          回覆您的訊息。
        </p>
        <p className="text-xs text-green-700">
          <span aria-hidden="true">&gt;</span> 請注意：本平台為非商業粉絲專案，所有服務完全免費。
        </p>
      </div>

      {/* Contact Form */}
      <div className="mb-12">
        <ContactForm />
      </div>

      {/* Alternative Contact Methods */}
      <section className="mb-12">
        <h2 className="mb-6 border-l-4 border-green-700 pl-3 text-2xl font-bold text-green-400">
          <span className="text-green-700" aria-hidden="true">
            ##{' '}
          </span>
          其他聯絡方式
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {contactMethods.map((method, index) => (
            <ContactMethodCard key={index} method={method} />
          ))}
        </div>
      </section>

      {/* Support Categories */}
      <section className="mb-12">
        <h2 className="mb-6 border-l-4 border-green-700 pl-3 text-2xl font-bold text-green-400">
          <span className="text-green-700" aria-hidden="true">
            ##{' '}
          </span>
          常見問題類別
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-green-800 bg-green-950/20 p-4">
            <h3 className="mb-2 font-bold text-green-500">技術問題</h3>
            <ul className="space-y-1 text-xs text-green-600">
              <li>• 登入困難</li>
              <li>• 頁面載入錯誤</li>
              <li>• 功能異常</li>
              <li>• 瀏覽器相容性</li>
            </ul>
          </div>
          <div className="border border-green-800 bg-green-950/20 p-4">
            <h3 className="mb-2 font-bold text-green-500">帳號問題</h3>
            <ul className="space-y-1 text-xs text-green-600">
              <li>• 密碼重設</li>
              <li>• 帳號停權申訴</li>
              <li>• 資料匯出</li>
              <li>• 帳號刪除</li>
            </ul>
          </div>
          <div className="border border-green-800 bg-green-950/20 p-4">
            <h3 className="mb-2 font-bold text-green-500">建議回饋</h3>
            <ul className="space-y-1 text-xs text-green-600">
              <li>• 新功能建議</li>
              <li>• UI/UX 改善</li>
              <li>• 內容建議</li>
              <li>• 合作提案</li>
            </ul>
          </div>
          <div className="border border-green-800 bg-green-950/20 p-4">
            <h3 className="mb-2 font-bold text-green-500">其他</h3>
            <ul className="space-y-1 text-xs text-green-600">
              <li>• 媒體報導</li>
              <li>• 商業授權</li>
              <li>• 學術研究</li>
              <li>• 一般諮詢</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <div className="border-2 border-green-700 bg-green-950/30 p-6 text-center">
        <h3 className="mb-3 text-lg font-bold text-green-400">
          找不到答案？
        </h3>
        <p className="mb-4 text-sm text-green-500">
          在聯絡我們之前，建議先查看常見問題（FAQ），您的問題可能已經有解答。
        </p>
        <a
          href="/faq"
          className="inline-block rounded border-2 border-green-600 bg-green-700 px-6 py-2 font-bold text-black transition-colors hover:bg-green-600"
        >
          <span aria-hidden="true">? </span>
          查看常見問題
        </a>
      </div>

      {/* Response Time Notice */}
      <div className="mt-8 border-t-2 border-green-900 pt-6 text-center text-xs text-green-700">
        <p className="mb-2">
          <span className="font-bold text-green-600">回覆時間：</span>
          我們通常在 24 小時內回覆（工作日）
        </p>
        <p>
          <span className="font-bold text-green-600">緊急支援：</span>
          如遇重大安全問題，請發送至 security@wasteland-tarot.vault
        </p>
      </div>
    </StaticPageLayout>
  );
}
