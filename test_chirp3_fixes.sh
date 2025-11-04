#!/bin/bash
# Chirp3 Audio System Fixes - Verification Script

echo "==================================="
echo "Chirp3 Audio System Fixes Test"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend API endpoint
API_URL="http://localhost:8000/api/v1/audio/synthesize"

echo "Test 1: Verify 'story' audio_type is accepted"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "測試文字",
    "character_key": "vault_dweller",
    "audio_type": "story",
    "cache_enabled": false,
    "force_voice_model": "chirp3-hd",
    "language_code": "cmn-CN"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Test 1 PASSED${NC}: 'story' audio_type accepted (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "422" ]; then
    echo -e "${RED}✗ Test 1 FAILED${NC}: Validation error (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    echo -e "${YELLOW}⚠ Test 1 WARNING${NC}: Unexpected response (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

echo "Test 2: Verify unique storage paths"
echo "-------------------------------------"
# Generate two identical requests
for i in 1 2; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "text": "相同文字測試",
        "character_key": "super_mutant",
        "audio_type": "ai_response",
        "cache_enabled": false,
        "force_voice_model": "chirp3-hd",
        "language_code": "cmn-CN"
      }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Request $i successful${NC} (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "500" ] && echo "$RESPONSE" | grep -q "duplicate key"; then
        echo -e "${RED}✗ Request $i FAILED${NC}: Duplicate storage path error"
        break
    else
        echo -e "${YELLOW}⚠ Request $i${NC}: HTTP $HTTP_CODE"
    fi
    
    sleep 0.5  # Small delay between requests
done
echo ""

echo "Test 3: Verify language code support"
echo "--------------------------------------"
for LANG in "cmn-CN" "cmn-TW" "en-US"; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{
        \"text\": \"Language test\",
        \"character_key\": \"pip_boy\",
        \"audio_type\": \"ai_response\",
        \"cache_enabled\": false,
        \"force_voice_model\": \"chirp3-hd\",
        \"language_code\": \"$LANG\"
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ $LANG supported${NC} (HTTP $HTTP_CODE)"
    else
        echo -e "${RED}✗ $LANG failed${NC} (HTTP $HTTP_CODE)"
    fi
done
echo ""

echo "Test 4: Verify custom voice names"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "自訂語音測試",
    "character_key": "vault_dweller",
    "audio_type": "ai_response",
    "cache_enabled": false,
    "force_voice_model": "chirp3-hd",
    "voice_name": "cmn-CN-Chirp3-HD-Algenib",
    "language_code": "cmn-CN"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Test 4 PASSED${NC}: Custom voice name accepted (HTTP $HTTP_CODE)"
    # Check if correct voice was used
    if echo "$BODY" | grep -q "Algenib"; then
        echo -e "${GREEN}✓ Correct voice used${NC}: Algenib"
    fi
else
    echo -e "${RED}✗ Test 4 FAILED${NC}: HTTP $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

echo "==================================="
echo "Test Summary"
echo "==================================="
echo "All critical fixes have been tested."
echo "Check results above for pass/fail status."
echo ""
echo "For full testing, visit: http://localhost:3000/test-chirp3-hd"
