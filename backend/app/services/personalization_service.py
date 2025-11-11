"""
Personalization Service

Analyzes user reading history to identify patterns and generate
personalized recommendations for spreads, voices, and reading styles.

Privacy-first design: All analysis is performed on individual user data only.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from collections import Counter


class PersonalizationService:
    """Service for analyzing user patterns and generating personalized recommendations."""

    MINIMUM_READINGS_THRESHOLD = 10
    SIGNIFICANT_KARMA_CHANGE = 20
    HIGH_FACTION_AFFINITY_THRESHOLD = 80

    # Karma level mappings for change calculation
    KARMA_LEVELS = {
        "very_evil": -2,
        "evil": -1,
        "neutral": 0,
        "good": 1,
        "very_good": 2,
    }

    def analyze_user_patterns(
        self, readings: Optional[List[Dict[str, Any]]], days: int = 90
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze user reading history to identify patterns.

        Args:
            readings: List of user's reading records
            days: Number of days to analyze (default: 90)

        Returns:
            Dictionary containing pattern analysis or None if insufficient data

        Privacy: Only analyzes data for the specific user
        """
        # Handle edge cases
        if readings is None or len(readings) == 0:
            return None

        # Enforce minimum threshold
        if len(readings) < self.MINIMUM_READINGS_THRESHOLD:
            return None

        # Filter readings within time window
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_readings = [
            r
            for r in readings
            if r.get("created_at") and r["created_at"] >= cutoff_date
        ]

        # Check threshold again after filtering
        if len(filtered_readings) < self.MINIMUM_READINGS_THRESHOLD:
            return None

        # Perform pattern analysis
        patterns = {
            "preferred_spread_types": self._analyze_spread_types(filtered_readings),
            "common_categories": self._analyze_categories(filtered_readings),
            "frequent_tags": self._analyze_tags(filtered_readings),
            "faction_affinity": self._analyze_faction_affinity(filtered_readings),
            "total_readings": len(filtered_readings),
            "analysis_period_days": days,
        }

        return patterns

    def _analyze_spread_types(
        self, readings: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Analyze spread type frequency."""
        spread_counter = Counter(r.get("spread_type") for r in readings if r.get("spread_type"))

        results = [
            {"spread_type": spread, "frequency": count}
            for spread, count in spread_counter.most_common()
        ]

        return results

    def _analyze_categories(
        self, readings: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Analyze category frequency."""
        category_counter = Counter(
            r.get("category_id") for r in readings if r.get("category_id")
        )

        results = [
            {"category": category, "count": count}
            for category, count in category_counter.most_common()
        ]

        return results

    def _analyze_tags(self, readings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze tag frequency."""
        tag_list = []
        for reading in readings:
            tags = reading.get("tags", [])
            if isinstance(tags, list):
                tag_list.extend(tags)

        tag_counter = Counter(tag_list)

        results = [
            {"tag": tag, "count": count} for tag, count in tag_counter.most_common(10)
        ]

        return results

    def _analyze_faction_affinity(
        self, readings: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """
        Calculate faction affinity levels (0-100 scale).

        Affinity is calculated as: (faction_readings / total_readings) * 100
        """
        faction_counter = Counter(
            r.get("faction_alignment")
            for r in readings
            if r.get("faction_alignment")
        )

        total_readings = len(readings)
        affinity = {}

        for faction, count in faction_counter.items():
            affinity[faction] = int((count / total_readings) * 100)

        return affinity

    def detect_karma_change(
        self, readings: List[Dict[str, Any]], days: int = 30
    ) -> Optional[Dict[str, Any]]:
        """
        Detect significant Karma changes over specified time period.

        Args:
            readings: List of user's reading records
            days: Number of days to analyze (default: 30)

        Returns:
            Dictionary with karma change details or None if no significant change
        """
        if not readings or len(readings) < 2:
            return None

        # Filter readings with karma alignment
        karma_readings = [
            r for r in readings if r.get("karma_alignment") and r.get("created_at")
        ]

        if len(karma_readings) < 2:
            return None

        # Sort by date (oldest first)
        sorted_readings = sorted(karma_readings, key=lambda x: x["created_at"])

        # Filter within time window AFTER sorting
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_readings = [r for r in sorted_readings if r["created_at"] >= cutoff_date]

        if len(filtered_readings) < 2:
            return None

        # Get karma at start and end of period (within the time window)
        from_karma = filtered_readings[0].get("karma_alignment")
        to_karma = filtered_readings[-1].get("karma_alignment")

        if not from_karma or not to_karma:
            return None

        # Calculate change magnitude
        from_level = self.KARMA_LEVELS.get(from_karma, 0)
        to_level = self.KARMA_LEVELS.get(to_karma, 0)
        change = abs(to_level - from_level)

        # Convert to percentage (each level = ~25 points on 100-point scale)
        change_magnitude = change * 25

        if change_magnitude >= self.SIGNIFICANT_KARMA_CHANGE:
            return {
                "from_karma": from_karma,
                "to_karma": to_karma,
                "change_magnitude": change_magnitude,
                "days_analyzed": days,
            }

        return None

    def generate_spread_recommendation(
        self, patterns: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generate personalized spread recommendation based on patterns.

        Args:
            patterns: User pattern analysis from analyze_user_patterns()

        Returns:
            Dictionary with recommended_spread and reason
        """
        preferred_spreads = patterns.get("preferred_spread_types", [])
        common_categories = patterns.get("common_categories", [])

        if not preferred_spreads:
            return {
                "recommended_spread": "three_card",
                "reason": "Starting with a versatile three-card spread is recommended.",
            }

        # Get most used spread
        top_spread = preferred_spreads[0]
        spread_type = top_spread["spread_type"]

        # Build reason with context
        reason = f"Based on your history, you often use {spread_type} spreads"

        # Add category context if available
        if common_categories:
            top_category = common_categories[0]["category"]
            reason += f" for {top_category} questions"

        reason += ". This spread suits your reading style."

        return {"recommended_spread": spread_type, "reason": reason}

    def generate_voice_recommendation(
        self, patterns: Dict[str, Any]
    ) -> Optional[Dict[str, str]]:
        """
        Generate voice recommendation based on faction affinity.

        Args:
            patterns: User pattern analysis from analyze_user_patterns()

        Returns:
            Dictionary with recommended_voice and reason, or None if no high affinity
        """
        faction_affinity = patterns.get("faction_affinity", {})

        # Find factions with high affinity (>80)
        high_affinity_factions = [
            (faction, score)
            for faction, score in faction_affinity.items()
            if score >= self.HIGH_FACTION_AFFINITY_THRESHOLD
        ]

        if not high_affinity_factions:
            return None

        # Get highest affinity faction
        top_faction, affinity_score = max(
            high_affinity_factions, key=lambda x: x[1]
        )

        # Map faction to voice (simplified mapping)
        faction_voice_map = {
            "brotherhood": "Brotherhood Scribe",
            "ncr": "NCR Ranger",
            "raiders": "Raider Boss",
            "vault_tec": "Vault-Tec Representative",
        }

        recommended_voice = faction_voice_map.get(
            top_faction, f"{top_faction.title()} Voice"
        )

        reason = (
            f"Your strong affinity with {top_faction.title()} "
            f"({affinity_score}%) suggests you'd enjoy the {recommended_voice} perspective."
        )

        return {"recommended_voice": recommended_voice, "reason": reason}
