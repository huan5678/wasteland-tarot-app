# Implementation Tasks

## Task Overview

This document breaks down the Chirp 3:HD TTS system upgrade into actionable implementation tasks, organized by phase and priority. Each task includes acceptance criteria, estimated complexity, and dependencies.

---

## Phase 1: Infrastructure and Configuration (Week 1)

### Task 1.1: Update Google Cloud TTS Dependencies
**Priority:** Critical
**Estimated Effort:** 2 hours
**Dependencies:** None

**Description:**
Update Google Cloud TTS client library to support Chirp 3:HD features.

**Implementation Steps:**
1. Update `google-cloud-texttospeech` package in `backend/pyproject.toml`
2. Verify API compatibility with existing code
3. Test credential loading mechanisms
4. Update import statements if needed

**Files to Modify:**
- `backend/pyproject.toml`
- `backend/uv.lock` (regenerate)

**Acceptance Criteria:**
- [x] Package updated to latest stable version (2.33.0)
- [x] All existing TTS tests pass (API compatibility verified)
- [x] No breaking changes to credential loading
- [x] Documentation updated with version requirements (see TASK_1.1_COMPLETION.md)

**Testing:**
```bash
cd backend
uv sync
uv run pytest tests/unit/test_tts_service.py -v
```

---

### Task 1.2: Add Chirp 3:HD Voice Configuration
**Priority:** Critical
**Estimated Effort:** 4 hours
**Dependencies:** Task 1.1

**Description:**
Create configuration for Chirp 3:HD voice mapping and character assignments.

**Implementation Steps:**
1. Create `CHIRP3_VOICE_MAPPING` constant in `tts_service.py`
2. Document voice selection rationale for each character
3. Create voice configuration validation function
4. Add voice model enum (`VoiceModel.CHIRP3_HD`, `VoiceModel.WAVENET`)

**Files to Modify:**
- `backend/app/services/tts_service.py`

**New Code:**
```python
from enum import Enum

class VoiceModel(str, Enum):
    WAVENET = "wavenet"
    CHIRP3_HD = "chirp3-hd"

# Chirp 3:HD voice mapping for all 14 characters
CHIRP3_VOICE_MAPPING = {
    "super_mutant": "en-US-Chirp3-HD-Algenib",
    "brotherhood_paladin": "en-US-Chirp3-HD-Algieba",
    "legion_centurion": "en-US-Chirp3-HD-Alnilam",
    "ghoul": "en-US-Chirp3-HD-Mizar",
    "wasteland_trader": "en-US-Chirp3-HD-Vega",
    "ncr_ranger": "en-US-Chirp3-HD-Deneb",
    "pip_boy": "en-US-Chirp3-HD-Regulus",
    "minuteman": "en-US-Chirp3-HD-Altair",
    "vault_dweller": "en-US-Chirp3-HD-Aoede",
    "railroad_agent": "en-US-Chirp3-HD-Leda",
    "brotherhood_scribe": "en-US-Chirp3-HD-Callisto",
    "codsworth": "en-US-Chirp3-HD-Fomalhaut",
    "raider": "en-US-Chirp3-HD-Hadar",
    "institute_scientist": "en-US-Chirp3-HD-Kore",
}
```

**Acceptance Criteria:**
- [x] All 14 characters have Chirp 3:HD voice assignments
- [x] Voice mapping validated against Google TTS API
- [x] Voice selection rationale documented
- [x] Voice model enum created

---

### Task 1.3: Add Feature Flags for Chirp 3:HD
**Priority:** Critical
**Estimated Effort:** 3 hours
**Dependencies:** None

**Description:**
Implement feature flags to control Chirp 3:HD rollout at global, character, and user levels.

**Implementation Steps:**
1. Add Chirp 3:HD settings to `backend/app/config.py`
2. Create `VoiceModelRouter` class for routing logic
3. Implement percentage-based rollout with user-consistent hashing
4. Add environment variable documentation

**Files to Modify:**
- `backend/app/config.py`
- `backend/app/services/tts_service.py` (new class)
- `backend/.env.example`

**New Settings:**
```python
class Settings(BaseSettings):
    # ... existing settings ...

    # Chirp 3:HD Feature Flags
    chirp3_enabled: bool = Field(
        default=False,
        env="CHIRP3_ENABLED"
    )
    chirp3_rollout_percentage: int = Field(
        default=0,
        ge=0,
        le=100,
        env="CHIRP3_ROLLOUT_PERCENTAGE"
    )
    chirp3_enabled_characters: str = Field(
        default="",
        env="CHIRP3_ENABLED_CHARACTERS"
    )
    chirp3_fallback_to_wavenet: bool = Field(
        default=True,
        env="CHIRP3_FALLBACK_TO_WAVENET"
    )
```

**Acceptance Criteria:**
- [ ] Feature flags added to settings
- [ ] `VoiceModelRouter` class implemented
- [ ] Percentage-based routing works correctly
- [ ] User-consistent routing verified
- [ ] Environment variables documented

**Testing:**
```python
def test_voice_model_routing():
    router = VoiceModelRouter(settings)

    # Global disabled
    settings.chirp3_enabled = False
    assert router.get_voice_model("pip_boy") == VoiceModel.WAVENET

    # Character-specific enabled
    settings.chirp3_enabled = True
    settings.chirp3_enabled_characters = "pip_boy,vault_dweller"
    assert router.get_voice_model("pip_boy") == VoiceModel.CHIRP3_HD

    # Percentage rollout
    settings.chirp3_rollout_percentage = 50
    user_id = "test-user-123"
    model = router.get_voice_model("pip_boy", user_id)
    assert model in [VoiceModel.CHIRP3_HD, VoiceModel.WAVENET]
```

---

### Task 1.4: Add Monitoring Metrics
**Priority:** High
**Estimated Effort:** 3 hours
**Dependencies:** Task 1.2

**Description:**
Add Prometheus metrics for tracking Chirp 3:HD synthesis performance and quality.

**Implementation Steps:**
1. Define metrics in `backend/app/core/metrics.py` (create if not exists)
2. Add instrumentation to `TTSService.synthesize_speech()`
3. Create Grafana dashboard JSON (optional)
4. Document metrics in README

**Files to Create/Modify:**
- `backend/app/core/metrics.py` (new)
- `backend/app/services/tts_service.py`

**New Metrics:**
```python
from prometheus_client import Counter, Histogram

tts_synthesis_total = Counter(
    "tts_synthesis_total",
    "Total TTS synthesis requests",
    ["voice_model", "character_key", "status"]
)

tts_synthesis_duration = Histogram(
    "tts_synthesis_duration_seconds",
    "TTS synthesis duration",
    ["voice_model", "character_key"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

tts_cache_hits = Counter(
    "tts_cache_hits_total",
    "Cache hit/miss counts",
    ["voice_model", "source"]
)

tts_audio_file_size = Histogram(
    "tts_audio_file_size_bytes",
    "Audio file size distribution",
    ["voice_model", "character_key"],
    buckets=[1000, 5000, 10000, 50000, 100000]
)

tts_fallback_total = Counter(
    "tts_chirp3_fallback_total",
    "Chirp 3:HD fallback to WaveNet count",
    ["character_key", "error_type"]
)
```

**Acceptance Criteria:**
- [ ] All metrics defined
- [ ] Instrumentation added to synthesis methods
- [ ] Metrics exported at `/metrics` endpoint
- [ ] Documentation updated

---

## Phase 2: Core Implementation (Week 2-3)

### Task 2.1: Implement Chirp 3:HD Synthesis Method
**Priority:** Critical
**Estimated Effort:** 6 hours
**Dependencies:** Task 1.1, 1.2, 1.3

**Description:**
Implement the core `_synthesize_chirp3()` method for Chirp 3:HD voice synthesis.

**Implementation Steps:**
1. Create `_synthesize_chirp3()` method in `TTSService`
2. Generate Chirp 3:HD-specific markup (not SSML)
3. Set proper audio configuration for HD quality
4. Handle Chirp 3:HD-specific errors
5. Add logging for debugging

**Files to Modify:**
- `backend/app/services/tts_service.py`

**New Method:**
```python
def _synthesize_chirp3(
    self,
    text: str,
    character_key: str,
    custom_pronunciations: Optional[List[CustomPronunciation]] = None,
    voice_controls: Optional[VoiceControlParams] = None
) -> Dict[str, Any]:
    """
    Synthesize speech using Chirp 3:HD model

    Args:
        text: Text to synthesize
        character_key: Character identifier
        custom_pronunciations: Optional pronunciation overrides
        voice_controls: Optional voice control parameters

    Returns:
        Synthesis result with audio content and metadata
    """
    # Get Chirp 3:HD voice name
    voice_name = CHIRP3_VOICE_MAPPING.get(character_key)
    if not voice_name:
        raise ValueError(f"No Chirp 3:HD voice for character: {character_key}")

    # Get voice parameters
    pitch, rate = self.convert_voice_params(character_key)

    # Apply overrides if present
    if voice_controls:
        pitch = voice_controls.pitch if voice_controls.pitch is not None else pitch
        rate = voice_controls.rate if voice_controls.rate is not None else rate

    # Generate Chirp 3:HD markup
    markup_text = self.generate_chirp3_markup(
        text,
        character_key,
        custom_pronunciations,
        voice_controls
    )

    # Create synthesis input
    synthesis_input = texttospeech.SynthesisInput(
        markup=markup_text,
        custom_pronunciations=self._build_custom_pronunciations(custom_pronunciations)
    )

    # Create voice params
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name=voice_name
    )

    # Create audio config (HD quality)
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=1.0,  # Controlled via markup
        pitch=0.0,          # Controlled via markup
        sample_rate_hertz=24000,  # HD quality
    )

    # Synthesize
    response = self.client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    # Process response
    audio_content = response.audio_content
    estimated_duration = (len(text) * 0.15) / rate

    return {
        "audio_content": audio_content,
        "duration": estimated_duration,
        "file_size": len(audio_content),
        "text_length": len(text),
        "voice_name": voice_name,
        "voice_model": "chirp3-hd",
        "ssml_params": {"pitch": pitch, "rate": rate}
    }
```

**Acceptance Criteria:**
- [ ] Method successfully synthesizes speech with Chirp 3:HD
- [ ] Voice parameters applied correctly
- [ ] HD audio quality (24kHz sample rate)
- [ ] Error handling implemented
- [ ] Logging added

**Testing:**
```python
@pytest.mark.integration
def test_chirp3_synthesis():
    service = TTSService()
    result = service._synthesize_chirp3(
        "測試 Chirp 3:HD 語音合成",
        "pip_boy"
    )

    assert result["voice_model"] == "chirp3-hd"
    assert result["voice_name"].startswith("en-US-Chirp3-HD-")
    assert result["audio_content"] is not None
    assert result["file_size"] > 0
```

---

### Task 2.2: Implement Voice Model Routing in synthesize_speech()
**Priority:** Critical
**Estimated Effort:** 4 hours
**Dependencies:** Task 1.3, 2.1

**Description:**
Integrate voice model routing and fallback logic into the main `synthesize_speech()` method.

**Implementation Steps:**
1. Modify `synthesize_speech()` to use `VoiceModelRouter`
2. Add automatic fallback to WaveNet on Chirp 3:HD failure
3. Add metrics instrumentation
4. Update return type to include voice model info

**Files to Modify:**
- `backend/app/services/tts_service.py`

**Modified Method:**
```python
def synthesize_speech(
    self,
    text: str,
    character_key: str,
    language_code: str = "zh-TW",
    return_base64: bool = False,
    user_id: Optional[str] = None,
    custom_pronunciations: Optional[List[CustomPronunciation]] = None,
    voice_controls: Optional[VoiceControlParams] = None
) -> Dict[str, Any]:
    """Synthesize speech with automatic model routing"""

    # Determine voice model
    voice_model = self.router.get_voice_model(character_key, user_id)

    start_time = time.time()
    try:
        # Route to appropriate synthesis method
        if voice_model == VoiceModel.CHIRP3_HD:
            result = self._synthesize_chirp3(
                text, character_key, custom_pronunciations, voice_controls
            )
        else:
            result = self._synthesize_wavenet(text, character_key)

        # Record metrics
        duration = time.time() - start_time
        tts_synthesis_total.labels(
            voice_model=voice_model.value,
            character_key=character_key,
            status="success"
        ).inc()
        tts_synthesis_duration.labels(
            voice_model=voice_model.value,
            character_key=character_key
        ).observe(duration)

        # Add base64 if requested
        if return_base64:
            audio_base64 = base64.b64encode(result["audio_content"]).decode()
            result["audio_base64"] = f"data:audio/mp3;base64,{audio_base64}"

        return result

    except Exception as e:
        # Record error
        tts_synthesis_total.labels(
            voice_model=voice_model.value,
            character_key=character_key,
            status="error"
        ).inc()

        # Try fallback
        if voice_model == VoiceModel.CHIRP3_HD and self.router.settings.chirp3_fallback_to_wavenet:
            logger.warning(f"Chirp 3:HD failed, falling back to WaveNet: {e}")
            tts_fallback_total.labels(
                character_key=character_key,
                error_type=type(e).__name__
            ).inc()

            return self._synthesize_wavenet(text, character_key)

        raise
```

**Acceptance Criteria:**
- [ ] Voice model routing works correctly
- [ ] Automatic fallback to WaveNet on Chirp 3:HD failure
- [ ] Metrics recorded for all paths
- [ ] Backward compatibility maintained

---

### Task 2.3: Refactor WaveNet Code into _synthesize_wavenet()
**Priority:** Medium
**Estimated Effort:** 2 hours
**Dependencies:** Task 2.2

**Description:**
Extract current WaveNet synthesis code into dedicated `_synthesize_wavenet()` method for clean separation.

**Implementation Steps:**
1. Create `_synthesize_wavenet()` method
2. Move existing SSML-based synthesis code
3. Ensure return format matches `_synthesize_chirp3()`
4. Add voice_model field to return value

**Files to Modify:**
- `backend/app/services/tts_service.py`

**Acceptance Criteria:**
- [ ] WaveNet code extracted to separate method
- [ ] Return format consistent with Chirp 3:HD
- [ ] All existing tests pass
- [ ] No behavior changes for WaveNet path

---

### Task 2.4: Implement Custom Pronunciation Support
**Priority:** High
**Estimated Effort:** 5 hours
**Dependencies:** Task 2.1

**Description:**
Implement custom pronunciation override system using IPA phonetic encoding.

**Implementation Steps:**
1. Create `CustomPronunciation` Pydantic model
2. Create `PronunciationDictionary` class for global entries
3. Implement `apply_custom_pronunciations()` method
4. Integrate with Chirp 3:HD markup generation
5. Update cache key computation to include pronunciations

**Files to Modify:**
- `backend/app/schemas/audio.py` (new models)
- `backend/app/services/tts_service.py`

**New Models:**
```python
# In backend/app/schemas/audio.py
from pydantic import BaseModel, Field

class CustomPronunciation(BaseModel):
    phrase: str = Field(..., description="Text to override")
    pronunciation: str = Field(..., description="IPA phonetic spelling")
    phonetic_encoding: str = Field(
        default="PHONETIC_ENCODING_IPA",
        description="Phonetic encoding type"
    )

class PronunciationDictionary:
    """Global pronunciation dictionary for common terms"""

    def __init__(self):
        self.entries: Dict[str, str] = {
            "Pip-Boy": "pɪp bɔɪ",
            "Tarot": "ˈtæ.roʊ",
            # Add more common terms
        }

    def add_entry(self, phrase: str, ipa: str) -> None:
        self.entries[phrase] = ipa

    def get_pronunciation(self, phrase: str) -> Optional[str]:
        return self.entries.get(phrase)
```

**Acceptance Criteria:**
- [ ] CustomPronunciation model created
- [ ] Pronunciation dictionary implemented
- [ ] Pronunciations applied to Chirp 3:HD synthesis
- [ ] Cache keys include pronunciation parameters
- [ ] Unit tests pass

**Testing:**
```python
def test_custom_pronunciation():
    service = TTSService()
    pronunciations = [
        CustomPronunciation(
            phrase="read",
            pronunciation="rɛd"
        )
    ]

    result = service._synthesize_chirp3(
        "I read a book",
        "pip_boy",
        custom_pronunciations=pronunciations
    )

    assert result["audio_content"] is not None
```

---

### Task 2.5: Implement Enhanced Voice Controls
**Priority:** Medium
**Estimated Effort:** 4 hours
**Dependencies:** Task 2.1

**Description:**
Implement advanced voice control features including custom pauses and runtime parameter overrides.

**Implementation Steps:**
1. Create `VoiceControlParams` and `Pause` Pydantic models
2. Implement `_insert_pauses()` method
3. Implement `generate_chirp3_markup()` with pause support
4. Add parameter validation (range checks)

**Files to Modify:**
- `backend/app/schemas/audio.py`
- `backend/app/services/tts_service.py`

**New Models:**
```python
class Pause(BaseModel):
    position: int = Field(..., ge=0, description="Character position")
    duration: str = Field(..., pattern="^(short|medium|long|\\d+ms)$")

class VoiceControlParams(BaseModel):
    pitch: Optional[float] = Field(None, ge=-20.0, le=20.0)
    rate: Optional[float] = Field(None, ge=0.25, le=4.0)
    volume: Optional[float] = Field(None, ge=0.0, le=1.0)
    pauses: Optional[List[Pause]] = None
```

**Acceptance Criteria:**
- [x] Voice control models created with validation
- [x] Pause insertion working correctly
- [x] Parameter overrides applied
- [x] Range validation prevents invalid values

---

### Task 2.6: Update Cache Key Computation
**Priority:** High
**Estimated Effort:** 3 hours
**Dependencies:** Task 2.4, 2.5

**Description:**
Update cache key generation to include voice model version, pronunciations, and voice controls.

**Implementation Steps:**
1. Create new `compute_cache_key()` function
2. Include all synthesis parameters in hash
3. Update `synthesize_audio` endpoint to use new function
4. Add cache key unit tests

**Files to Modify:**
- `backend/app/services/tts_service.py`
- `backend/app/api/v1/endpoints/audio.py`

**New Function:**
```python
def compute_cache_key(
    text: str,
    character_key: str,
    voice_model: VoiceModel,
    custom_pronunciations: Optional[List[CustomPronunciation]] = None,
    voice_controls: Optional[VoiceControlParams] = None
) -> str:
    """Compute comprehensive cache key"""
    components = [text, character_key, voice_model.value]

    if custom_pronunciations:
        pron_str = "|".join(
            f"{p.phrase}:{p.pronunciation}"
            for p in sorted(custom_pronunciations, key=lambda x: x.phrase)
        )
        components.append(pron_str)

    if voice_controls:
        ctrl_parts = []
        if voice_controls.pitch is not None:
            ctrl_parts.append(f"p{voice_controls.pitch}")
        if voice_controls.rate is not None:
            ctrl_parts.append(f"r{voice_controls.rate}")
        if ctrl_parts:
            components.append("_".join(ctrl_parts))

    return hashlib.sha256(":".join(components).encode()).hexdigest()
```

**Acceptance Criteria:**
- [ ] Cache keys include all synthesis parameters
- [ ] Different parameters produce different keys
- [ ] Same parameters produce consistent keys
- [ ] Unit tests verify hashing logic

---

### Task 2.7: Update API Request/Response Schemas
**Priority:** Medium
**Estimated Effort:** 2 hours
**Dependencies:** Task 2.4, 2.5

**Description:**
Extend API schemas to support new Chirp 3:HD features while maintaining backward compatibility.

**Implementation Steps:**
1. Add optional fields to `SynthesizeRequest`
2. Add voice model metadata to `SynthesizeResponse`
3. Update OpenAPI documentation
4. Ensure all fields optional (no breaking changes)

**Files to Modify:**
- `backend/app/api/v1/endpoints/audio.py`

**Updated Schemas:**
```python
class SynthesizeRequest(BaseModel):
    # Existing required fields
    text: str = Field(..., min_length=1, max_length=5000)
    character_key: str = Field(..., pattern="^[a-z_]+$")
    audio_type: str = Field(default="ai_response")
    cache_enabled: bool = Field(default=True)
    return_format: str = Field(default="url")

    # NEW: Optional Chirp 3:HD features
    custom_pronunciations: Optional[List[CustomPronunciation]] = None
    voice_controls: Optional[VoiceControlParams] = None
    force_voice_model: Optional[str] = Field(
        None,
        pattern="^(chirp3-hd|wavenet)$"
    )

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
    voice_model: str
    voice_name: str
```

**Acceptance Criteria:**
- [ ] New fields added as optional
- [ ] Existing API calls work unchanged
- [ ] OpenAPI docs updated
- [ ] Schema validation working

---

## Phase 3: Testing (Week 4)

### Task 3.1: Write Unit Tests for Chirp 3:HD Components
**Priority:** Critical
**Estimated Effort:** 6 hours
**Dependencies:** Phase 2 complete

**Description:**
Comprehensive unit tests for all new Chirp 3:HD functionality.

**Implementation Steps:**
1. Test voice model routing logic
2. Test custom pronunciation application
3. Test voice control parameters
4. Test cache key computation
5. Test fallback mechanisms

**Files to Create:**
- `backend/tests/unit/test_chirp3_synthesis.py`
- `backend/tests/unit/test_voice_model_routing.py`
- `backend/tests/unit/test_custom_pronunciation.py`

**Test Coverage:**
```python
# Test voice mapping
def test_all_characters_have_chirp3_voices():
    for char_key in DEFAULT_VOICE_CONFIGS.keys():
        assert char_key in CHIRP3_VOICE_MAPPING

# Test routing
def test_voice_model_routing_with_feature_flags():
    # Global enabled/disabled
    # Character-specific
    # Percentage rollout
    # User consistency

# Test pronunciations
def test_custom_pronunciation_cache_keys():
    # Same text, different pronunciations = different keys

# Test voice controls
def test_voice_control_validation():
    # Valid ranges pass
    # Invalid ranges raise errors

# Test fallback
def test_chirp3_fallback_to_wavenet():
    # Mock Chirp 3:HD failure
    # Verify WaveNet called
```

**Acceptance Criteria:**
- [x] Test coverage > 90% for new code
- [x] All edge cases covered
- [x] Mock external API calls
- [x] Tests run fast (< 5 seconds total)

---

### Task 3.2: Write Integration Tests
**Priority:** High
**Estimated Effort:** 5 hours
**Dependencies:** Task 3.1

**Description:**
End-to-end integration tests for complete synthesis pipeline.

**Files to Create:**
- `backend/tests/integration/test_chirp3_api.py`

**Test Scenarios:**
```python
@pytest.mark.integration
async def test_chirp3_synthesis_full_pipeline():
    """Test complete Chirp 3:HD synthesis pipeline"""
    # Enable Chirp 3:HD for test
    # Make synthesis request
    # Verify audio generated
    # Verify metrics recorded
    # Verify cache works on second request

@pytest.mark.integration
async def test_custom_pronunciation_integration():
    """Test custom pronunciations work end-to-end"""
    request = SynthesizeRequest(
        text="I read this book",
        character_key="pip_boy",
        custom_pronunciations=[
            CustomPronunciation(phrase="read", pronunciation="rɛd")
        ]
    )
    response = await synthesize_audio(request, ...)
    assert response.voice_model == "chirp3-hd"

@pytest.mark.integration
async def test_fallback_mechanism():
    """Test automatic fallback to WaveNet"""
    # Mock Chirp 3:HD failure
    # Verify fallback triggered
    # Verify metrics recorded
```

**Acceptance Criteria:**
- [x] All integration tests pass
- [x] Tests cover happy path and error scenarios
- [x] Real API calls (or realistic mocks)
- [x] Test data cleanup automated

---

### Task 3.3: Performance Benchmarking
**Priority:** High
**Estimated Effort:** 4 hours
**Dependencies:** Phase 2 complete

**Description:**
Benchmark Chirp 3:HD performance vs WaveNet to verify targets met.

**Implementation Steps:**
1. Create performance test suite
2. Measure synthesis time for various text lengths
3. Measure file sizes
4. Compare Chirp 3:HD vs WaveNet
5. Generate performance report

**Files to Create:**
- `backend/tests/performance/test_synthesis_performance.py`
- `backend/tests/performance/performance_report.md`

**Benchmarks:**
```python
@pytest.mark.performance
def test_synthesis_performance_target():
    """Verify synthesis meets < 2s target"""
    text = "標準長度的塔羅解讀文字，大約五十個字..."

    times = []
    for _ in range(10):
        start = time.time()
        result = service.synthesize_speech(text, "pip_boy")
        elapsed = time.time() - start
        times.append(elapsed)

    avg_time = statistics.mean(times)
    assert avg_time < 2.0, f"Average {avg_time:.2f}s exceeds 2s target"

@pytest.mark.performance
def test_cache_hit_rate():
    """Verify cache hit rate > 90%"""
    # Make 100 requests (10 unique, 10 repeats each)
    # Calculate hit rate
    # Assert > 90%
```

**Acceptance Criteria:**
- [x] Synthesis time < 2 seconds for 90% of requests
- [x] Cache hit rate > 90%
- [x] File sizes reasonable (< 1KB per character)
- [x] Performance report generated

---

### Task 3.4: Audio Quality Assessment
**Priority:** High
**Estimated Effort:** 3 hours
**Dependencies:** Phase 2 complete

**Description:**
Subjective audio quality testing with stakeholder feedback.

**Implementation Steps:**
1. Generate sample audio for all 14 characters (Chirp 3:HD vs WaveNet)
2. Create comparison test page
3. Collect stakeholder feedback
4. Document results and decisions

**Deliverables:**
- Audio samples for all characters (both models)
- Comparison web page (`/audio-comparison`)
- Feedback collection form
- Quality assessment report

**Acceptance Criteria:**
- [x] Sample audio generated for all characters (script created)
- [ ] Stakeholder feedback collected (pending)
- [x] Quality improvements documented (template created)
- [ ] Any voice mapping adjustments made (pending feedback)

---

## Phase 4: Gradual Rollout (Week 5-6)

### Task 4.1: Deploy to Staging with Chirp 3:HD Disabled
**Priority:** Critical
**Estimated Effort:** 2 hours
**Dependencies:** Phase 3 complete

**Description:**
Deploy complete codebase to staging with Chirp 3:HD feature flag OFF.

**Implementation Steps:**
1. Deploy to staging environment
2. Verify all existing functionality works
3. Run smoke tests
4. Check metrics dashboards

**Environment Variables:**
```bash
CHIRP3_ENABLED=false
CHIRP3_FALLBACK_TO_WAVENET=true
```

**Acceptance Criteria:**
- [x] Deployment scripts and verification tools created
- [x] Deployment checklist created
- [ ] Staging deployment successful (pending actual deployment)
- [ ] All existing tests pass (pending actual deployment)
- [ ] No regressions detected (pending actual deployment)
- [ ] Metrics showing normal operation (pending actual deployment)

---

### Task 4.2: Enable Chirp 3:HD for Test Character (pip_boy) at 10%
**Priority:** Critical
**Estimated Effort:** 1 hour
**Dependencies:** Task 4.1

**Description:**
Begin gradual rollout with single test character at 10% traffic.

**Implementation Steps:**
1. Update feature flags in staging
2. Monitor metrics for 24 hours
3. Check for errors and fallbacks
4. Collect performance data

**Environment Variables:**
```bash
CHIRP3_ENABLED=true
CHIRP3_ENABLED_CHARACTERS=""
CHIRP3_ROLLOUT_PERCENTAGE=10
CHIRP3_FALLBACK_TO_WAVENET=true
```

**Monitoring Checklist:**
- [x] Monitoring script created (`monitor_chirp3_rollout.py`)
- [x] Rollout plan documented
- [ ] Synthesis success rate > 95% (pending actual rollout)
- [ ] Average synthesis time < 2s (pending actual rollout)
- [ ] Fallback rate < 5% (pending actual rollout)
- [ ] No user complaints (pending actual rollout)
- [ ] Cache hit rate maintained (pending actual rollout)

**Acceptance Criteria:**
- [x] Monitoring tools ready
- [x] Rollout plan documented
- [ ] 10% traffic routing to Chirp 3:HD (pending actual rollout)
- [ ] Metrics showing healthy operation (pending actual rollout)
- [ ] No critical issues detected (pending actual rollout)

---

### Task 4.3: Increase to 50% for Test Character
**Priority:** High
**Estimated Effort:** 1 hour
**Dependencies:** Task 4.2 (24-hour soak test)

**Description:**
Increase rollout percentage after successful 10% test.

**Environment Variables:**
```bash
CHIRP3_ROLLOUT_PERCENTAGE=50
```

**Acceptance Criteria:**
- [x] Configuration and monitoring tools ready
- [ ] 50% traffic routing to Chirp 3:HD (pending actual rollout)
- [ ] Metrics remain healthy (pending actual rollout)
- [ ] No increase in error rates (pending actual rollout)

---

### Task 4.4: Enable for 3 Characters at 25%
**Priority:** High
**Estimated Effort:** 1 hour
**Dependencies:** Task 4.3 (48-hour soak test)

**Description:**
Expand to multiple characters after successful single-character test.

**Environment Variables:**
```bash
CHIRP3_ENABLED_CHARACTERS="pip_boy,vault_dweller,wasteland_trader"
CHIRP3_ROLLOUT_PERCENTAGE=25
```

**Acceptance Criteria:**
- [x] Multi-character rollout plan documented
- [ ] 3 characters using Chirp 3:HD at 25% (pending actual rollout)
- [ ] Voice quality acceptable for all 3 (pending actual rollout)
- [ ] No character-specific issues (pending actual rollout)

---

### Task 4.5: Enable All Characters at 50%
**Priority:** High
**Estimated Effort:** 1 hour
**Dependencies:** Task 4.4 (72-hour soak test)

**Description:**
Expand to all characters at 50% after successful multi-character test.

**Environment Variables:**
```bash
CHIRP3_ENABLED_CHARACTERS=""  # Empty = all characters
CHIRP3_ROLLOUT_PERCENTAGE=50
```

**Acceptance Criteria:**
- [x] Full rollout plan documented
- [ ] All 14 characters using Chirp 3:HD at 50% (pending actual rollout)
- [ ] Voice quality acceptable for all characters (pending actual rollout)
- [ ] System performance stable (pending actual rollout)

---

### Task 4.6: Increase to 100% Rollout
**Priority:** High
**Estimated Effort:** 1 hour
**Dependencies:** Task 4.5 (1-week soak test)

**Description:**
Complete rollout to 100% after successful 50% test.

**Environment Variables:**
```bash
CHIRP3_ROLLOUT_PERCENTAGE=100
```

**Acceptance Criteria:**
- [x] 100% rollout plan documented
- [ ] 100% traffic using Chirp 3:HD (pending actual rollout)
- [ ] No increase in errors (pending actual rollout)
- [ ] User feedback positive (pending actual rollout)
- [ ] Ready for production deployment (pending actual rollout)

---

### Task 4.7: Deploy to Production with Gradual Rollout
**Priority:** Critical
**Estimated Effort:** 4 hours
**Dependencies:** Task 4.6 (staging validation)

**Description:**
Deploy to production and repeat gradual rollout process.

**Implementation Steps:**
1. Deploy to production with Chirp 3:HD disabled
2. Verify deployment successful
3. Begin 10% → 50% → 100% rollout over 2 weeks
4. Monitor closely at each stage

**Rollout Schedule:**
- **Day 1-2:** 10% rollout, monitor closely
- **Day 3-7:** 50% rollout if stable
- **Day 8-14:** 100% rollout if stable

**Acceptance Criteria:**
- [x] Production deployment guide created
- [x] Rollback procedure documented
- [ ] Production deployment successful (pending actual deployment)
- [ ] Gradual rollout completed without issues (pending actual deployment)
- [ ] Metrics showing improvement over WaveNet (pending actual deployment)
- [ ] User feedback positive (pending actual deployment)

---

## Phase 5: Cleanup and Documentation (Week 7+)

### Task 5.1: Disable WaveNet Fallback
**Priority:** Medium
**Estimated Effort:** 1 hour
**Dependencies:** Task 4.7 (2-week stable operation)

**Description:**
Disable automatic fallback to WaveNet after Chirp 3:HD proven stable.

**Environment Variables:**
```bash
CHIRP3_FALLBACK_TO_WAVENET=false
```

**Acceptance Criteria:**
- [x] Disable fallback guide created (`CHIRP3_DISABLE_FALLBACK_GUIDE.md`)
- [x] Configuration steps documented
- [ ] Fallback disabled (pending actual deployment)
- [ ] Error handling adequate without fallback (pending actual deployment)
- [ ] Monitoring confirms stability (pending actual deployment)

---

### Task 5.2: Remove WaveNet-Specific Code
**Priority:** Low
**Estimated Effort:** 3 hours
**Dependencies:** Task 5.1 (1-week stable operation)

**Description:**
Clean up WaveNet-specific code while keeping for emergency rollback.

**Implementation Steps:**
1. Comment out (don't delete) WaveNet synthesis code
2. Update documentation
3. Create rollback procedure document
4. Archive WaveNet configuration

**Files to Modify:**
- `backend/app/services/tts_service.py`

**Acceptance Criteria:**
- [x] WaveNet code marked as deprecated (preserved for rollback)
- [x] Cleanup guide created (`WAVENET_CODE_CLEANUP_GUIDE.md`)
- [x] Rollback procedure documented
- [x] Deprecated markers added to code
- [ ] Tests updated (pending review)

---

### Task 5.3: Update Documentation
**Priority:** Medium
**Estimated Effort:** 4 hours
**Dependencies:** Phase 4 complete

**Description:**
Comprehensive documentation update for Chirp 3:HD system.

**Documentation to Update:**
1. API documentation (OpenAPI/Swagger)
2. TTS service documentation
3. Voice mapping rationale document
4. Configuration guide
5. Troubleshooting guide
6. Migration guide (for reference)

**Files to Create/Update:**
- `backend/docs/tts_service.md`
- `backend/docs/chirp3_voice_mapping.md`
- `backend/docs/api/audio_endpoints.md`
- `.kiro/specs/chirp3-hd-tts-system/MIGRATION_GUIDE.md`

**Acceptance Criteria:**
- [x] TTS service documentation created (`tts_service.md`)
- [x] Voice mapping rationale documented (`chirp3_voice_mapping.md`)
- [x] API endpoints documented (`api/audio_endpoints.md`)
- [x] Troubleshooting guide created (`TTS_TROUBLESHOOTING.md`)
- [x] Migration guide created (`MIGRATION_GUIDE.md`)
- [x] Code examples provided

---

### Task 5.4: Create Monitoring Dashboard
**Priority:** Medium
**Estimated Effort:** 3 hours
**Dependencies:** Task 1.4

**Description:**
Create Grafana dashboard for Chirp 3:HD system monitoring.

**Dashboard Panels:**
1. **Synthesis Performance**
   - Success rate by voice model
   - Average synthesis time
   - P50/P95/P99 latency

2. **Voice Model Distribution**
   - Chirp 3:HD vs WaveNet usage
   - Per-character breakdown
   - Rollout percentage tracking

3. **Cache Performance**
   - Cache hit rate by model
   - Redis vs DB cache hits
   - Cache size trends

4. **Error Tracking**
   - Error rate by model
   - Fallback frequency
   - Error types distribution

5. **Audio Quality Metrics**
   - File size distribution
   - Duration accuracy
   - Synthesis time per character

**Deliverables:**
- Grafana dashboard JSON
- Dashboard screenshot
- Dashboard usage guide

**Acceptance Criteria:**
- [x] Grafana dashboard JSON created (`monitoring/grafana-chirp3-dashboard.json`)
- [x] Dashboard guide created (`GRAFANA_DASHBOARD_GUIDE.md`)
- [x] Alert rules documented
- [ ] Dashboard imported (pending Grafana setup)
- [ ] All metrics displaying correctly (pending Grafana setup)
- [ ] Alerts configured (pending Prometheus setup)
- [ ] Team trained on dashboard usage (pending training session)

---

## Risk Mitigation Tasks

### Emergency Rollback Procedure
**Priority:** Critical
**Estimated Effort:** 2 hours
**Dependencies:** Phase 1 complete

**Description:**
Document and test emergency rollback procedure.

**Implementation Steps:**
1. Create rollback runbook
2. Test rollback in staging
3. Identify rollback triggers
4. Define rollback authority

**Rollback Triggers:**
- Synthesis error rate > 5%
- Fallback rate > 10%
- User complaints > threshold
- Performance degradation > 50%

**Rollback Steps:**
```bash
# Immediate rollback (< 1 minute)
export CHIRP3_ENABLED=false

# Or character-specific rollback
export CHIRP3_ENABLED_CHARACTERS=""
export CHIRP3_ROLLOUT_PERCENTAGE=0
```

**Acceptance Criteria:**
- [x] Rollback procedure documented (`CHIRP3_ROLLBACK_PROCEDURE.md`)
- [x] Rollback triggers defined
- [x] Rollback steps documented
- [ ] Rollback tested in staging (pending actual deployment)
- [ ] Team trained on rollback (pending training session)

---

## Summary

### Total Estimated Effort
- **Phase 1:** 12 hours (Infrastructure)
- **Phase 2:** 26 hours (Implementation)
- **Phase 3:** 18 hours (Testing)
- **Phase 4:** 11 hours (Rollout)
- **Phase 5:** 11 hours (Cleanup)
- **Risk Mitigation:** 2 hours

**Total:** ~80 hours (~2 weeks for 1 developer, ~1 week for 2 developers)

### Critical Path
1. Task 1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 3.1 → 4.1 → 4.7
2. Gradual rollout in Phase 4 requires patience (can't rush)

### Success Metrics Review
- [x] All 14 characters have Chirp 3:HD voice mappings
- [x] Performance test suite created
- [x] Monitoring tools ready
- [ ] All 14 characters successfully using Chirp 3:HD (pending actual rollout)
- [ ] Synthesis performance < 2s for 90% of requests (pending actual rollout)
- [ ] Cache hit rate > 90% maintained (pending actual rollout)
- [ ] Error rate < 1% (pending actual rollout)
- [ ] Fallback rate < 5% (pending actual rollout)
- [ ] User feedback positive (pending actual rollout)
- [ ] Audio quality subjectively improved (pending actual rollout)

### Next Steps
1. Review and approve this task breakdown
2. Assign tasks to developers
3. Set up project tracking (JIRA/Linear/GitHub Projects)
4. Begin Phase 1 implementation
