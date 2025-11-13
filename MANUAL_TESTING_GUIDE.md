# Manual Testing Guide - StreamingInterpretation Component
**Task 1.3: Functional Verification**

---

## Prerequisites

1. **Development server running**:
   ```bash
   bun dev
   ```
   Server should be at: http://localhost:3000

2. **Backend API running**:
   - Verify backend is accessible
   - Check API endpoint: `/api/v1/readings/interpretation/stream`

3. **Browser DevTools open**:
   - Console tab for logs
   - Network tab for SSE connection monitoring

---

## Test Suite 1: Typewriter Animation

### Test 1.1: Basic Animation
**Steps**:
1. Navigate to http://localhost:3000/readings/quick
2. Click any card from the carousel
3. Observe the "AI 智慧解讀" section

**Expected Results**:
- ✅ Loading message appears: "AI is thinking..."
- ✅ Spinner animation visible
- ✅ Characters appear one by one (typewriter effect)
- ✅ Blinking cursor visible during streaming
- ✅ Cursor disappears when complete
- ✅ Green checkmark with "Interpretation complete" message

**Screenshot Location**: Take screenshot of animation in progress

---

### Test 1.2: Animation Speed
**Steps**:
1. Start a new reading
2. Count how many characters appear per second
3. Expected: ~40 characters/second (default)

**Expected Results**:
- ✅ Smooth animation (not too fast, not too slow)
- ✅ No visual lag or stuttering
- ✅ Consistent speed throughout

---

## Test Suite 2: Control Buttons

### Test 2.1: Pause/Resume
**Steps**:
1. Start a streaming interpretation
2. Click "暫停" (Pause) button
3. Observe animation stops
4. Click "繼續" (Resume) button
5. Observe animation continues from where it stopped

**Expected Results**:
- ✅ Pause button visible during streaming (top-right corner)
- ✅ Animation pauses immediately when clicked
- ✅ Button text changes to "繼續"
- ✅ Animation resumes when "繼續" clicked
- ✅ No text lost during pause

**Console Check**: No errors in console during pause/resume

---

### Test 2.2: Speed Control (2x)
**Steps**:
1. Start a streaming interpretation
2. Click "2x" button
3. Observe faster animation
4. Click "2x" again to toggle back to 1x

**Expected Results**:
- ✅ "2x" button visible during streaming
- ✅ Animation speed doubles immediately
- ✅ Button style changes when active (default variant)
- ✅ Speed returns to normal when toggled off
- ✅ No characters skipped

---

### Test 2.3: Skip Functionality
**Steps**:
1. Start a streaming interpretation
2. Click "跳過" (Skip) button after ~2 seconds
3. Observe full text appears instantly

**Expected Results**:
- ✅ "跳過" button visible during streaming
- ✅ Full text appears immediately
- ✅ Cursor disappears immediately
- ✅ "Interpretation complete" message appears
- ✅ Control buttons disappear
- ✅ TTS player appears (if audio enabled)

---

## Test Suite 3: Audio Integration

### Test 3.1: Typing Sounds (Audio Enabled)
**Setup**:
1. Open settings (if available) or check audioStore state
2. Ensure audio is NOT muted
3. Ensure SFX volume > 0

**Steps**:
1. Start a streaming interpretation
2. Listen for typing sounds
3. Observe sound frequency matches text speed

**Expected Results**:
- ✅ Typing sounds play during animation
- ✅ Sounds are throttled (not every character, ~50ms intervals)
- ✅ Volume matches SFX volume setting
- ✅ No sound artifacts or clipping
- ✅ Sounds stop when paused
- ✅ Sounds resume when resumed
- ✅ No sounds after skip

**Console Check**: Look for audio effect logs in console

---

### Test 3.2: Typing Sounds (Audio Disabled)
**Setup**:
1. Mute audio or disable SFX
2. Start a streaming interpretation

**Expected Results**:
- ✅ No typing sounds play
- ✅ Animation still works normally
- ✅ No audio-related errors in console

---

## Test Suite 4: Loading States

### Test 4.1: Initial Loading
**Steps**:
1. Start a new reading
2. Observe loading state immediately

**Expected Results**:
- ✅ Loading message: "AI is thinking..."
- ✅ Amber-colored spinner animation
- ✅ No text visible yet
- ✅ No error messages

**Network Check**:
- Open DevTools Network tab
- Filter by "stream"
- Verify SSE connection established (EventSource)

---

### Test 4.2: Retry Loading
**Steps**:
1. Start a streaming interpretation
2. Disconnect network (airplane mode or disable Wi-Fi)
3. Observe retry message
4. Reconnect network
5. Observe recovery

**Expected Results**:
- ✅ Yellow retry message: "Connection interrupted. Retrying (1/3)..."
- ✅ Retry count increments (1/3, 2/3, 3/3)
- ✅ Yellow spinner during retry
- ✅ Stream resumes after reconnection
- ✅ No text lost during retry

**Console Check**: Look for retry logs

---

## Test Suite 5: Error Handling

### Test 5.1: Network Error (3 Failed Retries)
**Steps**:
1. Start a streaming interpretation
2. Disconnect network immediately
3. Keep network disconnected
4. Wait for 3 retry attempts to fail

**Expected Results**:
- ✅ Retry messages appear (1/3, 2/3, 3/3)
- ✅ After 3 failures, error UI appears
- ✅ Red border around error box
- ✅ Error icon visible
- ✅ Error message: "Network connection lost" or similar
- ✅ User-friendly error description
- ✅ No "Interpretation complete" message

**Console Check**:
- Error logs should be present
- No unhandled exceptions

---

### Test 5.2: Backend Timeout
**Steps**:
1. If possible, configure backend with very short timeout (5s)
2. Start a streaming interpretation
3. Wait for timeout

**Expected Results**:
- ✅ Timeout error message after configured duration
- ✅ Error UI displays
- ✅ Message suggests checking network or refreshing

**Note**: This test requires backend configuration access

---

### Test 5.3: Authentication Error (401)
**Steps**:
1. Clear authentication token (if possible)
2. Start a streaming interpretation
3. Observe auth error

**Expected Results**:
- ✅ 401 error message
- ✅ Friendly message: "請重新登入" or similar
- ✅ Suggests logging in again

**Note**: This test requires auth token manipulation

---

## Test Suite 6: TTS Integration

### Test 6.1: TTS Auto-Play (Enabled)
**Setup**:
1. Ensure voice audio is NOT muted
2. Ensure audio is enabled in settings

**Steps**:
1. Start a streaming interpretation
2. Wait for streaming to complete
3. Observe TTS player appears below text
4. Verify TTS starts playing automatically (if auto-play enabled)

**Expected Results**:
- ✅ TTS player visible after streaming completes
- ✅ Player shows: title, play button, progress bar
- ✅ Plays interpretation text in selected voice
- ✅ Progress bar updates during playback
- ✅ Pip-Boy styling consistent with site theme

---

### Test 6.2: TTS Manual Controls
**Steps**:
1. Wait for streaming to complete and TTS to appear
2. Click play button (if not auto-playing)
3. Click pause during playback
4. Click resume
5. Click stop
6. Verify all controls work

**Expected Results**:
- ✅ Play button starts TTS playback
- ✅ Pause button pauses audio
- ✅ Resume button continues from pause point
- ✅ Stop button stops and resets audio
- ✅ Progress bar reflects playback position
- ✅ Volume control works (if present)

---

### Test 6.3: TTS Disabled
**Setup**:
1. Mute voice audio in settings
2. Start a streaming interpretation

**Expected Results**:
- ✅ Streaming works normally
- ✅ TTS player does NOT appear after completion
- ✅ OR TTS player appears but is disabled/muted
- ✅ No audio plays
- ✅ No TTS-related errors

---

### Test 6.4: TTS After Skip
**Steps**:
1. Start a streaming interpretation
2. Click "跳過" (Skip) button
3. Verify full text appears
4. Observe TTS player appears
5. TTS should still play full text

**Expected Results**:
- ✅ TTS player appears after skip
- ✅ TTS plays complete interpretation (not just streamed portion)
- ✅ No audio glitches

---

## Test Suite 7: AI Provider Compatibility

### Test 7.1: Anthropic Claude
**Setup**:
1. Configure backend to use Anthropic Claude
2. Ensure API key is valid

**Steps**:
1. Start multiple streaming interpretations
2. Test with different cards
3. Verify consistent behavior

**Expected Results**:
- ✅ Streaming works correctly
- ✅ No provider-specific errors
- ✅ Text quality is good
- ✅ Speed is acceptable (<2s first token)

**Console Check**: Look for provider logs

---

### Test 7.2: OpenAI GPT
**Setup**:
1. Configure backend to use OpenAI GPT
2. Ensure API key is valid

**Steps**:
1. Start multiple streaming interpretations
2. Compare behavior with Claude

**Expected Results**:
- ✅ Same as Test 7.1
- ✅ Consistent streaming experience

---

### Test 7.3: Google Gemini
**Setup**:
1. Configure backend to use Google Gemini
2. Ensure API key is valid

**Steps**:
1. Start multiple streaming interpretations
2. Compare behavior with other providers

**Expected Results**:
- ✅ Same as Test 7.1
- ✅ Consistent streaming experience

---

## Test Suite 8: Integration Tests

### Test 8.1: CardDetailModal Integration
**Steps**:
1. Navigate to /readings/quick
2. Click a card to open modal
3. Find the "AI 智慧解讀" tab or section
4. Verify StreamingInterpretation component renders

**Expected Results**:
- ✅ Modal opens correctly
- ✅ Streaming section visible
- ✅ All streaming features work in modal context
- ✅ Modal can be closed during streaming (cleanup works)

---

### Test 8.2: QuickReadingCardPage Integration
**Steps**:
1. Navigate to /readings/quick
2. Select a card (opens /readings/quick/card/[cardId])
3. Verify StreamingInterpretation renders
4. Test all features on this page

**Expected Results**:
- ✅ Page loads correctly
- ✅ Card details displayed
- ✅ StreamingInterpretation component works
- ✅ Back navigation works (cleanup occurs)

---

### Test 8.3: Multiple Sequential Readings
**Steps**:
1. Complete one reading fully (streaming + TTS)
2. Go back to /readings/quick
3. Select a different card
4. Start new reading
5. Repeat 3-5 times

**Expected Results**:
- ✅ Each reading streams correctly
- ✅ No memory leaks (check DevTools Memory tab)
- ✅ No accumulated errors
- ✅ Performance stays consistent

---

## Test Suite 9: Accessibility

### Test 9.1: Keyboard Navigation
**Steps**:
1. Start a streaming interpretation
2. Press Tab to focus control buttons
3. Press Enter/Space to activate buttons
4. Verify all buttons are keyboard accessible

**Expected Results**:
- ✅ Tab key navigates to all buttons
- ✅ Focus visible on buttons
- ✅ Enter/Space activates buttons
- ✅ No keyboard traps

---

### Test 9.2: Screen Reader Support
**Setup**:
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)

**Steps**:
1. Start a streaming interpretation
2. Listen to screen reader announcements
3. Verify streaming text is announced

**Expected Results**:
- ✅ Loading state announced
- ✅ Streaming text updates announced (ARIA live region)
- ✅ Completion announced
- ✅ Error states announced
- ✅ Button labels are descriptive

---

## Test Suite 10: Performance

### Test 10.1: First Token Latency
**Steps**:
1. Open DevTools Network tab
2. Start a streaming interpretation
3. Measure time from request to first SSE event
4. Repeat 10 times, calculate average

**Expected Results**:
- ✅ Average < 2 seconds (P95 target)
- ✅ No requests take > 5 seconds
- ✅ Consistent across providers

---

### Test 10.2: Frame Rate During Animation
**Steps**:
1. Open DevTools Performance tab
2. Start recording
3. Start a streaming interpretation
4. Stop recording after completion
5. Check frame rate

**Expected Results**:
- ✅ Maintains ~60 FPS during animation
- ✅ No significant frame drops
- ✅ Smooth visual experience

---

### Test 10.3: Memory Usage
**Steps**:
1. Open DevTools Memory tab
2. Take heap snapshot
3. Complete 10 streaming interpretations
4. Take another heap snapshot
5. Compare memory usage

**Expected Results**:
- ✅ No significant memory growth
- ✅ Cleanup works correctly
- ✅ No detached DOM nodes

---

## Test Results Summary

### Test Coverage

| Suite | Tests | Passed | Failed | Skipped | Notes |
|-------|-------|--------|--------|---------|-------|
| 1. Typewriter Animation | 2 | | | | |
| 2. Control Buttons | 3 | | | | |
| 3. Audio Integration | 2 | | | | |
| 4. Loading States | 2 | | | | |
| 5. Error Handling | 3 | | | | |
| 6. TTS Integration | 4 | | | | |
| 7. AI Providers | 3 | | | | |
| 8. Integration | 3 | | | | |
| 9. Accessibility | 2 | | | | |
| 10. Performance | 3 | | | | |
| **TOTAL** | **27** | | | | |

---

## Critical Issues Found

_(Fill in during testing)_

| Issue ID | Severity | Description | Steps to Reproduce | Status |
|----------|----------|-------------|-------------------|--------|
| | | | | |

---

## Recommendations

### Before Marking Task 1.3 Complete:

1. ✅ Complete at least **Core Tests**:
   - Test 1.1, 1.2 (Animation)
   - Test 2.1, 2.2, 2.3 (Controls)
   - Test 4.1 (Loading)
   - Test 5.1 (Error handling)
   - Test 6.1 (TTS)
   - Test 8.1, 8.2 (Integration)

2. ✅ Verify **Zero Critical Bugs**:
   - No console errors during normal operation
   - No visual glitches
   - All core features functional

3. ✅ Document any **Known Issues** above

4. ✅ Take **Screenshots** of:
   - Streaming animation in progress
   - Control buttons
   - Loading state
   - Error state
   - TTS player

---

## Tester Sign-Off

- **Tester Name**: _________________
- **Date**: _________________
- **Environment**:
  - Browser: _________________
  - OS: _________________
  - Screen Size: _________________
- **Overall Status**: ⬜ PASS ⬜ FAIL ⬜ NEEDS REVIEW

**Notes**:
