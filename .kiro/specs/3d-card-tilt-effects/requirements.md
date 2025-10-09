# 需求文件

## 簡介

本功能為塔羅牌卡片元件增加 3D 傾斜效果，透過滑鼠懸停互動與手機陀螺儀感應，提供更沉浸式的視覺體驗。此效果將應用於現有的卡片元件（TarotCard、MobileTarotCard、CardThumbnail），為使用者帶來科技感與互動性，符合 Wasteland Tarot 的 Pip-Boy 介面美學。

### 專案描述（使用者輸入）
卡片特效: 請幫我增加卡片效果, 請參考 https://reactbits.dev/components/tilted-card 滑鼠hover到卡片時, 卡片要有3D的傾斜效果, 且要支援手機時候的陀螺儀的傾斜動作模擬滑鼠hover移動時候的傾斜效果

### 商業價值
- **提升使用者體驗**: 現代化的 3D 互動效果增加視覺吸引力
- **品牌差異化**: 獨特的卡片互動體驗強化 Fallout 主題科技感
- **跨裝置一致性**: 桌面與行動裝置皆提供沉浸式互動
- **技術領先**: 展示前端技術能力，吸引技術愛好者

## 需求

### 需求 1: 桌面滑鼠懸停 3D 傾斜效果

**使用者故事:** 身為桌面裝置使用者，我希望當我的滑鼠懸停在卡片上時，卡片能根據滑鼠位置產生 3D 傾斜效果，讓我感受到更真實的卡片互動體驗。

#### 驗收標準

1. WHEN 使用者的滑鼠游標進入卡片區域 THEN 系統 SHALL 啟用 3D 傾斜追蹤機制
2. WHILE 滑鼠在卡片區域內移動 THE 系統 SHALL 即時計算游標相對於卡片中心的位置，並更新卡片的 3D 旋轉角度（X 軸與 Y 軸）
3. WHEN 滑鼠位於卡片中心 THEN 卡片 SHALL 保持水平狀態（無傾斜）
4. WHEN 滑鼠移動至卡片邊緣 THEN 卡片傾斜角度 SHALL 達到最大值（X 軸與 Y 軸各不超過 15 度）
5. WHEN 滑鼠離開卡片區域 THEN 卡片 SHALL 在 300-500ms 內平滑復原至初始水平狀態
6. WHERE 卡片處於翻牌動畫中 THE 系統 SHALL 暫時停用傾斜效果，直到動畫完成
7. IF 使用者的系統設定為 prefers-reduced-motion THEN 系統 SHALL 完全停用 3D 傾斜效果
8. WHILE 傾斜效果啟用時 THE 系統 SHALL 使用 CSS transform 的 rotateX 和 rotateY 屬性，並啟用硬體加速（transform3d）

### 需求 2: 手機陀螺儀傾斜效果

**使用者故事:** 身為行動裝置使用者，我希望當我傾斜手機時，卡片能夠根據裝置方向產生對應的 3D 傾斜效果，模擬桌面滑鼠懸停的體驗。

#### 驗收標準

1. WHEN 使用者首次載入包含卡片的頁面 AND 裝置支援 DeviceOrientation API THEN 系統 SHALL 檢查陀螺儀權限狀態
2. IF 陀螺儀權限未授予 AND 使用者點擊卡片 THEN 系統 SHALL 顯示權限請求提示（iOS 13+ 需要）
3. WHEN 使用者授予陀螺儀權限 THEN 系統 SHALL 開始監聽裝置方向變化事件（deviceorientation）
4. WHILE 裝置傾斜時 THE 系統 SHALL 根據 beta（前後傾斜，-180 到 180 度）和 gamma（左右傾斜，-90 到 90 度）值計算卡片的 3D 旋轉角度
5. WHEN 裝置保持水平 THEN 卡片 SHALL 保持初始水平狀態
6. WHEN 裝置向前傾斜（beta > 0）THEN 卡片 SHALL 向後傾斜（rotateX 負值）
7. WHEN 裝置向左傾斜（gamma < 0）THEN 卡片 SHALL 向左傾斜（rotateY 負值）
8. WHERE 陀螺儀傾斜效果啟用時 THE 系統 SHALL 將傾斜角度限制在合理範圍（X 軸與 Y 軸各不超過 20 度）
9. IF 裝置不支援 DeviceOrientation API OR 權限被拒絕 THEN 系統 SHALL 顯示友善的提示訊息，並 fallback 到觸控手勢備援方案
10. WHEN 使用者將應用程式切換至背景 THEN 系統 SHALL 暫停陀螺儀監聽以節省電量
11. WHEN 使用者返回應用程式 THEN 系統 SHALL 恢復陀螺儀監聽
12. WHILE 陀螺儀效果啟用時 THE 系統 SHALL 使用防抖機制（debounce），每 16-33ms（30-60fps）更新一次傾斜角度

### 需求 3: 視覺增強效果

**使用者故事:** 身為使用者，我希望 3D 傾斜效果能搭配視覺增強（如光澤、陰影），讓卡片看起來更立體、更具科技感。

#### 驗收標準

1. WHEN 卡片產生 3D 傾斜 THEN 系統 SHALL 在卡片表面疊加動態光澤效果（gradient overlay）
2. WHILE 滑鼠或陀螺儀驅動卡片傾斜 THE 光澤位置 SHALL 根據傾斜方向動態移動，模擬光源反射
3. WHERE 卡片傾斜時 THE 系統 SHALL 增強卡片底部陰影（box-shadow），陰影方向與傾斜方向相反
4. WHEN 卡片復原至水平狀態 THEN 光澤與陰影效果 SHALL 同步淡出
5. IF 使用者的系統設定為 prefers-reduced-motion THEN 系統 SHALL 停用動態光澤與陰影效果
6. WHILE 視覺效果啟用時 THE 系統 SHALL 使用 CSS 硬體加速屬性（will-change: transform），避免效能問題

### 需求 4: 效果配置與元件整合

**使用者故事:** 身為開發者，我希望 3D 傾斜效果能透過 props 進行配置，並無縫整合到現有的卡片元件中，不影響現有功能。

#### 驗收標準

1. WHERE 卡片元件被使用時 THE 系統 SHALL 提供 `enable3DTilt` prop（boolean，預設為 `true`）來控制效果啟用/停用
2. WHERE 卡片元件被使用時 THE 系統 SHALL 提供 `tiltMaxAngle` prop（number，預設為 `15`）來自訂最大傾斜角度（度）
3. WHERE 卡片元件被使用時 THE 系統 SHALL 提供 `tiltTransitionDuration` prop（number，預設為 `400`）來自訂復原動畫時長（毫秒）
4. WHERE 卡片元件被使用時 THE 系統 SHALL 提供 `enableGyroscope` prop（boolean，預設為 `true`）來控制行動裝置的陀螺儀效果
5. WHERE 卡片元件被使用時 THE 系統 SHALL 提供 `enableGloss` prop（boolean，預設為 `true`）來控制光澤效果
6. WHEN 3D 傾斜效果與現有的翻牌動畫、hover 動畫同時觸發 THEN 系統 SHALL 確保動畫不互相衝突（翻牌時停用傾斜）
7. WHERE TarotCard、MobileTarotCard、CardThumbnail 元件中 THE 系統 SHALL 整合 3D 傾斜效果，並保持向後相容性
8. IF 卡片處於 loading 狀態 THEN 系統 SHALL 停用 3D 傾斜效果
9. WHEN 卡片尺寸為 `small` THEN 系統 SHALL 自動減少傾斜角度至最大值的 60%（避免過於誇張）

### 需求 5: 效能優化

**使用者故事:** 身為使用者，我希望 3D 傾斜效果流暢且不影響應用程式效能，即使在低階裝置上也能正常運作。

#### 驗收標準

1. WHEN 傾斜效果啟用時 THEN 系統 SHALL 使用 `requestAnimationFrame` 來平滑更新動畫幀
2. WHILE 滑鼠或陀螺儀事件觸發時 THE 系統 SHALL 使用節流（throttle）機制，確保更新頻率不超過 60fps
3. WHERE 多個卡片同時顯示時 THE 系統 SHALL 僅為可視區域內的卡片啟用傾斜效果（使用 Intersection Observer）
4. IF 裝置效能不足（透過 navigator.hardwareConcurrency 或 deviceMemory 檢測） THEN 系統 SHALL 自動降低動畫品質或停用效果
5. WHEN 卡片不在畫面中 THEN 系統 SHALL 停止監聽滑鼠或陀螺儀事件
6. WHILE 3D 傾斜效果執行時 THE 系統 SHALL 避免觸發瀏覽器重排（reflow），僅使用 transform 與 opacity 屬性
7. WHERE 陀螺儀監聽啟用時 THE 系統 SHALL 在元件卸載時正確清理事件監聽器，避免記憶體洩漏

### 需求 6: 無障礙性與使用者體驗

**使用者故事:** 身為有無障礙需求的使用者，我希望 3D 傾斜效果不會影響我使用鍵盤或螢幕閱讀器操作卡片。

#### 驗收標準

1. WHERE 使用者使用鍵盤導航（Tab、Enter、Space）時 THE 3D 傾斜效果 SHALL NOT 干擾鍵盤操作
2. IF 使用者啟用 prefers-reduced-motion THEN 系統 SHALL 完全停用 3D 傾斜、光澤與陰影效果
3. WHEN 卡片獲得鍵盤焦點時 THEN 系統 SHALL 提供視覺焦點指示器（focus ring），不被 3D 效果遮蓋
4. WHERE 螢幕閱讀器使用時 THE 系統 SHALL 不將 3D 傾斜效果相關的視覺元素暴露給輔助技術
5. IF 陀螺儀權限請求被拒絕 THEN 系統 SHALL 顯示易於理解的錯誤訊息，並提供備援的互動方式（如觸控滑動）
6. WHEN 使用者首次看到陀螺儀權限請求 THEN 系統 SHALL 提供簡短說明，解釋啟用陀螺儀的好處
7. WHERE 卡片處於選中狀態（isSelected）時 THE 3D 傾斜效果 SHALL 與選中動畫（animate-card-selection）協調，不產生視覺衝突

### 需求 7: 測試與驗證

**使用者故事:** 身為開發者與 QA，我希望 3D 傾斜效果有完善的測試覆蓋，確保功能穩定且無迴歸。

#### 驗收標準

1. WHERE 單元測試中 THE 系統 SHALL 測試傾斜角度計算邏輯（滑鼠位置 → 角度、陀螺儀資料 → 角度）
2. WHERE 單元測試中 THE 系統 SHALL 測試 props 配置生效（enable3DTilt、tiltMaxAngle 等）
3. WHERE 單元測試中 THE 系統 SHALL 測試 prefers-reduced-motion 偵測與效果停用
4. WHERE 整合測試中 THE 系統 SHALL 驗證滑鼠懸停時卡片確實產生傾斜（使用 Playwright 模擬滑鼠移動）
5. WHERE 整合測試中 THE 系統 SHALL 驗證陀螺儀權限請求流程（使用 Playwright 模擬 DeviceOrientation 事件）
6. WHERE 視覺回歸測試中 THE 系統 SHALL 截圖比對傾斜狀態與初始狀態的視覺差異
7. WHERE 效能測試中 THE 系統 SHALL 確保 3D 傾斜效果不導致 FPS 低於 30（在主流裝置上）
8. IF 任何現有卡片元件測試失敗 THEN 新功能 SHALL NOT 合併至主分支

## 技術考量

### 瀏覽器相容性
- 桌面：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- 行動：iOS Safari 14+, Chrome Mobile 90+, Samsung Internet 14+
- DeviceOrientation API：需處理 iOS 13+ 的權限請求

### 效能目標
- 60fps 動畫幀率（理想）
- 30fps 最低可接受幀率（低階裝置）
- 首次互動延遲（TBT）< 50ms
- 記憶體使用增加 < 5MB（多卡片場景）

### 與現有系統整合
- 與 `useTouchInteractions` 和 `useAdvancedGestures` hooks 協調
- 保持與 Motion 動畫庫的相容性
- 不干擾現有的 CardStateIndicators、CardLoadingShimmer 等元件
- 遵循 Tailwind CSS v4 與 Pip-Boy 主題樣式

## 成功指標

1. **功能完整性**: 桌面與手機皆可正常運作 3D 傾斜效果
2. **效能達標**: 60fps 流暢度，無卡頓
3. **使用者滿意度**: 內部測試回饋正向，無使用者體驗問題
4. **無障礙合規**: 通過 WCAG AA 標準，支援 prefers-reduced-motion
5. **測試覆蓋**: 單元測試覆蓋率 > 80%，整合測試涵蓋關鍵互動流程
6. **零迴歸**: 現有卡片功能不受影響（翻牌、hover、觸控手勢等）

## 排除範圍

以下項目不在本次需求範圍內：
- 卡片的物理碰撞效果（如卡片互相推擠）
- 複雜的粒子效果或後處理特效
- 卡片的拖曳與重新排列功能（已由現有 MobileTarotCard 支援）
- 3D 場景整合（Three.js）或 WebGL 渲染
