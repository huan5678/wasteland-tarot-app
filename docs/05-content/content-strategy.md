# 內容策略與文案規範

## 🎯 品牌語調定位

### 核心語調
- **神秘而親近**: 保持塔羅牌的神秘感，但不讓用戶感到距離感
- **智慧引導**: 提供洞察而非絕對預測，強調自我反思
- **溫暖支持**: 在用戶困惑時給予溫暖的指引和鼓勵

### 語言風格
- **簡潔明瞭**: 避免過於複雜的術語
- **正向積極**: 即使面對挑戰也以成長角度引導
- **包容多元**: 尊重不同文化背景和信仰

## 📝 文案類型與規範

### 介面文案 (UI Copy)

#### 按鈕文案
```typescript
// 主要動作按鈕
const primaryActions = {
  start: "開始占卜",
  draw: "抽取卡片",
  reveal: "揭示答案",
  save: "保存解讀",
  share: "分享洞察"
}

// 次要動作按鈕
const secondaryActions = {
  cancel: "稍後再試",
  skip: "跳過",
  back: "返回",
  retry: "重新開始"
}
```

#### 狀態提示文案
```typescript
const statusMessages = {
  loading: {
    shuffling: "正在洗牌，靜心等待...",
    interpreting: "智慧正在匯聚，為你解讀...",
    saving: "將你的洞察珍藏..."
  },
  success: {
    saved: "你的占卜已安全保存",
    shared: "洞察已分享給朋友"
  },
  error: {
    network: "連接似乎遇到了阻礙，請稍後再試",
    invalid: "請重新檢查輸入的內容"
  }
}
```

### 占卜相關文案

#### 問題引導
```markdown
# 愛情關係
- "關於這段感情，你最想了解什麼？"
- "你希望在愛情中獲得怎樣的指引？"

# 事業發展
- "在職涯道路上，什麼讓你感到困惑？"
- "你想探索哪個面向的事業發展？"

# 個人成長
- "在自我成長的路上，你希望獲得什麼啟發？"
- "什麼樣的內在變化是你期待的？"
```

#### 解讀框架
```markdown
# 基礎解讀結構
1. **當前狀況**: 卡片反映的現況
2. **潛在影響**: 可能的發展方向
3. **行動建議**: 具體可行的建議
4. **深層洞察**: 更深層的靈性指引
```

## 🔮 塔羅牌內容規範

### 卡牌描述格式
```typescript
interface TarotCardContent {
  name: string;           // 牌名
  keywords: string[];     // 關鍵詞
  upright: {
    meaning: string;      // 正位含義
    love: string;         // 愛情解讀
    career: string;       // 事業解讀
    personal: string;     // 個人成長
  };
  reversed: {
    meaning: string;      // 逆位含義
    love: string;
    career: string;
    personal: string;
  };
  symbolism: string;      // 象徵意義
  advice: string;         // 行動建議
}
```

### 解讀範本
```markdown
# 單張牌解讀範本
{card_name} 在你的問題中出現，帶來了 {primary_message}。

**當前狀況**: {current_situation}

**指引方向**: {guidance_direction}

**行動建議**: {actionable_advice}

**深層洞察**: {deeper_insight}

記住，塔羅牌是一面鏡子，反映的是你內心的智慧。
```

## 🌟 個人化內容

### 用戶稱呼
- 新用戶: "探索者"
- 回訪用戶: "朋友"
- 活躍用戶: "智慧的尋求者"

### 歷程化文案
```typescript
const journeyMessages = {
  firstReading: "歡迎開始你的塔羅之旅",
  milestone10: "十次探索，你正在深化與內在的連結",
  milestone50: "五十次洞察，你已是經驗豐富的探索者",
  returning: "歡迎回來，又有什麼想要探索的嗎？"
}
```

## 📱 多平台適配

### 手機端簡化文案
- 精簡至核心訊息
- 避免過長句子
- 重要資訊前置

### 電腦端完整文案
- 提供詳細解釋
- 包含延伸思考
- 支援更多互動元素

## 🎨 視覺與文案配合

### 文案層級
```css
/* 主標題 - 大而顯眼 */
.title-primary {
  font-size: 2.5rem;
  font-family: 'Cinzel';
  color: var(--color-primary-500);
}

/* 副標題 - 中等醒目 */
.title-secondary {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-accent-400);
}

/* 內文 - 易讀舒適 */
.body-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-surface-100);
}
```

### 情境文案
- **深夜模式**: 使用較溫和的語調
- **白天模式**: 可以更加活潑正向
- **專注模式**: 簡潔直接的指引

## 🌍 多語言考量

### 繁體中文 (主要)
- 使用台灣常用詞彙
- 避免過於文言的表達
- 保持親切自然的語調

### 英文版本規劃
- 保持神秘感但易理解
- 考慮文化差異調整表達
- 專業術語一致性

## 📊 內容效果追蹤

### 關鍵指標
- 用戶完成占卜率
- 解讀內容分享率
- 用戶回訪頻率
- 內容滿意度評分

### A/B 測試內容
- 不同的問題引導文案
- 解讀結構的效果比較
- 個人化程度的影響

## ✅ 內容檢核清單

### 發布前檢查
- [ ] 語調符合品牌定位
- [ ] 內容準確性確認
- [ ] 文案長度適當
- [ ] 多裝置顯示測試
- [ ] 無障礙性檢查
- [ ] 敏感內容審查

### 定期更新
- [ ] 用戶回饋收集
- [ ] 內容效果分析
- [ ] 季節性內容調整
- [ ] 新功能文案更新

---

*內容策略將根據用戶回饋和數據分析持續優化*