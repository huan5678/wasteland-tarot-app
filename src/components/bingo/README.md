# 賓果簽到遊戲 - 前端實作

## 概述

本目錄包含每日賓果簽到遊戲的所有前端元件，實作了 Tasks 17-26 的所有功能。

## 已完成的元件

### 狀態管理
- **`/src/lib/stores/bingoStore.ts`** - Zustand Store
  - 完整的狀態管理（dailyNumber, userCard, claimedNumbers, lineCount, hasReward）
  - API 整合（8個端點）
  - JWT 認證
  - 號碼驗證邏輯

### UI 元件

1. **`BingoCardSetup.tsx`** - 賓果卡設定介面
   - 1-25 號碼選擇器（Grid 佈局）
   - 即時驗證與錯誤提示
   - 隨機填充功能
   - Fallout/Wasteland 風格設計

2. **`BingoGrid.tsx`** - 賓果卡顯示
   - 5x5 Grid 渲染
   - 已領取號碼高亮
   - 今日號碼特效
   - SVG 連線視覺化（橫/直/斜）

3. **`DailyCheckin.tsx`** - 每日簽到
   - 顯示今日系統號碼
   - 領取按鈕與狀態管理
   - 已領取狀態處理
   - 成功動畫

4. **`LineIndicator.tsx`** - 連線進度指示器
   - 顯示連線數量（0-3）
   - 進度條視覺化
   - 連線類型圖示
   - Framer Motion 動畫

5. **`RewardNotification.tsx`** - 獎勵通知 Modal
   - 三連線慶祝動畫
   - 粒子效果
   - 獎勵詳情顯示
   - 自動/手動關閉

6. **`BingoHistory.tsx`** - 歷史記錄查詢
   - 月份選擇器（最近12個月）
   - 歷史賓果卡顯示
   - 領取記錄與連線統計
   - 獎勵狀態

### 主頁面

- **`/src/app/bingo/page.tsx`** - 賓果遊戲主頁面
  - JWT 認證保護
  - 動態介面切換（設定 vs 遊戲）
  - Tab 導航（遊戲 / 歷史）
  - Responsive 佈局

### 導航整合

- **`Header.tsx`** - Desktop 導航
  - 新增「賓果簽到」連結
  - 未領取提示紅點

- **`MobileNavigation.tsx`** - Mobile 導航
  - 新增「賓果」選項
  - 圖示整合

## 技術規格

### 依賴套件
- **Zustand** - 狀態管理
- **Framer Motion** - 動畫效果
- **Tailwind CSS** - 樣式設計
- **Lucide React** - 圖示

### API 端點整合
所有元件已整合以下後端 API：
- `POST /api/v1/bingo/card` - 建立賓果卡
- `GET /api/v1/bingo/card` - 取得使用者賓果卡
- `GET /api/v1/bingo/status` - 取得遊戲狀態
- `POST /api/v1/bingo/claim` - 領取每日號碼
- `GET /api/v1/bingo/daily-number` - 取得今日號碼
- `GET /api/v1/bingo/lines` - 取得連線狀態
- `GET /api/v1/bingo/history/{month}` - 取得歷史記錄
- `GET /api/v1/bingo/rewards` - 取得獎勵記錄

### 設計風格
- **主題**: Fallout/Wasteland 廢土風格
- **色彩**: 琥珀色/綠色/黑色
- **字體**: Monospace（終端機風格）
- **動畫**: 流暢且符合主題

## 使用流程

1. **首次訪問**: 使用者看到 `BingoCardSetup` 介面，選擇 25 個號碼建立賓果卡
2. **每日簽到**: 使用者點擊 `DailyCheckin` 領取今日號碼
3. **查看進度**: `LineIndicator` 顯示當前連線數與進度
4. **達成獎勵**: 三連線時自動顯示 `RewardNotification`
5. **查看歷史**: 切換至「歷史記錄」Tab 查詢過往月份

## 待整合功能

- [ ] 音效系統整合（Web Audio API）
- [ ] 單元測試（React Testing Library）
- [ ] E2E 測試（Playwright）

## 檔案結構

```
src/
├── lib/
│   └── stores/
│       └── bingoStore.ts          # Zustand Store
├── components/
│   └── bingo/
│       ├── BingoCardSetup.tsx     # 設定元件
│       ├── BingoGrid.tsx          # 賓果卡顯示
│       ├── DailyCheckin.tsx       # 每日簽到
│       ├── LineIndicator.tsx      # 連線指示器
│       ├── RewardNotification.tsx # 獎勵通知
│       ├── BingoHistory.tsx       # 歷史記錄
│       └── README.md              # 本文件
└── app/
    └── bingo/
        └── page.tsx               # 主頁面
```

## 開發指南

### 新增功能
1. 在 `bingoStore.ts` 新增 action
2. 在對應元件中使用 `useBingoStore()` hook
3. 遵循 Fallout/Wasteland 設計風格

### 修改樣式
所有元件使用 Tailwind CSS，主要色彩變數：
- `text-amber-400` - 主要文字
- `text-green-400` - 成功狀態
- `bg-black` - 背景
- `border-amber-600` - 邊框

### 測試
（待實作）

## 相關文件

- [Specification](../../../.kiro/specs/daily-bingo-checkin/)
- [Tasks](../../../.kiro/specs/daily-bingo-checkin/tasks.md)
- [Requirements](../../../.kiro/specs/daily-bingo-checkin/requirements.md)
