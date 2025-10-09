# 需求文件

## 專案描述（輸入）
更新 loading 頁面的動畫效果，在「初始化使用者狀態...」的這個頁面上，使用 https://www.a1k0n.net/2011/07/20/donut-math.html 頁面的相關知識，建立一個 ASCII 的 3D Donut 的效果在 loading 之中

### 技術參考
基於 donut math 文章的核心概念：
- Torus 參數方程式，使用 θ (theta) 和 φ (phi) 參數
- R1（橫截面半徑）和 R2（圓環中心距離）
- 旋轉矩陣（x, y, z 軸）創造旋轉效果
- 表面法向量計算光照效果
- 亮度映射到 ASCII 字元：".,-~:;=!*#$@"
- Z-buffer 處理深度
- 透視投影公式

### 當前實作位置
- 檔案：`src/components/providers/ZustandAuthProvider.tsx`
- 第 13-19 行：目前的 loading 顯示邏輯

## 簡介
為了提升使用者體驗並強化 Fallout 廢土主題的沉浸感，我們需要將當前靜態的「初始化使用者狀態...」文字替換為一個基於數學原理的 ASCII 3D 旋轉甜甜圈動畫。這個動畫將在應用程式初始化期間顯示，提供視覺吸引力的同時，也展現技術美學與復古終端機風格的結合。

## 需求

### 需求 1：ASCII 3D Donut 渲染引擎
**目標：** 作為系統開發者，我希望實作一個基於數學的 3D donut 渲染引擎，以便能夠在瀏覽器中生成即時的 ASCII 藝術動畫

#### 驗收標準
1. WHEN 渲染引擎初始化 THEN ASCII Donut 系統 SHALL 使用圓環體（torus）參數方程式生成 3D 座標點
2. WHEN 計算圓環體表面點 THEN ASCII Donut 系統 SHALL 使用 θ (theta) 範圍 0-2π 和 φ (phi) 範圍 0-2π 的參數
3. WHEN 定義圓環體形狀 THEN ASCII Donut 系統 SHALL 使用可配置的 R1（橫截面半徑）和 R2（圓環中心距離）參數
4. WHERE 需要 3D 視覺效果 THE ASCII Donut 系統 SHALL 實作 x、y、z 三軸的旋轉矩陣
5. WHEN 計算表面亮度 THEN ASCII Donut 系統 SHALL 計算表面法向量並與光源方向進行點積運算
6. WHEN 處理深度遮蔽 THEN ASCII Donut 系統 SHALL 使用 Z-buffer 演算法確保正確的前後關係
7. WHEN 投影到 2D 螢幕 THEN ASCII Donut 系統 SHALL 使用透視投影公式將 3D 座標轉換為螢幕座標

### 需求 2：ASCII 字元映射與顯示
**目標：** 作為使用者，我希望看到平滑且具有深度感的 ASCII 字元動畫，以便獲得視覺上令人滿意的 loading 體驗

#### 驗收標準
1. WHEN 亮度值計算完成 THEN ASCII Donut 系統 SHALL 將亮度值映射到 ASCII 字元集 ".,-~:;=!*#$@"
2. WHEN 亮度最低時 THEN ASCII Donut 系統 SHALL 使用字元 "." 表示
3. WHEN 亮度最高時 THEN ASCII Donut 系統 SHALL 使用字元 "@" 表示
4. WHERE 顯示 ASCII 藝術 THE ASCII Donut 系統 SHALL 使用等寬字體（monospace font）確保字元對齊
5. WHEN 渲染到 DOM THEN ASCII Donut 系統 SHALL 使用 `<pre>` 標籤或等效方式保持 ASCII 藝術格式
6. WHEN 畫面尺寸變化 THEN ASCII Donut 系統 SHALL 動態調整 ASCII 藝術的顯示尺寸以適應容器

### 需求 3：旋轉動畫與效能
**目標：** 作為使用者，我希望看到流暢的 3D 旋轉動畫，以便感受到動態的視覺效果

#### 驗收標準
1. WHEN 動畫開始 THEN ASCII Donut 系統 SHALL 以每秒至少 24 幀（24 FPS）的速率更新畫面
2. WHILE 動畫執行中 THE ASCII Donut 系統 SHALL 持續更新旋轉角度 A（繞 x 軸）和 B（繞 z 軸）
3. WHEN 每個動畫幀更新 THEN ASCII Donut 系統 SHALL 重新計算所有點的 3D 座標和亮度
4. WHERE 效能是關鍵考量 THE ASCII Donut 系統 SHALL 使用 `requestAnimationFrame` 實作動畫循環
5. WHEN 元件卸載時 THEN ASCII Donut 系統 SHALL 取消動畫循環並清理資源
6. IF 瀏覽器支援 Web Workers THEN ASCII Donut 系統 MAY 使用 Web Workers 進行計算以避免阻塞主執行緒

### 需求 4：整合到 Loading 頁面
**目標：** 作為使用者，我希望在應用程式初始化期間看到 ASCII Donut 動畫，以便知道系統正在載入並感受到品牌風格

#### 驗收標準
1. WHEN 使用者狀態未初始化 THEN ZustandAuthProvider 元件 SHALL 顯示 ASCII Donut 動畫
2. WHEN ASCII Donut 動畫顯示 THEN 畫面 SHALL 包含「初始化使用者狀態...」或類似的文字提示
3. WHERE 顯示 loading 畫面 THE 系統 SHALL 使用 Pip-Boy 綠色主題色（--color-pip-boy-green）
4. WHEN 使用者狀態初始化完成 THEN 系統 SHALL 隱藏 ASCII Donut 動畫並顯示主要內容
5. WHEN ASCII Donut 元件載入 THEN 系統 SHALL 確保不影響應用程式的初始載入效能
6. WHERE 無障礙需求 THE 系統 SHALL 提供適當的 ARIA 標籤和 loading 語意標記

### 需求 5：Fallout 主題風格整合
**目標：** 作為產品設計者，我希望 ASCII Donut 動畫符合 Fallout Pip-Boy 終端機美學，以便維持整體品牌一致性

#### 驗收標準
1. WHEN 顯示 ASCII Donut THEN 系統 SHALL 使用 Pip-Boy 綠色（--color-pip-boy-green）作為字元顏色
2. WHERE 需要終端機效果 THE 系統 SHALL 使用等寬字體（font-mono）顯示 ASCII 字元
3. WHEN 顯示 loading 畫面 THEN 系統 SHALL 包含 CRT 掃描線效果或類似的復古終端機視覺元素
4. IF 需要額外視覺效果 THEN 系統 MAY 加入輕微的螢幕閃爍或輝光效果
5. WHEN 顯示文字提示 THEN 系統 SHALL 使用 Fallout 風格的措辭（例如「INITIALIZING VAULT RESIDENT STATUS...」）

### 需求 6：可配置性與維護性
**目標：** 作為開發者，我希望 ASCII Donut 實作具有良好的可配置性和可維護性，以便未來能夠調整參數和進行優化

#### 驗收標準
1. WHEN 實作 ASCII Donut 元件 THEN 系統 SHALL 將核心數學邏輯與 React 元件分離
2. WHERE 需要調整視覺效果 THE 系統 SHALL 提供可配置的參數（R1, R2, 旋轉速度, FPS 等）
3. WHEN 定義字元集 THEN 系統 SHALL 允許自訂 ASCII 字元映射表
4. WHERE 效能監控 THE 系統 SHALL 提供 FPS 計數器或效能指標（僅開發模式）
5. WHEN 元件實作完成 THEN 程式碼 SHALL 包含清晰的註解說明數學原理和實作邏輯
6. WHERE 測試覆蓋 THE 系統 SHALL 包含單元測試驗證核心數學計算的正確性

### 需求 7：跨瀏覽器相容性與回退方案
**目標：** 作為使用者，我希望在各種瀏覽器和裝置上都能看到 loading 動畫，以便獲得一致的體驗

#### 驗收標準
1. WHEN 瀏覽器不支援 requestAnimationFrame THEN 系統 SHALL 回退到 setTimeout 實作動畫
2. WHERE 效能不足 THE 系統 SHALL 偵測並降低幀率或簡化渲染複雜度
3. WHEN 在行動裝置上執行 THEN 系統 SHALL 調整 donut 尺寸和細節以適應小螢幕
4. IF 瀏覽器效能極差 THEN 系統 MAY 回退到靜態的 ASCII art 圖案或簡單的文字 loading
5. WHEN 支援 prefers-reduced-motion THEN 系統 SHALL 提供靜態或低動畫的替代方案
6. WHERE 測試環境 THE 系統 SHALL 支援 Jest/Testing Library 的測試並能夠模擬動畫行為

## 非功能需求

### 效能需求
- 動畫應維持至少 24 FPS，目標為 30-60 FPS
- 初始渲染時間應小於 100ms
- CPU 使用率應保持合理（單核心使用率 < 30%）
- 記憶體使用應穩定，不應有記憶體洩漏

### 無障礙需求
- 提供適當的 ARIA 標籤（aria-live, role="status"）
- 支援螢幕閱讀器的文字描述
- 遵循 `prefers-reduced-motion` 偏好設定
- 確保足夠的色彩對比度（WCAG AA 標準）

### 瀏覽器支援
- Chrome/Edge（最新版本與前兩個版本）
- Firefox（最新版本與前兩個版本）
- Safari（最新版本與前兩個版本）
- 行動瀏覽器：iOS Safari, Chrome Mobile

### 技術債務考量
- 程式碼應模組化，便於未來擴展其他 ASCII 動畫效果
- 使用 TypeScript 確保型別安全
- 遵循專案現有的程式碼風格和架構模式
