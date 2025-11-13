# Research Document - AI Streaming Completion

## Overview
This document captures the discovery and research findings for completing the AI streaming text implementation feature.

## Discovery Classification
**Type**: Light Discovery (Extension)
**Rationale**: Most components already exist; this is primarily completing missing integrations and ensuring robust implementation.

## Existing System Analysis

### Backend Architecture

#### AI Provider System (✅ Complete)
- **Location**: `backend/app/services/ai_providers/`
- **Pattern**: Factory pattern with abstract base class
- **Providers**: Anthropic Claude, OpenAI GPT, Google Gemini
- **Key Interface**:
  ```python
  class AIProvider(ABC):
      async def generate_completion_stream(
          self, system_prompt: str, user_prompt: str,
          max_tokens: int = 500, temperature: float = 0.8,
          **kwargs
      ) -> AsyncIterator[str]:
          """Generate AI completion as a stream of text chunks"""
  ```

#### Streaming Endpoint (✅ Exists, needs completion)
- **Location**: `backend/app/api/v1/endpoints/readings_stream.py`
- **Implementation**: FastAPI with StreamingResponse
- **Format**: Server-Sent Events (SSE)
- **Features**:
  - Single card interpretation streaming
  - Multi-card spread interpretation streaming
  - Character voice support
  - Karma and faction alignment context

#### AIInterpretationService (✅ Complete)
- **Location**: `backend/app/services/ai_interpretation_service.py`
- **Features**:
  - Multi-provider support
  - In-memory caching
  - Character voice prompts
  - Streaming method exists

### Frontend Architecture

#### useStreamingText Hook (✅ Nearly Complete)
- **Location**: `src/hooks/useStreamingText.ts`
- **Features Implemented**:
  - ✅ SSE connection management
  - ✅ Typewriter effect with configurable speed
  - ✅ Retry logic with exponential backoff (max 3 retries)
  - ✅ Error classification and user-friendly messages
  - ✅ Pause/resume controls
  - ✅ Speed adjustment (1x, 2x)
  - ✅ Skip functionality
  - ✅ Network status monitoring
  - ✅ Fallback to non-streaming endpoint
  - ⚠️ Audio integration (implemented but needs verification)

#### StreamingInterpretation Component (✅ Complete)
- **Location**: `src/components/readings/StreamingInterpretation.tsx`
- **Features**:
  - Single and multi-card variants
  - Retry state UI
  - Loading indicators
  - Error display
  - Streaming controls (pause, speed, skip)
  - Completion indicator

#### Audio System (✅ Complete)
- **Location**: `src/hooks/audio/useAudioEffect.ts`
- **Pattern**: Centralized AudioEngine singleton
- **Features**:
  - Volume control
  - Mute support
  - Sound effect playback
  - Global audio state management

## Technology Research

### FastAPI SSE Streaming Best Practices (2025)

**Source**: Web search results

#### Key Findings:
1. **StreamingResponse Pattern**:
   - Use FastAPI's `StreamingResponse` with `media_type="text/event-stream"`
   - Required headers: `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`

2. **SSE Message Format**:
   - Each message: `data: {content}\n\n`
   - Completion signal: `data: [DONE]\n\n`
   - Error signal: `data: [ERROR] {message}\n\n`

3. **Client Disconnection Handling**:
   - Check `await request.is_disconnected()` periodically
   - Gracefully clean up resources on disconnect

4. **Async Generator Pattern**:
   ```python
   async def generate_stream():
       async for chunk in ai_provider.generate_completion_stream(...):
           yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
       yield "data: [DONE]\n\n"
   ```

5. **CORS Configuration**:
   - Essential for cross-origin requests
   - Already handled in `backend/app/config.py`

6. **Zero Buffering**:
   - Flush each token immediately (no buffering delay)
   - Required for real-time streaming experience

### React Web Audio API Best Practices (2025)

**Source**: Web search results

#### Key Findings:
1. **AudioContext Management**:
   - Define AudioContext outside React components to avoid re-creation on renders
   - ✅ Already implemented in `AudioEngine` singleton pattern

2. **Autoplay Policy Compliance**:
   - Must create/resume context from user gesture (click event)
   - ✅ Already handled by `isAudioEnabled` check in `useAudioEffect`

3. **Rapid Sound Effects**:
   - Throttle playback for typing sounds to avoid audio overlap
   - ✅ Already implemented in `useStreamingText` with `soundThrottle` option

4. **Accessibility**:
   - Provide mute button with keyboard navigation
   - ✅ Already available via `audioStore` muted state

5. **Sound Generation**:
   - Oscillator nodes for synthetic sounds (no external files needed)
   - AudioEngine should support procedural sound generation

### EventSource API Patterns (2025)

**Source**: Web search results

#### Key Findings:
1. **Native Retry Mechanism**:
   - EventSource auto-reconnects with small delay (few seconds)
   - Can configure with `retry:` field in SSE response

2. **Custom Reconnection**:
   - Exponential backoff: `Math.min(1000 * 2^attempt, 30000)` (cap at 30s)
   - ✅ Already implemented in `useStreamingText`

3. **Libraries**:
   - `reconnecting-eventsource`: Auto-reconnect wrapper
   - Not needed - custom implementation already robust

4. **Error Handling**:
   - Classify errors: offline, timeout, 4xx, 5xx
   - ✅ Already implemented with `classifyError` function

## Architecture Alignment

### Steering Compliance

#### Technology Stack Alignment
- ✅ Backend: FastAPI + Python 3.11+ (async/await)
- ✅ Frontend: React 19 + TypeScript 5
- ✅ Multi-provider AI strategy (Anthropic, OpenAI, Gemini)
- ✅ Zustand for state (audioStore)
- ✅ Web Audio API for sound effects

#### Design Principles
- ✅ Single Responsibility: Each hook/component has clear purpose
- ✅ Type Safety: Full TypeScript coverage, no `any` types
- ✅ Error Boundaries: Comprehensive error handling
- ✅ User Context: Karma and faction alignment personalization

### Domain Boundaries

#### Backend Boundaries
- **AI Providers Domain**: Abstract provider interface, factory pattern
- **Streaming Domain**: FastAPI endpoints, SSE formatting
- **Interpretation Domain**: Prompt engineering, character voices

#### Frontend Boundaries
- **Streaming Hook Domain**: SSE connection, retry logic, state management
- **Display Domain**: Typewriter animation, UI components
- **Audio Domain**: Sound effect playback, volume control

**No boundary conflicts identified** - clear separation of concerns.

## Integration Points

### Backend → Frontend
- **Protocol**: Server-Sent Events (SSE)
- **Endpoint**: `POST /api/v1/readings/interpretation/stream`
- **Format**: `data: {text_chunk}\n\n`
- **Completion**: `data: [DONE]\n\n`
- **Error**: `data: [ERROR] {message}\n\n`

### Frontend Audio Integration
- **Hook**: `useAudioEffect` provides `playSound` function
- **Integration**: `useStreamingText` calls `playSound('typing')` on each character
- **Throttling**: Max 20 sounds/second via `soundThrottle` option

### AI Provider Integration
- **Service**: `AIInterpretationService` wraps provider access
- **Method**: `generate_interpretation_stream` → calls provider's `generate_completion_stream`
- **Context**: Includes card data, character voice, karma, faction

## Design Decisions

### 1. Complete vs Extend
**Decision**: Extend existing implementation with missing pieces
**Rationale**:
- Core architecture already sound and tested
- Avoids rewriting working code
- Focuses effort on gaps (audio integration, test coverage)

### 2. SSE vs WebSocket
**Decision**: Continue with SSE (already implemented)
**Rationale**:
- Simpler than WebSocket for server→client streaming
- Native browser reconnection
- No need for bidirectional communication
- Already deployed in `readings_stream.py`

### 3. Custom Retry vs Library
**Decision**: Keep custom retry implementation
**Rationale**:
- Already comprehensive with exponential backoff
- Full control over retry behavior
- No additional dependency needed

### 4. Typing Sound Approach
**Decision**: Use existing AudioEngine, generate synthetic sounds
**Rationale**:
- No external audio files needed (bandwidth efficient)
- AudioEngine already supports procedural generation
- Consistent with existing audio architecture

### 5. Typewriter Animation Strategy
**Decision**: Keep RAF-based approach with FPS monitoring
**Rationale**:
- Already implemented with batch rendering for low FPS
- Smooth 60fps performance on modern devices
- Adaptive performance optimization built-in

## External Dependencies

### Backend Dependencies (All existing)
- `fastapi`: StreamingResponse support
- `anthropic`, `openai`, `google-generativeai`: AI providers
- No new dependencies required

### Frontend Dependencies (All existing)
- Native EventSource API (browser built-in)
- Web Audio API (browser built-in)
- No new dependencies required

## Risks and Mitigations

### Risk 1: AI Provider Rate Limits
**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Connection pooling (configurable, default 10)
- Rate limiting middleware (10 requests/minute per user)
- Circuit breaker pattern (auto-switch providers on failure)
- Already specified in requirements

### Risk 2: Network Instability
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:
- Retry logic with exponential backoff (already implemented)
- Fallback to non-streaming endpoint (already implemented)
- Network status monitoring (already implemented)
- User-friendly error messages (already implemented)

### Risk 3: Audio Performance on Mobile
**Likelihood**: Low
**Impact**: Low
**Mitigation**:
- Optional audio (disabled by default)
- Throttled sound playback (max 20/sec)
- AudioEngine manages context lifecycle
- Graceful degradation if Web Audio unavailable

### Risk 4: Memory Leaks in Long Sessions
**Likelihood**: Low
**Impact**: Medium
**Mitigation**:
- Proper cleanup in useEffect
- AbortController for request cancellation
- Clear intervals on unmount
- Already implemented in `useStreamingText`

## Performance Considerations

### Target Metrics (from requirements)
- First token: <2 seconds (P95)
- Streaming throughput: ≥50 tokens/second
- Animation frame rate: 60fps
- Concurrent users: ≥100 sessions

### Optimization Strategies
1. **Backend**:
   - Connection pooling for AI providers
   - Zero buffering (immediate token flush)
   - HTTP/2 for multiplexed connections

2. **Frontend**:
   - RAF-based animation (already implemented)
   - Batch rendering when FPS <30 (already implemented)
   - Lazy audio initialization
   - Text queue management for consistent display rate

### Monitoring
- FastAPI middleware for latency tracking
- Token count logging
- Error rate by provider
- Already specified in requirements

## Testing Strategy

### Unit Tests Required
1. **Backend**:
   - AI provider streaming (mock responses)
   - SSE formatting (data/done/error events)
   - Error handling (provider failures, timeouts)

2. **Frontend**:
   - useStreamingText hook (state updates, retry, error classification)
   - Typewriter animation (timing, pause/resume, skip)
   - Audio integration (throttling, volume, mute)

### Integration Tests Required
1. End-to-end streaming flow (FastAPI → React)
2. Multi-provider fallback
3. Network failure recovery
4. Concurrent streaming sessions

### E2E Tests Required
1. Complete reading with streaming
2. User controls (pause, speed, skip)
3. Error scenarios (offline, timeout)
4. Audio enable/disable

## Implementation Gaps

### Backend Gaps
1. **TODO in readings_stream.py**: Complete SSE streaming logic
2. **Testing**: Add streaming-specific tests
3. **Monitoring**: Implement performance metrics endpoint

### Frontend Gaps
1. **Audio Integration**: Verify typing sound works with streaming
2. **Testing**: Increase test coverage (target 85%+ backend, 80%+ frontend)
3. **Accessibility**: Screen reader announcements for streaming text

### Documentation Gaps
1. API documentation (FastAPI OpenAPI)
2. Component usage examples
3. Troubleshooting guide

## Recommendations

### High Priority
1. Complete backend streaming implementation (TODOs)
2. Verify audio integration with streaming
3. Add comprehensive test suite
4. Implement performance monitoring

### Medium Priority
1. Add screen reader support (ARIA live regions)
2. Document API contracts
3. Create usage examples

### Low Priority
1. Optimize for very low bandwidth scenarios
2. Add streaming analytics dashboard
3. Implement A/B testing for animation speeds

## Conclusion

The AI streaming completion feature is **80% complete** with solid architectural foundations. The primary work involves:
1. Completing backend streaming implementation
2. Ensuring audio integration works correctly
3. Adding comprehensive tests
4. Implementing monitoring/observability

**No major architectural changes required** - extend and complete existing implementation.

---

*Research completed*: 2025-11-13
*Discovery type*: Light (Extension)
*Architectural alignment*: ✅ Compliant
