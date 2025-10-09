# Wasteland Tarot API - Comprehensive Test Guide

## 🎯 Overview

This is a **TEST-FIRST** development test suite for the Wasteland Tarot API - a Fallout-themed tarot card reading system. These tests define exactly how the API should behave and serve as the specification for implementation.

## 🏗️ Test Architecture

### Test Structure
```
backend/tests/
├── conftest.py                         # Shared fixtures and configuration
├── unit/                              # Unit tests for individual components
│   ├── test_wasteland_cards.py        # 78-card Fallout deck system
│   ├── test_character_interpretation.py # 4 character voice styles
│   └── test_karma_system.py           # Karma and faction mechanics
├── integration/                       # API endpoint integration tests
│   ├── test_wasteland_divination.py   # Reading creation and management
│   ├── test_user_management.py        # Wasteland dweller system
│   └── test_holotape_archive.py       # Reading history archive
└── performance/                       # Performance and load tests
    └── test_api_performance.py        # Scalability and optimization
```

## 🧪 Test Categories

### 1. Wasteland Card System Tests
**File**: `tests/unit/test_wasteland_cards.py`

Tests the complete 78-card Fallout-themed tarot deck:

- **Major Arcana (22 cards)**: Fallout characters and themes
  - The Vault Newbie (The Fool)
  - Tech Specialist (The Magician)
  - Wasteland Oracle (High Priestess)
  - Farm Matriarch (Empress)
  - Overseer (Emperor)
  - Brotherhood Elder (Hierophant)
  - And 16 more Fallout-themed major arcana cards

- **Minor Arcana (56 cards)**: 4 Fallout suits × 14 cards each
  - **Nuka-Cola Bottles** (Cups) - Emotions, relationships, healing
  - **Combat Weapons** (Swords) - Conflict, strategy, survival
  - **Bottle Caps** (Pentacles) - Resources, trade, materialism
  - **Radiation Rods** (Wands) - Energy, creativity, mutation

- **Special Features**:
  - Radiation levels affect card draw probability
  - Pip-Boy scan results for each card
  - Fallout humor and lore integration
  - 80s pixel art style imagery
  - Audio cues for immersion

### 2. Wasteland Divination System Tests
**File**: `tests/integration/test_wasteland_divination.py`

Tests the 4 specialized reading spreads:

#### Single Wasteland Reading (1 card)
- Quick daily guidance
- Radiation-influenced shuffle
- Geiger counter audio effects

#### Vault-Tec Spread (3 cards)
- Past (Pre-War) → Present (Current) → Future (Rebuilding)
- Optimistic Vault-Tec interpretation style
- Time progression analysis

#### Wasteland Survival Spread (5 cards)
- Resources → Threats → Allies → Strategy → Outcome
- Survival-focused practical advice
- Risk/reward analysis

#### Brotherhood Council (7 cards)
- Circular council table layout
- Complex decision-making process
- Technical and ethical considerations

### 3. Character Interpretation Engine Tests
**File**: `tests/unit/test_character_interpretation.py`

Tests 4 distinct Fallout character voices:

#### Pip-Boy Analysis
- Systematic, data-driven interpretations
- Green monochrome terminal display
- Technical statistics and probabilities
- Threat level assessments

#### Vault Dweller Perspective
- Naive, optimistic worldview
- Pre-war knowledge applied incorrectly
- Scientific curiosity about wasteland
- Unintentional humor from innocence

#### Wasteland Trader Wisdom
- Practical, business-focused advice
- Risk/reward calculations
- Resource value assessments
- Bottle cap economics

#### Super Mutant Simplicity
- Direct, simple language
- Clear binary logic
- Strength-focused solutions
- Elimination of unnecessary complexity

### 4. Karma System Tests
**File**: `tests/unit/test_karma_system.py`

Tests the moral alignment system:

#### Karma Levels
- **Very Good** (750+ points): Wasteland Savior
- **Good** (250+ points): Righteous Knight
- **Neutral** (-249 to 249): Wasteland Dweller
- **Evil** (-749 to -250): Raider
- **Very Evil** (-1000 to -750): Demon Lord

#### Karma Effects
- Influences card interpretation tone
- Affects upright/reversed card probability
- Unlocks karma-specific achievements
- Impacts faction relationship modifiers

#### Faction Alignment System
- **Vault Dweller**: Technology and science focus
- **Brotherhood of Steel**: Knowledge preservation
- **NCR**: Democratic values and economics
- **Caesar's Legion**: Military order and conquest
- **Raiders**: Anarchism and freedom

### 5. User Management Tests
**File**: `tests/integration/test_user_management.py`

Tests the Wasteland Dweller system:

#### Registration Features
- Pip-Boy style onboarding
- Initial karma selection
- Faction preference setting
- Character voice preference
- Vault assignment and dweller number

#### Pip-Boy Interface
- Terminal-style authentication
- Status display with radiation levels
- Experience and leveling system
- Achievement tracking
- Statistics dashboard

#### Social Features
- Companion/friend system
- Leaderboards and rankings
- Mentorship program
- Community sharing

### 6. Holotape Archive Tests
**File**: `tests/integration/test_holotape_archive.py`

Tests the reading history system:

#### Holotape Creation
- Convert readings to Fallout-style holotapes
- Audio preservation with compression
- Metadata and tagging system
- Encryption for privacy

#### Archive Management
- Search and filtering capabilities
- Playlist creation and organization
- Backup and export functionality
- Analytics and pattern recognition

#### Performance Features
- Large collection handling
- Audio streaming optimization
- Concurrent access support
- Storage efficiency

### 7. Performance Tests
**File**: `tests/performance/test_api_performance.py`

Tests system scalability and optimization:

#### Response Time Tests
- Reading creation < 2 seconds
- Card retrieval < 500ms
- AI interpretation < 5 seconds
- Search operations < 1 second

#### Concurrent Load Tests
- 100 simultaneous users
- 5 requests per user
- Graceful degradation under load
- Memory usage limits

#### Rate Limiting Tests
- Reading request limits
- AI interpretation throttling
- Premium vs free user limits
- Abuse prevention

## 🚀 Running Tests

### Prerequisites
```bash
cd backend
pip install -r requirements-test.txt
```

### Test Execution Options

#### Quick Smoke Tests (Recommended for development)
```bash
python run_tests.py --mode smoke
```

#### Individual Test Categories
```bash
# Unit tests for core components
python run_tests.py --mode unit

# Integration tests for API endpoints
python run_tests.py --mode integration

# Performance and load tests
python run_tests.py --mode performance

# Fallout theme validation
python run_tests.py --mode fallout

# Karma system tests
python run_tests.py --mode karma

# Character voice tests
python run_tests.py --mode voices

# Security tests
python run_tests.py --mode security
```

#### Comprehensive Test Suite
```bash
# Run all test categories with reports
python run_tests.py --mode comprehensive
```

#### CI/CD Pipeline
```bash
# Optimized for continuous integration
python run_tests.py --mode ci
```

### Direct Pytest Execution
```bash
# Run specific test files
pytest tests/unit/test_wasteland_cards.py -v

# Run tests with specific markers
pytest -m "karma_system" -v

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run performance tests only
pytest tests/performance/ -v
```

## 📊 Test Markers

Use markers to run specific test subsets:

```bash
# Core system tests
pytest -m "unit" -v
pytest -m "integration" -v
pytest -m "performance" -v

# Feature-specific tests
pytest -m "fallout_theme" -v
pytest -m "karma_system" -v
pytest -m "character_voices" -v
pytest -m "holotape_archive" -v

# Technical tests
pytest -m "database" -v
pytest -m "redis" -v
pytest -m "ai_service" -v
pytest -m "authentication" -v
pytest -m "rate_limiting" -v
```

## 🔧 Test Configuration

### Environment Variables
```bash
# Test database
TEST_DATABASE_URL=sqlite+aiosqlite:///:memory:

# Test Redis (optional)
TEST_REDIS_URL=redis://localhost:6379/1

# AI service testing
OPENAI_API_KEY=test_key_for_mocking

# Performance thresholds
MAX_RESPONSE_TIME=2.0
MEMORY_LIMIT_MB=100
CONCURRENT_USERS=10
```

### Coverage Requirements
- **Minimum coverage**: 80%
- **Target coverage**: 90%+
- **Critical paths**: 95%+

## 📝 Test Data and Fixtures

### Shared Fixtures (conftest.py)
- **Database session**: Clean test database for each test
- **HTTP client**: Async test client for API endpoints
- **Mock services**: Redis, AI service, audio processing
- **Test users**: Various karma levels and faction alignments
- **Card data**: Complete 78-card Fallout deck
- **Reading data**: Sample readings for all spread types

### Test Data Validation
All test data includes validation helpers:
- `assert_wasteland_card_structure()`: Validates card data format
- `assert_karma_profile_structure()`: Validates karma data
- `assert_reading_structure()`: Validates reading format
- `assert_holotape_structure()`: Validates archive format

## 🎯 Test-Driven Development Flow

### 1. RED Phase (Current State)
✅ **Comprehensive failing tests written** - This test suite defines the complete API behavior

### 2. GREEN Phase (Next Steps)
🔄 **Implement the actual API** to make tests pass:
- Create FastAPI application structure
- Implement data models with SQLAlchemy
- Build API endpoints
- Integrate AI service for interpretations
- Add authentication and security
- Implement caching with Redis

### 3. REFACTOR Phase
🔄 **Optimize and improve** while maintaining test coverage:
- Performance optimization
- Code organization improvements
- Additional error handling
- Enhanced user experience features

## 🚨 Critical Test Success Criteria

### Functional Requirements
- ✅ All 78 Fallout-themed cards properly defined
- ✅ 4 reading spreads work correctly
- ✅ 4 character voices produce distinct interpretations
- ✅ Karma system affects interpretations and mechanics
- ✅ Faction alignment influences user experience
- ✅ Holotape archive preserves reading history

### Performance Requirements
- ✅ API responses < 2 seconds
- ✅ Concurrent user support (100+ users)
- ✅ Memory usage within limits
- ✅ Database queries optimized
- ✅ Rate limiting prevents abuse

### Quality Requirements
- ✅ 80%+ test coverage
- ✅ All security vulnerabilities addressed
- ✅ Fallout theme consistency maintained
- ✅ Audio integration working
- ✅ User experience polished

## 🎮 Fallout Theme Validation

Special attention to Fallout universe consistency:

### Lore Compliance
- Card names and descriptions match Fallout universe
- Character voices reflect authentic game personas
- Karma system mirrors Fallout moral mechanics
- Faction relationships stay true to game lore

### Audio Atmosphere
- Pip-Boy sounds and terminal effects
- Geiger counter shuffle audio
- Vault door opening sounds
- Wasteland ambient atmosphere

### Visual Style
- 80s retro-futuristic aesthetics
- Green monochrome Pip-Boy displays
- Pixel art card imagery
- Vault-Tec corporate styling

## 📈 Continuous Improvement

### Metrics to Monitor
- Test execution time trends
- Coverage percentage over time
- Performance benchmark results
- User feedback incorporation
- Bug detection effectiveness

### Regular Maintenance
- Update test data as features evolve
- Refactor tests for better maintainability
- Add tests for new edge cases discovered
- Optimize slow-running tests
- Keep testing dependencies current

## 🏆 Success Definition

**The test suite succeeds when:**
1. All tests pass consistently
2. Coverage meets requirements (80%+)
3. Performance benchmarks are met
4. Fallout theme authenticity is maintained
5. User experience goals are achieved
6. Security requirements are satisfied

This comprehensive test suite ensures the Wasteland Tarot API delivers an authentic, performant, and engaging Fallout-themed tarot reading experience! 🎮✨