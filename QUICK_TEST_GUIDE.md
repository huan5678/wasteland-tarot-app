# Quick Test Guide - Chirp 3:HD Audio Fixes

## Changes Made

### Backend Fixes
1. ✅ **Pitch Parameter Handling** (`backend/app/services/tts_service.py`)
   - Fixed `convert_voice_params()` to detect and handle semitone-formatted pitch values
   - Now supports both old format (0.6-1.3) and new format (-20 to +20 semitones)

2. ✅ **Storage Path Uniqueness** (`backend/app/services/audio_storage_service.py`)
   - Added timestamp to dynamic storage paths
   - Prevents "duplicate key" errors when testing different voices with same text

### Frontend Enhancements
3. ✅ **Character Selector in Custom Test** (`src/app/test-chirp3-hd/page.tsx`)
   - Added character dropdown to custom parameter test section
   - Shows character name, description, voice, and language code

## Test Steps

### 1. Start Backend
```bash
cd backend
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Access Test Page
Navigate to: **http://localhost:3000/test-chirp3-hd**

### 4. Test Voice Differences

#### Test 1: Same Text, Different Characters
1. Go to "自訂參數測試" section
2. Enter text: `歡迎來到廢土塔羅，準備好開始你的旅程了嗎？`
3. Select different characters from dropdown and click "執行自訂測試"
4. **Expected**: Each character should have distinct voice (pitch & speed)

**Characters to Test**:
- **super_mutant** (Algenib) - Very deep, slow
- **vault_dweller** (Aoede) - High, young female
- **pip_boy** (Puck) - Standard male
- **codsworth** (Despina) - High, fast robotic

#### Test 2: Language Switching
1. Enable "使用自訂語音設定" checkbox
2. Test different language codes:
   - `cmn-CN` (Simplified Chinese) - Default ✅
   - `cmn-TW` (Traditional Chinese)
   - `en-US` (English)

**Expected**: Audio should reflect the language/accent

#### Test 3: Custom Voice Override
1. Enable "使用自訂語音設定"
2. Select a voice from "Chirp 3:HD 語音" dropdown
3. This overrides the character's default voice

### 5. Verify in Logs

#### Backend Console Should Show:
```
[TTSService] Using Chirp3 language code: cmn-CN
[TTSService] Extracted star name from full name: ... → Algenib
[TTSService] Built voice name: cmn-CN-Chirp3-HD-Algenib
[TTSService] Chirp 3:HD synthesis successful: character=super_mutant, voice=cmn-CN-Chirp3-HD-Algenib
```

#### Check Storage Paths:
Look for paths like:
```
dynamic/f3a2b1c0_1730707234/vault_dweller_Aoede.mp3
```
(Notice the timestamp: `_1730707234`)

## Expected Results

### Voice Characteristics by Character

| Character | Star | Expected Sound |
|-----------|------|----------------|
| super_mutant | Algenib | Very deep, slow, menacing |
| brotherhood_paladin | Alnilam | Deep, authoritative |
| vault_dweller | Aoede | High, young, optimistic |
| pip_boy | Puck | Standard, friendly |
| codsworth | Despina | High, fast, robotic |

### File Size Differences
- Slower speech = larger files
- Faster speech = smaller files
- Same text with different characters should have noticeably different file sizes

## Troubleshooting

### Issue: All voices sound the same
**Check**:
1. Backend logs show correct voice names (different star names)
2. Audio files have different sizes
3. Custom voice override is NOT enabled (should use character defaults)

### Issue: "duplicate key" error
**Check**:
1. Storage paths include timestamps
2. Backend restarted after code changes
3. Clear old test data if needed

### Issue: Language not working
**Check**:
1. Language code is correct (`cmn-CN`, not `zh-CN`)
2. Backend converts `zh-CN` → `cmn-CN` automatically
3. Check logs for: `[TTSService] Using Chirp3 language code: cmn-CN`

## Quick Verification Commands

### Check if voice differs for same text:
```bash
# Generate audio for super_mutant
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"測試文字","character_key":"super_mutant","audio_type":"ai_response","language_code":"cmn-CN","force_voice_model":"chirp3-hd"}' \
  -o super_mutant.json

# Generate audio for vault_dweller
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"測試文字","character_key":"vault_dweller","audio_type":"ai_response","language_code":"cmn-CN","force_voice_model":"chirp3-hd"}' \
  -o vault_dweller.json

# Compare file sizes
cat super_mutant.json | jq '.file_size'
cat vault_dweller.json | jq '.file_size'
cat super_mutant.json | jq '.voice_name'
cat vault_dweller.json | jq '.voice_name'
```

## Success Criteria

✅ **Voices are distinct**: Each character produces different-sounding audio  
✅ **Storage works**: No duplicate key errors  
✅ **Languages work**: Can switch between cmn-CN, cmn-TW, en-US  
✅ **Logs show correct info**: Voice names include correct star names  
✅ **Character selector works**: Can select any character in custom test  

## Documentation
See `CHIRP3_FIXES_SUMMARY.md` for detailed technical documentation.
