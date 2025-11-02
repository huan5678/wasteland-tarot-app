"""
SQLAlchemy Models for Dashboard Gamification System
包含 Karma 系統、任務系統、活躍度統計的資料模型
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


# ========================================
# Karma System Models
# ========================================

class KarmaLog(Base):
    """
    Karma 記錄表 - 記錄所有 Karma 獲得的歷史
    """
    __tablename__ = "karma_logs"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type: str = Column(String(50), nullable=False, comment="行為類型: daily_login, complete_reading, etc.")
    karma_amount: int = Column(Integer, nullable=False, comment="獲得的 Karma 數量")
    description: Optional[str] = Column(Text, nullable=True, comment="描述")
    created_at: datetime = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="記錄時間"
    )
    action_metadata: dict = Column(JSONB, server_default="{}", nullable=False, comment="額外資訊 (reading_id, task_id, etc.)")

    # Constraints
    __table_args__ = (
        CheckConstraint("karma_amount > 0", name="ck_karma_logs_positive_amount"),
        Index("idx_karma_logs_user_id", "user_id"),
        Index("idx_karma_logs_created_at", "created_at", postgresql_using="btree", postgresql_ops={"created_at": "DESC"}),
        Index("idx_karma_logs_action_type", "action_type"),
    )

    # Relationships
    user = relationship("User", back_populates="karma_logs")


class UserKarma(Base):
    """
    用戶 Karma 總計表 - 儲存用戶的 Karma 彙總數據
    """
    __tablename__ = "user_karma"

    user_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    total_karma: int = Column(Integer, nullable=False, server_default="0", comment="總 Karma")
    current_level: int = Column(Integer, nullable=False, server_default="1", comment="當前等級")
    karma_to_next_level: int = Column(Integer, nullable=False, server_default="500", comment="到下一級所需 Karma")
    rank: Optional[int] = Column(Integer, nullable=True, comment="全服排名")
    last_karma_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True, comment="最後獲得 Karma 時間")
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("total_karma >= 0", name="ck_user_karma_nonnegative"),
        CheckConstraint("current_level >= 1", name="ck_user_karma_min_level"),
        Index("idx_user_karma_total", "total_karma", postgresql_ops={"total_karma": "DESC"}),
        Index("idx_user_karma_level", "current_level", postgresql_ops={"current_level": "DESC"}),
    )

    # Relationships
    user = relationship("User", back_populates="karma")


# ========================================
# Tasks System Models
# ========================================

class DailyTask(Base):
    """
    每日任務定義表 - 系統配置的每日任務
    """
    __tablename__ = "daily_tasks"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_key: str = Column(String(50), unique=True, nullable=False, comment="任務唯一標識")
    name: str = Column(String(100), nullable=False, comment="任務名稱")
    description: Optional[str] = Column(Text, nullable=True, comment="任務描述")
    target_value: int = Column(Integer, nullable=False, comment="目標值")
    karma_reward: int = Column(Integer, nullable=False, comment="Karma 獎勵")
    display_order: int = Column(Integer, nullable=False, server_default="0", comment="顯示順序")
    is_active: bool = Column(Boolean, nullable=False, server_default="true", comment="是否啟用")
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("target_value > 0", name="ck_daily_tasks_positive_target"),
        CheckConstraint("karma_reward > 0", name="ck_daily_tasks_positive_reward"),
    )

    # Relationships
    user_tasks = relationship("UserDailyTask", back_populates="task", cascade="all, delete-orphan")


class UserDailyTask(Base):
    """
    用戶每日任務進度表 - 記錄用戶每日任務的完成進度
    """
    __tablename__ = "user_daily_tasks"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("daily_tasks.id", ondelete="CASCADE"), nullable=False)
    task_key: str = Column(String(50), nullable=False, comment="任務 key（冗餘欄位）")
    current_value: int = Column(Integer, nullable=False, server_default="0", comment="當前進度")
    target_value: int = Column(Integer, nullable=False, comment="目標值（冗餘欄位）")
    is_completed: bool = Column(Boolean, nullable=False, server_default="false", comment="是否已完成")
    is_claimed: bool = Column(Boolean, nullable=False, server_default="false", comment="是否已領取獎勵")
    completed_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True, comment="完成時間")
    claimed_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True, comment="領取時間")
    task_date: date = Column(Date, nullable=False, server_default=func.current_date(), comment="任務日期")
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "task_id", "task_date", name="uq_user_daily_task_date"),
        CheckConstraint("current_value <= target_value", name="ck_user_daily_tasks_value_range"),
        Index("idx_user_daily_tasks_user_date", "user_id", "task_date"),
        Index("idx_user_daily_tasks_date", "task_date"),
    )

    # Relationships
    user = relationship("User", back_populates="daily_tasks")
    task = relationship("DailyTask", back_populates="user_tasks")


class WeeklyTask(Base):
    """
    每週任務定義表 - 系統配置的每週任務
    """
    __tablename__ = "weekly_tasks"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_key: str = Column(String(50), unique=True, nullable=False, comment="任務唯一標識")
    name: str = Column(String(100), nullable=False, comment="任務名稱")
    description: Optional[str] = Column(Text, nullable=True, comment="任務描述")
    target_value: int = Column(Integer, nullable=False, comment="目標值")
    karma_reward: int = Column(Integer, nullable=False, comment="Karma 獎勵")
    display_order: int = Column(Integer, nullable=False, server_default="0", comment="顯示順序")
    is_active: bool = Column(Boolean, nullable=False, server_default="true", comment="是否啟用")
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("target_value > 0", name="ck_weekly_tasks_positive_target"),
        CheckConstraint("karma_reward > 0", name="ck_weekly_tasks_positive_reward"),
    )

    # Relationships
    user_tasks = relationship("UserWeeklyTask", back_populates="task", cascade="all, delete-orphan")


class UserWeeklyTask(Base):
    """
    用戶每週任務進度表 - 記錄用戶每週任務的完成進度
    """
    __tablename__ = "user_weekly_tasks"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("weekly_tasks.id", ondelete="CASCADE"), nullable=False)
    task_key: str = Column(String(50), nullable=False, comment="任務 key（冗餘欄位）")
    current_value: int = Column(Integer, nullable=False, server_default="0", comment="當前進度")
    target_value: int = Column(Integer, nullable=False, comment="目標值（冗餘欄位）")
    is_completed: bool = Column(Boolean, nullable=False, server_default="false", comment="是否已完成")
    is_claimed: bool = Column(Boolean, nullable=False, server_default="false", comment="是否已領取獎勵")
    completed_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True, comment="完成時間")
    claimed_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True, comment="領取時間")
    week_start: date = Column(Date, nullable=False, comment="週一日期")
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "task_id", "week_start", name="uq_user_weekly_task_week"),
        CheckConstraint("current_value <= target_value", name="ck_user_weekly_tasks_value_range"),
        Index("idx_user_weekly_tasks_user_week", "user_id", "week_start"),
        Index("idx_user_weekly_tasks_week", "week_start"),
    )

    # Relationships
    user = relationship("User", back_populates="weekly_tasks")
    task = relationship("WeeklyTask", back_populates="user_tasks")


# ========================================
# Activity Statistics Models
# ========================================

class UserActivityStats(Base):
    """
    用戶每日活躍度統計表 - 記錄用戶每日的活動數據
    """
    __tablename__ = "user_activity_stats"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stat_date: date = Column(Date, nullable=False, comment="統計日期")

    # Reading activity
    readings_count: int = Column(Integer, nullable=False, server_default="0", comment="占卜次數")
    unique_cards_collected: int = Column(Integer, nullable=False, server_default="0", comment="收集到的不重複卡牌數")

    # Social interactions
    shares_count: int = Column(Integer, nullable=False, server_default="0", comment="分享次數")
    likes_received: int = Column(Integer, nullable=False, server_default="0", comment="獲得讚數")
    comments_received: int = Column(Integer, nullable=False, server_default="0", comment="獲得評論數")

    # Login habits
    login_count: int = Column(Integer, nullable=False, server_default="0", comment="登入次數")
    login_duration_minutes: int = Column(Integer, nullable=False, server_default="0", comment="登入時長（分鐘）")

    # Task completion
    daily_tasks_completed: int = Column(Integer, nullable=False, server_default="0", comment="完成的每日任務數")
    weekly_tasks_completed: int = Column(Integer, nullable=False, server_default="0", comment="完成的每週任務數")

    # Karma stats
    karma_earned: int = Column(Integer, nullable=False, server_default="0", comment="當日獲得 Karma")

    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "stat_date", name="uq_user_activity_stats_date"),
        Index("idx_user_activity_stats_user_date", "user_id", "stat_date", postgresql_ops={"stat_date": "DESC"}),
        Index("idx_user_activity_stats_date", "stat_date", postgresql_ops={"stat_date": "DESC"}),
    )

    # Relationships
    user = relationship("User", back_populates="activity_stats")


class UserLoginStreak(Base):
    """
    用戶連續登入記錄表 - 追蹤用戶的連續登入天數與里程碑
    """
    __tablename__ = "user_login_streaks"

    user_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    current_streak: int = Column(Integer, nullable=False, server_default="0", comment="當前連續天數")
    longest_streak: int = Column(Integer, nullable=False, server_default="0", comment="最長連續天數")
    last_login_date: Optional[date] = Column(Date, nullable=True, comment="最後登入日期")
    milestone_3_claimed: bool = Column(Boolean, nullable=False, server_default="false", comment="3 天里程碑已領取")
    milestone_7_claimed: bool = Column(Boolean, nullable=False, server_default="false", comment="7 天里程碑已領取")
    milestone_30_claimed: bool = Column(Boolean, nullable=False, server_default="false", comment="30 天里程碑已領取")
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("current_streak >= 0", name="ck_login_streaks_current_nonnegative"),
        CheckConstraint("longest_streak >= 0", name="ck_login_streaks_longest_nonnegative"),
    )

    # Relationships
    user = relationship("User", back_populates="login_streak")
