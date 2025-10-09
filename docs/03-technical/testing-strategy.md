# 測試策略與實施計劃

## 🎯 測試策略概述

本文件定義塔羅牌應用的全面測試策略，確保應用的可靠性、效能和用戶體驗。

## 🏗️ 測試金字塔架構

```
    /\        E2E Tests (10%)
   /  \       關鍵業務流程
  /____\
 /      \     Integration Tests (20%)
/__________\   API 和組件整合
/          \
/____________\  Unit Tests (70%)
              組件和函數單元測試
```

## 🔧 前端測試策略

### 1. 測試環境配置

#### Jest + Testing Library 配置
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Testing Library 設定
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW 伺服器設定
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// 模擬 Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));
```

### 2. 組件單元測試

#### 基礎 UI 組件測試
```typescript
// src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('應該正確渲染按鈕文字', () => {
    render(<Button>點擊我</Button>);
    expect(screen.getByRole('button', { name: '點擊我' })).toBeInTheDocument();
  });

  it('應該處理點擊事件', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>點擊我</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('應該在 loading 狀態顯示載入動畫', () => {
    render(<Button loading>提交</Button>);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('應該應用正確的變體樣式', () => {
    render(<Button variant="mystical">神秘按鈕</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-mystical');
  });
});
```

#### 塔羅牌組件測試
```typescript
// src/components/tarot/TarotCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TarotCard } from './TarotCard';

const mockCard = {
  id: 1,
  name: '愚者',
  suit: '大阿爾克那',
  meaningUpright: '新的開始',
  meaningReversed: '魯莽行事',
  imageUrl: '/cards/fool.jpg'
};

describe('TarotCard Component', () => {
  it('應該顯示卡片背面當 isRevealed 為 false', () => {
    render(<TarotCard card={mockCard} isRevealed={false} />);

    expect(screen.getByTestId('card-back')).toBeInTheDocument();
    expect(screen.queryByText('愚者')).not.toBeInTheDocument();
  });

  it('應該顯示卡片正面當 isRevealed 為 true', () => {
    render(<TarotCard card={mockCard} isRevealed={true} />);

    expect(screen.getByText('愚者')).toBeInTheDocument();
    expect(screen.getByAltText('愚者 塔羅牌')).toBeInTheDocument();
  });

  it('應該處理翻牌動畫', async () => {
    const { rerender } = render(
      <TarotCard card={mockCard} isRevealed={false} />
    );

    rerender(<TarotCard card={mockCard} isRevealed={true} />);

    const cardElement = screen.getByTestId('tarot-card');
    expect(cardElement).toHaveClass('flipping');

    await waitFor(() => {
      expect(cardElement).not.toHaveClass('flipping');
    }, { timeout: 1000 });
  });

  it('應該處理卡片點擊事件', () => {
    const handleClick = jest.fn();
    render(
      <TarotCard
        card={mockCard}
        isRevealed={false}
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByTestId('tarot-card'));
    expect(handleClick).toHaveBeenCalledWith(mockCard);
  });
});
```

### 3. Hook 測試

#### 自定義 Hook 測試
```typescript
// src/hooks/useReading.test.ts
import { renderHook, act } from '@testing-library/react';
import { useReading } from './useReading';

describe('useReading Hook', () => {
  it('應該初始化為空狀態', () => {
    const { result } = renderHook(() => useReading());

    expect(result.current.currentReading).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('應該成功開始新占卜', async () => {
    const { result } = renderHook(() => useReading());

    await act(async () => {
      await result.current.startReading({
        question: '我的愛情運勢如何？',
        spreadType: 'three-card'
      });
    });

    expect(result.current.currentReading).toBeDefined();
    expect(result.current.currentReading?.question).toBe('我的愛情運勢如何？');
  });

  it('應該處理錯誤狀態', async () => {
    const { result } = renderHook(() => useReading());

    // 模擬 API 錯誤
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      await result.current.startReading({ question: '', spreadType: 'single' });
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.currentReading).toBeNull();
  });
});
```

### 4. 整合測試

#### API 服務整合測試
```typescript
// src/services/api.test.ts
import { rest } from 'msw';
import { server } from '../test/mocks/server';
import { createReading, getReadingHistory } from './api';

describe('API Service Integration', () => {
  it('應該成功創建新占卜', async () => {
    const readingData = {
      question: '我的事業發展如何？',
      spreadType: 'three-card' as const
    };

    const result = await createReading(readingData);

    expect(result.data).toHaveProperty('id');
    expect(result.data.question).toBe(readingData.question);
    expect(result.data.cards).toHaveLength(3);
  });

  it('應該處理 API 錯誤', async () => {
    server.use(
      rest.post('/api/tarot/reading', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: '伺服器錯誤' }));
      })
    );

    await expect(createReading({
      question: '測試問題',
      spreadType: 'single'
    })).rejects.toThrow('伺服器錯誤');
  });

  it('應該正確獲取歷史記錄', async () => {
    const history = await getReadingHistory();

    expect(Array.isArray(history.data)).toBe(true);
    expect(history.data.length).toBeGreaterThan(0);
    expect(history.data[0]).toHaveProperty('id');
    expect(history.data[0]).toHaveProperty('question');
  });
});
```

## 🔗 後端測試策略

### 1. 測試環境配置

#### pytest 配置
```python
# conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.core.config import settings

# 測試資料庫設定
SQLALCHEMY_DATABASE_URL = "postgresql://test:test@localhost/test_tarot"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """建立測試資料庫連接"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """建立測試客戶端"""
    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

### 2. 模型和服務測試

#### 資料模型測試
```python
# tests/test_models.py
def test_user_model(db):
    """測試用戶模型"""
    user_data = {
        "email": "test@example.com",
        "password_hash": "hashed_password"
    }

    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.is_verified is False
    assert user.created_at is not None

def test_reading_model(db):
    """測試占卜記錄模型"""
    user = User(email="test@example.com", password_hash="hash")
    db.add(user)
    db.commit()

    reading_data = {
        "user_id": user.id,
        "question": "測試問題",
        "cards_data": [{"name": "愚者", "position": "upright"}],
        "interpretation": "測試解讀"
    }

    reading = Reading(**reading_data)
    db.add(reading)
    db.commit()

    assert reading.id is not None
    assert reading.user_id == user.id
    assert len(reading.cards_data) == 1
```

#### 業務邏輯測試
```python
# tests/test_services.py
from app.services.tarot_service import draw_random_cards, generate_interpretation

def test_draw_random_cards():
    """測試隨機抽牌服務"""
    cards = draw_random_cards(count=3)

    assert len(cards) == 3
    assert len(set(card['id'] for card in cards)) == 3  # 無重複
    assert all('position' in card for card in cards)
    assert all(card['position'] in ['upright', 'reversed'] for card in cards)

@pytest.mark.asyncio
async def test_generate_interpretation():
    """測試 AI 解讀生成服務"""
    cards = [
        {"name": "愚者", "position": "upright"},
        {"name": "魔術師", "position": "reversed"}
    ]
    question = "我的愛情運勢如何？"

    with patch('app.services.ai_service.openai_client') as mock_openai:
        mock_openai.chat.completions.create.return_value.choices[0].message.content = "測試解讀"

        interpretation = await generate_interpretation(cards, question)

        assert len(interpretation) > 0
        assert interpretation == "測試解讀"
        mock_openai.chat.completions.create.assert_called_once()
```

### 3. API 端點測試

#### 認證 API 測試
```python
# tests/test_auth.py
def test_register_user(client):
    """測試用戶註冊"""
    user_data = {
        "email": "test@example.com",
        "password": "password123"
    }

    response = client.post("/auth/register", json=user_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_data["email"]
    assert "id" in data
    assert "password" not in data

def test_login_user(client, db):
    """測試用戶登入"""
    # 先建立用戶
    user = User(
        email="test@example.com",
        password_hash=hash_password("password123"),
        is_verified=True
    )
    db.add(user)
    db.commit()

    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }

    response = client.post("/auth/login", json=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
```

#### 塔羅牌 API 測試
```python
# tests/test_tarot_api.py
def test_create_reading(client, auth_headers):
    """測試創建占卜"""
    reading_data = {
        "question": "我的事業發展如何？",
        "spread_type": "three_card"
    }

    response = client.post(
        "/tarot/reading",
        json=reading_data,
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["question"] == reading_data["question"]
    assert len(data["cards"]) == 3
    assert "interpretation" in data
    assert "id" in data

def test_get_reading_history(client, auth_headers, db):
    """測試獲取占卜歷史"""
    # 先建立一些測試資料
    user_id = get_user_id_from_token(auth_headers["Authorization"])

    readings = [
        Reading(user_id=user_id, question=f"問題 {i}", cards_data=[], interpretation=f"解讀 {i}")
        for i in range(5)
    ]
    db.add_all(readings)
    db.commit()

    response = client.get("/history", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert all("question" in reading for reading in data)
```

### 4. 效能測試

#### 負載測試
```python
# tests/test_performance.py
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

def test_concurrent_readings(client, auth_headers):
    """測試併發占卜請求"""
    def create_reading():
        return client.post(
            "/tarot/reading",
            json={"question": "測試問題", "spread_type": "single"},
            headers=auth_headers
        )

    start_time = time.time()

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(create_reading) for _ in range(20)]
        responses = [future.result() for future in futures]

    end_time = time.time()
    duration = end_time - start_time

    # 所有請求都應該成功
    assert all(response.status_code == 201 for response in responses)

    # 平均回應時間應該小於 2 秒
    assert duration / 20 < 2.0

@pytest.mark.asyncio
async def test_ai_service_timeout():
    """測試 AI 服務超時處理"""
    with patch('app.services.ai_service.openai_client') as mock_openai:
        # 模擬超時
        mock_openai.chat.completions.create.side_effect = asyncio.TimeoutError()

        start_time = time.time()

        with pytest.raises(HTTPException) as exc_info:
            await generate_interpretation([], "測試問題")

        duration = time.time() - start_time

        assert exc_info.value.status_code == 408
        assert duration < 30  # 應該在30秒內超時
```

## 🔍 E2E 測試策略

### 1. Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

### 2. 關鍵流程測試

```typescript
// e2e/reading-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('占卜完整流程', () => {
  test.beforeEach(async ({ page }) => {
    // 模擬登入狀態
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('應該完成單張牌占卜流程', async ({ page }) => {
    // 開始占卜
    await page.click('[data-testid=start-reading]');
    await expect(page).toHaveURL('/reading/new');

    // 輸入問題
    await page.fill('[data-testid=question-input]', '我今天的運勢如何？');
    await page.selectOption('[data-testid=spread-select]', 'single');
    await page.click('[data-testid=continue-button]');

    // 抽牌
    await expect(page.locator('[data-testid=card-deck]')).toBeVisible();
    await page.click('[data-testid=card-deck]');

    // 等待動畫完成
    await expect(page.locator('[data-testid=drawn-card]')).toBeVisible();
    await page.click('[data-testid=reveal-button]');

    // 檢查結果
    await expect(page.locator('[data-testid=card-name]')).toBeVisible();
    await expect(page.locator('[data-testid=interpretation]')).toBeVisible();

    // 保存占卜
    await page.click('[data-testid=save-reading]');
    await expect(page.locator('[data-testid=save-success]')).toBeVisible();
  });

  test('應該完成三張牌占卜流程', async ({ page }) => {
    await page.click('[data-testid=start-reading]');
    await page.fill('[data-testid=question-input]', '我的愛情運勢如何？');
    await page.selectOption('[data-testid=spread-select]', 'three_card');
    await page.click('[data-testid=continue-button]');

    // 抽取三張牌
    for (let i = 0; i < 3; i++) {
      await page.click(`[data-testid=card-position-${i}]`);
      await expect(page.locator(`[data-testid=selected-card-${i}]`)).toBeVisible();
    }

    await page.click('[data-testid=reveal-all]');

    // 檢查三張牌都顯示
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(`[data-testid=card-${i}-name]`)).toBeVisible();
    }

    await expect(page.locator('[data-testid=interpretation]')).toBeVisible();
  });
});

test.describe('響應式設計', () => {
  test('行動端占卜流程', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    await page.click('[data-testid=start-reading]');

    // 檢查行動端版面
    await expect(page.locator('[data-testid=mobile-question-form]')).toBeVisible();

    await page.fill('[data-testid=question-input]', '測試問題');
    await page.click('[data-testid=mobile-continue]');

    // 檢查行動端抽牌介面
    await expect(page.locator('[data-testid=mobile-card-area]')).toBeVisible();
  });
});
```

## 📊 測試報告與監控

### 1. 測試覆蓋率報告

```bash
# 生成前端測試覆蓋率報告
npm run test:coverage

# 生成後端測試覆蓋率報告
pytest --cov=app --cov-report=html

# E2E 測試報告
npx playwright show-report
```

### 2. CI/CD 整合

```yaml
# .github/workflows/test.yml
name: 測試流程

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: 安裝依賴
        run: npm ci

      - name: 執行單元測試
        run: npm run test:ci

      - name: 執行整合測試
        run: npm run test:integration

      - name: 上傳覆蓋率報告
        uses: codecov/codecov-action@v3

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: 安裝依賴
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt

      - name: 執行測試
        run: pytest --cov=app --cov-report=xml
        env:
          DATABASE_URL: postgresql://postgres:test@localhost/test_tarot

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: 安裝依賴
        run: npm ci

      - name: 安裝 Playwright
        run: npx playwright install --with-deps

      - name: 執行 E2E 測試
        run: npm run test:e2e

      - name: 上傳測試結果
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 測試最佳實踐

### 1. 測試命名規範
- 描述性命名：`test_should_create_reading_when_valid_data_provided`
- 使用 Given-When-Then 格式
- 測試檔案對應功能模組

### 2. 測試資料管理
- 使用 Factory 模式建立測試資料
- 每個測試都清理資料
- 避免測試間的相依性

### 3. Mock 和 Stub 策略
- 外部服務使用 Mock
- 資料庫操作使用真實資料庫
- 時間相關功能使用 Mock

### 4. 測試維護
- 定期檢查測試覆蓋率
- 移除過時的測試
- 重構測試程式碼

---

*此測試策略將確保應用程式的高品質和可靠性*