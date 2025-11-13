# 實作計畫

## 任務概覽

此規格為**整合專案**而非新功能開發。85% 的核心串流功能已實作完成,本計畫聚焦於:
1. 整合 StreamingInterpretation 元件到實際解讀頁面
2. 新增 TTS 語音播放功能
3. 補強後端安全性(認證保護、timeout 保護)
4. 整合效能監控機制
5. 補充 E2E 測試覆蓋

## 實作任務

- [ ] 1. 整合 StreamingInterpretation 元件到解讀頁面
- [ ] 1.1 (P) 整合到 ReadingCardPage (`/readings/[id]/card/[cardId]`)
  - 移除現有靜態解讀顯示元件
  - 引入 `StreamingInterpretation` 元件 (`src/components/readings/StreamingInterpretation.tsx`)
  - 傳遞必要 props: cardId, question, characterVoice, karmaAlignment, factionAlignment
  - 配置 API endpoint: `/api/v1/readings/interpretation/stream`
  - 實作 onComplete callback(準備 TTS 觸發點)
  - 實作 onError callback(顯示使用者友善錯誤訊息)
  - 確保頁面 cleanup 時關閉 SSE 連線
  - _Requirements: 1_

- [ ] 1.2 (P) 整合到 QuickReadingCardPage (`/readings/quick/card/[cardId]`)
  - 移除現有靜態解讀顯示元件
  - 引入 `StreamingInterpretation` 元件
  - 傳遞必要 props(同 1.1)
  - 使用相同 API endpoint
  - 實作相同 callbacks
  - 確保頁面 cleanup 邏輯一致
  - _Requirements: 1_

- [ ] 1.3 驗證 StreamingInterpretation 元件功能
  - 確認打字機動畫正常運作(字元逐一顯示、游標閃爍)
  - 驗證控制按鈕運作(pause, resume, skip)
  - 測試音效整合(typing sounds)
  - 確認 loading skeleton 顯示正確
  - 驗證錯誤訊息顯示與 retry 機制
  - 測試不同 AI providers 的串流表現
  - _Requirements: 1_

- [ ] 2. 實作 TTS 語音播放功能
- [ ] 2.1 (P) 建立 TTS Player 元件
  - 建立 `src/components/readings/TTSPlayer.tsx` 元件
  - 設計 UI: 播放控制按鈕(play, pause, stop)、進度條、狀態指示器
  - 實作 props interface: text, enabled, characterVoice, onPlaybackComplete
  - 加入 Pip-Boy 風格樣式(Cubic 11 字體、Pip-Boy green 配色)
  - 實作無障礙標籤(ARIA labels for controls)
  - 確保 keyboard navigation 支援
  - _Requirements: 2_

- [ ] 2.2 (P) 建立 useTTS hook
  - 建立 `src/hooks/useTTS.ts` hook
  - 實作 state management: isLoading, isPlaying, isPaused, isComplete, error, progress, duration
  - 實作控制方法: play(), pause(), resume(), stop(), setVolume()
  - 整合 TTS API 呼叫(參考 chirp3-hd-tts-system spec)
  - 實作錯誤處理(network, timeout, 4xx, 5xx)
  - 監聽 audioStore 設定(muted, volume)
  - 實作 cleanup 邏輯(unmount 時停止播放)
  - _Requirements: 2_

- [ ] 2.3 整合 TTS 到 StreamingInterpretation
  - 在 StreamingInterpretation 元件中引入 TTSPlayer
  - 偵測 `isComplete = true` 時顯示 TTSPlayer
  - 傳遞完整解讀文字至 TTSPlayer
  - 檢查 audioStore 設定決定是否 auto-play
  - 確保 TTS 失敗不影響文字顯示(graceful degradation)
  - 實作 TTS 播放完成後的 callback
  - _Requirements: 2_

- [ ] 3. 實作後端安全性修復
- [ ] 3.1 (P) 加入 Streaming Endpoint 認證保護
  - 修改 `backend/app/api/v1/endpoints/readings_stream.py` 兩個端點
  - 加入 `current_user: User = Depends(get_current_user)` 依賴
  - 驗證 JWT token 有效性(依賴現有 auth dependency)
  - 記錄 user ID with streaming session(for monitoring)
  - 實作 401 錯誤回應(在 SSE 連線前返回)
  - (Optional) 實作 reading ownership check(驗證 reading_id 屬於該 user)
  - 確保 error event 以 SSE 格式返回(frontend graceful handling)
  - _Requirements: 3_

- [ ] 3.2 (P) 實作 Backend Timeout 保護機制
  - 加入 `asyncio.timeout` wrapper 至 streaming async generator
  - 設定預設 timeout: 60 秒(可透過環境變數配置 `STREAMING_TIMEOUT`)
  - 捕捉 `asyncio.TimeoutError` 並發送 SSE error event: `data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n`
  - 記錄 timeout 事件(user ID, provider, context)
  - 確保 AI provider resources cleanup(close HTTP clients, abort requests)
  - 驗證正常 streaming 不受影響(timeout 僅在超時觸發)
  - 套用至兩個 streaming endpoints(`/stream` 和 `/stream-multi`)
  - _Requirements: 4_

- [ ] 4. 實作效能監控整合
- [ ] 4.1 (P) 擴展 PerformanceMonitor 支援 Streaming Metrics
  - 修改 `backend/app/monitoring/performance.py` 的 PerformanceMonitor 類別
  - 新增方法: `record_first_token_latency(latency_ms: float)`
  - 新增方法: `record_streaming_completion(duration_ms: float, token_count: int)`
  - 新增方法: `record_streaming_error()`
  - 實作 P95 latency 計算(sliding window of recent 1000 requests)
  - 分開追蹤不同 AI provider 的 metrics
  - 擴展 `/metrics` endpoint 回應(加入 streaming-specific metrics)
  - _Requirements: 5_

- [ ] 4.2 (P) 整合 PerformanceMonitor 到 Streaming Endpoints
  - 在 streaming endpoints 記錄 session 開始時間
  - 在首個 token yield 時計算並記錄 first-token latency
  - 在 streaming 完成時記錄 total duration, token count, avg tokens/sec
  - 在錯誤發生時記錄 error metrics
  - 使用 background task 避免影響 streaming latency
  - 確保 metrics 不洩漏敏感資訊(user data)
  - _Requirements: 5_

- [ ] 5. 補充測試覆蓋
- [ ] 5.1 (P) Backend 認證測試
  - 建立 `backend/tests/unit/test_streaming_auth.py`
  - 測試 valid token → streaming succeeds
  - 測試 invalid token → 401 before SSE connection
  - 測試 missing token → 401 error
  - 測試 expired token → 401 error
  - (Optional) 測試 reading ownership check
  - _Requirements: 3_

- [ ] 5.2 (P) Backend Timeout 測試
  - 建立 `backend/tests/unit/test_streaming_timeout.py`
  - Mock AI provider 延遲回應(>60s)
  - 驗證 `asyncio.TimeoutError` 捕捉正確
  - 驗證 SSE error event `[ERROR] 連線逾時` 發送
  - 驗證 connection cleanup
  - 驗證正常 streaming 不受影響
  - _Requirements: 4_

- [ ] 5.3 (P) Backend Performance Monitoring 測試
  - 建立 `backend/tests/unit/test_streaming_metrics.py`
  - 測試 first-token latency 記錄
  - 測試 completion metrics 記錄(duration, token count)
  - 測試 error metrics 增量
  - 驗證 P95 latency 計算正確
  - 測試不同 AI provider metrics 分開追蹤
  - _Requirements: 5_

- [ ] 5.4 (P) Frontend TTS Hook 測試
  - 建立 `src/hooks/__tests__/useTTS.test.ts`
  - 測試 state 更新(isLoading, isPlaying, isPaused)
  - Mock TTS API 回應
  - 測試 play, pause, resume, stop 功能
  - 測試錯誤處理(network, timeout, 4xx, 5xx)
  - 測試 audioStore 設定尊重(muted, volume)
  - 測試 cleanup(unmount 時停止播放)
  - _Requirements: 2_

- [ ] 5.5 (P) Frontend TTS Player 元件測試
  - 建立 `src/components/readings/__tests__/TTSPlayer.test.tsx`
  - 測試控制按鈕渲染(play, pause, stop)
  - 測試進度條顯示
  - 測試 callback 觸發(onPlaybackComplete)
  - 測試無障礙屬性(ARIA labels)
  - 測試 keyboard navigation
  - _Requirements: 2_

- [ ] 5.6 E2E 完整流程測試
  - 建立 `tests/e2e/streaming-reading-complete.spec.ts`(Playwright)
  - 測試: Login → Navigate to reading page → See streaming text → Hear TTS playback
  - 驗證打字機動畫可見
  - 驗證 TTS 控制按鈕出現
  - 驗證 TTS auto-play(if enabled)
  - 測試 pause, resume, stop 控制
  - 驗證無障礙性(screen reader announcements)
  - _Requirements: 1, 2, 6_

- [ ] 5.7 (P) E2E 認證失敗測試
  - 建立 `tests/e2e/streaming-auth-failure.spec.ts`
  - 測試 invalid token → 401 error message
  - 驗證 "請重新登入" 訊息顯示
  - 測試 retry button 運作
  - _Requirements: 3, 6_

- [ ] 5.8 (P) E2E Timeout 情境測試
  - 建立 `tests/e2e/streaming-timeout.spec.ts`
  - Mock AI provider 延遲(>60s)
  - 驗證 timeout error message 顯示
  - 驗證 retry button 可用
  - 測試 retry 後成功流程
  - _Requirements: 4, 6_

- [ ] 6. 部署準備與驗證
- [ ] 6.1 環境配置檢查
  - 驗證 `STREAMING_TIMEOUT` 環境變數配置(預設 60 秒)
  - 確認 TTS API 配置(URL, API key)
  - 檢查 CORS 設定(frontend origins)
  - 驗證 AI provider API keys
  - 確認 Zeabur HTTP/2 啟用(multiplexed SSE connections)
  - _Requirements: 1, 2, 3, 4, 5_

- [ ] 6.2 最終功能驗證
  - 在 staging 環境執行完整測試 suite
  - 驗證 first token latency P95 <2 秒
  - 確認 streaming throughput ≥50 tokens/sec
  - 驗證 TTS load time <3 秒
  - 測試 error rate <1%
  - 確認無障礙性 WCAG AA compliant
  - _Requirements: 1, 2, 3, 4, 5, 6_

- [ ] 6.3 效能與監控最終檢查
  - 驗證 `/api/v1/monitoring/metrics` endpoint 回應正確
  - 確認 streaming metrics 顯示(first_token_p95_ms, avg_tokens_per_second, streaming_error_rate)
  - 測試 100 並發使用者情境(無 connection pooling 錯誤)
  - 驗證 logging 正常運作(all streaming sessions logged)
  - 確認 Rollback trigger 設定(auth error >5%, TTS failure >30%, timeout >10%)
  - _Requirements: 5_

## 需求覆蓋確認

所有 6 個主要需求已完整映射至實作任務:

- **Requirement 1**(StreamingInterpretation 元件整合): Task 1.1, 1.2, 1.3, 5.6, 6.2
- **Requirement 2**(TTS 語音播放整合): Task 2.1, 2.2, 2.3, 5.4, 5.5, 5.6, 6.2
- **Requirement 3**(Streaming endpoint 認證保護): Task 3.1, 5.1, 5.7, 6.1
- **Requirement 4**(Backend timeout 保護機制): Task 3.2, 5.2, 5.8, 6.1
- **Requirement 5**(Performance monitoring 整合): Task 4.1, 4.2, 5.3, 6.3
- **Requirement 6**(E2E 測試補充): Task 5.6, 5.7, 5.8, 6.2

非功能性需求(效能、無障礙、安全性)透過 Task 3(安全性)、Task 5(測試)、Task 6(部署驗證)覆蓋。

## 平行執行建議

以下任務可同時開發(無資料依賴或檔案衝突):

### 第一波平行任務(Backend 安全性與監控)
- Task 3.1 (認證保護)
- Task 3.2 (Timeout 保護)
- Task 4.1 (PerformanceMonitor 擴展)
- Task 5.1, 5.2, 5.3 (Backend 測試)

### 第二波平行任務(Frontend TTS 實作)
- Task 2.1 (TTS Player 元件)
- Task 2.2 (useTTS hook)
- Task 5.4, 5.5 (TTS 測試)

### 第三波平行任務(整合與 E2E)
- Task 1.1, 1.2 (頁面整合,需等待 Backend Task 3 完成)
- Task 2.3 (TTS 整合,需等待 Task 2.1, 2.2)
- Task 5.6, 5.7, 5.8 (E2E 測試,需等待 Task 1, 2 完成)

### 最終任務(順序執行)
- Task 1.3 (驗證整合)
- Task 4.2 (整合 PerformanceMonitor,需等待 Task 4.1 完成)
- Task 6.1, 6.2, 6.3 (部署準備,需等待所有前置任務)

## 品質門檻

- Backend 測試覆蓋率 ≥85%(加入新測試後維持)
- Frontend 測試覆蓋率 ≥80%(加入新測試後維持)
- 所有 E2E 測試通過(Playwright)
- 效能指標符合目標:
  - First token latency P95 <2 秒
  - Streaming throughput ≥50 tokens/sec
  - TTS load time <3 秒
- 無障礙測試通過(WCAG AA)
- Auth error rate <5%
- TTS failure rate <30%
- Backend timeout rate <10%

## 注意事項

### 整合專案特性
- **不重新實作**: 85% 核心功能已完成,僅整合與補強
- **保留現有架構**: 不重構 useStreamingText hook 或 StreamingInterpretation 元件
- **參考現有實作**: TTS API 參考 `.kiro/specs/chirp3-hd-tts-system/` spec

### 關鍵依賴
- Task 1.x 依賴 Task 3.x(Backend 認證與 timeout 保護需先完成)
- Task 2.3 依賴 Task 2.1, 2.2(TTS Player 與 hook 需先實作)
- Task 5.6, 5.7, 5.8 依賴 Task 1, 2(E2E 測試需完整實作)
- Task 6.x 依賴所有前置任務(部署準備需所有功能就緒)

### 風險與緩解
- **TTS API 不可用**: Graceful degradation,顯示文字但不播放語音
- **Backend timeout 過短**: 可透過環境變數調整 `STREAMING_TIMEOUT`
- **Performance metrics 影響延遲**: 使用 background task 異步記錄
- **Auth 失敗率高**: Feature flag 控制,逐步 rollout(10% → 25% → 50% → 100%)
