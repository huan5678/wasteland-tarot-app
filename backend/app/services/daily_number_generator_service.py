"""
Daily Number Generator Service - Business logic for generating daily bingo numbers
Uses Fisher-Yates shuffle algorithm for 25-day cycle without repeats
"""

from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract
import random
import logging

from app.models.bingo import DailyBingoNumber

logger = logging.getLogger(__name__)


class DailyNumberGeneratorService:
    """Service for generating daily bingo numbers"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def generate_daily_number(self, target_date: date) -> DailyBingoNumber:
        """
        Generate daily bingo number for specified date

        Algorithm:
        1. Check if number already exists for this date
        2. Get current cycle numbers for this month
        3. If cycle has 25 numbers, reset and start new cycle
        4. Generate random number from remaining pool
        5. Save to database

        Args:
            target_date: Date to generate number for

        Returns:
            DailyBingoNumber instance
        """
        # Check if number already exists
        existing = await self.get_number_by_date(target_date)
        if existing:
            logger.info(f"Number already exists for {target_date}: {existing.number}")
            return existing

        # Get current cycle numbers
        current_cycle = await self.get_current_cycle_numbers(target_date)
        cycle_number = await self._get_current_cycle_number(target_date)

        # If cycle is full (25 numbers), reset
        if len(current_cycle) >= 25:
            cycle_number = await self.reset_cycle(target_date)
            current_cycle = []

        # Generate number from remaining pool
        all_numbers = set(range(1, 26))
        used_numbers = set(current_cycle)
        available_numbers = list(all_numbers - used_numbers)

        if not available_numbers:
            # Should not happen after reset, but safeguard
            cycle_number += 1
            available_numbers = list(range(1, 26))

        # Fisher-Yates shuffle and pick first
        random.shuffle(available_numbers)
        selected_number = available_numbers[0]

        # Create new daily number
        daily_number = DailyBingoNumber(
            date=target_date,
            number=selected_number,
            cycle_number=cycle_number,
            generated_at=datetime.now()
        )

        self.db.add(daily_number)
        await self.db.commit()
        await self.db.refresh(daily_number)

        logger.info(
            f"Generated number {selected_number} for {target_date} "
            f"(cycle {cycle_number}, {len(current_cycle) + 1}/25)"
        )

        return daily_number

    async def get_current_cycle_numbers(
        self,
        reference_date: Optional[date] = None
    ) -> List[int]:
        """
        Get all numbers generated in current 25-day cycle

        Args:
            reference_date: Reference date (defaults to today)

        Returns:
            List of numbers in current cycle
        """
        if reference_date is None:
            reference_date = date.today()

        # Get current cycle number
        cycle_number = await self._get_current_cycle_number(reference_date)

        # Get all numbers from this cycle
        result = await self.db.execute(
            select(DailyBingoNumber.number)
            .where(DailyBingoNumber.cycle_number == cycle_number)
            .order_by(DailyBingoNumber.date)
        )

        return list(result.scalars().all())

    async def reset_cycle(self, reference_date: date) -> int:
        """
        Reset cycle and return new cycle number

        Args:
            reference_date: Reference date

        Returns:
            New cycle number
        """
        current_cycle = await self._get_current_cycle_number(reference_date)
        new_cycle = current_cycle + 1

        logger.info(f"Resetting cycle from {current_cycle} to {new_cycle}")

        return new_cycle

    async def _get_current_cycle_number(self, reference_date: date) -> int:
        """
        Get current cycle number based on latest generated number

        Args:
            reference_date: Reference date

        Returns:
            Current cycle number (defaults to 1 if no numbers exist)
        """
        result = await self.db.execute(
            select(func.max(DailyBingoNumber.cycle_number))
        )

        max_cycle = result.scalar()
        return max_cycle if max_cycle is not None else 1

    async def get_number_by_date(self, target_date: date) -> Optional[DailyBingoNumber]:
        """
        Get daily number for specified date

        Args:
            target_date: Target date

        Returns:
            DailyBingoNumber if exists, None otherwise
        """
        result = await self.db.execute(
            select(DailyBingoNumber)
            .where(DailyBingoNumber.date == target_date)
        )

        return result.scalar_one_or_none()

    async def get_today_number(self) -> Optional[DailyBingoNumber]:
        """
        Get today's daily number

        Returns:
            Today's DailyBingoNumber if exists, None otherwise
        """
        return await self.get_number_by_date(date.today())

    async def get_month_numbers(self, year: int, month: int) -> List[DailyBingoNumber]:
        """
        Get all daily numbers for specified month

        Args:
            year: Year
            month: Month (1-12)

        Returns:
            List of DailyBingoNumber for the month
        """
        result = await self.db.execute(
            select(DailyBingoNumber)
            .where(
                and_(
                    extract('year', DailyBingoNumber.date) == year,
                    extract('month', DailyBingoNumber.date) == month
                )
            )
            .order_by(DailyBingoNumber.date)
        )

        return list(result.scalars().all())

    async def clear_numbers_before_date(self, before_date: date) -> int:
        """
        Delete all numbers before specified date (used in cleanup/archiving)

        Args:
            before_date: Date threshold

        Returns:
            Number of records deleted
        """
        result = await self.db.execute(
            select(DailyBingoNumber)
            .where(DailyBingoNumber.date < before_date)
        )

        numbers = result.scalars().all()
        count = len(numbers)

        for number in numbers:
            await self.db.delete(number)

        await self.db.commit()

        logger.info(f"Deleted {count} daily numbers before {before_date}")

        return count
