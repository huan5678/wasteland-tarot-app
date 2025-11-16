# Requirements Document - Landing Page Optimization

## Introduction

本需求文件定義了廢土塔羅平台的首頁登陸頁面完善專案。當前首頁（`src/app/client-page.tsx`）僅包含 Hero Section、Features Section 和 Call to Action 三個區塊，缺少現代登陸頁面的標準區塊，導致轉換率和使用者信任度不足。

本專案旨在補齊 8 個標準登陸頁面區塊，遵循 2025 年登陸頁面最佳實踐，同時保持 Fallout 廢土塔羅主題的設計風格。專案將復用現有元件（FAQAccordion、ContactForm）並新建共用元件（StepCard、StatCounter、ComparisonTable、TestimonialCard），以提升程式碼可維護性和一致性。

**核心目標**：
- 提高使用者轉換率（註冊、快速占卜）
- 建立品牌信任度與專業形象
- 提供完整的產品價值主張
- 遵循 SEO 最佳實踐（Server Component + Client Component 架構）

**專案範圍**：
- 前端：新增 8 個登陸頁面區塊元件
- 後端：新增統計數據 API（`/api/v1/landing-stats`）
- 共用元件：抽取可復用元件至 `src/components/landing/`

## Requirements

### Requirement 1: 區塊一 - Hero Section 優化

**使用者故事**: As a visitor, I want to see an enhanced hero section with dynamic titles and clear value propositions, so that I can immediately understand the platform's unique offering.

#### Acceptance Criteria

1. WHEN the user loads the homepage, the Landing Page Client Component SHALL display the existing `DynamicHeroTitle` component with animated typing effects
2. WHEN the hero section is rendered, the Landing Page Client Component SHALL display the terminal status banner (VAULT-TEC PIP-BOY 3000 MARK IV) with responsive breakpoints (full text on desktop, abbreviated on mobile)
3. WHEN the user views the hero section, the Landing Page Client Component SHALL display two primary action buttons with Fallout-themed styling (Pip-Boy green and Radiation orange color schemes)
4. WHEN the user hovers over action buttons, the Landing Page Client Component SHALL trigger scanline animations and color transitions
5. WHEN the user is not logged in, the Landing Page Client Component SHALL display "進入 Vault" and "快速占卜" as button labels
6. WHEN the user is logged in, the Landing Page Client Component SHALL display "進入控制台" and "新占卜" as button labels
7. The Landing Page Client Component SHALL maintain pixel-perfect Pip-Boy aesthetic with CRT scanline effects as background

### Requirement 2: 區塊二 - How It Works (使用流程)

**使用者故事**: As a new user, I want to understand the tarot reading process in 3-4 simple steps, so that I know what to expect before starting.

#### Acceptance Criteria

1. WHEN the user views the "How It Works" section, the Landing Page Client Component SHALL display a visual step-by-step guide with 4 steps using the `StepCard` shared component
2. WHEN each step card is rendered, the `StepCard` Component SHALL display step number, icon (using PixelIcon), title, and description in Traditional Chinese
3. WHEN the section is loaded, the Landing Page Client Component SHALL display the following steps in sequence:
   - Step 1: 選擇牌陣 (icon: "layout-grid", title: "選擇牌陣", description: "從多種廢土主題牌陣中選擇適合的占卜方式")
   - Step 2: 輻射洗牌 (icon: "shuffle", title: "輻射洗牌", description: "使用獨特的輻射洗牌機制打亂塔羅牌")
   - Step 3: 抽牌占卜 (icon: "hand", title: "抽牌占卜", description: "根據牌陣位置抽取塔羅牌")
   - Step 4: AI 解讀 (icon: "cpu", title: "AI 解讀", description: "多家 AI 供應商提供角色化的占卜解讀")
4. WHEN the step cards are displayed on desktop, the Landing Page Client Component SHALL arrange them in a horizontal layout (4 columns grid)
5. WHEN the step cards are displayed on mobile, the Landing Page Client Component SHALL arrange them in a vertical layout (1 column grid)
6. WHEN a step card is hovered (desktop), the `StepCard` Component SHALL apply scale transform and glow effect transitions
7. WHERE the `StepCard` component is used, it SHALL accept props: `stepNumber: number`, `icon: string`, `title: string`, `description: string`
8. The `StepCard` Component SHALL be created at path `src/components/landing/StepCard.tsx` with TypeScript interface `StepCardProps`
9. The `StepCard` Component SHALL use Pip-Boy themed styling with border-2 border-pip-boy-green and background color var(--color-pip-boy-green-10)

### Requirement 3: 區塊三 - Features Grid 重構

**使用者故事**: As a user, I want to see the platform's key features presented in an organized grid, so that I can quickly understand the value propositions.

#### Acceptance Criteria

1. WHEN the features section is rendered, the Landing Page Client Component SHALL maintain the existing 3 feature cards layout (量子占卜、占卜分析、廢土主題)
2. WHEN the features section is displayed, the Landing Page Client Component SHALL use the existing `PipBoyCard` component for each feature
3. WHEN each feature card is rendered, the Landing Page Client Component SHALL display an icon using `PixelIcon` component with size 40px and decorative attribute
4. WHEN the features section is displayed on desktop, the Landing Page Client Component SHALL arrange cards in a 3-column grid layout (grid-cols-3)
5. WHEN the features section is displayed on mobile, the Landing Page Client Component SHALL arrange cards in a 1-column grid layout (grid-cols-1)
6. The Landing Page Client Component SHALL maintain the existing section background color (var(--color-pip-boy-green-5)) and border-t-2 border-pip-boy-green styling
7. WHEN a feature card is hovered, the `PipBoyCard` Component SHALL apply hover state transitions (border color and background opacity changes)
8. The Landing Page Client Component SHALL display section title "終端機功能" and subtitle "由戰前量子計算技術驅動" in centered layout

### Requirement 4: 區塊四 - Social Proof (使用者見證)

**使用者故事**: As a potential user, I want to see testimonials from existing users, so that I can trust the platform's quality and effectiveness.

#### Acceptance Criteria

1. WHEN the user views the social proof section, the Landing Page Client Component SHALL display a testimonials carousel with 6 user reviews using the `TestimonialCard` shared component
2. WHEN each testimonial card is rendered, the `TestimonialCard` Component SHALL display user avatar (using Fallout character icons from PixelIcon), username, rating (0-5 stars using PixelIcon name="star"), and review text
3. WHEN the testimonials section is loaded, the Landing Page Client Component SHALL display the following 6 testimonials in Traditional Chinese with Fallout-themed usernames and reviews:
   - User 1: username: "避難所111號倖存者", rating: 5, review: "這個平台的 AI 占卜準到可怕，幫我在廢土中找到正確的生存方向！"
   - User 2: username: "鋼鐵兄弟會書記員", rating: 5, review: "量子占卜系統整合了戰前科技與神秘學，非常符合我們的理念。"
   - User 3: username: "NCR 偵察兵", rating: 4, review: "介面設計很有 Pip-Boy 的感覺，占卜結果也很有參考價值。"
   - User 4: username: "廢土商隊領袖", rating: 5, review: "每次做重大決策前都會來占卜，業力系統幫助我維持正面形象。"
   - User 5: username: "獨行旅者", rating: 4, review: "快速占卜功能很實用，不需註冊就能體驗，推薦給新手。"
   - User 6: username: "Vault-Tec 工程師", rating: 5, review: "技術實現很扎實，多 AI 供應商支援確保服務穩定性。"
4. WHEN the testimonials section is displayed on desktop, the Landing Page Client Component SHALL display 3 testimonial cards per row (grid-cols-3)
5. WHEN the testimonials section is displayed on tablet, the Landing Page Client Component SHALL display 2 testimonial cards per row (grid-cols-2)
6. WHEN the testimonials section is displayed on mobile, the Landing Page Client Component SHALL display 1 testimonial card per row (grid-cols-1)
7. WHERE the `TestimonialCard` component is used, it SHALL accept props: `avatar: string` (PixelIcon name), `username: string`, `rating: number` (0-5), `review: string`
8. The `TestimonialCard` Component SHALL be created at path `src/components/landing/TestimonialCard.tsx` with TypeScript interface `TestimonialCardProps`
9. WHEN the rating is rendered, the `TestimonialCard` Component SHALL display filled stars (PixelIcon name="star-fill" variant="primary") for the rating value and empty stars (PixelIcon name="star" variant="muted") for remaining stars
10. The `TestimonialCard` Component SHALL use PipBoyCard as base component with border-2 border-pip-boy-green and background var(--color-pip-boy-green-10)

### Requirement 5: 區塊五 - Stats Counter (數據統計)

**使用者故事**: As a visitor, I want to see platform usage statistics, so that I can understand the platform's popularity and reliability.

#### Acceptance Criteria

1. WHEN the user views the stats counter section, the Landing Page Client Component SHALL fetch real-time statistics from the Landing Stats API (`/api/v1/landing-stats`)
2. WHEN the API request succeeds, the Landing Page Client Component SHALL display 4 statistics using the `StatCounter` shared component:
   - Total users (總用戶數)
   - Total readings (總占卜次數)
   - Cards in deck (卡牌總數: 78)
   - AI providers (AI 供應商數: 3)
3. WHEN each stat counter is rendered, the `StatCounter` Component SHALL display an icon (using PixelIcon), numeric value with animated counting effect, and label text
4. WHEN the component mounts, the `StatCounter` Component SHALL animate the counter from 0 to the target value over 2 seconds using easing function
5. WHEN the stats section is displayed on desktop, the Landing Page Client Component SHALL arrange counters in a 4-column grid layout (grid-cols-4)
6. WHEN the stats section is displayed on mobile, the Landing Page Client Component SHALL arrange counters in a 2-column grid layout (grid-cols-2)
7. WHEN the API request fails, the Landing Page Client Component SHALL display fallback values: users: 1000, readings: 5000, cards: 78, providers: 3
8. WHERE the `StatCounter` component is used, it SHALL accept props: `icon: string`, `value: number`, `label: string`, `suffix?: string` (optional, e.g., "+")
9. The `StatCounter` Component SHALL be created at path `src/components/landing/StatCounter.tsx` with TypeScript interface `StatCounterProps`
10. The `StatCounter` Component SHALL use Pip-Boy themed styling with large font size (text-4xl) for numbers and smaller size (text-sm) for labels
11. WHEN the Landing Stats API endpoint (`/api/v1/landing-stats`) is called, the Landing Stats Service SHALL return a JSON response with structure: `{ users: number, readings: number, cards: number, providers: number }`
12. The Landing Stats Service SHALL be implemented in backend at path `backend/app/api/v1/endpoints/landing_stats.py` with FastAPI router
13. WHEN the Landing Stats Service queries the database, it SHALL execute COUNT queries for users table and readings table using SQLAlchemy ORM
14. The Landing Stats Service SHALL return static values for cards (78) and providers (3) as these are product constants

### Requirement 6: 區塊六 - FAQ Section

**使用者故事**: As a user, I want to find answers to common questions, so that I can resolve doubts without contacting support.

#### Acceptance Criteria

1. WHEN the user views the FAQ section, the Landing Page Client Component SHALL display the existing `FAQAccordion` component from path `src/components/faq/FAQAccordion.tsx`
2. WHEN the FAQ section is rendered, the Landing Page Client Component SHALL pass 8 frequently asked questions with Fallout-themed content in Traditional Chinese to the FAQAccordion component
3. WHEN the FAQ section is loaded, the Landing Page Client Component SHALL provide the following FAQ items:
   - Q1: question: "什麼是廢土塔羅？", answer: "廢土塔羅是結合 Fallout 世界觀與傳統塔羅占卜的獨特平台，透過 AI 技術提供角色化的占卜解讀，幫助你在廢土世界中找到生存智慧與靈性指引。"
   - Q2: question: "我需要註冊才能使用嗎？", answer: "不需要！我們提供快速占卜功能，讓你免註冊即可體驗。註冊帳號後可以儲存占卜記錄、追蹤業力進展、解鎖更多牌陣。"
   - Q3: question: "什麼是業力系統？", answer: "業力系統追蹤你的行為和決策，從非常善良到非常邪惡分為 5 個等級。你的業力會影響 AI 解讀的風格和建議方向。"
   - Q4: question: "支援哪些 AI 供應商？", answer: "我們支援 Anthropic Claude、OpenAI GPT 和 Google Gemini 三家 AI 供應商，提供多樣化的角色聲音解讀（如 Mr. Handy、鋼鐵兄弟會書記員）。"
   - Q5: question: "卡牌有什麼特色？", answer: "我們擁有 78 張完整的 Fallout 主題塔羅牌，包含大阿爾克那（Fallout 角色原型）和小阿爾克那四組花色：落塵可樂瓶（聖杯）、戰鬥武器（權杖）、瓶蓋（錢幣）、輻射棒（寶劍）。"
   - Q6: question: "占卜結果準確嗎？", answer: "我們的 AI 解讀系統整合了傳統塔羅智慧與 Fallout 世界觀，提供具有參考價值的洞察。但請記住，占卜是引導工具，最終決策權在你手中。"
   - Q7: question: "這個平台免費嗎？", answer: "是的！廢土塔羅是非商業粉絲專案，所有核心功能完全免費。我們可能在未來推出進階功能（延長歷史記錄、高級牌陣），但基本服務永久免費。"
   - Q8: question: "如何聯絡客服？", answer: "遇到問題可以填寫聯絡表單或發送郵件至 support@wasteland-tarot.vault，我們會在 24 小時內回覆。"
4. WHEN a FAQ item is clicked, the `FAQAccordion` Component SHALL expand to show the answer with smooth animation transition
5. WHEN another FAQ item is clicked, the `FAQAccordion` Component SHALL collapse the previously opened item and expand the newly clicked item (accordion behavior)
6. The Landing Page Client Component SHALL display the FAQ section with title "常見問題" and subtitle "Frequently Asked Questions" in centered layout
7. The Landing Page Client Component SHALL apply Pip-Boy themed styling to the FAQ section with border-t-2 border-pip-boy-green and background var(--color-pip-boy-green-5)

### Requirement 7: 區塊七 - CTA Section (行動呼籲)

**使用者故事**: As a visitor, I want to see clear calls-to-action throughout the page, so that I can easily start using the platform.

#### Acceptance Criteria

1. WHEN the user views the CTA section, the Landing Page Client Component SHALL display the existing CTA section with title "準備好探索你的廢土命運了嗎？" and subtitle "加入數千名信賴塔羅智慧做出生存決策的 Vault Dweller"
2. WHEN the CTA section is rendered, the Landing Page Client Component SHALL display two action buttons using the existing `PipBoyButton` component: "註冊 Vault 帳號" (default variant) and "瀏覽卡牌圖書館" (outline variant)
3. WHEN the "註冊 Vault 帳號" button is clicked, the Landing Page Client Component SHALL navigate to `/auth/register` using `window.location.href`
4. WHEN the "瀏覽卡牌圖書館" button is clicked, the Landing Page Client Component SHALL navigate to `/cards` using `window.location.href`
5. WHEN the CTA section is displayed, the Landing Page Client Component SHALL apply border-2 border-pip-boy-green, padding p-8, and background color var(--color-pip-boy-green-10)
6. WHEN a CTA button is hovered, the `PipBoyButton` Component SHALL apply scale transform hover:scale-105
7. WHEN the CTA section is displayed on desktop, the Landing Page Client Component SHALL arrange buttons horizontally (flex-row)
8. WHEN the CTA section is displayed on mobile, the Landing Page Client Component SHALL arrange buttons vertically (flex-col)
9. The Landing Page Client Component SHALL maintain the existing CTA section layout with max-w-4xl mx-auto container and centered text alignment

### Requirement 8: 區塊八 - Footer Enhancement (頁尾強化)

**使用者故事**: As a user, I want to access important links and information in the footer, so that I can navigate to legal pages and social media.

#### Acceptance Criteria

1. WHEN the user scrolls to the footer, the Landing Page Client Component SHALL display a comprehensive footer with 4 columns of links and information
2. WHEN the footer is rendered, the Landing Page Client Component SHALL display the following link sections using array mapping pattern:
   - Section 1: title: "產品", links: [{ label: "首頁", href: "/" }, { label: "卡牌圖書館", href: "/cards" }, { label: "開始占卜", href: "/readings/new" }, { label: "快速占卜", href: "/readings/quick" }]
   - Section 2: title: "資訊", links: [{ label: "關於我們", href: "/about" }, { label: "常見問題", href: "/faq" }, { label: "聯絡我們", href: "/contact" }]
   - Section 3: title: "法律", links: [{ label: "隱私政策", href: "/privacy" }, { label: "服務條款", href: "/terms" }]
   - Section 4: title: "社群", links: [{ label: "Discord", href: "#", external: true }, { label: "GitHub", href: "#", external: true }]
3. WHEN a footer link is clicked AND the link has external: true property, the Landing Page Client Component SHALL open the link in a new tab with rel="noopener noreferrer"
4. WHEN the footer is rendered, the Landing Page Client Component SHALL display the Vault-Tec disclaimer: "本平台為非商業粉絲專案，與 Bethesda Softworks 無關聯。Fallout 及相關商標為 Bethesda Softworks 所有。"
5. WHEN the footer is rendered, the Landing Page Client Component SHALL display the copyright notice: "© 2025 Wasteland Tarot. All rights reserved. Built with ☢️ in the Wasteland."
6. WHEN the footer is displayed on desktop, the Landing Page Client Component SHALL arrange link sections in a 4-column grid layout (grid-cols-4)
7. WHEN the footer is displayed on mobile, the Landing Page Client Component SHALL arrange link sections in a 1-column grid layout (grid-cols-1)
8. The Landing Page Client Component SHALL apply Pip-Boy themed styling to the footer with border-t-2 border-pip-boy-green, background var(--color-pip-boy-green-5), and padding py-12
9. WHEN a footer link is hovered, the Landing Page Client Component SHALL apply text color transition from text-pip-boy-green/70 to text-pip-boy-green
10. The Landing Page Client Component SHALL use array mapping pattern to render footer links, eliminating hardcoded JSX repetition as per CLAUDE.md section 2.3.1

### Requirement 9: 架構規範 (Architecture Compliance)

**使用者故事**: As a developer, I want the landing page to follow Next.js 15 Server/Client Component architecture, so that SEO and performance are optimized.

#### Acceptance Criteria

1. WHEN the homepage is accessed, the Server Component (`src/app/page.tsx`) SHALL generate static SEO metadata using `generateMetadata()` function with title, description, and keywords
2. The Server Component SHALL render the Client Component (`src/app/client-page.tsx`) without executing any client-side logic
3. WHEN the Client Component is loaded, it SHALL include the `'use client'` directive at the top of the file
4. WHEN the Client Component needs data from the backend, it SHALL use the client-side API utility (`src/lib/api.ts`) and NOT `serverApi.ts`
5. The Server Component SHALL NOT include any `useState`, `useEffect`, or other React hooks
6. The Client Component SHALL handle all user interactions (button clicks, form submissions, navigation) using React hooks and event handlers
7. WHEN shared components (StepCard, StatCounter, TestimonialCard) are created, they SHALL be Client Components with `'use client'` directive as they contain interactive features
8. The shared components SHALL be placed in directory `src/components/landing/` with the following structure:
   - `src/components/landing/StepCard.tsx`
   - `src/components/landing/StatCounter.tsx`
   - `src/components/landing/TestimonialCard.tsx`
9. WHEN shared components are imported, they SHALL be imported using TypeScript named exports with explicit type interfaces
10. The Landing Page Client Component SHALL use array mapping pattern for rendering repeated elements (footer links, testimonials, stats, steps) as per CLAUDE.md section 2.3.1

### Requirement 10: 樣式規範 (Styling Compliance)

**使用者故事**: As a designer, I want the landing page to maintain consistent Fallout Pip-Boy aesthetic, so that brand identity is preserved.

#### Acceptance Criteria

1. WHEN any text is rendered on the landing page, the Landing Page Components SHALL inherit the Cubic 11 font automatically without explicit font-family declarations
2. WHEN icons are needed, the Landing Page Components SHALL use the `PixelIcon` component exclusively and NOT lucide-react or any other icon library
3. WHEN color schemes are applied, the Landing Page Components SHALL use Tailwind CSS utility classes with the following Pip-Boy color palette:
   - Primary: `text-pip-boy-green` (#00ff88)
   - Secondary: `text-radiation-orange` (#ff8800)
   - Success: `text-pip-boy-green` (#00ff41)
   - Background overlays: `bg-pip-boy-green/5`, `bg-pip-boy-green/10`
   - Border colors: `border-pip-boy-green`, `border-radiation-orange`
4. WHEN borders are applied, the Landing Page Components SHALL use `border-2` thickness for primary borders and `border` for secondary borders
5. WHEN background colors are applied, the Landing Page Components SHALL use CSS custom properties: `var(--color-pip-boy-green-5)`, `var(--color-pip-boy-green-10)` for semi-transparent overlays
6. WHEN hover effects are applied, the Landing Page Components SHALL use Tailwind transition utilities: `transition-colors`, `transition-transform`, `hover:scale-105`
7. WHEN animations are needed, the Landing Page Components SHALL use Tailwind animation utilities: `animate-pulse`, `animate-scanline` (custom animation defined in globals.css)
8. The Landing Page Components SHALL apply CRT scanline effect using absolute positioned div with gradient: `bg-gradient-to-b from-transparent via-pip-boy-green/10 to-transparent`
9. WHEN spacing is applied, the Landing Page Components SHALL use Tailwind spacing scale: `p-4`, `p-6`, `p-8`, `mb-4`, `mb-8`, `mb-12` for consistent rhythm
10. The Landing Page Components SHALL use responsive breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px) for adaptive layouts

### Requirement 11: 測試需求 (Testing Requirements)

**使用者故事**: As a QA engineer, I want comprehensive tests for the landing page, so that functionality and accessibility are guaranteed.

#### Acceptance Criteria

1. WHEN unit tests are executed, the Test Suite SHALL verify that StepCard component renders correctly with all props (stepNumber, icon, title, description)
2. WHEN unit tests are executed, the Test Suite SHALL verify that StatCounter component animates from 0 to target value over 2 seconds
3. WHEN unit tests are executed, the Test Suite SHALL verify that TestimonialCard component displays correct rating stars based on rating prop value
4. WHEN integration tests are executed, the Test Suite SHALL verify that Landing Stats API returns correct JSON structure with keys: users, readings, cards, providers
5. WHEN integration tests are executed, the Test Suite SHALL verify that Landing Stats API handles database connection errors gracefully with fallback values
6. WHEN E2E tests are executed using Playwright, the Test Suite SHALL verify that clicking "進入 Vault" button navigates to `/auth/login` for unauthenticated users
7. WHEN E2E tests are executed using Playwright, the Test Suite SHALL verify that clicking "快速占卜" button navigates to `/readings/quick` for unauthenticated users
8. WHEN E2E tests are executed using Playwright, the Test Suite SHALL verify that FAQ accordion items expand and collapse correctly when clicked
9. WHEN accessibility tests are executed using axe-core, the Test Suite SHALL verify that all landing page sections meet WCAG AA compliance (color contrast, keyboard navigation, ARIA labels)
10. WHEN accessibility tests are executed, the Test Suite SHALL verify that all PixelIcon components used decoratively include the `decorative` prop and interactive icons include `aria-label` attributes

### Requirement 12: 效能需求 (Performance Requirements)

**使用者故事**: As a user, I want the landing page to load quickly, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. WHEN the homepage is accessed, the Server Component SHALL pre-render static content with Time to First Byte (TTFB) < 500ms
2. WHEN the Client Component is hydrated, the Landing Page SHALL achieve First Contentful Paint (FCP) < 1.5 seconds
3. WHEN the Client Component is hydrated, the Landing Page SHALL achieve Largest Contentful Paint (LCP) < 2.5 seconds
4. WHEN images are loaded (user avatars, icons), the Landing Page Components SHALL use lazy loading with `loading="lazy"` attribute
5. WHEN the Landing Stats API is called, the Backend Service SHALL respond within 200ms for database queries
6. WHEN the StatCounter animation is triggered, the Landing Page Component SHALL use requestAnimationFrame for smooth 60fps animation
7. WHEN the page is fully loaded, the Landing Page SHALL achieve a Cumulative Layout Shift (CLS) score < 0.1 (no layout shifts during rendering)
8. WHEN the page is analyzed with Lighthouse, the Landing Page SHALL achieve a Performance score ≥ 90
9. WHEN the total bundle size is measured, the Landing Page Client Component and shared components SHALL contribute < 50KB to the total JavaScript bundle (gzipped)
10. The Landing Page Components SHALL use React.memo for StatCounter and TestimonialCard components to prevent unnecessary re-renders

## 技術約束 (Technical Constraints)

### 前端技術棧
- Framework: Next.js 15.1.7 (App Router)
- Language: TypeScript 5
- Runtime: Bun (package management)
- Styling: Tailwind CSS v4.1.13
- Icons: PixelIcon (RemixIcon 4.7.0) - **絕對禁止使用 lucide-react**
- Font: Cubic 11 (自動繼承，無需手動指定)

### 後端技術棧
- Framework: FastAPI 0.104.0+
- Language: Python 3.11+
- Package Manager: uv (虛擬環境：`/backend/.venv`)
- ORM: SQLAlchemy 2.0.23+
- Database: Supabase PostgreSQL

### 檔案路徑約定
- Server Component: `src/app/page.tsx`
- Client Component: `src/app/client-page.tsx`
- Shared Components: `src/components/landing/*.tsx`
- Backend API: `backend/app/api/v1/endpoints/landing_stats.py`
- API Types: `src/types/api.ts`

### 程式碼品質標準
- TypeScript: Strict mode enabled, explicit return types
- Python: Type hints required, Black formatting (88 chars)
- Testing: Frontend 80%+ coverage (Jest), Backend 85%+ coverage (pytest)
- Accessibility: WCAG AA compliance mandatory
- 遵循 CLAUDE.md section 2.3.1: 使用陣列映射消除硬編碼重複

### 禁止事項
- ❌ 不要使用 lucide-react（已完全移除）
- ❌ 不要手動指定 font-family（自動繼承 Cubic 11）
- ❌ 不要在 return 語句中硬編碼重複的 JSX（必須使用 .map()）
- ❌ 不要在 Server Component 中使用 React hooks
- ❌ 不要在 Client Component 中使用 serverApi.ts

### SEO 與效能要求
- 動態 metadata 生成（generateMetadata 函數）
- Server Component 靜態渲染優化
- Client Component 互動邏輯分離
- Lighthouse Performance 分數 ≥ 90
- 首次內容繪製 (FCP) < 1.5 秒
- 最大內容繪製 (LCP) < 2.5 秒

---

**文件版本**: 1.0
**建立日期**: 2025-11-16
**語言偏好**: Traditional Chinese (zh-TW)
**規範依據**: EARS Format Guidelines, CLAUDE.md Project Instructions
