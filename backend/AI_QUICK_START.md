# AI Interpretation - Quick Start

## 🚀 5-Minute Setup

### 1. Install Dependency
```bash
cd backend
source .venv/bin/activate
uv pip install anthropic
```

### 2. Get API Key
Visit https://console.anthropic.com/ → API Keys → Create Key

### 3. Configure .env
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
AI_ENABLED=True
```

### 4. Test
```bash
python -c "from app.services.ai_interpretation_service import AIInterpretationService; from app.config import settings; print('AI Available:', AIInterpretationService(settings).is_available())"
```

Expected output: `AI Available: True`

---

## 📝 Usage

AI is automatically used in all readings when enabled:

```python
from app.services.reading_service import ReadingService

reading = await reading_service.create_reading({
    "user_id": user_id,
    "question": "What does my future hold?",
    "reading_type": "single_card",
    "character_voice": CharacterVoice.PIP_BOY,
    "num_cards": 1
})
# Automatically uses AI if available, falls back to templates if not
```

---

## 🎭 Character Voices

| Voice | Personality | Example |
|-------|------------|---------|
| **Pip-Boy** | Technical, analytical | "Analysis: 87% probability of success" |
| **Vault Dweller** | Optimistic, hopeful | "Together we can rebuild!" |
| **Super Mutant** | Direct, forceful | "STRENGTH! You do this. Now." |
| **Wasteland Trader** | Pragmatic, business | "This is a good deal, friend" |
| **Codsworth** | Polite, British | "I dare say, quite fortuitous!" |

---

## 💰 Cost

- **Per reading**: ~$0.003 (with caching)
- **100 users/day**: ~$42/month
- **Cost savings**: Use Haiku model for 85% reduction

---

## ⚙️ Configuration

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
AI_ENABLED=True

# Optional (defaults shown)
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.8
AI_CACHE_TTL=3600
```

---

## 🔍 Troubleshooting

**AI not working?**
```bash
# Check if enabled
echo $AI_ENABLED  # Should be "True"

# Check API key
echo $ANTHROPIC_API_KEY | cut -c1-10  # Should start with "sk-ant-"

# Test service
python -c "from app.services.ai_interpretation_service import AIInterpretationService; from app.config import settings; print(AIInterpretationService(settings).is_available())"
```

**Too expensive?**
```bash
# Use cheaper model
AI_MODEL=claude-3-haiku-20240307

# Increase cache time
AI_CACHE_TTL=7200  # 2 hours
```

---

## 📚 Documentation

- **Full Setup**: `AI_SETUP_GUIDE.md`
- **Examples**: `AI_INTERPRETATION_EXAMPLES.md`
- **Summary**: `AI_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Features

- ✅ 5 unique Fallout character voices
- ✅ Automatic fallback to templates
- ✅ Built-in caching (reduces costs)
- ✅ Single & multi-card spreads
- ✅ Karma & faction integration
- ✅ Timeout protection
- ✅ Error handling
- ✅ No user-facing errors

---

## 🎯 Quick Test

```python
import asyncio
from app.services.ai_interpretation_service import AIInterpretationService
from app.models.wasteland_card import CharacterVoice, KarmaAlignment
from app.config import settings
from unittest.mock import Mock

async def test():
    ai = AIInterpretationService(settings)
    if not ai.is_available():
        print("❌ AI not available - check ANTHROPIC_API_KEY")
        return

    card = Mock()
    card.name = "The Vault Dweller"
    card.upright_meaning = "New beginnings"
    card.description = "A figure emerges"
    card.suit = None
    card.radiation_level = 2.0

    result = await ai.generate_interpretation(
        card=card,
        character_voice=CharacterVoice.PIP_BOY,
        question="What does my future hold?",
        karma=KarmaAlignment.NEUTRAL
    )

    if result:
        print("✅ AI working!")
        print(f"\nInterpretation:\n{result[:200]}...")
    else:
        print("⚠️ AI returned None - check logs")

asyncio.run(test())
```

---

That's it! You're ready to use AI-powered interpretations. 🎉