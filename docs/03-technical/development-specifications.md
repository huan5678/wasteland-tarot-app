# 廢土塔羅系統開發規格

## 📋 專案概述

基於 Fallout 後末日主題的塔羅牌解讀系統，本文件定義廢土塔羅應用的功能需求和驗收標準。系統融合經典塔羅智慧與 Fallout 宇宙的幽默與深度，提供沉浸式的後末日占卜體驗。

## 🎯 核心功能模組

### 1. 廢土居民管理模組 (Wasteland Dweller Management)

#### 1.1 避難所居民註冊 (DWELLER-001)
**功能描述**: 新的廢土居民可以建立帳號並設定個人檔案

**驗收條件**:
```gherkin
Given 新居民在 Vault-Tec 註冊終端
When 居民輸入有效的聯絡方式和密碼
And 選擇起始 Karma 傾向 (Good/Neutral/Evil)
And 選擇偏好的廢土角色聲音
And 選擇所屬派系親和度 (Brotherhood, NCR, Caesar's Legion, Raiders, Vault Dweller)
And 確認避難所使用協議
Then 系統創建居民檔案
And 分配初始經驗值和等級
And 設定輻射抗性等級
And 顯示 Pip-Boy 風格的歡迎訊息 + 開機音效
And 居民狀態設為 "Active Wastelander"
And 播放 Vault 門開啟音效表示歡迎
```

**功能需求**:
- 支援 Karma 系統初始設定 (影響解讀傾向)
- 角色聲音偏好選擇 (4種解讀風格)
- 派系對齊系統 (5個主要派系)
- Pip-Boy 風格介面 (綠色單色顯示器)
- 廢土主題驗證流程
- 音效系統整合 (Pip-Boy 音效、Vault 門音效)

#### 1.2 廢土終端存取 (DWELLER-002)
**功能描述**: 廢土居民可以透過終端介面存取系統

**驗收條件**:
```gherkin
Given 居民已完成避難所註冊
When 居民在終端輸入正確的認證資訊
And 選擇進入廢土塔羅系統
Then 系統顯示 Pip-Boy 風格載入畫面
And 播放廢土主題音效
And 居民被導向到主要控制台
And 顯示當前 Karma 狀態和角色偏好
```

### 2. 廢土塔羅系統模組 (Wasteland Tarot System)

#### 2.1 廢土卡牌資料管理 (WASTELAND-001)
**功能描述**: 系統管理78張廢土主題塔羅牌的完整資料

**驗收條件**:
```gherkin
Given 廢土塔羅系統啟動
When 載入卡牌資料庫
Then 系統包含完整的78張廢土主題卡牌
And 包含四個廢土花色：
  | 花色 | 原始花色 | 元素 | 代表意義 |
  | 可樂瓶 (Nuka-Cola Bottles) | 聖杯 (Cups) | 水 | 情感、關係、輻射治療、社群連結 |
  | 戰鬥武器 (Combat Weapons) | 寶劍 (Swords) | 風 | 衝突、策略、決策、生存智慧 |
  | 瓶蓋 (Bottle Caps) | 錢幣 (Pentacles) | 土 | 資源、交易、生存物資、實用主義 |
  | 輻射棒 (Radiation Rods) | 權杖 (Wands) | 火 | 能量、創造力、變異、行動力 |
And 大阿爾克那22張重新設計為廢土角色：
  | 編號 | 原始名稱 | 廢土名稱 | 描述 |
  | 0 | 愚者 | 新手避難所居民 (The Vault Newbie) | 剛走出避難所，對廢土充滿天真幻想 |
  | 1 | 魔術師 | 科技專家 (The Tech Specialist) | 掌握先進科技的廢土科學家 |
  | 2 | 女祭司 | 神秘預言家 (The Wasteland Oracle) | 擁有預知能力的神秘廢土居民 |
  | 3 | 皇后 | 農場主母 (The Farm Matriarch) | 在廢土中建立繁榮農場的女性領袖 |
  | 4 | 皇帝 | 避難所監督 (The Overseer) | 掌控避難所秩序的威權領袖 |
  | 5 | 教宗 | 兄弟會長老 (The Brotherhood Elder) | 鋼鐵兄弟會的知識守護者 |
And 每張牌包含正位和逆位的廢土主題解釋
And 每張牌具有80年代像素藝術風格圖片
And 每張牌包含 Fallout 黑色幽默元素和背景故事
And 卡牌具有輻射等級屬性影響抽牌隨機性
And 小阿爾克那56張包含廢土日常生活情境
And 宮廷牌重新命名：新兵(Page)、廢土騎士(Knight)、聚落領袖(Queen)、廢土霸主(King)
```

#### 2.2 廢土洗牌演算法 (WASTELAND-002)
**功能描述**: 實現融合輻射隨機性的廢土風格抽牌機制

**驗收條件**:
```gherkin
Given 廢土居民開始新的占卜
When 居民選擇廢土牌陣類型：
  | 牌陣名稱 | 英文名稱 | 卡牌數量 | 適用情境 |
  | 單張廢土指引 | Single Wasteland Reading | 1 | 今日廢土運勢、生存決策指引 |
  | 避難所科技三牌陣 | Vault-Tec Spread | 3 | 戰前-當前-重建時間線分析 |
  | 廢土生存五牌陣 | Wasteland Survival Spread | 5 | 資源、威脅、盟友、策略、結果 |
  | 兄弟會議會 | Brotherhood Council | 7 | 圓形議會桌佈局，全面決策過程 |
And 觸發蓋革計數器風格的洗牌動畫 + 計數器音效
Then 系統使用改良版Fisher-Yates + 輻射隨機性演算法
And 每張牌的輻射等級影響被選中機率
And 牌位方向受居民 Karma 傾向影響 (Good趨向正位, Evil趨向逆位)
And 播放避難所門開啟音效 + 機械運轉聲
And 確保同次占卜無重複卡牌
And 顯示 Pip-Boy 風格的抽牌進度條 + 掃描線效果
And 抽牌過程模擬廢土隨機遭遇機制
```

### 3. 廢土角色解讀引擎 (Wasteland Character Interpretation Engine)

#### 3.1 角色聲音選擇系統 (CHARACTER-001)
**功能描述**: 廢土居民可以選擇不同角色的解讀風格和聲音

**驗收條件**:
```gherkin
Given 廢土居民進入解讀設定
When 居民查看可用角色聲音選項
Then 系統顯示以下核心角色選項：
  | 角色類型 | 解讀風格 | 特色描述 | 語調特徵 |
  | Pip-Boy數據分析法 | 系統化分析 | 綠色單色螢幕風格，掃描卡牌基本數據 | 機械式、科學化、數據導向 |
  | 避難所居民視角法 | 天真樂觀 | 戰前常識理解戰後情況，不當樂觀 | 單純、好奇、誤解現實 |
  | 廢土商人智慧法 | 精明實用 | 資源價值評估，風險收益分析 | 狡猾、可靠、商業導向 |
  | 超級變種人簡化法 | 直接粗暴 | 語言簡單但邏輯清晰，意外精準 | 粗糙、直接、智慧藏拙 |
And 派系專屬解讀風格：
  | 派系角色 | 解讀傾向 | 特殊功能 |
  | 兄弟會長老 | 科技導向理性分析 | 引用技術手冊和傳統教誨 |
  | NCR 共和國代表 | 民主投票式多角度 | 平衡各方利益的建議 |
  | 凱撒軍團智者 | 專制但高效決策 | 強調紀律和效率 |
  | 掠奪者頭目 | 混亂創意解決方案 | 非傳統但有效的建議 |
And 夥伴見解系統：
  | 夥伴角色 | 解讀特色 | 個性化回應 |
  | Dogmeat | 忠誠可靠的簡單建議 | 用肢體語言和行為表達 |
  | Nick Valentine | 偵探式邏輯推理 | 結合案例分析解讀 |
  | Piper | 記者式深度分析 | 追根究底的調查視角 |
  | Codsworth | 英式管家禮貌建議 | 正式但關懷的語調 |
  | Strong | 超級變種人直率觀點 | 簡化但深刻的人生哲理 |
And 每個角色包含獨特的語調、用詞風格和 Fallout 幽默元素
And 角色選擇影響解讀的詞彙、語調和建議方向
```

#### 3.2 Karma 系統影響解讀 (CHARACTER-002)
**功能描述**: 居民的 Karma 傾向影響角色解讀的語調和建議方向

**驗收條件**:
```gherkin
Given 廢土居民具有特定 Karma 等級
When 系統生成角色解讀
Then Good Karma 居民獲得正面積極的解讀傾向
And Neutral Karma 居民獲得平衡客觀的分析
And Evil Karma 居民獲得現實主義的嚴酷解讀
And 解讀內容自動調整樂觀度和實用性建議
And 系統根據居民選擇動態調整 Karma 傾向
```

#### 3.3 廢土問題處理引擎 (QUESTION-001)
**功能描述**: 系統根據廢土問題類別提供專門的解讀架構和建議模板

**驗收條件**:
```gherkin
Given 廢土居民輸入占卜問題
When 系統分析問題內容
Then 系統自動分類為以下廢土問題類別：
  | 問題類別 | 英文類別 | 典型問題範例 | 解讀重點 |
  | 生存決策 | Survival Decisions | 我應該探索這個廢墟嗎？ | 風險評估、資源需求 |
  | 資源管理 | Resource Management | 我的聚落需要什麼資源？ | 優先順序、交易策略 |
  | 人際關係 | Wasteland Relationships | 這個商人值得信任嗎？ | 信任評估、合作機會 |
  | 探索冒險 | Exploration Adventures | 前往新地區的時機對嗎？ | 準備程度、危險指數 |
  | 重建規劃 | Rebuilding Plans | 如何重建這片廢土？ | 長期規劃、社群建設 |
And 系統提供問題模板：
  | 模板類型 | 模板內容 | 適用角色 |
  | 避難所居民 | "根據避難所生存手冊..." | Vault Dweller |
  | 廢土智慧 | "廢土智慧告訴我們..." | Wasteland Trader |
  | Pip-Boy分析 | "Pip-Boy建議..." | Tech Specialist |
  | 科技分析 | "避難所科技分析顯示..." | Brotherhood Elder |
And 根據問題類別調整卡牌權重和解讀焦點
```

#### 3.4 特殊廢土事件系統 (SPECIAL-EVENTS-001)
**功能描述**: 系統支援特殊廢土事件期間的主題解讀

**驗收條件**:
```gherkin
Given 廢土發生特殊事件
When 居民進行占卜
Then 系統根據事件類型調整解讀風格：
  | 事件類型 | 解讀調整 | 特殊效果 | 音效變化 |
  | 輻射風暴解讀 | 強調保護和避險 | 紅色警示界面 | 蓋革計數器快速響應 |
  | 戰前節日主題 | 懷舊樂觀解讀 | 復古色調濾鏡 | 戰前音樂元素 |
  | 派系衝突期間 | 戰略分析導向 | 軍用界面風格 | 戰術通訊音效 |
  | 新聚落建設 | 建設規劃指導 | 建築藍圖背景 | 建設工具音效 |
And 事件期間顯示相關的廢土背景資訊
And 解讀內容包含事件相關的生存建議
And 特殊事件影響卡牌出現機率
```

### 4. 廢土占卜記錄模組 (Wasteland Reading Archive)

#### 4.1 Holotape 記錄保存 (ARCHIVE-001)
**功能描述**: 以 Holotape 風格保存廢土居民的占卜記錄

**驗收條件**:
```gherkin
Given 廢土居民完成一次占卜
When 選擇保存到個人 Holotape 檔案
Then 系統以 Holotape 格式保存完整占卜資料
And 包含問題類別（生存決策、資源管理、人際關係、探索冒險、重建規劃）
And 包含使用的廢土牌陣類型和卡牌組合
And 包含角色解讀聲音和 Karma 影響
And 包含廢土主題的解讀內容和建議
And 居民可以在終端檔案系統中查看和回放
```

#### 4.2 廢土檔案檢索 (ARCHIVE-002)
**功能描述**: 廢土居民可以透過終端介面搜尋和篩選歷史占卜記錄

**驗收條件**:
```gherkin
Given 廢土居民有多筆 Holotape 記錄
When 居民在終端檔案系統中進行搜尋
Then 可以按廢土時間範圍篩選（戰前、戰後年數）
And 可以按問題類別篩選（生存、資源、關係、探索、重建）
And 可以按使用的角色聲音篩選
And 可以按 Karma 等級變化篩選
And 可以按卡牌花色篩選（可樂瓶、武器、瓶蓋、輻射棒）
And 支援 Pip-Boy 風格的分頁載入動畫
And 顯示輻射警告符號標示重要信息
```

## 🏗️ 技術架構規格

### 前端架構 (Frontend)

#### 組件層級結構
```
src/
├── components/
│   ├── ui/              # shadcn/ui 基礎組件
│   ├── tarot/           # 塔羅牌相關組件
│   ├── forms/           # 表單組件
│   └── layout/          # 版面組件
├── pages/               # Next.js 頁面
├── hooks/               # 自定義 hooks
├── stores/              # Zustand 狀態管理
├── services/            # API 服務
└── utils/               # 工具函數
```

#### 狀態管理規格
```typescript
// 全域狀態結構
interface AppState {
  user: UserState | null;
  currentReading: ReadingState | null;
  ui: UIState;
}

// 用戶狀態
interface UserState {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
}

// 占卜狀態
interface ReadingState {
  id: string;
  question: string;
  cards: TarotCard[];
  interpretation: string;
  createdAt: Date;
}
```

### 後端架構 (Backend)

#### API 端點規格
```python
# 用戶相關端點
POST /auth/register        # 用戶註冊
POST /auth/login          # 用戶登入
POST /auth/refresh        # 刷新 token
GET  /auth/me             # 獲取用戶資訊

# 塔羅牌相關端點
GET  /tarot/cards         # 獲取所有塔羅牌
POST /tarot/reading       # 創建新占卜
GET  /tarot/reading/{id}  # 獲取占卜詳情

# 歷史記錄端點
GET  /history             # 獲取用戶歷史
POST /history/{id}/note   # 添加個人筆記
DELETE /history/{id}      # 刪除記錄
```

#### 資料庫 Schema
```sql
-- 用戶表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 塔羅牌表
CREATE TABLE tarot_cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    suit VARCHAR(50),
    number INTEGER,
    meaning_upright TEXT,
    meaning_reversed TEXT,
    image_url VARCHAR(500),
    keywords TEXT[]
);

-- 占卜記錄表
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    question TEXT,
    cards_data JSONB,
    interpretation TEXT,
    ai_model VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 測試策略

### 前端測試

#### 1. 單元測試 (Jest + Testing Library)
```typescript
// 組件測試範例
describe('TarotCard Component', () => {
  it('應該正確顯示塔羅牌資訊', () => {
    const card = mockTarotCard;
    render(<TarotCard card={card} />);

    expect(screen.getByText(card.name)).toBeInTheDocument();
    expect(screen.getByAltText(`${card.name} 塔羅牌`)).toBeInTheDocument();
  });

  it('應該處理翻牌動畫', async () => {
    const card = mockTarotCard;
    render(<TarotCard card={card} isFlipping />);

    const cardElement = screen.getByTestId('tarot-card');
    expect(cardElement).toHaveClass('flipping');

    await waitFor(() => {
      expect(cardElement).not.toHaveClass('flipping');
    });
  });
});
```

#### 2. 整合測試 (API 整合)
```typescript
// API 整合測試
describe('Reading API Integration', () => {
  it('應該成功創建新占卜', async () => {
    const mockReading = {
      question: '我的愛情運勢如何？',
      spreadType: 'three-card'
    };

    const response = await createReading(mockReading);

    expect(response.data).toHaveProperty('id');
    expect(response.data.question).toBe(mockReading.question);
    expect(response.data.cards).toHaveLength(3);
  });
});
```

#### 3. E2E 測試 (Playwright)
```typescript
// 端到端測試
test('完整占卜流程', async ({ page }) => {
  // 登入
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=login-button]');

  // 開始占卜
  await page.click('[data-testid=start-reading]');
  await page.fill('[data-testid=question]', '我的事業發展如何？');
  await page.click('[data-testid=submit-question]');

  // 抽牌
  await page.click('[data-testid=draw-cards]');
  await page.waitForSelector('[data-testid=card-result]');

  // 驗證結果
  const interpretation = await page.textContent('[data-testid=interpretation]');
  expect(interpretation).toContain('事業');
});
```

### 後端測試

#### 1. 單元測試 (pytest)
```python
# 業務邏輯測試
def test_draw_random_cards():
    """測試隨機抽牌邏輯"""
    cards = draw_random_cards(count=3)

    assert len(cards) == 3
    assert len(set(card.id for card in cards)) == 3  # 無重複
    assert all(card.position in ['upright', 'reversed'] for card in cards)

def test_generate_interpretation():
    """測試解讀生成"""
    cards = [mock_card_1, mock_card_2, mock_card_3]
    question = "我的愛情運勢如何？"

    interpretation = generate_interpretation(cards, question)

    assert len(interpretation) > 100
    assert "愛情" in interpretation
```

#### 2. API 測試 (FastAPI TestClient)
```python
def test_create_reading(client, auth_headers):
    """測試創建占卜 API"""
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
```

#### 3. 整合測試 (資料庫 + 外部服務)
```python
def test_reading_with_ai_integration(client, db_session):
    """測試包含 AI 解讀的完整流程"""
    user = create_test_user(db_session)

    with patch('services.ai_service.generate_interpretation') as mock_ai:
        mock_ai.return_value = "這是一個測試解讀"

        response = client.post(
            "/tarot/reading",
            json={"question": "測試問題", "spread_type": "single"},
            headers=auth_headers_for_user(user)
        )

        assert response.status_code == 201
        assert mock_ai.called

        # 驗證資料庫記錄
        reading = db_session.query(Reading).filter_by(user_id=user.id).first()
        assert reading is not None
        assert reading.interpretation == "這是一個測試解讀"
```

## 📈 開發里程碑

### 第一階段：基礎架構 (週 1-2)
- [ ] 專案初始化和環境設定
- [ ] 資料庫 Schema 建立
- [ ] 基礎認證系統
- [ ] 設計系統組件庫

### 第二階段：核心功能 (週 3-5)
- [ ] 用戶註冊/登入流程
- [ ] 塔羅牌資料管理
- [ ] 基礎抽牌功能
- [ ] AI 解讀整合

### 第三階段：使用者體驗 (週 6-8)
- [ ] 抽牌動畫和互動
- [ ] 占卜歷史管理
- [ ] 響應式設計
- [ ] 效能最佳化

### 第四階段：進階功能 (週 9-12)
- [ ] 社群分享功能
- [ ] 個人化推薦
- [ ] 進階牌陣
- [ ] 監控和分析

## 🎯 品質保證

### 測試覆蓋率目標
- 單元測試: ≥ 90%
- 整合測試: ≥ 80%
- E2E 測試: 涵蓋所有關鍵流程

### 效能指標
- 首頁載入時間: < 2秒
- API 回應時間: < 500ms
- 抽牌動畫: 60fps
- 錯誤率: < 1%

### 程式碼品質
- TypeScript 嚴格模式
- ESLint + Prettier 格式化
- 程式碼審查必須
- 自動化部署檢查

---

*此規格文件將隨開發進展持續更新和細化*