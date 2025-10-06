# 廢土塔羅解讀平台 - 技術設計文件

## 1. 系統架構概述

### 1.1 整體架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Python 3.11+ │    │ • Google Gemini │
│ • TypeScript    │    │ • FastAPI       │    │ • Supabase      │
│ • Tailwind v4   │    │ • SQLAlchemy    │    │ • Vercel        │
│ • shadcn/ui     │    │ • Pydantic      │    │ • Railway       │
│ • Pip-Boy UI    │    │ • Karma System  │    │ • Audio CDN     │
│ • Pixel Art     │    │ • Faction API   │    │ • Asset Store   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 部署架構
```
┌────────────────────────────────────────────────────────────────┐
│                        Production Environment                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Zeabur    │    │   Zeabur    │    │     Supabase       │ │
│  │  (Frontend) │    │  (Backend)  │    │   (Database)       │ │
│  │             │    │             │    │                    │ │
│  │ • Next.js   │    │ • FastAPI   │    │ • PostgreSQL      │ │
│  │ • CDN       │    │ • Python    │    │ • pg_cron         │ │
│  │ • SSL       │    │ • Docker    │    │ • Edge Functions   │ │
│  │ • Scaling   │    │ • Scaling   │    │ • Real-time        │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 1.2.1 Zeabur 部署特性
- **統一平台**: 前後端統一在 Zeabur 部署，簡化管理
- **自動化 CI/CD**: Git push 自動觸發部署
- **環境變數管理**: 統一的環境變數配置介面
- **即時日誌**: 即時查看應用程式日誌
- **彈性擴展**: 根據流量自動擴展資源

### 1.3 廢土主題架構

```
┌────────────────────────────────────────────────────────────────┐
│                    Wasteland Tarot System                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Card System    │  │  Game Mechanics │  │  AI Integration │ │
│  │                 │  │                 │  │                 │ │
│  │ • 78 Cards      │  │ • Karma System  │  │ • Character     │ │
│  │ • Fallout Theme │  │ • Faction Align │  │   Voices        │ │
│  │ • Pixel Art     │  │ • Companion     │  │ • Fallout       │ │
│  │ • Audio Cues    │  │   Insights      │  │   Context       │ │
│  │ • Radiation     │  │ • Special       │  │ • Humor         │ │
│  │   Shuffle       │  │   Events        │  │   Integration   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   UI/UX Layer   │  │  Audio System   │  │   Data Layer    │ │
│  │                 │  │                 │  │                 │ │
│  │ • Pip-Boy       │  │ • Geiger        │  │ • Wasteland     │ │
│  │   Interface     │  │   Counter       │  │   Cards DB      │ │
│  │ • Vault-Tec     │  │ • Vault         │  │ • Karma         │ │
│  │   Styling       │  │   Sounds        │  │   Profiles      │ │
│  │ • Terminal      │  │ • Character     │  │ • Faction       │ │
│  │   Effects       │  │   Voices        │  │   Alignments    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 2. 前端設計

### 2.1 技術棧
- **框架**：Next.js 15 (App Router)
- **語言**：TypeScript 5.0+
- **樣式**：Tailwind CSS v4
- **UI 組件**：shadcn/ui (客製化 Fallout 主題)
- **狀態管理**：Zustand
- **表單處理**：React Hook Form + Zod
- **HTTP 客戶端**：Fetch API / Axios
- **音效處理**：Web Audio API
- **動畫效果**：Framer Motion (Pip-Boy 動畫)
- **像素藝術**：Canvas API / SVG

### 2.2 專案結構
```
src/
├── app/                    # App Router pages
│   ├── (auth)/            # 認證相關頁面
│   ├── dashboard/         # 用戶儀表板
│   ├── reading/           # 解讀相關頁面
│   ├── profile/           # 個人檔案
│   └── layout.tsx         # 根布局
├── components/            # React 組件
│   ├── ui/               # shadcn/ui 組件 (Fallout 客製化)
│   ├── forms/            # 表單組件
│   ├── wasteland/        # 廢土塔羅專用組件
│   │   ├── cards/        # 卡牌組件
│   │   ├── spreads/      # 牌陣組件
│   │   ├── interfaces/   # Pip-Boy 介面組件
│   │   ├── audio/        # 音效組件
│   │   └── animations/   # 動畫組件
│   ├── karma/            # Karma 系統組件
│   ├── factions/         # 派系組件
│   ├── companions/       # 夥伴組件
│   └── layout/           # 布局組件
├── lib/                   # 工具函數
│   ├── api/              # API 客戶端
│   ├── utils/            # 通用工具
│   ├── validations/      # Zod schemas
│   └── constants/        # 常數定義
├── hooks/                 # 自定義 Hooks
├── stores/               # Zustand stores
├── types/                # TypeScript 類型
└── styles/               # 全域樣式
```

### 2.3 核心組件設計

#### 2.3.1 WastelandTarotCard 組件
```typescript
interface WastelandTarotCardProps {
  card: WastelandCardData;
  isRevealed: boolean;
  isReversed: boolean;
  size?: 'sm' | 'md' | 'lg';
  radiationLevel?: number;
  pipBoyInterface?: boolean;
  onClick?: () => void;
  className?: string;
}

interface WastelandCardData {
  id: string;
  name: string;
  nameEn: string;
  falloutName: string;
  suit: 'major_arcana' | 'nuka_cola_bottles' | 'combat_weapons' | 'bottle_caps' | 'radiation_rods';
  number?: number;
  imageUrl: string;
  pixelArtUrl: string;
  description: string;
  falloutDescription: string;
  humorTwist: string;
  keywords: string[];
  falloutKeywords: string[];
  meanings: {
    upright: string[];
    reversed: string[];
    survival: string[];
    wasteland: string[];
  };
  radiationLevel: number;
  survivalCategory: string;
  wastelandElements: string[];
  audioCues: {
    reveal: string;
    selection: string;
    interpretation: string;
  };
}
```

#### 2.3.2 WastelandCardSpread 組件
```typescript
interface WastelandCardSpreadProps {
  spreadType: WastelandSpreadType;
  cards: WastelandDrawnCard[];
  onCardClick?: (cardIndex: number) => void;
  isInteractive?: boolean;
  pipBoyInterface?: boolean;
  radiationAmbience?: boolean;
  geigerCounterSounds?: boolean;
}

type WastelandSpreadType = 'single_card_reading' | 'vault_tech_spread' | 'wasteland_survival_spread' | 'brotherhood_council';

interface WastelandDrawnCard {
  card: WastelandCardData;
  position: number;
  isReversed: boolean;
  positionMeaning?: string;
  falloutPositionName?: string;
  radiationInfluence: number;
  pipBoyAnalysis: {
    threatLevel: string;
    resourcePotential: string;
    radiationReading: string;
    successProbability: string;
    recommendedAction: string;
  };
}
```

#### 2.3.3 PipBoyInterface 組件
```typescript
interface PipBoyInterfaceProps {
  children: React.ReactNode;
  screenType?: 'main' | 'stats' | 'data' | 'radio';
  scanLines?: boolean;
  ambientHum?: boolean;
  greenFilter?: boolean;
  className?: string;
}

interface PipBoyStats {
  radiation: number;
  health: number;
  karma: number;
  caps: number;
  level: number;
  experience: number;
}
```

#### 2.3.4 KarmaSystem 組件
```typescript
interface KarmaSystemProps {
  currentKarma: KarmaLevel;
  karmaPoints: number;
  onKarmaChange?: (action: KarmaAction) => void;
  showHistory?: boolean;
}

type KarmaLevel = 'very_good' | 'good' | 'neutral' | 'evil' | 'very_evil';

interface KarmaAction {
  action: string;
  points: number;
  reason: string;
  timestamp: Date;
  context?: Record<string, any>;
}
```

#### 2.3.5 FactionAlignment 組件
```typescript
interface FactionAlignmentProps {
  factions: FactionData[];
  primaryFaction: string;
  onFactionChange?: (faction: string, change: number) => void;
  displayMode?: 'chart' | 'bars' | 'terminal';
}

interface FactionData {
  id: string;
  name: string;
  affinity: number; // 0-100
  description: string;
  logo: string;
  interpretationStyle: {
    analysisApproach: string;
    decisionMaking: string;
    riskAssessment: string;
  };
}
```

#### 2.3.3 ReadingInterface 組件
```typescript
interface ReadingInterfaceProps {
  onQuestionSubmit: (question: string, category: string) => void;
  onCardDraw: (spreadType: SpreadType) => Promise<DrawnCard[]>;
  onInterpretationRequest: (cards: DrawnCard[], question: string) => Promise<string>;
}
```

### 2.4 狀態管理

#### 2.4.1 Reading Store
```typescript
interface ReadingState {
  currentReading: Reading | null;
  isDrawing: boolean;
  isInterpreting: boolean;
  error: string | null;

  // Actions
  startReading: (question: string, category: string) => void;
  drawCards: (spreadType: SpreadType) => Promise<void>;
  getInterpretation: () => Promise<void>;
  saveReading: () => Promise<void>;
  clearReading: () => void;
}
```

#### 2.4.2 User Store
```typescript
interface UserState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}
```

## 3. 後端設計

### 3.1 技術棧
- **框架**：FastAPI 0.104+
- **語言**：Python 3.11+
- **ORM**：SQLAlchemy 2.0+
- **驗證**：Pydantic v2
- **認證**：JWT + Supabase Auth
- **AI 服務**：Google Gemini API
- **部署**：Docker + Railway

### 3.2 專案結構
```
app/
├── api/                   # API 路由
│   ├── v1/               # API v1
│   │   ├── endpoints/    # API 端點
│   │   │   ├── auth.py       # 認證路由
│   │   │   ├── readings.py   # 解讀路由
│   │   │   ├── cards.py      # 塔羅牌路由
│   │   │   ├── users.py      # 用戶路由
│   │   │   ├── bingo.py      # Daily Bingo 路由
│   │   │   └── analytics.py  # 分析路由
│   │   └── api.py        # API 路由器
│   └── deps.py           # 依賴注入
├── core/                  # 核心配置
│   ├── config.py         # 應用配置
│   ├── security.py       # 安全相關
│   ├── database.py       # 資料庫配置
│   ├── logging_config.py # 日誌配置
│   └── exceptions.py     # 自定義例外
├── models/               # SQLAlchemy 模型
│   ├── user.py          # 用戶模型
│   ├── reading.py       # 解讀模型
│   ├── card.py          # 塔羅牌模型
│   ├── bingo.py         # Bingo 遊戲模型
│   ├── reading_session.py # 閱讀會話模型
│   └── user_analytics.py  # 用戶分析模型
├── schemas/              # Pydantic schemas
│   ├── user.py          # 用戶 schemas
│   ├── reading.py       # 解讀 schemas
│   ├── card.py          # 塔羅牌 schemas
│   ├── bingo.py         # Bingo schemas
│   └── sessions.py      # 會話 schemas
├── services/             # 業務邏輯服務
│   ├── auth_service.py   # 認證服務
│   ├── reading_service.py # 解讀服務
│   ├── ai_service.py     # AI 服務
│   ├── card_service.py   # 塔羅牌服務
│   ├── bingo_card_service.py        # Bingo 卡片服務
│   ├── daily_number_generator_service.py  # 每日號碼生成
│   ├── line_detection_service.py    # 連線檢測服務
│   └── daily_claim_service.py       # 每日領取服務
├── utils/                # 工具函數
│   ├── ai_client.py      # AI 客戶端
│   ├── card_data.py      # 塔羅牌資料
│   └── helpers.py        # 輔助函數
└── main.py               # 應用入口
```

### 3.2.1 Supabase 排程系統
```
supabase/
├── functions/            # Edge Functions (Deno)
│   ├── generate-daily-number/  # 每日號碼生成
│   │   └── index.ts
│   └── monthly-reset/          # 每月重置
│       └── index.ts
└── migrations/           # SQL 遷移檔案
    ├── 20251002000000_setup_pg_cron_bingo.sql      # pg_cron 設定
    └── 20251002000001_create_partition_function.sql # 分區函式
```

### 3.3 資料模型

#### 3.3.1 用戶模型
```python
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    readings = relationship("Reading", back_populates="user")
```

#### 3.3.2 用戶檔案模型
```python
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    display_name = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    zodiac_sign = Column(String, nullable=True)
    interests = Column(JSON, default=list)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    user = relationship("User", back_populates="profile")
```

#### 3.3.3 解讀模型
```python
class Reading(Base):
    __tablename__ = "readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    spread_type = Column(String, nullable=False)
    cards_drawn = Column(JSON, nullable=False)  # List[DrawnCard]
    interpretation = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 關聯
    user = relationship("User", back_populates="readings")
```

#### 3.3.4 塔羅牌模型
```python
class TarotCard(Base):
    __tablename__ = "tarot_cards"

    id = Column(String, primary_key=True)  # e.g., "major_0_fool"
    name = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    suit = Column(String, nullable=False)  # major, cups, wands, swords, pentacles
    number = Column(Integer, nullable=True)
    image_url = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    keywords = Column(JSON, default=list)
    upright_meanings = Column(JSON, default=list)
    reversed_meanings = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

## 4. AI 服務設計

### 4.1 Google Gemini 整合

#### 4.1.1 AI 客戶端
```python
class GeminiAIClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = genai.GenerativeModel('gemini-pro')

    async def interpret_reading(
        self,
        cards: List[DrawnCard],
        question: str,
        user_context: Optional[UserContext] = None
    ) -> str:
        """生成塔羅牌解讀"""
        prompt = self._build_interpretation_prompt(cards, question, user_context)
        response = await self.model.generate_content_async(prompt)
        return self._format_interpretation(response.text)

    def _build_interpretation_prompt(
        self,
        cards: List[DrawnCard],
        question: str,
        user_context: Optional[UserContext]
    ) -> str:
        """構建解讀提示詞"""
        # 詳細的提示詞工程邏輯
        pass
```

#### 4.1.2 提示詞工程
```python
INTERPRETATION_PROMPT_TEMPLATE = """
你是一位專業的塔羅牌解讀師，具有深厚的塔羅牌知識和直覺洞察力。

用戶問題：{question}
用戶背景：{user_context}

抽取的塔羅牌：
{cards_info}

請根據以下結構提供詳細解讀：

1. 整體概述
2. 逐牌分析
3. 牌卡間的相互關係
4. 針對問題的具體建議
5. 未來展望

解讀要求：
- 使用繁體中文
- 語氣溫和且富有洞察力
- 提供實用的生活建議
- 避免過於絕對的預測
- 鼓勵用戶的自主選擇

解讀內容應該在 800-1200 字之間。
"""
```

### 4.2 快取和優化

#### 4.2.1 響應快取
```python
class InterpretationCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 3600  # 1 hour

    async def get_cached_interpretation(
        self,
        cards_hash: str,
        question_hash: str
    ) -> Optional[str]:
        """獲取快取的解讀"""
        cache_key = f"interpretation:{cards_hash}:{question_hash}"
        return await self.redis.get(cache_key)

    async def cache_interpretation(
        self,
        cards_hash: str,
        question_hash: str,
        interpretation: str
    ):
        """快取解讀結果"""
        cache_key = f"interpretation:{cards_hash}:{question_hash}"
        await self.redis.setex(cache_key, self.ttl, interpretation)
```

## 5. 安全設計

### 5.1 認證與授權

#### 5.1.1 JWT Token 設計
```python
class TokenData:
    user_id: str
    email: str
    username: str
    exp: datetime
    iat: datetime
    type: str  # "access" or "refresh"

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

#### 5.1.2 權限控制
```python
class PermissionChecker:
    @staticmethod
    def can_access_reading(user: User, reading: Reading) -> bool:
        """檢查用戶是否可以訪問解讀"""
        return (
            reading.user_id == user.id or
            reading.is_public or
            user.is_admin
        )

    @staticmethod
    def can_modify_reading(user: User, reading: Reading) -> bool:
        """檢查用戶是否可以修改解讀"""
        return reading.user_id == user.id or user.is_admin
```

### 5.2 資料保護

#### 5.2.1 敏感資料加密
```python
class DataEncryption:
    def __init__(self, secret_key: str):
        self.fernet = Fernet(secret_key.encode())

    def encrypt_sensitive_data(self, data: str) -> str:
        """加密敏感資料"""
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """解密敏感資料"""
        return self.fernet.decrypt(encrypted_data.encode()).decode()
```

#### 5.2.2 輸入驗證
```python
class InputValidator:
    @staticmethod
    def sanitize_question(question: str) -> str:
        """清理和驗證用戶問題"""
        # 移除潛在的 HTML/JavaScript
        cleaned = html.escape(question.strip())

        # 長度限制
        if len(cleaned) > 1000:
            raise ValueError("問題長度不能超過 1000 字元")

        return cleaned

    @staticmethod
    def validate_spread_type(spread_type: str) -> bool:
        """驗證牌陣類型"""
        valid_types = ['single', 'three-card', 'celtic-cross', 'custom']
        return spread_type in valid_types
```

## 6. 效能優化

### 6.1 前端優化

#### 6.1.1 代碼分割
```typescript
// 頁面級別的代碼分割
const ReadingPage = dynamic(() => import('./reading/page'), {
  loading: () => <LoadingSpinner />,
});

// 組件級別的懶載入
const TarotCardDetail = lazy(() => import('@/components/tarot/TarotCardDetail'));
```

#### 6.1.2 圖片優化
```typescript
// 使用 Next.js Image 組件
import Image from 'next/image';

const TarotCardImage = ({ card }: { card: TarotCardData }) => (
  <Image
    src={card.imageUrl}
    alt={card.name}
    width={200}
    height={350}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
    sizes="(max-width: 768px) 100vw, 50vw"
  />
);
```

### 6.2 後端優化

#### 6.2.1 資料庫查詢優化
```python
class ReadingService:
    async def get_user_readings_optimized(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20
    ) -> List[Reading]:
        """優化的用戶解讀查詢"""
        query = (
            select(Reading)
            .where(Reading.user_id == user_id)
            .order_by(Reading.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(selectinload(Reading.user))  # 預載入用戶資料
        )
        result = await self.db.execute(query)
        return result.scalars().all()
```

#### 6.2.2 API 響應快取
```python
from functools import lru_cache

class CardService:
    @lru_cache(maxsize=128)
    async def get_all_cards_cached(self) -> List[TarotCard]:
        """快取所有塔羅牌資料"""
        return await self.get_all_cards()
```

## 7. 監控與維護

### 7.1 應用監控

#### 7.1.1 健康檢查
```python
@router.get("/health")
async def health_check():
    """系統健康檢查"""
    checks = {
        "database": await check_database_connection(),
        "ai_service": await check_ai_service(),
        "cache": await check_cache_service(),
    }

    is_healthy = all(checks.values())
    status_code = 200 if is_healthy else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "unhealthy",
            "checks": checks,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

#### 7.1.2 錯誤追蹤
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
)
```

### 7.2 效能監控

#### 7.2.1 API 響應時間監控
```python
import time
from fastapi import Request, Response

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    # 記錄慢查詢
    if process_time > 5.0:
        logger.warning(f"Slow request: {request.url} took {process_time:.2f}s")

    return response
```

## 8. 部署配置

### 8.1 Docker 配置

#### 8.1.1 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用代碼
COPY . .

# 暴露端口
EXPOSE 8000

# 啟動命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 8.1.2 docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### 8.2 環境配置

#### 8.2.1 環境變數
```python
class Settings(BaseSettings):
    # 應用配置
    APP_NAME: str = "Tarot Reading Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # 資料庫配置
    DATABASE_URL: str

    # AI 服務配置
    GEMINI_API_KEY: str

    # 安全配置
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 外部服務配置
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
```

這個技術設計文件提供了完整的系統架構設計和實現指導，為開發團隊提供了詳細的技術路線圖。