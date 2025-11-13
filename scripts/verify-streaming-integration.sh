#!/bin/bash
# Verification Script for StreamingInterpretation Component (Task 1.3)
# Tests all functionality requirements

set -e

echo "=================================================="
echo "StreamingInterpretation Component Verification"
echo "Task 1.3: Functional Testing"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNING=0

# Function to log test results
log_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
    ((WARNING++))
}

log_info() {
    echo -e "ℹ INFO: $1"
}

# 1. Check if StreamingInterpretation component exists
echo "1. Checking StreamingInterpretation component..."
if [ -f "src/components/readings/StreamingInterpretation.tsx" ]; then
    log_pass "StreamingInterpretation.tsx exists"

    # Check for key features
    if grep -q "useStreamingText" "src/components/readings/StreamingInterpretation.tsx"; then
        log_pass "Component imports useStreamingText hook"
    else
        log_fail "Component missing useStreamingText hook"
    fi

    if grep -q "TTSPlayer" "src/components/readings/StreamingInterpretation.tsx"; then
        log_pass "Component imports TTSPlayer"
    else
        log_warn "Component missing TTSPlayer integration"
    fi

    if grep -q "animate-pulse" "src/components/readings/StreamingInterpretation.tsx"; then
        log_pass "Component has blinking cursor animation"
    else
        log_fail "Component missing cursor animation"
    fi

    if grep -q "togglePause" "src/components/readings/StreamingInterpretation.tsx"; then
        log_pass "Component has pause/resume controls"
    else
        log_fail "Component missing pause/resume controls"
    fi

    if grep -q "skip" "src/components/readings/StreamingInterpretation.tsx"; then
        log_pass "Component has skip functionality"
    else
        log_fail "Component missing skip functionality"
    fi
else
    log_fail "StreamingInterpretation.tsx not found"
fi
echo ""

# 2. Check useStreamingText hook
echo "2. Checking useStreamingText hook..."
if [ -f "src/hooks/useStreamingText.ts" ]; then
    log_pass "useStreamingText.ts exists"

    if grep -q "useAudioEffect" "src/hooks/useStreamingText.ts"; then
        log_pass "Hook integrates audio effects"
    else
        log_warn "Hook missing audio effect integration"
    fi

    if grep -q "maxRetries" "src/hooks/useStreamingText.ts"; then
        log_pass "Hook has retry mechanism"
    else
        log_fail "Hook missing retry mechanism"
    fi

    if grep -q "timeout" "src/hooks/useStreamingText.ts"; then
        log_pass "Hook has timeout handling"
    else
        log_fail "Hook missing timeout handling"
    fi

    if grep -q "pause" "src/hooks/useStreamingText.ts" && grep -q "resume" "src/hooks/useStreamingText.ts"; then
        log_pass "Hook supports pause/resume"
    else
        log_fail "Hook missing pause/resume functionality"
    fi
else
    log_fail "useStreamingText.ts not found"
fi
echo ""

# 3. Check integration in CardDetailModal
echo "3. Checking CardDetailModal integration (Task 1.1)..."
if [ -f "src/components/tarot/CardDetailModal.tsx" ]; then
    log_pass "CardDetailModal.tsx exists"

    if grep -q "StreamingInterpretation" "src/components/tarot/CardDetailModal.tsx"; then
        log_pass "CardDetailModal imports StreamingInterpretation"
    else
        log_fail "CardDetailModal missing StreamingInterpretation import"
    fi

    if grep -q "from '@/components/readings/StreamingInterpretation'" "src/components/tarot/CardDetailModal.tsx"; then
        log_pass "CardDetailModal has correct import path"
    else
        log_warn "CardDetailModal may have incorrect import path"
    fi
else
    log_fail "CardDetailModal.tsx not found"
fi
echo ""

# 4. Check integration in QuickReadingCardPage
echo "4. Checking QuickReadingCardPage integration (Task 1.2)..."
if [ -f "src/app/readings/quick/card/[cardId]/page.tsx" ]; then
    log_pass "QuickReadingCardPage exists"

    if grep -q "StreamingInterpretation" "src/app/readings/quick/card/[cardId]/page.tsx"; then
        log_pass "QuickReadingCardPage imports StreamingInterpretation"
    else
        log_fail "QuickReadingCardPage missing StreamingInterpretation import"
    fi

    if grep -q "handleInterpretationComplete" "src/app/readings/quick/card/[cardId]/page.tsx"; then
        log_pass "QuickReadingCardPage has completion callback"
    else
        log_fail "QuickReadingCardPage missing completion callback"
    fi

    if grep -q "handleInterpretationError" "src/app/readings/quick/card/[cardId]/page.tsx"; then
        log_pass "QuickReadingCardPage has error callback"
    else
        log_fail "QuickReadingCardPage missing error callback"
    fi
else
    log_fail "QuickReadingCardPage not found"
fi
echo ""

# 5. Check TTSPlayer component
echo "5. Checking TTSPlayer component (Task 2.1)..."
if [ -f "src/components/readings/TTSPlayer.tsx" ]; then
    log_pass "TTSPlayer.tsx exists"

    if grep -q "useTTS" "src/components/readings/TTSPlayer.tsx"; then
        log_pass "TTSPlayer uses useTTS hook"
    else
        log_fail "TTSPlayer missing useTTS hook"
    fi

    if grep -q "play" "src/components/readings/TTSPlayer.tsx" && grep -q "pause" "src/components/readings/TTSPlayer.tsx"; then
        log_pass "TTSPlayer has playback controls"
    else
        log_fail "TTSPlayer missing playback controls"
    fi

    if grep -q "aria-label" "src/components/readings/TTSPlayer.tsx"; then
        log_pass "TTSPlayer has accessibility labels"
    else
        log_warn "TTSPlayer missing accessibility labels"
    fi
else
    log_fail "TTSPlayer.tsx not found"
fi
echo ""

# 6. Check useTTS hook
echo "6. Checking useTTS hook (Task 2.2)..."
if [ -f "src/hooks/useTTS.ts" ]; then
    log_pass "useTTS.ts exists"

    if grep -q "isPlaying" "src/hooks/useTTS.ts" && grep -q "isPaused" "src/hooks/useTTS.ts"; then
        log_pass "useTTS has playback state"
    else
        log_fail "useTTS missing playback state"
    fi

    if grep -q "play" "src/hooks/useTTS.ts" && grep -q "pause" "src/hooks/useTTS.ts" && grep -q "stop" "src/hooks/useTTS.ts"; then
        log_pass "useTTS has control methods"
    else
        log_fail "useTTS missing control methods"
    fi

    if grep -q "audioStore" "src/hooks/useTTS.ts" || grep -q "useAudioStore" "src/hooks/useTTS.ts"; then
        log_pass "useTTS integrates with audioStore"
    else
        log_warn "useTTS may not integrate with audioStore"
    fi
else
    log_fail "useTTS.ts not found"
fi
echo ""

# 7. Check backend streaming endpoints
echo "7. Checking backend streaming endpoints (Task 3.1)..."
if [ -f "backend/app/api/v1/endpoints/readings_stream.py" ]; then
    log_pass "readings_stream.py exists"

    if grep -q "get_current_user" "backend/app/api/v1/endpoints/readings_stream.py"; then
        log_pass "Streaming endpoints have authentication"
    else
        log_warn "Streaming endpoints may lack authentication"
    fi

    if grep -q "asyncio.timeout" "backend/app/api/v1/endpoints/readings_stream.py"; then
        log_pass "Streaming endpoints have timeout protection"
    else
        log_warn "Streaming endpoints may lack timeout protection"
    fi
else
    log_fail "readings_stream.py not found"
fi
echo ""

# 8. Check test coverage
echo "8. Checking test coverage..."
TEST_FILES_COUNT=0

if [ -f "src/hooks/__tests__/useTTS.test.ts" ]; then
    log_pass "useTTS hook tests exist"
    ((TEST_FILES_COUNT++))
else
    log_warn "useTTS hook tests not found"
fi

if [ -f "src/components/readings/__tests__/TTSPlayer.test.tsx" ]; then
    log_pass "TTSPlayer component tests exist"
    ((TEST_FILES_COUNT++))
else
    log_warn "TTSPlayer component tests not found"
fi

if [ -d "src/hooks/__tests__" ] && ls src/hooks/__tests__/useStreamingText*.test.ts 1> /dev/null 2>&1; then
    log_pass "useStreamingText hook tests exist"
    ((TEST_FILES_COUNT++))
else
    log_warn "useStreamingText hook tests not found"
fi

if [ -f "backend/tests/unit/test_streaming_auth.py" ]; then
    log_pass "Backend authentication tests exist"
    ((TEST_FILES_COUNT++))
else
    log_warn "Backend authentication tests not found"
fi

if [ -f "backend/tests/unit/test_streaming_timeout.py" ]; then
    log_pass "Backend timeout tests exist"
    ((TEST_FILES_COUNT++))
else
    log_warn "Backend timeout tests not found"
fi

log_info "Test files found: $TEST_FILES_COUNT"
echo ""

# 9. Check for key dependencies
echo "9. Checking dependencies..."
if [ -f "package.json" ]; then
    if grep -q "eventsource-parser" "package.json" || grep -q "eventsource" "package.json"; then
        log_pass "SSE parser dependency installed"
    else
        log_warn "SSE parser dependency may be missing"
    fi

    if grep -q "framer-motion" "package.json" || grep -q "motion" "package.json"; then
        log_pass "Animation library installed"
    else
        log_warn "Animation library may be missing"
    fi
fi
echo ""

# 10. Check API route configuration
echo "10. Checking API route configuration..."
if [ -f "next.config.mjs" ] || [ -f "next.config.js" ]; then
    log_info "Next.js configuration exists"
    if grep -q "rewrites" "next.config.mjs" 2>/dev/null || grep -q "rewrites" "next.config.js" 2>/dev/null; then
        log_pass "API route rewrites configured"
    else
        log_warn "API route rewrites may not be configured"
    fi
else
    log_warn "Next.js configuration file not found"
fi
echo ""

# Summary
echo "=================================================="
echo "VERIFICATION SUMMARY"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNING${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Manual testing recommendations:"
    echo "1. Navigate to /readings/quick"
    echo "2. Select a card and verify streaming animation"
    echo "3. Test pause/resume/skip controls"
    echo "4. Verify typing sounds (if audio enabled)"
    echo "5. Test TTS playback after streaming completes"
    echo "6. Verify error handling (disconnect network)"
    echo "7. Test with different AI providers"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the issues above.${NC}"
    exit 1
fi
