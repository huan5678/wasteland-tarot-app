# Implementation Plan - Landing Page Optimization

## Overview

本實作計畫遵循 TDD (Test-Driven Development) 原則，將任務組織為平行執行波次 (Parallel Execution Waves)，以最大化開發效率。每個實作任務均先完成對應的測試任務，確保程式碼品質與需求符合度。

## Task List

### Wave 1: Test Infrastructure & Backend API Tests (Parallel)

本波次建立測試基礎設施並實作後端 API 測試，所有任務可平行執行。

- [ ] 1. (P) Create Backend Landing Stats API Tests
  - 建立整合測試檔案於 `backend/tests/api/test_landing_stats_endpoints.py`
  - 撰寫測試案例：驗證 API 回傳正確 JSON 結構（users, readings, cards, providers 鍵值）
  - 撰寫測試案例：模擬資料庫連線失敗時回傳 fallback 值（users: 1000, readings: 5000）
  - 撰寫測試案例：驗證 API 回應時間 < 200ms（使用 pytest-benchmark）
  - 使用 pytest fixtures 建立測試資料庫 session 和 API client
  - _Requirements: 11.4, 11.5_

- [ ] 2. (P) Create Frontend API Types with Validation
  - 建立 Zod schema `LandingStatsResponseSchema` 於 `src/types/api.ts`
  - 定義 TypeScript interface `LandingStatsResponse` 並從 Zod schema 推導型別
  - 設定驗證規則：users >= 0, readings >= 0, cards = 78, providers = 3
  - 匯出 schema 和 type 供前端元件使用
  - _Requirements: 5.11, 9.9_

- [ ] 3. (P) Create StepCard Component Tests
  - 建立單元測試檔案於 `src/components/landing/__tests__/StepCard.test.tsx`
  - 撰寫測試案例：驗證所有 props 正確渲染（stepNumber, icon, title, description）
  - 撰寫測試案例：驗證 PixelIcon 整合（icon name, size 40px, decorative 屬性）
  - 撰寫測試案例：驗證 Pip-Boy 主題樣式應用（border-2 border-pip-boy-green）
  - 撰寫測試案例：驗證 hover 效果（scale-105 transform）
  - 使用 Testing Library 和 Jest 進行元件測試
  - _Requirements: 11.1_

- [ ] 4. (P) Create StatCounter Component Tests
  - 建立單元測試檔案於 `src/components/landing/__tests__/StatCounter.test.tsx`
  - 撰寫測試案例：驗證動畫從 0 到目標值（使用 jest.useFakeTimers 模擬時間）
  - 撰寫測試案例：驗證 easeOutQuad 緩動函數應用
  - 撰寫測試案例：驗證 suffix prop 正確顯示（例如 "1000+"）
  - 撰寫測試案例：驗證 PixelIcon 圖示正確渲染
  - 撰寫測試案例：驗證 React.memo 效能優化（防止不必要的重渲染）
  - _Requirements: 11.2_

- [ ] 5. (P) Create TestimonialCard Component Tests
  - 建立單元測試檔案於 `src/components/landing/__tests__/TestimonialCard.test.tsx`
  - 撰寫測試案例：驗證 rating 值對應正確的填充星星數（0-5 星）
  - 撰寫測試案例：驗證空星星和填充星星使用正確的 PixelIcon variant（muted vs primary）
  - 撰寫測試案例：驗證 avatar PixelIcon 正確渲染
  - 撰寫測試案例：驗證 username 和 review 文字正確顯示
  - 撰寫測試案例：驗證 PipBoyCard 基礎容器整合
  - _Requirements: 11.3_

### Wave 2: Backend API Implementation & Shared Components (Parallel)

本波次實作後端 API 和前端共用元件，所有任務可平行執行（需依賴 Wave 1 測試完成以遵循 TDD）。

- [ ] 6. (P) Implement Backend Landing Stats Service
  - 實作 `LandingStatsService` 類別於 `backend/app/services/landing_stats_service.py`
  - 實作靜態方法 `get_landing_stats(db: Session)` 執行資料庫 COUNT 查詢
  - 查詢 users 表和 reading_sessions 表總數
  - 回傳字典包含 users, readings, cards (78), providers (3)
  - 實作錯誤處理：資料庫查詢失敗時回傳 fallback 值
  - 新增錯誤日誌記錄（使用 logging 模組）
  - _Requirements: 5.11, 5.12, 5.13, 5.14_

- [ ] 7. (P) Implement Backend Landing Stats API Endpoint
  - 建立 FastAPI router 於 `backend/app/api/v1/endpoints/landing_stats.py`
  - 實作 GET 端點 `/api/v1/landing-stats` 回傳 `LandingStatsResponse` schema
  - 整合 `LandingStatsService.get_landing_stats()` 並注入資料庫 session 依賴
  - 實作異常處理：捕獲所有例外並回傳 fallback 值（不回傳 500 錯誤給客戶端）
  - 設定 CORS headers 允許前端跨域請求
  - 註冊 router 至主應用程式
  - _Requirements: 5.11, 5.14_

- [ ] 8. (P) Create Backend Landing Stats Pydantic Schema
  - 建立 `LandingStatsResponse` 模型於 `backend/app/schemas/landing_stats.py`
  - 定義欄位：users (int), readings (int), cards (int), providers (int)
  - 設定驗證規則：users >= 0, readings >= 0, cards = 78, providers = 3
  - 新增 `Config.json_schema_extra` 範例資料供 API 文件使用
  - _Requirements: 5.11_

- [ ] 9. (P) Implement StepCard Component
  - 建立 React 元件於 `src/components/landing/StepCard.tsx` 並加上 'use client' directive
  - 定義 `StepCardProps` interface：stepNumber, icon, title, description
  - 使用 PipBoyCard 作為基礎容器並覆蓋樣式（border-2 border-pip-boy-green）
  - 整合 PixelIcon 元件顯示步驟圖示（size 40px, decorative 屬性）
  - 實作 hover 效果：hover:scale-105 transition-transform duration-300
  - 顯示步驟編號徽章（text-2xl, pip-boy-green 顏色）
  - 匯出 StepCard 元件和 StepCardProps 型別
  - _Requirements: 2.2, 2.7, 2.8, 2.9, 10.2_

- [ ] 10. (P) Implement StatCounter Component
  - 建立 React 元件於 `src/components/landing/StatCounter.tsx` 並加上 'use client' directive
  - 定義 `StatCounterProps` interface：icon, value, label, suffix (可選)
  - 實作動畫邏輯：使用 requestAnimationFrame 從 0 動畫到目標值（2 秒）
  - 實作 easeOutQuad 緩動函數提供自然減速效果
  - 使用 useState 儲存顯示值，useEffect 觸發動畫，useRef 追蹤動畫狀態
  - 整合 PixelIcon 元件顯示統計圖示（decorative 屬性）
  - 應用大數字樣式（text-4xl）和小標籤樣式（text-sm）
  - 使用 React.memo 包裝元件以防止不必要的重渲染
  - _Requirements: 5.3, 5.4, 5.6, 5.9, 5.10, 12.6, 12.10_

- [ ] 11. (P) Implement TestimonialCard Component
  - 建立 React 元件於 `src/components/landing/TestimonialCard.tsx` 並加上 'use client' directive
  - 定義 `TestimonialCardProps` interface：avatar, username, rating, review
  - 使用 PipBoyCard 作為基礎容器（border-2 border-pip-boy-green）
  - 實作星星渲染：使用 Array.from 和 map 生成 5 顆星星
  - 根據 rating 值顯示填充星星（star-fill, variant primary）和空星星（star, variant muted）
  - 整合 PixelIcon 顯示使用者頭像（Fallout 角色圖示，decorative 屬性）
  - 佈局：使用者名稱和評分水平排列，評價文字於下方
  - 使用 React.memo 包裝元件以優化效能
  - _Requirements: 4.2, 4.7, 4.9, 4.10, 10.2, 12.10_

### Wave 3: Page Section Tests (Parallel)

本波次實作頁面區塊測試，所有任務可平行執行。

- [ ] 12. (P) Create Hero Section Integration Tests
  - 建立整合測試檔案（使用 Jest 或 Playwright）
  - 撰寫測試案例：驗證 DynamicHeroTitle 元件正確渲染並顯示動畫打字效果
  - 撰寫測試案例：驗證 terminal status banner 在桌面顯示完整文字，手機顯示縮寫版本
  - 撰寫測試案例：驗證兩個主要行動按鈕使用正確的 Pip-Boy 主題顏色（綠色和橘色）
  - 撰寫測試案例：驗證未登入使用者看到 "進入 Vault" 和 "快速占卜" 按鈕標籤
  - 撰寫測試案例：驗證已登入使用者看到 "進入控制台" 和 "新占卜" 按鈕標籤
  - 撰寫測試案例：驗證 CRT 掃描線效果背景正確應用
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7_

- [ ] 13. (P) Create How It Works Section Tests
  - 建立整合測試檔案
  - 撰寫測試案例：驗證 4 個 StepCard 元件正確渲染（選擇牌陣、輻射洗牌、抽牌占卜、AI 解讀）
  - 撰寫測試案例：驗證每個步驟卡片顯示正確的圖示、標題、說明文字
  - 撰寫測試案例：驗證桌面顯示 4 列網格佈局（grid-cols-4）
  - 撰寫測試案例：驗證手機顯示 1 列網格佈局（grid-cols-1）
  - 撰寫測試案例：驗證步驟卡片 hover 時應用縮放和發光效果
  - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [ ] 14. (P) Create Features Grid Section Tests
  - 建立整合測試檔案
  - 撰寫測試案例：驗證 3 個功能卡片正確渲染（量子占卜、占卜分析、廢土主題）
  - 撰寫測試案例：驗證使用陣列映射模式而非硬編碼 JSX
  - 撰寫測試案例：驗證每個卡片顯示 PixelIcon 圖示（size 40px）
  - 撰寫測試案例：驗證桌面顯示 3 列網格（grid-cols-3），手機顯示 1 列（grid-cols-1）
  - 撰寫測試案例：驗證區塊背景顏色和邊框樣式正確應用
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 15. (P) Create Social Proof Section Tests
  - 建立整合測試檔案
  - 撰寫測試案例：驗證 6 個 TestimonialCard 元件正確渲染
  - 撰寫測試案例：驗證使用陣列映射模式渲染見證卡片
  - 撰寫測試案例：驗證每個見證包含正確的使用者名稱、評分、評價內容
  - 撰寫測試案例：驗證響應式網格：桌面 3 列、平板 2 列、手機 1 列
  - 撰寫測試案例：驗證評分星星正確顯示（填充星星和空星星）
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_

- [ ] 16. (P) Create Stats Counter Section Tests
  - 建立整合測試檔案
  - 撰寫測試案例：驗證從 API 成功獲取統計數據後正確顯示 4 個 StatCounter
  - 撰寫測試案例：驗證 API 失敗時顯示 fallback 值（users: 1000, readings: 5000）
  - 撰寫測試案例：驗證使用陣列映射模式渲染統計計數器
  - 撰寫測試案例：驗證響應式網格：桌面 4 列（grid-cols-4），手機 2 列（grid-cols-2）
  - 撰寫測試案例：驗證數字動畫效果正確執行
  - _Requirements: 5.1, 5.2, 5.5, 5.7_

- [ ] 17. (P) Create FAQ Section Tests
  - 建立整合測試檔案
  - 撰寫測試案例：驗證 FAQAccordion 元件接收 8 個 FAQ 項目
  - 撰寫測試案例：驗證使用陣列映射模式定義 FAQ 資料
  - 撰寫測試案例：驗證點擊 FAQ 項目時展開顯示答案
  - 撰寫測試案例：驗證手風琴行為（點擊新項目時收合先前展開的項目）
  - 撰寫測試案例：驗證區塊樣式正確應用（邊框、背景顏色）
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 18. (P) Create CTA Section Tests
  - 建立整合測試檔案
  - 撰寫測試案例：驗證 CTA 區塊顯示正確的標題和副標題
  - 撰寫測試案例：驗證兩個行動按鈕使用 PipBoyButton 元件（default 和 outline 變體）
  - 撰寫測試案例：驗證響應式佈局：桌面水平排列（flex-row），手機垂直排列（flex-col）
  - 撰寫測試案例：驗證按鈕 hover 時應用 scale-105 transform
  - 撰寫測試案例：驗證區塊樣式（border-2, padding, background）
  - _Requirements: 7.1, 7.2, 7.5, 7.6, 7.7, 7.8, 7.9_

- [ ] 19. (P) Create Footer Section Tests
  - 建立整合測試檔案
  - 撰寫測試案例：驗證使用陣列映射模式渲染 4 個連結區塊
  - 撰寫測試案例：驗證使用巢狀陣列映射渲染所有連結項目
  - 撰寫測試案例：驗證外部連結包含 rel="noopener noreferrer" 和 target="_blank"
  - 撰寫測試案例：驗證顯示 Vault-Tec 免責聲明和版權聲明
  - 撰寫測試案例：驗證響應式網格：桌面 4 列（grid-cols-4），手機 1 列（grid-cols-1）
  - 撰寫測試案例：驗證連結 hover 時文字顏色轉換效果
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.9, 8.10_

### Wave 4: Page Section Implementation (Sequential Dependencies)

本波次實作頁面區塊，部分任務具有順序依賴（需依賴 Wave 2 共用元件完成）。

- [ ] 20. Implement Hero Section Optimization
  - 保持現有 DynamicHeroTitle 元件整合和動畫打字效果
  - 實作 terminal status banner 顯示，使用響應式斷點（桌面完整文字，手機縮寫）
  - 新增兩個主要行動按鈕並應用 Pip-Boy 主題樣式（pip-boy-green 和 radiation-orange）
  - 實作認證狀態檢查：使用 Zustand authStore 判斷使用者登入狀態
  - 根據登入狀態切換按鈕標籤（未登入："進入 Vault" / "快速占卜"，已登入："進入控制台" / "新占卜"）
  - 實作按鈕 hover 效果：scanline 動畫和顏色轉換
  - 保持 CRT 掃描線效果背景（gradient overlay）
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 10.3, 10.6_

- [ ] 21. Implement How It Works Section
  - 定義 STEP_CARDS 常數陣列於 client-page.tsx，包含 4 個步驟資料
  - 配置步驟資料：stepNumber, icon (layout-grid, shuffle, hand, cpu), title, description（繁體中文）
  - 使用陣列映射模式渲染 StepCard 元件（消除硬編碼 JSX）
  - 實作響應式網格佈局：桌面 4 列（grid-cols-4），手機 1 列（grid-cols-1）
  - 新增區塊標題 "終端機使用流程" 並套用置中佈局和 Pip-Boy 樣式
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 10.10_

- [ ] 22. Refactor Features Grid with Array Mapping
  - 保持現有 3 個功能卡片佈局（量子占卜、占卜分析、廢土主題）
  - 定義 FEATURES 常數陣列包含功能資料（icon, title, description）
  - 使用陣列映射模式渲染 PipBoyCard 元件（消除硬編碼 JSX）
  - 整合 PixelIcon 元件顯示功能圖示（size 40px, decorative 屬性）
  - 實作響應式網格：桌面 3 列（grid-cols-3），手機 1 列（grid-cols-1）
  - 保持區塊背景顏色（var(--color-pip-boy-green-5)）和邊框樣式
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 10.10_

- [ ] 23. Implement Social Proof Section
  - 定義 TESTIMONIALS 常數陣列包含 6 個使用者評價（繁體中文，Fallout 主題使用者名稱）
  - 配置見證資料：avatar (PixelIcon 名稱), username, rating (0-5), review
  - 使用陣列映射模式渲染 TestimonialCard 元件（消除硬編碼 JSX）
  - 實作響應式網格佈局：桌面 3 列（grid-cols-3），平板 2 列（grid-cols-2），手機 1 列（grid-cols-1）
  - 新增區塊標題 "倖存者見證" 並套用置中佈局和 Pip-Boy 主題樣式
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 10.10_

- [ ] 24. Implement Stats Counter Section
  - 建立客戶端 API 函數於 `src/lib/api.ts` 以獲取 `/api/v1/landing-stats` 資料
  - 實作 fetch 錯誤處理並使用 fallback 值（users: 1000, readings: 5000, cards: 78, providers: 3）
  - 定義統計資料陣列並使用陣列映射渲染 4 個 StatCounter 元件
  - 配置統計資料：icon (user, file-list-2, grid, cpu), value, label, suffix
  - 實作響應式網格：桌面 4 列（grid-cols-4），手機 2 列（grid-cols-2）
  - 新增區塊標題 "廢土統計數據" 並套用置中佈局
  - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8, 5.10, 9.4, 10.10_

- [ ] 25. Integrate FAQ Section
  - 定義 FAQ_ITEMS 常數陣列包含 8 個問題（繁體中文，Fallout 主題內容）
  - 透過 props 傳遞 FAQ_ITEMS 陣列至現有 FAQAccordion 元件
  - 新增區塊標題 "常見問題" 和副標題 "Frequently Asked Questions" 並套用置中佈局
  - 應用 Pip-Boy 主題區塊樣式（border-t-2 border-pip-boy-green, background var(--color-pip-boy-green-5)）
  - 驗證手風琴行為正常運作（展開/收合，平滑動畫轉換）
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.10_

- [ ] 26. Enhance CTA Section
  - 保持現有 CTA 區塊標題和副標題內容
  - 使用現有 PipBoyButton 元件渲染兩個行動按鈕（default 和 outline 變體）
  - 實作導航處理函數使用 window.location.href（註冊 Vault 帳號 → /auth/register, 瀏覽卡牌圖書館 → /cards）
  - 實作按鈕 hover 效果：hover:scale-105 transform
  - 實作響應式佈局：桌面水平按鈕（flex-row），手機垂直按鈕（flex-col）
  - 保持 border-2 border-pip-boy-green 和 padding p-8 樣式
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

- [ ] 27. Refactor Footer with Array Mapping
  - 定義 FOOTER_LINKS 常數陣列包含 4 個區塊（產品、資訊、法律、社群）
  - 使用巢狀陣列映射模式渲染頁尾連結區塊和連結項目（消除硬編碼 JSX）
  - 實作外部連結處理：檢查 external 屬性並新增 rel="noopener noreferrer" 和 target="_blank"
  - 顯示 Vault-Tec 免責聲明和版權聲明並套用適當樣式
  - 實作響應式網格：桌面 4 列（grid-cols-4），手機 1 列（grid-cols-1）
  - 新增連結 hover 效果：文字顏色從 text-pip-boy-green/70 轉換至 text-pip-boy-green
  - 應用 Pip-Boy 主題頁尾樣式（border-t-2 border-pip-boy-green, background, padding py-12）
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 10.10_

### Wave 5: Architecture & Styling Compliance (Parallel)

本波次確保架構和樣式規範符合性，所有任務可平行執行。

- [ ] 28. (P) Implement Server Component SEO Metadata
  - 更新 `src/app/page.tsx` 實作 generateMetadata() 函數以生成靜態 SEO 優化
  - 生成 metadata 包含首頁的 title, description, keywords
  - 確保 Server Component 不包含 useState, useEffect 或其他 React hooks
  - 從 Server Component 渲染 Client Component（不執行客戶端邏輯）
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 29. (P) Update Client Component Structure
  - 確保 `src/app/client-page.tsx` 檔案頂部包含 'use client' directive
  - 整合所有新區塊（How It Works, Social Proof, Stats Counter, FAQ, Footer）至 client component
  - 使用客戶端 API 工具 (`src/lib/api.ts`) 進行資料獲取（不使用 serverApi.ts）
  - 使用 React hooks 處理所有使用者互動（useState, useEffect, event handlers）
  - 驗證所有共用元件（StepCard, StatCounter, TestimonialCard）包含 'use client' directive
  - _Requirements: 9.3, 9.4, 9.6, 9.7, 9.8, 9.9_

- [ ] 30. (P) Apply Consistent Fallout Aesthetic
  - 驗證 Cubic 11 字型於所有首頁元件自動繼承（無顯式 font-family 宣告）
  - 確保所有圖示獨家使用 PixelIcon 元件（無 lucide-react 匯入）
  - 應用 Pip-Boy 色彩配置使用 Tailwind 工具類別（text-pip-boy-green, text-radiation-orange, border colors）
  - 使用 CSS 自訂屬性設定背景疊加層（var(--color-pip-boy-green-5), var(--color-pip-boy-green-10)）
  - 應用一致的邊框粗細（主要邊框 border-2，次要邊框 border）
  - 使用 Tailwind transition 工具實作 hover 效果（transition-colors, transition-transform, hover:scale-105）
  - 應用 CRT 掃描線效果（絕對定位 div 加上 gradient 背景）
  - 使用 Tailwind spacing scale 保持一致節奏（p-4, p-6, p-8, mb-4, mb-8, mb-12）
  - 實作響應式斷點（sm:, md:, lg:）以適應佈局
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

### Wave 6: E2E & Accessibility Tests (Parallel)

本波次實作端對端測試和無障礙性測試，所有任務可平行執行。

- [ ] 31. (P) Implement E2E Navigation Tests
  - 建立 Playwright 測試於 `tests/e2e/landing-page.spec.ts`
  - 撰寫測試案例：驗證點擊 Hero "進入 Vault" 按鈕導向 `/auth/login`（未認證使用者）
  - 撰寫測試案例：驗證點擊 "快速占卜" 按鈕導向 `/readings/quick`（未認證使用者）
  - 撰寫測試案例：驗證 FAQ accordion 項目正確展開和收合（含平滑動畫）
  - 撰寫測試案例：驗證 CTA 按鈕導航至正確路徑
  - 撰寫測試案例：驗證頁尾連結導航功能
  - _Requirements: 11.6, 11.7, 11.8_

- [ ] 32. (P) Implement Accessibility Tests
  - 建立無障礙性測試於 `tests/accessibility/landing-page-a11y.spec.ts` 使用 axe-core
  - 撰寫測試案例：驗證所有首頁區塊符合 WCAG AA 色彩對比要求
  - 撰寫測試案例：驗證所有互動元素支援鍵盤導航
  - 撰寫測試案例：驗證所有裝飾性 PixelIcon 包含 decorative prop
  - 撰寫測試案例：驗證所有互動性 PixelIcon 包含 aria-label 屬性
  - 撰寫測試案例：驗證頁面標題結構正確（h1, h2, h3 階層）
  - _Requirements: 11.9, 11.10_

### Wave 7: Performance Optimization & Final Validation (Sequential)

本波次進行效能優化和最終驗證，需依賴所有實作完成。

- [ ] 33. Optimize Landing Page Performance
  - 確保 Server Component 預渲染達成 TTFB < 500ms
  - 優化 Client Component 水合以達成 FCP < 1.5s 和 LCP < 2.5s
  - 實作圖片延遲載入（如有圖片）使用 loading="lazy" 屬性
  - 驗證 StatCounter 動畫使用 requestAnimationFrame 達成 60fps 效能
  - 優化 bundle 大小：Client Component 和共用元件貢獻 < 50KB（gzipped）
  - 達成 CLS 分數 < 0.1（渲染期間避免佈局偏移）
  - 執行 Lighthouse 效能測試，目標分數 >= 90
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

---

## Requirements Coverage Summary

所有 12 個需求均已映射至實作任務：

- **Req 1 (Hero Section 優化)**: Tasks 12, 20
- **Req 2 (How It Works)**: Tasks 3, 9, 13, 21
- **Req 3 (Features Grid 重構)**: Tasks 14, 22
- **Req 4 (Social Proof)**: Tasks 5, 11, 15, 23
- **Req 5 (Stats Counter)**: Tasks 1, 2, 4, 6, 7, 8, 10, 16, 24
- **Req 6 (FAQ Section)**: Tasks 17, 25
- **Req 7 (CTA Section)**: Tasks 18, 26
- **Req 8 (Footer Enhancement)**: Tasks 19, 27
- **Req 9 (架構規範)**: Tasks 2, 28, 29
- **Req 10 (樣式規範)**: Tasks 3, 5, 9, 11, 30
- **Req 11 (測試需求)**: Tasks 1, 3, 4, 5, 12-19, 31, 32
- **Req 12 (效能需求)**: Tasks 4, 10, 33

## Execution Strategy

### TDD Workflow
1. **Red Phase**: 執行 Wave 1-3 測試（測試失敗）
2. **Green Phase**: 執行 Wave 2, 4 實作（測試通過）
3. **Refactor Phase**: 執行 Wave 5 架構調整和 Wave 7 效能優化

### Parallelization Summary
- **Wave 1**: 5 個測試任務，完全平行執行
- **Wave 2**: 6 個實作任務，完全平行執行
- **Wave 3**: 8 個測試任務，完全平行執行
- **Wave 4**: 8 個實作任務，部分順序依賴
- **Wave 5**: 3 個合規性任務，完全平行執行
- **Wave 6**: 2 個測試任務，完全平行執行
- **Wave 7**: 1 個效能優化任務，需等待所有實作完成

**總計**: 33 個任務，其中 24 個標記為平行執行 (P)

---

**文件版本**: 2.0 (TDD + Maximum Parallelization)
**建立日期**: 2025-11-16
**更新日期**: 2025-11-16
**語言**: Traditional Chinese (zh-TW)
**規範遵循**: Kiro Task Generation Rules, TDD Architecture, Maximum Parallelization Strategy
