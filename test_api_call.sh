#!/bin/bash
# Test Chirp3-HD API with different languages and characters

echo "======================================"
echo "Testing Chirp3-HD TTS API"
echo "======================================"
echo ""

# Test 1: English with Super Mutant
echo "Test 1: English + Super Mutant"
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to the wasteland survivor",
    "character_key": "super_mutant",
    "audio_type": "ai_response",
    "cache_enabled": false,
    "language_code": "en-US"
  }' 2>/dev/null | jq -r '.voice_name, .voice_model' | head -2
echo ""

# Test 2: Chinese with Vault Dweller  
echo "Test 2: Chinese + Vault Dweller"
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "歡迎來到廢土世界",
    "character_key": "vault_dweller",
    "audio_type": "ai_response",
    "cache_enabled": false,
    "language_code": "zh-TW"
  }' 2>/dev/null | jq -r '.voice_name, .voice_model' | head -2
echo ""

# Test 3: Japanese with Pip-Boy
echo "Test 3: Japanese + Pip-Boy"
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "ようこそ荒野へ",
    "character_key": "pip_boy",
    "audio_type": "ai_response",
    "cache_enabled": false,
    "language_code": "ja-JP"
  }' 2>/dev/null | jq -r '.voice_name, .voice_model' | head -2
echo ""

echo "======================================"
echo "Expected Results:"
echo "Test 1: en-US-Chirp3-HD-Algenib, chirp3-hd"
echo "Test 2: cmn-TW-Chirp3-HD-Aoede, chirp3-hd"
echo "Test 3: ja-JP-Chirp3-HD-Puck, chirp3-hd"
echo "======================================"
