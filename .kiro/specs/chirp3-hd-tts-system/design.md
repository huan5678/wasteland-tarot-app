# Technical Design Document

## Overview

This document provides the technical design for upgrading the existing Google Cloud TTS system from WaveNet voices to Chirp 3:HD, Google's latest high-definition text-to-speech model. The design ensures backward compatibility, maintains voice personality characteristics, and leverages Chirp 3:HD's advanced features including custom pronunciations and enhanced voice controls.

## Architecture Overview

### System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ TTS Test Pages │  │ Audio Controls │  │ Character Voice  │  │
│  │  (Web Speech)  │  │   Components   │  │    Selector      │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (FastAPI)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Audio API Endpoints                          │  │
│  │  - POST /api/v1/audio/synthesize (dynamic TTS)           │  │
│  │  - POST /api/v1/audio/generate/story (story audio)       │  │
│  │  - GET  /api/v1/audio/story/{card_id} (get URLs)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                 │                                │
│  ┌──────────────────────────────┼───────────────────────────┐  │
│  │         Service Layer        │                           │  │
│  │  ┌───────────────────┐  ┌───▼────────────────┐         │  │
│  │  │ Audio Storage     │  │   TTSService       │◄────┐   │  │
│  │  │ Service           │  │  (Chirp 3:HD)      │     │   │  │
│  │  └───────────────────┘  └────────────────────┘     │   │  │
│  │  ┌───────────────────┐  ┌────────────────────┐     │   │  │
│  │  │ Audio Cache       │  │ Story Audio        │     │   │  │
│  │  │ Service (Redis)   │  │ Service            │─────┘   │  │
│  │  └───────────────────┘  └────────────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                     ┌───────────┼───────────┐
                     ▼           ▼           ▼
              ┌──────────┐ ┌─────────┐ ┌──────────┐
              │  Redis   │ │ Supabase│ │ Google   │
              │  Cache   │ │ Storage │ │ Cloud    │
              │          │ │  & DB   │ │ TTS API  │
              └──────────┘ └─────────┘ └──────────┘
```

### Key Components

#### 1. TTSService (Backend)
**Location:** `backend/app/services/tts_service.py`

**Current Responsibilities:**
- Voice synthesis using Google Cloud TTS WaveNet
- SSML generation for voice modulation
- Voice parameter conversion (pitch, rate)
- Text hash computation for caching
- Character-to-voice mapping

**New Responsibilities (Chirp 3:HD):**
- Voice synthesis using Chirp 3:HD models
- Custom pronunciation support via IPA encoding
- Enhanced voice control features
- Dual model support (WaveNet fallback)
- Voice model version management

#### 2. Audio API Endpoints
**Location:** `backend/app/api/v1/endpoints/audio.py`

**Current Endpoints:**
- `POST /api/v1/audio/synthesize` - Dynamic TTS synthesis
- `POST /api/v1/audio/generate/story` - Story audio generation
- `GET /api/v1/audio/story/{card_id}` - Get story audio URLs

**No changes required** - API contracts remain stable

#### 3. Caching System
**Components:**
- **Redis Cache:** Fast access layer (5-minute TTL)
- **Database Storage:** Persistent audio metadata
- **Supabase Storage:** Audio file storage

**Update Required:** Include voice model version in cache keys

## Chirp 3:HD Voice Mapping

### Voice Selection Strategy

Based on the Chirp 3:HD documentation, the available voice names follow the pattern:
- `en-US-Chirp3-HD-{VoiceName}` for English (US)
- Multiple voice options: Achernar, Achird, Algenib, etc.

For Traditional Chinese (zh-TW), we need to verify availability and potentially use:
- English voices with Chinese text (Chirp 3:HD supports cross-lingual)
- Or wait for official Chinese Chirp 3:HD voices

### Character Voice Mapping Table

| Character Key         | Current (WaveNet)   | Chirp 3:HD Target        | Gender | Pitch  | Rate | Rationale                                    |
| --------------------- | ------------------- | ------------------------ | ------ | ------ | ---- | -------------------------------------------- |
| super_mutant          | cmn-TW-Wavenet-C    | en-US-Chirp3-HD-Algenib  | Male   | -12st  | 0.65 | Deep, powerful, authoritative                |
| brotherhood_paladin   | cmn-TW-Wavenet-C    | en-US-Chirp3-HD-Algieba  | Male   | -8st   | 0.75 | Military authority, commanding               |
| legion_centurion      | cmn-TW-Wavenet-C    | en-US-Chirp3-HD-Alnilam  | Male   | -10st  | 0.7  | Severe military discipline                   |
| ghoul                 | cmn-TW-Wavenet-B    | en-US-Chirp3-HD-Mizar    | Male   | -6st   | 0.8  | Weathered, experienced, gravelly             |
| wasteland_trader      | cmn-TW-Wavenet-B    | en-US-Chirp3-HD-Vega     | Male   | -4st   | 0.9  | Practical merchant, shrewd                   |
| ncr_ranger            | cmn-TW-Wavenet-B    | en-US-Chirp3-HD-Deneb    | Male   | -5st   | 0.85 | Professional soldier, calm                   |
| pip_boy               | cmn-TW-Wavenet-B    | en-US-Chirp3-HD-Regulus  | Male   | 0st    | 1.0  | Neutral AI assistant, friendly               |
| minuteman             | cmn-TW-Wavenet-B    | en-US-Chirp3-HD-Altair   | Male   | -2st   | 0.95 | Reliable civilian protector                  |
| vault_dweller         | cmn-TW-Wavenet-A    | en-US-Chirp3-HD-Aoede    | Female | +4st   | 1.1  | Young, optimistic, energetic                 |
| railroad_agent        | cmn-TW-Wavenet-A    | en-US-Chirp3-HD-Leda     | Female | +3st   | 1.15 | Quick-witted, secretive                      |
| brotherhood_scribe    | cmn-TW-Wavenet-A    | en-US-Chirp3-HD-Callisto | Female | +5st   | 1.05 | Intelligent scholar, curious                 |
| codsworth             | cmn-TW-Wavenet-B    | en-US-Chirp3-HD-Fomalhaut| Male   | +8st   | 1.25 | Robotic butler, precise, formal              |
| raider                | cmn-TW-Wavenet-B    | en-US-Chirp3-HD-Hadar    | Male   | -3st   | 1.3  | Aggressive, violent, unpredictable           |
| institute_scientist   | cmn-TW-Wavenet-A    | en-US-Chirp3-HD-Kore     | Female | +6st   | 1.15 | Analytical intellectual, detached            |

**Note:** Voice selections based on:
1. **Gender matching:** Preserve existing gender associations
2. **Tonal characteristics:** Match voice descriptions from Chirp 3:HD documentation
3. **Personality fit:** Select voices that enhance character traits
4. **Pitch/rate compatibility:** Ensure modulation parameters work well

### Multi-Language Strategy

**Primary Language (zh-TW):**
- **Phase 1:** Use English Chirp 3:HD voices with Chinese text (cross-lingual support)
- **Phase 2:** Migrate to Chinese Chirp 3:HD voices when available
- **Fallback:** Retain WaveNet Chinese voices as backup

**Secondary Languages:**
- **zh-CN:** Same strategy as zh-TW
- **en-US:** Use native English Chirp 3:HD voices directly

## Custom Pronunciation Support

### Architecture

```python
# New data structure for pronunciation overrides
class CustomPronunciation:
    phrase: str              # Text to override (e.g., "Tarot", "Pip-Boy")
    pronunciation: str       # IPA phonetic (e.g., "ˈtæ.roʊ", "pɪp bɔɪ")
    phonetic_encoding: str   # "PHONETIC_ENCODING_IPA"

class PronunciationDictionary:
    """Global pronunciation dictionary for common terms"""
    def __init__(self):
        self.entries: Dict[str, CustomPronunciation] = {}

    def add_entry(self, phrase: str, ipa: str) -> None:
        """Add pronunciation entry"""
        pass

    def get_pronunciation(self, phrase: str) -> Optional[str]:
        """Get IPA pronunciation for phrase"""
        pass
```

### Integration Points

#### 1. API Request Schema Extension

```python
# Extend SynthesizeRequest
class SynthesizeRequest(BaseModel):
    text: str
    character_key: str
    audio_type: str = "ai_response"
    cache_enabled: bool = True
    return_format: str = "url"

    # NEW: Custom pronunciations
    custom_pronunciations: Optional[List[CustomPronunciation]] = None
```

#### 2. TTSService Methods

```python
class TTSService:
    def apply_custom_pronunciations(
        self,
        text: str,
        pronunciations: List[CustomPronunciation]
    ) -> str:
        """
        Apply custom pronunciations to text using markup

        Returns:
            Marked-up text for Chirp 3:HD
            Example: "I read [custom:rɛd] this book"
        """
        pass

    def generate_chirp3_input(
        self,
        text: str,
        character_key: str,
        custom_pronunciations: Optional[List[CustomPronunciation]] = None
    ) -> texttospeech.SynthesisInput:
        """
        Generate Chirp 3:HD synthesis input with pronunciations

        Uses custom_pronunciations field in SynthesisInput
        """
        pass
```

### Example Usage

```python
# Request with custom pronunciation
request = {
    "text": "Pip-Boy 3000 是廢土生存必備工具",
    "character_key": "pip_boy",
    "custom_pronunciations": [
        {
            "phrase": "Pip-Boy",
            "pronunciation": "pɪp bɔɪ",
            "phonetic_encoding": "PHONETIC_ENCODING_IPA"
        }
    ]
}
```

## Voice Control Features

### Enhanced SSML Generation

#### Current Implementation
```python
def generate_ssml(self, text: str, character_key: str) -> str:
    pitch, rate = self.convert_voice_params(character_key)
    return f"""<speak>
  <prosody pitch="{pitch:+.1f}st" rate="{rate:.2f}">
    {text}
  </prosody>
</speak>"""
```

#### Enhanced Implementation (Chirp 3:HD)

```python
class VoiceControlParams(BaseModel):
    """Voice control parameters"""
    pitch: Optional[float] = None      # -20 to +20 semitones
    rate: Optional[float] = None       # 0.25 to 4.0
    volume: Optional[float] = None     # 0.0 to 1.0
    pauses: Optional[List[Pause]] = None  # Custom pause positions

class Pause(BaseModel):
    """Pause control"""
    position: int          # Character position in text
    duration: str         # "short" | "medium" | "long" | "500ms"

def generate_chirp3_markup(
    self,
    text: str,
    character_key: str,
    voice_controls: Optional[VoiceControlParams] = None
) -> str:
    """
    Generate Chirp 3:HD markup with enhanced controls

    Supports:
    - Character-default voice parameters
    - Runtime voice control overrides
    - Custom pause insertion
    - Speed/pitch modulation
    """
    # Get character defaults
    defaults = self.get_voice_config(character_key)

    # Apply overrides
    pitch = voice_controls.pitch if voice_controls else defaults["pitch"]
    rate = voice_controls.rate if voice_controls else defaults["rate"]

    # Insert pauses if specified
    marked_text = self._insert_pauses(text, voice_controls.pauses)

    # Generate markup
    return f"""
{marked_text}
[pace {rate:.2f}]
[pitch {pitch:+.1f}st]
"""
```

### Pause Control Implementation

```python
def _insert_pauses(self, text: str, pauses: Optional[List[Pause]]) -> str:
    """
    Insert pause markers into text

    Example:
        Input:  "Hello [pause:500ms] World"
        Output: "Hello [pause long] World"
    """
    if not pauses:
        return text

    # Sort pauses by position (descending)
    sorted_pauses = sorted(pauses, key=lambda p: p.position, reverse=True)

    result = text
    for pause in sorted_pauses:
        marker = f"[pause {pause.duration}]"
        result = result[:pause.position] + marker + result[pause.position:]

    return result
```

## Caching Strategy

### Cache Key Design

#### Current Cache Key
```python
text_hash = hashlib.sha256(f"{text}:{character_key}".encode()).hexdigest()
```

#### Enhanced Cache Key (Chirp 3:HD)
```python
def compute_cache_key(
    text: str,
    character_key: str,
    voice_model: str = "chirp3-hd",
    custom_pronunciations: Optional[List[CustomPronunciation]] = None,
    voice_controls: Optional[VoiceControlParams] = None
) -> str:
    """
    Compute cache key including all synthesis parameters

    Format: SHA256(text:character:model:pronunciations:controls)
    """
    components = [text, character_key, voice_model]

    # Include pronunciations if present
    if custom_pronunciations:
        pron_str = "|".join(
            f"{p.phrase}:{p.pronunciation}"
            for p in sorted(custom_pronunciations, key=lambda x: x.phrase)
        )
        components.append(pron_str)

    # Include voice controls if present
    if voice_controls:
        ctrl_str = f"p{voice_controls.pitch}r{voice_controls.rate}"
        components.append(ctrl_str)

    cache_input = ":".join(components)
    return hashlib.sha256(cache_input.encode()).hexdigest()
```

### Cache Migration Strategy

#### Phase 1: Dual Caching
- Maintain separate cache namespaces: `tts:wavenet:*` and `tts:chirp3:*`
- Allow parallel operation during transition
- No cache invalidation required

#### Phase 2: Gradual Migration
- New requests use Chirp 3:HD cache
- Old WaveNet cache entries expire naturally (5-minute TTL)
- Monitor cache hit rates per model

#### Phase 3: Cleanup
- Remove WaveNet cache namespace after full migration
- Update cache monitoring dashboards

## Feature Flags and Rollout

### Configuration System

```python
# New configuration in app/config.py
class Settings(BaseSettings):
    # Existing settings...

    # NEW: Chirp 3:HD feature flags
    chirp3_enabled: bool = Field(
        default=False,
        env="CHIRP3_ENABLED",
        description="Enable Chirp 3:HD globally"
    )

    chirp3_rollout_percentage: int = Field(
        default=0,
        env="CHIRP3_ROLLOUT_PERCENTAGE",
        description="Percentage of requests using Chirp 3:HD (0-100)"
    )

    chirp3_enabled_characters: List[str] = Field(
        default_factory=list,
        env="CHIRP3_ENABLED_CHARACTERS",
        description="Characters using Chirp 3:HD (comma-separated)"
    )

    chirp3_fallback_to_wavenet: bool = Field(
        default=True,
        env="CHIRP3_FALLBACK_TO_WAVENET",
        description="Fallback to WaveNet on Chirp 3:HD failure"
    )
```

### Rollout Controller

```python
class VoiceModelRouter:
    """Routes TTS requests to appropriate voice model"""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.random = random.Random()

    def should_use_chirp3(self, character_key: str, user_id: Optional[str] = None) -> bool:
        """
        Determine if request should use Chirp 3:HD

        Priority:
        1. Global enable flag
        2. Character-specific enable list
        3. Percentage-based rollout
        """
        # Check global enable
        if not self.settings.chirp3_enabled:
            return False

        # Check character-specific
        if character_key in self.settings.chirp3_enabled_characters:
            return True

        # Percentage-based rollout (deterministic per user)
        if user_id:
            # Use hash for consistent per-user routing
            hash_val = int(hashlib.md5(user_id.encode()).hexdigest()[:8], 16)
            return (hash_val % 100) < self.settings.chirp3_rollout_percentage
        else:
            # Random for anonymous users
            return self.random.randint(0, 99) < self.settings.chirp3_rollout_percentage

    def get_voice_model(self, character_key: str, user_id: Optional[str] = None) -> str:
        """Get voice model name for request"""
        return "chirp3-hd" if self.should_use_chirp3(character_key, user_id) else "wavenet"
```

### Integration in TTSService

```python
class TTSService:
    def __init__(self):
        # Existing initialization...
        self.router = VoiceModelRouter(get_settings())

    def synthesize_speech(
        self,
        text: str,
        character_key: str,
        user_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Synthesize speech with automatic model routing
        """
        # Determine voice model
        voice_model = self.router.get_voice_model(character_key, user_id)

        try:
            if voice_model == "chirp3-hd":
                return self._synthesize_chirp3(text, character_key, **kwargs)
            else:
                return self._synthesize_wavenet(text, character_key, **kwargs)
        except Exception as e:
            # Fallback to WaveNet if Chirp 3:HD fails
            if voice_model == "chirp3-hd" and self.router.settings.chirp3_fallback_to_wavenet:
                logger.warning(f"Chirp 3:HD failed, falling back to WaveNet: {e}")
                return self._synthesize_wavenet(text, character_key, **kwargs)
            raise

    def _synthesize_chirp3(self, text: str, character_key: str, **kwargs) -> Dict[str, Any]:
        """Synthesize using Chirp 3:HD"""
        # Implementation details...
        pass

    def _synthesize_wavenet(self, text: str, character_key: str, **kwargs) -> Dict[str, Any]:
        """Synthesize using WaveNet (existing implementation)"""
        # Current implementation...
        pass
```

## API Changes

### Backward Compatibility

**No breaking changes to existing endpoints:**
- Request schemas remain compatible (new fields optional)
- Response schemas unchanged
- Existing cached audio continues to work

### Optional Feature Extensions

#### 1. Synthesis Request (Optional New Fields)

```python
class SynthesizeRequest(BaseModel):
    # Existing fields (required)
    text: str
    character_key: str
    audio_type: str = "ai_response"
    cache_enabled: bool = True
    return_format: str = "url"

    # NEW: Optional Chirp 3:HD features
    custom_pronunciations: Optional[List[CustomPronunciation]] = None
    voice_controls: Optional[VoiceControlParams] = None
    force_voice_model: Optional[str] = None  # "chirp3-hd" | "wavenet"
```

#### 2. Synthesis Response (Extended Metadata)

```python
class SynthesizeResponse(BaseModel):
    # Existing fields
    url: Optional[str] = None
    audio_base64: Optional[str] = None
    duration: float
    file_size: int
    cached: bool
    source: str
    character: dict

    # NEW: Voice model metadata
    voice_model: str  # "chirp3-hd" | "wavenet"
    voice_name: str   # Actual Google TTS voice used
```

## Testing Strategy

### Unit Tests

#### 1. Voice Model Selection Tests
```python
def test_chirp3_voice_mapping():
    """Test all 14 characters map to valid Chirp 3:HD voices"""
    service = TTSService()
    for char_key in CHARACTERS:
        voice_name = service.get_chirp3_voice_name(char_key)
        assert voice_name.startswith("en-US-Chirp3-HD-")
        assert service.is_valid_chirp3_voice(voice_name)

def test_voice_model_routing():
    """Test feature flag routing logic"""
    router = VoiceModelRouter(settings)

    # Global disabled
    settings.chirp3_enabled = False
    assert router.get_voice_model("pip_boy") == "wavenet"

    # Character-specific enabled
    settings.chirp3_enabled = True
    settings.chirp3_enabled_characters = ["pip_boy"]
    assert router.get_voice_model("pip_boy") == "chirp3-hd"
    assert router.get_voice_model("vault_dweller") == "wavenet"

    # Percentage rollout (deterministic per user)
    settings.chirp3_rollout_percentage = 50
    user_id = "test-user-123"
    model1 = router.get_voice_model("pip_boy", user_id)
    model2 = router.get_voice_model("pip_boy", user_id)
    assert model1 == model2  # Consistent per user
```

#### 2. Custom Pronunciation Tests
```python
def test_custom_pronunciation_application():
    """Test IPA pronunciation overrides"""
    service = TTSService()

    text = "I read a book and will read it again"
    pronunciations = [
        CustomPronunciation(
            phrase="read",
            pronunciation="rɛd",
            phonetic_encoding="PHONETIC_ENCODING_IPA"
        )
    ]

    result = service.apply_custom_pronunciations(text, pronunciations)
    assert "rɛd" in result

def test_pronunciation_caching():
    """Test cache keys include pronunciation parameters"""
    text = "Test text"
    char_key = "pip_boy"

    # Without pronunciations
    key1 = compute_cache_key(text, char_key)

    # With pronunciations
    pron = [CustomPronunciation(phrase="Test", pronunciation="tɛst")]
    key2 = compute_cache_key(text, char_key, custom_pronunciations=pron)

    assert key1 != key2  # Different cache keys
```

#### 3. Voice Control Tests
```python
def test_voice_control_parameters():
    """Test voice parameter validation and application"""
    service = TTSService()

    controls = VoiceControlParams(
        pitch=5.0,   # +5 semitones
        rate=1.2,    # 1.2x speed
        pauses=[Pause(position=10, duration="long")]
    )

    markup = service.generate_chirp3_markup(
        "Hello World",
        "pip_boy",
        voice_controls=controls
    )

    assert "[pause long]" in markup
    assert "pace 1.2" in markup or "1.2" in markup
    assert "5" in markup  # Pitch value

def test_voice_parameter_limits():
    """Test parameter range validation"""
    with pytest.raises(ValueError):
        VoiceControlParams(pitch=25.0)  # Exceeds +20 limit

    with pytest.raises(ValueError):
        VoiceControlParams(rate=5.0)  # Exceeds 4.0 limit
```

### Integration Tests

#### 1. End-to-End Synthesis Tests
```python
@pytest.mark.integration
async def test_chirp3_synthesis_pipeline():
    """Test complete synthesis pipeline with Chirp 3:HD"""
    request = SynthesizeRequest(
        text="廢土塔羅系統歡迎您",
        character_key="pip_boy",
        force_voice_model="chirp3-hd"
    )

    response = await synthesize_audio(request, db, tts_service, storage_service, cache_service)

    assert response.voice_model == "chirp3-hd"
    assert response.url is not None
    assert response.duration > 0
    assert response.file_size > 0
    assert response.voice_name.startswith("en-US-Chirp3-HD-")

@pytest.mark.integration
async def test_fallback_to_wavenet():
    """Test automatic fallback when Chirp 3:HD fails"""
    # Mock Chirp 3:HD failure
    with mock.patch.object(TTSService, '_synthesize_chirp3', side_effect=Exception("API Error")):
        request = SynthesizeRequest(
            text="Test fallback",
            character_key="pip_boy"
        )

        response = await synthesize_audio(request, db, tts_service, storage_service, cache_service)

        # Should fallback to WaveNet
        assert response.voice_model == "wavenet"
        assert response.url is not None
```

#### 2. Performance Tests
```python
@pytest.mark.performance
async def test_synthesis_performance():
    """Test synthesis meets performance targets"""
    import time

    text = "這是一段標準長度的塔羅解讀文字，大約五十個字左右，用於測試語音合成的性能表現。"

    start = time.time()
    result = await tts_service.synthesize_speech(text, "pip_boy")
    elapsed = time.time() - start

    # Target: < 2 seconds
    assert elapsed < 2.0
    assert result["duration"] > 0
    assert result["file_size"] > 0

@pytest.mark.performance
async def test_cache_hit_rate():
    """Test cache effectiveness"""
    text = "測試快取命中率"
    character_key = "pip_boy"

    # First request (cache miss)
    response1 = await synthesize_audio(
        SynthesizeRequest(text=text, character_key=character_key),
        db, tts_service, storage_service, cache_service
    )
    assert not response1.cached

    # Second request (cache hit)
    response2 = await synthesize_audio(
        SynthesizeRequest(text=text, character_key=character_key),
        db, tts_service, storage_service, cache_service
    )
    assert response2.cached
    assert response2.source == "redis"
```

### Audio Quality Tests

```python
@pytest.mark.audio_quality
def test_audio_quality_metrics():
    """Test audio quality meets standards"""
    # Generate sample audio
    result = tts_service.synthesize_speech("測試音質", "pip_boy")
    audio_content = result["audio_content"]

    # Save to temporary file for analysis
    with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
        f.write(audio_content)
        f.flush()

        # Analyze audio properties
        audio = AudioSegment.from_file(f.name)

        # Check sample rate (should be high quality)
        assert audio.frame_rate >= 24000  # 24kHz+

        # Check file size (reasonable compression)
        assert len(audio_content) < len(result["text"]) * 1000  # ~1KB per character max

        # Check duration matches estimate
        actual_duration = len(audio) / 1000.0  # ms to seconds
        estimated_duration = result["duration"]
        assert abs(actual_duration - estimated_duration) < 0.5  # Within 0.5s
```

## Monitoring and Observability

### Key Metrics

#### 1. Synthesis Metrics
```python
# Prometheus metrics
tts_synthesis_total = Counter(
    "tts_synthesis_total",
    "Total TTS synthesis requests",
    ["voice_model", "character_key", "status"]
)

tts_synthesis_duration = Histogram(
    "tts_synthesis_duration_seconds",
    "TTS synthesis duration",
    ["voice_model", "character_key"]
)

tts_cache_hits = Counter(
    "tts_cache_hits_total",
    "Cache hit/miss counts",
    ["voice_model", "source"]  # source: redis, db, new
)

tts_audio_file_size = Histogram(
    "tts_audio_file_size_bytes",
    "Audio file size distribution",
    ["voice_model", "character_key"]
)

tts_fallback_total = Counter(
    "tts_chirp3_fallback_total",
    "Chirp 3:HD fallback to WaveNet count",
    ["character_key", "error_type"]
)
```

#### 2. Instrumentation Points

```python
class TTSService:
    def synthesize_speech(self, text: str, character_key: str, **kwargs) -> Dict[str, Any]:
        voice_model = self.router.get_voice_model(character_key)

        start_time = time.time()
        try:
            if voice_model == "chirp3-hd":
                result = self._synthesize_chirp3(text, character_key, **kwargs)
            else:
                result = self._synthesize_wavenet(text, character_key, **kwargs)

            # Record success metrics
            duration = time.time() - start_time
            tts_synthesis_total.labels(
                voice_model=voice_model,
                character_key=character_key,
                status="success"
            ).inc()
            tts_synthesis_duration.labels(
                voice_model=voice_model,
                character_key=character_key
            ).observe(duration)
            tts_audio_file_size.labels(
                voice_model=voice_model,
                character_key=character_key
            ).observe(result["file_size"])

            return result

        except Exception as e:
            # Record error metrics
            tts_synthesis_total.labels(
                voice_model=voice_model,
                character_key=character_key,
                status="error"
            ).inc()

            # Try fallback
            if voice_model == "chirp3-hd" and self.router.settings.chirp3_fallback_to_wavenet:
                tts_fallback_total.labels(
                    character_key=character_key,
                    error_type=type(e).__name__
                ).inc()

                logger.warning(f"Chirp 3:HD failed, falling back: {e}")
                return self._synthesize_wavenet(text, character_key, **kwargs)
            raise
```

### Dashboards

#### 1. Voice Model Comparison Dashboard
- Synthesis success rate by model
- Average synthesis time by model
- Audio quality metrics comparison
- Cache hit rates by model
- Error rates and fallback frequency

#### 2. Character Voice Dashboard
- Synthesis counts per character
- Average duration per character
- File size distribution per character
- Error rates per character

#### 3. Performance Dashboard
- P50/P95/P99 synthesis latency
- Cache hit rate trends
- API response time distribution
- Error rate over time

## Deployment Plan

### Phase 1: Infrastructure Preparation (Week 1)
- [ ] Update Google Cloud TTS client library
- [ ] Add Chirp 3:HD voice model configuration
- [ ] Implement feature flags and routing logic
- [ ] Add monitoring metrics and dashboards
- [ ] Set up staging environment

### Phase 2: Code Implementation (Week 2-3)
- [ ] Implement Chirp 3:HD voice mapping
- [ ] Add custom pronunciation support
- [ ] Implement enhanced voice controls
- [ ] Update cache key computation
- [ ] Add comprehensive unit tests

### Phase 3: Integration Testing (Week 4)
- [ ] End-to-end integration tests
- [ ] Performance benchmarking
- [ ] Audio quality assessment
- [ ] Backward compatibility verification
- [ ] Load testing

### Phase 4: Gradual Rollout (Week 5-6)
- [ ] **Day 1-2:** Enable for 1 test character (pip_boy) at 10%
- [ ] **Day 3-4:** Increase to 50% for test character
- [ ] **Day 5-7:** Enable for 3 characters at 25%
- [ ] **Week 2:** Enable for all characters at 50%
- [ ] **Week 3:** Increase to 100% with monitoring

### Phase 5: WaveNet Deprecation (Week 7+)
- [ ] Confirm Chirp 3:HD stability (95%+ success rate)
- [ ] Disable WaveNet fallback for non-critical paths
- [ ] Remove WaveNet-specific code (keep for emergency rollback)
- [ ] Archive WaveNet configuration

### Rollback Triggers
- Synthesis error rate > 5%
- Cache hit rate drop > 20%
- User complaints about audio quality
- Performance degradation > 50%

## Risk Mitigation

### Technical Risks

| Risk                                | Impact | Likelihood | Mitigation Strategy                                |
| ----------------------------------- | ------ | ---------- | -------------------------------------------------- |
| Chirp 3:HD API instability          | High   | Medium     | Feature flags, automatic fallback to WaveNet       |
| Voice quality regression            | High   | Low        | A/B testing, user feedback collection              |
| Performance degradation             | Medium | Low        | Performance tests, caching optimization            |
| Chinese voice quality issues        | High   | Medium     | Test extensively, consider hybrid approach         |
| Quota exhaustion                    | Medium | Low        | Monitor usage, set up quota alerts                 |
| Cache invalidation issues           | Medium | Medium     | Dual caching strategy, versioned cache keys        |
| Breaking API changes                | High   | Low        | Strict backward compatibility, comprehensive tests |

### Operational Risks

| Risk                        | Impact | Likelihood | Mitigation Strategy                           |
| --------------------------- | ------ | ---------- | --------------------------------------------- |
| Deployment failures         | High   | Low        | Staged rollout, automated rollback            |
| Monitoring blind spots      | Medium | Medium     | Comprehensive metrics, alerting               |
| Cost overruns               | Medium | Low        | Usage monitoring, budget alerts               |
| Insufficient testing        | High   | Medium     | Comprehensive test suite, staging environment |

## Open Questions

1. **Chinese Voice Availability:** Are native Chinese Chirp 3:HD voices available? If not, what is the timeline?
2. **Cross-lingual Quality:** How does Chirp 3:HD handle Chinese text with English voices? Audio quality acceptable?
3. **Quota Limits:** What are Google Cloud TTS quotas for Chirp 3:HD? Different from WaveNet?
4. **Pricing:** Cost difference between Chirp 3:HD and WaveNet?
5. **Voice Consistency:** Can we ensure voice characteristics remain consistent across Chirp 3:HD updates?

## Success Metrics

### Quantitative Metrics
- **Audio Quality:** > 4.0/5.0 user rating (if collected)
- **Synthesis Performance:** < 2 seconds for 90% of requests
- **Cache Hit Rate:** > 90% (maintained or improved)
- **Error Rate:** < 1% synthesis failures
- **Fallback Rate:** < 5% fallback to WaveNet

### Qualitative Metrics
- User feedback on voice quality
- Stakeholder approval of character voice mapping
- Developer satisfaction with API design
- Documentation completeness

## Conclusion

This design provides a comprehensive plan for upgrading to Chirp 3:HD while maintaining backward compatibility and system stability. The phased rollout approach with feature flags ensures we can safely test and validate the new system before full deployment. The dual-model support and automatic fallback mechanisms minimize risk, while the enhanced monitoring provides visibility into system performance and quality.

**Next Steps:**
1. Review and approve this design document
2. Generate implementation tasks breakdown
3. Begin Phase 1 infrastructure preparation
4. Set up staging environment for testing
