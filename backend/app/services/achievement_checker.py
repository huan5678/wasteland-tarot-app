"""
Achievement Checker Service
成就條件檢查與進度計算引擎
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.achievement import Achievement, UserAchievementProgress, AchievementStatus
from app.models.user_analytics import UserAnalytics
from app.models.reading_enhanced import CompletedReading, SpreadTemplate
from app.models.social_features import UserFriendship, FriendshipStatus
from app.models.bingo import UserBingoCard, UserNumberClaim, DailyBingoNumber


class AchievementChecker:
    """
    成就條件檢查引擎
    負責計算使用者對各類成就的進度並判斷是否達成解鎖條件
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_achievement_progress(
        self,
        user_id: UUID,
        achievement: Achievement
    ) -> Dict[str, Any]:
        """
        檢查使用者對特定成就的進度

        Args:
            user_id: 使用者 ID
            achievement: 成就定義

        Returns:
            Dict with keys: current_progress, target_progress, is_completed
        """
        criteria = achievement.criteria
        criteria_type = criteria.get('type')
        target = criteria.get('target', 1)
        filters = criteria.get('filters', {})

        # 根據條件類型計算進度
        if criteria_type == 'READING_COUNT':
            current = await self._check_reading_count(user_id, filters)
        elif criteria_type == 'SOCIAL_SHARE':
            current = await self._check_social_share(user_id, filters)
        elif criteria_type == 'FRIEND_COUNT':
            current = await self._check_friend_count(user_id, filters)
        elif criteria_type == 'BINGO_LINE':
            current = await self._check_bingo_line(user_id, filters)
        elif criteria_type == 'CONSECUTIVE_LOGIN':
            current = await self._check_consecutive_login(user_id, filters)
        elif criteria_type == 'KARMA_THRESHOLD':
            current = await self._check_karma_threshold(user_id, filters)
        elif criteria_type == 'CARD_VIEW':
            current = await self._check_card_view(user_id, filters)
        elif criteria_type == 'PLAYLIST_CREATE':
            current = await self._check_playlist_create(user_id, filters)
        elif criteria_type == 'TIME_BASED':
            current = await self._check_time_based(user_id, filters)
        else:
            # 未知類型，返回 0
            current = 0

        return {
            'current_progress': current,
            'target_progress': target,
            'is_completed': current >= target
        }

    async def _check_reading_count(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查占卜次數

        Filters支援:
        - spread_type: 特定排列類型
        - character_voice: 特定角色語音
        - start_date: 開始日期
        - end_date: 結束日期
        """
        query = select(func.count(CompletedReading.id)).where(
            CompletedReading.user_id == user_id
        )

        # 套用篩選條件
        if 'spread_type' in filters:
            # ✅ 修復：CompletedReading 沒有 spread_type，需要 join SpreadTemplate
            query = query.join(
                SpreadTemplate,
                CompletedReading.spread_template_id == SpreadTemplate.id
            ).where(SpreadTemplate.spread_type == filters['spread_type'])

        if 'character_voice' in filters:
            query = query.where(CompletedReading.character_voice_used == filters['character_voice'])

        if 'start_date' in filters:
            start = datetime.fromisoformat(filters['start_date'])
            query = query.where(CompletedReading.created_at >= start)

        if 'end_date' in filters:
            end = datetime.fromisoformat(filters['end_date'])
            query = query.where(CompletedReading.created_at <= end)

        result = await self.db.execute(query)
        count = result.scalar_one()
        return count

    async def _check_social_share(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查社交分享次數
        從 UserAnalytics 獲取分享數量
        """
        query = select(UserAnalytics.shares_count).where(
            UserAnalytics.user_id == user_id
        )

        result = await self.db.execute(query)
        analytics = result.scalar_one_or_none()
        return analytics if analytics else 0

    async def _check_friend_count(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查好友數量
        只計算已接受的好友關係
        """
        query = select(func.count(UserFriendship.id)).where(
            and_(
                or_(
                    UserFriendship.requester_id == user_id,
                    UserFriendship.recipient_id == user_id
                ),
                UserFriendship.status == FriendshipStatus.ACCEPTED.value
            )
        )

        result = await self.db.execute(query)
        count = result.scalar_one()
        return count

    async def _check_bingo_line(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查 Bingo 連線次數

        Filters支援:
        - month_year: 特定月份 (YYYY-MM)
        """
        # 這需要查詢 BingoReward 表來計算連線次數
        # 由於 BingoReward 記錄每次連線獎勵，可以直接計數
        from app.models.bingo import BingoReward

        query = select(func.count(BingoReward.id)).where(
            BingoReward.user_id == user_id
        )

        if 'month_year' in filters:
            # 篩選特定月份
            month_year = filters['month_year']
            query = query.join(UserBingoCard).where(
                UserBingoCard.month_year == month_year
            )

        result = await self.db.execute(query)
        count = result.scalar_one()
        return count

    async def _check_consecutive_login(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查連續簽到天數
        從 Bingo 系統的 UserNumberClaim 計算連續簽到
        """
        # 獲取最近 30 天的簽到記錄
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        query = select(UserNumberClaim.claim_date).where(
            and_(
                UserNumberClaim.user_id == user_id,
                UserNumberClaim.claim_date >= thirty_days_ago.date()
            )
        ).order_by(desc(UserNumberClaim.claim_date))

        result = await self.db.execute(query)
        claim_dates = [row[0] for row in result.all()]

        if not claim_dates:
            return 0

        # 計算連續天數
        consecutive_days = 1
        for i in range(len(claim_dates) - 1):
            current_date = claim_dates[i]
            next_date = claim_dates[i + 1]

            # 檢查是否連續（相差 1 天）
            if (current_date - next_date).days == 1:
                consecutive_days += 1
            else:
                break

        return consecutive_days

    async def _check_karma_threshold(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查 Karma 分數
        直接從 User 表獲取當前 Karma
        """
        from app.models.user import User

        query = select(User.karma_score).where(User.id == user_id)
        result = await self.db.execute(query)
        karma = result.scalar_one_or_none()

        return karma if karma else 0

    async def _check_card_view(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查卡牌查看次數
        從 UserAnalytics 的 favorited_cards 計算

        Filters支援:
        - card_suit: 特定花色 (major_arcana, cups, swords, etc.)
        """
        query = select(UserAnalytics.favorited_cards).where(
            UserAnalytics.user_id == user_id
        )

        result = await self.db.execute(query)
        favorited = result.scalar_one_or_none()

        if not favorited:
            return 0

        # 如果有花色篩選，需要進一步過濾
        if 'card_suit' in filters:
            # 這需要 join WastelandCard 來篩選花色
            # 為簡化，暫時返回總數
            return len(favorited)

        return len(favorited)

    async def _check_playlist_create(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查播放清單建立數量

        ⚠️ 暫時返回 0：Playlist model 尚未實作
        """
        # TODO: 實作 Playlist model 後啟用
        # from app.models.music import Playlist
        # query = select(func.count(Playlist.id)).where(
        #     Playlist.user_id == user_id
        # )
        # result = await self.db.execute(query)
        # count = result.scalar_one()
        # return count

        return 0  # 暫時返回 0，直到 Playlist 功能實作

    async def _check_time_based(
        self,
        user_id: UUID,
        filters: Dict[str, Any]
    ) -> int:
        """
        檢查時間相關成就

        Filters支援:
        - time_range: 時間範圍 (midnight, morning, evening)
        """
        # 從 UserAnalytics 的 reading_times 檢查
        query = select(UserAnalytics.reading_times).where(
            UserAnalytics.user_id == user_id
        )

        result = await self.db.execute(query)
        reading_times = result.scalar_one_or_none()

        if not reading_times or not filters.get('time_range'):
            return 0

        time_range = filters['time_range']

        # 定義時間範圍
        time_ranges = {
            'midnight': range(0, 6),      # 00:00 - 05:59
            'morning': range(6, 12),      # 06:00 - 11:59
            'afternoon': range(12, 18),   # 12:00 - 17:59
            'evening': range(18, 24)      # 18:00 - 23:59
        }

        if time_range not in time_ranges:
            return 0

        # 計算該時間範圍的閱讀次數
        target_hours = time_ranges[time_range]
        count = sum(1 for hour in reading_times if hour in target_hours)

        return count

    async def check_and_unlock_achievements(
        self,
        user_id: UUID,
        achievement_codes: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        檢查並解鎖使用者的成就

        Args:
            user_id: 使用者 ID
            achievement_codes: 要檢查的成就代碼列表（None = 檢查所有）

        Returns:
            List of newly unlocked achievements
        """
        # 獲取要檢查的成就
        query = select(Achievement).where(Achievement.is_active == True)
        if achievement_codes:
            query = query.where(Achievement.code.in_(achievement_codes))

        result = await self.db.execute(query)
        achievements = result.scalars().all()

        newly_unlocked = []

        for achievement in achievements:
            # 檢查使用者進度
            progress_query = select(UserAchievementProgress).where(
                and_(
                    UserAchievementProgress.user_id == user_id,
                    UserAchievementProgress.achievement_id == achievement.id
                )
            )
            progress_result = await self.db.execute(progress_query)
            user_progress = progress_result.scalar_one_or_none()

            # 計算最新進度
            progress_data = await self.check_achievement_progress(user_id, achievement)

            if not user_progress:
                # 建立新的進度記錄
                user_progress = UserAchievementProgress(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    current_progress=progress_data['current_progress'],
                    target_progress=progress_data['target_progress'],
                    status=AchievementStatus.IN_PROGRESS.value
                )
                self.db.add(user_progress)
            else:
                # 更新現有進度
                user_progress.current_progress = progress_data['current_progress']
                user_progress.target_progress = progress_data['target_progress']

            # 檢查是否達成解鎖條件
            if progress_data['is_completed'] and user_progress.status == AchievementStatus.IN_PROGRESS.value:
                user_progress.status = AchievementStatus.UNLOCKED.value
                user_progress.unlocked_at = datetime.utcnow()

                newly_unlocked.append({
                    'achievement': achievement,
                    'progress': user_progress
                })

        await self.db.commit()

        return newly_unlocked

    async def get_user_progress_summary(
        self,
        user_id: UUID,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        獲取使用者成就進度總覽

        Args:
            user_id: 使用者 ID
            category: 成就類別篩選（可選）

        Returns:
            Dict with progress summary
        """
        # 獲取所有成就
        achievements_query = select(Achievement).where(Achievement.is_active == True)
        if category:
            achievements_query = achievements_query.where(Achievement.category == category)

        achievements_result = await self.db.execute(achievements_query)
        all_achievements = achievements_result.scalars().all()

        # 獲取使用者進度
        progress_query = select(UserAchievementProgress).where(
            UserAchievementProgress.user_id == user_id
        )
        progress_result = await self.db.execute(progress_query)
        user_progress_list = progress_result.scalars().all()

        # 建立進度字典
        progress_dict = {p.achievement_id: p for p in user_progress_list}

        # 統計數據
        total = len(all_achievements)
        unlocked = sum(1 for p in user_progress_list if p.status == AchievementStatus.UNLOCKED.value)
        claimed = sum(1 for p in user_progress_list if p.status == AchievementStatus.CLAIMED.value)
        in_progress = total - unlocked - claimed

        completion_percentage = ((unlocked + claimed) / total * 100) if total > 0 else 0.0

        return {
            'user_id': str(user_id),
            'total_achievements': total,
            'unlocked_count': unlocked,
            'claimed_count': claimed,
            'in_progress_count': in_progress,
            'completion_percentage': round(completion_percentage, 2),
            'progress_details': progress_dict
        }
