# 實作計畫

## 基礎架構與工具函式

- [x] 1. 建立類型定義與介面
  - 在 `src/types/tilt.ts` 建立 `TiltState`、`TiltComponentProps`、`DeviceCapabilities` 等 TypeScript 介面
  - 定義 `Use3DTiltOptions`、`Use3DTiltReturn`、`GyroscopePermissionStatus` 類型
  - 匯出所有類型供其他模組使用
  - 撰寫類型定義的單元測試（型別檢查）
  - _Requirements: 需求 4.1-4.5（props 配置）_

- [x] 2. 實作裝置能力偵測 Hook (`useDeviceCapabilities`)
  - 在 `src/hooks/tilt/useDeviceCapabilities.ts` 建立 Hook
  - 實作 `isTouchDevice` 偵測（使用 `navigator.maxTouchPoints`）
  - 實作 `prefersReducedMotion` 偵測（使用 `matchMedia('(prefers-reduced-motion: reduce)')`）
  - 實作 `isIOS` 偵測（使用 `navigator.userAgent`）
  - 偵測 `hardwareConcurrency` 與 `deviceMemory`（若支援）
  - 撰寫 Hook 的單元測試（模擬不同裝置環境）
  - _Requirements: 需求 6.2（prefers-reduced-motion）, 需求 5.4（低效能裝置偵測）_

- [x] 3. 實作可視區域偵測 Hook (`useIntersectionTilt`)
  - 在 `src/hooks/tilt/useIntersectionTilt.ts` 建立 Hook
  - 使用 `IntersectionObserver` API 偵測元素是否在可視區域
  - 設定 `threshold: 0.1` 作為預設值
  - 處理元件卸載時的 observer 清理
  - 撰寫 Hook 的單元測試（模擬 IntersectionObserver）
  - _Requirements: 需求 5.3, 5.5（可視區域優化）_

## 陀螺儀權限處理

- [x] 4. 實作陀螺儀權限管理 Hook (`useGyroscopePermission`)
  - 在 `src/hooks/tilt/useGyroscopePermission.ts` 建立 Hook
  - 實作權限狀態管理（'prompt' | 'granted' | 'denied' | 'unsupported'）
  - 偵測是否為 iOS 13+ 環境（檢查 `DeviceOrientationEvent.requestPermission` 是否存在）
  - 實作 `requestPermission` 函式（必須在 user gesture 中呼叫）
  - 處理權限請求錯誤與使用者拒絕情境
  - 撰寫 Hook 的單元測試（模擬 iOS 13+ 與非 iOS 環境）
  - _Requirements: 需求 2.1-2.2, 2.9-2.11（陀螺儀權限請求）_

- [ ] 5. 建立陀螺儀權限請求 UI 元件
  - 在 `src/components/tilt/GyroscopePermissionPrompt.tsx` 建立元件
  - 顯示友善的權限請求說明文字（解釋為何需要陀螺儀）
  - 實作「啟用傾斜效果」按鈕（觸發權限請求）
  - 處理權限被拒絕時的 fallback UI（顯示引導訊息）
  - 整合 Toast 通知顯示錯誤訊息
  - 撰寫元件的單元測試（測試不同權限狀態的渲染）
  - _Requirements: 需求 2.2, 6.5-6.6（權限請求 UI）_

## 核心 3D 傾斜 Hook

- [x] 6. 實作滑鼠追蹤邏輯（桌面）
  - 在 `src/hooks/tilt/use3DTilt.ts` 建立 Hook 基礎架構
  - 實作 `handleMouseEnter` 處理器（啟用追蹤）
  - 實作 `handleMouseMove` 處理器：
    - 使用 `getBoundingClientRect` 取得卡片位置
    - 計算滑鼠相對位置（0~1）
    - 轉換為傾斜角度（-tiltMaxAngle ~ +tiltMaxAngle）
    - 使用 `requestAnimationFrame` 平滑更新狀態
  - 實作 `handleMouseLeave` 處理器（復原至水平）
  - 整合 `useDeviceCapabilities` 檢查 `prefersReducedMotion`
  - 撰寫單元測試（測試角度計算邏輯）
  - _Requirements: 需求 1.1-1.8（桌面滑鼠懸停）_

- [x] 7. 實作陀螺儀追蹤邏輯（行動）
  - 在 `use3DTilt` Hook 中新增 `useEffect` 監聽 `deviceorientation` 事件
  - 整合 `useGyroscopePermission` 檢查權限狀態
  - 實作陀螺儀事件處理器：
    - 讀取 `beta`（前後傾斜）與 `gamma`（左右傾斜）值
    - 計算傾斜角度（限制在 ±20°）
    - 使用 `throttle`（33ms）節流事件處理
    - 使用 `requestAnimationFrame` 更新狀態
  - 實作 Page Visibility API 監聽（背景暫停、前景恢復）
  - 處理元件卸載時的事件監聽器清理
  - 撰寫單元測試（模擬 DeviceOrientationEvent）
  - _Requirements: 需求 2.3-2.8, 2.10-2.12（陀螺儀傾斜效果）_

- [x] 8. 計算 CSS transform 與 style
  - 在 `use3DTilt` Hook 中使用 `useMemo` 計算 `tiltStyle`
  - 產生 `perspective(1000px) rotateX()deg rotateY()deg scale3d(1.02, 1.02, 1.02)` transform
  - 動態設定 `transition`（傾斜時無 transition，復原時 400ms）
  - 動態設定 `willChange`（傾斜時 'transform'，靜止時 'auto'）
  - 整合 `useIntersectionTilt` 僅在可視時計算
  - 撰寫單元測試（驗證 CSS 輸出格式）
  - _Requirements: 需求 1.8（CSS 硬體加速）, 需求 5.6（避免 reflow）_

- [x] 9. 整合效能優化機制
  - 實作 RAF（requestAnimationFrame）管理：
    - 取消先前的 RAF 請求避免堆疊
    - 確保元件卸載時清理所有 RAF
  - 整合 `throttle` 於滑鼠與陀螺儀事件（使用 lodash/throttle）
  - 整合 `useIntersectionTilt` 於主 Hook
  - 實作尺寸調整時的角度縮放（small 尺寸減至 60%）
  - 撰寫效能測試（驗證 FPS 不低於 30）
  - _Requirements: 需求 5.1-5.7（效能優化）_

## 視覺效果元件

- [x] 10. 實作動態光澤效果元件 (`TiltVisualEffects`)
  - 在 `src/components/tilt/TiltVisualEffects.tsx` 建立元件
  - 根據 `tiltState.rotateX` 與 `rotateY` 計算光澤位置
  - 產生 `radial-gradient` CSS（位置隨傾斜角度移動）
  - 設定 `mixBlendMode: 'overlay'` 與 `opacity: 0.6`
  - 實作淡入淡出動畫（transition: 0.3s）
  - 撰寫元件的單元測試與視覺回歸測試
  - _Requirements: 需求 3.1-3.2（動態光澤效果）_

- [x] 11. 實作動態陰影效果
  - 在 `TiltVisualEffects` 元件中計算陰影偏移
  - 根據傾斜方向產生相反方向的 `box-shadow`（shadowX, shadowY）
  - 使用 `styled-jsx` 或 inline style 動態更新陰影
  - 實作陰影淡出效果（復原時同步）
  - 撰寫元件的單元測試
  - _Requirements: 需求 3.3-3.4（增強陰影效果）_

- [x] 12. 整合 `enableGloss` 配置與 prefers-reduced-motion
  - 在 `TiltVisualEffects` 中檢查 `enableGloss` prop
  - 整合 `useDeviceCapabilities` 檢查 `prefersReducedMotion`
  - 當 `prefersReducedMotion` 為 true 時完全停用光澤與陰影
  - 使用 `React.memo` 優化元件效能（props 不變時跳過渲染）
  - 撰寫測試驗證配置生效
  - _Requirements: 需求 3.5-3.6, 需求 6.2（無障礙）_

## 全域配置 Provider

- [x] 13. 實作 TiltConfigProvider Context
  - 在 `src/contexts/TiltConfigContext.tsx` 建立 Context 與 Provider
  - 實作低效能裝置偵測邏輯：
    - 檢查 `navigator.hardwareConcurrency < 4`
    - 檢查 `navigator.deviceMemory < 4`（若支援）
  - 定義 `performanceDegradation` 設定（reduceAngle, disableGloss）
  - 實作 `useTiltConfig` Hook 供子元件存取配置
  - 撰寫 Provider 的單元測試
  - _Requirements: 需求 4.1-4.9（效果配置）, 需求 5.4（效能降級）_

- [x] 14. 整合全域配置至 use3DTilt Hook
  - 在 `use3DTilt` Hook 中呼叫 `useTiltConfig`
  - 使用全域 `defaultMaxAngle` 作為預設值（可被 props 覆蓋）
  - 根據 `isLowPerformanceDevice` 自動調整角度
  - 根據 `performanceDegradation.disableGloss` 停用光澤
  - 撰寫整合測試驗證配置生效
  - _Requirements: 需求 4.1-4.9, 需求 5.4_

## 卡片元件整合

- [x] 15. 整合至 TarotCard 元件
  - 在 `src/components/tarot/TarotCard.tsx` 引入 `use3DTilt` Hook
  - 新增 props: `enable3DTilt`, `tiltMaxAngle`, `tiltTransitionDuration`, `enableGyroscope`, `enableGloss`
  - 將 `tiltRef` 綁定至卡片根元素
  - 將 `tiltHandlers` 綁定至根元素（onMouseEnter, onMouseMove, onMouseLeave）
  - 套用 `tiltStyle` 至根元素
  - 整合 `TiltVisualEffects` 元件
  - 處理與現有翻牌動畫的衝突（`isFlipping` 時停用傾斜）
  - 撰寫整合測試
  - _Requirements: 需求 4.6-4.7（元件整合）_

- [x] 16. 整合至 MobileTarotCard 元件
  - 在 `src/components/mobile/MobileTarotCard.tsx` 引入 `use3DTilt` Hook
  - 新增相同 props（與 TarotCard 一致）
  - 整合 `GyroscopePermissionPrompt` 元件（當權限狀態為 'prompt' 時顯示）
  - 處理陀螺儀權限被拒絕的 fallback（顯示友善提示）
  - 確保與現有手勢（雙擊、長按、滑動）不衝突
  - 撰寫整合測試（模擬行動裝置環境）
  - _Requirements: 需求 4.7, 需求 2.9（fallback）_

- [x] 17. 整合至 CardThumbnail 元件
  - 在 `src/components/cards/CardThumbnail.tsx` 引入 `use3DTilt` Hook
  - 使用預設 props（`size='small'`, `tiltMaxAngle` 自動減至 9°）
  - 簡化整合（無需權限請求 UI）
  - 確保縮圖網格中的效能（使用 IntersectionObserver）
  - 撰寫整合測試
  - _Requirements: 需求 4.7, 需求 4.9（small 尺寸角度縮放）_

## 錯誤處理與無障礙

- [x] 18. 實作錯誤邊界 (TiltErrorBoundary)
  - 在 `src/components/tilt/TiltErrorBoundary.tsx` 建立 Error Boundary 類別元件
  - 捕獲 Hook 或元件錯誤，防止整個應用崩潰
  - 錯誤時渲染原始子元件（無傾斜效果）
  - 記錄錯誤至 console（可選：上報至 Sentry）
  - 撰寫 Error Boundary 的測試
  - _Requirements: 錯誤處理策略（設計文件）_

- [x] 19. 實作鍵盤與螢幕閱讀器無障礙支援
  - 確保傾斜效果不干擾 Tab/Enter/Space 鍵盤導航
  - 為視覺效果元素新增 `aria-hidden="true"`
  - 確保 focus ring 不被 3D 效果遮蓋（調整 z-index）
  - 撰寫無障礙測試（使用 axe-core 與 Playwright）
  - _Requirements: 需求 6.1, 6.3-6.4（無障礙）_

- [x] 20. 處理瀏覽器不支援情境
  - 實作 IntersectionObserver polyfill 或 fallback（所有卡片啟用傾斜）
  - 實作 CSS 3D Transforms 不支援偵測（靜默降級）
  - 實作 requestAnimationFrame 失敗 fallback（降級至 setTimeout）
  - 撰寫瀏覽器相容性測試
  - _Requirements: 錯誤處理策略_

## 測試與驗證

- [x] 21. 撰寫單元測試（角度計算與狀態管理）
  - 測試滑鼠中心位置 (50%, 50%) → rotateX=0, rotateY=0
  - 測試滑鼠邊緣位置 (100%, 0%) → rotateX=15°, rotateY=15°
  - 測試陀螺儀資料轉換（beta=30°, gamma=-15° → rotateX, rotateY）
  - 測試 prefers-reduced-motion 停用效果
  - 測試 props 配置生效（tiltMaxAngle, enableGyroscope 等）
  - _Requirements: 需求 7.1-7.3（單元測試）_

- [x] 22. 撰寫整合測試（Playwright）
  - 測試桌面滑鼠懸停產生 3D 傾斜
  - 測試滑鼠移動至不同位置時角度變化
  - 測試滑鼠離開時復原動畫
  - 測試陀螺儀權限請求流程（模擬 iOS 13+）
  - 測試陀螺儀事件驅動卡片傾斜
  - _Requirements: 需求 7.4-7.5（整合測試）_

- [x] 23. 撰寫 E2E 測試（關鍵使用者流程）
  - 測試桌面使用者完整流程：進入卡片頁 → 滑鼠懸停 → 查看傾斜 → 滑鼠離開 → 復原
  - 測試行動使用者完整流程：進入卡片頁 → 請求陀螺儀權限 → 傾斜裝置 → 查看卡片傾斜
  - 測試無障礙流程：開啟 prefers-reduced-motion → 確認無傾斜動畫 → 鍵盤導航正常
  - _Requirements: 需求 7.4-7.5_

- [x] 24. 撰寫視覺回歸測試（Percy + Playwright）
  - 截圖比對卡片初始狀態
  - 截圖比對卡片傾斜狀態（滑鼠移至右上角）
  - 截圖比對光澤效果可見性
  - 截圖比對陰影增強效果
  - _Requirements: 需求 7.6（視覺回歸測試）_

- [x] 25. 撰寫效能測試
  - 測試單卡片 CPU 使用率 < 10%（桌面）, < 20%（行動）
  - 測試多卡片場景記憶體增量 < 5MB
  - 測試動畫幀率 ≥ 30fps（使用 Chrome DevTools Performance）
  - 測試首次互動延遲 (TBT) < 50ms
  - 驗證 IntersectionObserver 效能優化（可視卡片 vs 全部卡片）
  - _Requirements: 需求 7.7（效能測試）_

## 文件與最佳化

- [x] 26. 撰寫 TypeScript JSDoc 文件
  - 為 `use3DTilt` Hook 新增詳細 JSDoc（參數、返回值、範例）
  - 為所有公開 API 新增 JSDoc
  - 為複雜邏輯新增 inline 註解
  - _Requirements: 文件化需求_

- [x] 27. 建立 Storybook 範例
  - 建立 TarotCard 3D 傾斜效果 Story
  - 建立不同配置的 Stories（不同角度、尺寸、啟用/停用光澤）
  - 建立陀螺儀權限請求 Story
  - 建立 prefers-reduced-motion 模擬 Story
  - _Requirements: 文件化需求_
  - **Note: Skipped - Storybook not configured in project**

- [x] 28. 效能優化微調與記憶體洩漏檢查
  - 使用 React DevTools Profiler 檢查重渲染
  - 使用 Chrome DevTools Memory 檢查記憶體洩漏
  - 確認所有事件監聽器正確清理
  - 確認所有 RAF 正確取消
  - 優化 `useMemo` 與 `useCallback` 使用
  - _Requirements: 需求 5.7（記憶體洩漏）_

## 整合與部署準備

- [x] 29. 在應用層級整合 TiltConfigProvider
  - 在 `src/app/layout.tsx` 或適當位置新增 TiltConfigProvider
  - 確保所有卡片元件被 Provider 包裹
  - 撰寫整合測試驗證全域配置生效
  - _Requirements: 需求 4.1-4.9_

- [x] 30. 程式碼審查與重構
  - 審查所有 TypeScript 類型定義完整性
  - 審查錯誤處理完整性
  - 審查無障礙支援完整性
  - 重構重複邏輯
  - 確保程式碼符合專案 ESLint 規則
  - _Requirements: 所有需求_

- [x] 31. 最終整合測試與驗收
  - 執行完整測試套件（單元 + 整合 + E2E）
  - 驗證所有需求的驗收標準通過
  - 驗證效能目標達成（60fps, < 50ms TBT）
  - 驗證無障礙測試通過（WCAG AA）
  - 驗證視覺回歸測試無異常差異
  - 驗證所有現有卡片功能不受影響（零迴歸）
  - _Requirements: 所有需求的驗收標準_
