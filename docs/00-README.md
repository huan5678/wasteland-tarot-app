# 塔羅牌應用程式文件中心

## 📚 文件架構概述

本專案採用分類式文件架構，便於不同角色的團隊成員快速找到所需資訊。

### 🗂️ 文件分類

| 分類 | 說明 | 目標使用者 |
|------|------|------------|
| **01-product** | 產品規格與使用者研究 | PM、UX、業務 |
| **02-design** | 設計系統與視覺規範 | 設計師、前端開發 |
| **03-technical** | 技術架構與 API 文件 | 開發工程師 |
| **04-ux** | 使用者體驗與互動流程 | UX 設計師、前端 |
| **05-content** | 內容策略與文案規範 | 內容團隊、文案 |
| **06-deployment** | 部署與維運文件 | DevOps、SRE |

### 🚀 混合架構概述

本專案正在從 Next.js 全端應用轉換為前後端分離的混合架構：

- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **後端**: FastAPI + PostgreSQL + Redis + OpenAI API

### 📖 文件使用指南

1. **新成員入門**: 先讀 `01-product/PRD.md` 了解產品概述
2. **設計師**: 重點關注 `02-design/` 和 `04-ux/` 目錄
3. **前端開發**: 參考 `02-design/` 和 `03-technical/`
4. **後端開發**: 主要使用 `03-technical/` 目錄
5. **內容團隊**: 參考 `05-content/` 目錄

### 🔄 文件更新原則

- 所有文件變更須通過 PR 審查
- 重大架構變更需更新相關文件
- 保持文件與程式碼同步更新


### 🧪 近期已完成實作快照
- 前端狀態管理：Zustand (auth / readings / ui / error)
- 全域錯誤處理：ErrorBoundary + errorStore + API retry/interceptor + network offline 偵測
- 閱讀功能：ReadingHistory + 詳細視窗 (ReadingDetailModal) + 收藏 (is_favorite, optimistic update)
- Logging/Metrics：初步 logger + Web Vitals 初始化
- 後端：新增 readings is_favorite 欄位與更新支援

### 🎯 下一步計畫（短期）
1. Spread Template 系統 (read-only API + 前端 selector/store)
2. Tags / Notes / Favorites 系統化（reading metadata 擴充）
3. Export / Analytics / Search 端點 (4.2.x)
4. Celtic Cross & 自訂 Spread 支援 (5.2.x / 5.1.x 延伸)
5. 行為追蹤 logEvent 事件：view_detail / toggle_favorite / delete / create

### 🛠 建議文件待補清單
| 類別 | 檔案/區塊 | 說明 |
|------|-----------|------|
| 03-technical | architecture/state-management.md | 說明各 store 職責 & 跨層協作流程 |
| 03-technical | api/readings.md | 新增 is_favorite / update / delete / 結構與範例 |
| 03-technical | api/spreads.md | SpreadTemplate 讀取 API (完成後) |
| 02-design | ui/readings-experience.md | 閱讀列表、Modal、互動模式與空狀態規則 |
| 04-ux | flows/reading-lifecycle.md | 從建立 → 檢視 → 收藏/標籤 → 刪除的 UX Flow |
| 05-content | tone/interpretation-style.md | 解讀語氣 / character_voice 規則草稿 |

### ✅ 文件同步原則補充
- 新增資料表欄位（如 is_favorite）→ 必須同日更新對應 API 文件 & 型別說明
- 新增 store → 需在 state-management.md 中掛載責任區域與副作用來源
- 新增可觀測性（metrics/logEvent）→ 補充追蹤事件字典

---

---

*最後更新：2024-09-22*