# Requirements Document

## 專案描述

開始計畫完成關於我們、隱私政策、服務條款、聯絡支援的各個分頁，使用假資料即可，確保內容具有 Fallout 風格與幽默感，其中隱私政策請使用台灣的 best practices。

## 簡介

本專案旨在為 Wasteland Tarot 平台建立四個核心靜態資訊頁面，提供用戶完整的平台資訊、法律保障與支援管道。所有頁面將採用 Fallout 宇宙的廢土美學與 Pip-Boy 終端機風格，結合後啟示錄黑色幽默與實用資訊，為用戶創造沉浸式體驗。隱私政策將嚴格遵循台灣《個人資料保護法》（PDPA）之最佳實踐。

## Requirements

### Requirement 1: 關於我們頁面
**目標：** 作為平台訪客或用戶，我想了解 Wasteland Tarot 的起源、願景與團隊，以便決定是否信任並使用此服務

#### 驗收標準

1. WHEN 用戶訪問「關於我們」頁面 THEN 系統 SHALL 顯示平台起源故事，採用廢土倖存者日誌風格撰寫
2. WHEN 頁面載入完成 THEN 系統 SHALL 展示平台核心價值與使命宣言，使用 Vault-Tec 企業風格呈現
3. WHEN 用戶瀏覽團隊介紹區塊 THEN 系統 SHALL 顯示虛構團隊成員資料，包含廢土角色設定（如「首席輻射占卜師」、「Pip-Boy 介面工程師」等）
4. WHEN 用戶滾動至頁面底部 THEN 系統 SHALL 提供平台發展時間軸，以終端機記錄風格呈現
5. WHERE 內容呈現區域 THE 系統 SHALL 使用 Fallout 幽默文案，包含核彈、輻射、瓶蓋等元素的隱喻
6. WHEN 用戶與互動元素互動 THEN 系統 SHALL 播放 Pip-Boy 風格音效（選配）

### Requirement 2: 隱私政策頁面（台灣 PDPA 合規）
**目標：** 作為平台用戶，我想了解平台如何收集、處理與保護我的個人資料，以便安心使用服務

#### 驗收標準

1. WHEN 用戶訪問隱私政策頁面 THEN 系統 SHALL 顯示符合台灣《個人資料保護法》之完整隱私政策文件
2. WHEN 頁面載入 THEN 系統 SHALL 在頁首清楚標示最後更新日期與生效日期
3. WHEN 用戶瀏覽政策內容 THEN 系統 SHALL 包含以下必要章節：
   - 個人資料蒐集項目（如：電子郵件、閱讀紀錄、Karma 值）
   - 蒐集目的與法律依據
   - 資料利用方式與範圍
   - 資料保存期限
   - 用戶權利（查詢、更正、刪除、停止處理）
   - Cookie 與追蹤技術說明
   - 第三方服務使用（Supabase、AI 服務商）
   - 資料安全措施
   - 政策變更通知機制
   - 聯絡資訊
4. WHEN 用戶閱讀政策文字 THEN 系統 SHALL 使用正式法律用語為主，並在適當處加入 Fallout 風格註解（如「您的資料受到比避難所大門更嚴密的保護」）
5. IF 用戶點擊特定條款 THEN 系統 SHALL 展開詳細說明或補充資訊
6. WHERE 涉及第三方服務商 THE 系統 SHALL 明確列出服務商名稱、用途與其隱私政策連結
7. WHEN 用戶滾動至頁面底部 THEN 系統 SHALL 提供「我已閱讀並同意」確認選項（僅供註冊流程使用）
8. WHILE 頁面顯示期間 THE 系統 SHALL 確保文字清晰可讀，符合 WCAG AA 無障礙標準

### Requirement 3: 服務條款頁面
**目標：** 作為平台用戶，我想了解使用服務的規則與責任，以便遵守約定並保護自身權益

#### 驗收標準

1. WHEN 用戶訪問服務條款頁面 THEN 系統 SHALL 顯示完整的使用者協議，採用終端機協議風格呈現
2. WHEN 頁面載入 THEN 系統 SHALL 在頁首標示協議版本號（如「V1.0 - Wasteland Protocol」）與生效日期
3. WHEN 用戶瀏覽條款內容 THEN 系統 SHALL 包含以下章節：
   - 服務範圍與性質說明（非商業粉絲專案聲明）
   - 用戶資格與註冊要求（18+ 年齡限制）
   - 禁止行為清單（如：濫用 API、破壞系統、散佈惡意內容）
   - 智慧財產權聲明（Fallout IP 歸 Bethesda 所有）
   - 免責聲明（占卜僅供娛樂參考）
   - Karma 系統與虛擬獎勵說明
   - 帳號終止與暫停條件
   - 爭議解決機制
   - 管轄法院（台灣法律管轄）
4. WHERE 法律條款區塊 THE 系統 SHALL 使用清晰的階層式編號（如 1.1, 1.2）方便引用
5. WHEN 用戶閱讀幽默化條款 THEN 系統 SHALL 在嚴肅法律文字中穿插 Fallout 式幽默（如「違反條款者將被流放至輻射區」）
6. IF 條款涉及第三方智慧財產 THEN 系統 SHALL 明確標註版權歸屬與合理使用聲明
7. WHEN 用戶完成閱讀 THEN 系統 SHALL 提供「返回首頁」與「聯絡支援」快速連結

### Requirement 4: 聯絡支援頁面
**目標：** 作為平台用戶，我想快速找到回饋問題或尋求協助的管道，以便解決使用上的疑問

#### 驗收標準

1. WHEN 用戶訪問聯絡支援頁面 THEN 系統 SHALL 顯示多種聯絡方式，採用 Pip-Boy 通訊介面風格
2. WHEN 頁面載入 THEN 系統 SHALL 提供以下支援管道：
   - 電子郵件聯絡表單（模擬資料：support@wasteland-tarot.vault）
   - FAQ 常見問題區塊
   - Discord 社群連結（假資料）
   - GitHub Issues 連結（假資料）
3. WHEN 用戶填寫聯絡表單 THEN 系統 SHALL 包含以下欄位：
   - 姓名/暱稱（必填）
   - 電子郵件（必填，需驗證格式）
   - 問題類別（下拉選單：技術問題、帳號問題、建議回饋、其他）
   - 訊息內容（必填，最少 20 字）
4. WHEN 用戶提交表單 THEN 系統 SHALL 驗證所有必填欄位並顯示錯誤提示（如有）
5. IF 表單驗證通過 THEN 系統 SHALL 顯示成功訊息（如「您的訊息已送達避難所控制中心」）並清空表單
6. WHERE FAQ 區塊 THE 系統 SHALL 顯示至少 5 個常見問題與解答，使用可摺疊式設計
7. WHEN 用戶點擊 FAQ 問題 THEN 系統 SHALL 展開/收合對應答案，播放終端機展開音效（選配）
8. WHILE 用戶瀏覽支援頁面 THE 系統 SHALL 在側邊欄顯示預估回覆時間（如「通常在 48 小時內回覆」）
9. WHEN 用戶於手機裝置訪問 THEN 系統 SHALL 自動調整表單佈局為單欄式，確保易用性

### Requirement 5: 通用 UI/UX 設計要求（Fallout 風格）
**目標：** 作為平台用戶，我想體驗一致的 Fallout 風格視覺與互動設計，以便獲得沉浸式廢土體驗

#### 驗收標準

1. WHEN 任一靜態頁面載入 THEN 系統 SHALL 應用統一的 Pip-Boy 綠色單色配色方案（#00FF41 或類似色）
2. WHEN 頁面呈現文字內容 THEN 系統 SHALL 使用等寬字型（Monospace）模擬終端機風格
3. WHERE 頁面背景 THE 系統 SHALL 顯示像素化雜訊或掃描線效果（Dither/Scanline）
4. WHEN 用戶與連結或按鈕互動 THEN 系統 SHALL 顯示 Pip-Boy 風格的 hover 效果（如邊框發光、字元閃爍）
5. IF 頁面包含章節標題 THEN 系統 SHALL 使用 ASCII 藝術或終端機分隔線（如 `==== SECTION ====`）
6. WHEN 用戶捲動頁面 THEN 系統 SHALL 顯示自訂捲軸樣式，符合 Pip-Boy 美學
7. WHERE 頁面 Header THE 系統 SHALL 包含統一導航列，連結至四個靜態頁面與首頁
8. WHEN 頁面 Footer 顯示 THEN 系統 SHALL 包含版權聲明（如「© 2077 Wasteland Tarot - A non-commercial fan project」）與快速連結
9. WHILE 頁面載入期間 THE 系統 SHALL 顯示 Fallout 風格載入動畫（如輻射符號旋轉、終端機文字載入）
10. WHEN 用戶切換頁面 THEN 系統 SHALL 播放頁面轉場動畫（選配，如終端機畫面切換效果）

### Requirement 6: 響應式設計與無障礙性
**目標：** 作為任何裝置或能力的用戶，我想順暢訪問所有靜態頁面，以便獲得平等的資訊存取權

#### 驗收標準

1. WHEN 用戶於桌面裝置（≥1280px）訪問 THEN 系統 SHALL 以多欄佈局顯示內容，最大化閱讀舒適度
2. WHEN 用戶於平板裝置（768px - 1279px）訪問 THEN 系統 SHALL 調整為雙欄或單欄佈局，保持可讀性
3. WHEN 用戶於行動裝置（≤767px）訪問 THEN 系統 SHALL 採用單欄佈局，所有互動元素可觸控
4. WHERE 所有頁面 THE 系統 SHALL 確保色彩對比度符合 WCAG AA 標準（4.5:1 以上）
5. WHEN 視障用戶使用螢幕閱讀器 THEN 系統 SHALL 提供完整的語意化 HTML 結構與 ARIA 標籤
6. IF 頁面包含圖片或圖示 THEN 系統 SHALL 提供描述性 alt 文字（如「Vault-Tec 標誌」）
7. WHEN 用戶僅使用鍵盤導航 THEN 系統 SHALL 確保所有互動元素可聚焦且有明確的 focus 樣式
8. WHILE 用戶調整瀏覽器字體大小至 200% THE 系統 SHALL 保持佈局不破損，內容不重疊
9. WHEN 用戶於低頻寬環境載入頁面 THEN 系統 SHALL 優先載入文字內容，漸進式載入視覺效果
10. WHERE 表單輸入欄位 THE 系統 SHALL 提供清晰的錯誤訊息與即時驗證回饋

### Requirement 7: 內容管理與維護性
**目標：** 作為開發團隊，我們想輕鬆更新與維護靜態頁面內容，以便快速回應政策變更或資訊更新

#### 驗收標準

1. WHEN 開發者需要更新頁面內容 THEN 系統 SHALL 將文案獨立於元件邏輯，儲存於 Markdown 或 JSON 檔案
2. WHERE 隱私政策與服務條款 THE 系統 SHALL 支援版本控制，記錄每次修訂的日期與變更摘要
3. WHEN 政策文件更新 THEN 系統 SHALL 自動更新頁首的「最後更新日期」時間戳
4. IF 頁面內容包含多語言支援（未來擴充） THEN 系統 SHALL 採用 i18n 架構，方便新增語言版本
5. WHEN 開發者檢視原始碼 THEN 系統 SHALL 提供清晰的註解，說明各區塊功能與資料來源
6. WHERE 常見問題（FAQ） THE 系統 SHALL 允許透過設定檔新增/移除問題，無需修改程式碼

---

## 非功能性需求

### 效能需求
- 頁面初次載入時間 < 2 秒（Desktop）
- 頁面初次載入時間 < 3 秒（Mobile 3G）
- 所有靜態資源應啟用快取機制

### 安全需求
- 聯絡表單需防範 XSS 與 CSRF 攻擊
- 所有外部連結應使用 `rel="noopener noreferrer"`
- Email 地址需進行基本格式驗證

### 相容性需求
- 支援最新版本的 Chrome、Firefox、Safari、Edge
- 支援 iOS Safari 與 Android Chrome
- 降級優雅處理舊版瀏覽器（顯示基本內容）

### SEO 需求
- 所有頁面包含適當的 meta 標籤（title、description）
- 使用語意化 HTML5 標籤（header、nav、main、footer）
- 提供 sitemap.xml 包含所有靜態頁面

---

## 附錄：假資料範例

### 關於我們 - 團隊成員範例
- **首席輻射占卜師**（Chief Rad-Diviner）- 核戰後第三代塔羅傳人
- **Pip-Boy 介面工程師**（Pip-Boy UI Engineer）- 前 Vault-Tec 終端機專家
- **廢土文案寫手**（Wasteland Copywriter）- 專精後啟示錄黑色幽默

### 聯絡支援 - FAQ 範例
1. **Q: 為什麼我的 Karma 值一直下降？**
   A: 可能是您在讀牌時選擇了「掠奪者」陣營的建議。試試善良一點吧，輻射蟑螂也需要愛。

2. **Q: AI 解讀準確嗎？**
   A: 和避難所的食物配給一樣準確 —— 大部分時候還算可靠，但偶爾會給你驚喜。

3. **Q: 可以離線使用嗎？**
   A: 很遺憾不行。我們的 AI 占卜師需要網路連線才能接收宇宙輻射訊號。

### 隱私政策 - 第三方服務商
- Supabase（資料庫與身份驗證）
- Anthropic Claude / OpenAI / Google Gemini（AI 解讀服務）
- Zeabur（雲端部署平台）
