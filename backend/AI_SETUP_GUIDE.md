# AI-Powered Tarot Interpretation - Multi-Provider Setup Guide

## Overview

This guide covers the complete setup and configuration of the AI-powered tarot card interpretation system with support for multiple AI providers.

---

## Supported Providers

The Wasteland Tarot backend now supports **three AI providers**:

1. **OpenAI (GPT-4)** - Recommended default
2. **Google Gemini** - Most cost-effective
3. **Anthropic Claude** - Highest quality

---

## Features

- **Multi-Provider Support**: Choose between OpenAI, Gemini, or Anthropic
- **Automatic Provider Selection**: Falls back to available providers
- **5 Character Voices**: Each with unique Fallout-themed personality
- **Automatic Fallback**: Seamlessly falls back to template-based interpretations
- **Built-in Caching**: Reduces API costs with intelligent response caching
- **Error Handling**: Robust retry logic and timeout protection
- **Cost Optimized**: Token limits and caching to minimize API expenses

---

## Quick Start

### 1. Choose Your Provider

Pick one (or configure multiple for redundancy):

| Provider | Best For | Cost (per 1000 interpretations) |
|----------|----------|----------------------------------|
| **OpenAI GPT-4o** | Balanced quality & cost | ~$4.50 |
| **Gemini 1.5 Pro** | Budget-conscious | ~$2.30 |
| **Anthropic Claude 3.5** | Maximum quality | ~$6.60 |

### 2. Get API Key

**OpenAI:**
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy your key (starts with `sk-`)

**Google Gemini:**
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API key"
4. Copy your key

**Anthropic Claude:**
1. Visit https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### 3. Configure Environment

Add to your `.env` file:

```bash
# AI Multi-Provider Configuration
AI_ENABLED=True
AI_PROVIDER=openai  # Options: openai, gemini, anthropic

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o  # or gpt-4o-mini

# Google Gemini Configuration (if using Gemini)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro  # or gemini-1.5-flash

# Anthropic Configuration (if using Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Common AI Settings
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.8
AI_CACHE_TTL=3600
AI_FALLBACK_TO_TEMPLATE=True
```

### 4. Install Dependencies

Using `uv` (recommended):
```bash
cd backend
source .venv/bin/activate
uv pip install openai google-generativeai anthropic
```

Or sync all dependencies:
```bash
uv sync
```

### 5. Verify Installation

The service will automatically initialize with your configured provider. Check logs:

```
INFO: AI interpretation service initialized: provider=openai, model=gpt-4o, estimated_cost=$0.004500/request
```

---

## Provider-Specific Setup

### OpenAI GPT-4 Setup

**Advantages:**
- Excellent quality-to-cost ratio
- Fast response times
- Reliable API uptime
- Good documentation

**Models:**
- `gpt-4o` (Recommended): Best balance
- `gpt-4o-mini`: Most economical option

**Configuration:**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_ORGANIZATION=  # Optional: Your org ID
```

**Pricing (as of 2024):**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- **~$0.0045 per interpretation**

**Rate Limits (Tier 1):**
- 500 requests/min
- 30K tokens/min

---

### Google Gemini Setup

**Advantages:**
- Most cost-effective
- Fast response times
- Google Cloud integration
- Free tier available

**Models:**
- `gemini-1.5-pro` (Recommended): Best quality
- `gemini-1.5-flash`: Fastest, most economical

**Configuration:**
```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro
```

**Pricing (as of 2024):**
- Input: $1.25 per 1M tokens
- Output: $5.00 per 1M tokens
- **~$0.0023 per interpretation**

**Rate Limits (Free tier):**
- 60 requests/min
- 1M tokens/day

---

### Anthropic Claude Setup

**Advantages:**
- Highest quality outputs
- Best at following complex instructions
- Strong safety features
- Excellent long-form generation

**Models:**
- `claude-3-5-sonnet-20241022` (Recommended): Best balance
- `claude-3-opus-20240229`: Highest quality
- `claude-3-haiku-20240307`: Fastest

**Configuration:**
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**Pricing (as of 2024):**
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens
- **~$0.0066 per interpretation**

**Rate Limits (Tier 1):**
- 50 requests/min
- 40K tokens/min

---

## Multi-Provider Configuration

### Redundancy Setup

Configure multiple providers for automatic failover:

```bash
AI_ENABLED=True
AI_PROVIDER=openai  # Primary provider

# Configure all three
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```

The system will automatically select:
1. Your preferred provider (specified in `AI_PROVIDER`)
2. OpenAI (if no preference and key available)
3. Gemini (if OpenAI unavailable)
4. Anthropic (if others unavailable)

### Cost-Conscious Setup

For minimum costs, use Gemini Flash:

```bash
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-1.5-flash
AI_MAX_TOKENS=300  # Reduce for shorter responses
AI_CACHE_TTL=7200  # Longer cache
```

**Estimated cost:** ~$0.00014 per interpretation

### Quality-First Setup

For maximum quality, use Claude Opus:

```bash
AI_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-3-opus-20240229
AI_MAX_TOKENS=800  # Allow longer responses
AI_TEMPERATURE=0.9  # More creative
```

**Estimated cost:** ~$0.033 per interpretation

---

## Configuration Reference

### Provider Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_ENABLED` | `False` | Enable/disable AI interpretations |
| `AI_PROVIDER` | `openai` | Primary provider (openai, gemini, anthropic) |

### OpenAI Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o` | Model to use |
| `OPENAI_ORGANIZATION` | - | Optional organization ID |

### Gemini Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | - | Google API key |
| `GEMINI_MODEL` | `gemini-1.5-pro` | Model to use |

### Anthropic Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | Anthropic API key |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` | Model to use |

### Common AI Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_MAX_TOKENS` | `500` | Maximum tokens per response |
| `AI_TEMPERATURE` | `0.8` | Creativity level (0.0-1.0) |
| `AI_CACHE_TTL` | `3600` | Cache duration in seconds |
| `AI_FALLBACK_TO_TEMPLATE` | `True` | Use template on AI failure |

---

## Cost Comparison

### Per Interpretation Cost

Based on typical usage (200 input tokens, 400 output tokens):

| Provider | Model | Cost per Interpretation | Cost per 1K |
|----------|-------|------------------------|-------------|
| **Gemini** | 1.5 Flash | $0.00014 | $0.14 |
| **Gemini** | 1.5 Pro | $0.0023 | $2.30 |
| **OpenAI** | GPT-4o Mini | $0.00027 | $0.27 |
| **OpenAI** | GPT-4o | $0.0045 | $4.50 |
| **Anthropic** | Haiku | $0.00055 | $0.55 |
| **Anthropic** | Sonnet 3.5 | $0.0066 | $6.60 |
| **Anthropic** | Opus | $0.033 | $33.00 |

### Monthly Cost Estimates

For 100 users, 5 readings/day (500 readings/day, ~15K/month):

With 60% cache hit rate (6K actual API calls/month):

| Provider | Model | Monthly Cost |
|----------|-------|--------------|
| **Gemini** | Flash | **$0.84** |
| **OpenAI** | GPT-4o Mini | **$1.62** |
| **Gemini** | Pro | **$13.80** |
| **OpenAI** | GPT-4o | **$27.00** |
| **Anthropic** | Sonnet 3.5 | **$39.60** |

---

## Usage Examples

### Basic Usage

```python
from app.services.reading_service import ReadingService

# AI provider is automatically selected based on config
reading_service = ReadingService(db_session)
reading = await reading_service.create_reading({
    "user_id": user_id,
    "question": "What does my future hold?",
    "reading_type": "single_card",
    "character_voice": CharacterVoice.PIP_BOY,
    "num_cards": 1
})
```

### Check Active Provider

```python
from app.services.ai_interpretation_service import AIInterpretationService
from app.config import settings

ai_service = AIInterpretationService(settings)

if ai_service.is_available():
    info = ai_service.get_provider_info()
    print(f"Provider: {info['provider']}")
    print(f"Model: {info['model']}")
    print(f"Cost estimate: ${info['estimated_cost']:.6f}/request")
else:
    print("AI service not available, using fallback")
```

### Direct Provider Usage

```python
interpretation = await ai_service.generate_interpretation(
    card=wasteland_card,
    character_voice=CharacterVoice.VAULT_DWELLER,
    question="Should I trust this stranger?",
    karma=KarmaAlignment.GOOD,
    faction=FactionAlignment.NCR
)
```

---

## Monitoring & Troubleshooting

### Check Provider Status

The service logs provider initialization:

```
# Success
INFO: AI interpretation service initialized: provider=openai, model=gpt-4o, estimated_cost=$0.004500/request

# Failure
WARNING: No AI provider available (no API keys configured)
```

### Common Issues

**Issue: "No AI provider available"**

Solution: Verify at least one API key is configured:
```bash
# Check .env
cat .env | grep -E "OPENAI_API_KEY|GEMINI_API_KEY|ANTHROPIC_API_KEY"
```

**Issue: "Rate limit exceeded"**

Solutions:
1. Increase cache TTL
2. Switch to different provider
3. Upgrade API tier
4. Implement request throttling

**Issue: "Poor quality interpretations"**

Solutions:
1. Try different provider (Anthropic > OpenAI > Gemini for quality)
2. Increase `AI_MAX_TOKENS` to 600-800
3. Adjust `AI_TEMPERATURE` (0.7-0.9 for tarot)
4. Use higher-tier model

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment-specific keys** (dev vs prod)
3. **Rotate keys regularly** (every 90 days)
4. **Monitor for unusual activity**
5. **Set up billing alerts** on provider consoles

---

## Performance Optimization

### Cache Configuration

Longer cache for stable users:
```bash
AI_CACHE_TTL=7200  # 2 hours
```

### Model Selection

For high volume:
```bash
# OpenAI
OPENAI_MODEL=gpt-4o-mini

# Gemini
GEMINI_MODEL=gemini-1.5-flash

# Anthropic
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

### Token Optimization

Reduce for concise interpretations:
```bash
AI_MAX_TOKENS=300
```

---

## Testing

### Verify Provider

```bash
cd backend
source .venv/bin/activate
python -c "
from app.services.ai_interpretation_service import AIInterpretationService
from app.config import settings

service = AIInterpretationService(settings)
if service.is_available():
    info = service.get_provider_info()
    print(f'✓ {info[\"provider\"]} ({info[\"model\"]}) ready')
else:
    print('✗ No provider available')
"
```

### Run Tests

```bash
pytest tests/unit/test_ai_interpretation_service.py -v
```

---

## Deployment Checklist

- [ ] At least one API key obtained
- [ ] `.env` file configured with provider settings
- [ ] Dependencies installed (`uv sync`)
- [ ] Tests passing
- [ ] Logging configured
- [ ] Cost monitoring enabled
- [ ] Rate limiting verified
- [ ] Fallback behavior tested
- [ ] Cache TTL optimized
- [ ] API keys secured (not in version control)

---

## Support Resources

### Provider Documentation
- OpenAI: https://platform.openai.com/docs
- Google Gemini: https://ai.google.dev/docs
- Anthropic: https://docs.anthropic.com/

### API Status Pages
- OpenAI: https://status.openai.com/
- Google: https://status.cloud.google.com/
- Anthropic: https://status.anthropic.com/

---

## Version History

- **v2.0** (2025-01): Multi-provider support added
  - OpenAI GPT-4 integration
  - Google Gemini integration
  - Provider auto-selection
  - Cost comparison tools
- **v1.0** (2025-01): Initial Anthropic-only implementation