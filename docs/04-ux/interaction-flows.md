# 廢土塔羅互動流程設計 (Wasteland Tarot Interaction Flows)

## 🎯 核心流程概述

本文件定義了廢土塔羅應用的主要使用者互動流程，確保一致的後末日生存占卜體驗。結合 Fallout 宇宙的世界觀，提供沉浸式的復古科幻互動設計。

## 🔮 廢土占卜流程 (Wasteland Divination Flow)

### 主要路徑
```
Pip-Boy 首頁 → 開始廢土占卜 → 選擇占卜方式 → 廢土洗牌 → 選牌 → 避難所門開啟 → 角色解讀 → Holotape 保存
```

### 占卜方式選擇
根據 fallout_tarot_algorithms.json 規格實作：

#### 1. 單張廢土指引 (Single Wasteland Reading)
- **用途**: 今日廢土運勢、生存決策指引
- **界面**: Pip-Boy 風格單卡顯示
- **特效**: 輻射計數器式運勢顯示

#### 2. 避難所科技三牌陣 (Vault-Tec Spread)
- **位置**: 戰前狀況 | 當前廢土 | 重建希望
- **風格**: Vault-Tec 企業樂觀語調
- **動畫**: 三張卡片依序從避難所門滑出

#### 3. 廢土生存五牌陣 (Wasteland Survival Spread)
- **位置**: 資源 | 威脅 | 盟友 | 策略 | 結果
- **界面**: 戰術地圖式佈局
- **複雜度**: 中等，適合重要決策

#### 4. 兄弟會議會 (Brotherhood Council)
- **位置**: 7 張卡片圓形議會桌佈局
- **角色**: 長老、騎士、書記、新兵等視角
- **複雜度**: 高，全面決策分析

### 詳細步驟

#### 1. 廢土占卜前準備
- **觸發點**: 居民點擊 Pip-Boy「占卜」功能
- **身份驗證**: 檢查避難所居民身份，未註冊則引導創建角色
- **問題類型設定** (基於 fallout_tarot_algorithms.json):
  - **生存決策**: "我應該探索這個廢墟嗎？"
  - **資源管理**: "我的聚落需要什麼資源？"
  - **人際關係**: "這個商人值得信任嗎？"
  - **探索冒險**: "前方的輻射區域安全嗎？"
  - **重建規劃**: "如何處理這個派系衝突？"
  - **自訂廢土問題**: 輸入個人化生存困境

#### 2. 廢土抽牌互動系統
```typescript
interface WastelandDrawingState {
  phase: 'geiger-shuffling' | 'terminal-selecting' | 'vault-revealing' | 'character-interpreting';
  selectedCards: WastelandTarotCard[];
  question: string;
  spreadType: 'single-wasteland' | 'vault-tec' | 'survival-spread' | 'brotherhood-council';
  radiationLevel: number;
  factionAlignment?: string;
}
```

- **蓋革計數器洗牌階段** (3-5秒):
  - 卡片背面隨機排列，配合蓋革計數器聲效
  - Pip-Boy 風格進度條顯示
  - 輻射等級影響隨機性
  - 視覺回饋: 綠色掃描線效果

- **終端機選牌階段**:
  - 根據牌陣類型顯示卡片網格
  - hover 效果: 輻射光暈邊框
  - 選中標記: 瓶蓋金色邊框
  - "EXECUTE SELECTION" 確認按鈕

- **避難所門揭示階段**:
  - 避難所門緩慢開啟動畫
  - 卡片依序滑出 (間隔 0.8秒)
  - 終端機確認音效
  - 靜電干擾過渡效果

#### 3. 角色解讀與結果展示
- **AI 角色解讀進行中**:
  - Loading 動畫: 核電池充電效果
  - Pip-Boy 風格進度提示
  - "ACCESSING WASTELAND DATABASE..." 狀態文字
  - 預估完成時間倒數

- **角色風格選擇** (基於 fallout_tarot_algorithms.json):
  - **Pip-Boy 數據分析法**: 系統化數據呈現
  - **避難所居民視角**: 天真但樂觀的解讀
  - **廢土商人智慧**: 精明實用的建議
  - **超級變種人簡化法**: 直接粗暴但精準
  - **兄弟會長老**: 知識權威的指導
  - **NCR 共和國**: 民主多角度分析

- **終端機風格結果展示**:
  - 卡片詳細資訊以終端機文字形式顯示
  - 解讀文字逐字打字機效果
  - Karma 系統評分 (Good/Neutral/Evil)
  - "SAVE TO HOLOTAPE" / "TRANSMIT TO SETTLEMENT" 選項

## 👤 用戶註冊登入流程

### 註冊流程
```
註冊頁面 → 輸入資訊 → 驗證 → 發送驗證信 → 信箱驗證 → 完成註冊 → 引導教學
```

#### 表單驗證
```typescript
interface RegistrationForm {
  email: string;      // 即時驗證格式
  password: string;   // 強度檢查
  confirmPassword: string; // 確認一致性
  acceptTerms: boolean;   // 必須勾選
}
```

### 登入流程
```
登入頁面 → 輸入帳密 → 驗證 → 登入成功 → 導向上次頁面/首頁
```

#### 錯誤處理
- 帳號不存在: 引導註冊
- 密碼錯誤: 顯示錯誤次數，提供重設密碼
- 多次失敗: 暫時鎖定，要求 CAPTCHA

## 📚 占卜歷史流程

### 歷史列表
```
個人首頁 → 占卜歷史 → 分頁載入 → 選擇查看 → 詳細結果
```

#### 列表功能
- **排序**: 按時間/評分/問題類型
- **篩選**: 日期範圍/問題類型/牌陣類型
- **搜尋**: 問題關鍵字搜尋
- **分頁**: 無限滾動載入

### 詳細檢視
- 重現當時的牌陣
- 完整解讀內容
- 個人筆記編輯
- 分享到社群

## 🎨 視覺狀態設計

### Loading 狀態
```typescript
interface LoadingState {
  type: 'shuffling' | 'drawing' | 'interpreting' | 'saving';
  message: string;
  progress?: number; // 0-100
  canCancel?: boolean;
}
```

### 錯誤狀態
```typescript
interface ErrorState {
  type: 'network' | 'validation' | 'server' | 'permission';
  message: string;
  actionButton?: {
    text: string;
    action: () => void;
  };
}
```

### 空狀態
- **無占卜歷史**: 引導進行第一次占卜
- **搜尋無結果**: 建議調整搜尋條件
- **網路問題**: 提供重試按鈕

## 📱 行動端特殊考量

### 觸控互動
- **滑動手勢**: 左右滑動瀏覽歷史
- **長按操作**: 長按卡片查看詳細資訊
- **縮放**: 雙指縮放查看卡片細節

### 畫面適配
- **直向模式**: 主要使用模式，垂直排列
- **橫向模式**: 適合查看牌陣，水平排列
- **全螢幕**: 占卜過程可進入全螢幕模式

## 🔄 狀態管理

### 全域狀態
```typescript
interface AppState {
  user: UserState | null;
  currentReading: ReadingState | null;
  history: ReadingHistory[];
  ui: UIState;
}
```

### 本地儲存
- 未完成的占卜草稿
- 使用者偏好設定
- 快取的歷史資料

## ⚡ 效能最佳化

### 懶載入
- 歷史列表圖片懶載入
- 路由層級的程式碼分割
- 大型組件的動態載入

### 快取策略
- API 回應快取 (React Query)
- 圖片快取 (Service Worker)
- 靜態資源 CDN

## 🧪 互動測試檢查點

### 關鍵流程測試
- [ ] 完整占卜流程 (新用戶)
- [ ] 登入後立即占卜
- [ ] 歷史查看與管理
- [ ] 錯誤情況恢復
- [ ] 行動端操作流暢度

### 效能指標
- 首次載入時間 < 3秒
- 抽牌動畫流暢 (60fps)
- API 回應時間 < 500ms
- 錯誤恢復時間 < 2秒

---

*此流程設計會隨著用戶回饋持續優化*