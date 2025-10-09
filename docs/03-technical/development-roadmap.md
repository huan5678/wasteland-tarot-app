# 開發路線圖與統一計劃

## 🎯 整合概述

本文件整合了三個專業代理人的分析結果，提供塔羅牌應用混合架構開發的統一執行計劃。

## 📊 專案時程總覽

```
12週開發計劃
階段一: 基礎建設 (週1-3)    █████████░░░
階段二: 核心功能 (週4-7)    ░░░██████████░
階段三: 體驗優化 (週8-10)   ░░░░░░░░█████░░
階段四: 上線準備 (週11-12)  ░░░░░░░░░░░███
```

## 🏗️ 階段一：基礎建設 (週 1-3)

### 週 1：專案初始化與環境設定

#### 前端初始化
```bash
# 專案設定
npx create-next-app@latest tarot-frontend --typescript --tailwind --app
cd tarot-frontend

# 安裝依賴
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install zustand @tanstack/react-query axios
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

#### 後端初始化
```bash
# 建立 FastAPI 專案
mkdir tarot-backend && cd tarot-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic
pip install pydantic pydantic-settings python-jwt bcrypt redis
pip install pytest pytest-asyncio pytest-cov httpx
```

#### 資料庫設定
```sql
-- PostgreSQL 初始化
CREATE DATABASE tarot_app;
CREATE USER tarot_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tarot_app TO tarot_user;
```

### 週 2：基礎架構建立

#### 後端架構 (FastAPI)
```python
# app/main.py - 主應用程式
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(title="Tarot Reading API", version="1.0.0")

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
```

```python
# app/models/user.py - 用戶模型
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

#### 前端基礎架構
```typescript
// src/lib/store.ts - Zustand 狀態管理
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  user: User | null;
  currentReading: Reading | null;
  setUser: (user: User | null) => void;
  setCurrentReading: (reading: Reading | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools((set) => ({
    user: null,
    currentReading: null,
    setUser: (user) => set({ user }),
    setCurrentReading: (reading) => set({ currentReading: reading }),
  }))
);
```

### 週 3：認證系統實作

#### JWT 認證實作
```python
# app/core/auth.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

#### 前端認證組件
```typescript
// src/components/auth/LoginForm.tsx
export function LoginForm() {
  const { mutate: login, isLoading } = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (response) => {
      localStorage.setItem('token', response.access_token);
      useAppStore.getState().setUser(response.user);
      router.push('/dashboard');
    },
  });

  // ... 表單實作
}
```

**里程碑檢查點**：
- [ ] 前後端專案架構建立
- [ ] 資料庫連接和基本模型
- [ ] JWT 認證系統運作
- [ ] 基礎 API 端點測試通過

## 🎮 階段二：核心功能開發 (週 4-7)

### 週 4：塔羅牌系統建立

#### 塔羅牌資料模型
```python
# app/models/tarot.py
class TarotCard(Base):
    __tablename__ = "tarot_cards"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    suit = Column(String(50))  # 大阿爾克那、聖杯、權杖、寶劍、錢幣
    number = Column(Integer)
    meaning_upright = Column(Text)
    meaning_reversed = Column(Text)
    keywords = Column(JSON)  # 關鍵詞陣列
    image_url = Column(String(500))
    symbolism = Column(Text)
```

#### 抽牌業務邏輯
```python
# app/services/tarot_service.py
import random
from typing import List, Dict

def draw_random_cards(count: int, exclude_ids: List[int] = None) -> List[Dict]:
    """隨機抽取指定數量的塔羅牌"""
    all_cards = get_all_tarot_cards()

    if exclude_ids:
        available_cards = [card for card in all_cards if card.id not in exclude_ids]
    else:
        available_cards = all_cards

    if len(available_cards) < count:
        raise ValueError("可用卡片數量不足")

    selected_cards = random.sample(available_cards, count)

    # 隨機決定正位或逆位
    result = []
    for card in selected_cards:
        position = random.choice(['upright', 'reversed'])
        result.append({
            'id': card.id,
            'name': card.name,
            'position': position,
            'meaning': card.meaning_upright if position == 'upright' else card.meaning_reversed,
            'image_url': card.image_url
        })

    return result
```

### 週 5：前端塔羅牌組件

#### 塔羅牌組件實作
```typescript
// src/components/tarot/TarotCard.tsx
interface TarotCardProps {
  card: TarotCard;
  isRevealed: boolean;
  isFlipping: boolean;
  onClick?: () => void;
}

export function TarotCard({ card, isRevealed, isFlipping, onClick }: TarotCardProps) {
  return (
    <div
      className={cn(
        "relative w-32 h-48 cursor-pointer transition-transform duration-500",
        "hover:scale-105",
        isFlipping && "animate-flip"
      )}
      onClick={onClick}
      data-testid="tarot-card"
    >
      <div className={cn(
        "absolute inset-0 w-full h-full transition-opacity duration-300",
        isRevealed ? "opacity-0" : "opacity-100"
      )}>
        <CardBack />
      </div>

      <div className={cn(
        "absolute inset-0 w-full h-full transition-opacity duration-300",
        isRevealed ? "opacity-100" : "opacity-0"
      )}>
        <CardFront card={card} />
      </div>
    </div>
  );
}
```

#### 抽牌動畫實作
```typescript
// src/components/tarot/CardDrawing.tsx
export function CardDrawing({ onCardsDrawn }: CardDrawingProps) {
  const [phase, setPhase] = useState<'shuffling' | 'selecting' | 'revealing'>('shuffling');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);

  const handleShuffle = useCallback(async () => {
    setPhase('shuffling');

    // 洗牌動畫 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000));

    setPhase('selecting');
  }, []);

  const handleCardSelect = useCallback(async (position: number) => {
    // 抽牌 API 呼叫
    const cards = await drawCards({ count: 1, position });
    setSelectedCards(prev => [...prev, ...cards]);

    if (selectedCards.length + 1 === requiredCards) {
      setPhase('revealing');
      onCardsDrawn(selectedCards);
    }
  }, [selectedCards, requiredCards, onCardsDrawn]);

  // ... 渲染邏輯
}
```

### 週 6：AI 解讀整合

#### OpenAI API 整合
```python
# app/services/ai_service.py
import openai
from typing import List, Dict
from app.core.config import settings

openai.api_key = settings.OPENAI_API_KEY

async def generate_interpretation(
    cards: List[Dict],
    question: str,
    user_context: Dict = None
) -> str:
    """生成塔羅牌解讀"""

    # 建構 prompt
    cards_description = "\n".join([
        f"- {card['name']} ({card['position']}): {card['meaning']}"
        for card in cards
    ])

    prompt = f"""
    作為一位專業的塔羅牌解讀師，請為以下占卜提供深入而有意義的解讀：

    問題：{question}

    抽到的牌：
    {cards_description}

    請提供一個結構化的解讀，包含：
    1. 整體概況
    2. 每張牌的詳細解釋
    3. 牌與牌之間的關聯
    4. 具體的行動建議
    5. 深層的靈性洞察

    請用溫暖、智慧且富有洞察力的語調回答。
    """

    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "你是一位充滿智慧和直覺的塔羅牌解讀師。"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.error(f"AI 解讀生成失敗: {str(e)}")
        return "很抱歉，目前無法生成解讀，請稍後再試。"
```

### 週 7：占卜流程整合

#### 完整占卜 API
```python
# app/api/v1/endpoints/readings.py
@router.post("/", response_model=ReadingResponse)
async def create_reading(
    reading_data: ReadingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """創建新的占卜"""

    # 1. 抽牌
    cards = draw_random_cards(
        count=get_spread_card_count(reading_data.spread_type)
    )

    # 2. 生成 AI 解讀
    interpretation = await generate_interpretation(
        cards=cards,
        question=reading_data.question,
        user_context={"user_id": current_user.id}
    )

    # 3. 保存到資料庫
    reading = Reading(
        user_id=current_user.id,
        question=reading_data.question,
        spread_type=reading_data.spread_type,
        cards_data=cards,
        interpretation=interpretation
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)

    return reading
```

**里程碑檢查點**：
- [ ] 塔羅牌資料完整載入
- [ ] 抽牌邏輯正確運作
- [ ] AI 解讀整合成功
- [ ] 完整占卜流程測試通過

## 🎨 階段三：使用者體驗優化 (週 8-10)

### 週 8：動畫與互動優化

#### 進階動畫實作
```css
/* src/styles/animations.css */
@keyframes cardFlip {
  0% { transform: perspective(1000px) rotateY(0deg); }
  50% { transform: perspective(1000px) rotateY(90deg) scale(0.8); }
  100% { transform: perspective(1000px) rotateY(0deg); }
}

@keyframes cardGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(168, 85, 247, 0.4); }
  50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.8); }
}

.card-flip-animation {
  animation: cardFlip 0.8s ease-in-out;
}

.card-selected {
  animation: cardGlow 2s ease-in-out infinite;
}
```

#### 手勢互動 (行動端)
```typescript
// src/hooks/useSwipeGesture.ts
import { useCallback, useRef } from 'react';

export function useSwipeGesture(onSwipe: (direction: 'left' | 'right') => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);

    // 只有水平滑動且距離足夠時才觸發
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      onSwipe(deltaX > 0 ? 'right' : 'left');
    }

    touchStart.current = null;
  }, [onSwipe]);

  return { handleTouchStart, handleTouchEnd };
}
```

### 週 9：歷史功能與個人化

#### 歷史記錄組件
```typescript
// src/components/history/ReadingHistory.tsx
export function ReadingHistory() {
  const [filters, setFilters] = useState<HistoryFilters>({
    dateRange: 'all',
    questionType: 'all',
    spreadType: 'all'
  });

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['readings', filters],
    queryFn: ({ pageParam = 0 }) => fetchReadings({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined
  });

  return (
    <div className="space-y-6">
      <HistoryFilters filters={filters} onChange={setFilters} />

      <div className="grid gap-4">
        {data?.pages.flatMap(page => page.readings).map(reading => (
          <ReadingCard key={reading.id} reading={reading} />
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          className="w-full py-2 text-primary-500 hover:text-primary-600"
        >
          載入更多
        </button>
      )}
    </div>
  );
}
```

#### 個人化推薦
```python
# app/services/recommendation_service.py
def get_personalized_recommendations(user_id: int, db: Session) -> List[Dict]:
    """基於用戶歷史提供個人化建議"""

    # 分析用戶的占卜模式
    user_readings = db.query(Reading).filter(Reading.user_id == user_id).all()

    # 分析常見問題類型
    question_patterns = analyze_question_patterns(user_readings)

    # 分析偏好的牌陣類型
    preferred_spreads = analyze_spread_preferences(user_readings)

    # 分析活躍時間
    active_times = analyze_reading_times(user_readings)

    recommendations = []

    if question_patterns.get('love', 0) > 0.3:
        recommendations.append({
            "type": "spread",
            "title": "愛情專屬牌陣",
            "description": "基於你對愛情問題的關注，推薦這個深度愛情牌陣"
        })

    return recommendations
```

### 週 10：效能最佳化

#### 圖片最佳化
```typescript
// src/components/tarot/OptimizedCardImage.tsx
import Image from 'next/image';
import { useState } from 'react';

export function OptimizedCardImage({ card, priority = false }: CardImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 animate-pulse rounded-lg" />
      )}

      <Image
        src={card.imageUrl}
        alt={`${card.name} 塔羅牌`}
        width={200}
        height={300}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..." // 低品質預覽
        onLoadingComplete={() => setIsLoading(false)}
        className={cn(
          "transition-opacity duration-300 rounded-lg",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
}
```

#### Redis 快取策略
```python
# app/core/cache.py
import redis
import json
from typing import Any, Optional
from app.core.config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL)

def cache_tarot_cards():
    """快取所有塔羅牌資料"""
    cards = get_all_tarot_cards()
    cards_data = [card.dict() for card in cards]

    redis_client.setex(
        "tarot_cards:all",
        3600 * 24,  # 24小時
        json.dumps(cards_data)
    )

def get_cached_cards() -> Optional[List[Dict]]:
    """從快取獲取塔羅牌資料"""
    cached_data = redis_client.get("tarot_cards:all")

    if cached_data:
        return json.loads(cached_data)

    return None

def cache_user_reading(user_id: int, reading: Dict):
    """快取用戶最近的占卜"""
    redis_client.setex(
        f"user_reading:{user_id}:latest",
        3600,  # 1小時
        json.dumps(reading)
    )
```

**里程碑檢查點**：
- [ ] 動畫效果流暢運作
- [ ] 歷史功能完整實作
- [ ] 個人化推薦正常
- [ ] 效能指標達到目標

## 🚀 階段四：上線準備 (週 11-12)

### 週 11：部署與 CI/CD

#### Docker 配置
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine as runner
WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: 部署流程

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: 執行前端測試
        run: |
          npm ci
          npm run test:ci
          npm run test:e2e

      - name: 執行後端測試
        run: |
          pip install -r requirements.txt
          pytest --cov=app

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: 部署後端到 Zeabur
        run: |
          curl -fsSL https://zeabur.com/install.sh | bash
          zeabur auth login --token ${{ secrets.ZEABUR_TOKEN }}
          cd backend && zeabur deploy

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: 部署前端到 Zeabur
        run: |
          curl -fsSL https://zeabur.com/install.sh | bash
          zeabur auth login --token ${{ secrets.ZEABUR_TOKEN }}
          zeabur deploy
```

### 週 12：監控與優化

#### 錯誤追蹤設定
```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // 過濾敏感資訊
    if (event.user) {
      delete event.user.email;
    }
    return event;
  }
});
```

#### 效能監控
```python
# app/middleware/monitoring.py
import time
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time

        logger.info(
            "Request processed",
            extra={
                "method": request.method,
                "url": str(request.url),
                "status_code": response.status_code,
                "process_time": process_time
            }
        )

        response.headers["X-Process-Time"] = str(process_time)
        return response
```

## 📋 最終檢查清單

### 功能完整性
- [ ] 用戶註冊/登入/登出
- [ ] 塔羅牌資料管理
- [ ] 多種牌陣支援
- [ ] AI 智能解讀
- [ ] 占卜歷史管理
- [ ] 個人化推薦
- [ ] 社群分享功能

### 技術品質
- [ ] 測試覆蓋率 ≥ 85%
- [ ] 效能指標達標
- [ ] 安全性檢查通過
- [ ] 無障礙性驗證
- [ ] 響應式設計完整

### 部署就緒
- [ ] 生產環境配置
- [ ] 監控系統運作
- [ ] 備份策略建立
- [ ] 文件完整更新
- [ ] 用戶手冊準備

## 🎯 成功指標

### 技術指標
- 首頁載入時間 < 2秒
- API 平均回應時間 < 500ms
- 錯誤率 < 1%
- 測試覆蓋率 ≥ 85%

### 業務指標
- 用戶註冊轉換率 ≥ 15%
- 占卜完成率 ≥ 80%
- 用戶 7 天留存率 ≥ 30%
- AI 解讀滿意度 ≥ 4.0/5.0

---

*此開發路線圖將確保專案按時高品質交付*