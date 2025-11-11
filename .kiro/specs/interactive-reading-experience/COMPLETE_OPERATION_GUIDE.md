# Interactive Reading Experience - 完整操作流程指南

**版本**: 1.0
**最後更新**: 2025-11-11
**狀態**: Production Ready (100% 完成)

---

## 📋 目錄

1. [系統概覽](#系統概覽)
2. [環境設定](#環境設定)
3. [開發流程](#開發流程)
4. [功能模組說明](#功能模組說明)
5. [測試流程](#測試流程)
6. [部署流程](#部署流程)
7. [監控與維護](#監控與維護)
8. [故障排除](#故障排除)
9. [API 文件](#api-文件)

---

## 系統概覽

### 功能範圍

Interactive Reading Experience 提供完整的互動式塔羅牌解讀體驗：

**核心功能**:
- 🎴 互動式抽牌系統（洗牌、翻牌動畫）
- 🤖 AI 串流解讀（打字機效果、語音朗讀）
- 📚 閱讀歷史管理（虛擬捲動、搜尋、篩選）
- 🏷️ 標籤與分類系統
- 🔄 流程整合與導航
- 🎯 個人化推薦引擎
- ⚡ 效能優化
- ♿ 完整無障礙支援
- 🔐 社交分享與隱私保護

### 技術堆疊

**前端**:
- Next.js 15.1.7 (App Router)
- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS 4.1.14
- Framer Motion 12.23.22
- TanStack Virtual 3.13.12

**後端**:
- FastAPI (Python)
- SQLAlchemy (ORM)
- Supabase (PostgreSQL)
- Alembic (資料庫遷移)

**測試**:
- Vitest 4.0.8 (單元/整合測試)
- Playwright 1.56.1 (E2E 測試)
- Pytest (後端測試)

---

## 環境設定

### 前置要求

```bash
# 檢查必要工具版本
node --version    # v20.0.0+
bun --version     # v1.0.0+
python --version  # 3.11+
```

### 1. 專案初始化

```bash
# 克隆專案
git clone <repository-url>
cd tarot-card-nextjs-app

# 安裝前端依賴
bun install

# 安裝後端依賴
cd backend
uv sync
cd ..
```

### 2. 環境變數配置

**前端環境變數** (`.env.local`):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_PERSONALIZATION=true
NEXT_PUBLIC_ENABLE_SOCIAL_SHARING=true
```

**後端環境變數** (`.env`):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tarot_db

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# JWT
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Environment
ENVIRONMENT=development
```

### 3. 資料庫設定

```bash
# 啟動 PostgreSQL (使用 Docker)
docker run -d \
  --name tarot-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=tarot_db \
  -p 5432:5432 \
  postgres:15

# 執行資料庫遷移
cd backend
.venv/bin/alembic upgrade head

# 檢查遷移狀態
.venv/bin/alembic current
```

### 4. 開發服務啟動

**方式 1: 分別啟動**

```bash
# Terminal 1: 啟動後端
cd backend
.venv/bin/uvicorn app.main:app --reload --port 8000

# Terminal 2: 啟動前端
bun run dev
```

**方式 2: 使用腳本**

```bash
# 創建啟動腳本 (scripts/start-dev.sh)
#!/bin/bash
cd backend && .venv/bin/uvicorn app.main:app --reload &
bun run dev
```

### 5. 驗證安裝

```bash
# 檢查前端
curl http://localhost:3000/api/health

# 檢查後端
curl http://localhost:8000/api/v1/health

# 檢查資料庫連線
curl http://localhost:8000/api/v1/db/health
```

---

## 開發流程

### 日常開發循環

#### 1. 功能開發流程

```bash
# 1. 創建功能分支
git checkout -b feature/your-feature-name

# 2. 開發前端元件
cd src/components/readings
# 編輯元件...

# 3. 開發後端 API
cd backend/app/api/v1/endpoints
# 編輯端點...

# 4. 執行測試（TDD）
bun test                              # 前端單元測試
cd backend && .venv/bin/pytest       # 後端測試

# 5. 執行 E2E 測試
bun test:playwright

# 6. 提交變更
git add .
git commit -m "feat: add your feature description"

# 7. 推送並創建 PR
git push origin feature/your-feature-name
```

#### 2. 程式碼品質檢查

```bash
# Linting
bun run lint                          # 前端
cd backend && .venv/bin/ruff check .  # 後端

# 格式化
bun run format                        # 前端
cd backend && .venv/bin/black .       # 後端

# 型別檢查
bun run type-check                    # 前端
cd backend && .venv/bin/mypy .        # 後端
```

#### 3. 資料庫遷移開發

```bash
# 創建新遷移
cd backend
.venv/bin/alembic revision --autogenerate -m "add_new_feature"

# 檢視遷移腳本
cat alembic/versions/xxxx_add_new_feature.py

# 應用遷移
.venv/bin/alembic upgrade head

# 回滾遷移
.venv/bin/alembic downgrade -1

# 查看遷移歷史
.venv/bin/alembic history
```

---

## 功能模組說明

### Phase 1-2: 互動抽牌系統

#### 使用流程

```typescript
// 1. 引入元件
import { InteractiveCardDraw } from '@/components/tarot/InteractiveCardDraw';
import { useFisherYatesShuffle } from '@/hooks/useFisherYatesShuffle';

// 2. 使用元件
function ReadingPage() {
  const handleCardsDrawn = (cards) => {
    console.log('抽到的卡片:', cards);
  };

  return (
    <InteractiveCardDraw
      spreadType="three_card"
      positionsMeta={[
        { id: 'past', label: '過去' },
        { id: 'present', label: '現在' },
        { id: 'future', label: '未來' }
      ]}
      onCardsDrawn={handleCardsDrawn}
      enableAnimation={true}
    />
  );
}
```

#### 關鍵功能

**洗牌動畫** (`ShuffleAnimation.tsx`):
- 1.5-2 秒動畫
- 60 FPS 效能監控
- 自動降級 (< 30 FPS)
- 減少動畫模式支援

**翻牌動畫** (`CardFlipAnimation.tsx`):
- CSS 3D transform
- 0.5 秒翻轉
- 鍵盤支援 (Enter/Space)
- 觸控支援

**Session Recovery** (`useSessionRecovery.ts`):
- 24 小時有效期
- 自動儲存狀態
- 恢復提示

### Phase 3: AI 串流解讀

#### 使用流程

```typescript
// 1. 引入元件
import { StreamingInterpretation } from '@/components/readings/StreamingInterpretation';
import { useStreamingText } from '@/hooks/useStreamingText';

// 2. 使用串流解讀
function InterpretationView({ readingId }) {
  return (
    <StreamingInterpretation
      readingId={readingId}
      onComplete={() => console.log('解讀完成')}
    />
  );
}

// 3. 自訂串流邏輯
function CustomStreaming() {
  const {
    streamedText,
    isComplete,
    isPaused,
    pause,
    resume,
    setSpeed
  } = useStreamingText();

  return (
    <div>
      <p>{streamedText}</p>
      <button onClick={pause}>暫停</button>
      <button onClick={resume}>繼續</button>
      <button onClick={() => setSpeed(2)}>2x 速度</button>
    </div>
  );
}
```

#### 關鍵功能

**打字機效果** (`useStreamingText.ts`):
- 30-50 字元/秒
- ±20% 隨機變化
- FPS < 30 自動批次渲染
- 首批 200ms 內顯示

**錯誤處理**:
- Exponential Backoff (1s → 2s → 4s → 8s → 16s)
- 最多 5 次重試
- 友善 zh-TW 錯誤訊息
- 離線偵測

**語音朗讀** (`useTextToSpeech.tsx`):
- Web Speech API
- 速度調整 (0.5x-2x)
- 暫停/繼續
- 段落重讀

### Phase 4-5: 閱讀歷史與搜尋

#### 使用流程

```typescript
// 1. 引入元件
import { VirtualizedReadingList } from '@/components/readings/VirtualizedReadingList';
import { useReadingFilters } from '@/hooks/useReadingFilters';

// 2. 使用虛擬捲動列表
function HistoryPage() {
  const {
    filters,
    setSearchQuery,
    setTags,
    setCategories,
    toggleFavorite,
    clearAll
  } = useReadingFilters();

  const [readings, setReadings] = useState([]);

  useEffect(() => {
    // 獲取解讀記錄
    fetchReadings(filters).then(setReadings);
  }, [filters]);

  return (
    <div>
      <SearchInput
        value={filters.searchQuery}
        onChange={setSearchQuery}
      />
      <FilterPanel
        filters={filters}
        onFilterChange={{ setTags, setCategories, toggleFavorite }}
      />
      <VirtualizedReadingList
        readings={readings}
        onSelect={(reading) => console.log(reading)}
        enableVirtualization={readings.length >= 100}
      />
    </div>
  );
}
```

#### 關鍵功能

**虛擬捲動** (`VirtualizedReadingList.tsx`):
- 100 筆記錄閾值
- 變動高度估計
- overscan: 5
- 平滑捲動 (>30 FPS)

**搜尋與篩選** (`useReadingFilters.ts`):
- 300ms debounce
- URL 參數同步
- 多條件組合
- Zod 驗證

### Phase 6: 標籤與分類

#### 使用流程

```typescript
// 1. 前端元件
import { TagManager } from '@/components/readings/TagManager';
import { CategorySelector } from '@/components/readings/CategorySelector';

function ReadingEditor({ readingId }) {
  return (
    <div>
      <TagManager
        readingId={readingId}
        existingTags={['愛情', '事業']}
        onTagsChange={(tags) => console.log('標籤更新:', tags)}
      />
      <CategorySelector
        selectedCategory="love"
        onCategoryChange={(cat) => console.log('分類更新:', cat)}
      />
    </div>
  );
}
```

```python
# 2. 後端 API 使用
from app.services.tag_management_service import TagManagementService

# 合併標籤
result = await TagManagementService.merge_tags(
    db=db,
    user_id=current_user.id,
    source_tags=['工作', '職業'],
    target_tag='事業'
)
# 返回: {'affected_tags': 2, 'affected_readings': 15}

# 標籤重新命名
result = await TagManagementService.rename_tag(
    db=db,
    user_id=current_user.id,
    old_tag='戀愛',
    new_tag='愛情'
)
# 返回: {'affected_readings': 8}

# 取得使用統計
stats = await TagManagementService.get_tag_usage_statistics(
    db=db,
    user_id=current_user.id
)
# 返回: [{'tag': '愛情', 'usage_count': 25}, ...]
```

#### API 端點

```bash
# 更新解讀標籤
PATCH /api/v1/readings/{reading_id}/tags
Body: {"tags": ["愛情", "事業"]}

# 取得所有標籤與統計
GET /api/v1/readings/tags

# 合併標籤
POST /api/v1/readings/tags/merge
Body: {"source_tags": ["工作"], "target_tag": "事業"}

# 重新命名標籤
POST /api/v1/readings/tags/rename
Body: {"old_tag": "戀愛", "new_tag": "愛情"}

# 批次刪除標籤
POST /api/v1/readings/tags/bulk-delete
Body: {"tags": ["測試", "臨時"]}
```

### Phase 7: 流程整合

#### 使用流程

```typescript
// 1. 流程導航
import { ReadingFlowNavigation } from '@/components/readings/ReadingFlowNavigation';
import { ReadingFlowIntegration } from '@/components/readings/ReadingFlowIntegration';

function CompletReadingFlow() {
  const [stage, setStage] = useState<'select' | 'drawing' | 'interpretation' | 'complete'>('select');

  return (
    <ReadingFlowIntegration
      initialStage="select"
      onStageChange={setStage}
      preserveSettings={true}
    >
      {/* 你的解讀內容 */}
    </ReadingFlowIntegration>
  );
}

// 2. 快速操作
import { ReadingQuickActions } from '@/components/readings/ReadingQuickActions';

function CompletedReading({ readingId }) {
  return (
    <div>
      <h1>解讀完成</h1>
      <ReadingQuickActions
        onDrawAgain={() => router.push('/readings/new')}
        onViewHistory={() => router.push('/readings/history')}
        onShare={() => setShowShareDialog(true)}
      />
    </div>
  );
}

// 3. 瀏覽器返回確認
import { useBackButtonConfirmation } from '@/hooks/useBackButtonConfirmation';

function ReadingInProgress() {
  const isIncomplete = true; // 解讀進行中

  useBackButtonConfirmation({
    enabled: isIncomplete,
    message: '確定要離開嗎？未完成的解讀將不會儲存。'
  });

  return <div>解讀進行中...</div>;
}
```

#### 關鍵功能

**Session Storage 鍵值**:
- `preserved-reading-settings`: 語音與分類設定
- `scroll-to-reading`: 歷史捲動目標
- `reading-history-filters`: 啟用的篩選器
- `reading-generation-{id}`: 進行中的解讀

### Phase 8: 個人化引擎

#### 使用流程

```python
# 1. 後端個人化服務
from app.services.personalization_service import PersonalizationService

# 分析使用者歷史
insights = await PersonalizationService.analyze_user_history(
    db=db,
    user_id=current_user.id
)
# 返回: {
#   'total_readings': 15,
#   'preferred_spreads': [('three_card', 8), ('single', 5)],
#   'common_tags': [('愛情', 10), ('事業', 5)],
#   'karma_changes': {...},
#   'faction_affinity': {'Brotherhood': 85, ...}
# }

# 生成推薦
recommendations = await PersonalizationService.generate_recommendations(
    db=db,
    user_id=current_user.id
)
# 返回: {
#   'spread_recommendation': {
#     'spread_type': 'three_card',
#     'reason': '根據您的歷史記錄...'
#   },
#   'voice_recommendation': {...},
#   'karma_notification': {...}
# }
```

```typescript
// 2. 前端個人化 UI
import { PersonalizationDashboard } from '@/components/personalization/Dashboard';

function StatsPage() {
  const [timeWindow, setTimeWindow] = useState<30 | 60 | 90>(30);

  return (
    <PersonalizationDashboard
      timeWindow={timeWindow}
      onTimeWindowChange={setTimeWindow}
    />
  );
}
```

#### 關鍵功能

**門檻機制**: ≥10 筆解讀才啟動個人化
**追蹤指標**:
- 偏好牌陣類型（頻率分析）
- 常見問題類別與標籤
- Karma 變化（30 天窗口，>20 點觸發通知）
- 派系親和度（0-100%，≥80 推薦聲音）

### Phase 9: 效能優化

#### 使用流程

```typescript
// 1. 效能監控
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function AnimatedComponent() {
  const {
    fps,
    shouldDegrade,
    startMonitoring,
    stopMonitoring
  } = usePerformanceMonitor({
    targetFps: 60,
    degradeThreshold: 30
  });

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  return (
    <div>
      <p>當前 FPS: {fps}</p>
      {shouldDegrade && <p>⚠️ 效能降級模式</p>}
    </div>
  );
}

// 2. 程式碼分割
import { lazyLoadComponent } from '@/lib/performanceOptimizations';

const HeavyComponent = lazyLoadComponent(
  () => import('@/components/HeavyComponent'),
  { ssr: false }
);

// 3. 圖片優化
import { getImageProps } from '@/lib/performanceOptimizations';

function OptimizedImage({ src }) {
  const imageProps = getImageProps(src, {
    quality: 80,
    format: 'webp'
  });

  return <img {...imageProps} />;
}

// 4. API 快取
import { apiCache } from '@/lib/performanceOptimizations';

async function fetchReadings() {
  return await apiCache.get(
    'user-readings',
    async () => {
      const response = await fetch('/api/v1/readings');
      return response.json();
    },
    5 * 60 * 1000 // 5 分鐘 TTL
  );
}

// 5. 低頻寬優化
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';

function AdaptiveContent() {
  const { isSlowNetwork, isLowEndDevice } = useNetworkOptimization();

  return (
    <div>
      {isSlowNetwork && <p>⚠️ 網路速度較慢，已降低品質</p>}
      {isLowEndDevice && <p>⚠️ 已簡化動畫</p>}
    </div>
  );
}

// 6. 分頁可見性
import { useTabVisibility } from '@/hooks/useTabVisibility';

function ResourceIntensiveComponent() {
  const isVisible = useTabVisibility();

  useEffect(() => {
    if (!isVisible) {
      // 暫停動畫、影片等
      pauseAnimations();
    } else {
      // 恢復
      resumeAnimations();
    }
  }, [isVisible]);

  return <div>內容...</div>;
}
```

#### 效能指標

**目標**:
- FCP < 2s (desktop), < 3s (mobile)
- TTI < 5s
- Animation 60 FPS (最低 30 FPS)
- API response < 5s
- 500 筆記錄載入 < 5s

### Phase 10: 無障礙支援

#### 使用流程

所有元件已內建無障礙支援，無需額外配置：

```typescript
// 自動支援的功能：
// 1. 螢幕閱讀器（ARIA labels）
// 2. 鍵盤導航（Tab, Enter, Space, Escape）
// 3. 觸控優化（44×44px 最小目標）
// 4. 高對比度模式
// 5. 減少動畫模式

// 減少動畫偏好檢測
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

function AnimatedComponent() {
  const { prefersReducedMotion } = usePrefersReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.2 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      內容
    </motion.div>
  );
}
```

#### 無障礙標準

- ✅ WCAG 2.1 Level AA
- ✅ ARIA 1.2 patterns
- ✅ 4.5:1 對比度（文字）
- ✅ 3:1 對比度（UI）
- ✅ 44×44px 最小觸控目標

### Phase 11: 錯誤處理

#### 使用流程

```typescript
// 1. 速率限制
import { useRateLimiting } from '@/hooks/useRateLimiting';

function ButtonWithRateLimit() {
  const {
    canPerformAction,
    performAction,
    shouldDisableAction,
    message
  } = useRateLimiting({
    actionType: 'shuffle',
    limit: 10,
    windowMs: 1000,
    cooldownMs: 2000
  });

  const handleClick = () => {
    if (canPerformAction()) {
      performAction();
      // 執行實際操作
      shuffleCards();
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={shouldDisableAction}
      >
        開始洗牌
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

// 2. 錯誤處理（已整合在 useStreamingText）
import { useStreamingText } from '@/hooks/useStreamingText';

function StreamingComponent() {
  const {
    streamedText,
    isError,
    error,
    isRetrying,
    retryCount,
    reset
  } = useStreamingText();

  if (isError) {
    return (
      <div>
        <p>錯誤: {error?.message}</p>
        <p>已重試 {retryCount} 次</p>
        {isRetrying ? (
          <p>重試中...</p>
        ) : (
          <button onClick={reset}>手動重試</button>
        )}
      </div>
    );
  }

  return <p>{streamedText}</p>;
}
```

### Phase 12: 社交分享

#### 使用流程

```typescript
// 1. 前端分享對話框
import { ShareDialog } from '@/components/readings/ShareDialog';

function ReadingView({ reading }) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div>
      <button onClick={() => setShowShare(true)}>
        分享解讀
      </button>

      <ShareDialog
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        reading={reading}
        onShareCreated={(shareUrl) => {
          console.log('分享連結:', shareUrl);
        }}
      />
    </div>
  );
}
```

```python
# 2. 後端 API 使用
from app.models.share import ReadingShare

# 創建分享
share = ReadingShare(
    reading_id=reading.id,
    user_id=current_user.id,
    password_hash=bcrypt.hashpw(password.encode(), bcrypt.gensalt())
)
db.add(share)
db.commit()

# 驗證密碼
is_valid = bcrypt.checkpw(
    input_password.encode(),
    share.password_hash
)

# 追蹤存取
share.access_count += 1
db.commit()

# 撤回分享
share.is_active = False
db.commit()
```

#### API 端點

```bash
# 創建分享
POST /api/v1/readings/{reading_id}/share
Body: {
  "password": "1234",  # 可選
  "expires_in_days": 7  # 可選
}
Response: {
  "share_url": "https://wasteland-tarot.com/share/uuid",
  "uuid": "xxx-xxx-xxx",
  "requires_password": true
}

# 查看分享
GET /api/v1/share/{uuid}
Body: {"password": "1234"}  # 如需要
Response: {讀記錄（已移除 PII）}

# 撤回分享
DELETE /api/v1/share/{uuid}
Response: {"message": "分享已撤回"}

# 列出使用者的分享
GET /api/v1/readings/{reading_id}/shares
Response: [
  {
    "uuid": "xxx",
    "access_count": 5,
    "is_active": true,
    "created_at": "..."
  }
]
```

---

## 測試流程

### 單元測試

#### 前端測試

```bash
# 執行所有測試
bun test

# 執行特定檔案
bun test src/hooks/__tests__/useStreamingText.test.ts

# 執行特定測試套件
bun test --grep "useStreamingText"

# 生成覆蓋率報告
bun test:coverage

# 監視模式
bun test --watch
```

#### 後端測試

```bash
# 執行所有測試
cd backend
.venv/bin/pytest

# 執行特定測試
.venv/bin/pytest tests/unit/test_tag_management.py

# 生成覆蓋率報告
.venv/bin/pytest --cov=app --cov-report=html

# 詳細輸出
.venv/bin/pytest -v

# 停在第一個失敗
.venv/bin/pytest -x
```

### E2E 測試

```bash
# 執行所有 E2E 測試
bun test:playwright

# 執行特定測試套件
bun test:playwright tests/e2e/history-management.spec.ts

# UI 模式（視覺化除錯）
bun test:playwright:ui

# 特定瀏覽器
bun test:playwright --project=chromium
bun test:playwright --project=firefox
bun test:playwright --project=webkit

# 產生 HTML 報告
bun test:playwright --reporter=html

# 偵錯模式
bun test:playwright --debug

# Headed 模式（顯示瀏覽器）
bun test:playwright --headed
```

### 效能測試

```bash
# 執行效能測試
bun test:performance

# 特定測試
bun test:playwright tests/performance/interactive-reading-performance.spec.ts

# 生成追蹤檔案
bun test:playwright --trace on
```

### 跨瀏覽器測試

```bash
# 完整跨瀏覽器測試
bun test:e2e

# 特定測試
bun test:playwright tests/e2e/interactive-reading-cross-browser.spec.ts

# 行動裝置
bun test:playwright --project="Mobile Chrome"
bun test:playwright --project="Mobile Safari"
```

### 測試策略

**測試金字塔**:
```
        E2E (10%)
       /         \
      /           \
     /  整合 (30%)  \
    /               \
   /   單元 (60%)     \
  ---------------------
```

**測試覆蓋率目標**:
- 前端: 80%+
- 後端: 85%+
- E2E: 關鍵使用者流程

---

## 部署流程

### 預部署檢查清單

```bash
# 1. 執行所有測試
bun test
bun test:playwright
cd backend && .venv/bin/pytest

# 2. 檢查 linting
bun run lint
cd backend && .venv/bin/ruff check .

# 3. 型別檢查
bun run type-check
cd backend && .venv/bin/mypy .

# 4. 建立 production build
bun run build

# 5. 檢查 bundle 大小
bun run analyze

# 6. 檢查環境變數
# 確認所有 production 環境變數已設定

# 7. 資料庫遷移（Staging）
cd backend
.venv/bin/alembic upgrade head
```

### Staging 部署

```bash
# 1. 部署到 Staging 環境
git checkout main
git pull origin main

# 2. 更新環境變數
# 設定 ENVIRONMENT=staging

# 3. 部署前端（Vercel/Zeabur）
vercel --prod

# 4. 部署後端（Zeabur/Railway）
# 通常透過 Git push 自動部署

# 5. 執行資料庫遷移
# SSH 到 staging 伺服器
alembic upgrade head

# 6. 驗證部署
curl https://staging.wasteland-tarot.com/api/health
```

### Production 部署

```bash
# 1. 創建 release branch
git checkout -b release/v1.0.0
git tag v1.0.0
git push origin release/v1.0.0 --tags

# 2. 部署到 Production
# 透過 CI/CD pipeline 或手動部署

# 3. 執行資料庫遷移
# ⚠️ 注意：Production 遷移需謹慎
alembic upgrade head

# 4. 監控部署狀態
# 檢查錯誤日誌、效能指標、使用者回饋

# 5. 驗證關鍵功能
# 執行 smoke tests
```

### 回滾程序

```bash
# 如果部署出現問題：

# 1. 回滾前端
vercel rollback

# 2. 回滾後端
git revert <commit-hash>
git push origin main

# 3. 回滾資料庫
cd backend
.venv/bin/alembic downgrade -1

# 4. 通知團隊
# 發送事故報告
```

---

## 監控與維護

### 日誌監控

#### 前端日誌

```typescript
// 使用內建錯誤日誌系統
import { errorStore } from '@/lib/errorStore';

// 記錄錯誤
errorStore.logError({
  timestamp: new Date(),
  userId: user.id,
  errorType: 'API_ERROR',
  message: '無法載入解讀記錄',
  stackTrace: error.stack,
  context: { readingId: '123' }
});

// 取得錯誤日誌
const recentErrors = errorStore.getErrors();
```

#### 後端日誌

```python
# 使用 FastAPI 日誌
import logging

logger = logging.getLogger(__name__)

# 記錄不同層級
logger.info("使用者登入", extra={"user_id": user.id})
logger.warning("API 速率限制觸發")
logger.error("資料庫連線失敗", exc_info=True)
```

### 效能監控

```bash
# 1. 前端效能（Web Vitals）
# 已整合在應用中，自動追蹤 FCP, LCP, FID, CLS, TTFB

# 2. 後端效能
# 使用 FastAPI 的內建中介層追蹤請求時間

# 3. 資料庫效能
# 使用 Supabase Dashboard 或 PostgreSQL pg_stat_statements

# 4. API 回應時間
# 使用 logging_middleware 追蹤
```

### 資料庫維護

```bash
# 1. 備份資料庫
pg_dump -U postgres tarot_db > backup_$(date +%Y%m%d).sql

# 2. 清理舊資料
# 清理過期的分享連結
DELETE FROM reading_shares
WHERE created_at < NOW() - INTERVAL '30 days'
AND is_active = false;

# 3. 重建索引
REINDEX DATABASE tarot_db;

# 4. 分析資料庫
ANALYZE;
```

### 定期維護任務

**每日**:
- 檢查錯誤日誌
- 監控 API 回應時間
- 檢查資料庫連線池狀態

**每週**:
- 檢查磁碟空間
- 分析效能指標趨勢
- 檢查安全性更新

**每月**:
- 資料庫完整備份
- 檢查依賴套件更新
- 效能優化檢討

---

## 故障排除

### 常見問題

#### 1. 前端無法連接後端

**症狀**: API 請求失敗，顯示 CORS 錯誤

**解決方案**:
```bash
# 檢查後端是否啟動
curl http://localhost:8000/api/v1/health

# 檢查 CORS 配置
# backend/app/config.py
BACKEND_CORS_ORIGINS = ["http://localhost:3000"]

# 重啟後端
cd backend
.venv/bin/uvicorn app.main:app --reload
```

#### 2. 資料庫連線失敗

**症狀**: 應用啟動失敗，顯示資料庫連線錯誤

**解決方案**:
```bash
# 檢查 PostgreSQL 是否啟動
docker ps | grep postgres

# 檢查連線字串
echo $DATABASE_URL

# 測試連線
psql $DATABASE_URL -c "SELECT 1"

# 重新啟動資料庫
docker restart tarot-postgres
```

#### 3. 測試失敗

**症狀**: Vitest 或 Playwright 測試無法執行

**解決方案**:
```bash
# 清除快取
rm -rf node_modules/.vite
rm -rf .next

# 重新安裝依賴
bun install

# 安裝 Playwright 瀏覽器
bunx playwright install

# 檢查 jsdom 環境
bun test --reporter=verbose
```

#### 4. 認證問題

**症狀**: E2E 測試被重導向到登入頁面

**解決方案**:
```typescript
// 在測試中設定測試 token
// tests/e2e/setup.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // 設定測試用 cookie
    await page.context().addCookies([{
      name: 'access_token',
      value: 'test_token_here',
      domain: 'localhost',
      path: '/'
    }]);
    await use(page);
  }
});
```

#### 5. 效能問題

**症狀**: 動畫卡頓，FPS < 30

**解決方案**:
```bash
# 開啟效能監控
# 在瀏覽器開發工具中檢查 Performance

# 檢查是否啟用效能優化
# usePerformanceMonitor 應該自動降級

# 確認減少動畫模式
# 系統設定 > 輔助使用 > 減少動畫
```

### 除錯工具

```bash
# 1. React DevTools
# Chrome 擴充功能

# 2. Redux DevTools（如使用 Zustand）
# Chrome 擴充功能

# 3. Playwright Inspector
bun test:playwright --debug

# 4. FastAPI 除錯模式
cd backend
uvicorn app.main:app --reload --log-level debug

# 5. Database 除錯
# 使用 Supabase Studio 或 pgAdmin
```

---

## API 文件

### 完整 API 文件位置

```bash
# OpenAPI 文件（Swagger UI）
http://localhost:8000/docs

# ReDoc 文件
http://localhost:8000/redoc

# OpenAPI JSON
http://localhost:8000/openapi.json
```

### 核心 API 端點總覽

#### 解讀管理
```
GET    /api/v1/readings              # 取得解讀列表
POST   /api/v1/readings              # 創建新解讀
GET    /api/v1/readings/{id}         # 取得特定解讀
PATCH  /api/v1/readings/{id}         # 更新解讀
DELETE /api/v1/readings/{id}         # 刪除解讀
```

#### 標籤管理
```
PATCH  /api/v1/readings/{id}/tags    # 更新解讀標籤
GET    /api/v1/readings/tags         # 取得所有標籤
POST   /api/v1/readings/tags/merge   # 合併標籤
POST   /api/v1/readings/tags/rename  # 重新命名標籤
POST   /api/v1/readings/tags/bulk-delete  # 批次刪除標籤
```

#### 社交分享
```
POST   /api/v1/readings/{id}/share   # 創建分享連結
GET    /api/v1/share/{uuid}          # 查看分享的解讀
DELETE /api/v1/share/{uuid}          # 撤回分享
GET    /api/v1/readings/{id}/shares  # 列出所有分享
```

#### 個人化
```
GET    /api/v1/personalization/insights      # 取得使用者洞察
GET    /api/v1/personalization/recommendations  # 取得推薦
GET    /api/v1/personalization/stats         # 取得統計資料
```

### 認證

所有 API 請求需包含 JWT token：

```bash
# Header
Authorization: Bearer <your_jwt_token>

# 或 Cookie
access_token=<your_jwt_token>
```

---

## 附錄

### A. 專案結構

```
tarot-card-nextjs-app/
├── src/
│   ├── components/
│   │   ├── readings/          # 解讀相關元件
│   │   │   ├── StreamingInterpretation.tsx
│   │   │   ├── VirtualizedReadingList.tsx
│   │   │   ├── TagManager.tsx
│   │   │   ├── CategorySelector.tsx
│   │   │   ├── ShareDialog.tsx
│   │   │   └── ReadingDetailView.tsx
│   │   └── tarot/             # 塔羅牌元件
│   │       ├── InteractiveCardDraw.tsx
│   │       ├── ShuffleAnimation.tsx
│   │       ├── CardFlipAnimation.tsx
│   │       └── CardSpreadLayout.tsx
│   ├── hooks/                 # 自訂 Hooks
│   │   ├── useFisherYatesShuffle.ts
│   │   ├── usePrefersReducedMotion.ts
│   │   ├── useStreamingText.ts
│   │   ├── useTextToSpeech.tsx
│   │   ├── useSessionRecovery.ts
│   │   ├── useReadingFilters.ts
│   │   ├── usePerformanceMonitor.ts
│   │   ├── useNetworkOptimization.ts
│   │   ├── useRateLimiting.ts
│   │   └── useBackButtonConfirmation.ts
│   ├── lib/                   # 工具函式
│   │   ├── performanceOptimizations.ts
│   │   └── errorStore.ts
│   └── app/                   # Next.js App Router
│       └── readings/
│           ├── new/
│           └── history/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # API 端點
│   │   │   ├── readings.py
│   │   │   ├── tags.py
│   │   │   └── share.py
│   │   ├── services/          # 業務邏輯
│   │   │   ├── tag_management_service.py
│   │   │   └── personalization_service.py
│   │   ├── models/            # 資料模型
│   │   │   ├── reading_enhanced.py
│   │   │   └── share.py
│   │   └── schemas/           # Pydantic Schemas
│   ├── alembic/               # 資料庫遷移
│   │   └── versions/
│   └── tests/                 # 後端測試
│       ├── unit/
│       └── api/
├── tests/                     # E2E 測試
│   ├── e2e/
│   │   ├── history-management.spec.ts
│   │   ├── personalization.spec.ts
│   │   └── error-recovery.spec.ts
│   └── performance/
│       └── interactive-reading-performance.spec.ts
└── .kiro/specs/              # 規格文件
    └── interactive-reading-experience/
```

### B. 環境變數完整清單

**前端** (`.env.local`):
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_PERSONALIZATION=true
NEXT_PUBLIC_ENABLE_SOCIAL_SHARING=true
NEXT_PUBLIC_ENABLE_VOICE_NARRATION=true

# Analytics
NEXT_PUBLIC_GA_ID=
```

**後端** (`.env`):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tarot_db
DATABASE_POOL_SIZE=3
DATABASE_MAX_OVERFLOW=5

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# JWT
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
GEMINI_API_KEY=
OPENAI_API_KEY=

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO

# Redis (可選)
REDIS_URL=redis://localhost:6379/0
```

### C. 依賴版本

**前端核心**:
```json
{
  "next": "15.1.7",
  "react": "19.2.0",
  "typescript": "5.9.3",
  "framer-motion": "12.23.22",
  "@tanstack/react-virtual": "3.13.12"
}
```

**後端核心**:
```
fastapi==0.104.1
sqlalchemy==2.0.23
alembic==1.12.1
supabase==2.0.3
bcrypt==4.1.1
```

**測試工具**:
```json
{
  "vitest": "4.0.8",
  "@playwright/test": "1.56.1",
  "pytest": "7.4.3"
}
```

### D. 效能基準

**載入效能**:
- FCP: < 2s (desktop), < 3s (mobile)
- TTI: < 5s
- LCP: < 2.5s
- CLS: < 0.1
- TTFB: < 600ms

**運行效能**:
- 動畫 FPS: 60 (最低 30)
- API 回應: < 5s
- 串流首字元: < 5s
- 首批顯示: < 200ms

**資料處理**:
- 500 筆記錄載入: < 5s
- 虛擬捲動 FPS: > 30
- 搜尋 debounce: 300ms

---

## 更新記錄

### v1.0.0 (2025-11-11)
- ✅ 初版完整操作流程指南
- ✅ 涵蓋所有 14 個 Phase
- ✅ 包含完整程式碼範例
- ✅ 提供故障排除指南

---

**文件維護者**: Development Team
**問題回報**: [GitHub Issues](https://github.com/your-repo/issues)
**更新頻率**: 每次重大功能更新時
