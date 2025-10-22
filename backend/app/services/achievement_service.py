"""
Achievement Service
成就系統業務邏輯層：查詢、解鎖、獎勵發放
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.models.achievement import (
    Achievement,
    UserAchievementProgress,
    AchievementCategory,
    AchievementStatus
)
from app.models.user import User, UserProfile
from app.services.achievement_checker import AchievementChecker
from app.services.karma_service import KarmaService
from app.models.social_features import KarmaChangeReason

logger = logging.getLogger(__name__)


class AchievementService:
    """
    成就系統服務層
    處理成就查詢、解鎖、獎勵發放等業務邏輯
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.checker = AchievementChecker(db)
        self.karma_service = KarmaService(db)

    # ===== Achievement Queries =====

    async def get_all_achievements(
        self,
        category: Optional[AchievementCategory] = None,
        include_hidden: bool = False
    ) -> List[Achievement]:
        """
        獲取所有成就定義

        Args:
            category: 成就類別篩選（可選）
            include_hidden: 是否包含隱藏成就

        Returns:
            List of Achievement objects
        """
        query = select(Achievement).where(Achievement.is_active == True)

        if category:
            query = query.where(Achievement.category == category.value)

        if not include_hidden:
            query = query.where(Achievement.is_hidden == False)

        query = query.order_by(Achievement.display_order, Achievement.created_at)

        result = await self.db.execute(query)
        achievements = result.scalars().all()

        return list(achievements)

    async def get_achievement_by_code(
        self,
        code: str
    ) -> Optional[Achievement]:
        """
        根據成就代碼獲取成就定義

        Args:
            code: 成就唯一代碼

        Returns:
            Achievement object or None
        """
        query = select(Achievement).where(
            and_(
                Achievement.code == code,
                Achievement.is_active == True
            )
        )

        result = await self.db.execute(query)
        achievement = result.scalar_one_or_none()

        return achievement

    # ===== User Progress Queries =====

    async def get_user_progress(
        self,
        user_id: UUID,
        category: Optional[AchievementCategory] = None,
        status: Optional[AchievementStatus] = None
    ) -> List[UserAchievementProgress]:
        """
        獲取使用者成就進度

        Args:
            user_id: 使用者 ID
            category: 成就類別篩選（可選）
            status: 成就狀態篩選（可選）

        Returns:
            List of UserAchievementProgress objects with achievement data
        """
        query = select(UserAchievementProgress).where(
            UserAchievementProgress.user_id == user_id
        )

        if status:
            query = query.where(UserAchievementProgress.status == status.value)

        # Join achievement for category filter
        if category:
            query = query.join(Achievement).where(
                Achievement.category == category.value
            )

        result = await self.db.execute(query)
        progress_list = result.scalars().all()

        return list(progress_list)

    async def get_user_progress_with_achievements(
        self,
        user_id: UUID,
        category: Optional[AchievementCategory] = None
    ) -> List[Dict[str, Any]]:
        """
        獲取使用者成就進度（包含成就定義資料）

        Args:
            user_id: 使用者 ID
            category: 成就類別篩選（可選）

        Returns:
            List of dicts with progress and achievement data
        """
        # 獲取所有成就
        achievements = await self.get_all_achievements(category=category, include_hidden=False)

        # 獲取使用者進度
        progress_list = await self.get_user_progress(user_id, category=category)
        progress_dict = {p.achievement_id: p for p in progress_list}

        # 組合資料
        result = []
        for achievement in achievements:
            progress = progress_dict.get(achievement.id)

            if progress:
                # 已有進度記錄
                result.append({
                    'achievement': achievement,
                    'progress': progress
                })
            else:
                # 尚未開始，建立臨時進度物件
                temp_progress = {
                    'achievement_id': achievement.id,
                    'user_id': user_id,
                    'current_progress': 0,
                    'target_progress': achievement.criteria.get('target', 1),
                    'status': AchievementStatus.IN_PROGRESS.value,
                    'progress_percentage': 0.0
                }
                result.append({
                    'achievement': achievement,
                    'progress': temp_progress
                })

        return result

    # ===== Achievement Unlock and Reward =====

    async def unlock_achievements_for_user(
        self,
        user_id: UUID,
        trigger_event: str,
        event_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        檢查並解鎖使用者的成就（由業務事件觸發）

        Args:
            user_id: 使用者 ID
            trigger_event: 觸發事件類型（如 'reading_completed', 'friend_added'）
            event_context: 事件上下文資料

        Returns:
            List of newly unlocked achievements with notification data
        """
        # 根據事件類型篩選要檢查的成就
        relevant_achievements = await self._get_relevant_achievements(trigger_event)

        if not relevant_achievements:
            return []

        # 使用 AchievementChecker 檢查並解鎖
        newly_unlocked = await self.checker.check_and_unlock_achievements(
            user_id=user_id,
            achievement_codes=[a.code for a in relevant_achievements]
        )

        # 記錄解鎖事件到 Analytics
        for unlock_data in newly_unlocked:
            await self._log_unlock_event(
                user_id=user_id,
                achievement=unlock_data['achievement'],
                context=event_context
            )

        return newly_unlocked

    async def _get_relevant_achievements(
        self,
        trigger_event: str
    ) -> List[Achievement]:
        """
        根據觸發事件獲取相關成就

        Args:
            trigger_event: 事件類型

        Returns:
            List of relevant Achievement objects
        """
        # 事件與成就類型的映射
        event_category_map = {
            'reading_completed': AchievementCategory.READING,
            'friend_added': AchievementCategory.SOCIAL,
            'reading_shared': AchievementCategory.SOCIAL,
            'bingo_line': AchievementCategory.BINGO,
            'login': AchievementCategory.BINGO,  # 連續簽到
            'card_viewed': AchievementCategory.EXPLORATION,
            'playlist_created': AchievementCategory.EXPLORATION,
        }

        category = event_category_map.get(trigger_event)

        if category:
            return await self.get_all_achievements(category=category, include_hidden=True)
        else:
            # 未知事件，不檢查任何成就
            return []

    async def _log_unlock_event(
        self,
        user_id: UUID,
        achievement: Achievement,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        記錄成就解鎖事件到 Analytics 系統

        Args:
            user_id: 使用者 ID
            achievement: 解鎖的成就
            context: 事件上下文
        """
        from app.models.user_analytics import AnalyticsEvent

        event = AnalyticsEvent(
            user_id=user_id,
            event_type='achievement_unlocked',
            event_data={
                'achievement_code': achievement.code,
                'achievement_name': achievement.name_zh_tw,
                'achievement_category': achievement.category,
                'achievement_rarity': achievement.rarity,
                'context': context or {}
            }
        )

        self.db.add(event)
        # Note: commit happens in the calling function

    # ===== Reward Claiming =====

    async def claim_reward(
        self,
        user_id: UUID,
        achievement_code: str
    ) -> Dict[str, Any]:
        """
        領取成就獎勵

        Args:
            user_id: 使用者 ID
            achievement_code: 成就代碼

        Returns:
            Dict with claim result and rewards

        Raises:
            ValueError: 成就不存在、尚未解鎖、已領取等錯誤
        """
        # 獲取成就定義
        achievement = await self.get_achievement_by_code(achievement_code)
        if not achievement:
            raise ValueError(f"找不到成就: {achievement_code}")

        # 獲取使用者進度
        query = select(UserAchievementProgress).where(
            and_(
                UserAchievementProgress.user_id == user_id,
                UserAchievementProgress.achievement_id == achievement.id
            )
        )
        result = await self.db.execute(query)
        progress = result.scalar_one_or_none()

        if not progress:
            raise ValueError(f"你尚未開始此成就")

        if progress.status == AchievementStatus.IN_PROGRESS.value:
            raise ValueError(f"此成就尚未解鎖（進度: {progress.current_progress}/{progress.target_progress}）")

        if progress.status == AchievementStatus.CLAIMED.value:
            raise ValueError(f"此成就的獎勵已經領取過了")

        # 發放獎勵
        rewards = achievement.rewards
        distributed_rewards = {}

        # Karma 點數獎勵
        if 'karma_points' in rewards:
            karma_points = rewards['karma_points']
            try:
                await self.karma_service.add_karma(
                    user_id=user_id,
                    change_amount=karma_points,
                    reason=KarmaChangeReason.COMMUNITY_CONTRIBUTION,
                    reason_description=f"完成成就「{achievement.name_zh_tw}」",
                    triggered_by_action=f"achievement_claim_{achievement.code}"
                )
                distributed_rewards['karma_points'] = karma_points
            except Exception as e:
                logger.error(f"Failed to distribute karma for achievement {achievement_code}: {e}")
                # 標記為 PENDING 狀態，稍後重試
                progress.status = AchievementStatus.UNLOCKED.value
                await self.db.commit()
                raise ValueError("獎勵發放失敗，請稍後再試")

        # 稱號獎勵
        if 'title' in rewards:
            title = rewards['title']
            await self._grant_title(user_id, title)
            distributed_rewards['title'] = title

        # 徽章獎勵（未來擴充）
        if 'badge' in rewards:
            distributed_rewards['badge'] = rewards['badge']

        # 更新進度狀態為已領取
        progress.status = AchievementStatus.CLAIMED.value
        progress.claimed_at = datetime.utcnow()

        await self.db.commit()

        return {
            'success': True,
            'achievement_code': achievement_code,
            'rewards': distributed_rewards,
            'claimed_at': progress.claimed_at.isoformat()
        }

    async def _grant_title(
        self,
        user_id: UUID,
        title: str
    ) -> None:
        """
        授予使用者稱號

        Args:
            user_id: 使用者 ID
            title: 稱號名稱
        """
        # 更新 UserProfile 的稱號
        query = select(UserProfile).where(UserProfile.user_id == user_id)
        result = await self.db.execute(query)
        profile = result.scalar_one_or_none()

        if not profile:
            # 建立 UserProfile
            profile = UserProfile(
                user_id=user_id,
                current_title=title,
                unlocked_titles=[title]
            )
            self.db.add(profile)
        else:
            # 更新現有 Profile
            if not profile.unlocked_titles:
                profile.unlocked_titles = []

            if title not in profile.unlocked_titles:
                profile.unlocked_titles.append(title)

            # 設定為當前稱號（使用者可以稍後更改）
            if not profile.current_title:
                profile.current_title = title

        # Note: commit happens in claim_reward

    # ===== Batch Operations =====

    async def initialize_user_achievements(
        self,
        user_id: UUID
    ) -> None:
        """
        初始化新使用者的成就進度（註冊時呼叫）

        Args:
            user_id: 使用者 ID
        """
        # 獲取所有成就
        achievements = await self.get_all_achievements(include_hidden=True)

        for achievement in achievements:
            # 建立進度記錄
            progress = UserAchievementProgress(
                user_id=user_id,
                achievement_id=achievement.id,
                current_progress=0,
                target_progress=achievement.criteria.get('target', 1),
                status=AchievementStatus.IN_PROGRESS.value
            )
            self.db.add(progress)

        await self.db.commit()

    async def recalculate_user_progress(
        self,
        user_id: UUID
    ) -> Dict[str, Any]:
        """
        重新計算使用者所有成就的進度（用於 Migration 或修正）

        Args:
            user_id: 使用者 ID

        Returns:
            Dict with recalculation summary
        """
        achievements = await self.get_all_achievements(include_hidden=True)

        updated_count = 0
        newly_unlocked_count = 0

        for achievement in achievements:
            # 計算最新進度
            progress_data = await self.checker.check_achievement_progress(user_id, achievement)

            # 獲取或建立進度記錄
            query = select(UserAchievementProgress).where(
                and_(
                    UserAchievementProgress.user_id == user_id,
                    UserAchievementProgress.achievement_id == achievement.id
                )
            )
            result = await self.db.execute(query)
            progress = result.scalar_one_or_none()

            if not progress:
                # 建立新記錄
                progress = UserAchievementProgress(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    current_progress=progress_data['current_progress'],
                    target_progress=progress_data['target_progress'],
                    status=AchievementStatus.IN_PROGRESS.value
                )
                self.db.add(progress)
                updated_count += 1
            else:
                # 更新現有記錄
                progress.current_progress = progress_data['current_progress']
                progress.target_progress = progress_data['target_progress']
                updated_count += 1

            # 檢查是否達成（不發放獎勵，只標記為 UNLOCKED）
            if progress_data['is_completed'] and progress.status == AchievementStatus.IN_PROGRESS.value:
                progress.status = AchievementStatus.UNLOCKED.value
                progress.unlocked_at = datetime.utcnow()
                newly_unlocked_count += 1

        await self.db.commit()

        return {
            'user_id': str(user_id),
            'total_achievements': len(achievements),
            'updated_count': updated_count,
            'newly_unlocked_count': newly_unlocked_count
        }
