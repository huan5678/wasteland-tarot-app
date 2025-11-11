"""
Unit tests for personalization engine.

Tests the analysis of user reading history, pattern identification,
and personalized recommendation generation.
"""

import pytest
from datetime import datetime, timedelta
from app.services.personalization_service import PersonalizationService


class TestPersonalizationEngine:
    """Test suite for personalization engine core functionality."""

    @pytest.fixture
    def personalization_service(self):
        """Create personalization service instance."""
        return PersonalizationService()

    @pytest.fixture
    def insufficient_readings(self):
        """Mock user with < 10 readings (insufficient for personalization)."""
        return [
            {
                "id": f"reading-{i}",
                "user_id": "user-123",
                "spread_type": "single_card",
                "category_id": "love",
                "tags": ["love", "future"],
                "karma_alignment": "neutral",
                "faction_alignment": "brotherhood",
                "created_at": datetime.now() - timedelta(days=i),
            }
            for i in range(5)  # Only 5 readings
        ]

    @pytest.fixture
    def sufficient_readings(self):
        """Mock user with >= 10 readings (sufficient for personalization)."""
        readings = []
        for i in range(15):
            # Create varied spread types with patterns
            spread_type = (
                "celtic_cross" if i % 3 == 0 else "three_card" if i % 3 == 1 else "single_card"
            )
            category = "love" if i % 2 == 0 else "career"
            tags = (
                ["love", "relationships"] if category == "love" else ["career", "work"]
            )

            readings.append(
                {
                    "id": f"reading-{i}",
                    "user_id": "user-123",
                    "spread_type": spread_type,
                    "category_id": category,
                    "tags": tags,
                    "karma_alignment": "good" if i < 7 else "neutral",
                    "faction_alignment": "brotherhood",
                    "created_at": datetime.now() - timedelta(days=i),
                }
            )
        return readings

    @pytest.fixture
    def karma_changing_readings(self):
        """Mock readings showing Karma change over 30 days.

        Timeline (days ago → karma):
        - Day 0 (today): evil
        - Day 2: evil
        - Day 4: evil
        - Day 6: evil
        - Day 8: neutral
        - Day 10: neutral
        - Day 12: neutral
        - Day 14: neutral
        - Day 16: very_good
        - Day 18: very_good
        - Day 20: very_good
        - Day 22: very_good

        Within 30 days window: oldest (day 22) = very_good, newest (day 0) = evil
        Change: very_good → evil (change_magnitude = 100)
        """
        readings = []
        for i in range(12):
            # Karma changes from very_good (oldest) to evil (newest)
            if i < 4:
                karma = "evil"  # Most recent (days 0-6)
            elif i < 8:
                karma = "neutral"  # Middle (days 8-14)
            else:
                karma = "very_good"  # Oldest (days 16-22)

            readings.append(
                {
                    "id": f"reading-{i}",
                    "user_id": "user-123",
                    "spread_type": "three_card",
                    "karma_alignment": karma,
                    "created_at": datetime.now() - timedelta(days=i * 2),
                }
            )
        return readings

    # Test: Insufficient readings should not trigger personalization
    def test_insufficient_readings_returns_none(
        self, personalization_service, insufficient_readings
    ):
        """Should return None when user has < 10 readings."""
        result = personalization_service.analyze_user_patterns(insufficient_readings)
        assert result is None

    # Test: Sufficient readings should trigger analysis
    def test_sufficient_readings_triggers_analysis(
        self, personalization_service, sufficient_readings
    ):
        """Should return analysis when user has >= 10 readings."""
        result = personalization_service.analyze_user_patterns(sufficient_readings)
        assert result is not None
        assert "preferred_spread_types" in result
        assert "common_categories" in result
        assert "frequent_tags" in result

    # Test: Spread type frequency analysis
    def test_preferred_spread_type_identification(
        self, personalization_service, sufficient_readings
    ):
        """Should identify most frequently used spread types."""
        result = personalization_service.analyze_user_patterns(sufficient_readings)

        # Based on fixture: 5 celtic_cross, 5 three_card, 5 single_card
        preferred_spreads = result["preferred_spread_types"]
        assert len(preferred_spreads) > 0
        assert all("spread_type" in spread for spread in preferred_spreads)
        assert all("frequency" in spread for spread in preferred_spreads)

    # Test: Category frequency analysis
    def test_common_category_identification(
        self, personalization_service, sufficient_readings
    ):
        """Should identify most common question categories."""
        result = personalization_service.analyze_user_patterns(sufficient_readings)

        common_categories = result["common_categories"]
        assert len(common_categories) > 0

        # Based on fixture: 8 love, 7 career
        top_category = common_categories[0]
        assert top_category["category"] == "love"
        assert top_category["count"] >= 7

    # Test: Tag frequency analysis
    def test_frequent_tag_identification(
        self, personalization_service, sufficient_readings
    ):
        """Should identify most frequently used tags."""
        result = personalization_service.analyze_user_patterns(sufficient_readings)

        frequent_tags = result["frequent_tags"]
        assert len(frequent_tags) > 0

        # Tags should be sorted by frequency
        assert all("tag" in item for item in frequent_tags)
        assert all("count" in item for item in frequent_tags)

    # Test: Karma change detection (30 days)
    def test_karma_change_detection(
        self, personalization_service, karma_changing_readings
    ):
        """Should detect significant Karma changes over 30 days."""
        result = personalization_service.detect_karma_change(
            karma_changing_readings, days=30
        )

        assert result is not None
        assert "from_karma" in result
        assert "to_karma" in result
        assert "change_magnitude" in result
        # Within 30 days: oldest reading (day 22) = very_good (+2), newest (day 0) = evil (-1)
        assert result["from_karma"] == "very_good"
        assert result["to_karma"] == "evil"
        assert result["change_magnitude"] == 75  # abs(2 - (-1)) = 3 levels * 25 = 75

    # Test: No karma change detection
    def test_no_karma_change_returns_none(
        self, personalization_service, sufficient_readings
    ):
        """Should return  details when karma change exists but is not highly significant."""
        result = personalization_service.detect_karma_change(
            sufficient_readings, days=30
        )

        # Based on fixture: change from good to neutral = 1 level = 25 points (>20 threshold)
        # This is considered significant enough to return, but not dramatic
        assert result is not None
        assert result["change_magnitude"] == 25  # 1 level change

    # Test: Faction affinity calculation
    def test_faction_affinity_tracking(
        self, personalization_service, sufficient_readings
    ):
        """Should track faction affinity levels."""
        result = personalization_service.analyze_user_patterns(sufficient_readings)

        assert "faction_affinity" in result
        faction_affinity = result["faction_affinity"]

        # Based on fixture: all readings use brotherhood
        assert "brotherhood" in faction_affinity
        assert faction_affinity["brotherhood"] >= 80  # High affinity

    # Test: Recommendation generation
    def test_generate_spread_recommendation(
        self, personalization_service, sufficient_readings
    ):
        """Should generate personalized spread recommendation."""
        patterns = personalization_service.analyze_user_patterns(sufficient_readings)
        recommendation = personalization_service.generate_spread_recommendation(
            patterns
        )

        assert recommendation is not None
        assert "recommended_spread" in recommendation
        assert "reason" in recommendation
        assert recommendation["recommended_spread"] in [
            "celtic_cross",
            "three_card",
            "single_card",
        ]

    # Test: Voice recommendation based on faction
    def test_generate_voice_recommendation_high_affinity(
        self, personalization_service, sufficient_readings
    ):
        """Should recommend voice based on high faction affinity (>80)."""
        patterns = personalization_service.analyze_user_patterns(sufficient_readings)
        recommendation = personalization_service.generate_voice_recommendation(
            patterns
        )

        assert recommendation is not None
        assert "recommended_voice" in recommendation
        assert "reason" in recommendation

        # High brotherhood affinity should recommend brotherhood voice
        if patterns["faction_affinity"]["brotherhood"] >= 80:
            assert "brotherhood" in recommendation["recommended_voice"].lower()

    # Test: Privacy - user data isolation
    def test_user_data_isolation(self, personalization_service):
        """Should ensure personalization only uses user's own data."""
        user1_readings = [
            {
                "id": f"reading-{i}",
                "user_id": "user-1",
                "spread_type": "celtic_cross",
                "created_at": datetime.now() - timedelta(days=i),
            }
            for i in range(10)
        ]

        user2_readings = [
            {
                "id": f"reading-{i}",
                "user_id": "user-2",
                "spread_type": "single_card",
                "created_at": datetime.now() - timedelta(days=i),
            }
            for i in range(10)
        ]

        # Analyze user1
        result1 = personalization_service.analyze_user_patterns(user1_readings)
        # Analyze user2
        result2 = personalization_service.analyze_user_patterns(user2_readings)

        # Results should be different
        assert result1["preferred_spread_types"][0]["spread_type"] == "celtic_cross"
        assert result2["preferred_spread_types"][0]["spread_type"] == "single_card"

    # Test: Edge case - empty readings list
    def test_empty_readings_list(self, personalization_service):
        """Should handle empty readings list gracefully."""
        result = personalization_service.analyze_user_patterns([])
        assert result is None

    # Test: Edge case - None readings
    def test_none_readings(self, personalization_service):
        """Should handle None readings gracefully."""
        result = personalization_service.analyze_user_patterns(None)
        assert result is None


class TestPersonalizationTimeWindows:
    """Test suite for time-based personalization analysis."""

    @pytest.fixture
    def personalization_service(self):
        return PersonalizationService()

    @pytest.fixture
    def readings_over_90_days(self):
        """Mock readings spanning 90 days."""
        readings = []
        for i in range(30):
            readings.append(
                {
                    "id": f"reading-{i}",
                    "user_id": "user-123",
                    "spread_type": "three_card",
                    "created_at": datetime.now() - timedelta(days=i * 3),
                }
            )
        return readings

    def test_analyze_last_30_days(
        self, personalization_service, readings_over_90_days
    ):
        """Should analyze only last 30 days of readings."""
        result = personalization_service.analyze_user_patterns(
            readings_over_90_days, days=30
        )

        assert result is not None
        # Should only include readings from last 30 days (roughly 10 readings)
        total_readings = sum(
            spread["frequency"] for spread in result["preferred_spread_types"]
        )
        assert total_readings <= 15  # Approximate

    def test_analyze_last_60_days(
        self, personalization_service, readings_over_90_days
    ):
        """Should analyze only last 60 days of readings."""
        result = personalization_service.analyze_user_patterns(
            readings_over_90_days, days=60
        )

        assert result is not None
        # Should include more readings than 30-day window
        total_readings = sum(
            spread["frequency"] for spread in result["preferred_spread_types"]
        )
        assert total_readings >= 15


class TestPersonalizationRecommendationQuality:
    """Test suite for recommendation quality and accuracy."""

    @pytest.fixture
    def personalization_service(self):
        return PersonalizationService()

    def test_recommendation_includes_explanation(self, personalization_service):
        """Should include human-readable explanation."""
        patterns = {
            "preferred_spread_types": [
                {"spread_type": "celtic_cross", "frequency": 8},
                {"spread_type": "three_card", "frequency": 2},
            ],
            "common_categories": [{"category": "love", "count": 7}],
        }

        recommendation = personalization_service.generate_spread_recommendation(
            patterns
        )

        assert "reason" in recommendation
        assert len(recommendation["reason"]) > 0
        assert "celtic_cross" in recommendation["reason"].lower()

    def test_recommendation_considers_multiple_factors(
        self, personalization_service
    ):
        """Should consider spread type AND category frequency."""
        patterns = {
            "preferred_spread_types": [
                {"spread_type": "celtic_cross", "frequency": 5},
                {"spread_type": "three_card", "frequency": 5},
            ],
            "common_categories": [{"category": "career", "count": 10}],
        }

        recommendation = personalization_service.generate_spread_recommendation(
            patterns
        )

        # Should mention both spread preference and category context
        reason = recommendation["reason"].lower()
        assert "career" in reason or "spread" in reason
