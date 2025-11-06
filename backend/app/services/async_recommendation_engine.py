"""
Async Enhanced Recommendation Engine
Advanced algorithms for personalized recommendations (Async version)
P2.4: 轉換同步 RecommendationEngine 為異步版本以支援 AsyncUserAnalyticsService
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import Counter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_
from sqlalchemy.orm import selectinload

from app.models.user_analytics import (
    UserAnalytics,
    AnalyticsEvent,
    ReadingPattern,
    UserRecommendation
)


class AsyncRecommendationEngine:
    """Advanced async recommendation engine with multiple strategies"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Spread Recommendations ====================

    async def recommend_spread_by_question(
        self,
        user_id: str,
        question: str
    ) -> Optional[Dict[str, Any]]:
        """Recommend spread based on question analysis (Pure logic, no DB)"""
        # Analyze question keywords
        question_lower = question.lower()

        # Question type detection
        if any(word in question_lower for word in ['love', 'relationship', 'partner', '愛情', '感情', '關係']):
            return {
                "spread_type": "relationship_spread",
                "reason": "Your question is about relationships",
                "confidence": 0.85
            }

        if any(word in question_lower for word in ['career', 'job', 'work', '事業', '工作', '職業']):
            return {
                "spread_type": "celtic_cross",
                "reason": "Complex career questions benefit from detailed spreads",
                "confidence": 0.8
            }

        if any(word in question_lower for word in ['future', 'will', 'when', '未來', '什麼時候']):
            return {
                "spread_type": "three_card",
                "reason": "Past-Present-Future spread for timeline questions",
                "confidence": 0.75
            }

        if len(question.split()) <= 5:
            return {
                "spread_type": "single",
                "reason": "Simple questions work well with single card",
                "confidence": 0.7
            }

        return {
            "spread_type": "three_card",
            "reason": "Balanced spread for general questions",
            "confidence": 0.6
        }

    async def recommend_spread_by_history(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Recommend spreads based on user history (Async DB queries)"""
        # Async query for UserAnalytics
        result = await self.db.execute(
            select(UserAnalytics).where(UserAnalytics.user_id == user_id)
        )
        analytics = result.scalar_one_or_none()

        if not analytics:
            return []

        recommendations = []

        # Recommend favorite spread
        if analytics.favorite_spread_type:
            recommendations.append({
                "spread_type": analytics.favorite_spread_type,
                "reason": "Your most used spread",
                "confidence": 0.9
            })

        # Get spread usage from events
        events_result = await self.db.execute(
            select(AnalyticsEvent)
            .where(
                and_(
                    AnalyticsEvent.user_id == user_id,
                    AnalyticsEvent.event_type == "reading_created"
                )
            )
            .order_by(desc(AnalyticsEvent.timestamp))
            .limit(50)
        )
        events = events_result.scalars().all()

        spread_counter = Counter()
        for event in events:
            spread = event.event_data.get("spread_type")
            if spread:
                spread_counter[spread] += 1

        # Recommend variety (spreads not used recently)
        all_spreads = ["single", "three_card", "celtic_cross", "horseshoe"]
        recent_spreads = set(spread_counter.keys())
        unused_spreads = set(all_spreads) - recent_spreads

        for spread in unused_spreads:
            recommendations.append({
                "spread_type": spread,
                "reason": "Try something new!",
                "confidence": 0.5
            })

        return recommendations[:3]

    async def recommend_spread_by_time_pattern(
        self,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Recommend spread based on time patterns (Async DB queries)"""
        current_hour = datetime.utcnow().hour

        # Get user's readings at similar times
        events_result = await self.db.execute(
            select(AnalyticsEvent).where(
                and_(
                    AnalyticsEvent.user_id == user_id,
                    AnalyticsEvent.event_type == "reading_created"
                )
            )
        )
        events = events_result.scalars().all()

        # Filter events in similar time window (±2 hours)
        similar_time_events = [
            e for e in events
            if abs(e.timestamp.hour - current_hour) <= 2
        ]

        if not similar_time_events:
            return None

        # Find most common spread at this time
        spread_counter = Counter()
        for event in similar_time_events:
            spread = event.event_data.get("spread_type")
            if spread:
                spread_counter[spread] += 1

        if spread_counter:
            most_common = spread_counter.most_common(1)[0]
            return {
                "spread_type": most_common[0],
                "reason": f"You usually use this spread around {current_hour}:00",
                "confidence": min(most_common[1] / len(similar_time_events), 0.9)
            }

        return None

    # ==================== Card Recommendations ====================

    async def recommend_cards_for_exploration(
        self,
        user_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Recommend new cards to explore (Async DB queries)"""
        result = await self.db.execute(
            select(UserAnalytics).where(UserAnalytics.user_id == user_id)
        )
        analytics = result.scalar_one_or_none()

        if not analytics:
            return []

        # Find cards user hasn't drawn much
        most_drawn = set(analytics.most_drawn_cards or [])

        # All major arcana (22 cards) and some minor arcana
        all_cards = [f"major-{i}" for i in range(22)]
        unexplored = [c for c in all_cards if c not in most_drawn]

        return [
            {
                "card_id": card_id,
                "reason": "Expand your tarot knowledge",
                "confidence": 0.6
            }
            for card_id in unexplored[:limit]
        ]

    # ==================== Interpretation Recommendations ====================

    async def recommend_interpretation_style(
        self,
        user_id: str,
        card_ids: List[str]
    ) -> Dict[str, Any]:
        """Recommend interpretation approach (Async DB queries)"""
        result = await self.db.execute(
            select(UserAnalytics).where(UserAnalytics.user_id == user_id)
        )
        analytics = result.scalar_one_or_none()

        # Default to balanced interpretation
        style = {
            "style": "balanced",
            "depth": "medium",
            "focus": "general"
        }

        if not analytics:
            return style

        # Analyze user preferences
        if analytics.readings_count > 50:
            style["depth"] = "deep"
            style["focus"] = "nuanced"
        elif analytics.readings_count > 20:
            style["depth"] = "medium"
        else:
            style["depth"] = "simple"

        # Adjust based on favorite voice
        if analytics.favorite_character_voice:
            if analytics.favorite_character_voice in ["mysterious", "mystical"]:
                style["style"] = "mystical"
            elif analytics.favorite_character_voice in ["practical", "direct"]:
                style["style"] = "practical"

        return style

    # ==================== Timing Recommendations ====================

    async def recommend_reading_time(
        self,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Recommend optimal time for next reading (Async DB queries)"""
        result = await self.db.execute(
            select(UserAnalytics).where(UserAnalytics.user_id == user_id)
        )
        analytics = result.scalar_one_or_none()

        if not analytics or not analytics.reading_times:
            return None

        # Analyze reading time patterns
        hour_counter = Counter(analytics.reading_times)
        most_common_hours = hour_counter.most_common(3)

        current_hour = datetime.utcnow().hour

        # Find next optimal time
        for hour, count in most_common_hours:
            if hour > current_hour:
                return {
                    "hour": hour,
                    "reason": f"You're usually most focused at {hour}:00",
                    "confidence": min(count / len(analytics.reading_times), 0.9)
                }

        # If all optimal times have passed, recommend tomorrow
        next_hour = most_common_hours[0][0]
        return {
            "hour": next_hour,
            "reason": f"Your best time is usually {next_hour}:00",
            "confidence": 0.7
        }

    # ==================== Pattern-Based Recommendations ====================

    async def recommend_by_patterns(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Generate recommendations based on identified patterns (Async DB queries)"""
        patterns_result = await self.db.execute(
            select(ReadingPattern)
            .where(ReadingPattern.user_id == user_id)
            .order_by(desc(ReadingPattern.confidence_score))
            .limit(5)
        )
        patterns = patterns_result.scalars().all()

        recommendations = []

        for pattern in patterns:
            if pattern.pattern_type == "question_theme":
                keywords = pattern.pattern_data.get("keywords", {})
                top_keyword = max(keywords.items(), key=lambda x: x[1])[0] if keywords else None

                if top_keyword:
                    recommendations.append({
                        "type": "question_guidance",
                        "content": f"You often ask about {top_keyword}",
                        "suggestion": "Consider exploring deeper aspects of this theme",
                        "confidence": pattern.confidence_score
                    })

            elif pattern.pattern_type == "card_combination":
                cards = pattern.pattern_data.get("cards", [])
                if len(cards) >= 2:
                    recommendations.append({
                        "type": "card_study",
                        "content": f"Cards {', '.join(cards[:2])} often appear together",
                        "suggestion": "Study the relationship between these cards",
                        "confidence": pattern.confidence_score
                    })

        return recommendations

    # ==================== Comprehensive Recommendation Generation ====================

    async def generate_comprehensive_recommendations(
        self,
        user_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Generate all types of recommendations (Async orchestration)"""
        all_recommendations = []

        # Spread recommendations
        spread_history = await self.recommend_spread_by_history(user_id)
        for rec in spread_history[:2]:
            all_recommendations.append({
                "type": "spread",
                "data": rec,
                "priority": 1 if rec["confidence"] > 0.8 else 2
            })

        # Time-based spread recommendation
        spread_time = await self.recommend_spread_by_time_pattern(user_id)
        if spread_time:
            all_recommendations.append({
                "type": "spread",
                "data": spread_time,
                "priority": 2
            })

        # Timing recommendations
        timing = await self.recommend_reading_time(user_id)
        if timing:
            all_recommendations.append({
                "type": "timing",
                "data": timing,
                "priority": 3
            })

        # Pattern-based recommendations
        pattern_recs = await self.recommend_by_patterns(user_id)
        for rec in pattern_recs[:2]:
            all_recommendations.append({
                "type": "insight",
                "data": rec,
                "priority": 2
            })

        # Sort by priority and confidence
        all_recommendations.sort(
            key=lambda x: (x["priority"], -x["data"].get("confidence", 0.5))
        )

        return all_recommendations[:10]
