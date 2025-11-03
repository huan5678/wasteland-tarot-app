"""
願望業務邏輯服務 - Wishlist Feature

提供願望相關的所有業務邏輯：
- 使用者方法：取得、建立、更新願望
- 管理員方法：取得、回覆、隱藏願望
- 每日限制檢查（UTC+8）
- 內容驗證整合

符合需求：R1-R6
"""

from datetime import datetime, timezone
from typing import List, Tuple, Dict, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.models.wishlist import Wishlist
from app.services.content_validator import ContentValidator
from app.utils.timezone_util import get_utc8_today_range
from app.core.exceptions import (
    AlreadySubmittedTodayError,
    WishNotFoundError,
    EditNotAllowedError,
    UnauthorizedError
)


class WishlistService:
    """
    願望服務 - 整合所有願望相關業務邏輯

    使用 Service Layer 模式，封裝業務邏輯與資料存取
    """

    def __init__(self):
        """初始化 WishlistService"""
        pass

    # ==========================================
    # User Methods
    # ==========================================

    async def get_user_wishes(
        self,
        user_id: UUID,
        db: AsyncSession
    ) -> List[Wishlist]:
        """
        取得使用者的願望列表

        查詢條件：
        - user_id 匹配
        - is_hidden = false（不顯示已隱藏的願望）
        - 按 created_at 降序排列

        Args:
            user_id: 使用者 ID
            db: 資料庫 session

        Returns:
            List[Wishlist]: 願望列表
        """
        query = (
            select(Wishlist)
            .where(
                and_(
                    Wishlist.user_id == user_id,
                    Wishlist.is_hidden == False
                )
            )
            .order_by(Wishlist.created_at.desc())
        )

        result = await db.execute(query)
        wishes = result.scalars().all()

        return list(wishes)

    async def can_submit_today(
        self,
        user_id: UUID,
        db: AsyncSession
    ) -> bool:
        """
        檢查使用者今日是否可提交願望

        使用 UTC+8 時區計算今日範圍
        檢查在今日範圍內是否已有願望

        Args:
            user_id: 使用者 ID
            db: 資料庫 session

        Returns:
            bool: True 表示可以提交，False 表示今日已提交
        """
        # 取得 UTC+8 今日範圍（UTC 時間）
        today_start_utc, tomorrow_start_utc = get_utc8_today_range()

        # 查詢今日是否已有願望
        query = (
            select(func.count(Wishlist.id))
            .where(
                and_(
                    Wishlist.user_id == user_id,
                    Wishlist.created_at >= today_start_utc,
                    Wishlist.created_at < tomorrow_start_utc
                )
            )
        )

        result = await db.execute(query)
        count = result.scalar()

        return count == 0

    async def create_wish(
        self,
        user_id: UUID,
        content: str,
        db: AsyncSession
    ) -> Wishlist:
        """
        建立新願望

        流程：
        1. 檢查每日限制
        2. 驗證內容（使用 ContentValidator）
        3. 建立 Wishlist 實例
        4. 儲存至資料庫

        Args:
            user_id: 使用者 ID
            content: 願望內容（Markdown）
            db: 資料庫 session

        Returns:
            Wishlist: 新建立的願望

        Raises:
            AlreadySubmittedTodayError: 今日已提交願望
            ContentEmptyError: 內容為空
            ContentTooLongError: 內容超過 500 字
        """
        # 檢查每日限制
        can_submit = await self.can_submit_today(user_id, db)
        if not can_submit:
            raise AlreadySubmittedTodayError("今日已提交願望，明日再來許願吧")

        # 驗證內容
        ContentValidator.validate_wish_content(content)

        # 建立願望
        wish = Wishlist(
            user_id=user_id,
            content=content,
            has_been_edited=False,
            is_hidden=False
        )

        db.add(wish)
        await db.commit()
        await db.refresh(wish)

        return wish

    async def update_wish(
        self,
        wish_id: UUID,
        user_id: UUID,
        content: str,
        db: AsyncSession
    ) -> Wishlist:
        """
        更新願望內容

        流程：
        1. 查詢願望
        2. 檢查擁有權
        3. 檢查編輯權限（can_be_edited）
        4. 驗證新內容
        5. 更新內容並設定 has_been_edited = True

        Args:
            wish_id: 願望 ID
            user_id: 使用者 ID
            content: 新內容（Markdown）
            db: 資料庫 session

        Returns:
            Wishlist: 更新後的願望

        Raises:
            WishNotFoundError: 願望不存在
            UnauthorizedError: 不是願望擁有者
            EditNotAllowedError: 不允許編輯（已有回覆或已編輯過）
            ContentEmptyError: 內容為空
            ContentTooLongError: 內容超過 500 字
        """
        # 查詢願望
        query = select(Wishlist).where(Wishlist.id == wish_id)
        result = await db.execute(query)
        wish = result.scalar_one_or_none()

        if not wish:
            raise WishNotFoundError(str(wish_id))

        # 檢查擁有權
        if wish.user_id != user_id:
            raise UnauthorizedError("無權限編輯此願望")

        # 檢查編輯權限
        if not wish.can_be_edited():
            if wish.admin_reply:
                raise EditNotAllowedError("已有管理員回覆，無法編輯")
            else:
                raise EditNotAllowedError("已編輯過，無法再次編輯")

        # 驗證新內容
        ContentValidator.validate_wish_content(content)

        # 更新內容
        wish.content = content
        wish.has_been_edited = True
        wish.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(wish)

        return wish

    # ==========================================
    # Admin Methods
    # ==========================================

    async def get_admin_wishes(
        self,
        filters: Dict[str, Optional[bool]],
        sort: str,
        page: int,
        per_page: int,
        db: AsyncSession
    ) -> Tuple[List[Wishlist], int]:
        """
        取得管理員願望列表（支援篩選、排序、分頁）

        篩選條件：
        - replied: True (已回覆), False (未回覆), None (全部)
        - hidden: True (已隱藏), False (未隱藏), None (全部)

        排序：
        - newest: 最新優先（created_at DESC）
        - oldest: 最舊優先（created_at ASC）

        分頁：
        - page: 頁碼（從 1 開始）
        - per_page: 每頁筆數（預設 50，最多 100）

        Args:
            filters: 篩選條件字典 {"replied": bool, "hidden": bool}
            sort: 排序方式 ("newest" | "oldest")
            page: 頁碼
            per_page: 每頁筆數
            db: 資料庫 session

        Returns:
            Tuple[List[Wishlist], int]: (願望列表, 總筆數)
        """
        # 限制每頁筆數
        per_page = min(per_page, 100)

        # 建立基礎查詢
        query = select(Wishlist)
        count_query = select(func.count(Wishlist.id))

        # 應用篩選條件
        conditions = []

        # 回覆狀態篩選
        if filters.get("replied") is True:
            conditions.append(Wishlist.admin_reply.isnot(None))
        elif filters.get("replied") is False:
            conditions.append(Wishlist.admin_reply.is_(None))

        # 隱藏狀態篩選
        if filters.get("hidden") is True:
            conditions.append(Wishlist.is_hidden == True)
        elif filters.get("hidden") is False:
            conditions.append(Wishlist.is_hidden == False)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # 應用排序
        if sort == "oldest":
            query = query.order_by(Wishlist.created_at.asc())
        else:  # newest (預設)
            query = query.order_by(Wishlist.created_at.desc())

        # 應用分頁
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # 執行查詢
        result = await db.execute(query)
        wishes = result.scalars().all()

        # 取得總筆數
        count_result = await db.execute(count_query)
        total = count_result.scalar()

        return list(wishes), total

    async def add_or_update_reply(
        self,
        wish_id: UUID,
        reply: str,
        db: AsyncSession
    ) -> Wishlist:
        """
        新增或編輯管理員回覆

        流程：
        1. 查詢願望
        2. 驗證回覆內容（使用 ContentValidator）
        3. 更新 admin_reply 與 admin_reply_timestamp

        Args:
            wish_id: 願望 ID
            reply: 管理員回覆內容（Markdown）
            db: 資料庫 session

        Returns:
            Wishlist: 更新後的願望

        Raises:
            WishNotFoundError: 願望不存在
            ContentEmptyError: 回覆為空
            ContentTooLongError: 回覆超過 1000 字
        """
        # 查詢願望
        query = select(Wishlist).where(Wishlist.id == wish_id)
        result = await db.execute(query)
        wish = result.scalar_one_or_none()

        if not wish:
            raise WishNotFoundError(str(wish_id))

        # 驗證回覆內容
        ContentValidator.validate_admin_reply(reply)

        # 更新回覆
        wish.admin_reply = reply
        wish.admin_reply_timestamp = datetime.now(timezone.utc)
        wish.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(wish)

        return wish

    async def toggle_hidden(
        self,
        wish_id: UUID,
        is_hidden: bool,
        db: AsyncSession
    ) -> Wishlist:
        """
        切換願望的隱藏狀態

        Args:
            wish_id: 願望 ID
            is_hidden: 是否隱藏
            db: 資料庫 session

        Returns:
            Wishlist: 更新後的願望

        Raises:
            WishNotFoundError: 願望不存在
        """
        # 查詢願望
        query = select(Wishlist).where(Wishlist.id == wish_id)
        result = await db.execute(query)
        wish = result.scalar_one_or_none()

        if not wish:
            raise WishNotFoundError(str(wish_id))

        # 更新隱藏狀態
        wish.is_hidden = is_hidden
        wish.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(wish)

        return wish
