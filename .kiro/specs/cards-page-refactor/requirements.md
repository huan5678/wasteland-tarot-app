# 需求文件

## 簡介

此功能重構前端卡牌瀏覽頁面 (`/cards`)，提供更直觀且結構化的卡牌探索體驗。使用者將先選擇花色（Suit），再瀏覽該花色下的卡牌，並能夠點擊卡片查看詳細資訊。此重構改善了使用者體驗，使 78 張 Wasteland Tarot 卡牌的瀏覽更加流暢且易於導航。

## 業務價值

- **改善使用者體驗**：結構化的花色選擇流程降低認知負擔
- **提升探索效率**：分頁機制讓大量卡牌瀏覽更順暢
- **增強內容深度**：詳細說明頁面提供沉浸式的卡牌學習體驗
- **符合 Fallout 主題**：保持 Pip-Boy 介面風格與廢土美學

## 需求

### 需求 1：花色選擇介面
**使用者故事：** 作為使用者，我希望能夠先選擇塔羅牌花色，以便專注瀏覽特定類別的卡牌

#### 驗收標準

1. WHEN 使用者進入 `/cards` 頁面 THEN 系統 SHALL 顯示花色選擇介面
2. WHERE 花色選擇介面 THE 系統 SHALL 顯示以下四個 Minor Arcana 花色選項：
   - Nuka-Cola Bottles (聖杯，Cups)
   - Combat Weapons (權杖，Wands)
   - Bottle Caps (錢幣，Pentacles)
   - Radiation Rods (寶劍，Swords)
3. WHERE 花色選擇介面 THE 系統 SHALL 顯示 Major Arcana（大阿爾克那）選項
4. WHEN 使用者點擊任一花色選項 THEN 系統 SHALL 導航至該花色的卡牌列表頁面
5. WHERE 每個花色選項 THE 系統 SHALL 顯示代表性圖示、花色名稱（中英文）及卡牌數量
6. WHERE 花色選擇介面 THE 系統 SHALL 使用 Pip-Boy 風格的 UI 元素與 Fallout 主題視覺設計
7. WHEN 使用者懸停於花色選項 THEN 系統 SHALL 提供視覺回饋（例如高亮、縮放效果）
8. WHERE 花色選擇介面 THE 系統 SHALL 在行動裝置上正確顯示且可操作

### 需求 2：卡牌列表與分頁瀏覽
**使用者故事：** 作為使用者，我希望能夠分頁瀏覽選定花色的卡牌，以便有效率地探索大量卡牌內容

#### 驗收標準

1. WHEN 使用者選擇特定花色 THEN 系統 SHALL 顯示該花色的卡牌列表頁面
2. WHERE 卡牌列表頁面 THE 系統 SHALL 顯示當前選定的花色標題與描述
3. WHERE 卡牌列表頁面 THE 系統 SHALL 以網格佈局顯示卡牌縮圖
4. IF 花色卡牌數量超過每頁顯示上限 THEN 系統 SHALL 顯示分頁導航控制項
5. WHERE 分頁控制項 THE 系統 SHALL 包含以下元素：
   - 上一頁按鈕
   - 下一頁按鈕
   - 當前頁碼指示器
   - 總頁數指示器
6. WHEN 使用者點擊「下一頁」 THEN 系統 SHALL 載入並顯示下一頁卡牌
7. WHEN 使用者點擊「上一頁」 THEN 系統 SHALL 載入並顯示上一頁卡牌
8. IF 使用者在第一頁 THEN 系統 SHALL 禁用「上一頁」按鈕
9. IF 使用者在最後一頁 THEN 系統 SHALL 禁用「下一頁」按鈕
10. WHERE 每張卡牌縮圖 THE 系統 SHALL 顯示卡牌名稱、編號及預覽圖像
11. WHEN 使用者切換頁面 THEN 系統 SHALL 保持頁面滾動位置於卡牌列表區域頂部
12. WHERE 卡牌列表 THE 系統 SHALL 在桌面顯示每頁 12 張卡牌，行動裝置顯示每頁 6 張卡牌
13. WHERE 卡牌列表頁面 THE 系統 SHALL 提供返回花色選擇介面的導航選項

### 需求 3：卡牌點擊與詳細資訊導航
**使用者故事：** 作為使用者，我希望點擊卡牌能夠查看詳細說明，以便深入了解卡牌的含義與象徵

#### 驗收標準

1. WHEN 使用者點擊卡牌列表中的任一卡牌 THEN 系統 SHALL 導航至該卡牌的詳細說明頁面
2. WHERE 卡牌縮圖 THE 系統 SHALL 顯示可點擊的視覺提示（例如懸停效果、游標變化）
3. WHEN 使用者點擊卡牌 THEN 系統 SHALL 使用 URL 路由 `/cards/[suit]/[cardId]` 導航至詳細頁面
4. WHERE URL 路由 THE 系統 SHALL 包含花色識別碼（suit）與卡牌唯一識別碼（cardId）
5. WHEN 導航至詳細頁面 THEN 系統 SHALL 保留使用者的瀏覽上下文（當前花色、當前頁碼）
6. WHERE 卡牌點擊互動 THE 系統 SHALL 在行動裝置上支援觸控操作
7. WHEN 使用者在詳細頁面點擊「返回」 THEN 系統 SHALL 返回至原先的卡牌列表頁面並保持分頁狀態

### 需求 4：卡牌詳細說明頁面
**使用者故事：** 作為使用者，我希望查看卡牌的完整詳細資訊，包括牌義、象徵、正逆位含義等，以便深入學習塔羅牌知識

#### 驗收標準

1. WHEN 使用者進入卡牌詳細頁面 THEN 系統 SHALL 顯示完整的卡牌資訊
2. WHERE 詳細頁面 THE 系統 SHALL 顯示以下資訊：
   - 卡牌全尺寸圖像
   - 卡牌名稱（中英文）
   - 卡牌編號與花色
   - 牌義說明（正位）
   - 牌義說明（逆位）
   - Fallout 主題相關象徵與故事
   - 關鍵字標籤
3. WHERE 詳細頁面 THE 系統 SHALL 使用 Pip-Boy 風格的介面設計與終端機效果
4. WHERE 詳細頁面 THE 系統 SHALL 提供以下導航選項：
   - 返回卡牌列表
   - 上一張卡牌
   - 下一張卡牌
5. WHEN 使用者點擊「上一張卡牌」 THEN 系統 SHALL 顯示當前花色的前一張卡牌詳細資訊
6. WHEN 使用者點擊「下一張卡牌」 THEN 系統 SHALL 顯示當前花色的下一張卡牌詳細資訊
7. IF 當前卡牌為該花色第一張 THEN 系統 SHALL 禁用「上一張卡牌」按鈕
8. IF 當前卡牌為該花色最後一張 THEN 系統 SHALL 禁用「下一張卡牌」按鈕
9. WHERE 詳細頁面 THE 系統 SHALL 在行動裝置上正確顯示所有資訊且可滾動瀏覽
10. WHEN 使用者載入詳細頁面 THEN 系統 SHALL 在 2 秒內顯示卡牌圖像與基本資訊
11. WHERE 詳細頁面 THE 系統 SHALL 支援分享功能（複製連結、社交媒體分享）
12. IF 卡牌資料載入失敗 THEN 系統 SHALL 顯示友善的錯誤訊息與返回選項

### 需求 5：響應式設計與行動裝置支援
**使用者故事：** 作為行動裝置使用者，我希望在手機或平板上也能流暢瀏覽卡牌，以便隨時隨地探索塔羅牌

#### 驗收標準

1. WHERE 所有頁面（花色選擇、卡牌列表、詳細頁面） THE 系統 SHALL 支援響應式設計
2. WHEN 使用者使用行動裝置瀏覽 THEN 系統 SHALL 調整佈局以適應螢幕尺寸
3. WHERE 行動裝置 THE 系統 SHALL 使用觸控友善的按鈕尺寸（最小 44x44px）
4. WHERE 卡牌列表 THE 系統 SHALL 在行動裝置上顯示 2 欄網格佈局
5. WHERE 花色選擇介面 THE 系統 SHALL 在行動裝置上顯示垂直堆疊的花色選項
6. WHEN 使用者在行動裝置上滑動 THEN 系統 SHALL 支援流暢的滾動與觸控手勢
7. WHERE 所有互動元素 THE 系統 SHALL 在觸控裝置上提供即時視覺回饋
8. WHERE 詳細頁面 THE 系統 SHALL 在行動裝置上優化圖片載入與顯示效能

### 需求 6：無障礙性與可用性
**使用者故事：** 作為使用輔助技術的使用者，我希望能夠使用鍵盤與螢幕閱讀器瀏覽卡牌，以便無障礙地使用此功能

#### 驗收標準

1. WHERE 所有互動元素 THE 系統 SHALL 支援鍵盤導航（Tab、Enter、Arrow keys）
2. WHERE 所有圖像 THE 系統 SHALL 包含描述性的 alt 文字
3. WHERE 所有按鈕與連結 THE 系統 SHALL 具有清晰的 ARIA 標籤
4. WHEN 使用者使用鍵盤 Tab 鍵 THEN 系統 SHALL 以邏輯順序聚焦於互動元素
5. WHERE 分頁控制項 THE 系統 SHALL 宣告當前頁碼與總頁數給螢幕閱讀器
6. WHERE 花色選擇介面 THE 系統 SHALL 提供語意化的標題結構（h1, h2, h3）
7. WHERE 所有頁面 THE 系統 SHALL 符合 WCAG 2.1 AA 級別標準
8. WHEN 使用者聚焦於元素 THEN 系統 SHALL 顯示清晰的視覺聚焦指示器

### 需求 7：效能與載入優化
**使用者故事：** 作為使用者，我希望頁面能夠快速載入，以便流暢地瀏覽卡牌而不會感到延遲

#### 驗收標準

1. WHEN 使用者導航至花色選擇頁面 THEN 系統 SHALL 在 2 秒內完成初始渲染
2. WHEN 使用者切換分頁 THEN 系統 SHALL 在 1 秒內載入並顯示新頁面卡牌
3. WHERE 卡牌圖像 THE 系統 SHALL 使用延遲載入（lazy loading）技術
4. WHERE 卡牌圖像 THE 系統 SHALL 提供優化的圖片格式（WebP 優先，JPEG 作為後備）
5. WHEN 圖像載入中 THEN 系統 SHALL 顯示佔位符或載入動畫
6. WHERE 卡牌列表頁面 THE 系統 SHALL 預先載入下一頁的卡牌縮圖
7. WHERE 所有頁面 THE 系統 SHALL 實現程式碼分割（code splitting）以減少初始載入大小
8. WHEN 網路連線緩慢 THEN 系統 SHALL 顯示載入狀態指示器

### 需求 8：資料整合與 API
**使用者故事：** 作為系統，我需要從後端 API 取得卡牌資料，以便顯示最新且正確的卡牌資訊

#### 驗收標準

1. WHEN 系統載入卡牌資料 THEN 系統 SHALL 從後端 API `/api/v1/cards` 取得卡牌列表
2. WHERE API 請求 THE 系統 SHALL 包含花色（suit）與分頁參數（page, limit）
3. WHEN 使用者選擇花色 THEN 系統 SHALL 發送 API 請求取得該花色的卡牌資料
4. WHERE 卡牌詳細頁面 THE 系統 SHALL 從 API `/api/v1/cards/{cardId}` 取得完整卡牌資訊
5. IF API 請求失敗 THEN 系統 SHALL 顯示使用者友善的錯誤訊息與重試選項
6. WHERE API 回應 THE 系統 SHALL 包含以下卡牌資料欄位：
   - id（卡牌唯一識別碼）
   - name（中英文名稱）
   - suit（花色）
   - number（編號）
   - image_url（圖片連結）
   - upright_meaning（正位牌義）
   - reversed_meaning（逆位牌義）
   - keywords（關鍵字）
   - description（Fallout 主題描述）
7. WHEN 資料載入中 THEN 系統 SHALL 顯示載入狀態（骨架屏或載入動畫）
8. WHERE API 快取 THE 系統 SHALL 快取卡牌列表資料以提升後續瀏覽效能

### 需求 9：URL 路由與瀏覽歷史
**使用者故事：** 作為使用者，我希望能夠使用瀏覽器的前進/後退按鈕導航，以便自然地瀏覽卡牌頁面

#### 驗收標準

1. WHERE URL 路由 THE 系統 SHALL 使用以下路由結構：
   - `/cards` - 花色選擇頁面
   - `/cards/[suit]` - 特定花色的卡牌列表
   - `/cards/[suit]?page=[number]` - 特定花色的分頁列表
   - `/cards/[suit]/[cardId]` - 卡牌詳細頁面
2. WHEN 使用者點擊瀏覽器後退按鈕 THEN 系統 SHALL 返回至上一個瀏覽頁面
3. WHEN 使用者點擊瀏覽器前進按鈕 THEN 系統 SHALL 前進至下一個瀏覽頁面
4. WHERE 分頁導航 THE 系統 SHALL 更新 URL 查詢參數而不重新載入整個頁面
5. WHEN 使用者直接輸入 URL THEN 系統 SHALL 正確顯示對應的頁面內容
6. WHERE URL THE 系統 SHALL 使用語意化的 slug（例如 `/cards/nuka-cola/the-vault-dweller`）
7. IF URL 參數無效或卡牌不存在 THEN 系統 SHALL 顯示 404 錯誤頁面
8. WHERE 頁面標題 THE 系統 SHALL 根據當前頁面動態更新（例如「卡牌詳細 - The Vault Dweller | Wasteland Tarot」）

### 需求 10：視覺設計與主題一致性
**使用者故事：** 作為 Fallout 粉絲，我希望卡牌頁面保持 Pip-Boy 風格與廢土美學，以便獲得沉浸式的體驗

#### 驗收標準

1. WHERE 所有頁面 THE 系統 SHALL 使用 Pip-Boy 介面風格的設計元素
2. WHERE UI 元素 THE 系統 SHALL 使用綠色單色調 CRT 螢幕風格（或 Pip-Boy 標準配色）
3. WHERE 文字 THE 系統 SHALL 使用 monospace 字體與終端機風格
4. WHERE 背景 THE 系統 SHALL 使用掃描線、雜訊、抖動效果等復古 CRT 視覺元素
5. WHERE 按鈕與互動元素 THE 系統 SHALL 使用 Fallout 風格的 UI 元件（邊框、圖示、音效）
6. WHERE 動畫與過渡效果 THE 系統 SHALL 使用符合 Pip-Boy 介面的動畫風格
7. WHERE 載入動畫 THE 系統 SHALL 使用廢土主題的載入指示器（例如輻射符號、Vault-Tec logo）
8. WHERE 色彩對比 THE 系統 SHALL 確保符合 WCAG AA 級別標準以保證可讀性
