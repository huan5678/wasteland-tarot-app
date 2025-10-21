"""
Share Service - 占卜結果分享功能

提供分享連結生成和公開資料查詢功能。

TDD Green Phase: 讓測試通過的最簡單實作

Features:
- generate_share_link(): 生成唯讀分享連結
- get_public_reading_data(): 獲取公開占卜資料
- 冪等性設計、隱私保護、權限驗證
"""

from uuid import UUID
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.reading_enhanced import CompletedReading
from app.config import settings


class ShareService:
    """占卜結果分享服務"""

    def __init__(self, db_session: AsyncSession):
        """
        初始化 ShareService

        Args:
            db_session: 資料庫 session
        """
        self.db = db_session

    async def generate_share_link(self, reading_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """
        生成或獲取分享連結

        這個方法是冪等的：重複呼叫會返回相同的 share_token。

        Args:
            reading_id: 占卜 ID
            user_id: 當前用戶 ID

        Returns:
            包含 share_token, share_url, created_at 的字典

        Raises:
            HTTPException(404): Reading 不存在
            HTTPException(403): 用戶不是占卜的擁有者

        Example:
            >>> share_service = ShareService(db_session)
            >>> result = await share_service.generate_share_link(reading_id, user_id)
            >>> print(result['share_url'])
            https://example.com/share/550e8400-e29b-41d4-a716-446655440000
        """
        # 1. 載入 reading
        stmt = select(CompletedReading).where(CompletedReading.id == reading_id)
        result = await self.db.execute(stmt)
        reading = result.scalar_one_or_none()

        if not reading:
            raise HTTPException(status_code=404, detail="Reading not found")

        # 2. 驗證擁有者
        if reading.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not the owner of this reading")

        # 3. 生成或重用 token (冪等)
        if not reading.share_token:
            reading.share_token = reading.generate_share_token()
            await self.db.commit()
            await self.db.refresh(reading)

        # 4. 返回結果
        share_url = self._build_share_url(reading.share_token)

        return {
            "share_token": str(reading.share_token),
            "share_url": share_url,
            "created_at": reading.created_at.isoformat() if reading.created_at else datetime.utcnow().isoformat()
        }

    async def get_public_reading_data(self, share_token: UUID) -> Dict[str, Any]:
        """
        獲取公開的占卜資料

        根據 share_token 查詢占卜結果，並過濾私密欄位。

        Args:
            share_token: 分享 token (UUID)

        Returns:
            包含公開占卜資料的字典（不含 user_id, user_email 等私密資訊）

        Raises:
            HTTPException(404): Share link 不存在

        Example:
            >>> result = await share_service.get_public_reading_data(token)
            >>> print(result['question'])
            關於工作的問題
        """
        # 1. 載入 reading
        stmt = select(CompletedReading).where(CompletedReading.share_token == share_token)
        result = await self.db.execute(stmt)
        reading = result.scalar_one_or_none()

        if not reading:
            raise HTTPException(status_code=404, detail="Share link not found")

        # 2. 過濾私密欄位，返回公開資料
        return self._filter_private_fields(reading)

    def _filter_private_fields(self, reading: CompletedReading) -> Dict[str, Any]:
        """
        過濾私密欄位，只返回公開資料

        公開欄位:
        - reading_id, question, character_voice_used, karma_context
        - overall_interpretation, summary_message
        - created_at

        私密欄位（不返回）:
        - user_id, user (relationship)

        Args:
            reading: CompletedReading instance

        Returns:
            包含公開資料的字典
        """
        return {
            "reading_id": str(reading.id),
            "question": reading.question,
            "character_voice_used": reading.character_voice_used,
            "karma_context": reading.karma_context,
            "faction_influence": reading.faction_influence,
            "overall_interpretation": reading.overall_interpretation,
            "summary_message": reading.summary_message,
            "prediction_confidence": reading.prediction_confidence,
            "created_at": reading.created_at.isoformat() if reading.created_at else None,
        }
        # 明確不包含: user_id, user (relationship)

    def _build_share_url(self, share_token: UUID) -> str:
        """
        建立分享 URL

        Args:
            share_token: Share token (UUID)

        Returns:
            完整的分享 URL

        Example:
            >>> url = self._build_share_url(uuid4())
            >>> print(url)
            https://example.com/share/550e8400-e29b-41d4-a716-446655440000
        """
        # 從設定檔取得前端 URL
        frontend_url = settings.frontend_url
        return f"{frontend_url}/share/{share_token}"
