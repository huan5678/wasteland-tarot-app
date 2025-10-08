import type { Metadata } from 'next';
import { getStaticPageContent } from '@/lib/contentParser';
import StaticPageLayout from '@/components/layout/StaticPageLayout';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';

/**
 * About Page Metadata
 * 關於我們頁面元資料
 */
export const metadata: Metadata = {
  title: '關於我們 | 廢土塔羅 - Wasteland Tarot',
  description:
    '了解廢土塔羅的起源故事、團隊成員與平台發展歷程。一個結合 Fallout 宇宙觀與塔羅占卜的非商業粉絲專案。',
  keywords: [
    '廢土塔羅',
    'Wasteland Tarot',
    'Fallout 塔羅',
    '關於我們',
    '團隊介紹',
    '平台歷史',
    '粉絲專案',
  ],
  openGraph: {
    title: '關於我們 - 廢土塔羅',
    description: '探索廢土塔羅的起源故事與團隊成員',
    type: 'website',
    locale: 'zh_TW',
  },
};

/**
 * Team Member Card Component
 * 團隊成員卡片元件
 */
interface TeamMember {
  id: string;
  name: string;
  role: string;
  englishRole: string;
  bio: string;
  specialties: string[];
  falloutQuote: string;
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="group border-2 border-green-800 bg-black/80 p-6 transition-all hover:border-green-600 hover:bg-green-950/20">
      {/* Member Header */}
      <div className="mb-4 border-b-2 border-green-900 pb-3">
        <h3 className="text-xl font-bold text-green-400">{member.name}</h3>
        <p className="mt-1 text-sm text-green-600">
          {member.role}
          <span className="ml-2 text-xs text-green-700">
            ({member.englishRole})
          </span>
        </p>
      </div>

      {/* Bio */}
      <p className="mb-4 text-sm leading-relaxed text-green-500">
        {member.bio}
      </p>

      {/* Specialties */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-bold text-green-700">
          <span aria-hidden="true">&gt;</span> 專長領域
        </p>
        <div className="flex flex-wrap gap-2">
          {member.specialties.map((specialty, index) => (
            <span
              key={index}
              className="rounded border border-green-800 bg-green-950/50 px-2 py-1 text-xs text-green-600"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>

      {/* Quote */}
      <blockquote className="border-l-2 border-green-700 pl-3 text-xs italic text-green-600">
        {member.falloutQuote}
      </blockquote>
    </div>
  );
}

/**
 * Timeline Event Component
 * 時間軸事件元件
 */
interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  icon: string;
}

function TimelineEvent({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      {!isLast && (
        <div
          className="absolute left-4 top-12 h-full w-0.5 bg-green-900"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-700 bg-black text-sm text-green-600">
        {event.icon === 'flag' && '⚑'}
        {event.icon === 'star' && '★'}
        {event.icon === 'monitor' && '▣'}
        {event.icon === 'cpu' && '◎'}
        {event.icon === 'users' && '▣'}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="mb-2">
          <span className="text-sm font-bold text-green-700">{event.year}</span>
          <h4 className="mt-1 text-lg font-bold text-green-400">
            {event.title}
          </h4>
        </div>
        <p className="text-sm leading-relaxed text-green-500">
          {event.description}
        </p>
      </div>
    </div>
  );
}

/**
 * About Page Component
 * 關於我們頁面元件
 *
 * @description
 * Server component that displays:
 * - Origin story and mission statement (from Markdown content)
 * - Team member cards (from frontmatter JSON data)
 * - Platform development timeline (from frontmatter JSON data)
 * - Last updated date (from frontmatter metadata)
 */
export default function AboutPage() {
  // Load Markdown content and metadata
  const { metadata, content } = getStaticPageContent('about');

  // Extract structured data from frontmatter
  const team = metadata.team as TeamMember[] | undefined;
  const timeline = metadata.timeline as TimelineEvent[] | undefined;
  const lastUpdated = metadata.lastUpdated as string | undefined;

  return (
    <StaticPageLayout
      title={metadata.title}
      subtitle={lastUpdated ? `最後更新：${lastUpdated}` : undefined}
      variant="about"
    >
      {/* Main Content */}
      <MarkdownRenderer content={content} className="mb-12" />

      {/* Team Members Section */}
      {team && team.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 border-l-4 border-green-700 pl-3 text-2xl font-bold text-green-400">
            <span className="text-green-700" aria-hidden="true">
              ##{' '}
            </span>
            團隊成員
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {timeline && timeline.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 border-l-4 border-green-700 pl-3 text-2xl font-bold text-green-400">
            <span className="text-green-700" aria-hidden="true">
              ##{' '}
            </span>
            平台發展時間軸
          </h2>
          <div className="border-l-2 border-green-900 pl-4">
            {timeline.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isLast={index === timeline.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <div className="mt-16 border-2 border-green-700 bg-green-950/30 p-6 text-center">
        <p className="mb-4 text-lg font-bold text-green-400">
          準備好開始你的占卜之旅了嗎？
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/readings/new"
            className="inline-block rounded border-2 border-green-600 bg-green-700 px-6 py-2 font-bold text-black transition-colors hover:bg-green-600"
          >
            <span aria-hidden="true">▶ </span>
            前往占卜
          </a>
          <a
            href="/cards"
            className="inline-block rounded border-2 border-green-700 bg-transparent px-6 py-2 font-bold text-green-500 transition-colors hover:bg-green-950/50"
          >
            探索卡牌
          </a>
          <a
            href="/contact"
            className="inline-block rounded border-2 border-green-700 bg-transparent px-6 py-2 font-bold text-green-500 transition-colors hover:bg-green-950/50"
          >
            聯絡我們
          </a>
        </div>
      </div>
    </StaticPageLayout>
  );
}
