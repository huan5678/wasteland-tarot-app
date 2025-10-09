# AI Streaming Quick Reference

## Quick Start

### 1. Backend Setup
```bash
cd backend
# Ensure AI provider API keys are in .env
echo "OPENAI_API_KEY=your-key" >> .env
uvicorn app.main:app --reload
```

### 2. Frontend Usage
```tsx
import { StreamingInterpretation } from '@/components/readings/StreamingInterpretation';

<StreamingInterpretation
  cardId="the-fool"
  question="What is my future?"
  characterVoice="pip_boy"
  karmaAlignment="neutral"
  enabled={true}
/>
```

### 3. Test
Visit: `http://localhost:3000/test-streaming`

---

## API Endpoints

### Single Card
```bash
POST /api/v1/readings/interpretation/stream
Content-Type: application/json

{
  "card_id": "the-fool",
  "question": "What awaits me?",
  "character_voice": "pip_boy",
  "karma_alignment": "neutral"
}
```

### Multi-Card
```bash
POST /api/v1/readings/interpretation/stream-multi
Content-Type: application/json

{
  "card_ids": ["card1", "card2", "card3"],
  "question": "What is my path?",
  "character_voice": "vault_dweller",
  "spread_type": "three_card"
}
```

---

## Component Props

### StreamingInterpretation
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cardId` | string | required | Card ID to interpret |
| `question` | string | required | User's question |
| `characterVoice` | string | `'pip_boy'` | Character voice |
| `karmaAlignment` | string | `'neutral'` | Karma alignment |
| `factionAlignment` | string\|null | `null` | Faction influence |
| `positionMeaning` | string\|null | `null` | Position in spread |
| `enabled` | boolean | `true` | Enable streaming |
| `charsPerSecond` | number | `40` | Typing speed |
| `onComplete` | function | - | Callback on complete |
| `onError` | function | - | Callback on error |

---

## Hook Usage

### useStreamingText
```tsx
const streaming = useStreamingText({
  url: '/api/v1/readings/interpretation/stream',
  requestBody: { card_id: 'the-fool', question: 'Test' },
  enabled: true,
  charsPerSecond: 40,
});

// State
streaming.text          // Current text
streaming.isStreaming   // Is streaming
streaming.isComplete    // Is complete
streaming.error         // Error if any

// Actions
streaming.skip()        // Skip to full text
streaming.reset()       // Reset state
```

---

## Character Voices

| Value | Name | Personality |
|-------|------|-------------|
| `pip_boy` | Pip-Boy 3000 | Technical, analytical |
| `vault_dweller` | Vault Dweller | Optimistic, hopeful |
| `super_mutant` | Super Mutant | Direct, forceful |
| `wasteland_trader` | Wasteland Trader | Pragmatic, business-minded |
| `codsworth` | Codsworth | Polite, British butler |

---

## Karma Alignments

| Value | Description |
|-------|-------------|
| `good` | Good karma |
| `neutral` | Neutral karma |
| `evil` | Evil karma |

---

## Spread Types

| Value | Description |
|-------|-------------|
| `three_card` | Past, Present, Future |
| `celtic_cross` | 10-card comprehensive |
| `relationship` | You, Them, Relationship |
| `decision` | Options and outcomes |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success (streaming) |
| 404 | Card not found |
| 503 | AI service unavailable |
| 500 | Internal error |

---

## SSE Format

```
data: Text chunk here
data: Another chunk
data: [DONE]
```

Error format:
```
data: [ERROR] Error message here
```

---

## Testing Commands

### Backend Tests
```bash
# Unit tests
pytest backend/tests/unit/test_streaming.py -v

# Integration tests
pytest backend/tests/integration/test_streaming_api.py -v

# All streaming tests
pytest backend/tests/ -k streaming -v
```

### Frontend Tests
```bash
# Hook tests
bun test useStreamingText.test.ts

# All tests
bun test
```

---

## Configuration

### Backend (.env)
```bash
AI_ENABLED=true
AI_PROVIDER=openai
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.8
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

### Frontend
```tsx
// Custom stream speed
<StreamingInterpretation
  charsPerSecond={60}  // 10-100 range
  {...otherProps}
/>

// Custom API URL
const streaming = useStreamingText({
  url: 'https://api.example.com/stream',
  ...
});
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First chunk | <200ms |
| Typing speed | 30-50 chars/sec |
| Skip time | <100ms |
| Memory overhead | <10MB |

---

## Troubleshooting

### Issue: No streaming
**Check**:
1. AI provider API key set?
2. Backend running?
3. CORS enabled?

### Issue: Slow streaming
**Fix**:
- Increase `charsPerSecond`
- Switch to Gemini Flash
- Check network latency

### Issue: Errors
**Debug**:
1. Check browser console
2. Check backend logs
3. Verify API keys
4. Test with curl

---

## Curl Examples

### Test Single Card
```bash
curl -X POST http://localhost:8000/api/v1/readings/interpretation/stream \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": "the-fool",
    "question": "Test",
    "character_voice": "pip_boy",
    "karma_alignment": "neutral"
  }'
```

### Test Multi-Card
```bash
curl -X POST http://localhost:8000/api/v1/readings/interpretation/stream-multi \
  -H "Content-Type: application/json" \
  -d '{
    "card_ids": ["the-fool", "the-magician"],
    "question": "Test",
    "character_voice": "pip_boy",
    "spread_type": "three_card"
  }'
```

---

## Cost Estimates (per 1000 requests)

| Provider | Cost |
|----------|------|
| OpenAI GPT-4o | $4.50 |
| Anthropic Claude | $6.60 |
| Gemini Pro | $2.25 |
| Gemini Flash | $0.14 |

---

## Browser Support

✅ Chrome 84+
✅ Firefox 79+
✅ Safari 14+
✅ Edge 84+
✅ Opera 70+

---

## Links

- **Test Page**: `/test-streaming`
- **API Docs**: `/docs` (Swagger UI)
- **Full Guide**: `docs/STREAMING_IMPLEMENTATION.md`
- **Summary**: `STREAMING_FEATURE_SUMMARY.md`

---

## Support

Issues? Check:
1. Test page works?
2. Backend logs?
3. Browser console?
4. API keys valid?

---

## Example Integration

```tsx
'use client';

import { useState } from 'react';
import { StreamingInterpretation } from '@/components/readings/StreamingInterpretation';

export default function ReadingPage() {
  const [isRevealing, setIsRevealing] = useState(false);
  const [interpretation, setInterpretation] = useState('');

  return (
    <div>
      <button onClick={() => setIsRevealing(true)}>
        Reveal Card Meaning
      </button>

      {isRevealing && (
        <StreamingInterpretation
          cardId="the-fool"
          question="What is my destiny?"
          characterVoice="pip_boy"
          karmaAlignment="neutral"
          enabled={true}
          charsPerSecond={40}
          onComplete={(text) => {
            setInterpretation(text);
            setIsRevealing(false);
          }}
        />
      )}

      {interpretation && !isRevealing && (
        <div className="final-interpretation">
          {interpretation}
        </div>
      )}
    </div>
  );
}
```

---

**Ready to stream? Visit `/test-streaming` to get started!**