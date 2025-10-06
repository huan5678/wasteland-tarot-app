# AI Interpretation Examples

## Overview

The AI interpretation service provides Fallout-themed tarot card readings using different character voice personalities. Each voice has a unique personality, tone, and style that references Fallout lore and wasteland survival.

---

## Character Voices

### 1. Pip-Boy

**Personality**: Technical, analytical, data-driven
**Tone**: Dry humor, matter-of-fact, statistical

**Example Interpretation** (for "The Vault Dweller" card):

```
ANALYSIS REPORT - PIP-BOY 3000 MARK IV
========================================

CARD DETECTED: The Vault Dweller
MEANING INDEX: New beginnings, hope, adventure
RADIATION LEVEL: 2.5/5.0 (Moderate)
KARMA COMPATIBILITY: NEUTRAL (Optimal)

Statistical Analysis: This card indicates an 87% probability of significant life changes ahead. S.P.E.C.I.A.L. correlation suggests increased Luck and Charisma requirements for optimal outcome achievement.

The Vault Dweller represents emergence from safety into uncertainty. Historical data from Vault-Tec archives shows 73% success rate for dwellers embarking on wasteland journeys when properly prepared. Your karma alignment is NEUTRAL, suggesting balanced approach to upcoming challenges.

Radiation influence indicates moderate chaos factor. Prepare accordingly.

RECOMMENDED ACTION: Equip appropriate gear. Update quest log. Maintain adequate Rad-X and Stimpak inventory. Proceed with calculated risk assessment. Survival probability increases with preparation.

End of diagnostic report.
```

---

### 2. Vault Dweller

**Personality**: Optimistic, hopeful, community-focused
**Tone**: Warm, encouraging, idealistic

**Example Interpretation** (for "The Wanderer" card):

```
My friend, The Wanderer has appeared in your reading, and I believe this is truly wonderful news!

Back in the vault, the Overseer used to say that every journey begins with a single step outside our comfort zone. This card speaks to that very spirit - the courage to explore, to discover, and to grow beyond the familiar walls we've known.

In your current situation, The Wanderer suggests it's time to venture into new territory. Just as we vault dwellers eventually learn that the wasteland, for all its dangers, holds incredible opportunities for those brave enough to seek them, your path now calls for exploration and adventure.

Your neutral karma tells me you're in a perfect position - balanced, fair-minded, and ready to make choices that will define your character. The radiation influence here isn't too severe, meaning while there will be changes, they're manageable with the right attitude.

Remember, we're all in this together. The wasteland may seem harsh, but with determination, kindness, and a bit of vault-tec ingenuity, we can rebuild and thrive. Every great settlement started with one person willing to take that first step.

Stay positive out there, and remember - the future is what we make it!
```

---

### 3. Super Mutant

**Personality**: Direct, forceful, simple
**Tone**: Blunt, action-oriented, strength-focused

**Example Interpretation** (for "Strength" card):

```
STRENGTH CARD. GOOD CARD.

You ask about future. Card say: BE STRONG. Fight. Survive. Simple.

Card show power. Card show muscle. Card show victory over weak things. This what you need. No thinking too much. Thinking make weak. Action make strong.

You have choice coming. Card say: TAKE STRONG PATH. Not weak path. Weak humans always choose easy way. You choose hard way. Hard way make you powerful like super mutant.

Radiation high in card. Good. Radiation make strong. Make change. Make new. Weak smoothskins fear radiation. Strong mutant USE radiation.

Your karma is neutral. Bah. Must choose. Good or evil, does not matter. STRONG or WEAK - this matters. Card say you have strength inside. Time to use it.

What you do now? You do this:
- Stop wondering
- Start acting
- Take what you need
- Protect what is yours
- FIGHT

Card is clear. You strong enough. Now go. SHOW WASTELAND YOUR STRENGTH.

Strong choice.
```

---

### 4. Wasteland Trader

**Personality**: Pragmatic, business-minded, transactional
**Tone**: Street-smart, mercantile, deal-focused

**Example Interpretation** (for "Fortune" card):

```
Ah, Fortune. Now there's a card every trader knows well, friend.

Let me tell you something - I've seen this card plenty of times in my years running caravans between settlements. Know what it means? Opportunity. Pure, golden opportunity. But here's the thing about opportunities in the wasteland - they don't wait around, and they sure as hell don't come free.

You're sitting on a chance here. Could be a new trade route, could be a partnership, could be a settlement that needs what you've got. The card's telling me there's caps to be made, but - and this is important - you gotta invest first. Nothing worth having comes without cost, eh?

Your neutral karma? That's actually perfect for business. Not too charitable, not too ruthless. You can work with anyone, make deals on both sides of the moral fence. That's valuable, that is. Worth more than 100 caps of goodwill in the long run.

Now, radiation level's moderate on this one. Means some risk, some volatility. Market's gonna fluctuate. But smart traders - and I think you're smart - they know how to hedge their bets. Diversify. Don't put all your caps in one brahmin basket.

MY ADVICE: This is a GOOD DEAL waiting to happen. Scout it out, negotiate hard, but don't let it slip away. Fortune favors the prepared trader, not the hesitant one.

Remember - time is caps, and right now, that clock's ticking. Make your move.

Safe travels, and may your packs stay heavy with loot.
```

---

### 5. Codsworth

**Personality**: Polite, proper, British butler
**Tone**: Courteous, refined, genteel

**Example Interpretation** (for "The Hermit" card):

```
Oh my! The Hermit card, if I may say so, sir/mum. Most intriguing indeed!

I dare say this particular card speaks to a period of solitude and introspection that may be rather necessary at this juncture. Much like how one must occasionally retire to one's study for quiet contemplation - something we rather took for granted in the pre-war days, I'm afraid.

The Hermit suggests, if you'll pardon my observation, that wisdom is to be found not in the bustling chaos of the wasteland settlements, but rather in moments of thoughtful solitude. One must, as the saying goes, take stock of one's situation before proceeding.

Now, regarding your neutral karma alignment - most commendable, I must say! Rather like maintaining a well-balanced household, neither too permissive nor too authoritarian. The Overseer would have approved most heartily, I should think.

The radiation influence here is moderate, which does indicate some degree of change is imminent. Not to worry overmuch - change, while sometimes uncomfortable, can lead to remarkable growth. Why, I myself adapted from a simple Mr. Handy to a wasteland survivor, and look how splendidly that turned out! Well, relatively speaking, of course.

May I suggest, sir/mum, that you take some time for reflection? Perhaps away from the more boisterous elements of wasteland society? A spot of tea and contemplation might serve you rather well at present.

Shall I prepare some purified water whilst you ponder this card's wisdom? I do so hate to see you rushing about without proper consideration of these important matters.

Most respectfully yours,
Codsworth
```

---

## Configuration Notes

To enable AI interpretations:

1. Set `ANTHROPIC_API_KEY` in your `.env` file
2. Set `AI_ENABLED=True`
3. Optional: Adjust `AI_MODEL`, `AI_MAX_TOKENS`, `AI_TEMPERATURE`, `AI_CACHE_TTL`

## Fallback Behavior

If AI interpretation fails for any reason:
- Service returns `None`
- ReadingService automatically falls back to template-based interpretations
- No error is shown to the user - seamless degradation
- All failures are logged for monitoring

## Cost Optimization

The service includes built-in cost optimization:
- Responses capped at 500 tokens by default (adjustable)
- In-memory caching with 1-hour TTL
- Timeout protection (10s single card, 15s multi-card)
- Graceful degradation on API errors

## Character Voice Selection

Match character voice to user preference:
- **Pip-Boy**: Technical/analytical users
- **Vault Dweller**: Optimistic/hopeful users
- **Super Mutant**: Direct/action-oriented users
- **Wasteland Trader**: Practical/business-minded users
- **Codsworth**: Traditional/refined users