"""
Bingo Game Models - Daily Login Bingo Game System
Database models for monthly bingo cards, daily numbers, claims, and rewards
"""

from sqlalchemy import Column, String, Integer, Date, JSON, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Dict, Any, List, Optional
from datetime import date, datetime
from .base import BaseModel


class UserBingoCard(BaseModel):
    """
    User's monthly bingo card (5x5 grid with numbers 1-25)
    One card per user per month, set once and cannot be modified

    Partitioned by month_year for efficient querying and archiving
    """

    __tablename__ = "user_bingo_cards"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month_year = Column(Date, nullable=False, index=True)  # First day of the month (e.g., 2025-10-01)
    card_data = Column(JSON, nullable=False)  # 5x5 array: [[1,2,3,4,5], [6,7,8,9,10], ...]
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    claims = relationship("UserNumberClaim", back_populates="card", cascade="all, delete-orphan")
    rewards = relationship("BingoReward", back_populates="card", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'month_year', name='uq_user_month_card'),
        Index('idx_user_bingo_cards_user_month', 'user_id', 'month_year'),
        Index('idx_user_bingo_cards_month', 'month_year'),
        Index('idx_user_bingo_cards_active', 'is_active', postgresql_where=Column('is_active') == True),
    )

    def __repr__(self):
        return f"<UserBingoCard(user_id='{self.user_id}', month='{self.month_year}', active={self.is_active})>"

    def get_card_numbers(self) -> List[int]:
        """Get all 25 numbers from the card as a flat list"""
        if not self.card_data:
            return []
        # Flatten 5x5 array to 1D list
        return [num for row in self.card_data for num in row]

    def validate_card_data(self) -> bool:
        """Validate card data structure and numbers"""
        if not self.card_data or not isinstance(self.card_data, list):
            return False

        # Must be 5x5 grid
        if len(self.card_data) != 5:
            return False

        # Flatten to check numbers
        all_numbers = []
        for row in self.card_data:
            if not isinstance(row, list) or len(row) != 5:
                return False
            all_numbers.extend(row)

        # Must have exactly 25 numbers
        if len(all_numbers) != 25:
            return False

        # All numbers must be 1-25
        if not all(isinstance(n, int) and 1 <= n <= 25 for n in all_numbers):
            return False

        # No duplicates
        if len(set(all_numbers)) != 25:
            return False

        return True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "month_year": self.month_year.isoformat() if self.month_year else None,
            "card_data": self.card_data,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class DailyBingoNumber(BaseModel):
    """
    System-generated daily bingo number (1-25)
    One number per day, cycles every 25 days without repeats
    """

    __tablename__ = "daily_bingo_numbers"

    date = Column(Date, nullable=False, unique=True, index=True)
    number = Column(Integer, nullable=False)
    cycle_number = Column(Integer, nullable=False, default=1)  # Tracks which 25-day cycle
    generated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    claims = relationship("UserNumberClaim", back_populates="daily_number", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('number >= 1 AND number <= 25', name='ck_number_range'),
        Index('idx_daily_numbers_date', 'date'),
        Index('idx_daily_numbers_cycle', 'cycle_number'),
    )

    def __repr__(self):
        return f"<DailyBingoNumber(date='{self.date}', number={self.number}, cycle={self.cycle_number})>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "number": self.number,
            "cycle_number": self.cycle_number,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None
        }


class UserNumberClaim(BaseModel):
    """
    User's daily number claim record
    Tracks when users claim daily numbers and links to their bingo card
    """

    __tablename__ = "user_number_claims"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    card_id = Column(String, ForeignKey("user_bingo_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    daily_number_id = Column(String, ForeignKey("daily_bingo_numbers.id", ondelete="CASCADE"), nullable=False)
    claim_date = Column(Date, nullable=False, index=True)
    number = Column(Integer, nullable=False)  # Denormalized for quick access
    claimed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    card = relationship("UserBingoCard", back_populates="claims")
    daily_number = relationship("DailyBingoNumber", back_populates="claims")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'claim_date', name='uq_user_claim_date'),
        Index('idx_claims_user_date', 'user_id', 'claim_date'),
        Index('idx_claims_card', 'card_id'),
        CheckConstraint('number >= 1 AND number <= 25', name='ck_claim_number_range'),
    )

    def __repr__(self):
        return f"<UserNumberClaim(user_id='{self.user_id}', date='{self.claim_date}', number={self.number})>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "card_id": self.card_id,
            "daily_number_id": self.daily_number_id,
            "claim_date": self.claim_date.isoformat() if self.claim_date else None,
            "number": self.number,
            "claimed_at": self.claimed_at.isoformat() if self.claimed_at else None
        }


class BingoReward(BaseModel):
    """
    Bingo reward record for achieving 3 lines
    One reward per user per month (no duplicate rewards)
    """

    __tablename__ = "bingo_rewards"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    card_id = Column(String, ForeignKey("user_bingo_cards.id", ondelete="CASCADE"), nullable=False)
    month_year = Column(Date, nullable=False, index=True)
    line_types = Column(JSON, nullable=False)  # Array of line identifiers: ['row-0', 'col-2', 'diagonal-main']
    issued_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    card = relationship("UserBingoCard", back_populates="rewards")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'month_year', name='uq_user_month_reward'),
        Index('idx_rewards_user_month', 'user_id', 'month_year'),
    )

    def __repr__(self):
        return f"<BingoReward(user_id='{self.user_id}', month='{self.month_year}', lines={len(self.line_types)})>"

    def get_line_count(self) -> int:
        """Get number of completed lines"""
        return len(self.line_types) if self.line_types else 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "card_id": self.card_id,
            "month_year": self.month_year.isoformat() if self.month_year else None,
            "line_types": self.line_types,
            "line_count": self.get_line_count(),
            "issued_at": self.issued_at.isoformat() if self.issued_at else None
        }


class MonthlyResetLog(BaseModel):
    """
    Monthly reset execution log
    Tracks reset operations, data archiving, and any errors
    """

    __tablename__ = "monthly_reset_logs"

    reset_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False)  # SUCCESS, FAILED, PARTIAL
    reset_metadata = Column(JSON)  # {cardsArchived: 100, claimsArchived: 2500, errors: [...]}
    executed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('SUCCESS', 'FAILED', 'PARTIAL')", name='ck_reset_status'),
        Index('idx_reset_logs_date', 'reset_date'),
        Index('idx_reset_logs_status', 'status'),
    )

    def __repr__(self):
        return f"<MonthlyResetLog(date='{self.reset_date}', status='{self.status}')>"

    def is_successful(self) -> bool:
        """Check if reset was successful"""
        return self.status == 'SUCCESS'

    def get_archived_count(self) -> Dict[str, int]:
        """Get count of archived records"""
        if not self.reset_metadata:
            return {"cards": 0, "claims": 0, "rewards": 0}

        return {
            "cards": self.reset_metadata.get("cardsArchived", 0),
            "claims": self.reset_metadata.get("claimsArchived", 0),
            "rewards": self.reset_metadata.get("rewardsArchived", 0)
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            "id": self.id,
            "reset_date": self.reset_date.isoformat() if self.reset_date else None,
            "status": self.status,
            "reset_metadata": self.reset_metadata,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None
        }


# History tables for monthly data archiving

class UserBingoCardHistory(BaseModel):
    """
    Historical archive of user bingo cards
    Data moved here during monthly reset
    """

    __tablename__ = "user_bingo_cards_history"

    user_id = Column(String, nullable=False, index=True)
    month_year = Column(Date, nullable=False, index=True)
    card_data = Column(JSON, nullable=False)
    created_at_original = Column(DateTime(timezone=True), nullable=False)
    archived_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index('idx_cards_history_user_month', 'user_id', 'month_year'),
    )

    def __repr__(self):
        return f"<UserBingoCardHistory(user_id='{self.user_id}', month='{self.month_year}')>"


class UserNumberClaimHistory(BaseModel):
    """
    Historical archive of user number claims
    Data moved here during monthly reset
    """

    __tablename__ = "user_number_claims_history"

    user_id = Column(String, nullable=False, index=True)
    card_id = Column(String, nullable=False)
    claim_date = Column(Date, nullable=False, index=True)
    number = Column(Integer, nullable=False)
    claimed_at_original = Column(DateTime(timezone=True), nullable=False)
    archived_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index('idx_claims_history_user_month', 'user_id', 'claim_date'),
    )

    def __repr__(self):
        return f"<UserNumberClaimHistory(user_id='{self.user_id}', date='{self.claim_date}')>"


class BingoRewardHistory(BaseModel):
    """
    Historical archive of bingo rewards
    Data moved here during monthly reset
    """

    __tablename__ = "bingo_rewards_history"

    user_id = Column(String, nullable=False, index=True)
    month_year = Column(Date, nullable=False, index=True)
    line_types = Column(JSON, nullable=False)
    issued_at_original = Column(DateTime(timezone=True), nullable=False)
    archived_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index('idx_rewards_history_user_month', 'user_id', 'month_year'),
    )

    def __repr__(self):
        return f"<BingoRewardHistory(user_id='{self.user_id}', month='{self.month_year}')>"
