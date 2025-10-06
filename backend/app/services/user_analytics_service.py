"""
User Analytics Service
Business logic for user behavior tracking and analytics
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.models.user_analytics import (
    UserAnalytics,
    AnalyticsEvent,
    ReadingPattern,
    UserRecommendation
)
from app.services.recommendation_engine import RecommendationEngine


class UserAnalyticsService:
    """Service for user behavior analytics and personalization"""

    def __init__(self, db: Session):
        self.db = db

    # ==================== UserAnalytics Operations ====================

    def get_or_create_analytics(self, user_id: str) -> UserAnalytics:
        """Get or create user analytics record"""
        analytics = self.db.query(UserAnalytics).filter(
            UserAnalytics.user_id == user_id
        ).first()

        if not analytics:
            analytics = UserAnalytics(
                user_id=user_id,
                most_drawn_cards=[],
                card_study_time={},
                favorited_cards=[],
                preferred_themes=[],
                reading_times=[],
                device_preferences={}
            )
            self.db.add(analytics)
            self.db.commit()
            self.db.refresh(analytics)

        return analytics

    def update_session_stats(
        self,
        user_id: str,
        session_duration: int,
        device_type: Optional[str] = None
    ) -> UserAnalytics:
        """Update user session statistics"""
        analytics = self.get_or_create_analytics(user_id)

        analytics.session_count += 1
        analytics.total_time_spent += session_duration
        analytics.avg_session_duration = analytics.total_time_spent / analytics.session_count
        analytics.last_session_at = datetime.utcnow()

        # Update device preferences
        if device_type:
            device_prefs = analytics.device_preferences or {}
            device_prefs[device_type] = device_prefs.get(device_type, 0) + 1
            analytics.device_preferences = device_prefs

        self.db.commit()
        self.db.refresh(analytics)

        return analytics

    def update_reading_stats(
        self,
        user_id: str,
        spread_type: str,
        character_voice: str,
        question_length: int,
        card_ids: List[str]
    ) -> UserAnalytics:
        """Update user reading statistics"""
        analytics = self.get_or_create_analytics(user_id)

        analytics.readings_count += 1

        # Update favorite spread type
        analytics.favorite_spread_type = spread_type

        # Update favorite character voice
        analytics.favorite_character_voice = character_voice

        # Update most drawn cards
        most_drawn = analytics.most_drawn_cards or []
        card_counter = Counter(most_drawn + card_ids)
        analytics.most_drawn_cards = [
            card_id for card_id, _ in card_counter.most_common(20)
        ]

        # Record reading time
        current_hour = datetime.utcnow().hour
        reading_times = analytics.reading_times or []
        reading_times.append(current_hour)
        analytics.reading_times = reading_times[-100:]  # Keep last 100 readings

        self.db.commit()
        self.db.refresh(analytics)

        return analytics

    def add_favorited_card(self, user_id: str, card_id: str) -> UserAnalytics:
        """Add card to favorites"""
        analytics = self.get_or_create_analytics(user_id)

        favorited = analytics.favorited_cards or []
        if card_id not in favorited:
            favorited.append(card_id)
            analytics.favorited_cards = favorited

            self.db.commit()
            self.db.refresh(analytics)

        return analytics

    def remove_favorited_card(self, user_id: str, card_id: str) -> UserAnalytics:
        """Remove card from favorites"""
        analytics = self.get_or_create_analytics(user_id)

        favorited = analytics.favorited_cards or []
        if card_id in favorited:
            favorited.remove(card_id)
            analytics.favorited_cards = favorited

            self.db.commit()
            self.db.refresh(analytics)

        return analytics

    def increment_engagement_metric(
        self,
        user_id: str,
        metric_type: str
    ) -> UserAnalytics:
        """Increment engagement metrics (share, note, export)"""
        analytics = self.get_or_create_analytics(user_id)

        if metric_type == "share":
            analytics.shares_count += 1
        elif metric_type == "note":
            analytics.notes_count += 1
        elif metric_type == "export":
            analytics.exports_count += 1

        self.db.commit()
        self.db.refresh(analytics)

        return analytics

    # ==================== Event Tracking ====================

    def track_event(
        self,
        user_id: str,
        event_type: str,
        event_category: str,
        event_action: str,
        event_data: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
        device_type: Optional[str] = None,
        browser: Optional[str] = None,
        platform: Optional[str] = None,
        duration: Optional[int] = None
    ) -> AnalyticsEvent:
        """Track an analytics event"""
        event = AnalyticsEvent(
            user_id=user_id,
            event_type=event_type,
            event_category=event_category,
            event_action=event_action,
            event_data=event_data or {},
            session_id=session_id,
            device_type=device_type,
            browser=browser,
            platform=platform,
            duration=duration
        )

        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        return event

    def get_user_events(
        self,
        user_id: str,
        event_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AnalyticsEvent]:
        """Get user events with optional filters"""
        query = self.db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id
        )

        if event_type:
            query = query.filter(AnalyticsEvent.event_type == event_type)

        if start_date:
            query = query.filter(AnalyticsEvent.timestamp >= start_date)

        if end_date:
            query = query.filter(AnalyticsEvent.timestamp <= end_date)

        events = query.order_by(
            desc(AnalyticsEvent.timestamp)
        ).limit(limit).all()

        return events

    def get_event_statistics(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get event statistics for user"""
        query = self.db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user_id
        )

        if start_date:
            query = query.filter(AnalyticsEvent.timestamp >= start_date)

        if end_date:
            query = query.filter(AnalyticsEvent.timestamp <= end_date)

        events = query.all()

        # Calculate statistics
        event_counts = Counter(e.event_type for e in events)
        category_counts = Counter(e.event_category for e in events)
        action_counts = Counter(e.event_action for e in events)

        return {
            "total_events": len(events),
            "event_type_distribution": dict(event_counts),
            "category_distribution": dict(category_counts),
            "action_distribution": dict(action_counts)
        }

    # ==================== Pattern Analysis ====================

    def analyze_reading_patterns(self, user_id: str) -> List[ReadingPattern]:
        """Analyze user's reading patterns"""
        # Get recent events
        events = self.get_user_events(
            user_id=user_id,
            event_type="reading_created",
            limit=50
        )

        patterns = []

        # Analyze question patterns
        questions = [
            e.event_data.get("question", "")
            for e in events
            if e.event_data.get("question")
        ]

        if questions:
            # Simple keyword analysis
            keywords = Counter()
            for question in questions:
                words = question.lower().split()
                keywords.update(words)

            # Create pattern for common question themes
            common_keywords = keywords.most_common(5)
            if common_keywords:
                pattern = ReadingPattern(
                    user_id=user_id,
                    pattern_type="question_theme",
                    pattern_data={"keywords": dict(common_keywords)},
                    frequency=len(questions),
                    confidence_score=min(len(questions) / 10, 1.0)
                )
                self.db.add(pattern)
                patterns.append(pattern)

        # Analyze card combination patterns
        card_combinations = Counter()
        for event in events:
            cards = event.event_data.get("card_ids", [])
            if len(cards) >= 2:
                # Create combination key
                combo = tuple(sorted(cards[:3]))  # Top 3 cards
                card_combinations[combo] += 1

        # Create patterns for frequent combinations
        for combo, freq in card_combinations.most_common(3):
            if freq >= 3:  # At least 3 occurrences
                pattern = ReadingPattern(
                    user_id=user_id,
                    pattern_type="card_combination",
                    pattern_data={"cards": list(combo), "frequency": freq},
                    frequency=freq,
                    confidence_score=min(freq / 10, 1.0)
                )
                self.db.add(pattern)
                patterns.append(pattern)

        if patterns:
            self.db.commit()
            for p in patterns:
                self.db.refresh(p)

        return patterns

    def get_user_patterns(
        self,
        user_id: str,
        pattern_type: Optional[str] = None
    ) -> List[ReadingPattern]:
        """Get user's reading patterns"""
        query = self.db.query(ReadingPattern).filter(
            ReadingPattern.user_id == user_id
        )

        if pattern_type:
            query = query.filter(ReadingPattern.pattern_type == pattern_type)

        patterns = query.order_by(
            desc(ReadingPattern.confidence_score)
        ).all()

        return patterns

    # ==================== Recommendations ====================

    def generate_recommendations(
        self,
        user_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> List[UserRecommendation]:
        """Generate personalized recommendations using advanced engine"""
        # Initialize recommendation engine
        engine = RecommendationEngine(self.db)

        # Get comprehensive recommendations from engine
        raw_recommendations = engine.generate_comprehensive_recommendations(
            user_id=user_id,
            context=context
        )

        # Convert to UserRecommendation objects and save to database
        recommendations = []

        for rec_data in raw_recommendations:
            rec_type = rec_data["type"]
            data = rec_data["data"]
            priority = rec_data["priority"]

            # Extract confidence score from data
            confidence = data.get("confidence", 0.5)

            # Create UserRecommendation object
            rec = UserRecommendation(
                user_id=user_id,
                recommendation_type=rec_type,
                recommendation_data=data,
                confidence_score=confidence,
                priority=priority
            )

            self.db.add(rec)
            recommendations.append(rec)

        # Commit all recommendations
        if recommendations:
            self.db.commit()
            for r in recommendations:
                self.db.refresh(r)

        return recommendations

    def get_spread_recommendation_for_question(
        self,
        user_id: str,
        question: str
    ) -> Optional[Dict[str, Any]]:
        """Get spread recommendation based on question analysis"""
        engine = RecommendationEngine(self.db)
        return engine.recommend_spread_by_question(user_id, question)

    def get_cards_for_study(
        self,
        user_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get card recommendations for study"""
        engine = RecommendationEngine(self.db)
        return engine.recommend_cards_for_study(user_id, limit)

    def get_interpretation_style_recommendation(
        self,
        user_id: str,
        card_ids: List[str]
    ) -> Dict[str, Any]:
        """Get interpretation style recommendation"""
        engine = RecommendationEngine(self.db)
        return engine.recommend_interpretation_style(user_id, card_ids)

    def get_user_recommendations(
        self,
        user_id: str,
        recommendation_type: Optional[str] = None,
        is_active: bool = True
    ) -> List[UserRecommendation]:
        """Get user recommendations"""
        query = self.db.query(UserRecommendation).filter(
            UserRecommendation.user_id == user_id
        )

        if recommendation_type:
            query = query.filter(
                UserRecommendation.recommendation_type == recommendation_type
            )

        if is_active:
            query = query.filter(UserRecommendation.is_active == True)

        recommendations = query.order_by(
            desc(UserRecommendation.priority),
            desc(UserRecommendation.confidence_score)
        ).all()

        return recommendations

    def mark_recommendation_shown(
        self,
        recommendation_id: str
    ) -> Optional[UserRecommendation]:
        """Mark recommendation as shown"""
        rec = self.db.query(UserRecommendation).filter(
            UserRecommendation.id == recommendation_id
        ).first()

        if rec:
            rec.shown_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(rec)

        return rec

    def accept_recommendation(
        self,
        recommendation_id: str
    ) -> Optional[UserRecommendation]:
        """Accept a recommendation"""
        rec = self.db.query(UserRecommendation).filter(
            UserRecommendation.id == recommendation_id
        ).first()

        if rec:
            rec.accepted_at = datetime.utcnow()
            rec.is_active = False
            self.db.commit()
            self.db.refresh(rec)

        return rec

    def reject_recommendation(
        self,
        recommendation_id: str
    ) -> Optional[UserRecommendation]:
        """Reject a recommendation"""
        rec = self.db.query(UserRecommendation).filter(
            UserRecommendation.id == recommendation_id
        ).first()

        if rec:
            rec.rejected_at = datetime.utcnow()
            rec.is_active = False
            self.db.commit()
            self.db.refresh(rec)

        return rec
