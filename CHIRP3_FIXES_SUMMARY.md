# Chirp 3:HD Audio System Fixes Summary

**Date**: 2025-11-04  
**Status**: ✅ Complete

## Issues Fixed

### 1. ✅ Pitch Parameter Format Issue
**Problem**: The `convert_voice_params` function was converting pitch values using the formula `(pitch - 1.0) * 50`, but the `DEFAULT_VOICE_CONFIGS` was already using semitone values directly (e.g., `-20.0`, `8.0` instead of `0.4`, `1.16`).

**Fix**: Updated `convert_voice_params` to detect if pitch values are already in semitones format (-20 to +20 range) and skip conversion if so.

**Location**: `backend/app/services/tts_service.py` line 485-503

### 2. ✅ Storage Path Collision
**Problem**: Dynamic audio files were using hash-based paths without timestamps, causing duplicate key violations when testing different voices with the same text and character.

**Error**:
```
duplicate key value violates unique constraint "audio_files_storage_path_key"
DETAIL: Key (storage_path)=(dynamic/11016258/vault_dweller.mp3) already exists.
```

**Fix**: Added timestamp to dynamic storage paths to ensure uniqueness for test cases.

**Before**: `dynamic/f3a2b1c0/codsworth_Algenib.mp3`  
**After**: `dynamic/f3a2b1c0_1699123456/codsworth_Algenib.mp3`

**Location**: `backend/app/services/audio_storage_service.py` line 41-80

### 3. ✅ Language Code Support
**Confirmed Working**: 
- API endpoint already defaults to `cmn-CN` (Simplified Chinese) at line 301
- Chirp 3:HD language conversion correctly maps:
  - `zh-CN` → `cmn-CN` (Simplified Chinese)
  - `zh-TW` → `cmn-TW` (Traditional Chinese)
  - `cmn-CN` → `cmn-CN` (pass-through)

**Supported Languages**:
- `cmn-CN`: Simplified Chinese (Mainland China) - **System Default**
- `cmn-TW`: Traditional Chinese (Taiwan)
- `cmn-Hant-TW`: Traditional Chinese (Taiwan, new format)
- `en-US`, `en-GB`, `en-AU`, `en-IN`: English variants
- `ja-JP`: Japanese
- `ko-KR`: Korean
- Plus European languages (French, German, Spanish, Portuguese, Italian)

### 4. ✅ Audio Type Enum Validation
**Confirmed**: Test page correctly uses `ai_response` instead of deprecated `story` value.

**Valid Values**:
- `ai_response` - AI responses and test audio ✅
- `dynamic_reading` - Dynamic tarot readings ✅
- `static_card` - Static card interpretations (model only) ❌

**Location**: `src/app/test-chirp3-hd/page.tsx` lines 328, 439

## Chirp 3:HD Voice Mapping

### Character Voice Map
All characters properly mapped to star names (extracted from official Google documentation):

| Character | Star Name | Voice Type | Pitch | Rate |
|-----------|-----------|------------|-------|------|
| super_mutant | Algenib | Deep Male | -20st | 0.65 |
| brotherhood_paladin | Alnilam | Military Male | -8st | 0.75 |
| legion_centurion | Enceladus | Stern Male | -10st | 0.70 |
| ghoul | Fenrir | Weathered Male | -6st | 0.80 |
| wasteland_trader | Achird | Practical Male | -4st | 0.90 |
| ncr_ranger | Iapetus | Professional Male | -5st | 0.85 |
| pip_boy | Puck | Neutral Male | 0st | 1.00 |
| minuteman | Schedar | Steady Male | -2st | 0.95 |
| vault_dweller | Aoede | Young Female | +8st | 1.10 |
| railroad_agent | Leda | Agile Female | +3st | 1.15 |
| brotherhood_scribe | Callirrhoe | Intelligent Female | +5st | 1.05 |
| codsworth | Despina | Robotic Female | +8st | 1.25 |
| raider | Rasalgethi | Aggressive Male | -3st | 1.30 |
| institute_scientist | Kore | Analytical Female | +6st | 1.15 |

### Voice Name Construction
Format: `{language_code}-Chirp3-HD-{star_name}`

**Examples**:
- Chinese (Simplified): `cmn-CN-Chirp3-HD-Algenib`
- Chinese (Traditional): `cmn-TW-Chirp3-HD-Aoede`
- English: `en-US-Chirp3-HD-Puck`

## Testing Recommendations

### 1. Test Different Languages
```bash
# Test Simplified Chinese (default)
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "歡迎來到廢土塔羅",
    "character_key": "vault_dweller",
    "language_code": "cmn-CN",
    "audio_type": "ai_response"
  }'

# Test Traditional Chinese
curl -X POST http://localhost:8000/api/v1/audio/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "歡迎來到廢土塔羅",
    "character_key": "vault_dweller",
    "language_code": "cmn-TW",
    "audio_type": "ai_response"
  }'
```

### 2. Test Different Characters
Visit: `http://localhost:3000/test-chirp3-hd`

**Character Test Scenarios**:
1. **Male Low Voice**: super_mutant, brotherhood_paladin, legion_centurion
2. **Male Mid Voice**: ghoul, wasteland_trader, ncr_ranger
3. **Male Standard**: pip_boy, minuteman
4. **Female High Voice**: vault_dweller, railroad_agent, brotherhood_scribe
5. **Special**: codsworth (robotic), raider (aggressive), institute_scientist (analytical)

### 3. Voice Difference Verification
Each character should produce distinctly different voices when synthesizing the same text. Key differences:
- **Pitch**: -20st (very deep) to +8st (very high)
- **Rate**: 0.65x (very slow) to 1.30x (very fast)
- **Star Names**: Each character uses a different Chirp3-HD voice variant

## Files Modified

1. `backend/app/services/tts_service.py`
   - Updated `convert_voice_params()` to handle semitone-formatted pitch values

2. `backend/app/services/audio_storage_service.py`
   - Added timestamp to dynamic storage paths to prevent collisions

## Validation Checklist

- [x] TTS Service imports without errors
- [x] Pitch parameters correctly converted to semitones
- [x] Storage paths include timestamps for uniqueness
- [x] Language codes properly mapped (cmn-CN, cmn-TW, etc.)
- [x] Audio type validation accepts `ai_response` and `dynamic_reading`
- [x] All 14 characters have unique Chirp3-HD voice mappings
- [ ] Backend server starts successfully
- [ ] Test page generates distinct voices for each character
- [ ] Different language codes produce correct accents

## Next Steps

1. **Start Backend Server**:
   ```bash
   cd backend
   .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Access Test Page**:
   - Navigate to: http://localhost:3000/test-chirp3-hd
   - Test each character with same text to verify voice differences
   - Test different language codes to verify language switching

4. **Monitor Logs**:
   - Backend: Watch for voice_name in synthesis logs
   - Frontend: Check browser console for audio playback
   - Check Supabase storage for unique file paths

## Known Limitations

1. **Storage Path Uniqueness**: Timestamp-based paths work for testing but may accumulate files. Consider cleanup strategy for production.

2. **Voice Distinctiveness**: Chirp3-HD voices depend on:
   - Star name selection (14 unique voices)
   - Pitch adjustment (-20 to +8 semitones)
   - Rate adjustment (0.65 to 1.30x speed)
   
   If voices still sound similar, consider:
   - Using wider pitch ranges
   - Selecting more distinct star names
   - Adding custom pronunciation rules

3. **Language Fallback**: If Chirp3-HD fails for a language, system automatically falls back to WaveNet (if enabled).

## References

- [Google Cloud TTS Chirp3-HD Documentation](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd)
- [Language Availability](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#language_availability)
- [Voice Options](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#voice_options)
