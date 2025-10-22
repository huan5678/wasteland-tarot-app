"""
Test suite for ShareService (Phase 2: Reading Share Link)

TDD Red Phase: 先寫測試，確保測試會失敗

Tests:
- generate_share_link() - 生成分享連結
- get_public_reading_data() - 獲取公開占卜資料
- 冪等性、權限驗證、資料過濾
"""

import pytest
from uuid import uuid4
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.share_service import ShareService
from app.models.reading_enhanced import CompletedReading
from app.models.user import User


@pytest.mark.asyncio
class TestShareServiceGenerateLink:
    """測試 generate_share_link 功能"""

    async def test_generate_new_share_token(self, db_session: AsyncSession):
        """測試首次生成 share_token"""
        # RED: ShareService 尚未實作，測試會失敗

        # 準備測試資料
        user = User(id=uuid4(), email="test@example.com", username="testuser")
        db_session.add(user)

        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            privacy_level="private",
            share_token=None  # 初始沒有 token
        )
        db_session.add(reading)
        await db_session.commit()

        # 執行測試
        share_service = ShareService(db_session)
        result = await share_service.generate_share_link(reading.id, user.id)

        # 驗證結果
        assert result is not None
        assert 'share_token' in result
        assert 'share_url' in result
        assert 'created_at' in result

        # 驗證 share_token 是有效的 UUID
        from uuid import UUID
        token_uuid = UUID(result['share_token'])
        assert token_uuid.version == 4

        # 驗證 URL 格式
        assert result['share_url'].startswith('http')
        assert result['share_token'] in result['share_url']

    async def test_idempotent_token_generation(self, db_session: AsyncSession):
        """測試重複生成返回相同 token (冪等性)"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="test@example.com", username="testuser")
        db_session.add(user)

        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            share_token=None
        )
        db_session.add(reading)
        await db_session.commit()

        share_service = ShareService(db_session)

        # 第一次生成
        result1 = await share_service.generate_share_link(reading.id, user.id)

        # 第二次生成（應該返回相同 token）
        result2 = await share_service.generate_share_link(reading.id, user.id)

        # 驗證冪等性
        assert result1['share_token'] == result2['share_token']
        assert result1['share_url'] == result2['share_url']

    async def test_non_owner_cannot_share(self, db_session: AsyncSession):
        """測試非擁有者無法生成分享連結 (403)"""
        # RED: 測試會失敗

        owner = User(id=uuid4(), email="owner@example.com", username="owner")
        other_user = User(id=uuid4(), email="other@example.com", username="other")
        db_session.add(owner)
        db_session.add(other_user)

        reading = CompletedReading(
            id=uuid4(),
            user_id=owner.id,
            question="Owner's reading",
            character_voice_used="ghoul",
            karma_context="neutral"
        )
        db_session.add(reading)
        await db_session.commit()

        share_service = ShareService(db_session)

        # 其他用戶嘗試分享（應該失敗）
        with pytest.raises(HTTPException) as exc:
            await share_service.generate_share_link(reading.id, other_user.id)

        assert exc.value.status_code == 403
        assert "not the owner" in exc.value.detail.lower()

    async def test_reading_not_found(self, db_session: AsyncSession):
        """測試 Reading 不存在 (404)"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="test@example.com", username="testuser")
        db_session.add(user)
        await db_session.commit()

        share_service = ShareService(db_session)
        fake_reading_id = uuid4()

        with pytest.raises(HTTPException) as exc:
            await share_service.generate_share_link(fake_reading_id, user.id)

        assert exc.value.status_code == 404
        assert "not found" in exc.value.detail.lower()

    async def test_token_is_uuid_v4(self, db_session: AsyncSession):
        """測試生成的 token 是 UUID v4"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="test@example.com", username="testuser")
        db_session.add(user)

        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral"
        )
        db_session.add(reading)
        await db_session.commit()

        share_service = ShareService(db_session)
        result = await share_service.generate_share_link(reading.id, user.id)

        from uuid import UUID
        token_uuid = UUID(result['share_token'])
        assert token_uuid.version == 4, "Token should be UUID v4"


@pytest.mark.asyncio
class TestShareServiceGetPublicData:
    """測試 get_public_reading_data 功能"""

    async def test_get_public_data_success(self, db_session: AsyncSession):
        """測試成功獲取公開資料"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="owner@example.com", username="owner")
        db_session.add(user)

        share_token = uuid4()
        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            overall_interpretation="Test interpretation",
            share_token=share_token
        )
        db_session.add(reading)
        await db_session.commit()

        share_service = ShareService(db_session)
        result = await share_service.get_public_reading_data(share_token)

        # 驗證包含公開欄位
        assert 'reading_id' in result
        assert 'question' in result
        assert 'overall_interpretation' in result
        assert 'created_at' in result

        # 驗證資料正確
        assert str(result['reading_id']) == str(reading.id)
        assert result['question'] == reading.question

    async def test_filters_private_fields(self, db_session: AsyncSession):
        """測試不返回私密欄位"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="secret@example.com", username="secretuser")
        db_session.add(user)

        share_token = uuid4()
        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            share_token=share_token
        )
        db_session.add(reading)
        await db_session.commit()

        share_service = ShareService(db_session)
        result = await share_service.get_public_reading_data(share_token)

        # 確保不包含私密資料
        assert 'user_id' not in result
        assert 'user' not in result
        # user_email 和 user_name 不應該出現

    async def test_token_not_found(self, db_session: AsyncSession):
        """測試 token 不存在 (404)"""
        # RED: 測試會失敗

        share_service = ShareService(db_session)
        fake_token = uuid4()

        with pytest.raises(HTTPException) as exc:
            await share_service.get_public_reading_data(fake_token)

        assert exc.value.status_code == 404
        assert "not found" in exc.value.detail.lower()

    async def test_includes_all_public_fields(self, db_session: AsyncSession):
        """測試包含所有必要的公開欄位"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="test@example.com", username="testuser")
        db_session.add(user)

        share_token = uuid4()
        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            overall_interpretation="Test interpretation",
            summary_message="Test summary",
            share_token=share_token
        )
        db_session.add(reading)
        await db_session.commit()

        share_service = ShareService(db_session)
        result = await share_service.get_public_reading_data(share_token)

        # 必須包含的欄位
        required_fields = ['reading_id', 'question', 'overall_interpretation', 'created_at']
        for field in required_fields:
            assert field in result, f"Missing required field: {field}"
