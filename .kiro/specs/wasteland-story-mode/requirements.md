# 需求文件 - Wasteland Story Mode (廢土故事模式)

## 引言

Wasteland Story Mode 是一個內容增強功能，目標是為現有的 78 張塔羅牌注入深度的 Fallout 世界觀故事背景。每張牌將對應特定的廢土事件、角色經歷或傳說故事，讓占卜體驗不僅是符號解讀，更是一次廢土歷史的探索之旅。

### 業務價值
- **提升沉浸感**：透過具體的廢土故事，讓每張牌不再只是抽象符號，而是活生生的廢土傳說
- **增強娛樂性**：Fallout 粉絲可以在占卜過程中重溫經典事件或發現新的廢土軼事
- **差異化競爭力**：市場上沒有其他塔羅平台提供如此深度的主題故事整合
- **內容可擴展性**：為未來的語音朗讀、動畫展示等功能建立故事基礎

### 技術範圍
- **資料庫層**：在現有 `wasteland_cards` 表中新增故事相關欄位
- **內容層**：為 78 張卡牌撰寫完整的 Fallout 主題故事背景
- **API 層**：調整卡牌查詢端點，確保故事內容被正確返回
- **前端層**：在卡牌詳情頁面展示故事內容（需要設計決策）

---

## 需求

### 需求 1：資料庫結構擴充

**使用者故事**：身為系統架構師，我需要擴充 WastelandCard 資料模型以儲存故事內容，讓每張牌都能攜帶豐富的敘事資訊。

#### 驗收標準

1. WHEN 資料庫遷移執行時 THEN 系統 SHALL 在 `wasteland_cards` 表中新增以下欄位：
   - `story_background` (Text, nullable): 牌的廢土故事背景（200-500字）
   - `story_character` (String(100), nullable): 故事主角名稱
   - `story_location` (String(100), nullable): 故事發生地點（Vault編號、城鎮名稱等）
   - `story_timeline` (String(50), nullable): 故事時間點（戰前/戰後/年份）
   - `story_faction_involved` (JSON, nullable): 涉及的陣營列表
   - `story_related_quest` (String(200), nullable): 相關的 Fallout 遊戲任務名稱（如有）

2. IF 現有 WastelandCard 記錄已存在 THEN 系統 SHALL 保留所有現有資料欄位的值

3. WHEN 新增故事欄位後 THEN 系統 SHALL 維持與現有程式碼的向後相容性

4. WHERE 資料庫遷移腳本中 THE 系統 SHALL 包含 rollback 邏輯以支援版本回退

### 需求 2：故事內容創建

**使用者故事**：身為內容創作者，我需要為每張塔羅牌撰寫符合 Fallout 世界觀的故事背景，讓玩家在抽牌時能體驗到廢土的歷史與傳說。

#### 驗收標準

1. WHEN 撰寫故事內容時 THEN 每張牌的故事 SHALL 符合以下準則：
   - 字數範圍：200-500 繁體中文字
   - 語氣：符合 Fallout 的黑色幽默與後末日氛圍
   - 連結性：與牌的原始塔羅意義有明確對應關係

2. IF 牌屬於 Major Arcana (主要奧秘) THEN 故事 SHALL 以知名 Fallout 角色或重大歷史事件為主軸

3. IF 牌屬於 Minor Arcana (次要奧秘) THEN 故事 SHALL 以廢土常見情境、小人物經歷或陣營日常為題材

4. WHEN 故事涉及特定陣營時 THEN 內容 SHALL 與該陣營的核心價值觀和行為模式一致：
   - Brotherhood of Steel: 科技至上、紀律嚴明
   - NCR: 民主理念、組織化重建
   - Legion: 羅馬軍事文化、威權統治
   - Raiders: 混亂、掠奪、生存至上
   - Vault-Tec: 企業文化、實驗主義

5. WHERE 故事提及 Vault 編號 THE 系統 SHALL 確保編號符合 Fallout 官方設定（Vault 1-122）

6. WHEN 故事引用遊戲任務時 THEN 內容 SHALL 正確標註任務來源（Fallout 3/NV/4/76）

### 需求 3：種子資料腳本更新

**使用者故事**：身為開發者，我需要更新卡牌種子資料腳本，讓新建立的資料庫能夠自動填充完整的故事內容。

#### 驗收標準

1. WHEN 執行 `complete_wasteland_seed.py` 時 THEN 系統 SHALL 為全部 78 張牌填充故事資料

2. IF 故事欄位為空 THEN 種子腳本 SHALL 使用預設佔位文字而非 NULL 值

3. WHEN 種子資料包含故事內容時 THEN 資料 SHALL 以結構化 Python 字典格式儲存，方便維護與版本控制

4. WHERE 種子腳本執行過程中 THE 系統 SHALL 輸出進度日誌，顯示每張牌的故事載入狀態

5. IF 種子資料執行失敗 THEN 系統 SHALL 回滾所有變更並提供清晰的錯誤訊息

### 需求 4：API 端點調整

**使用者故事**：身為前端開發者，我需要 API 能夠返回卡牌的故事內容，讓我可以在使用者介面上展示這些資訊。

#### 驗收標準

1. WHEN 呼叫 `/api/v1/cards/{id}` 端點時 THEN 回應 SHALL 包含完整的故事欄位：
   ```json
   {
     "id": "uuid",
     "name": "避難所新手",
     "story": {
       "background": "故事內容...",
       "character": "Lone Wanderer",
       "location": "Vault 101",
       "timeline": "2277 年",
       "factions_involved": ["Brotherhood of Steel", "Enclave"],
       "related_quest": "Escape! (Fallout 3)"
     }
   }
   ```

2. WHEN 呼叫 `/api/v1/cards` (批次查詢) 時 THEN 系統 SHALL 支援 `include_story=true` 查詢參數以控制故事內容的返回

3. IF `include_story=false` 或未提供參數 THEN 回應 SHALL 排除故事欄位以優化回應大小

4. WHEN API 返回故事內容時 THEN 回應時間 SHALL 不超過原有查詢時間的 120%

5. WHERE Pydantic schema 定義中 THE 系統 SHALL 新增 `WastelandCardStory` 巢狀模型以確保型別安全

### 需求 5：資料完整性與驗證

**使用者故事**：身為品質保證工程師，我需要確保所有故事內容符合格式規範且資料完整，避免出現空白或格式錯誤的故事。

#### 驗收標準

1. WHEN 儲存故事內容到資料庫時 THEN 系統 SHALL 驗證以下規則：
   - `story_background` 字數在 200-500 字之間（繁體中文字符計數）
   - `story_character` 不為空字串
   - `story_location` 符合 Fallout 地點命名規範
   - `story_timeline` 格式為 "戰前"、"戰後" 或 "YYYY 年"

2. IF 故事內容未通過驗證 THEN 系統 SHALL 拋出 `ValidationError` 並提供具體的錯誤說明

3. WHEN 執行資料庫遷移後 THEN 系統 SHALL 運行完整性檢查腳本，確認所有 78 張牌都有有效的故事資料

4. WHERE 故事提及陣營名稱 THE 系統 SHALL 驗證陣營名稱存在於 `FactionAlignment` 列舉中

5. IF 相關任務欄位不為空 THEN 系統 SHALL 驗證任務名稱格式符合 "[任務名稱] ([遊戲名稱])" 模式

### 需求 6：向後相容性

**使用者故事**：身為系統維護者，我需要確保新增的故事功能不會破壞現有的占卜、解讀和歷史記錄功能。

#### 驗收標準

1. WHEN 故事欄位被新增後 THEN 所有現有的 API 端點 SHALL 繼續正常運作

2. IF 前端未更新為支援故事欄位 THEN 系統 SHALL 仍能正常返回其他卡牌資訊

3. WHEN 執行現有的單元測試時 THEN 所有測試 SHALL 通過，或僅需微調以適配新欄位

4. WHERE `WastelandCard.to_dict()` 方法中 THE 系統 SHALL 包含故事資料但不改變現有欄位的結構

5. IF 資料庫中存在沒有故事內容的舊資料 THEN 系統 SHALL 正常處理並返回 null 或預設值

### 需求 7：效能考量

**使用者故事**：身為效能工程師，我需要確保故事內容的新增不會顯著影響系統的查詢效能和回應時間。

#### 驗收標準

1. WHEN 執行卡牌查詢時 THEN 包含故事內容的查詢回應時間 SHALL 不超過 150ms（95th percentile）

2. IF 批次查詢多張卡牌 THEN 系統 SHALL 支援選擇性載入故事內容以優化效能

3. WHEN 資料庫包含完整的 78 張卡牌故事時 THEN 資料表大小增長 SHALL 不超過 500KB

4. WHERE 頻繁查詢發生時 THE 系統 SHALL 考慮對故事內容實作快取機制（設計階段決定）

5. IF 使用者只需要基本卡牌資訊 THEN 系統 SHALL 允許排除故事欄位以減少資料傳輸量

### 需求 8：故事內容語音朗讀

**使用者故事**：身為使用者，我希望能夠聆聽卡牌故事的語音朗讀，提升沉浸式體驗並支援視覺障礙者的無障礙需求。

#### 驗收標準

1. WHEN 系統生成故事音檔時 THEN 系統 SHALL 利用現有的 Google Cloud TTS 服務（`TTSService`）合成語音

2. WHEN 選擇 TTS 角色時 THEN 系統 SHALL 根據卡牌的陣營屬性選擇適當的角色語音：
   - Brotherhood 相關卡牌使用 `brotherhood_scribe` 或 `brotherhood_paladin`
   - NCR 相關卡牌使用 `ncr_ranger`
   - Legion 相關卡牌使用 `legion_centurion`
   - Raiders 相關卡牌使用 `raider`
   - Vault-Tec 相關卡牌使用 `vault_dweller` 或 `pip_boy`
   - 中立卡牌使用 `wasteland_trader` 或 `ghoul`

3. WHEN 生成音檔後 THEN 系統 SHALL 使用 `AudioStorageService` 將音檔上傳至 Supabase Storage 的 `audio-files` bucket

4. WHEN 儲存音檔元資料時 THEN 系統 SHALL 在 `audio_files` 表中建立記錄，包含：
   - `card_id`: 卡牌 ID
   - `character_id`: 角色 ID（從 `story_faction_involved` 推導）
   - `audio_type`: 設為 `STATIC_CARD`
   - `text_hash`: 故事內容的 SHA256 hash
   - `storage_path`: 格式為 `story/{card_id}/{character_key}.mp3`
   - `storage_url`: Supabase 公開 URL
   - `generation_status`: 初始為 `COMPLETED`

5. IF 卡牌有多個關聯陣營 THEN 系統 SHALL 為每個陣營生成一個音檔版本，讓使用者可選擇不同角色視角

6. WHEN 執行種子資料腳本時 THEN 系統 SHALL 支援兩種音檔生成策略：
   - **預先生成策略**：為 Major Arcana (22 張) 立即生成所有音檔
   - **延遲生成策略**：為 Minor Arcana (56 張) 僅建立資料記錄，首次請求時才生成音檔

7. WHERE API 端點 `/api/v1/cards/{id}` 回應中 THE 系統 SHALL 包含故事音檔 URL：
   ```json
   {
     "story": {
       "background": "故事內容...",
       "audio_urls": {
         "brotherhood_scribe": "https://supabase.../story/card-id/brotherhood_scribe.mp3",
         "ncr_ranger": "https://supabase.../story/card-id/ncr_ranger.mp3"
       }
     }
   }
   ```

8. WHEN 使用者請求播放故事音檔時 THEN 前端 SHALL 使用標準 HTML5 `<audio>` 元素播放，並提供播放控制（播放、暫停、音量）

9. IF 音檔尚未生成（延遲生成策略）THEN 系統 SHALL 透過 `/api/v1/audio/generate` 端點觸發即時生成，並在生成完成後返回 URL

10. WHEN 音檔生成失敗時 THEN 系統 SHALL：
    - 在 `audio_files` 表中標記 `generation_status` 為 `FAILED`
    - 記錄 `error_message`
    - 提供降級方案（使用客戶端 Web Speech API 即時朗讀）

11. WHERE 音檔快取管理中 THE 系統 SHALL 利用現有的 `AudioCacheService` 減少重複的 TTS 請求

12. WHEN 故事文字更新時 THEN 系統 SHALL 偵測 `text_hash` 變更並自動重新生成音檔

---

## 非功能性需求

### 資料品質
- 所有故事內容必須經過 Fallout 世界觀一致性審查
- 繁體中文文法正確，無錯別字
- 故事語氣符合 Fallout 的黑色幽默與後末日風格

### 可維護性
- 故事內容以結構化格式儲存於種子腳本中
- 支援版本控制和內容更新
- 提供清晰的內容編輯指南文件

### 可擴展性
- 資料結構設計允許未來新增更多故事元素（如多語言版本）
- API 設計支援未來的故事篩選、搜尋功能

### 文件要求
- 提供故事內容編寫指南
- 更新 API 文件以反映新增的故事欄位
- 記錄資料庫 schema 變更

---

## 範圍外項目

以下項目**不**包含在此次需求範圍內：

1. **前端展示設計**：故事內容的 UI/UX 設計（將在設計階段決定）
2. **故事動畫**：視覺化故事內容的動畫效果（未來功能）
3. **使用者生成內容**：允許使用者自訂或投稿故事（未來功能）
4. **多語言支援**：英文或其他語言的故事版本（未來功能）
5. **故事互動選擇**：基於故事的分支選擇系統（超出範圍）
6. **進階語音特效**：背景音效、音樂混合、多角色對話（未來功能）

---

## 風險與依賴性

### 技術風險
- **資料遷移風險**：資料庫 schema 變更需要謹慎執行
- **內容創作時間**：為 78 張牌撰寫高品質故事需要大量時間投入
- **TTS API 成本**：Google Cloud TTS 按字符計費，78 張牌的音檔生成需要控制成本
- **音檔存儲空間**：多角色版本的音檔可能佔用較大存儲空間（預估：78 張 × 3 角色 × 2 分鐘 × 1MB ≈ 470MB）

### 依賴性
- 依賴現有的 `WastelandCard` 資料模型
- 依賴 Fallout 官方設定資料（Vault 編號、陣營、任務名稱）
- 依賴 Alembic 資料庫遷移工具
- **依賴現有 TTS 系統**：
  - `TTSService` (Google Cloud TTS 整合)
  - `AudioStorageService` (Supabase Storage 管理)
  - `AudioCacheService` (音檔快取)
  - `audio_files` 資料表
- **依賴 Google Cloud TTS API**：需要有效的 Google Cloud 憑證和 API 配額
- **依賴 Supabase Storage**：需要 `audio-files` bucket 存在且有足夠空間

### 緩解策略
- 使用 Alembic 的 upgrade/downgrade 機制確保遷移可逆
- 分批創作故事內容，優先完成 Major Arcana (22 張)
- 建立故事範本和寫作指南以加速內容創作流程
- **TTS 成本控制**：
  - 採用混合生成策略（Major Arcana 預先生成，Minor Arcana 延遲生成）
  - 每張牌限制為最多 3 個角色版本
  - 利用 `text_hash` 去重機制避免重複生成
- **存儲空間優化**：
  - 使用 MP3 格式（高壓縮率）
  - 設定 Supabase Storage lifecycle 政策（低訪問音檔自動歸檔）
  - 監控 `access_count`，刪除長期未使用的音檔版本

---

*文件版本*: 1.1
*最後更新*: 2025-10-21
*語言*: 繁體中文 (zh-TW)
*變更紀錄*: v1.1 - 新增需求 8：故事內容語音朗讀功能