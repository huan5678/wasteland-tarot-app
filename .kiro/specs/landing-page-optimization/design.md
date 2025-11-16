# Design Document - Landing Page Optimization

---

## Overview

### Purpose

本專案旨在完善廢土塔羅平台的首頁登陸頁面，將現有的基礎 3 區塊（Hero Section、Features Section、CTA Section）擴展為符合 2025 年登陸頁面最佳實踐的完整 11 區塊架構。透過新增 How It Works、Social Proof、Stats Counter、FAQ 等區塊，提升使用者轉換率、建立品牌信任度，並提供完整的產品價值主張。

### Users

**主要使用者**：新訪客、潛在註冊用戶、未登入試用者
**次要使用者**：已登入用戶（瀏覽首頁以開始新占卜或查看功能更新）

### Impact

**當前狀態**：首頁僅包含 3 個區塊，缺乏使用流程說明、社會證明、統計數據和常見問題解答，導致：
- 新用戶不了解如何開始使用
- 缺少信任度建立機制
- 轉換率不足

**改變後狀態**：
- 新增 8 個標準登陸頁面區塊
- 前端實作 3 個共用元件（StepCard、StatCounter、TestimonialCard）
- 後端新增統計數據 API（`/api/v1/landing-stats`）
- 重構現有硬編碼區塊（Features Grid、Footer）以符合 CLAUDE.md 2.3.1 規範
- 遵循 Next.js 15 Server/Client Component 架構優化 SEO

---

## Goals

### Primary Objectives

1. **提高轉換率**：透過完整的價值主張展示和信任建立機制，提升註冊率和快速占卜使用率
2. **改善使用者體驗**：提供清晰的使用流程說明、常見問題解答、統計數據展示
3. **遵循最佳實踐**：符合 2025 年登陸頁面標準架構和 SEO 優化規範
4. **程式碼品質**：消除硬編碼重複、建立可復用元件、遵循專案規範

### Success Criteria

- **效能指標**：Lighthouse Performance ≥ 90, FCP < 1.5s, LCP < 2.5s, CLS < 0.1
- **測試覆蓋率**：前端 ≥ 80%, 後端 ≥ 85%
- **無障礙性**：WCAG AA 合規
- **程式碼品質**：零硬編碼重複（所有重複元素使用陣列映射）

---

## Non-Goals

1. **多語言支援**：本階段僅支援繁體中文（zh-TW）
2. **A/B 測試系統**：不實作動態內容實驗框架
3. **客製化內容**：不根據使用者歷史記錄個性化登陸頁面
4. **後端資料庫遷移**：不修改現有資料庫 schema（`users` 和 `readings` 表已存在）

---

## Architecture

### Existing Architecture Analysis

當前首頁架構：
- **Server Component**: `src/app/page.tsx` - 僅生成靜態 metadata
- **Client Component**: `src/app/client-page.tsx` - 包含 3 個區塊（Hero、Features、CTA）
- **共用元件**：使用 `PipBoyCard`, `PipBoyButton`, `PixelIcon`
- **動畫元件**：使用 `DynamicHeroTitle` 實現標題打字效果

**保留的架構模式**：
- Next.js 15 App Router with Server/Client Component 分離
- Zustand for client-side state (authStore)
- Fallout Pip-Boy 主題設計系統
- PixelIcon for all icons (禁用 lucide-react)

**需要新增的架構元件**：
- 3 個新的共用元件（`StepCard`, `StatCounter`, `TestimonialCard`）
- 1 個後端 API 端點（`/api/v1/landing-stats`）
- 資料陣列定義（FAQ items, Testimonials, Steps, Footer links）

### Architecture Pattern & Boundary Map

```mermaid
graph TB
    subgraph "Frontend - Next.js 15"
        A[Server Component<br/>page.tsx] -->|metadata only| B[Client Component<br/>client-page.tsx]

        B --> C[Hero Section<br/>DynamicHeroTitle]
        B --> D[How It Works Section<br/>StepCard x4]
        B --> E[Features Grid Section<br/>PipBoyCard x3]
        B --> F[Social Proof Section<br/>TestimonialCard x6]
        B --> G[Stats Counter Section<br/>StatCounter x4]
        B --> H[FAQ Section<br/>FAQAccordion]
        B --> I[CTA Section<br/>PipBoyButton]
        B --> J[Footer Section<br/>Array Mapping]

        G -->|fetch| K[Client API<br/>api.ts]
    end

    subgraph "Backend - FastAPI"
        L[Landing Stats API<br/>/api/v1/landing-stats] --> M[Supabase PostgreSQL]
        M -->|COUNT users| N[users table]
        M -->|COUNT readings| O[reading_sessions table]
    end

    K -->|HTTP GET| L

    style A fill:#1a1a1a,stroke:#00ff88,stroke-width:2px
    style B fill:#1a1a1a,stroke:#ff8800,stroke-width:2px
    style L fill:#1a1a1a,stroke:#00ff88,stroke-width:2px
    style M fill:#0f172a,stroke:#0055aa,stroke-width:2px
```

**Domain Boundaries**:
- **Presentation Layer**: Client Component 負責所有 UI 渲染和互動
- **Data Fetching Layer**: Client API (`api.ts`) 負責統計數據獲取
- **Business Logic Layer**: Backend API 負責資料庫查詢和計算
- **Data Layer**: Supabase PostgreSQL 儲存使用者和占卜資料

**New Components Rationale**:
- `StepCard`: 可復用的步驟卡片，未來可用於其他教學流程
- `StatCounter`: 可復用的數字動畫元件，未來可用於 Dashboard
- `TestimonialCard`: 可復用的使用者評價卡片，未來可用於 Social Features

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| **Frontend** | | | |
| Framework | Next.js 15.1.7 | Server/Client Component 分離 | App Router 架構 |
| Language | TypeScript 5 | 型別安全 | Strict mode enabled |
| Runtime | Bun | Package management | 替代 npm/yarn |
| Styling | Tailwind CSS v4.1.13 | Fallout 主題樣式 | 使用 CSS 變數 |
| Icons | PixelIcon (RemixIcon 4.7.0) | 圖示系統 | **禁用 lucide-react** |
| Font | Cubic 11 | 點陣字體 | 自動繼承 |
| State | Zustand | authStore | 使用者登入狀態 |
| Animation | Tailwind Animations | 動畫效果 | scanline, pulse, bounce, wiggle |
| **Backend** | | | |
| Framework | FastAPI 0.104.0+ | RESTful API | ASGI server |
| Language | Python 3.11+ | 後端邏輯 | Type hints required |
| Package Manager | uv | Virtual environment | `/backend/.venv` |
| ORM | SQLAlchemy 2.0.23+ | 資料庫查詢 | Async support |
| Database | Supabase PostgreSQL | 資料儲存 | Managed service |
| **Data** | | | |
| Users Table | `users` | 使用者資料 | 已存在 |
| Readings Table | `reading_sessions` | 占卜記錄 | 已存在 |

**技術選擇理由**:

1. **Next.js 15 Server/Client Component**: 優化 SEO（Server Component 生成 metadata），同時保持互動性（Client Component）
2. **PixelIcon (RemixIcon)**: 2800+ 圖示、純 CSS 實作、零 JS bundle 增加、符合 Fallout 像素風格
3. **Tailwind CSS v4**: 簡化 Fallout 主題實作、使用 CSS 變數（`var(--color-pip-boy-green-10)`）
4. **Zustand**: 輕量級狀態管理，僅用於 authStore（避免過度工程化）
5. **SQLAlchemy + Supabase**: 已有基礎設施，無需額外設定

---

## System Flows

### 1. Page Load Flow (Initial Visit)

```mermaid
sequenceDiagram
    participant U as User
    participant SC as Server Component<br/>(page.tsx)
    participant CC as Client Component<br/>(client-page.tsx)
    participant API as Client API<br/>(api.ts)
    participant BE as Backend API<br/>(/api/v1/landing-stats)
    participant DB as Supabase DB

    U->>SC: GET /
    SC->>SC: Generate metadata<br/>(title, description)
    SC->>U: HTML with metadata

    U->>CC: Hydrate client component
    CC->>CC: Render static sections<br/>(Hero, How It Works, FAQ, etc.)

    par Fetch Stats Data
        CC->>API: fetch /api/v1/landing-stats
        API->>BE: GET request
        BE->>DB: COUNT(users), COUNT(readings)
        DB-->>BE: { users: 1234, readings: 5678 }
        BE-->>API: JSON response
        API-->>CC: Stats data
    end

    CC->>CC: Animate StatCounter<br/>(0 → target value)
    CC->>U: Full page rendered
```

**Flow-level Decisions**:
- **Parallel Data Fetching**: 統計數據與頁面渲染並行，避免阻塞渲染
- **Fallback Values**: API 失敗時顯示預設值（users: 1000, readings: 5000）
- **Animation Trigger**: StatCounter 動畫僅在元件 mount 後觸發（避免 SSR 問題）

### 2. StatCounter Animation Flow

```mermaid
stateDiagram-v2
    [*] --> Idle: Component Mount
    Idle --> Fetching: useEffect triggered
    Fetching --> Animating: API success
    Fetching --> Fallback: API failure

    Animating --> Complete: 2 seconds elapsed
    Fallback --> Complete: Display fallback values

    Complete --> [*]

    note right of Animating
        requestAnimationFrame
        Easing function: easeOutQuad
        Duration: 2000ms
    end note

    note right of Fallback
        users: 1000
        readings: 5000
        cards: 78
        providers: 3
    end note
```

**Flow-level Decisions**:
- **requestAnimationFrame**: 確保 60fps 動畫效能
- **Easing Function**: easeOutQuad 提供自然減速效果
- **Fallback Strategy**: API 失敗不影響使用者體驗

### 3. User Interaction Flow (CTA Click)

```mermaid
flowchart TD
    A[User clicks CTA] --> B{User logged in?}

    B -->|Yes| C[Navigate to /dashboard]
    B -->|No| D{Button type?}

    D -->|"進入 Vault"| E[Navigate to /auth/login]
    D -->|"快速占卜"| F[Navigate to /readings/quick]
    D -->|"註冊 Vault 帳號"| G[Navigate to /auth/register]
    D -->|"瀏覽卡牌圖書館"| H[Navigate to /cards]

    C --> I[End]
    E --> I
    F --> I
    G --> I
    H --> I
```

**Flow-level Decisions**:
- **Auth State Check**: 使用 Zustand authStore 判斷登入狀態
- **Navigation Method**: 使用 `window.location.href`（保持與現有實作一致）
- **未登入快速占卜**: 導向 `/readings/quick`（無需註冊）

---

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| **1** | Hero Section 優化 | DynamicHeroTitle, PipBoyButton | AuthStore | Page Load |
| **2** | How It Works | StepCard | StepCardProps | - |
| **3** | Features Grid 重構 | PipBoyCard | Array Mapping | - |
| **4** | Social Proof | TestimonialCard | TestimonialCardProps | - |
| **5** | Stats Counter | StatCounter | LandingStatsAPI | StatCounter Animation |
| **6** | FAQ Section | FAQAccordion | FAQ Array | - |
| **7** | CTA Section | PipBoyButton | AuthStore | User Interaction |
| **8** | Footer Enhancement | Array Mapping | Footer Links Array | - |
| **9** | 架構規範 | Server/Client Component | serverApi vs api | Page Load |
| **10** | 樣式規範 | PixelIcon, Cubic 11 | - | - |
| **11** | 測試需求 | Jest, Playwright, pytest | - | - |
| **12** | 效能需求 | React.memo, requestAnimationFrame | - | StatCounter Animation |

---

## Components and Interfaces

### Component Summary

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies (P0/P1) | Contracts |
|-----------|--------------|--------|--------------|--------------------------|-----------|
| **StepCard** | Landing/UI | 顯示使用流程步驟 | 2 | PixelIcon (P0) | UI Component |
| **StatCounter** | Landing/UI | 顯示動畫數字統計 | 5 | LandingStatsAPI (P0) | UI Component |
| **TestimonialCard** | Landing/UI | 顯示使用者評價 | 4 | PixelIcon (P0), PipBoyCard (P1) | UI Component |
| **LandingStatsService** | Backend/API | 統計數據查詢 | 5 | SQLAlchemy (P0), Supabase (P0) | API Contract |
| **Client Page** | Landing/Page | 首頁主元件 | 1-8 | All Components (P0) | - |

### Frontend Components (UI Layer)

#### StepCard Component

| Field | Detail |
|-------|--------|
| Intent | 可復用的步驟卡片元件，用於展示使用流程 |
| Requirements | 2 |
| Path | `src/components/landing/StepCard.tsx` |

**Responsibilities & Constraints**
- 顯示步驟編號、圖示、標題、說明文字
- 支援 hover 互動效果（scale transform + glow）
- 遵循 Pip-Boy 主題樣式
- 響應式佈局（桌面 4 列、手機 1 列）

**Dependencies**
- **Inbound**: Client Page Component (P0)
- **Outbound**: PixelIcon (P0) - 步驟圖示
- **External**: Tailwind CSS (P0) - 樣式

**Contracts**: UI Component

##### Component Interface

```typescript
export interface StepCardProps {
  /**
   * 步驟編號（1-4）
   */
  stepNumber: number

  /**
   * RemixIcon 圖示名稱
   * @example "layout-grid", "shuffle", "hand", "cpu"
   */
  icon: string

  /**
   * 步驟標題（繁體中文）
   * @example "選擇牌陣"
   */
  title: string

  /**
   * 步驟說明文字（繁體中文）
   * @example "從多種廢土主題牌陣中選擇適合的占卜方式"
   */
  description: string
}

/**
 * StepCard 元件
 * 可復用的步驟卡片，用於 How It Works 區塊
 */
export function StepCard(props: StepCardProps): JSX.Element
```

**Implementation Notes**
- **樣式**: 使用 PipBoyCard 作為基礎容器，覆蓋 border 和 background
- **動畫**: hover 時應用 `hover:scale-105 transition-transform duration-300`
- **圖示**: PixelIcon size=40, decorative=true
- **響應式**: 桌面 4 列（grid-cols-4）、手機 1 列（grid-cols-1）

---

#### StatCounter Component

| Field | Detail |
|-------|--------|
| Intent | 可復用的數字動畫元件，從 0 動畫到目標數值 |
| Requirements | 5 |
| Path | `src/components/landing/StatCounter.tsx` |

**Responsibilities & Constraints**
- 從 0 動畫到目標數值（2 秒內完成）
- 使用 requestAnimationFrame 確保 60fps
- 支援數字後綴（例如 "+" 表示超過此數）
- 顯示圖示和標籤文字
- 響應式佈局（桌面 4 列、手機 2 列）

**Dependencies**
- **Inbound**: Client Page Component (P0)
- **Outbound**: PixelIcon (P0) - 統計圖示
- **External**: React hooks (useState, useEffect, useRef) (P0)

**Contracts**: UI Component

##### Component Interface

```typescript
export interface StatCounterProps {
  /**
   * RemixIcon 圖示名稱
   * @example "user", "file-list-2", "grid", "cpu"
   */
  icon: string

  /**
   * 目標數值
   * @example 1234
   */
  value: number

  /**
   * 標籤文字（繁體中文）
   * @example "總用戶數"
   */
  label: string

  /**
   * 數字後綴（可選）
   * @example "+"
   */
  suffix?: string
}

/**
 * StatCounter 元件
 * 數字動畫元件，從 0 動畫到目標數值
 */
export function StatCounter(props: StatCounterProps): JSX.Element
```

**Implementation Notes**
- **動畫邏輯**:
  ```typescript
  const easeOutQuad = (t: number) => t * (2 - t)

  useEffect(() => {
    const duration = 2000 // 2 seconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuad(progress)

      setDisplayValue(Math.floor(easedProgress * props.value))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [props.value])
  ```
- **樣式**: 大數字（text-4xl）、小標籤（text-sm）
- **響應式**: 桌面 4 列（grid-cols-4）、手機 2 列（grid-cols-2）

---

#### TestimonialCard Component

| Field | Detail |
|-------|--------|
| Intent | 可復用的使用者評價卡片元件 |
| Requirements | 4 |
| Path | `src/components/landing/TestimonialCard.tsx` |

**Responsibilities & Constraints**
- 顯示使用者頭像（Fallout 角色圖示）
- 顯示使用者名稱（Fallout 主題）
- 顯示評分星星（0-5 星）
- 顯示評價文字
- 遵循 Pip-Boy 主題樣式

**Dependencies**
- **Inbound**: Client Page Component (P0)
- **Outbound**: PixelIcon (P0) - 頭像圖示、星星圖示
- **Outbound**: PipBoyCard (P1) - 基礎卡片容器
- **External**: Tailwind CSS (P0) - 樣式

**Contracts**: UI Component

##### Component Interface

```typescript
export interface TestimonialCardProps {
  /**
   * 頭像圖示（PixelIcon 名稱）
   * @example "user-3", "user-6", "skull", "shield"
   */
  avatar: string

  /**
   * 使用者名稱（Fallout 主題）
   * @example "避難所111號倖存者"
   */
  username: string

  /**
   * 評分（0-5）
   * @example 5
   */
  rating: number

  /**
   * 評價文字（繁體中文）
   * @example "這個平台的 AI 占卜準到可怕..."
   */
  review: string
}

/**
 * TestimonialCard 元件
 * 使用者評價卡片
 */
export function TestimonialCard(props: TestimonialCardProps): JSX.Element
```

**Implementation Notes**
- **星星渲染**:
  ```typescript
  const stars = Array.from({ length: 5 }, (_, i) => (
    <PixelIcon
      key={i}
      name={i < rating ? "star-fill" : "star"}
      variant={i < rating ? "primary" : "muted"}
      sizePreset="xs"
      decorative
    />
  ))
  ```
- **樣式**: 使用 PipBoyCard 作為基礎，border-2 border-pip-boy-green
- **響應式**: 桌面 3 列、平板 2 列、手機 1 列

---

### Backend Components (API Layer)

#### Landing Stats Service

| Field | Detail |
|-------|--------|
| Intent | 提供首頁統計數據 API（總用戶數、總占卜次數、卡牌數、AI 供應商數） |
| Requirements | 5 |
| Path | `backend/app/api/v1/endpoints/landing_stats.py` |

**Responsibilities & Constraints**
- 查詢 Supabase PostgreSQL 資料庫
- 回傳 JSON 格式統計數據
- 支援快取機制（未來擴展：Redis）
- 錯誤處理（資料庫連線失敗時回傳預設值）

**Dependencies**
- **Inbound**: Frontend Client API (`api.ts`) (P0)
- **Outbound**: SQLAlchemy ORM (P0) - 資料庫查詢
- **Outbound**: Supabase PostgreSQL (P0) - 資料庫
- **External**: FastAPI Router (P0) - 路由定義

**Contracts**: API Contract

##### API Contract

| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| GET | `/api/v1/landing-stats` | None | `LandingStatsResponse` | 500 (Database error) |

**Request**: None (GET endpoint, no parameters)

**Response Schema**:

```python
from pydantic import BaseModel

class LandingStatsResponse(BaseModel):
    """
    Landing page statistics response
    """
    users: int  # Total registered users
    readings: int  # Total completed readings
    cards: int  # Total tarot cards (always 78)
    providers: int  # AI providers count (always 3)

    class Config:
        json_schema_extra = {
            "example": {
                "users": 1234,
                "readings": 5678,
                "cards": 78,
                "providers": 3
            }
        }
```

**TypeScript Interface** (`src/types/api.ts`):

```typescript
export const LandingStatsResponseSchema = z.object({
  users: z.number().int().nonnegative(),
  readings: z.number().int().nonnegative(),
  cards: z.number().int().default(78),
  providers: z.number().int().default(3),
})

export type LandingStatsResponse = z.infer<typeof LandingStatsResponseSchema>
```

**Error Responses**:

```python
# 500 Internal Server Error
{
  "detail": "Database connection failed. Please try again later."
}
```

##### Service Interface

```python
"""
Landing Stats Service
業務邏輯層：統計數據查詢
"""

from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.reading_enhanced import ReadingSession

class LandingStatsService:
    """
    Landing page statistics service
    """

    @staticmethod
    async def get_landing_stats(db: Session) -> Dict[str, Any]:
        """
        獲取首頁統計數據

        Args:
            db: Database session

        Returns:
            統計數據字典:
            - users: 總用戶數
            - readings: 總占卜次數
            - cards: 卡牌總數（固定 78）
            - providers: AI 供應商數（固定 3）

        Raises:
            Exception: 資料庫查詢失敗
        """
        try:
            # Query total users
            users_count = db.query(func.count(User.id)).scalar()

            # Query total readings
            readings_count = db.query(func.count(ReadingSession.id)).scalar()

            # Static product constants
            cards_count = 78  # 22 Major Arcana + 56 Minor Arcana
            providers_count = 3  # Anthropic, OpenAI, Google Gemini

            return {
                "users": users_count or 0,
                "readings": readings_count or 0,
                "cards": cards_count,
                "providers": providers_count
            }
        except Exception as e:
            # Log error and return fallback values
            print(f"Error fetching landing stats: {e}")
            return {
                "users": 1000,
                "readings": 5000,
                "cards": 78,
                "providers": 3
            }
```

**Implementation Notes**
- **快取策略**（未來擴展）:
  - Redis TTL: 60 秒（統計數據無需即時更新）
  - Cache key: `landing:stats:v1`
  - 失效機制: 新用戶註冊或新占卜完成時清除快取
- **錯誤處理**: 資料庫查詢失敗時回傳預設值（不影響前端顯示）
- **效能**: 使用 SQLAlchemy COUNT 查詢（無需 JOIN，效能良好）

---

## Data Models

### Domain Model

本專案不涉及新的 Domain Model，使用現有的 `User` 和 `ReadingSession` 模型。

**Key Domain Relationships**:
- `User` → `ReadingSession` (One-to-Many)
- Landing Stats 為 Aggregate Query（聚合查詢），不引入新的 Domain Entity

### Logical Data Model

**Structure Definition**:

本專案不修改資料庫 schema，僅使用現有表格的 COUNT 聚合查詢。

**Existing Tables Used**:

1. **users 表** (已存在)
   - 用途: 統計總用戶數
   - 查詢: `SELECT COUNT(*) FROM users`

2. **reading_sessions 表** (已存在)
   - 用途: 統計總占卜次數
   - 查詢: `SELECT COUNT(*) FROM reading_sessions`

**Consistency & Integrity**:
- **Transaction Boundaries**: 統計查詢為 READ-ONLY，無需事務控制
- **Referential Integrity**: 不涉及外鍵關係
- **Temporal Aspects**: 不涉及版本控制或審計

### Physical Data Model

**無需變更**：本專案不修改資料庫 schema。

### Data Contracts & Integration

#### API Data Transfer

**Request Schema**: 無（GET endpoint）

**Response Schema**:

```typescript
// TypeScript (Frontend)
export interface LandingStatsResponse {
  users: number      // 總用戶數
  readings: number   // 總占卜次數
  cards: number      // 卡牌總數（固定 78）
  providers: number  // AI 供應商數（固定 3）
}
```

```python
# Python (Backend)
class LandingStatsResponse(BaseModel):
    users: int
    readings: int
    cards: int
    providers: int
```

**Validation Rules**:
- `users` ≥ 0（非負整數）
- `readings` ≥ 0（非負整數）
- `cards` = 78（固定值）
- `providers` = 3（固定值）

**Serialization Format**: JSON

---

## Error Handling

### Error Strategy

本專案採用 **Graceful Degradation**（優雅降級）策略：

1. **API 失敗不影響頁面渲染**：StatCounter 顯示 fallback 值
2. **前端錯誤邊界**：使用 React ErrorBoundary 包裹關鍵元件
3. **後端錯誤捕獲**：資料庫查詢失敗時回傳預設值
4. **日誌記錄**：後端記錄錯誤日誌（console.log），未來擴展至 Sentry

### Error Categories and Responses

#### User Errors (4xx)

**無需處理**：本專案的 Landing Stats API 無需使用者輸入，不會產生 4xx 錯誤。

#### System Errors (5xx)

**Scenario 1: Database Connection Failure**

```python
# Backend Error Handling
try:
    users_count = db.query(func.count(User.id)).scalar()
except Exception as e:
    print(f"Database query failed: {e}")
    # Return fallback values
    return {
        "users": 1000,
        "readings": 5000,
        "cards": 78,
        "providers": 3
    }
```

**Frontend Response**:

```typescript
// Client API Error Handling
async function fetchLandingStats(): Promise<LandingStatsResponse> {
  try {
    const response = await fetch('/api/v1/landing-stats')
    if (!response.ok) throw new Error('API request failed')
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch landing stats:', error)
    // Return fallback values
    return {
      users: 1000,
      readings: 5000,
      cards: 78,
      providers: 3
    }
  }
}
```

**Scenario 2: Network Timeout**

- **Timeout**: 5 秒（fetch timeout）
- **Response**: 使用 fallback 值（不顯示錯誤訊息給使用者）

**Scenario 3: API Endpoint Not Found (404)**

- **Cause**: 後端部署失敗或路由配置錯誤
- **Response**: 前端使用 fallback 值並記錄錯誤日誌

#### Business Logic Errors (422)

**無需處理**：本專案不涉及業務邏輯驗證。

### Process Flow Visualization

```mermaid
flowchart TD
    A[Client Request] --> B{API Call Success?}

    B -->|Yes| C{Response Valid?}
    B -->|No| D[Log Error]

    C -->|Yes| E[Animate StatCounter]
    C -->|No| D

    D --> F[Use Fallback Values]
    F --> E

    E --> G[Display Stats]
    G --> H[End]

    style D fill:#ff8800,stroke:#ff8800,stroke-width:2px
    style F fill:#ffdd00,stroke:#ffdd00,stroke-width:2px
```

### Monitoring

#### Error Tracking

- **Frontend**: Console.error 記錄（開發環境）
- **Backend**: Print statements 記錄（開發環境）
- **Production** (未來擴展): Sentry integration

#### Logging

```python
# Backend Logging (landing_stats.py)
import logging

logger = logging.getLogger(__name__)

try:
    users_count = db.query(func.count(User.id)).scalar()
except Exception as e:
    logger.error(f"Failed to query users count: {e}", exc_info=True)
    # Return fallback
```

```typescript
// Frontend Logging (api.ts)
try {
  const response = await fetch('/api/v1/landing-stats')
  // ...
} catch (error) {
  console.error('[Landing Stats API] Request failed:', error)
  // Return fallback
}
```

#### Health Monitoring

- **API Response Time**: 目標 < 200ms
- **Success Rate**: 目標 > 99%
- **Fallback Usage Rate**: 監控 fallback 使用頻率（異常高時觸發警報）

---

## Testing Strategy

### Unit Tests (Frontend - Jest)

**StepCard Component** (`src/components/landing/__tests__/StepCard.test.tsx`):

1. **渲染測試**: 驗證所有 props 正確渲染（stepNumber, icon, title, description）
2. **樣式測試**: 驗證 Pip-Boy 主題樣式應用（border-pip-boy-green, background）
3. **圖示測試**: 驗證 PixelIcon 正確渲染（name, size, decorative）

**StatCounter Component** (`src/components/landing/__tests__/StatCounter.test.tsx`):

1. **動畫測試**: 驗證數字從 0 動畫到目標值（使用 jest.useFakeTimers）
2. **Fallback 測試**: 驗證 API 失敗時顯示 fallback 值
3. **Suffix 測試**: 驗證 suffix prop 正確顯示（例如 "1000+"）
4. **圖示測試**: 驗證 PixelIcon 正確渲染

**TestimonialCard Component** (`src/components/landing/__tests__/TestimonialCard.test.tsx`):

1. **星星渲染測試**: 驗證 rating 值對應正確的填充星星數（0-5）
2. **頭像測試**: 驗證 avatar PixelIcon 正確渲染
3. **文字測試**: 驗證 username 和 review 正確顯示

### Integration Tests (Backend - pytest)

**Landing Stats API** (`backend/tests/api/test_landing_stats_endpoints.py`):

1. **正常流程測試**: 驗證 API 回傳正確 JSON 結構
   ```python
   async def test_landing_stats_success(client, db_session):
       response = await client.get("/api/v1/landing-stats")
       assert response.status_code == 200
       data = response.json()
       assert "users" in data
       assert "readings" in data
       assert data["cards"] == 78
       assert data["providers"] == 3
   ```

2. **資料庫錯誤測試**: 驗證資料庫連線失敗時回傳 fallback 值
   ```python
   async def test_landing_stats_database_error(client, monkeypatch):
       def mock_query_error(*args, **kwargs):
           raise Exception("Database connection failed")

       monkeypatch.setattr("app.api.v1.endpoints.landing_stats.db.query", mock_query_error)
       response = await client.get("/api/v1/landing-stats")
       assert response.status_code == 200
       data = response.json()
       assert data["users"] == 1000  # Fallback value
       assert data["readings"] == 5000  # Fallback value
   ```

3. **效能測試**: 驗證 API 回應時間 < 200ms
   ```python
   async def test_landing_stats_performance(client):
       import time
       start = time.time()
       response = await client.get("/api/v1/landing-stats")
       elapsed = time.time() - start
       assert elapsed < 0.2  # 200ms
   ```

### E2E Tests (Playwright)

**Landing Page User Flows** (`tests/e2e/landing-page.spec.ts`):

1. **Hero CTA 導航測試**: 驗證點擊 "進入 Vault" 導向 `/auth/login`
   ```typescript
   test('should navigate to login when clicking Hero CTA (unauthenticated)', async ({ page }) => {
     await page.goto('/')
     await page.click('text=進入 Vault')
     await expect(page).toHaveURL('/auth/login')
   })
   ```

2. **快速占卜導航測試**: 驗證點擊 "快速占卜" 導向 `/readings/quick`
   ```typescript
   test('should navigate to quick reading when clicking Quick Reading CTA', async ({ page }) => {
     await page.goto('/')
     await page.click('text=快速占卜')
     await expect(page).toHaveURL('/readings/quick')
   })
   ```

3. **FAQ Accordion 測試**: 驗證 FAQ 項目展開/收合
   ```typescript
   test('should expand and collapse FAQ items', async ({ page }) => {
     await page.goto('/')
     await page.click('text=什麼是廢土塔羅？')
     await expect(page.locator('text=廢土塔羅是結合 Fallout')).toBeVisible()
     await page.click('text=什麼是廢土塔羅？')
     await expect(page.locator('text=廢土塔羅是結合 Fallout')).toBeHidden()
   })
   ```

4. **StatCounter 動畫測試**: 驗證數字動畫執行
   ```typescript
   test('should animate stat counters', async ({ page }) => {
     await page.goto('/')
     const userCounter = page.locator('[data-testid="stat-counter-users"]')
     await expect(userCounter).toContainText(/\d+/)  // Contains number
   })
   ```

### Accessibility Tests (Playwright + axe-core)

**WCAG AA Compliance** (`tests/accessibility/landing-page-a11y.spec.ts`):

1. **顏色對比測試**: 驗證所有文字符合 WCAG AA 對比度要求（4.5:1）
2. **鍵盤導航測試**: 驗證所有互動元素可用鍵盤操作
3. **ARIA 標籤測試**: 驗證所有 PixelIcon 有正確的 aria-label 或 decorative 屬性
   ```typescript
   test('should have accessible icons', async ({ page }) => {
     await page.goto('/')
     const icons = await page.locator('i[class^="ri-"]').all()
     for (const icon of icons) {
       const hasAriaLabel = await icon.getAttribute('aria-label')
       const isDecorative = await icon.getAttribute('aria-hidden')
       expect(hasAriaLabel || isDecorative === 'true').toBeTruthy()
     }
   })
   ```

### Performance Tests

**Lighthouse CI** (`.lighthouserc.json`):

- **Performance Score**: ≥ 90
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **CLS**: < 0.1
- **Bundle Size**: < 50KB (Client Component + Shared Components, gzipped)

---

## Security Considerations

### Authentication

**無需額外安全措施**：Landing Stats API 為公開端點，不涉及使用者認證。

### API Security

1. **Rate Limiting** (未來擴展):
   - 限制每 IP 每分鐘 60 次請求
   - 防止 DDoS 攻擊

2. **Input Validation**:
   - 無需驗證（GET endpoint, no parameters）

3. **SQL Injection Prevention**:
   - 使用 SQLAlchemy ORM（自動防止 SQL injection）
   - 無手寫 SQL 查詢

### Data Protection

- **無敏感資料**：API 僅回傳聚合統計數據（總數），無個人資訊
- **HTTPS Enforced**：Production 環境強制使用 HTTPS（Zeabur 提供）

---

## Performance & Scalability

### Target Metrics

| Metric | Target | Measurement Strategy |
|--------|--------|---------------------|
| **TTFB** | < 500ms | Server Component 預渲染 |
| **FCP** | < 1.5s | Lighthouse CI |
| **LCP** | < 2.5s | Lighthouse CI |
| **CLS** | < 0.1 | 無 layout shift（固定尺寸） |
| **API Response** | < 200ms | Backend performance test |
| **Animation FPS** | 60fps | requestAnimationFrame |
| **Bundle Size** | < 50KB | Webpack bundle analyzer |

### Scaling Approaches

#### Horizontal Scaling

- **Backend**: Zeabur 自動擴展（支援多個 FastAPI instance）
- **Database**: Supabase 自動擴展（Managed PostgreSQL）

#### Vertical Scaling

- **不需要**: 統計查詢為簡單 COUNT，無需垂直擴展

### Caching Strategies

#### Future Enhancement: Redis Cache

```python
# backend/app/services/landing_stats_service.py (Future)
from redis import asyncio as aioredis
import json

CACHE_KEY = "landing:stats:v1"
CACHE_TTL = 60  # 60 seconds

async def get_landing_stats_cached(db: Session, redis: aioredis.Redis) -> Dict[str, Any]:
    # Try cache first
    cached = await redis.get(CACHE_KEY)
    if cached:
        return json.loads(cached)

    # Query database
    stats = await get_landing_stats(db)

    # Store in cache
    await redis.setex(CACHE_KEY, CACHE_TTL, json.dumps(stats))

    return stats
```

**Cache Invalidation**:
- **TTL-based**: 60 秒後自動過期
- **Event-based** (未來): 新用戶註冊或新占卜完成時清除快取

#### Client-side Caching

**無需實作**：統計數據變化頻繁，無需客戶端快取。

### Optimization Techniques

1. **React.memo**: 對 `StatCounter` 和 `TestimonialCard` 使用 memo 防止不必要的重渲染
   ```typescript
   export const StatCounter = React.memo<StatCounterProps>((props) => {
     // ...
   })
   ```

2. **requestAnimationFrame**: 確保動畫 60fps
   ```typescript
   useEffect(() => {
     const animate = () => {
       // Animation logic
       requestAnimationFrame(animate)
     }
     requestAnimationFrame(animate)
   }, [])
   ```

3. **CSS Animations**: 使用 Tailwind 動畫（GPU 加速）
   ```tsx
   <div className="hover:scale-105 transition-transform duration-300">
   ```

4. **Lazy Loading**: 圖片（如果有）使用 `loading="lazy"`
   ```tsx
   <img src="..." alt="..." loading="lazy" />
   ```

---

## Supporting References

### Appendix A: Data Structure Definitions

#### STEP_CARDS Array

```typescript
// src/app/client-page.tsx
const STEP_CARDS = [
  {
    stepNumber: 1,
    icon: "layout-grid",
    title: "選擇牌陣",
    description: "從多種廢土主題牌陣中選擇適合的占卜方式"
  },
  {
    stepNumber: 2,
    icon: "shuffle",
    title: "輻射洗牌",
    description: "使用獨特的輻射洗牌機制打亂塔羅牌"
  },
  {
    stepNumber: 3,
    icon: "hand",
    title: "抽牌占卜",
    description: "根據牌陣位置抽取塔羅牌"
  },
  {
    stepNumber: 4,
    icon: "cpu",
    title: "AI 解讀",
    description: "多家 AI 供應商提供角色化的占卜解讀"
  }
] as const
```

#### TESTIMONIALS Array

```typescript
// src/app/client-page.tsx
const TESTIMONIALS = [
  {
    avatar: "user-3",
    username: "避難所111號倖存者",
    rating: 5,
    review: "這個平台的 AI 占卜準到可怕，幫我在廢土中找到正確的生存方向！"
  },
  {
    avatar: "shield",
    username: "鋼鐵兄弟會書記員",
    rating: 5,
    review: "量子占卜系統整合了戰前科技與神秘學，非常符合我們的理念。"
  },
  {
    avatar: "user-6",
    username: "NCR 偵察兵",
    rating: 4,
    review: "介面設計很有 Pip-Boy 的感覺，占卜結果也很有參考價值。"
  },
  {
    avatar: "briefcase",
    username: "廢土商隊領袖",
    rating: 5,
    review: "每次做重大決策前都會來占卜，業力系統幫助我維持正面形象。"
  },
  {
    avatar: "skull",
    username: "獨行旅者",
    rating: 4,
    review: "快速占卜功能很實用，不需註冊就能體驗，推薦給新手。"
  },
  {
    avatar: "test-tube",
    username: "Vault-Tec 工程師",
    rating: 5,
    review: "技術實現很扎實，多 AI 供應商支援確保服務穩定性。"
  }
] as const
```

#### FAQ_ITEMS Array

```typescript
// src/app/client-page.tsx
const FAQ_ITEMS = [
  {
    question: "什麼是廢土塔羅？",
    answer: "廢土塔羅是結合 Fallout 世界觀與傳統塔羅占卜的獨特平台，透過 AI 技術提供角色化的占卜解讀，幫助你在廢土世界中找到生存智慧與靈性指引。"
  },
  {
    question: "我需要註冊才能使用嗎？",
    answer: "不需要！我們提供快速占卜功能，讓你免註冊即可體驗。註冊帳號後可以儲存占卜記錄、追蹤業力進展、解鎖更多牌陣。"
  },
  {
    question: "什麼是業力系統？",
    answer: "業力系統追蹤你的行為和決策，從非常善良到非常邪惡分為 5 個等級。你的業力會影響 AI 解讀的風格和建議方向。"
  },
  {
    question: "支援哪些 AI 供應商？",
    answer: "我們支援 Anthropic Claude、OpenAI GPT 和 Google Gemini 三家 AI 供應商，提供多樣化的角色聲音解讀（如 Mr. Handy、鋼鐵兄弟會書記員）。"
  },
  {
    question: "卡牌有什麼特色？",
    answer: "我們擁有 78 張完整的 Fallout 主題塔羅牌，包含大阿爾克那（Fallout 角色原型）和小阿爾克那四組花色：落塵可樂瓶（聖杯）、戰鬥武器（權杖）、瓶蓋（錢幣）、輻射棒（寶劍）。"
  },
  {
    question: "占卜結果準確嗎？",
    answer: "我們的 AI 解讀系統整合了傳統塔羅智慧與 Fallout 世界觀，提供具有參考價值的洞察。但請記住，占卜是引導工具，最終決策權在你手中。"
  },
  {
    question: "這個平台免費嗎？",
    answer: "是的！廢土塔羅是非商業粉絲專案，所有核心功能完全免費。我們可能在未來推出進階功能（延長歷史記錄、高級牌陣），但基本服務永久免費。"
  },
  {
    question: "如何聯絡客服？",
    answer: "遇到問題可以填寫聯絡表單或發送郵件至 support@wasteland-tarot.vault，我們會在 24 小時內回覆。"
  }
] as const
```

#### FOOTER_LINKS Array

```typescript
// src/app/client-page.tsx
const FOOTER_LINKS = [
  {
    title: "產品",
    links: [
      { label: "首頁", href: "/" },
      { label: "卡牌圖書館", href: "/cards" },
      { label: "開始占卜", href: "/readings/new" },
      { label: "快速占卜", href: "/readings/quick" }
    ]
  },
  {
    title: "資訊",
    links: [
      { label: "關於我們", href: "/about" },
      { label: "常見問題", href: "/faq" },
      { label: "聯絡我們", href: "/contact" }
    ]
  },
  {
    title: "法律",
    links: [
      { label: "隱私政策", href: "/privacy" },
      { label: "服務條款", href: "/terms" }
    ]
  },
  {
    title: "社群",
    links: [
      { label: "Discord", href: "#", external: true },
      { label: "GitHub", href: "#", external: true }
    ]
  }
] as const
```

### Appendix B: Tailwind CSS Custom Animations

```css
/* globals.css (已存在，無需修改) */
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

.animate-scanline {
  animation: scanline 3s linear infinite;
}
```

### Appendix C: Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (.env)
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-service-role-key
```

---

**文件版本**: 1.0
**建立日期**: 2025-11-16
**語言**: Traditional Chinese (zh-TW)
**作者**: Linus Torvalds (Claude Code Agent)

**設計決策理由記錄**:

1. **選擇 requestAnimationFrame 而非 CSS @keyframes**:
   - 需要從 0 動畫到任意目標數值（動態值）
   - CSS @keyframes 無法動態設定終點值
   - requestAnimationFrame 提供精確的數值控制和 easing function

2. **FAQ 資料使用硬編碼陣列而非資料庫**:
   - FAQ 內容為靜態、不常變動
   - 避免不必要的資料庫查詢（減少 API 延遲）
   - 簡化部署流程（無需資料庫遷移）

3. **Landing Stats API 無需 Redis 快取（初版）**:
   - 統計查詢為簡單 COUNT，效能已足夠（< 200ms）
   - 避免過早優化（Premature Optimization is the root of all evil）
   - 未來流量增加時再引入 Redis 快取

4. **使用陣列映射消除硬編碼**:
   - 遵循 CLAUDE.md 2.3.1 規範
   - 提升程式碼可維護性（新增/修改 FAQ、Testimonial 僅需編輯陣列）
   - 單一資料來源（Single Source of Truth）

**Good Taste 檢查清單**:
- ✅ 無特殊情況分支（所有重複元素使用 .map()）
- ✅ 資料結構優先（陣列定義清晰、型別安全）
- ✅ 錯誤處理不中斷使用者體驗（fallback values）
- ✅ 元件職責單一（StepCard, StatCounter, TestimonialCard 各司其職）

**Never Break Userspace**:
- ✅ 不修改現有 API 合約
- ✅ 不修改資料庫 schema
- ✅ 向後相容（新增 API 端點，不影響現有功能）
