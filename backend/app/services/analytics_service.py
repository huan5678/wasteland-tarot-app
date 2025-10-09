"""
Reading Analytics Service
Business logic for reading analytics and statistics
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import Counter
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reading_enhanced import ReadingSession as ReadingSessionModel


class AnalyticsService:
    """Service for reading analytics and statistics"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_basic_statistics(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get basic reading statistics"""
        # Build base query
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.user_id == user_id
        )

        if start_date:
            query = query.where(ReadingSessionModel.created_at >= start_date)
        if end_date:
            query = query.where(ReadingSessionModel.created_at <= end_date)

        result = await self.db.execute(query)
        readings = result.scalars().all()

        # Calculate statistics
        total_readings = len(readings)

        # Week and month counts
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        readings_this_week = sum(1 for r in readings if r.created_at >= week_ago)
        readings_this_month = sum(1 for r in readings if r.created_at >= month_ago)

        # Average satisfaction
        satisfaction_ratings = [r.satisfaction_rating for r in readings if r.satisfaction_rating]
        average_satisfaction = sum(satisfaction_ratings) / len(satisfaction_ratings) if satisfaction_ratings else None

        # Favorite spread and voice
        spreads = [r.spread_type for r in readings if r.spread_type]
        voices = [r.character_voice for r in readings if r.character_voice]

        favorite_spread = Counter(spreads).most_common(1)[0][0] if spreads else None
        favorite_character_voice = Counter(voices).most_common(1)[0][0] if voices else None

        return {
            "total_readings": total_readings,
            "readings_this_week": readings_this_week,
            "readings_this_month": readings_this_month,
            "average_satisfaction": average_satisfaction,
            "favorite_spread": favorite_spread,
            "favorite_character_voice": favorite_character_voice
        }

    async def get_frequency_analysis(
        self,
        user_id: str,
        period: str = "30d"
    ) -> Dict[str, Any]:
        """Get reading frequency over time"""
        # Parse period
        days = int(period.rstrip('d'))
        start_date = datetime.utcnow() - timedelta(days=days)

        query = select(ReadingSessionModel).where(
            and_(
                ReadingSessionModel.user_id == user_id,
                ReadingSessionModel.created_at >= start_date
            )
        ).order_by(ReadingSessionModel.created_at)

        result = await self.db.execute(query)
        readings = result.scalars().all()

        # Group by date
        date_counts: Dict[str, int] = {}
        for reading in readings:
            date_str = reading.created_at.date().isoformat()
            date_counts[date_str] = date_counts.get(date_str, 0) + 1

        # Create data points
        data_points = [
            {"date": date, "count": count}
            for date, count in sorted(date_counts.items())
        ]

        return {
            "period": period,
            "data_points": data_points
        }

    async def get_spread_usage(self, user_id: str) -> Dict[str, Any]:
        """Get spread type usage statistics"""
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.user_id == user_id
        )

        result = await self.db.execute(query)
        readings = result.scalars().all()

        spread_usage = Counter(r.spread_type for r in readings if r.spread_type)

        return {
            "spread_usage": dict(spread_usage)
        }

    async def get_voice_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get character voice preferences"""
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.user_id == user_id
        )

        result = await self.db.execute(query)
        readings = result.scalars().all()

        voice_usage = Counter(r.character_voice for r in readings if r.character_voice)
        favorite_voice = voice_usage.most_common(1)[0][0] if voice_usage else None

        return {
            "voice_usage": dict(voice_usage),
            "favorite_voice": favorite_voice
        }

    async def get_karma_distribution(self, user_id: str) -> Dict[str, Any]:
        """Get karma context distribution"""
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.user_id == user_id
        )

        result = await self.db.execute(query)
        readings = result.scalars().all()

        karma_distribution = Counter(r.karma_context for r in readings if r.karma_context)

        return {
            "karma_distribution": dict(karma_distribution)
        }

    async def get_satisfaction_trends(
        self,
        user_id: str,
        period: str = "30d"
    ) -> Dict[str, Any]:
        """Get satisfaction rating trends"""
        days = int(period.rstrip('d'))
        start_date = datetime.utcnow() - timedelta(days=days)

        query = select(ReadingSessionModel).where(
            and_(
                ReadingSessionModel.user_id == user_id,
                ReadingSessionModel.created_at >= start_date,
                ReadingSessionModel.satisfaction_rating.isnot(None)
            )
        ).order_by(ReadingSessionModel.created_at)

        result = await self.db.execute(query)
        readings = result.scalars().all()

        # Calculate average
        ratings = [r.satisfaction_rating for r in readings]
        average_rating = sum(ratings) / len(ratings) if ratings else None

        # Calculate trend (simple: compare first half vs second half)
        if len(ratings) >= 4:
            mid = len(ratings) // 2
            first_half_avg = sum(ratings[:mid]) / mid
            second_half_avg = sum(ratings[mid:]) / (len(ratings) - mid)

            if second_half_avg > first_half_avg + 0.3:
                trend = "increasing"
            elif second_half_avg < first_half_avg - 0.3:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # Rating distribution
        rating_distribution = dict(Counter(ratings))

        return {
            "average_rating": average_rating,
            "trend": trend,
            "rating_distribution": rating_distribution
        }

    async def get_reading_patterns(self, user_id: str) -> Dict[str, Any]:
        """Get reading pattern analysis"""
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.user_id == user_id
        ).order_by(ReadingSessionModel.created_at)

        result = await self.db.execute(query)
        readings = result.scalars().all()

        if not readings:
            return {
                "most_active_day": None,
                "most_active_hour": None,
                "average_readings_per_week": 0.0,
                "streak_days": 0
            }

        # Most active day of week
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        days = [r.created_at.weekday() for r in readings]
        most_active_day_num = Counter(days).most_common(1)[0][0] if days else 0
        most_active_day = day_names[most_active_day_num]

        # Most active hour
        hours = [r.created_at.hour for r in readings]
        most_active_hour = Counter(hours).most_common(1)[0][0] if hours else None

        # Average readings per week
        if len(readings) > 1:
            days_span = (readings[-1].created_at - readings[0].created_at).days
            weeks_span = max(days_span / 7, 1)
            average_readings_per_week = len(readings) / weeks_span
        else:
            average_readings_per_week = 0.0

        # Streak days (consecutive days with readings)
        dates = sorted(set(r.created_at.date() for r in readings))
        streak_days = 1
        max_streak = 1

        for i in range(1, len(dates)):
            if (dates[i] - dates[i-1]).days == 1:
                streak_days += 1
                max_streak = max(max_streak, streak_days)
            else:
                streak_days = 1

        return {
            "most_active_day": most_active_day,
            "most_active_hour": most_active_hour,
            "average_readings_per_week": round(average_readings_per_week, 2),
            "streak_days": max_streak
        }

    async def get_card_frequency(
        self,
        user_id: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get most drawn cards"""
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.user_id == user_id
        )

        result = await self.db.execute(query)
        readings = result.scalars().all()

        # Extract all cards
        all_cards = []
        for reading in readings:
            if reading.cards_drawn:
                for card in reading.cards_drawn:
                    if isinstance(card, dict) and "card_id" in card:
                        all_cards.append(card["card_id"])

        # Count and calculate percentages
        card_counts = Counter(all_cards)
        total_cards = len(all_cards)

        most_drawn_cards = [
            {
                "card_id": card_id,
                "count": count,
                "percentage": round((count / total_cards) * 100, 2) if total_cards > 0 else 0.0
            }
            for card_id, count in card_counts.most_common(limit)
        ]

        return {
            "most_drawn_cards": most_drawn_cards
        }

    async def compare_time_periods(
        self,
        user_id: str,
        period1: str,
        period2: str
    ) -> Dict[str, Any]:
        """Compare analytics across two time periods"""
        # Parse periods
        if period1.endswith('d'):
            days1 = int(period1.rstrip('d'))
            end1 = datetime.utcnow()
            start1 = end1 - timedelta(days=days1)
        else:
            raise ValueError("Invalid period format")

        if period2 == f"previous_{period1}":
            days2 = days1
            start2 = start1 - timedelta(days=days2)
            end2 = start1
        else:
            raise ValueError("Invalid period2 format")

        # Get data for both periods
        async def get_period_data(start: datetime, end: datetime) -> Dict[str, Any]:
            query = select(ReadingSessionModel).where(
                and_(
                    ReadingSessionModel.user_id == user_id,
                    ReadingSessionModel.created_at >= start,
                    ReadingSessionModel.created_at < end
                )
            )
            result = await self.db.execute(query)
            readings = result.scalars().all()

            ratings = [r.satisfaction_rating for r in readings if r.satisfaction_rating]
            avg_satisfaction = sum(ratings) / len(ratings) if ratings else None

            return {
                "reading_count": len(readings),
                "average_satisfaction": avg_satisfaction
            }

        period1_data = await get_period_data(start1, end1)
        period2_data = await get_period_data(start2, end2)

        # Calculate changes
        changes = {}

        # Reading count change
        if period2_data["reading_count"] == 0:
            changes["reading_count_change"] = "increase" if period1_data["reading_count"] > 0 else "stable"
        elif period1_data["reading_count"] > period2_data["reading_count"]:
            changes["reading_count_change"] = "increase"
        elif period1_data["reading_count"] < period2_data["reading_count"]:
            changes["reading_count_change"] = "decrease"
        else:
            changes["reading_count_change"] = "stable"

        # Satisfaction change
        if period1_data["average_satisfaction"] is None or period2_data["average_satisfaction"] is None:
            changes["satisfaction_change"] = "stable"
        elif period1_data["average_satisfaction"] > period2_data["average_satisfaction"]:
            changes["satisfaction_change"] = "increase"
        elif period1_data["average_satisfaction"] < period2_data["average_satisfaction"]:
            changes["satisfaction_change"] = "decrease"
        else:
            changes["satisfaction_change"] = "stable"

        return {
            "period1": period1_data,
            "period2": period2_data,
            "changes": changes
        }

    async def export_analytics_data(self, user_id: str) -> Dict[str, Any]:
        """Export complete analytics data"""
        statistics = await self.get_basic_statistics(user_id)
        trends = await self.get_satisfaction_trends(user_id)
        patterns = await self.get_reading_patterns(user_id)

        return {
            "statistics": statistics,
            "trends": trends,
            "patterns": patterns
        }
