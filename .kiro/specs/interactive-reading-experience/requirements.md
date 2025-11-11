# Requirements Document

## Project Description (Input)

重新設計塔羅牌解讀的核心體驗，解決兩個關鍵問題：

### 問題 1：缺乏儀式感的抽卡體驗
**現狀**：系統直接隨機分配卡片給用戶，沒有「抽卡」的參與感
**問題**：用戶感覺不到「我選擇了這張命運之牌」，缺乏塔羅牌最重要的儀式感和心理投入
**影響**：第一次體驗不佳，用戶無法建立與塔羅牌的連結

### 問題 2：缺乏歷史回顧功能
**現狀**：用戶無法快速查看過去的解讀記錄
**問題**：沒有「累積感」，用戶看不到自己的「塔羅旅程」
**影響**：用戶留存率低，使用一次後不再回來

### 解決方案：互動式解讀體驗（Interactive Reading Experience）

建立一個完整的解讀體驗流程，包含：

#### 1. 互動式抽卡流程
- **洗牌動畫**：視覺化呈現「洗牌」過程，營造儀式感
- **選牌互動**：用戶可以「點擊」或「拖動」來選擇卡片
- **翻牌揭示**：緩慢的翻牌動畫，建立期待感
- **心理投入**：讓用戶感覺「我選擇了這張牌」（即使背後仍是隨機）

#### 2. 解讀歷史儀表板
- **時間軸視圖**：按時間排序的解讀記錄
- **快速預覽**：卡片縮圖 + 解讀摘要
- **詳細查看**：點擊後展開完整的歷史解讀
- **搜尋與篩選**：按日期、牌陣類型等篩選

#### 3. 無縫流程整合
- **抽卡後提示**：「查看我的解讀歷史」入口
- **歷史中再抽**：「再抽一次」按鈕，形成使用閉環
- **持續參與**：建立「第一次體驗 → 歷史回顧 → 再次使用」的循環

### 核心設計原則（Linus Style）

1. **"Good Taste"**：
   - 不是兩個獨立功能，而是一個流暢的體驗
   - 消除「抽卡」和「查看歷史」之間的割裂感

2. **"Solve Real Problems"**：
   - ✅ 問題 1：缺乏儀式感（真實問題）
   - ✅ 問題 2：用戶留存率低（真實數據）
   - ❌ 不做：過度複雜的 3D 動畫或物理引擎

3. **"Keep It Simple"**：
   - 洗牌：簡單的 CSS 動畫即可
   - 選牌：點擊或拖動，不需要複雜手勢
   - 歷史：清單 + 詳情頁，不需要複雜的視覺化

4. **"Never Break Userspace"**：
   - 保留現有的隨機性邏輯
   - 不改變 API 結構，只改變前端體驗
   - 向後兼容現有的解讀記錄

### 成功指標

- **參與感**：用戶完成抽卡流程的比例 > 90%
- **留存率**：7 天留存率提升 > 30%
- **回訪**：從歷史頁面發起新解讀的比例 > 20%
- **速度**：抽卡流程總時間 < 5 秒
- **歷史載入**：< 1 秒

## Requirements

### 需求 1：互動式卡牌抽取介面

**目標：** 作為一名廢土居民，我希望能夠以視覺化且互動的方式抽取塔羅牌，讓我感受到真實的抽卡儀式感。

#### Acceptance Criteria

1. WHEN 使用者進入新解讀頁面 THEN 系統 SHALL 顯示包含 78 張廢土塔羅牌的虛擬牌組，並呈現 Fallout Pip-Boy 風格的介面
2. WHEN 使用者將滑鼠懸停於牌組上方 THEN 系統 SHALL 顯示互動式的視覺回饋（如輻射光暈效果或卡片浮動）
3. WHEN 使用者點擊牌組 THEN 系統 SHALL 使用 Fisher-Yates Shuffle 演算法進行無偏差隨機洗牌 AND 執行「輻射洗牌」動畫，持續時間為 1.5-2 秒
4. WHEN 洗牌動畫執行時 THEN 系統 SHALL 使用 Framer Motion 的 layout animation 功能 AND 確保動畫幀率維持在 60 FPS
5. IF 洗牌動畫持續時間超過 2 秒 OR 幀率低於 30 FPS THEN 系統 SHALL 自動降級為簡單的淡入淡出效果
6. WHEN 洗牌動畫完成 THEN 系統 SHALL 根據選定的牌陣類型展開對應數量的卡片（單張/3 張/5 張/10 張）
7. WHEN 使用者點擊展開的卡片背面 THEN 系統 SHALL 播放卡片翻轉動畫（含 Geiger 計數器音效），並顯示卡片正面的廢土風格圖像
8. WHEN 卡片翻轉動畫執行時 THEN 系統 SHALL 僅使用 CSS transform 和 opacity 屬性 AND 避免觸發瀏覽器 reflow
9. WHEN 所有必要卡片皆已翻開 THEN 系統 SHALL 自動進入解讀生成階段
10. IF 使用者在抽卡過程中離開頁面 AND 未完成解讀 THEN 系統 SHALL 在使用者返回時提示「繼續未完成的解讀」選項
11. WHILE 卡片翻轉動畫播放時 THE 系統 SHALL 禁用其他卡片的點擊操作，避免衝突
12. WHERE 使用者使用觸控裝置時 THE 系統 SHALL 支援長按卡片預覽、滑動洗牌等手勢操作
13. IF 洗牌或翻牌動畫的效能指標不符合標準（< 60 FPS）THEN 系統 SHALL 記錄效能日誌並自動調整動畫品質

---

### 需求 2：即時 AI 解讀生成與串流顯示

**目標：** 作為一名尋求指引的使用者，我希望能夠即時看到 AI 生成的解讀內容，並根據我選擇的角色聲音獲得不同風格的建議。

#### Acceptance Criteria

1. WHEN 所有卡片翻開後 THEN 系統 SHALL 自動向後端請求 AI 解讀，並顯示「終端機載入中」動畫
2. WHEN 後端開始串流 AI 回應 THEN 系統 SHALL 使用 Server-Sent Events (SSE) 協定接收資料 AND 在收到第一批資料後的 200 毫秒內開始渲染
3. WHEN 打字機效果顯示時 THEN 系統 SHALL 以每秒 30-50 字元的速度顯示 AND 加入隨機變化 ±20% 以模擬真人打字
4. WHEN AI 正在生成解讀 AND 使用者選擇了特定角色聲音（如 Mr. Handy、Brotherhood Scribe）THEN 系統 SHALL 根據角色風格調整解讀的語氣與用詞
5. IF 使用者的 Karma 等級為 Very Good 或 Very Evil THEN 系統 SHALL 在解讀中融入對應的道德觀點與建議
6. IF 使用者已設定派系傾向（Brotherhood of Steel、NCR、Raiders、Vault-Tec）THEN 系統 SHALL 在解讀中反映該派系的分析風格
7. WHEN AI 解讀生成完成 THEN 系統 SHALL 顯示「解讀完成」提示，並啟用「儲存至 Holotape Archive」按鈕
8. IF SSE 連線中斷 OR API 回應超時（> 30 秒）THEN 系統 SHALL 使用 Exponential Backoff 重連機制（初始延遲 1s，最大延遲 30s，最多重試 5 次）
9. IF AI 解讀生成過程中發生錯誤 THEN 系統 SHALL 顯示友善的錯誤訊息（如「輻射干擾，請稍後再試」），並提供重試選項
10. WHILE AI 解讀正在串流顯示 THE 系統 SHALL 允許使用者暫停串流、加速顯示（2x 速度）或跳至完整內容
11. WHERE 使用者在解讀頁面時 THE 系統 SHALL 提供「語音朗讀」功能，使用 Web Speech API 朗讀解讀內容
12. IF 打字機效果的渲染效能低於 30 FPS THEN 系統 SHALL 自動調整為批次渲染（每批 10 個字元）以提升效能

---

### 需求 3：解讀歷史儀表板（Holotape Archive）

**目標：** 作為一名經常使用平台的使用者，我希望能夠輕鬆查看、管理和回顧我過去的所有解讀記錄，以便追蹤我的決策歷程。

#### Acceptance Criteria

1. WHEN 使用者導航至「Holotape Archive」頁面 THEN 系統 SHALL 顯示使用者所有已儲存的解讀記錄，以時間倒序排列
2. WHEN 使用者查看解讀清單 THEN 系統 SHALL 對每一筆記錄顯示：解讀日期、牌陣類型、使用的角色聲音、以及該次解讀的主題/問題（若有）
3. WHEN 使用者點擊某一筆解讀記錄 THEN 系統 SHALL 展開該解讀的完整內容，包括抽到的卡片、AI 解讀文本、以及當時的 Karma 與派系狀態
4. WHEN 使用者在解讀歷史中搜尋關鍵字（如「愛情」、「事業」）THEN 系統 SHALL 使用即時過濾（interactive filtering）並在輸入後 300ms 內更新結果
5. WHEN 使用者套用篩選器（如標籤、日期範圍）THEN 系統 SHALL 使用 Chips/Pills UI 模式顯示已選篩選器 AND 提供單獨移除或「清除全部」選項
6. WHEN 篩選器面板顯示時 THEN 系統 SHALL 在每個篩選選項旁顯示可用項目數量（如「愛情 (12)」）以避免零結果搜尋
7. IF 使用者的解讀記錄超過 100 筆 THEN 系統 SHALL 使用 TanStack Virtual 虛擬捲動技術 AND 確保頁面載入時間 < 5 秒
8. WHEN 使用者捲動解讀歷史列表 THEN 系統 SHALL 使用 Skeleton Screen 而非 Loading Spinner 顯示載入狀態
9. WHEN 使用者選擇一或多筆解讀 AND 點擊「匯出」按鈕 THEN 系統 SHALL 生成 PDF 或文字檔案，供使用者下載
10. WHEN 使用者選擇一筆解讀 AND 點擊「分享」按鈕 THEN 系統 SHALL 生成匿名分享連結（可設定密碼保護）
11. WHEN 使用者刪除一筆解讀記錄 THEN 系統 SHALL 顯示確認對話框，並在確認後將該記錄移至「回收站」（30 天後永久刪除）
12. WHILE 使用者瀏覽解讀歷史 THE 系統 SHALL 顯示統計資訊，如：總解讀次數、最常使用的牌陣、最常抽到的卡片
13. WHERE 使用者在手機上查看解讀歷史 THE 系統 SHALL 提供卡片檢視模式，以最佳化小螢幕閱讀體驗
14. IF 虛擬捲動列表的渲染效能低於 30 FPS THEN 系統 SHALL 增加項目高度估計值以減少重新計算次數

---

### 需求 4：解讀記錄的標籤與分類系統

**目標：** 作為一名進階使用者，我希望能夠為我的解讀記錄新增標籤和分類，方便日後查詢和整理。

#### Acceptance Criteria

1. WHEN 使用者儲存一筆新解讀 THEN 系統 SHALL 提供選項讓使用者新增自訂標籤（如 #愛情、#事業、#健康）
2. WHEN 使用者在解讀歷史頁面點擊標籤 THEN 系統 SHALL 顯示所有帶有該標籤的解讀記錄
3. WHEN 使用者為解讀選擇「問題類別」（Love、Career、Health、Survival、Faction Relations）THEN 系統 SHALL 將該解讀歸類至對應類別
4. WHEN 使用者查看特定類別的解讀記錄 THEN 系統 SHALL 顯示該類別的統計資訊（如該類別的總解讀次數、平均 Karma 影響）
5. IF 使用者建立超過 20 個自訂標籤 THEN 系統 SHALL 提示使用者「標籤過多可能影響查詢效率」，並建議合併類似標籤
6. WHILE 使用者在解讀詳情頁面時 THE 系統 SHALL 允許使用者編輯該解讀的標籤與類別
7. WHERE 使用者在標籤管理介面時 THE 系統 SHALL 提供標籤重新命名、合併、刪除等批次操作功能

---

### 需求 5：解讀流程的無縫整合與導航

**目標：** 作為一名使用者，我希望在抽卡、解讀生成、查看歷史之間的切換是流暢且直覺的，不需要多次點擊或離開當前頁面。

#### Acceptance Criteria

1. WHEN 使用者完成一次解讀 THEN 系統 SHALL 在頁面底部顯示快捷操作按鈕：「再抽一次」、「查看歷史」、「分享此解讀」
2. WHEN 使用者點擊「再抽一次」THEN 系統 SHALL 回到牌陣選擇頁面，並保留上次選擇的角色聲音與問題類別設定
3. WHEN 使用者點擊「查看歷史」THEN 系統 SHALL 導航至 Holotape Archive 頁面，並自動捲動至最新的解讀記錄
4. WHEN 使用者在解讀歷史頁面點擊「開始新解讀」THEN 系統 SHALL 導航至新解讀頁面，並保留使用者在歷史頁面中選擇的任何篩選設定（如標籤、類別）
5. IF 使用者在抽卡過程中點擊瀏覽器返回鈕 THEN 系統 SHALL 顯示確認對話框：「確定要離開嗎？未完成的解讀將不會被儲存」
6. WHEN 使用者在解讀生成中途離開頁面 AND 稍後返回 THEN 系統 SHALL 自動恢復該解讀的生成進度（若 AI 尚未完成）
7. WHILE 使用者在任何解讀相關頁面時 THE 系統 SHALL 在頂部導航列顯示目前的流程階段（如「選擇牌陣 → 抽卡中 → 解讀生成 → 完成」）
8. WHERE 使用者在手機上操作時 THE 系統 SHALL 提供滑動手勢以快速切換解讀流程的不同階段

---

### 需求 6：個人化解讀體驗引擎

**目標：** 作為一名長期使用者，我希望系統能根據我的歷史記錄、Karma 變化、以及派系傾向，提供更個人化的解讀建議。

#### Acceptance Criteria

1. WHEN 使用者累積 10 次以上的解讀記錄 THEN 系統 SHALL 開始分析使用者的偏好（如常用牌陣、常見問題類別）
2. WHEN 使用者開始新解讀 AND 已有個人化資料 THEN 系統 SHALL 在牌陣選擇頁面推薦「基於你的歷史，推薦使用 Brotherhood Council 牌陣」
3. IF 使用者的 Karma 在過去 30 天內發生顯著變化（如從 Good 變為 Evil）THEN 系統 SHALL 在下次解讀時提示「你的 Karma 已改變，這可能影響解讀風格」
4. IF 使用者對某一派系的親和度達到 80 以上 THEN 系統 SHALL 自動推薦該派系對應的角色聲音
5. WHEN 使用者查看個人化儀表板 THEN 系統 SHALL 顯示：歷史趨勢圖（Karma 變化、派系親和度變化）、最常抽到的卡片、解讀主題分佈
6. WHILE 系統生成個人化建議時 THE 系統 SHALL 確保資料隱私，所有分析在使用者裝置本地或後端私密環境中進行
7. WHERE 使用者在設定頁面時 THE 系統 SHALL 提供選項讓使用者選擇是否啟用「個人化推薦」功能

---

### 需求 7：效能與載入優化

**目標：** 作為一名使用者，我希望在抽卡、解讀生成、查看歷史等操作時，系統能保持流暢且快速的回應。

#### Acceptance Criteria

1. WHEN 使用者進入新解讀頁面 THEN 系統 SHALL 在 2 秒內完成頁面初始化（包含牌組載入、動畫準備）
2. WHEN 使用者執行洗牌動畫 THEN 系統 SHALL 保持 60 FPS 的動畫流暢度，即使在低階裝置上
3. WHEN 後端 API 回應 AI 解讀 THEN 系統 SHALL 在 5 秒內開始串流第一批文字內容
4. WHEN 使用者查看解讀歷史 AND 記錄超過 100 筆 THEN 系統 SHALL 採用虛擬捲動技術，確保頁面不會因資料量大而卡頓
5. IF 使用者的網路連線速度較慢（< 1 Mbps）THEN 系統 SHALL 自動降低動畫品質，優先確保功能可用性
6. WHEN 使用者在抽卡頁面切換至其他分頁 THEN 系統 SHALL 暫停非必要的動畫與音效，以節省資源
7. WHILE 系統載入大量解讀歷史資料時 THE 系統 SHALL 顯示骨架屏（Skeleton Screen），而非空白頁面或 Loading Spinner
8. WHERE 使用者在低效能裝置上操作時 THE 系統 SHALL 自動偵測裝置效能，並關閉部分特效（如粒子效果、3D 動畫）

---

### 需求 8：無障礙性與多裝置支援

**目標：** 作為一名有無障礙需求或使用不同裝置的使用者，我希望能夠順暢地使用所有解讀功能，不受限於裝置或能力。

#### Acceptance Criteria

1. WHEN 使用螢幕閱讀器的使用者進入抽卡頁面 THEN 系統 SHALL 提供語音提示：「請點擊牌組以開始洗牌」
2. WHEN 使用者使用鍵盤導航 THEN 系統 SHALL 支援 Tab 鍵切換焦點、Enter/Space 鍵確認操作、Escape 鍵關閉對話框
3. WHEN 使用者在手機上抽卡 THEN 系統 SHALL 優化觸控區域（最小 44×44 像素），確保手指操作的準確性
4. WHEN 使用者在平板或小尺寸螢幕上查看解讀歷史 THEN 系統 SHALL 自動調整版面佈局，確保資訊可讀性
5. IF 使用者啟用「高對比模式」或「深色模式」THEN 系統 SHALL 確保所有 UI 元素（包含卡片、按鈕、文字）符合 WCAG AA 對比標準
6. WHEN 使用者在解讀頁面使用語音朗讀功能 THEN 系統 SHALL 支援調整朗讀速度、暫停/繼續、以及重新朗讀段落
7. WHILE 動畫播放時 THE 系統 SHALL 提供「減少動畫」選項，讓對動畫敏感的使用者能關閉動效
8. IF 使用者的作業系統設定為「減少動畫」(prefers-reduced-motion: reduce) THEN 系統 SHALL 自動停用所有 transform 動畫（位移、縮放、旋轉）AND 保留 opacity 與 backgroundColor 變化
9. WHEN 使用者啟用「減少動畫」模式 THEN 系統 SHALL 將所有動畫持續時間設為 0ms OR 使用立即過渡效果
10. WHERE 使用者在橫向或直向螢幕模式切換時 THE 系統 SHALL 自動調整介面佈局，無需重新載入頁面
11. IF 使用者的瀏覽器不支援 Web Animations API THEN 系統 SHALL 自動降級為 CSS transitions AND 確保核心功能仍可正常運作

---

### 需求 9：錯誤處理與容錯機制

**目標：** 作為一名使用者，當系統發生錯誤時，我希望能收到清楚的提示，並有簡單的方式恢復或重試操作。

#### Acceptance Criteria

1. WHEN AI 解讀 API 回應超時（> 30 秒）THEN 系統 SHALL 顯示錯誤訊息：「輻射干擾，連線中斷。請稍後再試」，並提供「重試」按鈕
2. WHEN 使用者的網路連線中斷 THEN 系統 SHALL 顯示離線提示：「偵測到離線狀態，部分功能暫時無法使用」
3. IF 使用者嘗試儲存解讀時後端回應 500 錯誤 THEN 系統 SHALL 將解讀資料暫存於瀏覽器 LocalStorage，並在連線恢復後自動重試
4. WHEN 使用者輸入無效的搜尋關鍵字（如特殊符號、過長字串）THEN 系統 SHALL 顯示友善的提示：「請輸入有效的關鍵字（1-50 個字元）」
5. IF 使用者的瀏覽器不支援某些功能（如 Web Speech API）THEN 系統 SHALL 顯示替代方案（如「您的瀏覽器不支援語音朗讀，建議使用 Chrome 或 Edge」）
6. WHEN 系統偵測到異常行為（如使用者在 1 秒內點擊抽卡按鈕 10 次）THEN 系統 SHALL 暫時禁用該操作，並顯示提示：「請稍候再試」
7. WHILE 解讀生成過程中發生錯誤 THE 系統 SHALL 記錄錯誤日誌（包含使用者 ID、時間戳、錯誤類型），並在後台自動回報給開發團隊
8. WHERE 使用者在解讀歷史頁面遇到資料載入失敗 THE 系統 SHALL 提供「重新載入」按鈕，並保留使用者當前的篩選與排序設定

---

### 需求 10：社交分享與隱私控制

**目標：** 作為一名使用者，我希望能夠分享我的解讀結果給朋友，同時保有對分享內容的控制權。

#### Acceptance Criteria

1. WHEN 使用者點擊「分享此解讀」按鈕 THEN 系統 SHALL 顯示分享選項：社交媒體（Facebook、Twitter/X）、複製連結、匯出為圖片
2. WHEN 使用者選擇「複製連結」THEN 系統 SHALL 生成唯一的匿名分享連結（格式：`https://wasteland-tarot.com/share/{uuid}`）
3. WHEN 訪客透過分享連結訪問解讀 THEN 系統 SHALL 顯示該解讀的卡片、解讀文本，但隱藏使用者的個人資訊（如帳號、Karma、派系）
4. IF 使用者在分享前勾選「需要密碼保護」選項 THEN 系統 SHALL 要求設定 4-8 位數密碼，訪客需輸入正確密碼才能查看解讀
5. WHEN 使用者選擇「匯出為圖片」THEN 系統 SHALL 生成一張包含卡片圖像與解讀摘要的美觀圖片（尺寸：1200×630px，適合社交媒體）
6. WHEN 使用者在設定頁面管理分享連結 THEN 系統 SHALL 顯示所有已分享的連結清單，並提供「撤銷分享」選項
7. IF 使用者撤銷某一分享連結 THEN 系統 SHALL 使該連結失效，訪客將看到「此解讀已被擁有者撤回」的提示
8. WHILE 分享連結有效期間 THE 系統 SHALL 追蹤該連結的訪問次數（僅顯示給解讀擁有者）
9. WHERE 使用者在社交媒體分享時 THE 系統 SHALL 提供預設文案（如「我在 Wasteland Tarot 抽到了這些牌！」），但允許使用者自訂

---

## 非功能性需求

### NFR-1: 效能指標

**目標：** 確保系統在各種裝置與網路環境下都能保持高效能表現。

#### Acceptance Criteria

1. WHEN 使用者在桌面裝置（4G 網路）上載入新解讀頁面 THEN 系統 SHALL 在 3 秒內完成首次內容繪製（FCP）
2. WHEN 使用者在手機裝置（3G 網路）上載入解讀歷史頁面 THEN 系統 SHALL 在 5 秒內完成可互動時間（TTI）
3. WHEN 使用者執行任何互動操作（如點擊按鈕、翻轉卡片）THEN 系統 SHALL 在 100 毫秒內給予視覺回饋
4. WHEN 後端 AI 服務回應串流資料 THEN 系統 SHALL 在收到第一批資料後的 200 毫秒內開始渲染文字
5. IF 使用者的解讀歷史記錄超過 500 筆 THEN 系統 SHALL 採用分頁或無限捲動技術，確保頁面載入時間不超過 5 秒
6. WHILE 使用者在低效能裝置上操作時 THE 系統 SHALL 自動偵測裝置效能，並調整動畫品質與資料載入策略

---

### NFR-2: 可用性與易用性

**目標：** 提供直覺且易於學習的使用者介面，降低使用門檻。

#### Acceptance Criteria

1. WHEN 新使用者首次進入抽卡頁面 THEN 系統 SHALL 顯示簡短的引導提示（可跳過），說明如何進行抽卡操作
2. WHEN 使用者在任何頁面遇到不熟悉的功能 THEN 系統 SHALL 提供「?」圖示的工具提示，點擊後顯示該功能的簡短說明
3. WHEN 使用者完成首次解讀 THEN 系統 SHALL 顯示祝賀訊息：「恭喜完成首次解讀！建議你查看 Holotape Archive 以回顧記錄」
4. IF 使用者在 30 秒內未執行任何操作 AND 頁面有待完成的步驟 THEN 系統 SHALL 顯示輕微的視覺提示（如閃爍按鈕邊框）
5. WHILE 使用者操作複雜流程（如匯出多筆解讀）時 THE 系統 SHALL 顯示進度條與目前步驟說明

---

### NFR-3: 安全性與隱私

**目標：** 保護使用者的個人資料與解讀記錄，確保資料不會被未授權存取。

#### Acceptance Criteria

1. WHEN 使用者儲存解讀記錄 THEN 系統 SHALL 使用 HTTPS 加密傳輸資料至後端
2. WHEN 使用者登入帳號 THEN 系統 SHALL 使用 JWT Token 進行身份驗證，Token 有效期為 30 分鐘
3. IF 使用者的 Token 過期 THEN 系統 SHALL 自動導向登入頁面，並在登入成功後恢復上次的頁面狀態
4. WHEN 使用者查看解讀歷史 THEN 系統 SHALL 確保每位使用者只能存取自己的解讀記錄，無法查看他人資料
5. IF 使用者選擇刪除帳號 THEN 系統 SHALL 在 30 天內永久刪除該使用者的所有解讀記錄與個人資料
6. WHILE 使用者使用分享功能時 THE 系統 SHALL 移除解讀記錄中的所有個人識別資訊（PII），如使用者 ID、Email、IP 地址
7. WHERE 使用者在公共網路環境下操作時 THE 系統 SHALL 建議使用者啟用「隱私模式」，避免敏感資訊被快取

---

### NFR-4: 可擴展性與維護性

**目標：** 確保系統架構能夠支援未來功能擴展，並易於維護與更新。

#### Acceptance Criteria

1. WHEN 開發團隊新增新的牌陣類型 THEN 系統 SHALL 能夠透過設定檔（JSON）輕鬆加入，無需修改核心程式碼
2. WHEN 開發團隊整合新的 AI 服務提供商 THEN 系統 SHALL 透過 Factory Pattern 實現，僅需實作新的 Provider 類別
3. IF 系統需要支援多國語言（如英文、日文）THEN 系統 SHALL 使用 i18n 框架，所有顯示文字皆透過語系檔管理
4. WHILE 系統持續運行時 THE 系統 SHALL 記錄關鍵操作日誌（如解讀生成失敗、API 超時），供日後除錯與優化使用
5. WHERE 開發團隊在部署新版本時 THE 系統 SHALL 支援 A/B 測試機制，能夠針對部分使用者推出新功能進行驗證

---

### NFR-5: 相容性與瀏覽器支援

**目標：** 確保系統能在主流瀏覽器與裝置上正常運行。

#### Acceptance Criteria

1. WHEN 使用者使用 Chrome（最新版本）、Firefox（最新版本）、Safari（最新版本）、Edge（最新版本）THEN 系統 SHALL 完整支援所有功能
2. IF 使用者使用較舊版本的瀏覽器（如 Chrome < 90）THEN 系統 SHALL 顯示升級提示，但核心功能仍可運作
3. WHEN 使用者在 iOS（15+）或 Android（12+）裝置上使用行動瀏覽器 THEN 系統 SHALL 確保所有互動功能（如觸控、滑動）正常運作
4. IF 使用者的瀏覽器不支援 JavaScript THEN 系統 SHALL 顯示靜態錯誤頁面：「請啟用 JavaScript 以使用本平台」

---

## 成功指標

### 使用者參與度指標

1. **解讀完成率**：使用者開始抽卡後，成功完成解讀的比例 ≥ 80%
2. **重複使用率**：使用者在 7 天內回訪並執行至少 2 次解讀的比例 ≥ 50%
3. **歷史記錄查看率**：使用者在完成解讀後，至少查看一次歷史記錄的比例 ≥ 60%
4. **分享率**：使用者分享解讀結果的比例 ≥ 15%

### 效能指標

1. **首次內容繪製（FCP）**：桌面裝置 < 2 秒，行動裝置 < 3 秒
2. **可互動時間（TTI）**：桌面裝置 < 3 秒，行動裝置 < 5 秒
3. **AI 解讀回應時間**：首批文字顯示 < 5 秒
4. **頁面錯誤率**：< 1%

### 使用者滿意度指標

1. **功能滿意度**：透過問卷調查，使用者對互動式抽卡體驗的滿意度 ≥ 4.0/5.0
2. **流暢度評價**：使用者對整體操作流暢度的評價 ≥ 4.2/5.0
3. **推薦意願（NPS）**：使用者推薦平台給朋友的意願分數 ≥ 40

---

## 驗證與測試計畫

### 單元測試

- **前端元件測試**：使用 Jest + React Testing Library 測試所有互動元件（抽卡動畫、串流顯示、歷史記錄列表）
- **後端 API 測試**：使用 Pytest 測試所有 API 端點（解讀生成、歷史查詢、分享連結生成）

### 整合測試

- **端到端流程測試**：使用 Playwright 測試完整的抽卡→解讀→儲存→查看歷史流程
- **多瀏覽器測試**：確保在 Chrome、Firefox、Safari、Edge 上功能一致

### 效能測試

- **載入時間測試**：使用 Lighthouse 測試頁面載入效能
- **壓力測試**：使用 k6 測試後端 API 在高流量下的回應時間

### 無障礙測試

- **WCAG AA 合規測試**：使用 axe-core 檢測所有頁面是否符合無障礙標準
- **螢幕閱讀器測試**：使用 NVDA/JAWS 測試頁面是否能正確朗讀

---

## 相依性與限制

### 技術相依性

#### 核心技術堆疊

- **前端框架**：Next.js 15 + React 19 + Tailwind CSS v4
- **狀態管理**：Zustand v5.0.8
- **後端框架**：FastAPI + Python 3.11+
- **AI 服務**：Anthropic Claude、OpenAI GPT、Google Gemini（多提供商策略）
- **資料庫**：Supabase（PostgreSQL + Row-Level Security）

#### 動畫與互動

- **動畫庫**：Framer Motion (motion) v12.23.22 ✅ 已安裝
  - **選擇理由**：業界標準、GPU 加速、效能優異
  - **使用方式**：LazyMotion（bundle size 34kb → 6kb）
  - **最佳實踐**：只動畫 `transform` 和 `opacity` 以確保 60 FPS

- **洗牌演算法**：Fisher-Yates Shuffle (Durstenfeld 優化版)
  - **時間複雜度**：O(n)
  - **特性**：無偏差、每個排列機率相等
  - **業界驗證**：MTG、撲克等卡牌遊戲標準演算法

- **音訊播放**：WaveSurfer.js v7.11.0 + Web Speech API ✅ 已安裝

#### 列表虛擬化

- **虛擬捲動**：TanStack Virtual 🆕 需新增
  - **選擇理由**：2024 年最流行、效能最佳、bundle size 最小
  - **替代方案**：react-virtuoso（變動高度）、react-window（固定高度）
  - **使用情境**：500+ 筆解讀記錄的流暢捲動

#### 無障礙性支援

- **減少動畫偵測**：自訂 `usePrefersReducedMotion` Hook
  - **媒體查詢**：`(prefers-reduced-motion: reduce)`
  - **影響範圍**：35% 的 40 歲以上成人可能受動畫影響
  - **實作方式**：
    - SSR 安全預設值（`true`）
    - 即時監聽用戶偏好變化
    - 整合 MotionConfig 的 `reducedMotion` 選項
  - **停用動畫**：所有 `transform` 動畫、視差效果、自動播放
  - **保留動畫**：`opacity`、`backgroundColor` 變化

#### AI 串流與重連

- **串流協定**：Server-Sent Events (SSE) ✅ 已實現
- **重連機制**：Exponential Backoff 🔧 需增強
  - **初始延遲**：1 秒
  - **最大延遲**：30 秒
  - **最大重試次數**：5 次
  - **延遲計算**：`Math.min(1000 * Math.pow(2, retryCount), 30000)`

- **打字機效果**：
  - **速度**：每秒 30-50 字元（業界標準）
  - **自然變化**：隨機變化 ±20% 模擬真人打字

### 外部限制

- **AI API 配額限制**：需監控 API 使用量，避免超出免費額度
- **瀏覽器相容性限制**：部分舊版瀏覽器可能不支援 Web Speech API 或 CSS Grid
- **網路速度限制**：在低速網路環境下（< 1 Mbps），動畫與串流體驗可能受影響

---

## 技術決策與研究發現

### 深度研究總結（2025-11-11）

本章節記錄了對業界最佳實踐的系統化研究，以及基於研究結果的技術決策。

#### 研究方法論

- **研究範圍**：卡牌動畫 UX、塔羅應用設計、效能優化、無障礙性、虛擬捲動、AI 串流
- **資料來源**：2024-2025 最新技術文章、業界案例研究、開源專案實作
- **研究深度**：UltraThink 深度分析模式

#### 關鍵發現

**1. 洗牌演算法選擇：Fisher-Yates Shuffle**

- **研究來源**：Mike Bostock's visualization, MTG card game implementations
- **選擇理由**：
  - ✅ 無偏差：每個排列出現機率相等（數學驗證）
  - ✅ O(n) 時間複雜度：最優效能
  - ✅ 業界標準：Magic: The Gathering、撲克遊戲都使用此演算法
- **實作方式**：Durstenfeld 優化版（原地交換）
- **避免陷阱**：`array.splice` 會導致 O(n²) 複雜度

**2. 動畫庫選擇：Framer Motion**

- **研究來源**：2024-2025 React 動畫庫比較、效能基準測試
- **選擇理由**：
  - ✅ 專案已安裝（motion v12.23.22）
  - ✅ GPU 加速：使用 CSS transforms
  - ✅ 效能優異：60 FPS 保證
  - ✅ LazyMotion：bundle size 34kb → 6kb
- **最佳實踐**：
  - 只動畫 `transform` 和 `opacity`
  - 避免觸發 reflow 的屬性（`width`, `height`, `left`, `top`）
  - 使用 Motion Values 而非 React State

**3. 虛擬捲動選擇：TanStack Virtual**

- **研究來源**：2024 npm trends、react-window vs react-virtuoso 比較
- **選擇理由**：
  - 🏆 2024 年最流行的虛擬捲動庫
  - ✅ Bundle size 最小（~6kb）
  - ✅ 框架無關：易於遷移
  - ✅ 效能最佳：自動優化
- **替代方案**：
  - react-virtuoso：適合變動高度項目
  - react-window：適合固定高度（但功能較少）

**4. 無障礙性：prefers-reduced-motion**

- **研究來源**：Josh W. Comeau's accessibility guide, WCAG 2.1 guidelines
- **關鍵統計**：35% 的 40 歲以上成人受動畫影響（vestibular disorders）
- **實作方式**：
  - 自訂 `usePrefersReducedMotion` hook
  - SSR 安全預設值（`true`）
  - 整合 Framer Motion 的 `MotionConfig`
- **設計策略**：
  - ✅ 保留：`opacity`、`backgroundColor` 變化
  - ❌ 停用：`transform` 動畫、視差效果

**5. AI 串流：SSE + Exponential Backoff**

- **研究來源**：MDN Web Docs, 2024 real-time streaming best practices
- **現狀**：專案已實現 SSE，但重連機制需增強
- **增強方案**：
  - Exponential Backoff：`Math.min(1000 * 2^n, 30000)`
  - 最大重試次數：5 次
  - 伺服器控制：透過 `retry:` 欄位
- **效能指標**：
  - 首批資料渲染：< 200ms
  - 打字機速度：30-50 字元/秒
  - 自然變化：±20% 隨機

**6. 篩選器 UI：Interactive Filtering + Chips**

- **研究來源**：2025 filter UI patterns, SaaS design best practices
- **關鍵模式**：
  - 即時更新（無需「套用」按鈕）
  - Chips/Pills 顯示已選篩選器
  - 顯示可用項目數量（避免零結果）
  - 「清除全部」按鈕

#### 業界基準

**用戶參與度指標**（非塔羅專屬）：
- 3 天留存率：23% → 目標 30%
- 7 天留存率：15% → 目標 25%
- 30 天留存率：27-43% → 目標 45%
- DAU/MAU 比率：20% → 目標 30%

**塔羅應用特色**：
- 儀式感設計：「緩慢、溫暖、個人化」
- 互動元素：觸控滑動模擬真實體驗
- 平均會話時長：19 分鐘（Pismo app 案例）

#### 技術決策理由總表

| 技術需求 | 選擇方案 | 理由 | 風險緩解 |
|---------|---------|------|---------|
| 洗牌演算法 | Fisher-Yates | 無偏差、O(n)、業界標準 | 使用 Durstenfeld 優化版 |
| 動畫庫 | Framer Motion | 已安裝、GPU 加速、60 FPS | LazyMotion 減小 bundle |
| 虛擬捲動 | TanStack Virtual | 2024 最流行、輕量、效能最佳 | 需新增依賴（~6kb） |
| 無障礙性 | usePrefersReducedMotion | 35% 用戶需求、WCAG 合規 | SSR 安全預設值 |
| AI 串流 | SSE + Expo Backoff | 已實現、標準協定 | 增強重連機制 |
| 篩選器 UI | Chips + 即時過濾 | 業界標準、UX 最佳 | 300ms debounce |

#### 實作優先順序建議

**階段 1：核心體驗（1-2 週）**
1. Fisher-Yates 洗牌實作（2 小時）
2. Framer Motion 動畫整合（4 小時）
3. usePrefersReducedMotion hook（2 小時）
4. 整合到現有 CardDraw 元件（4 小時）

**階段 2：歷史記錄（1-2 週）**
1. 安裝 TanStack Virtual（30 分鐘）
2. 虛擬捲動列表（6 小時）
3. 即時搜尋與篩選（4 小時）
4. Chips UI 實作（3 小時）

**階段 3：進階功能（2-3 週）**
1. Exponential Backoff 重連（1 天）
2. 標籤管理系統（3-4 天）
3. 統計儀表板（2-3 天）

---

## 總結

本需求文件定義了「互動式解讀體驗」功能的完整規格，涵蓋從抽卡、解讀生成、歷史記錄管理、到分享與個人化推薦等各個面向。透過 EARS 格式的驗收標準，確保每一項需求都是可測試且可驗證的。

**本次更新（v1.1）**：
- ✅ 整合深度研究發現
- ✅ 明確技術選型理由
- ✅ 加入業界基準指標
- ✅ 詳細的無障礙性需求
- ✅ 效能優化具體指標

接下來的步驟：
1. **設計階段**：根據本需求文件，制定詳細的技術設計與資料模型
2. **任務拆解**：將需求拆解為可執行的開發任務
3. **實作階段**：按照 TDD 方法論逐步實現各項功能
4. **測試與驗證**：確保所有驗收標準皆通過測試

---

**文件版本**：1.1（整合深度研究發現）
**建立日期**：2025-11-11
**最後更新**：2025-11-11
**語言**：繁體中文（zh-TW）
**狀態**：待審核（已更新技術規格）
