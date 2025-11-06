# Requirements Document

## Project Description (Input)
開始實作 TTS 系統使用 https://cloud.google.com/text-to-speech/docs/chirp3-hd?hl=zh-tw Chirp 3：HD 的模型來完成

## Requirements

### 1. Voice Model Upgrade
**Priority: Critical**

**Description:**
Upgrade the existing Google Cloud TTS implementation from WaveNet voices to the latest Chirp 3:HD model for significantly improved audio quality and emotional expression.

**Requirements:**
- Replace all WaveNet voice mappings with Chirp 3:HD equivalents
- Ensure backward compatibility with existing 14 Fallout character voices
- Maintain current voice personality characteristics (pitch, rate, volume)
- Implement proper fallback mechanisms for unsupported voice features

**Success Criteria:**
- All existing character voices successfully mapped to Chirp 3:HD voices
- Audio quality improvements are perceptible and positive
- No breaking changes to existing API contracts

### 2. Chirp 3:HD Voice Mapping
**Priority: High**

**Description:**
Map existing Fallout characters to appropriate Chirp 3:HD voices based on gender, personality, and vocal characteristics.

**Current Character Analysis:**
- **Low-pitch male voices**: super_mutant, brotherhood_paladin, legion_centurion (need deep, authoritative voices)
- **Mid-pitch male voices**: ghoul, wasteland_trader, ncr_ranger, pip_boy, minuteman (need mature, professional tones)
- **High-pitch female voices**: vault_dweller, railroad_agent, brotherhood_scribe (need youthful, intelligent voices)
- **Special voices**: codsworth (robotic), raider (rough), institute_scientist (analytical)

**Requirements:**
- Research and select optimal Chirp 3:HD voice names for each character
- Document voice selection rationale based on character personality
- Create mapping configuration that preserves existing voice parameters
- Support voice switching for different language requirements

**Success Criteria:**
- Each character has a designated Chirp 3:HD voice
- Voice selections enhance rather than detract from character personalities
- Documentation explains voice selection decisions

### 3. Custom Pronunciation Support
**Priority: High**

**Description:**
Implement support for custom pronunciations using IPA phonetic encoding, allowing precise control over difficult words, names, and technical terms.

**Requirements:**
- Add IPA phonetic encoding support to TTS service
- Implement pronunciation override mechanisms
- Support both inline pronunciation hints and global pronunciation dictionaries
- Integrate with existing SSML generation system

**Technical Implementation:**
- Extend `synthesize_speech` method to accept pronunciation parameters
- Add `custom_pronunciations` field to API requests
- Support IPA phonetic encoding as documented in Chirp 3:HD specs
- Implement fallback for unsupported languages

**Success Criteria:**
- Ability to specify custom pronunciations for proper nouns
- Pronunciation overrides work with existing caching system
- No performance impact on standard synthesis requests

### 4. Voice Control Features
**Priority: Medium**

**Description:**
Implement advanced voice control features including speed adjustment, pitch modulation, and pause controls as supported by Chirp 3:HD.

**Requirements:**
- **Speed Control**: Support speaking rate adjustments (0.25x to 4.0x)
- **Pitch Control**: Support pitch adjustments (-20 to +20 semitones)
- **Pause Control**: Support custom pause lengths for dramatic effect
- **Volume Control**: Maintain existing volume controls

**API Extensions:**
- Extend voice configuration to include new control parameters
- Add validation for parameter ranges
- Implement parameter inheritance from character defaults
- Support runtime parameter overrides

**Success Criteria:**
- All voice control parameters work within Chirp 3:HD supported ranges
- Parameters integrate seamlessly with existing SSML generation
- Voice controls enhance dramatic reading capabilities

### 5. Multi-Language Support
**Priority: Medium**

**Description:**
Ensure Chirp 3:HD implementation supports the current multi-language requirements while leveraging the model's language capabilities.

**Current Languages:**
- Primary: Traditional Chinese (zh-TW)
- Secondary: Simplified Chinese (zh-CN), English (en-US)
- Potential: Additional languages supported by Chirp 3:HD

**Requirements:**
- Verify Chirp 3:HD support for existing languages
- Update language code mappings for Chirp 3:HD voices
- Maintain backward compatibility with existing language parameters
- Implement proper language-specific voice selection

**Success Criteria:**
- All existing languages work with Chirp 3:HD
- Language switching preserves character voice characteristics
- No regression in language support quality

### 6. Audio Quality and Performance
**Priority: High**

**Description:**
Leverage Chirp 3:HD's high-definition audio capabilities and optimize performance for the tarot reading use case.

**Requirements:**
- **HD Audio Output**: Utilize highest quality audio encoding supported
- **Performance Optimization**: Ensure synthesis speed meets real-time reading requirements
- **File Size Management**: Optimize audio file sizes for web delivery
- **Caching Efficiency**: Update caching strategy for new voice parameters

**Technical Specifications:**
- Target synthesis time: < 2 seconds for typical tarot readings
- Audio format: MP3 or WAV with optimal quality settings
- File size targets: Maintain reasonable sizes for web playback
- Caching hit rate: > 90% for repeated readings

**Success Criteria:**
- Audio quality noticeably improved over WaveNet
- Synthesis performance meets user experience requirements
- File sizes remain manageable for web delivery

### 7. Backward Compatibility
**Priority: Critical**

**Description:**
Ensure the Chirp 3:HD upgrade doesn't break existing functionality or API contracts.

**Requirements:**
- **API Compatibility**: Maintain existing API endpoints and request/response formats
- **Character Mapping**: Preserve all 14 existing character voice configurations
- **Caching Compatibility**: Existing cached audio remains valid where possible
- **Fallback Mechanisms**: Implement graceful degradation if Chirp 3:HD unavailable

**Migration Strategy:**
- Phase 1: Add Chirp 3:HD alongside WaveNet (dual support)
- Phase 2: Gradually migrate characters to Chirp 3:HD voices
- Phase 3: Remove WaveNet support after full testing
- Rollback capability if issues discovered

**Success Criteria:**
- No breaking changes to existing API consumers
- Existing cached audio continues to work
- Smooth migration path with rollback capability

### 8. Caching Strategy Updates
**Priority: Medium**

**Description:**
Update the existing Redis/database caching system to handle Chirp 3:HD voice parameters and ensure efficient cache utilization.

**Current Caching:**
- Redis for fast access (5-minute TTL)
- Database for persistent storage
- Text hash-based cache keys
- Character-specific caching

**Requirements:**
- **Cache Key Updates**: Include voice model version in cache keys
- **Parameter Hashing**: Include pronunciation and voice control parameters in hash
- **Migration Handling**: Handle cache invalidation during voice model transition
- **Performance Monitoring**: Track cache hit rates and synthesis performance

**Success Criteria:**
- Cache hit rates maintained or improved
- No cache pollution from model transition
- Efficient storage utilization

### 9. Testing and Quality Assurance
**Priority: High**

**Description:**
Comprehensive testing to ensure Chirp 3:HD implementation meets quality standards and doesn't introduce regressions.

**Testing Requirements:**
- **Unit Tests**: TTS service methods with Chirp 3:HD parameters
- **Integration Tests**: Full API request/response cycles
- **Audio Quality Tests**: Subjective and objective audio quality assessments
- **Performance Tests**: Synthesis speed and resource utilization
- **Compatibility Tests**: Backward compatibility verification

**Test Characters:**
- All 14 Fallout characters must pass audio synthesis tests
- Sample tarot reading texts in multiple languages
- Edge cases: long texts, special characters, empty inputs

**Success Criteria:**
- All existing tests pass
- New Chirp 3:HD functionality fully tested
- Audio quality approved by stakeholders
- Performance benchmarks met

### 10. Documentation and Monitoring
**Priority: Medium**

**Description:**
Update documentation and add monitoring capabilities for the Chirp 3:HD implementation.

**Requirements:**
- **API Documentation**: Update TTS service documentation for new features
- **Voice Mapping Documentation**: Document character-to-voice mappings and rationale
- **Configuration Guide**: Instructions for voice parameter tuning
- **Monitoring**: Add metrics for synthesis performance and quality

**Monitoring Requirements:**
- Synthesis success/failure rates
- Average synthesis time by character/voice
- Cache hit rates and performance
- Audio file size distributions
- Error rates and types

**Success Criteria:**
- Complete documentation for new features
- Monitoring dashboards show system health
- Troubleshooting guides available

### 11. Deployment and Rollout
**Priority: Medium**

**Description:**
Safe deployment strategy with phased rollout and rollback capabilities.

**Requirements:**
- **Feature Flags**: Ability to enable/disable Chirp 3:HD per character or globally
- **Gradual Rollout**: Percentage-based rollout with monitoring
- **Rollback Plan**: Immediate rollback capability if issues detected
- **Resource Planning**: Ensure sufficient Google Cloud TTS quotas

**Success Criteria:**
- Zero-downtime deployment
- Gradual rollout allows for issue detection
- Quick rollback capability
- Resource usage within planned limits

## Acceptance Criteria

### Functional Requirements
- ✅ All 14 Fallout characters successfully mapped to Chirp 3:HD voices
- ✅ Custom pronunciation support implemented and tested
- ✅ Voice control features (speed, pitch, pauses) working
- ✅ Multi-language support maintained
- ✅ Audio quality improved over WaveNet baseline
- ✅ Backward compatibility preserved

### Non-Functional Requirements
- ✅ Synthesis performance < 2 seconds for typical readings
- ✅ Cache hit rate > 90%
- ✅ API response times maintained
- ✅ No breaking changes to existing contracts
- ✅ Comprehensive test coverage > 95%

### Quality Requirements
- ✅ Audio quality subjectively better than WaveNet
- ✅ Voice personalities preserved and enhanced
- ✅ Error handling robust and user-friendly
- ✅ Documentation complete and accurate
