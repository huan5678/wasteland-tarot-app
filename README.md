# Wasteland Tarot - Next.js Application

一個結合 Fallout 世界觀的塔羅牌應用程式,提供卡牌瀏覽、占卜解讀與社交功能。

## 🎯 功能特色

### 卡牌系統
- **花色選擇介面**: 瀏覽 5 個花色(大阿爾克那 + 4 個小阿爾克那)
- **卡牌列表**: 分頁顯示卡牌,支援響應式佈局
- **卡牌詳細頁面**: 完整的卡牌資訊,包含正逆位牌義、Fallout 主題描述
- **圖片優化**: Next.js Image 元件,自動 WebP/AVIF 轉換
- **快取機制**: SessionStorage 快取,減少 API 請求

### 技術亮點
- ✅ **Next.js 15.1.7** (App Router)
- ✅ **TypeScript 5** 完整型別支援
- ✅ **Tailwind CSS v4** Pip-Boy 主題設計
- ✅ **Zustand** 狀態管理與快取
- ✅ **無障礙性** WCAG 2.1 AA 標準
- ✅ **效能優化** Lighthouse > 90 分
- ✅ **E2E 測試** Playwright 測試覆蓋

## 📦 安裝與開發

### 前提需求
- Node.js 18+
- Bun (推薦) 或 npm/pnpm

### 安裝依賴

使用 Bun (推薦):
```bash
bun install
```

或使用 npm:
```bash
npm install
```

### 開發模式

```bash
bun dev
# 或
npm run dev
```

訪問 http://localhost:3000

### 生產建置

```bash
bun run build
bun start
# 或
npm run build
npm start
```

## 🗂️ 專案結構

```
/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── cards/              # 卡牌頁面
│   │   │   ├── page.tsx        # 花色選擇頁面
│   │   │   ├── [suit]/         # 卡牌列表頁面
│   │   │   └── [suit]/[cardId]/ # 卡牌詳細頁面
│   │   └── ...
│   ├── components/             # React 元件
│   │   ├── cards/              # 卡牌相關元件
│   │   ├── navigation/         # 導航元件
│   │   └── ui/                 # UI 元件
│   ├── lib/                    # 工具函式與配置
│   │   └── utils/
│   │       └── cardImages.ts   # 卡牌圖片工具函式
│   ├── stores/                 # Zustand 狀態管理
│   │   └── cardsStore.ts       # 卡牌 Store
│   ├── types/                  # TypeScript 型別定義
│   │   ├── suits.ts            # 花色型別與配置
│   │   └── api.ts              # API 型別
│   └── hooks/                  # 自定義 Hooks
├── public/
│   └── assets/
│       └── cards/              # 卡牌圖片資源
├── docs/                       # 技術文件
│   ├── cards-components.md     # 元件使用文件
│   └── card-utils.md           # 工具函式文件
├── tests/
│   └── e2e/                    # E2E 測試
└── ...
```

## 🎴 卡牌頁面架構

### 導航流程

```
花色選擇 (/cards)
    ↓
卡牌列表 (/cards/[suit]?page=N)
    ↓
卡牌詳細 (/cards/[suit]/[cardId])
```

### 花色列表

| 花色 | 中文名稱 | 英文名稱 | 卡牌數量 |
|------|---------|---------|---------|
| major_arcana | 大阿爾克那 | Major Arcana | 22 |
| nuka_cola | Nuka-Cola 瓶(聖杯) | Nuka-Cola Bottles (Cups) | 14 |
| combat_weapons | 戰鬥武器(寶劍) | Combat Weapons (Swords) | 14 |
| bottle_caps | 瓶蓋(錢幣) | Bottle Caps (Pentacles) | 14 |
| radiation_rods | 輻射棒(權杖) | Radiation Rods (Wands) | 14 |

## 🧪 測試

### 單元測試

```bash
npm run test
```

### E2E 測試

```bash
npm run test:playwright
```

### 測試覆蓋率

```bash
npm run test:coverage
```

## 📚 文件

- [元件使用文件](./docs/cards-components.md)
- [工具函式文件](./docs/card-utils.md)
- [CHANGELOG](./CHANGELOG.md)

## 🚀 效能指標

- **首次內容繪製 (FCP)**: < 1.5s
- **最大內容繪製 (LCP)**: < 2.5s
- **Lighthouse 分數**: > 90
- **初始 JavaScript bundle**: < 200KB (gzipped)

## ♿ 無障礙性

所有元件遵循 WCAG 2.1 AA 標準:
- ✅ 鍵盤導航支援
- ✅ 螢幕閱讀器相容
- ✅ ARIA 標籤完整
- ✅ 視覺聚焦指示器
- ✅ 語意化 HTML

## 🛠️ 技術堆疊

### 前端
- **框架**: Next.js 15.1.7 (App Router)
- **UI 函式庫**: React 19
- **型別系統**: TypeScript 5
- **樣式**: Tailwind CSS v4
- **狀態管理**: Zustand
- **表單處理**: React Hook Form + Zod
- **動畫**: Motion (Framer Motion)

### 後端
- **API**: FastAPI (Python)
- **資料庫**: PostgreSQL via Supabase
- **快取**: SessionStorage (前端)

### 測試
- **單元測試**: Jest + React Testing Library
- **E2E 測試**: Playwright
- **無障礙性測試**: axe-core

### 開發工具
- **套件管理**: Bun
- **Linting**: ESLint
- **格式化**: Prettier
- **Git Hooks**: Husky (可選)

## 📄 授權

本專案為私人專案。

## 👥 貢獻

歡迎提交 Issue 或 Pull Request!

## 📞 聯絡

如有問題或建議,請透過 Issues 聯絡。

---

Built with ❤️ using Next.js, Tailwind CSS, and the Fallout universe aesthetic.
