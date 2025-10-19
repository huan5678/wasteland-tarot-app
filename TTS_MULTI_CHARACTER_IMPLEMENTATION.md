# TTS 多角色音色系統實作總結

## 實作日期
2025-10-18

## 專案概述
針對廢土塔羅系統（Fallout Tarot）的文字轉語音（TTS）功能進行多角色音色擴展與智能語音選擇優化。

---

## 實作內容

### Phase 1: 短期優化（已完成）

#### 1. 擴展語音配置到 14 個角色 ✅

**檔案修改**: `src/lib/audio/types.ts`

**變更內容**:
- 將 `CharacterVoice` 類型從 5 個角色擴展至 14 個角色
- 新增角色分類註解（通用角色、廢土生物、鋼鐵兄弟會、NCR、凱薩軍團、Fallout 4 陣營）

**支援角色列表**:
1. **通用角色** (4 個)
   - `pip_boy` - Pip-Boy (中性音高，機械感)
   - `vault_dweller` - 避難所居民 (稍高音，年輕樂觀)
   - `wasteland_trader` - 廢土商人 (稍低音，成熟務實)
   - `codsworth` - Codsworth (較高音，機器人特徵)

2. **廢土生物與掠奪者** (3 個)
   - `super_mutant` - 超級變種人 (極低音，威嚇強大)
   - `ghoul` - 屍鬼 (低沉音，歷經滄桑)
   - `raider` - 掠奪者 (低音，粗暴)

3. **鋼鐵兄弟會** (2 個)
   - `brotherhood_scribe` - 兄弟會書記員 (稍高音，學術知性)
   - `brotherhood_paladin` - 兄弟會聖騎士 (低沉音，威嚴榮譽)

4. **其他陣營** (5 個)
   - `ncr_ranger` - NCR 遊騎兵 (中低音，專業可靠)
   - `legion_centurion` - 軍團百夫長 (低沉音，權威嚴格)
   - `minuteman` - 民兵 (中性音，正義感)
   - `railroad_agent` - 鐵路特工 (中性音，神秘)
   - `institute_scientist` - 學院科學家 (稍高音，知性理性)

---

#### 2. 語音參數配置 ✅

**檔案修改**: `src/lib/audio/constants.ts`

**新增內容**: `DEFAULT_VOICE_CONFIGS`

**設計原則**:
```typescript
// pitch: 音高 (0.0-2.0)
// - 低音 (0.6-0.9) = 威嚴/強壯/成熟
// - 中音 (0.95-1.1) = 正常/友善
// - 高音 (1.1-1.5) = 年輕/機械/知性

// rate: 語速 (0.1-10.0)
// - 慢速 (0.8-0.9) = 穩重/笨重/命令式
// - 正常 (0.95-1.05) = 標準語速
// - 快速 (1.1-1.2) = 精明/活潑/優雅

// effects: 音效處理
// - 'radio': 電子/通訊音效
// - 'distortion': 粗糙/沙啞音效
// - 'reverb': 回音效果
```

**範例配置**:
```typescript
super_mutant: {
  pitch: 0.6,         // 極低音，威嚇強大
  rate: 0.8,          // 慢速，笨重簡單
  volume: 1.0,
  effects: ['distortion'], // 粗糙音效
}

codsworth: {
  pitch: 1.3,         // 較高音，機器人特徵
  rate: 1.15,         // 稍快，優雅紳士
  volume: 1.0,
  effects: ['radio', 'distortion'], // 機器人音效
}
```

---

#### 3. 智能語音選擇系統 ✅

**新增檔案**: `src/lib/audio/VoiceSelector.ts`

**核心功能**:

##### 3.1 智能語音匹配演算法

**匹配策略** (評分系統，總分 100+):
1. **語言匹配** (最高 50 分)
   - 第一優先語言: +50 分
   - 第二優先語言: +40 分
   - 第三優先語言: +30 分
   - 範例: `zh-TW` > `zh-CN` > `en-US`

2. **性別匹配** (30 分)
   - 符合性別偏好: +30 分
   - 例外: 機械角色和特工不分性別

3. **關鍵字匹配** (每個 10 分)
   - 語音名稱包含關鍵字
   - 例如: `'male'`, `'deep'`, `'british'`, `'青年'`, `'低音'`

4. **排除關鍵字** (每個 -50 分)
   - 強制排除不適合的語音
   - 例如: 男性角色排除 `'female'`

5. **本地語音優先** (10 分)
   - 本地語音減少延遲

**範例匹配邏輯**:
```typescript
// Codsworth (英式管家機器人)
codsworth: {
  preferredLanguages: ['en-GB', 'en-AU', 'en-US', 'zh-TW'],
  preferredGender: 'male',
  keywords: ['male', 'british', 'daniel', 'oliver', '男', '英國'],
}

// Super Mutant (強大變種人)
super_mutant: {
  preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
  preferredGender: 'male',
  keywords: ['male', 'deep', 'bass', 'low', '男', '低音', '深'],
}
```

##### 3.2 跨平台語音庫支援

**支援平台**:
- **Windows**: Microsoft Voices (David, Zira, Mark, etc.)
- **macOS**: Apple Voices (Alex, Samantha, Daniel, etc.)
- **Android**: Google TTS
- **iOS**: Apple iOS Voices

**Fallback 機制**:
1. 嘗試智能匹配
2. 若無匹配，使用系統預設語音
3. 優先順序: `zh-TW` > `zh-CN` > `en-US` > 第一個可用語音

---

#### 4. 增強型 VoiceSelector 元件 ✅

**檔案修改**: `src/components/audio/VoiceSelector.tsx`

**新增功能**:

##### 4.1 完整角色列表
- 14 個角色，分 4 組 (`<optgroup>`)
- 中文顯示名稱

##### 4.2 語音預覽（試聽）
```typescript
const PREVIEW_TEXTS: Record<CharacterVoice, string> = {
  pip_boy: '系統初始化完成。歡迎使用廢土塔羅系統。',
  super_mutant: '強大！簡單！直接！',
  codsworth: '很榮幸為您服務，先生/女士。',
  // ... 每個角色都有獨特的試聽文字
};
```

**試聽功能**:
- 點擊「試聽語音」按鈕
- 使用當前選定角色的參數（pitch, rate, volume）
- 播放時顯示脈衝動畫
- 支援停止播放

##### 4.3 角色資訊顯示
- 角色名稱、描述、個性
- 從 `@/data/voices.ts` 讀取資料
- Fallout 主題色彩 (`themeColor`)

##### 4.4 語音參數資訊
- 顯示當前角色的 `pitch`（音高）
- 顯示當前角色的 `rate`（語速）
- 小數點後兩位精度

##### 4.5 系統語音資訊
- 顯示智能選擇的實際系統語音名稱
- 格式: `語音名稱 (語言代碼)`
- 範例: `Microsoft David Desktop (en-US)`

##### 4.6 UI/UX 優化
- Fallout Pip-Boy 風格設計
- 使用 PixelIcon 圖示系統
- 綠色主題 (`text-pip-boy-green`)
- 無障礙支援 (`aria-label`)
- 響應式動畫 (`animation="pulse"`)

---

#### 5. SpeechEngine 整合 ✅

**檔案修改**: `src/lib/audio/SpeechEngine.ts`

**變更內容**:

##### 5.1 初始化流程改為 Async
```typescript
async initialize(): Promise<boolean> {
  // ... 原有邏輯

  // 新增: 初始化智能語音選擇器
  await this.voiceSelector.initialize();

  // ...
}
```

##### 5.2 智能語音選擇優先順序
```typescript
speak(text: string, options: SpeechOptions) {
  // 優先順序 1: 手動指定的語音名稱（voiceName）
  if (voiceConfig.voiceName) {
    selectedVoice = findByName(voiceName);
  }

  // 優先順序 2: 智能選擇語音（VoiceSelector）
  if (!selectedVoice && options.voice) {
    selectedVoice = voiceSelector.selectBestVoice(options.voice);
  }

  // 設定選定的語音
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
}
```

##### 5.3 新增 API
```typescript
getVoiceSelector(): VoiceSelector {
  return this.voiceSelector;
}
```

---

#### 6. Hook 更新 ✅

**檔案修改**: `src/hooks/audio/useTextToSpeech.ts`

**變更內容**:
```typescript
// 原本: 同步初始化
useEffect(() => {
  const supported = speechEngine.initialize();
  setIsSupported(supported);
}, []);

// 更新: 異步初始化
useEffect(() => {
  const initializeSpeech = async () => {
    const supported = await speechEngine.initialize();
    setIsSupported(supported);
  };
  initializeSpeech();
}, []);
```

---

## 技術亮點

### 1. 評分系統演算法
- 多維度評分（語言、性別、關鍵字、本地性）
- 權重分配合理（語言 > 性別 > 關鍵字）
- 負分機制（排除不適合的語音）

### 2. 跨平台兼容性
- 偵測系統可用語音
- 智能 fallback 機制
- 支援異步語音載入（Chrome, Safari）

### 3. 使用者體驗
- 即時試聽功能
- 視覺化參數顯示
- 系統語音透明化
- Fallout 主題設計

### 4. 代碼品質
- TypeScript 類型安全
- 單例模式（Singleton）
- 關注點分離（VoiceSelector vs SpeechEngine）
- 文件完整（JSDoc 註解）

---

## 測試建議

### 手動測試檢查清單
- [ ] 選擇每個角色，確認參數不同
- [ ] 試聽每個角色，確認音高/語速符合預期
- [ ] 在不同平台測試（Windows, macOS, iOS, Android）
- [ ] 驗證系統語音資訊顯示正確
- [ ] 測試語音預覽的停止功能
- [ ] 確認 UI 響應正常（選單、按鈕）

### 跨平台測試
1. **Windows** (Chrome/Edge)
   - 預期語音: Microsoft David, Mark, Zira

2. **macOS** (Safari/Chrome)
   - 預期語音: Alex, Daniel, Samantha

3. **iOS** (Safari)
   - 預期語音: iOS Voices

4. **Android** (Chrome)
   - 預期語音: Google TTS

---

## 已知限制

### 1. 瀏覽器 TTS 限制
- 語音品質依賴作業系統
- 跨平台一致性無法保證 100%
- 部分平台中文語音選項較少

### 2. Web Speech API 限制
- 無法自訂語音庫
- 無法訓練語音模型
- 僅能調整 pitch、rate、volume

### 3. 效果處理
- `effects` 參數（radio, distortion, reverb）目前僅為配置
- 實際音效處理需要 Web Audio API（待 Phase 2 實作）

---

## 下一步規劃

### Phase 2: 中期升級（2-3 個月後）
**目標**: 整合 Neural TTS API

**計畫**:
1. 選擇 TTS API（Azure/Google/AWS）
2. 建立後端 `/api/tts/synthesize` 端點
3. 實作快取機制（預先產生常用解讀音訊）
4. 前端整合 API 模式
5. SSML 優化（情緒、韻律）

**預期成果**:
- 高品質、一致的語音體驗
- 跨平台 100% 一致
- 成本可控（快取 + 配額管理）

---

### Phase 3: 長期規劃（6 個月後）
**目標**: 自主化 TTS 系統

**計畫**:
1. 評估 ChatTTS 開源方案
2. 部署 Python FastAPI 服務
3. 語音個性化訓練
4. 混合架構（關鍵角色高品質，次要角色 API/瀏覽器）

**觸發條件**:
- 月活躍用戶 > 10,000
- API 成本 > $100/月
- 需要極度自訂化語音

---

## 檔案變更清單

### 新增檔案
- `src/lib/audio/VoiceSelector.ts` (451 行)

### 修改檔案
- `src/lib/audio/types.ts` (CharacterVoice 類型擴展)
- `src/lib/audio/constants.ts` (DEFAULT_VOICE_CONFIGS 14 個角色)
- `src/lib/audio/SpeechEngine.ts` (整合 VoiceSelector, async initialize)
- `src/hooks/audio/useTextToSpeech.ts` (async 初始化)
- `src/components/audio/VoiceSelector.tsx` (完全重構，新增試聽功能)

---

## 實作統計

- **總代碼行數**: ~700 行（含註解）
- **新增類別**: 1 個（VoiceSelector）
- **支援角色**: 從 5 個擴展至 14 個
- **語音匹配邏輯**: 5 維度評分系統
- **試聽文字**: 14 段獨特角色台詞

---

## 結論

本次實作成功將 TTS 系統從 5 個基礎角色擴展至 14 個 Fallout 角色，並實現了智能語音選擇系統。透過評分演算法和跨平台支援，顯著提升了語音匹配品質和使用者體驗。

**核心成果**:
✅ 支援全部 14 個 Fallout 角色
✅ 智能語音選擇演算法（5 維度評分）
✅ 語音預覽（試聽）功能
✅ 跨平台語音庫支援
✅ 參數可視化與透明化
✅ 零成本、零依賴（使用瀏覽器原生 TTS）

**使用者價值**:
- 每個角色有明顯可辨識的語音特徵
- 試聽功能讓用戶預先體驗
- 系統語音資訊提升透明度
- Fallout 主題設計增強沉浸感

---

## 參考資料

### Web Speech API
- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechSynthesis Interface](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

### Best Practices
- 多角色 TTS 系統設計模式
- 跨平台語音匹配策略
- Neural TTS API 比較（Azure, Google, AWS）

### 專案文件
- `src/data/voices.ts` - 角色資料定義
- `src/lib/audio/types.ts` - 類型定義
- `src/lib/audio/constants.ts` - 語音配置

---

**實作者**: Claude (Anthropic AI)
**實作日期**: 2025-10-18
**版本**: Phase 1 完成
