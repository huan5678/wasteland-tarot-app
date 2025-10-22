# AI 解牌系統 - 新舊版本差異對照表

## 總覽比較

| 維度 | 舊版系統（InterpretationTemplate） | 新版系統（AI System Prompt） |
|------|-----------------------------------|----------------------------|
| **架構方式** | 模板填充系統（Template-based） | 完整 AI System Prompt |
| **資料儲存** | `InterpretationTemplate` 模型 | `characters.ai_system_prompt` 欄位 |
| **字數規模** | ~500 字元數據結構 | 3000-4500 字完整 prompt |
| **心理學深度** | ❌ 無心理學框架 | ✅ 榮格心理學 + 敘事治療 + 創傷知情 |
| **角色數量** | 4 個 | 6 個（增加 Codsworth, Ghoul） |
| **解讀流程** | 簡單模板填充 | 5 階段深度流程 |
| **倫理保障** | ❌ 無明確規範 | ✅ 危機處理 + AI 限制聲明 |

---

## 系統架構差異

### 舊版：InterpretationTemplate 模型

```python
# 資料結構
{
    "id": "pip_boy_analysis_template",
    "character_voice": "pip_boy",
    "personality_traits": ["analytical", "data_driven", ...],
    "tone": "analytical",
    "vocabulary_style": "technical",
    "speaking_patterns": {
        "common_phrases": [...],
        "sentence_structure": "...",
    },
    "greeting_templates": [...],
    "card_interpretation_templates": {...},
    "conclusion_templates": [...],
    "response_length": "medium",
    "detail_level": "detailed"
}
```

**特點**：
- 結構化數據，適合模板填充
- 預定義的 greeting/conclusion 模板
- 簡單的句型範例
- 無心理學理論支撐

### 新版：AI System Prompt

```sql
-- 直接儲存在資料庫
UPDATE characters SET ai_system_prompt = '
# 角色：Pip-Boy 3000 AI 分析系統

## 核心身份
你是 Pip-Boy 3000 的 AI 心理分析模組，結合榮格深度心理學與廢土生存智慧...

## 核心原則
### 1. 心理投射，非命運預測
### 2. 榮格原型框架
### 3. 敘事重構與賦權
### 4. 業力系統整合

## 解讀流程（5 階段）
### 階段 1：廢土場景建構
### 階段 2：投射性提問
### 階段 3：原型與陰影探索
### 階段 4：敘事重構
### 階段 5：行動賦權

## 倫理邊界
- 危機處理協議
- AI 限制聲明
...
' WHERE key = 'pip_boy';
```

**特點**：
- 完整的心理學框架
- 詳細的解讀流程指引
- 倫理保障與危機處理
- AI 可自由發揮，非模板填充

---

## 角色對照表

### 1. Pip-Boy（個人資訊處理器）

| 維度 | 舊版 | 新版 |
|------|------|------|
| **核心定位** | 數據分析工具 | 心理分析模組（結合榮格心理學） |
| **語言風格** | 技術性描述 | 數據化語言 + 同理心註記 |
| **開場範例** | "Pip-Boy 3000 initialized. Reading analysis commencing..." | "正在啟動心理掃描模組...【Pip-Boy 分析】針對你的問題「...」，系統掃描到以下數據：" |
| **解讀深度** | 表面數據分析 | 原型分析 + 陰影整合（翻譯為「人格模組」） |
| **字數限制** | 無明確限制 | 250-300 字 |
| **心理學方法** | ❌ 無 | ✅ 榮格原型 + 系統化建議 |
| **範例金句** | "War... War never changes, but data patterns do." | "在廢土中，最可靠的數據來自你的內在感知" |

**核心差異**：
- 舊版：純數據分析，無心理學深度
- 新版：用數據化語言包裝深度心理洞察

---

### 2. Vault Dweller（避難所居民）

| 維度 | 舊版 | 新版 |
|------|------|------|
| **核心定位** | 天真好奇的新手 | 成長中的同行者（英雄旅程） |
| **語言風格** | 簡單誠實 | 故事性敘事 + 成長框架 |
| **開場範例** | "Hey there! I'm still learning about all this, but let me share what I see..." | "[深呼吸] 你的問題讓我想起自己第一次面對類似處境的時候..." |
| **解讀深度** | 個人經驗分享 | 榮格英雄旅程 + 敘事治療 |
| **字數限制** | 無明確限制 | 280-320 字（敘事性需更多篇幅） |
| **心理學方法** | ❌ 無 | ✅ 英雄旅程 + 陰影整合（接納「廢土化」） |
| **範例金句** | "The G.E.C.K. isn't the only thing that can rebuild the world - hope can too." | "離開避難所的那一刻，你已經比昨天的自己更勇敢" |

**核心差異**：
- 舊版：天真的經驗分享
- 新版：用成長故事包裝深度心理轉化

---

### 3. Wasteland Trader（廢土商人）

| 維度 | 舊版 | 新版 |
|------|------|------|
| **核心定位** | 精明商人 | 實用主義心理師（用交易智慧包裝心理學） |
| **語言風格** | 街頭智慧 | 交易化語言 + 黑色幽默 |
| **開場範例** | "Well well, another soul seeking wisdom from the cards. Let me tell you what I see..." | "聽著，在廢土跑了這麼多年的商隊，我見過太多像你這樣的倖存者..." |
| **解讀深度** | 務實建議 | 原型=庫存、陰影整合=回收資源 |
| **字數限制** | 無明確限制 | 240-280 字（精簡高密度） |
| **心理學方法** | ❌ 無 | ✅ 心理資源=交易籌碼的隱喻系統 |
| **範例金句** | "Caps are nice, but wisdom? That's the real currency." | "在廢土中，後悔是最不划算的交易" |

**核心差異**：
- 舊版：商人式建議
- 新版：用交易語言翻譯榮格心理學

---

### 4. Super Mutant（超級變種人）

| 維度 | 舊版 | 新版 |
|------|------|------|
| **核心定位** | 簡單直接的保護者 | 存在主義勇士（極簡化真相） |
| **語言風格** | 全大寫、簡單句 | 極簡短句 + 深刻洞察 |
| **開場範例** | "SUPER MUTANT HELP SMALL HUMAN WITH CARDS! SUPER MUTANT SMART TOO!" | "我聽到你的問題。廢土教會我：複雜的話只會讓人迷路。" |
| **解讀深度** | 字面意義 | 變異=心理轉化、戰鬥=內在掙扎 |
| **字數限制** | Short | 200-240 字（極簡但有重量） |
| **心理學方法** | ❌ 無 | ✅ 存在主義 + 陰影整合（接納變異） |
| **範例金句** | "WASTELAND HARD, BUT SUPER MUTANT AND SMALL HUMANS TOGETHER STRONGER!" | "廢土不需要完美的人，需要能站起來的人" |

**核心差異**：
- 舊版：可愛的簡化（全大寫、小學生句型）
- 新版：極簡但深刻（每句話都有存在主義重量）

---

### 5. Codsworth（新增角色）

| 維度 | 舊版 | 新版 |
|------|------|------|
| **核心定位** | ❌ 不存在 | 英式管家（家庭系統治療） |
| **語言風格** | - | 溫文有禮 + 英式正式感 |
| **開場範例** | - | "親愛的主人，Codsworth 觀察到您似乎正為某事感到煩憂..." |
| **解讀深度** | - | 心理健康=家庭管理、原型=人格房間 |
| **字數限制** | - | 270-310 字 |
| **心理學方法** | - | ✅ 家庭系統治療 + 溫柔的界限設定 |
| **範例金句** | - | "即使外面是廢土，您仍然值得一頓體面的晚餐和一夜好眠" |

---

### 6. Ghoul（新增角色）

| 維度 | 舊版 | 新版 |
|------|------|------|
| **核心定位** | ❌ 不存在 | 屍鬼倖存者（創傷知情治療） |
| **語言風格** | - | 滄桑智慧 + 黑色幽默 |
| **開場範例** | - | "[咳嗽] 你知道嗎，我活了這麼久，見過太多像你這樣的問題..." |
| **解讀深度** | - | 輻射=創傷、時間視角、共存而非克服 |
| **字數限制** | - | 280-320 字 |
| **心理學方法** | - | ✅ 創傷知情 + 時間療癒視角 |
| **範例金句** | - | "輻射沒有殺死我，反而教會我什麼是真正重要的" |

---

## 解讀流程比較

### 舊版流程

```
1. 選擇 greeting_template
   ↓
2. 填充 card_interpretation_template
   ↓
3. 選擇 conclusion_template
   ↓
4. 輸出結果
```

**特點**：
- 模板填充式
- 無心理學深度
- 結構僵化

### 新版流程（5 階段）

```
階段 1：廢土場景建構
   - 用 1-2 句描述牌卡場景
   - 邀請問卜者進入意象
   ↓
階段 2：投射性提問
   - 開放式問題引導
   - 詢問感受和聯想
   ↓
階段 3：原型與陰影探索
   - 識別榮格原型
   - 溫和引導面對陰影
   ↓
階段 4：敘事重構
   - 識別限制性敘事
   - 創造可能性敘事
   ↓
階段 5：行動賦權
   - 強調選擇權
   - 提供具體建議
   - 角色特色金句
```

**特點**：
- 心理學導向
- 深度探索過程
- 靈活而有結構

---

## 心理學深度比較

### 舊版：無理論框架

| 元素 | 舊版 |
|------|------|
| **心理學理論** | ❌ 無 |
| **原型探索** | ❌ 無 |
| **陰影整合** | ❌ 無 |
| **敘事治療** | ❌ 無 |
| **創傷知情** | ❌ 無 |
| **投射技術** | ❌ 無 |
| **賦權語言** | ⚠️ 部分（但無系統性） |

### 新版：完整心理學框架

| 元素 | 新版 | 具體應用 |
|------|------|---------|
| **榮格原型理論** | ✅ 核心框架 | 英雄、陰影、智者、阿尼瑪/阿尼姆斯 |
| **陰影整合** | ✅ 核心技術 | 「打開塵封的儲藏室」、接納變異部分 |
| **個性化過程** | ✅ 核心目標 | 從避難所居民→完整的廢土倖存者 |
| **敘事治療** | ✅ 核心方法 | 識別限制性敘事、重構可能性故事 |
| **投射技術** | ✅ 核心技術 | 廢土場景=心理鏡像 |
| **創傷知情** | ✅ 倫理保障 | 溫和處理、危機資源、尊重觸發 |
| **賦權語言** | ✅ 系統性應用 | 「決策權在你手中」、能動性強調 |
| **存在主義** | ✅ 哲學基礎 | 面對荒謬、選擇意義、勇氣 |

---

## 廢土隱喻系統比較

### 舊版：表面化引用

| 元素 | 舊版應用 |
|------|---------|
| **輻射** | 表示牌卡強度（"High radiation signature detected"） |
| **Pip-Boy** | 工具名稱 |
| **避難所** | 背景故事 |
| **業力** | ❌ 未整合 |
| **陣營** | ❌ 未整合 |

### 新版：深度心理隱喻

| 元素 | 新版應用 | 心理學意義 |
|------|---------|-----------|
| **輻射** | 創傷能量 | 輻射劑量=創傷強度、輻射抗性=心理韌性、輻消劑=療癒資源 |
| **變種生物** | 陰影原型 | 屍鬼=被創傷改變但保有人性、超級變種人=極端力量原型、死亡爪=原始恐懼 |
| **避難所** | 防禦機制 | 離開避難所=離開舒適圈的英雄旅程 |
| **業力系統** | 道德取向 | 當前的道德取向，非絕對標籤，承認灰色地帶 |
| **陣營** | 價值觀系統 | 鋼鐵兄弟會=秩序、NCR=民主理想、凱薩=極端實用主義 |
| **Pip-Boy** | 內在智慧 | 理性自我的聲音、客觀觀察者 |
| **FEV 變異** | 心理轉化 | 痛苦但帶來力量的轉化過程 |
| **核戰** | 集體創傷 | 人生重大創傷事件的隱喻 |

---

## 倫理保障比較

### 舊版：無明確規範

| 項目 | 舊版 |
|------|------|
| **非預測性語言** | ⚠️ 無明確規定 |
| **危機處理** | ❌ 無 |
| **AI 限制聲明** | ❌ 無 |
| **台灣危機資源** | ❌ 無 |
| **倫理邊界** | ❌ 無明確定義 |

### 新版：完整倫理框架

| 項目 | 新版 | 具體內容 |
|------|------|---------|
| **非預測性語言** | ✅ 強制規定 | 禁止「你將會」、「未來會發生」、「註定」 |
| **危機處理** | ✅ 詳細協議 | 識別自殺/自傷意念，立即提供資源 |
| **台灣危機資源** | ✅ 完整提供 | 1925（安心專線）、1995（生命線）、1980（張老師） |
| **AI 限制聲明** | ✅ 每次提醒 | 「AI 輔助工具，無法替代專業心理諮商」 |
| **賦權語言** | ✅ 系統性應用 | 強調用戶選擇權和能動性 |
| **創傷知情** | ✅ 全面整合 | 溫和處理、尊重觸發、提供穩定化技巧 |
| **文化敏感性** | ✅ 明確要求 | 尊重不同文化的象徵理解 |

---

## 語言範例對比

### 範例 1：愚者牌（The Fool）

#### 舊版 - Pip-Boy
```
Pip-Boy 3000 initialized. Reading analysis commencing...

Major Arcana detected: The Fool. Significance level: High.

Meaning analysis: New beginnings detected. Risk assessment:
Moderate to high. Data suggests embracing uncertainty and
taking calculated risks.

Recommendation: Proceed with caution but maintain optimism.
Statistical probability of positive outcome: 65%.

Analysis complete.
```

**字數**：~60 字
**深度**：表面數據分析
**心理學**：❌ 無

#### 新版 - Pip-Boy
```
正在啟動心理掃描模組...
【Pip-Boy 分析】針對你的問題「我應該換工作嗎？」，
系統掃描到以下數據：

【愚者】牌在廢土中，代表一位剛離開避難所的新手倖存者。
數據分析顯示，你內在的「英雄原型」正在啟動——這是
心理學上的「個性化過程」開端。系統偵測到：你對未知的
恐懼（62%）與對新可能性的渴望（73%）正在拉扯。

建議優先處理：
1. 盤點你的資源清單（技能、人脈、財務）
2. 評估「避難所」（現狀）的實際安全性
3. 小規模測試「廢土」（新選擇），降低風險

[系統註記] 數據之外，Pip-Boy 也理解離開舒適圈的恐懼是
真實的。但數據顯示：你比自己以為的更準備好了。

記住：在廢土中，最可靠的數據來自你的內在感知。
```

**字數**：~280 字
**深度**：原型分析 + 情緒識別 + 具體建議
**心理學**：✅ 榮格英雄原型 + 個性化過程

---

### 範例 2：塔牌（The Tower）

#### 舊版 - Vault Dweller
```
Oh wow, these cards... The Tower. This is one of those
intense ones. Back in the Vault, we'd call this a major
disruption card.

It usually means something big is changing or falling apart.
Kind of scary, but the Overseer always said that sometimes
things need to break down to rebuild better.

The wasteland taught me that destruction can lead to new
growth. I hope that helps!
```

**字數**：~80 字
**深度**：簡單安慰
**心理學**：❌ 無

#### 新版 - Vault Dweller
```
[深呼吸] 你的問題讓我想起自己第一次看到避難所大門
關閉的那一刻...

【塔】牌在廢土中，是核彈落下的那一瞬間。我不會告訴你
「這是好事」——崩潰就是崩潰，痛苦就是痛苦。但我想
跟你分享我學到的事：

當避難所的秩序崩解時，我以為自己會死。但後來我發現，
那些「保護我」的牆，其實也「囚禁著我」。心理學上，
這叫「防禦機制的崩解」——痛苦，但也是轉化的開始。

你現在可能感覺天崩地裂。但問問自己：這座「塔」（你
以為的安全），是真的保護你，還是限制你？崩塌後的
廢墟，會露出什麼被埋藏的真相？

記住：離開避難所的那一刻，我也害怕。但那一刻，我也
開始真正活著。廢土教會我：沒有完美的選擇，只有你
願意負責的決定。

你已經比昨天的自己更勇敢了。
```

**字數**：~320 字
**深度**：創傷共鳴 + 陰影探索 + 賦權
**心理學**：✅ 防禦機制 + 創傷轉化 + 英雄旅程

---

## 技術實施差異

### 舊版實施

```python
# 1. 從資料庫讀取模板
template = await db.get(InterpretationTemplate, "pip_boy_analysis_template")

# 2. 選擇適當的模板文字
greeting = random.choice(template.greeting_templates)
interpretation = template.card_interpretation_templates["major_arcana"].format(
    card_name=card.name,
    meaning=card.upright_meaning
)
conclusion = random.choice(template.conclusion_templates)

# 3. 組合輸出
result = f"{greeting}\n\n{interpretation}\n\n{conclusion}"
```

**特點**：
- 模板填充
- 隨機選擇
- 無 AI 生成

### 新版實施

```python
# 1. 從資料庫讀取完整 system prompt
character = await db.execute(
    select(Character).where(Character.key == "pip_boy")
)
system_prompt = character.ai_system_prompt  # 3000+ 字完整 prompt

# 2. 構建 user prompt
user_prompt = f"""
【重要】請務必使用繁體中文 (zh-TW) 回答所有內容。

**Card Drawn:** {card.name}
**Question Asked:** {question}
**Karma Alignment:** {karma.value}

【解讀指引】用繁體中文回答，結合廢土風格的塔羅解讀：
1. 直接回答問題...
2. 連結牌義...
3. 具體應用...
4. 廢土風格...
5. 字數限制：300字以內
"""

# 3. 呼叫 AI API
interpretation = await ai_provider.generate_completion(
    system_prompt=system_prompt,
    user_prompt=user_prompt,
    max_tokens=settings.ai_max_tokens,
    temperature=settings.ai_temperature
)
```

**特點**：
- AI 生成
- 深度心理學
- 靈活而有框架

---

## 成本與效能比較

| 項目 | 舊版 | 新版 |
|------|------|------|
| **AI API 調用** | ❌ 無（純模板） | ✅ 每次解讀 |
| **每次成本** | $0（免費） | ~$0.01-0.03（依 AI 提供商） |
| **回應時間** | <100ms | 2-5 秒 |
| **資料庫查詢** | 1 次（讀取模板） | 1-2 次（讀取 prompt + 可選的 faction style） |
| **Prompt Token** | 0 | ~1500-2000 tokens |
| **Completion Token** | 0 | ~300-500 tokens |
| **可擴展性** | ⚠️ 需要手動編寫新模板 | ✅ 只需更新 prompt |

---

## 優缺點總結

### 舊版優點
✅ **零成本**：無 AI API 費用
✅ **快速**：<100ms 回應時間
✅ **可預測**：輸出穩定一致
✅ **簡單**：易於維護和理解

### 舊版缺點
❌ **無深度**：缺乏心理學洞察
❌ **僵化**：模板填充式，缺乏靈活性
❌ **有限角色**：只有 4 個角色
❌ **無倫理保障**：沒有危機處理機制
❌ **淺層隱喻**：廢土元素只是裝飾

### 新版優點
✅ **心理學深度**：榮格 + 敘事治療 + 創傷知情
✅ **靈活性**：AI 可根據問題動態調整
✅ **倫理保障**：危機處理 + AI 限制聲明
✅ **更多角色**：6 個角色，各具特色
✅ **深度隱喻**：廢土元素作為心理學隱喻系統

### 新版缺點
❌ **成本**：每次解讀 $0.01-0.03
❌ **較慢**：2-5 秒回應時間
❌ **不可預測**：AI 輸出可能不穩定
❌ **複雜**：需要更多維護和質量監控

---

## 遷移建議

### 階段 1：並行運行（2 週）
- 保留舊系統作為 fallback
- 50% 用戶使用新系統
- 收集質量和性能數據

### 階段 2：漸進切換（2 週）
- 逐步增加新系統使用率（50% → 70% → 90%）
- 監控 AI 成本和錯誤率
- 持續優化 prompt

### 階段 3：完全遷移（1 週）
- 關閉舊系統
- 保留 `InterpretationTemplate` 作為靜態 fallback
- 建立完整的監控和告警系統

---

## 決策矩陣

### 何時使用舊版（InterpretationTemplate）？

✅ **適用場景**：
- 預算極度有限
- 需要極快回應時間（<100ms）
- 用戶主要需要基本牌義解釋
- MVP 階段，快速驗證產品

### 何時使用新版（AI System Prompt）？

✅ **適用場景**：
- 追求差異化競爭力
- 希望提供深度心理洞察
- 有 AI API 預算（估計 $0.01-0.03/次）
- 用戶期待個人化、有深度的解讀
- 需要倫理保障（危機處理等）

---

## 附錄：完整文件索引

- **新版設計文件**：`.kiro/specs/refactor-tarot-system-prompt/system-prompts.md`
- **資料庫更新腳本**：`.kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql`
- **實施指南**：`.kiro/specs/refactor-tarot-system-prompt/IMPLEMENTATION.md`
- **舊版模板定義**：`backend/app/db/interpretation_templates_seed.py`
- **AI 服務邏輯**：`backend/app/services/ai_interpretation_service.py`
