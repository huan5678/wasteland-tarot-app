# 廢土塔羅設計系統 (Wasteland Tarot Design System)

## 🎨 品牌識別

### 核心理念
後末日復古未來主義 - 結合80年代像素藝術風格與核戰後的黑色幽默，打造獨特的廢土占卜體驗

### 設計原則
1. **復古科幻感**: 運用Pip-Boy綠色和避難所深色調營造後末日氛圍
2. **黑色幽默**: 在絕望中保持樂觀的Vault-Tec企業風格
3. **像素藝術美學**: 80年代遊戲風格的視覺呈現
4. **直覺操作**: 保持終端機式的簡潔界面，不讓裝飾干擾功能
5. **響應式**: 適配各種裝置，特別重視行動端體驗
6. **無障礙**: 確保所有廢土居民都能輕鬆使用

## 🌈 廢土色彩系統

### 主要色彩 (Pip-Boy 調色盤)
```css
:root {
  /* Pip-Boy 綠色系 - 主要介面色彩 */
  --color-pipboy-50: #f0fff4;
  --color-pipboy-100: #dcfce7;
  --color-pipboy-200: #bbf7d0;
  --color-pipboy-300: #86efac;
  --color-pipboy-400: #4ade80;
  --color-pipboy-500: #00FF41;  /* Pip-Boy 主綠色 */
  --color-pipboy-600: #16a34a;
  --color-pipboy-700: #15803d;
  --color-pipboy-800: #166534;
  --color-pipboy-900: #14532d;

  /* 瓶蓋金色系 - 重點與互動元素 */
  --color-caps-50: #fffbeb;
  --color-caps-100: #fef3c7;
  --color-caps-200: #fde68a;
  --color-caps-300: #fcd34d;
  --color-caps-400: #fbbf24;
  --color-caps-500: #FFD700;   /* 黃金瓶蓋色 */
  --color-caps-600: #d97706;
  --color-caps-700: #b45309;
  --color-caps-800: #92400e;
  --color-caps-900: #78350f;

  /* 避難所深色系 - 背景與結構 */
  --color-vault-50: #f8fafc;
  --color-vault-100: #f1f5f9;
  --color-vault-200: #e2e8f0;
  --color-vault-300: #94a3b8;
  --color-vault-400: #64748b;
  --color-vault-500: #475569;
  --color-vault-600: #334155;
  --color-vault-700: #1e293b;
  --color-vault-800: #0f172a;
  --color-vault-900: #1a1a1a;  /* 避難所深色 */

  /* 輻射橘色系 - 警告與能量 */
  --color-radiation-50: #fff7ed;
  --color-radiation-100: #ffedd5;
  --color-radiation-200: #fed7aa;
  --color-radiation-300: #fdba74;
  --color-radiation-400: #fb923c;
  --color-radiation-500: #FF6B35; /* 輻射橘色 */
  --color-radiation-600: #ea580c;
  --color-radiation-700: #c2410c;
  --color-radiation-800: #9a3412;
  --color-radiation-900: #7c2d12;
}
```

### 廢土語義化色彩
```css
:root {
  /* 廢土狀態色彩 */
  --color-success: var(--color-pipboy-500);    /* Pip-Boy 成功綠 */
  --color-warning: var(--color-caps-500);      /* 瓶蓋警告金 */
  --color-error: #FF0000;                      /* 危險紅色 */
  --color-info: var(--color-radiation-500);    /* 輻射資訊橘 */
  --color-neutral: var(--color-vault-400);     /* 避難所中性灰 */

  /* 特殊效果色彩 */
  --color-scan-line: rgba(0, 255, 65, 0.3);   /* 掃描線效果 */
  --color-static: rgba(255, 255, 255, 0.1);   /* 靜電雜訊 */
  --color-glow: rgba(255, 215, 0, 0.6);       /* 光暈效果 */
  --color-shadow: rgba(0, 0, 0, 0.8);         /* 深度陰影 */
}
```

## ✍️ 廢土字體系統

### 復古科幻字體族
```css
:root {
  /* 終端機主字體 - Pip-Boy 風格 */
  --font-terminal: 'Share Tech Mono', 'Courier New', monospace;

  /* 科幻標題字體 - 未來主義風格 */
  --font-heading: 'Orbitron', 'Share Tech Mono', sans-serif;

  /* 內文字體 - 復古等寬易讀 */
  --font-body: 'Share Tech Mono', 'Courier New', monospace;

  /* 裝飾字體 - 特殊用途 */
  --font-display: 'Orbitron', sans-serif;

  /* 備用字體 - 系統降級 */
  --font-fallback: 'Courier New', 'Noto Sans Mono TC', monospace;
}
```

### 字體載入最佳化
```css
/* Google Fonts 預載入 */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

/* 字體顯示策略 */
.font-terminal {
  font-family: var(--font-terminal);
  font-display: swap;
}

.font-heading {
  font-family: var(--font-heading);
  font-display: swap;
  font-weight: 700;
}
```

### 廢土字體大小階層
```css
:root {
  /* 終端機字體尺寸 - 像素完美對齊 */
  --text-xs: 0.75rem;     /* 12px - 狀態列文字 */
  --text-sm: 0.875rem;    /* 14px - 輔助資訊 */
  --text-base: 1rem;      /* 16px - 主要內文 */
  --text-lg: 1.125rem;    /* 18px - 按鈕文字 */
  --text-xl: 1.25rem;     /* 20px - 小標題 */
  --text-2xl: 1.5rem;     /* 24px - 卡片標題 */
  --text-3xl: 1.875rem;   /* 30px - 區段標題 */
  --text-4xl: 2.25rem;    /* 36px - 主標題 */
  --text-5xl: 3rem;       /* 48px - 巨大標題 */

  /* 特殊用途尺寸 */
  --text-terminal: 0.875rem;  /* 終端機文字 */
  --text-pipboy: 1rem;        /* Pip-Boy 介面 */
  --text-vault: 1.125rem;     /* 避難所標示 */
}

/* 字體粗細變化 */
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --font-weight-black: 900;  /* 重要警告用 */
}
```

## 📏 間距系統

### 基礎間距
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}
```

## 🔘 組件規範

### 按鈕
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'mystical';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}
```

#### 廢土按鈕變體
- **Primary**: 主要操作 (Pip-Boy 綠色背景)
- **Secondary**: 次要操作 (避難所灰色背景)
- **Outline**: 邊框按鈕 (終端機風格邊框)
- **Ghost**: 透明按鈕 (無背景，僅文字)
- **Terminal**: 終端機按鈕 (單色綠底黑字)
- **Vault**: 避難所按鈕 (金屬質感，瓶蓋金色)
- **Danger**: 危險按鈕 (輻射紅色，警告用途)
- **Radiation**: 輻射按鈕 (橘色漸變，能量感)

### 廢土卡片組件
```typescript
interface WastelandCardProps {
  variant: 'default' | 'tarot' | 'terminal' | 'vault-door' | 'pip-boy';
  elevated?: boolean;
  interactive?: boolean;
  glowing?: boolean;        // 輻射光暈特效
  scanLines?: boolean;      // 掃描線效果
  distortion?: boolean;     // CRT 扭曲效果
  pixelated?: boolean;      // 像素化邊框
  faction?: 'brotherhood' | 'ncr' | 'vault-tec' | 'raiders'; // 派系主題
}
```

### Pip-Boy 風格界面組件
```typescript
// 主要 Pip-Boy 界面
interface PipBoyInterfaceProps {
  sections: PipBoySection[];
  activeSection: string;
  greenTint?: boolean;
  scanEffect?: boolean;
  radiationLevel?: number;  // 0-1000
  batteryLevel?: number;    // 0-100
}

// Pip-Boy 選單項目
interface PipBoyMenuItemProps {
  label: string;
  value: string;
  icon?: PipBoyIcon;
  selected?: boolean;
  disabled?: boolean;
  statValue?: number;       // 顯示統計數據
}

// Pip-Boy 數據顯示
interface PipBoyDataDisplayProps {
  title: string;
  data: Record<string, string | number>;
  format: 'stats' | 'inventory' | 'map' | 'radio';
  scrollable?: boolean;
}
```

### 避難所終端機組件
```typescript
// 主終端機界面
interface VaultTerminalProps {
  lines: TerminalLine[];
  typewriterEffect?: boolean;
  staticNoise?: boolean;
  accessLevel: 'guest' | 'resident' | 'overseer';
  terminalId?: string;
  hackingMode?: boolean;
}

// 終端機命令行
interface TerminalCommandLineProps {
  prompt: string;
  command?: string;
  processing?: boolean;
  onCommand: (cmd: string) => void;
  allowedCommands?: string[];
}

// Holotape 播放器
interface HolotapePlayerProps {
  tapeTitle: string;
  content: HolotapeContent;
  autoPlay?: boolean;
  showTranscript?: boolean;
}
```

### 廢土塔羅牌組件
```typescript
// 主要塔羅牌
interface WastelandTarotCardProps {
  suit: 'nuka-cola' | 'combat-weapons' | 'bottle-caps' | 'radiation-rods';
  rank: string;
  revealed?: boolean;
  pixelArt?: boolean;
  vaultDoorAnimation?: boolean;
  factionTheme?: FactionTheme;
  radiationGlow?: boolean;
}

// 牌陣佈局
interface TarotSpreadLayoutProps {
  spreadType: 'single' | 'vault-tec' | 'wasteland-survival' | 'brotherhood-council';
  cards: WastelandTarotCard[];
  positions: SpreadPosition[];
  backgroundTheme?: 'wasteland' | 'vault' | 'brotherhood' | 'ncr';
}

// 牌陣位置
interface SpreadPosition {
  id: string;
  label: string;
  x: number;
  y: number;
  description?: string;
  factionContext?: string;
}
```

### 廢土表單元素
- **終端機輸入框**: 深色背景，Pip-Boy 綠色邊框焦點，等寬字體
- **Pip-Boy 選擇器**: 下拉選單配合綠色主題，掃描線效果
- **避難所開關**: 金屬質感切換按鈕，瓶蓋金色指示
- **輻射滑桿**: 橘色漸變，蓋革計數器式回饋
- **復古核取框**: 像素化設計，CRT 螢幕風格
- **密碼輸入**: 終端機風格，字元逐一顯示效果

## ✨ 動畫與過渡

### 基礎動畫
```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;

  --easing-linear: linear;
  --easing-ease: ease;
  --easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 廢土塔羅牌特效與音響系統
- **避難所門動畫**: 模擬避難所門緩慢開啟的卡片翻轉 + 機械齒輪聲
- **Pip-Boy 掃描**: 綠色掃描線從上到下掃過卡片 + 電子掃描音
- **輻射光暈**: 被選中卡片的放射性光暈效果 + 能量充電聲
- **像素化浮現**: hover 時卡片邊緣像素化發光 + 微弱電流聲
- **靜電干擾**: 卡片切換時的 CRT 靜電效果 + 無線電雜音
- **終端機載入**: 卡片資訊逐字顯示的打字機效果 + 鍵盤敲擊聲
- **蓋革計數器**: 選牌時的計數器音效同步視覺脈衝 + 經典咔咔聲
- **廢土塵埃**: 背景微粒飄散效果 + 輕微風聲
- **警報系統**: 危險卡片的紅色閃爍 + Vault-Tec 警報音
- **成功確認**: 完成動作的綠色脈衝 + 系統確認嗶聲

## 🔊 廢土音響設計系統

### 核心音效資源庫
```typescript
interface WastelandAudioSystem {
  // Pip-Boy 系統音效
  pipboy: {
    startup: string;           // Pip-Boy 開機音
    menuSelect: string;        // 選單選擇音
    menuConfirm: string;       // 確認操作音
    dataAccess: string;        // 資料存取音
    error: string;             // 錯誤提示音
    shutdown: string;          // 關機音效
  };

  // 終端機音效
  terminal: {
    typewriter: string;        // 打字機效果
    commandExecute: string;    // 命令執行音
    accessGranted: string;     // 存取許可音
    accessDenied: string;      // 拒絕存取音
    dataCorruption: string;    // 資料損毀音
    staticNoise: string;       // 靜電雜音
  };

  // 輻射與生存音效
  radiation: {
    geigerCounter: string;     // 蓋革計數器
    geigerCounterFast: string; // 高輻射警告
    radiationWarning: string;  // 輻射警告音
    energyCharge: string;      // 能量充電音
    powerDown: string;         // 能量耗盡音
  };

  // 避難所音效
  vault: {
    doorOpening: string;       // 避難所門開啟
    doorClosing: string;       // 避難所門關閉
    mechanicalWhir: string;    // 機械運轉聲
    airLock: string;           // 氣閘密封音
    emergencyAlarm: string;    // 緊急警報
    allClear: string;          // 解除警報音
  };

  // 環境音效
  ambient: {
    wastelandWind: string;     // 廢土風聲
    distantStorm: string;      // 遠方風暴
    settlementNoise: string;   // 聚落背景音
    radioStatic: string;       // 收音機雜音
    vaultAmbient: string;      // 避難所環境音
  };
}
```

### 音效觸發規則
```typescript
interface AudioTriggerEvents {
  // 界面互動音效
  onHover: 'pipboy.menuSelect';
  onClick: 'pipboy.menuConfirm';
  onError: 'pipboy.error';

  // 占卜流程音效
  onShuffleStart: ['radiation.geigerCounter', 'ambient.radioStatic'];
  onCardSelect: 'radiation.energyCharge';
  onCardReveal: ['vault.doorOpening', 'vault.mechanicalWhir'];
  onInterpretationStart: 'terminal.typewriter';
  onInterpretationComplete: 'vault.allClear';

  // 背景環境音
  ambientLoop: {
    vault: 'ambient.vaultAmbient';
    wasteland: ['ambient.wastelandWind', 'ambient.distantStorm'];
    settlement: 'ambient.settlementNoise';
  };
}
```

### 音效設計原則
1. **沉浸感優先**: 所有音效必須符合 Fallout 世界觀
2. **可控制性**: 用戶可分別調整音效、環境音、語音音量
3. **可關閉性**: 考量無障礙需求，所有音效可完全關閉
4. **回饋明確**: 每個互動都有對應的音響回饋
5. **不干擾**: 音效不應影響解讀內容的可讀性
6. **漸層設計**: 音效強度根據重要程度分級

## 🎯 廢土無障礙設計

### 復古界面對比度
- Pip-Boy 綠色文字對深色背景對比度 ≥ 7:1
- 瓶蓋金色重點元素對比度 ≥ 4.5:1
- 輻射橘色警告文字對比度 ≥ 7:1
- 提供高對比度模式（純綠底黑字）

### 終端機鍵盤導航
- 所有互動元素支援 Tab 鍵導航（模擬終端機操作）
- Pip-Boy 風格的焦點指示器（綠色發光邊框）
- 按鍵音效回饋（可關閉）
- 支援方向鍵導航選牌

### 廢土螢幕閱讀器支援
- 語義化 HTML 標籤配合廢土主題描述
- ARIA 標籤使用廢土術語（如 "pip-boy-menu", "vault-terminal"）
- 塔羅牌替代文字包含像素藝術描述
- 音效提示的文字替代說明

### 運動敏感性考量
- 可關閉掃描線和閃爍效果
- 減少 CRT 扭曲動畫的選項
- 靜止版本的像素藝術替代
- 漸進增強的動畫設計

## 📱 響應式設計

### 斷點系統
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### 行動端優化
- 觸控友善的按鈕大小 (最小 44px)
- 適合拇指操作的導航位置
- 簡化的行動端介面

## 🌟 廢土塔羅專屬設計

### 像素藝術卡片視覺
- 像素化圓角（8px grid）營造復古遊戲感
- 深度陰影模擬 CRT 螢幕厚度
- 背面統一 Vault-Tec 標誌設計
- 正面 80 年代像素藝術風格塔羅牌圖像
- 沉穆土色調配以戰略性亮色
- 黑色幽默與諷刺視覺元素

### 廢土占卜介面系統
- **Pip-Boy 卡陣展示**: 綠色單色顯示器風格排列
- **終端機選牌區**: 命令行式的卡片選擇界面
- **避難所解讀展示**: 逐字顯示的解讀結果
- **Holotape 歷史**: 以 holotape 形式保存占卜記錄
- **派系選擇器**: 不同派系角色的解讀風格選擇
- **Karma 追蹤器**: 根據選擇調整界面色調

### 特殊廢土元素
- **輻射計數器**: 隨機性指示器
- **避難所門**: 卡片翻轉動畫
- **廢土地圖**: 牌陣佈局背景
- **Vault Boy**: 狀態指示插圖
- **核電池**: 載入進度指示器

---

---

## 🎮 開發實作注意事項

### CSS 變數使用
所有顏色和字體都應使用 CSS 變數，方便主題切換和維護。

### 動畫效能
像素藝術和 CRT 效果應使用 CSS transforms 和 GPU 加速，避免影響效能。

### 響應式設計
確保復古界面在各種裝置上都能保持 80 年代美學的一致性。

### 音效整合
視覺效果應與音效系統緊密配合，提供完整的沉浸式體驗。

---

*此廢土設計系統為活文件，會隨著廢土探索持續演進和更新*