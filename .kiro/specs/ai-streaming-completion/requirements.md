# Requirements Document

## Project Description (Updated)

**原始描述**: 完成 AI 串流文字實作

**實際狀況**:
- AI 串流核心功能已實作 85%（SSE endpoint、useStreamingText hook、音效整合、打字機效果）
- 缺少：整合到實際解讀頁面、TTS 語音播放、E2E 測試

**重新定位**:
此規格聚焦於**整合現有的串流功能到解讀流程**，並補充 TTS 語音播放功能。

複雜度: 低-中（主要是整合工作）\
價值: 高（啟用核心體驗）\
理由: 核心功能已實作完成，需要整合到使用者實際使用的頁面中

具體項目：
- ✅ FastAPI SSE endpoint（已完成）
- ✅ React hook for streaming text display（已完成）
- ✅ 打字機效果 + 音效整合（已完成）
- ❌ **整合 StreamingInterpretation 到解讀頁面**（本規格核心）
- ❌ **TTS 語音播放整合**（新功能）
- ⚠️ **補充 E2E 測試和安全性修復**（品質提升）

## Introduction

### 現有架構狀況

根據程式碼分析（2025-11-13），以下功能已完整實作：

#### ✅ Backend 層（100% 完成）
- 📄 `backend/app/api/v1/endpoints/readings_stream.py`
  - `POST /interpretation/stream` - 單卡串流
  - `POST /interpretation/stream-multi` - 多卡串流
  - SSE 格式正確，錯誤處理完善
  - 支援所有 AI providers（Anthropic, OpenAI, Gemini）

- 📄 `backend/app/services/ai_interpretation_service.py`
  - `generate_interpretation_stream()` - AsyncIterator 實作
  - `generate_multi_card_interpretation_stream()` - 多卡支援
  - 整合 character voice、karma、faction

#### ✅ Frontend Hook 層（100% 完成）
- 📄 `src/hooks/useStreamingText.ts`
  - **P0 功能**: 自動重試（3次）、指數退避、超時處理（30s）
  - **P1 功能**: 音效整合（`useAudioEffect`）、節流（50ms）、音量控制
  - **P2 功能**: 離線偵測、Fallback 策略、7種錯誤類型友善訊息
  - **額外功能**: Pause/Resume、Speed multiplier、Random variation
  - **測試覆蓋**: 1586 行 TDD 測試（`.kiro/specs/ai-text-streaming/IMPLEMENTATION_COMPLETE.md`）

#### ✅ UI 元件層（100% 完成）
- 📄 `src/components/readings/StreamingInterpretation.tsx`
  - 完整的串流解讀 UI 元件
  - 整合 useStreamingText hook
  - 支援控制按鈕（skip, pause, resume）

#### ⚠️ 整合狀況（0% 完成）
- ❌ 實際的解讀頁面**未使用** StreamingInterpretation 元件
  - `src/app/readings/[id]/card/[cardId]/page.tsx` - 使用靜態顯示
  - `src/app/readings/quick/card/[cardId]/page.tsx` - 使用靜態顯示
  - StreamingInterpretation 只存在於測試和 lazyLoad 配置中

#### ❌ TTS 整合（0% 完成）
- 無串流完成後的 TTS 觸發邏輯
- 需要偵測 `isComplete = true` 並呼叫 TTS API

### 價值主張

- **啟用已投資的功能**: 85% 的串流功能已開發完成但未啟用，整合後即可釋放價值
- **完整的互動體驗**: 打字機效果 + 音效 + 語音播放形成完整的沉浸式體驗
- **快速交付**: 主要是整合工作，技術風險低，可快速上線

## Requirements

### Requirement 1: StreamingInterpretation 元件整合到解讀頁面

**Objective:** As a user, I want to see AI interpretations displayed with streaming typewriter effect when viewing card readings, so that I experience the immersive Pip-Boy terminal aesthetic in the actual reading flow.

**Current State**: ✅ StreamingInterpretation 元件已實作，❌ 但未用於實際頁面

#### Acceptance Criteria

1. When a user opens a reading card detail page (`/readings/[id]/card/[cardId]`), the Page Component shall use `StreamingInterpretation` component to display the interpretation text
2. When a user opens a quick reading card page (`/readings/quick/card/[cardId]`), the Page Component shall use `StreamingInterpretation` component instead of static text display
3. While the interpretation is streaming, the StreamingInterpretation Component shall display the typewriter animation with blinking cursor
4. When the streaming completes, the StreamingInterpretation Component shall remove the cursor and mark the text as final
5. If the user has enabled audio in settings, then the StreamingInterpretation Component shall play typing sounds during animation
6. The StreamingInterpretation Component shall receive the following props from the parent page: `cardId`, `question`, `characterVoice`, `karmaAlignment`, `factionAlignment`
7. When an error occurs during streaming, the StreamingInterpretation Component shall display a user-friendly error message with a retry button
8. The Integration shall preserve existing URL routing patterns and not require breaking changes to navigation
9. When the user navigates away before streaming completes, the Page Component shall properly cleanup the SSE connection
10. The StreamingInterpretation Component shall display loading skeleton or placeholder during the initial connection phase

**Traceability**:
- Requirement 7 from original spec (Integration with Existing Systems)
- Maps to existing component: `src/components/readings/StreamingInterpretation.tsx`
- Target pages: `src/app/readings/[id]/card/[cardId]/page.tsx`, `src/app/readings/quick/card/[cardId]/page.tsx`

---

### Requirement 2: Text-to-Speech (TTS) 整合

**Objective:** As a user, I want to hear the AI interpretation read aloud after the streaming animation completes, so that I can experience the reading in audio format without manual intervention.

**Current State**: ❌ 未實作（新功能）

#### Acceptance Criteria

1. When the streaming animation completes (`isComplete = true`), the StreamingInterpretation Component shall automatically trigger TTS playback for the full interpretation text
2. Before starting TTS playback, the Component shall check user audio preferences from settings store
3. If the user has disabled TTS in settings, then the Component shall skip TTS playback and only display visual controls
4. While TTS is playing, the StreamingInterpretation Component shall display a visual indicator (e.g., sound wave animation or pause icon)
5. When TTS playback is active, the Component shall provide pause/resume controls for the audio
6. If the user navigates away while TTS is playing, the Component shall stop the audio and cleanup resources
7. The TTS Integration shall use the existing TTS API endpoint or service configured in the project
8. When TTS fails to load or play, then the Component shall log the error but not block the visual text display
9. The Component shall expose TTS playback state via props or events for parent components to monitor
10. When the user manually skips the typewriter animation (via skip button), the Component shall still play TTS after showing the full text

**Implementation Notes**:
- Use existing TTS service if available, or integrate Chirp3 TTS system from project specs
- TTS playback should be opt-in (user can disable in settings)
- Consider voice character consistency (same voice for interpretation display and TTS)

**Traceability**:
- New requirement based on user feedback
- Related to existing `chirp3-hd-tts-system` spec in `.kiro/specs/`

---

### Requirement 3: 安全性修復 - Streaming Endpoint 認證保護

**Objective:** As a system, I want to protect streaming endpoints with authentication, so that only authorized users can access AI interpretation services and prevent abuse.

**Current State**: ❌ Streaming endpoints 缺少 auth dependency

#### Acceptance Criteria

1. When a client requests the streaming endpoint (`/interpretation/stream`), the Backend API shall require a valid JWT token via `Depends(get_current_user)`
2. If the client provides no token or an invalid token, then the Backend API shall return HTTP 401 Unauthorized before establishing the SSE connection
3. When authentication succeeds, the Backend API shall log the user ID with the streaming session for monitoring and analytics
4. The Backend API shall apply the same authentication logic to both `/interpretation/stream` and `/interpretation/stream-multi` endpoints
5. When rate limiting is enforced, the Backend API shall apply limits per authenticated user (not per IP) to prevent abuse
6. The Authentication Implementation shall reuse the existing `get_current_user` dependency from `app/core/dependencies.py`
7. When a streaming session is active, the Backend API shall validate that the reading ID belongs to the authenticated user
8. If the token expires mid-stream (unlikely but possible for long sessions), then the Backend API shall gracefully close the connection with an auth error event
9. The Backend API shall support both Cookie-based and Authorization header token authentication as per existing auth patterns
10. When authentication fails, the Backend API shall return a structured error event in SSE format for the frontend to handle gracefully

**Implementation Notes**:
- Add `current_user: User = Depends(get_current_user)` to both stream endpoints
- Verify reading ownership if reading_id is provided in the request
- Existing middleware (CORS, Rate Limiting) already configured globally

**Traceability**:
- Security gap identified in design review (Issue 1)
- Fixes missing auth in `backend/app/api/v1/endpoints/readings_stream.py:108-266`

---

### Requirement 4: Backend Timeout 保護機制

**Objective:** As a backend system, I want to implement server-side timeout protection for streaming connections, so that hanging connections do not consume resources indefinitely.

**Current State**: ⚠️ Frontend 有 timeout (30s)，Backend 未實作

#### Acceptance Criteria

1. When a streaming session starts, the Backend API shall wrap the async generator with `asyncio.timeout(60)` context manager
2. If the AI provider does not yield a token within 60 seconds, then the Backend API shall send a timeout error event and close the connection
3. When a timeout occurs, the Backend API shall log the timeout event with context (user ID, provider, request metadata) for monitoring
4. The Timeout Duration shall be configurable via environment variable (default 60 seconds)
5. When the timeout is triggered, the Backend API shall send an SSE error event: `data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n`
6. The Backend API shall properly cleanup AI provider resources (close HTTP clients, abort requests) when timeout is triggered
7. When implementing timeout, the Backend API shall ensure that partial text already streamed is not lost (frontend already handles this)
8. The Timeout Implementation shall not interfere with normal streaming completion (successful cases should not be affected)
9. When monitoring streaming performance, the Backend API shall track timeout occurrences and their frequency per AI provider
10. The Backend API shall use the same timeout mechanism for both single-card and multi-card streaming endpoints

**Implementation Notes**:
- Use Python 3.11+ `asyncio.timeout()` context manager
- Wrap the async generator in `readings_stream.py:131-152` and `readings_stream.py:235-256`
- Example: `async with asyncio.timeout(timeout_seconds): async for chunk in ai_service.generate_interpretation_stream(...)`

**Traceability**:
- Design review Issue 1 (timeout handling)
- Complements frontend timeout in `useStreamingText.ts`

---

### Requirement 5: Performance Monitoring 整合

**Objective:** As a development team, I want to monitor streaming performance metrics, so that we can identify bottlenecks and ensure the 2-second first-token latency target is met.

**Current State**: ⚠️ PerformanceMonitor 基礎建設存在，未整合至 streaming endpoints

#### Acceptance Criteria

1. When a streaming session starts, the Backend API shall record the timestamp and request metadata (user ID, card ID, provider)
2. When the first token is yielded from the AI provider, the Backend API shall calculate and record the first-token latency (time from request to first token)
3. When streaming completes, the Backend API shall calculate and record: total duration, total tokens, average tokens/second
4. The Backend API shall emit streaming metrics to the existing `PerformanceMonitor` instance from `app/monitoring/performance.py`
5. When the `/metrics` monitoring endpoint is queried, the Response shall include streaming-specific metrics: `first_token_p95_ms`, `avg_tokens_per_second`, `streaming_error_rate`
6. The Metrics Collection shall use the existing `PerformanceMetrics` dataclass and extend it with streaming-specific fields if needed
7. When calculating P95 latency, the Backend API shall use in-memory sliding window of recent 1000 requests (existing pattern in PerformanceMonitor)
8. The Backend API shall track metrics separately per AI provider to identify provider-specific performance issues
9. When streaming errors occur, the Backend API shall increment error counters and categorize by error type (timeout, AI error, network error)
10. The Metrics Implementation shall not impact streaming latency (use background tasks or async logging)

**Implementation Notes**:
- Reuse `backend/app/monitoring/performance.py:32-100` PerformanceMonitor class
- Add decorator or context manager to `readings_stream.py` endpoints
- Metrics endpoint already exists: `GET /api/v1/monitoring/metrics`

**Traceability**:
- Design review Issue 2 (Performance Monitoring)
- Requirement 6 from original spec (Performance and Optimization)

---

### Requirement 6: End-to-End Testing 補充

**Objective:** As a development team, I want comprehensive E2E tests for the complete streaming flow, so that we ensure the integration works correctly in production-like scenarios.

**Current State**: ✅ 單元測試完整（1586 行），❌ 缺 E2E 測試

#### Acceptance Criteria

1. When running the E2E test suite, the Tests shall include a test scenario for the complete user flow: navigate to reading page → trigger interpretation → see streaming animation → verify TTS playback
2. The E2E Tests shall use Playwright to simulate real browser interactions including network conditions
3. When testing the streaming flow, the Tests shall verify that the typewriter animation displays characters progressively (not all at once)
4. The E2E Tests shall verify that the blinking cursor appears during animation and disappears on completion
5. When testing audio integration, the Tests shall verify that typing sounds are triggered (by checking audio context calls, not actual sound output)
6. The E2E Tests shall include error scenarios: network interruption during streaming, AI provider timeout, authentication failure
7. When testing retry logic, the Tests shall verify that the frontend automatically retries after transient failures
8. The E2E Tests shall verify that navigating away mid-stream properly cleans up connections (no memory leaks)
9. When testing accessibility, the Tests shall verify that streaming text updates are announced to screen readers via ARIA live regions
10. The E2E Tests shall run against a staging environment with real backend API (not mocked) to catch integration issues

**Implementation Notes**:
- Use Playwright framework (already in project dependencies)
- Create test file: `e2e/streaming-interpretation-flow.spec.ts`
- Mock AI provider responses for predictable test behavior
- Verify SSE connection establishment via browser DevTools protocol

**Traceability**:
- Requirement 8 from original spec (Testing and Quality Assurance)
- Complements existing unit tests in `src/hooks/__tests__/useStreamingText.*.test.ts`

---

## Non-Functional Requirements

### Performance Requirements
- **First Token Latency**: P95 < 2 seconds from request to first displayed character
- **Streaming Throughput**: Minimum 50 tokens/second display rate
- **Animation Frame Rate**: Maintain 60fps during typewriter animation
- **Page Load Impact**: StreamingInterpretation integration shall not increase page load time by >200ms

### Accessibility Requirements
- **Screen Reader Support**: Streaming text shall be announced via ARIA live region (`aria-live="polite"`)
- **Keyboard Navigation**: All streaming controls (skip, pause, resume, TTS controls) shall be keyboard accessible
- **Visual Feedback**: TTS playback state shall be clearly indicated visually (not audio-only)
- **Color Contrast**: Pip-Boy green text (`#00ff88`) on dark background meets WCAG AA (verified: 7.3:1 ratio)

### Security Requirements
- **Authentication**: Both `/interpretation/stream` endpoints shall require valid JWT token
- **Authorization**: Verify reading ownership before streaming (reading belongs to authenticated user)
- **Rate Limiting**: 10 streaming requests per minute per user (existing global rate limiter)
- **Input Validation**: Sanitize `question` parameter to prevent injection attacks

### Compatibility Requirements
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (EventSource API support)
- **Mobile Support**: iOS Safari 14+, Chrome Mobile 90+ (tested on real devices)
- **TTS Compatibility**: Gracefully degrade if TTS service unavailable (show text-only)

### Maintainability Requirements
- **Code Documentation**: Add JSDoc comments to new integration code
- **Migration Path**: Document how to enable/disable streaming per reading type (feature flag)
- **Rollback Plan**: Preserve existing static display as fallback option
- **Logging**: Log all streaming sessions (start, complete, errors) for debugging

## Success Criteria

### User Experience Metrics
- **Feature Adoption**: >90% of readings use streaming display within 1 week of deployment
- **Completion Rate**: >95% of started streaming sessions complete successfully
- **User Satisfaction**: Collect feedback on streaming + TTS experience (target >80% positive)

### Technical Metrics
- **Error Rate**: <1% streaming request failures (excluding user cancellations)
- **Performance**: 95% of requests meet <2s first token latency target
- **Test Coverage**: E2E tests cover all 6 integration scenarios (normal flow, errors, TTS, auth)

### Business Metrics
- **Engagement**: Average time on reading page increases by >15% (streaming + TTS increases dwell time)
- **Retention**: 7-day retention rate improves by >5% after streaming integration
- **Support Tickets**: <3 streaming-related support requests per 100 users monthly

## Out of Scope

以下項目已在其他 spec 中處理，不在本規格範圍內：

- ✅ **Core Streaming Implementation**: 已完成於 `.kiro/specs/ai-text-streaming/`
- ✅ **Audio System**: 已完成於 `.kiro/specs/web-audio-system/`
- ⚠️ **Chirp3 TTS System**: 參考 `.kiro/specs/chirp3-hd-tts-system/`（本規格只做整合）
- ❌ **Streaming for Multi-Card Spreads**: 本規格聚焦單卡，多卡整合為後續階段
- ❌ **Streaming Chat/Conversation**: 不適用於塔羅解讀場景

## Dependencies

- ✅ `.kiro/specs/ai-text-streaming/` - Core streaming implementation (COMPLETE)
- ✅ `.kiro/specs/web-audio-system/` - Audio engine (COMPLETE)
- ⚠️ `.kiro/specs/chirp3-hd-tts-system/` - TTS service (reference for integration)
- ✅ Existing auth system (`app/core/dependencies.py`)
- ✅ Existing monitoring system (`app/monitoring/performance.py`)
