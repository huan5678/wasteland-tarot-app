"""
Bingo Card Service - Business logic for bingo card management
Handles card creation, validation, and retrieval
"""

from typing import List, Optional, Dict, Any
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
import logging

from app.models.bingo import UserBingoCard
from app.schemas.bingo import BingoCardCreate, BingoCardResponse
from app.core.exceptions import (
    CardAlreadyExistsError,
    NoCardFoundError,
    InvalidCardNumbersError
)

logger = logging.getLogger(__name__)


class BingoCardManagerService:
    """Service for managing user bingo cards"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def create_card(
        self,
        user_id: str,
        numbers: List[List[int]],
        month_year: Optional[date] = None
    ) -> UserBingoCard:
        """
        Create a new bingo card for user

        Args:
            user_id: User ID
            numbers: 5x5 grid of numbers (1-25)
            month_year: Month for the card (defaults to current month)

        Returns:
            Created UserBingoCard instance

        Raises:
            CardAlreadyExistsError: If user already has a card for this month
            InvalidCardNumbersError: If card numbers are invalid
        """
        # Default to current month
        if month_year is None:
            month_year = date.today().replace(day=1)
        else:
            # Ensure it's the first day of the month
            month_year = month_year.replace(day=1)

        # Validate card numbers
        if not self.validate_card_numbers(numbers):
            raise InvalidCardNumbersError("Invalid card numbers")

        # Check if user already has a card for this month
        if await self.has_card_for_month(user_id, month_year):
            raise CardAlreadyExistsError(
                f"User already has a bingo card for {month_year.strftime('%Y-%m')}"
            )

        # Create new card
        card = UserBingoCard(
            user_id=user_id,
            month_year=month_year,
            card_data=numbers,
            is_active=True
        )

        self.db.add(card)
        await self.db.commit()
        await self.db.refresh(card)

        logger.info(
            f"Created bingo card for user {user_id} for month {month_year.strftime('%Y-%m')}"
        )

        return card

    async def get_user_card(
        self,
        user_id: str,
        month_year: Optional[date] = None
    ) -> Optional[UserBingoCard]:
        """
        Get user's bingo card for specified month

        Args:
            user_id: User ID
            month_year: Month (defaults to current month)

        Returns:
            UserBingoCard if exists, None otherwise
        """
        if month_year is None:
            month_year = date.today().replace(day=1)
        else:
            month_year = month_year.replace(day=1)

        result = await self.db.execute(
            select(UserBingoCard)
            .where(
                and_(
                    UserBingoCard.user_id == user_id,
                    UserBingoCard.month_year == month_year
                )
            )
        )

        return result.scalar_one_or_none()

    async def has_card_for_month(
        self,
        user_id: str,
        month_year: date
    ) -> bool:
        """
        Check if user has a bingo card for specified month

        Args:
            user_id: User ID
            month_year: Month to check

        Returns:
            True if card exists, False otherwise
        """
        month_year = month_year.replace(day=1)

        result = await self.db.execute(
            select(func.count(UserBingoCard.id))
            .where(
                and_(
                    UserBingoCard.user_id == user_id,
                    UserBingoCard.month_year == month_year
                )
            )
        )

        count = result.scalar()
        return count > 0

    def validate_card_numbers(self, numbers: List[List[int]]) -> bool:
        """
        Validate bingo card numbers

        Rules:
        - Must be 5x5 grid
        - All numbers must be 1-25
        - No duplicates
        - Exactly 25 numbers

        Args:
            numbers: 5x5 grid of numbers

        Returns:
            True if valid, False otherwise
        """
        try:
            # Must be 5x5 grid
            if len(numbers) != 5:
                logger.warning("Card validation failed: Not 5 rows")
                return False

            # Flatten to check numbers
            all_numbers = []
            for row in numbers:
                if not isinstance(row, list) or len(row) != 5:
                    logger.warning("Card validation failed: Row length not 5")
                    return False
                all_numbers.extend(row)

            # Must have exactly 25 numbers
            if len(all_numbers) != 25:
                logger.warning("Card validation failed: Not 25 numbers")
                return False

            # All numbers must be integers 1-25
            if not all(isinstance(n, int) and 1 <= n <= 25 for n in all_numbers):
                logger.warning("Card validation failed: Numbers not in range 1-25")
                return False

            # No duplicates
            if len(set(all_numbers)) != 25:
                logger.warning("Card validation failed: Duplicate numbers found")
                return False

            return True

        except Exception as e:
            logger.error(f"Card validation error: {e}")
            return False

    async def get_active_cards_count(self, month_year: Optional[date] = None) -> int:
        """
        Get count of active cards for specified month

        Args:
            month_year: Month to check (defaults to current month)

        Returns:
            Number of active cards
        """
        if month_year is None:
            month_year = date.today().replace(day=1)
        else:
            month_year = month_year.replace(day=1)

        result = await self.db.execute(
            select(func.count(UserBingoCard.id))
            .where(
                and_(
                    UserBingoCard.month_year == month_year,
                    UserBingoCard.is_active == True
                )
            )
        )

        return result.scalar()

    async def deactivate_card(self, card_id: str) -> bool:
        """
        Deactivate a bingo card

        Args:
            card_id: Card ID

        Returns:
            True if successful, False otherwise
        """
        result = await self.db.execute(
            select(UserBingoCard).where(UserBingoCard.id == card_id)
        )
        card = result.scalar_one_or_none()

        if not card:
            logger.warning(f"Card {card_id} not found for deactivation")
            return False

        card.is_active = False
        await self.db.commit()

        logger.info(f"Deactivated card {card_id}")
        return True

    async def deactivate_all_cards(self, month_year: Optional[date] = None) -> int:
        """
        Deactivate all cards for specified month (used in monthly reset)

        Args:
            month_year: Month to deactivate (defaults to current month)

        Returns:
            Number of cards deactivated
        """
        if month_year is None:
            month_year = date.today().replace(day=1)
        else:
            month_year = month_year.replace(day=1)

        result = await self.db.execute(
            select(UserBingoCard)
            .where(
                and_(
                    UserBingoCard.month_year == month_year,
                    UserBingoCard.is_active == True
                )
            )
        )

        cards = result.scalars().all()

        for card in cards:
            card.is_active = False

        await self.db.commit()

        logger.info(f"Deactivated {len(cards)} cards for month {month_year.strftime('%Y-%m')}")
        return len(cards)

    def card_to_response(self, card: UserBingoCard) -> BingoCardResponse:
        """
        Convert UserBingoCard model to response schema

        Args:
            card: UserBingoCard instance

        Returns:
            BingoCardResponse schema
        """
        return BingoCardResponse(
            id=card.id,
            user_id=card.user_id,
            month_year=card.month_year.strftime('%Y-%m'),
            card_data=card.card_data,
            is_active=card.is_active,
            created_at=card.created_at.isoformat() if card.created_at else None
        )
