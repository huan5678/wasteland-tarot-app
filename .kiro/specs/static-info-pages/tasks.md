# 實作計畫 - 靜態資訊頁面

## 任務概覽

本計畫將建立四個核心靜態資訊頁面（關於我們、隱私政策、服務條款、聯絡支援），採用 Next.js 14 App Router 架構，完全整合現有 Pip-Boy 終端機風格設計系統。所有頁面符合 WCAG AA 無障礙標準與響應式設計要求。

---

## 實作任務

- [ ] 1. 建立共用型別定義與資料結構
- [ ] 1.1 定義內容區塊型別系統
  - 建立支援多種內容類型的型別定義（標題、段落、清單、連結、註解、分隔線）
  - 設計支援巢狀結構的資料模型（如章節包含子章節）
  - 定義 Fallout 風格註解的型別結構
  - 確保所有型別具備完整的 TypeScript 類型安全
  - _Requirements: 7.1, 7.5_

- [ ] 1.2 定義隱私政策與服務條款資料結構
  - 建立支援階層式章節組織的資料模型
  - 設計版本控制相關欄位（版本號、最後更新日期、生效日期）
  - 定義第三方服務商資料結構（名稱、用途、隱私政策連結、所在地）
  - 建立法律條文引用欄位
  - _Requirements: 2.1, 2.2, 2.3, 3.2, 7.2, 7.3_

- [ ] 1.3 定義常見問題（FAQ）資料結構
  - 建立問答配對的基礎型別
  - 加入問題分類欄位（一般、技術、帳號、遊戲機制、法律）
  - 支援標籤系統方便搜尋與過濾
  - 定義相關連結資料結構
  - _Requirements: 4.6_

- [ ] 2. 建立資料模組與 Markdown 內容檔案
- [x] 2.0 建立內容解析工具模組
  - ✅ 建立 `lib/contentParser.ts` 工具模組
  - ✅ 實作 `getStaticPageContent(slug)` 函式，使用 `gray-matter` 解析 Markdown
  - ✅ 定義 `StaticPageMetadata` 與 `StaticPageContent` 型別介面
  - ✅ 加入 frontmatter 必要欄位驗證（title, lang）
  - ✅ 加入檔案不存在的錯誤處理
  - ✅ 安裝依賴：`bun add gray-matter react-markdown remark-gfm`
  - ✅ 撰寫並通過所有測試（5/5 tests passing）
  - _Requirements: 7.1, 7.5_

- [ ] 2.1 建立「關於我們」Markdown 內容檔案（`src/data/static-pages/about.md`）
  - 設定 frontmatter：title, lang, lastUpdated
  - 撰寫廢土倖存者日誌風格的平台起源故事（使用 Markdown 標題與段落）
  - 設計 Vault-Tec 企業風格的核心價值與使命宣言（使用有序清單）
  - 在 frontmatter 中定義團隊成員 JSON 資料（至少 3 位，包含廢土角色設定）
  - 在 frontmatter 中定義平台發展時間軸 JSON 資料（至少 5 個關鍵事件）
  - 使用 Markdown blockquote 加入 Fallout 風格註解（如 `> **[輻射提示]** ...`）
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.2 建立隱私政策 Markdown 內容檔案（`src/data/static-pages/privacy.md`）
  - 設定 frontmatter：title, lastUpdated, effectiveDate, version, lang
  - 撰寫符合台灣個資法的 10 大章節（使用 Markdown `##` 標題）：
    - 第 1 章：個人資料蒐集項目（列表：電子郵件、使用者名稱、閱讀紀錄、Karma 值）
    - 第 2 章：蒐集目的與法律依據（引用個資法第 8 條）
    - 第 3 章：資料利用方式與範圍
    - 第 4 章：資料保存期限
    - 第 5 章：用戶權利（查詢、更正、刪除、停止處理）
    - 第 6 章：Cookie 與追蹤技術說明
    - 第 7 章：第三方服務使用（表格或清單列出 Supabase、Anthropic、OpenAI、Gemini、Zeabur）
    - 第 8 章：資料安全措施
    - 第 9 章：政策變更通知機制
    - 第 10 章：聯絡資訊
  - 使用 Markdown blockquote 加入 Fallout 風格註解（如 `> **[輻射安全提示]** 您的資料受到比避難所大門更嚴密的保護。`）
  - 在 frontmatter 中定義第三方服務商 JSON 資料（名稱、用途、隱私政策連結）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [ ] 2.3 建立服務條款 Markdown 內容檔案（`src/data/static-pages/terms.md`）
  - 設定 frontmatter：title, version, versionName, effectiveDate, governingLaw, jurisdiction, lang
  - 撰寫 9 大章節（使用 Markdown `##` 與 `###` 階層式標題）：
    - 第 1 章：服務範圍與性質說明（非商業粉絲專案聲明）
    - 第 2 章：用戶資格與註冊要求（18+ 年齡限制）
    - 第 3 章：禁止行為清單（無序清單：API 濫用、系統破壞、惡意內容）
    - 第 4 章：智慧財產權聲明（Fallout IP 歸 Bethesda 所有）
    - 第 5 章：免責聲明（占卜僅供娛樂參考）
    - 第 6 章：Karma 系統與虛擬獎勵說明
    - 第 7 章：帳號終止與暫停條件
    - 第 8 章：爭議解決機制
    - 第 9 章：管轄法院（台灣法律管轄）
  - 使用編號標題（如 `## 1. 服務範圍`, `### 1.1 服務定義`）
  - 使用 Markdown 註解穿插 Fallout 式幽默（如 `<!-- 違反條款者將被流放至輻射區 -->`）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2.4 建立常見問題 Markdown 內容檔案（`src/data/static-pages/faq.md`）
  - 設定 frontmatter：title, lang
  - 在 frontmatter 中定義 FAQ 項目 JSON 陣列（至少 5 個問題）
  - 問題類別包含：Karma 系統、AI 準確度、離線功能、帳號刪除、卡牌意義
  - 使用 Markdown 格式撰寫問答內容（如 `## Q: 問題` 後接 `A: 答案`）
  - 確保解答包含 Fallout 幽默與實用資訊
  - 為每個問題添加分類與標籤（在 frontmatter 的 JSON 中）
  - 提供相關連結（使用 Markdown 連結語法）
  - _Requirements: 4.2, 4.6_

- [ ] 3. 建立表單驗證 Schema
- [ ] 3.1 實作聯絡表單 Zod 驗證 Schema
  - 定義姓名欄位驗證（2-50 字元，僅允許中英文與空格）
  - 定義電子郵件欄位驗證（RFC 5322 格式，最大 100 字元）
  - 定義問題類別欄位驗證（技術問題、帳號問題、建議回饋、其他）
  - 定義訊息內容欄位驗證（20-1000 字元，至少包含一個非空白字元）
  - 提供清晰的中文錯誤訊息
  - 確保 Schema 支援 TypeScript 型別推導
  - _Requirements: 4.3, 4.4, 安全需求_

- [ ] 4. 建立共用元件層
- [ ] 4.1 實作 StaticPageLayout 統一佈局元件
  - 設計接受標題、副標題、變體（about/privacy/terms/contact）的元件介面
  - 整合 DitherBackground 背景效果
  - 實作終端機風格頁面標題區（包含 ASCII 藝術裝飾）
  - 建立麵包屑導航（首頁 > 當前頁面）
  - 設定統一容器寬度與垂直間距（max-w-4xl, py-12）
  - 應用 Pip-Boy 綠色配色與等寬字型
  - 確保元件為 Server Component（無 'use client' 標記）
  - _Requirements: 5.1, 5.2, 5.3, 5.7, 6.1, 6.2_

- [ ] 4.2 實作 MarkdownRenderer Markdown 渲染元件
  - 選擇 Markdown 解析方案：使用 `react-markdown` 或 `next-mdx-remote`（建議 `react-markdown`）
  - 安裝依賴：`bun add react-markdown remark-gfm`
  - 建立自訂 Markdown 元件覆寫（headings, paragraph, list, link, blockquote）
  - 實作不同標題層級的終端機風格樣式（h2, h3, h4）
  - 為外部連結自動加入安全屬性（`rel="noopener noreferrer"`）
  - 自訂 blockquote 樣式為 Fallout 風格註解區塊（綠色邊框、輻射圖示）
  - 實作有序與無序清單的終端機風格（綠色項目符號）
  - 實作水平線（`---`）為終端機分隔線樣式（ASCII 藝術）
  - 啟用 GitHub Flavored Markdown（表格支援）
  - 確保使用 `react-markdown` 的內建 XSS 防護
  - _Requirements: 1.5, 2.4, 3.5, 5.5, 安全需求_

- [ ] 4.3 實作 ContactForm 聯絡表單元件
  - 整合 React Hook Form 管理表單狀態
  - 整合 Zod resolver 進行驗證
  - 實作四個表單欄位（姓名、電子郵件、問題類別、訊息內容）
  - 使用 shadcn/ui 的 Input、Label、Select 元件
  - 實作即時欄位驗證與錯誤訊息顯示
  - 實作提交處理邏輯（模擬 API 呼叫）
  - 提交成功後顯示 Fallout 風格成功訊息（「您的訊息已送達避難所控制中心！」）
  - 提交成功後清空表單欄位
  - 標記為 Client Component（'use client'）
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.4 實作 FAQAccordion 常見問題摺疊元件
  - 建立可展開/收合的問題清單
  - 實作單一展開模式（一次僅能展開一個問題）
  - 加入終端機風格的展開/收合圖示（▶/▼）
  - 實作平滑展開動畫（高度過渡）
  - 支援鍵盤導航（Enter 鍵展開/收合）
  - 預設展開第一個問題
  - 標記為 Client Component（'use client'）
  - _Requirements: 4.6, 4.7, 6.7_

- [ ] 4.5 實作 ExpandableSection 可展開章節元件
  - 設計用於隱私政策與服務條款的章節展開功能
  - 實作點擊標題展開/收合詳細內容
  - 加入展開狀態指示器（＋/－ 符號）
  - 支援 URL hash 自動展開對應章節（如 #data-collection）
  - 實作平滑滾動至展開章節
  - 標記為 Client Component（'use client'）
  - _Requirements: 2.5_

- [ ] 5. 建立頁面路由層
- [ ] 5.1 實作「關於我們」頁面路由（`app/about/page.tsx`）
  - 建立 Next.js App Router 頁面檔案（Server Component）
  - 設定頁面 Metadata（title、description、keywords、OpenGraph）
  - 使用 `getStaticPageContent('about')` 讀取 Markdown 內容
  - 整合 StaticPageLayout 佈局元件
  - 從 frontmatter 提取 metadata（lastUpdated）並顯示在頁首
  - 使用 MarkdownRenderer 渲染 Markdown 正文（起源故事、使命宣言）
  - 從 frontmatter 的 JSON 資料渲染團隊成員卡片（使用 grid 佈局）
  - 從 frontmatter 的 JSON 資料渲染平台發展時間軸（垂直時間軸設計）
  - 確保頁面為 Server Component（預設）
  - _Requirements: 1.1, 1.2, 1.3, 1.4, SEO 需求_

- [ ] 5.2 實作隱私政策頁面路由（`app/privacy/page.tsx`）
  - 建立 Next.js App Router 頁面檔案（Server Component）
  - 設定頁面 Metadata（強調個資法合規）
  - 使用 `getStaticPageContent('privacy')` 讀取 Markdown 內容
  - 整合 StaticPageLayout 佈局元件
  - 從 frontmatter 顯示版本號、最後更新日期與生效日期
  - 使用 MarkdownRenderer 渲染所有 10 個隱私政策章節（Markdown `##` 標題）
  - 整合 ExpandableSection 元件支援章節展開（需 Client Component wrapper）
  - 從 frontmatter 的 JSON 資料渲染第三方服務商清單（表格形式）
  - 加入「我已閱讀並同意」確認選項（選配，供未來註冊流程使用）
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, SEO 需求_

- [ ] 5.3 實作服務條款頁面路由（`app/terms/page.tsx`）
  - 建立 Next.js App Router 頁面檔案（Server Component）
  - 設定頁面 Metadata
  - 使用 `getStaticPageContent('terms')` 讀取 Markdown 內容
  - 整合 StaticPageLayout 佈局元件
  - 從 frontmatter 顯示協議版本號（「V1.0 - Wasteland Protocol」）、生效日期、管轄法院
  - 使用 MarkdownRenderer 渲染所有 9 個服務條款章節（階層式 Markdown 標題）
  - 整合 ExpandableSection 元件支援條款展開（需 Client Component wrapper）
  - 在頁面底部加入快速連結（返回首頁、聯絡支援）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, SEO 需求_

- [ ] 5.4 實作聯絡支援頁面路由（`app/contact/page.tsx`）
  - 建立 Next.js App Router 頁面檔案（Server Component）
  - 設定頁面 Metadata
  - 使用 `getStaticPageContent('faq')` 讀取 FAQ Markdown 內容
  - 整合 StaticPageLayout 佈局元件（variant="contact"）
  - 整合 ContactForm 表單元件（Client Component）
  - 從 frontmatter 的 JSON 資料傳遞 FAQ 項目至 FAQAccordion 元件
  - 使用 Markdown 渲染 FAQ 解答內容（支援連結與格式化）
  - 顯示多種支援管道（電子郵件、Discord、GitHub Issues - 使用假資料連結）
  - 在側邊欄顯示預估回覆時間（「通常在 48 小時內回覆」）
  - _Requirements: 4.1, 4.2, 4.8, SEO 需求_

- [ ] 6. 實作響應式設計與無障礙性
- [ ] 6.1 實作響應式佈局與斷點
  - 桌面裝置（≥1280px）：使用多欄佈局展示團隊成員與時間軸
  - 平板裝置（768px-1279px）：調整為雙欄或單欄佈局
  - 行動裝置（≤767px）：完全單欄佈局，調整字體大小與間距
  - 表單欄位在手機裝置自動垂直排列
  - 確保所有互動元素觸控區域 ≥44x44px
  - _Requirements: 6.1, 6.2, 6.3, 4.9_

- [ ] 6.2 實作無障礙性功能
  - 確保所有頁面使用語意化 HTML5 標籤（header, nav, main, article, footer）
  - 為所有互動元素加入 ARIA 標籤（aria-label, aria-expanded, aria-controls）
  - 確保色彩對比度符合 WCAG AA 標準（至少 4.5:1）
  - 實作清晰的鍵盤焦點樣式（outline 或 ring）
  - 為圖片與圖示提供描述性 alt 文字
  - 確保表單錯誤訊息與對應欄位正確關聯（aria-describedby）
  - 測試螢幕閱讀器相容性（VoiceOver/NVDA）
  - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.10_

- [ ] 6.3 實作漸進增強與優雅降級
  - 確保 JavaScript 未載入時頁面仍可閱讀（Server Components）
  - FAQ 區塊在無 JavaScript 時預設展開所有問題
  - 聯絡表單在無 JavaScript 時使用原生 HTML5 驗證
  - 實作 noscript 標籤提示部分功能不可用
  - 確保字體大小調整至 200% 時佈局不破損
  - _Requirements: 6.8, 6.9, 相容性需求_

- [ ] 7. 實作樣式與視覺效果
- [ ] 7.1 應用 Pip-Boy 終端機風格
  - 應用統一的 Pip-Boy 綠色配色（使用 CSS 變數 --color-pip-boy-green）
  - 使用等寬字型（JetBrains Mono 或 Courier New）
  - 實作終端機分隔線樣式（ASCII 藝術 ==== SECTION ====）
  - 實作自訂捲軸樣式（綠色軌道與滑塊）
  - 加入掃描線效果（使用 DitherBackground 元件）
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

- [ ] 7.2 實作互動效果與動畫
  - 實作連結與按鈕 hover 效果（邊框發光、字元閃爍）
  - 實作章節展開/收合動畫（高度過渡 + 淡入淡出）
  - 實作頁面載入動畫（Fallout 風格，如輻射符號旋轉 - 選配）
  - 實作頁面切換動畫（終端機畫面切換效果 - 選配）
  - 確保動畫尊重 prefers-reduced-motion 偏好設定
  - _Requirements: 5.4, 5.9, 5.10, 1.6, 4.7_

- [ ] 8. 整合現有系統元件
- [ ] 8.1 驗證 Header 導航連結整合
  - 確認 Header 元件已包含靜態頁面連結（當前應已存在於 Footer）
  - 若未包含，在 Header 導航選單加入「更多」或「資訊」下拉選單
  - 包含四個靜態頁面連結（關於我們、隱私政策、服務條款、聯絡支援）
  - 確保當前頁面高亮顯示
  - _Requirements: 5.7_

- [ ] 8.2 驗證 Footer 快速連結整合
  - 確認 Footer 元件包含所有靜態頁面連結（已在 design 中確認存在）
  - 驗證連結正確指向 /about, /privacy, /terms, /contact
  - 確認版權聲明包含正確文字（「© 2077 Wasteland Tarot - A non-commercial fan project」）
  - 測試連結導航功能正常
  - _Requirements: 5.8_

- [ ] 9. 效能最佳化
- [ ] 9.1 實作程式碼分割與延遲載入
  - 使用 Next.js dynamic import 延遲載入非關鍵元件（FAQAccordion）
  - 確保 Server Components 最大化（頁面主體）
  - 確保 Client Components 最小化（僅互動元件）
  - 驗證 JavaScript bundle 大小 < 50KB（gzipped）
  - _Requirements: 效能需求, 6.9_

- [ ] 9.2 實作資源優化
  - 使用 next/font 自動最佳化字型載入
  - 設定字型 display: swap 避免 FOIT
  - 若有圖片，使用 next/image 自動最佳化（團隊成員頭像 - 選配）
  - 實作圖片延遲載入（loading="lazy"）
  - _Requirements: 效能需求_

- [ ] 9.3 實作快取策略
  - 驗證靜態頁面自動產生 HTML（Server Components）
  - 確保靜態資源啟用長期快取（Next.js 預設行為）
  - 驗證 Metadata 正確設定（title, description, OpenGraph）
  - _Requirements: 效能需求, SEO 需求_

- [ ] 10. 安全性實作
- [ ] 10.1 實作表單安全措施
  - 確認 React 預設 XSS 防護（自動轉義）
  - 確認所有外部連結包含 rel="noopener noreferrer"
  - 實作 Zod Schema 驗證防止無效輸入
  - 確認無使用 dangerouslySetInnerHTML
  - _Requirements: 安全需求_

- [ ] 10.2 實作內容安全政策（CSP - 選配）
  - 在 next.config.ts 設定 Content-Security-Policy Header
  - 限制 script-src、style-src、img-src 來源
  - 設定 frame-ancestors 'none' 防止 Clickjacking
  - _Requirements: 安全需求_

- [ ] 11. 測試實作
- [ ] 11.1 撰寫單元測試
  - 測試 contactFormSchema 驗證邏輯（有效/無效輸入）
  - 測試 getStaticPageContent() 正確解析 Markdown frontmatter
  - 測試 MarkdownRenderer 渲染各類 Markdown 元素（標題、清單、blockquote、連結）
  - 測試 privacy.md 檔案完整性（包含 10 個 `##` 章節標題）
  - 測試 FAQAccordion 展開/收合邏輯
  - _Requirements: 所有功能需求_

- [ ] 11.2 撰寫整合測試
  - 測試「關於我們」頁面正確讀取 about.md 並渲染完整內容
  - 測試隱私政策頁面正確讀取 privacy.md 並渲染 10 章節
  - 測試聯絡表單提交流程（填寫、驗證、提交、成功訊息）
  - 測試 FAQ 頁面從 faq.md frontmatter 讀取資料並展開互動
  - _Requirements: 所有功能需求_

- [ ] 11.3 撰寫 E2E 測試（Playwright）
  - 測試訪客瀏覽所有四個靜態頁面
  - 測試響應式設計（桌面/平板/手機視窗）
  - 測試聯絡表單完整提交流程（含驗證錯誤處理）
  - 測試無障礙性（axe-core 掃描、鍵盤導航、螢幕閱讀器）
  - 測試 SEO 與 Metadata（title, description, OpenGraph）
  - _Requirements: 所有功能需求, 6.5, 6.7, SEO 需求_

- [ ] 12. 文件與最終驗證
- [ ] 12.1 驗證需求完整覆蓋
  - 逐一檢查所有需求驗收標準（Requirement 1-7）
  - 確認所有非功能性需求滿足（效能、安全、相容性、SEO）
  - 驗證隱私政策包含台灣個資法 10 大章節
  - 驗證所有 Fallout 風格元素正確實作
  - _Requirements: 所有需求_

- [ ] 12.2 執行完整測試套件
  - 執行所有單元測試（Jest）
  - 執行所有整合測試
  - 執行所有 E2E 測試（Playwright）
  - 執行 Lighthouse 效能測試（目標：Performance > 90, Accessibility 100）
  - 修正所有失敗測試與效能問題
  - _Requirements: 效能需求, 無障礙性需求_

- [ ] 12.3 最終整合驗證
  - 在桌面瀏覽器測試所有頁面導航
  - 在手機裝置測試響應式設計與觸控互動
  - 使用螢幕閱讀器測試無障礙性
  - 測試表單提交完整流程
  - 驗證所有外部連結正確開啟（Discord、GitHub - 假資料）
  - 確認所有頁面符合 WCAG AA 標準
  - _Requirements: 所有需求_

---

## 實作完成檢查清單

- [ ] 所有 22 個新檔案已建立（4 頁面路由、5 共用元件、4 Markdown 資料檔、1 解析器、1 Schema、7 測試）
- [ ] 四個靜態頁面可透過 URL 訪問（/about, /privacy, /terms, /contact）
- [ ] 隱私政策包含完整 10 大章節且符合台灣個資法
- [ ] 聯絡表單驗證與提交功能正常運作
- [ ] FAQ 展開/收合互動正常
- [ ] 所有頁面採用統一 Pip-Boy 終端機風格
- [ ] 響應式設計在桌面/平板/手機裝置正常顯示
- [ ] 無障礙性符合 WCAG AA 標準（Lighthouse Accessibility 100）
- [ ] 所有測試通過（單元測試、整合測試、E2E 測試）
- [ ] 效能指標達標（LCP < 2.5s, FID < 100ms, CLS < 0.1）

---

## 注意事項

1. **依序執行任務**：後續任務依賴前面任務的產出，請按照編號順序執行
2. **型別安全優先**：確保所有 TypeScript 型別定義完整，避免使用 `any`
3. **測試驅動開發**：建議在實作功能的同時撰寫對應測試
4. **無障礙性為核心**：每個元件實作時即考慮無障礙性，而非事後補救
5. **漸進增強原則**：確保無 JavaScript 時頁面仍可閱讀
6. **Fallout 風格一致性**：所有文案與視覺元素保持廢土美學
7. **台灣個資法合規**：隱私政策必須完整涵蓋法定 10 大章節

---

## 預估工作量

- **總任務數**：52 個子任務（12 個主要任務）
- **預估時間**：60-80 小時（每個子任務 1-3 小時）
- **關鍵里程碑**：
  - 任務 1-3 完成：資料結構與內容就緒（~15 小時）
  - 任務 4-5 完成：元件與頁面可視化（~25 小時）
  - 任務 6-10 完成：響應式、無障礙性、效能、安全性完成（~20 小時）
  - 任務 11-12 完成：測試與最終驗證（~15 小時）
