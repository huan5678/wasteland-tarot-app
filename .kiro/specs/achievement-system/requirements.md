# Requirements Document

## Project Description (Input)

成就系統（Achievement System）- 遊戲化使用者進度追蹤與獎勵機制

### 功能概述
建立完整的成就系統，追蹤使用者在平台上的各種行為（占卜、社交、Bingo 等），並在達成特定里程碑時給予可視化的徽章、稱號和 Karma 獎勵，提升使用者參與度和留存率。

### 核心需求
1. 成就定義系統（15-20 個初始成就，涵蓋占卜、社交、Bingo、Karma、探索等類別）
2. 進度追蹤機制（即時或定期計算使用者進度）
3. 解鎖邏輯（在關鍵事件觸發檢查）
4. 獎勵發放（Karma 點數、稱號、徽章）
5. 前端 UI 展示（/profile/achievements 頁面 + 解鎖彈窗）
6. 歷史資料回溯（系統上線時計算既有使用者的初始進度）

### 技術約束
- 後端：FastAPI + SQLAlchemy，新增 Achievement 和 UserAchievement 模型
- 前端：Next.js + Zustand，新增 achievementStore
- 整合：與現有 Karma 系統、Bingo 獎勵、Analytics 整合
- 效能：使用 Redis cache 避免頻繁計算
- 風格：Fallout Pip-Boy 主題，使用 Cubic 11 字體和 PixelIcon

### 成功指標
- 80%+ 使用者在首週解鎖至少 1 個成就
- 留存率提升 15-20%（對比無成就系統時期）
- 平均每使用者解鎖 5+ 個成就/月

## Requirements
<!-- Will be generated in /kiro:spec-requirements phase -->
