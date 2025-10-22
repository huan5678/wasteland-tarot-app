"""
TDD 單元測試 - Cards Story API Endpoints

這些測試遵循 Red-Green-Refactor 循環：
1. 🔴 Red: 先寫失敗的測試（當前階段）
2. 🟢 Green: 實作最小功能讓測試通過
3. 🔵 Refactor: 優化代碼（保持測試綠燈）

測試範圍：
- GET /api/v1/cards/{id}?include_story=true - 返回帶故事的卡牌
- GET /api/v1/cards/{id}?include_story=false - 不返回故事欄位
- GET /api/v1/cards?include_story=true - 批次查詢（性能測試）
- POST /api/v1/cards/{id}/story - 更新故事內容（需認證）
"""

import pytest
import time
from typing import Dict, Any
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.models.user import User
from app.models.wasteland_card import WastelandCard
from app.core.security import create_access_token


# ============================================================
# 🔵 Refactor: 共用測試資料常數（從 test_story_schema.py 複用）
# ============================================================

VALID_STORY_VAULT_101 = (
    "在2277年10月23日的早晨，101號避難所的大門終於緩緩開啟。"
    "一個年輕的居民站在出口處，手持父親留下的Pip-Boy 3000，"
    "眼前是他從未見過的荒涼世界。首都廢土在核戰後已經過了200年，"
    "到處都是輻射、變種生物和危險的掠奪者。但他必須踏上這段旅程，"
    "去尋找失蹤的父親。Brotherhood of Steel的士兵告訴他，"
    "他的父親可能在進行一個名為「淨水計畫」的研究，"
    "這個計畫有可能改變整個首都廢土的命運，讓所有人都能獲得乾淨的水源。"
    "他深呼吸一口氣，踏出了避難所的第一步。"
)


@pytest.mark.asyncio
@pytest.mark.api
class TestCardsStoryMode:
    """🔴 Red: 綜合測試 Cards Story Mode 功能（預期失敗）"""

    async def test_cards_story_mode_complete(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """綜合測試：GET /cards/{id} 和 GET /cards 的 include_story 參數、預設行為、快取和性能"""

        # ========== Part 1: GET /cards/{id} with include_story=true ==========
        # 建立帶故事的測試卡牌
        test_card_1 = WastelandCard(
            name="The Wanderer",
            suit="major_arcana",
            number=0,
            upright_meaning="New beginnings",
            reversed_meaning="Fear of change",
            radiation_level=0.3,
            threat_level=5,
            # 故事欄位
            story_background=VALID_STORY_VAULT_101,
            story_character="Lone Wanderer",
            story_location="Vault 101 出口",
            story_timeline="2277 年",
            story_faction_involved=["vault_dweller", "brotherhood"],
            story_related_quest="Following in His Footsteps"
        )
        db_session.add(test_card_1)
        await db_session.commit()
        await db_session.refresh(test_card_1)
        card_id_1 = str(test_card_1.id)

        # 請求帶故事的卡牌
        response_with_story = await async_client.get(
            f"/api/v1/cards/{card_id_1}",
            params={"include_story": True}
        )

        # 驗證回應
        assert response_with_story.status_code == status.HTTP_200_OK
        card_data_with_story = response_with_story.json()

        # 驗證基本卡牌資料
        assert card_data_with_story["id"] == card_id_1
        assert card_data_with_story["name"] == "The Wanderer"
        assert card_data_with_story["suit"] == "major_arcana"

        # 驗證故事資料存在
        assert "story" in card_data_with_story
        assert card_data_with_story["story"] is not None
        assert card_data_with_story["story"]["background"] == VALID_STORY_VAULT_101
        assert card_data_with_story["story"]["character"] == "Lone Wanderer"
        assert card_data_with_story["story"]["timeline"] == "2277 年"
        assert "vault_dweller" in card_data_with_story["story"]["factions_involved"]

        # 驗證快取 headers
        assert "Cache-Control" in response_with_story.headers
        assert "public" in response_with_story.headers["Cache-Control"]
        assert "max-age=3600" in response_with_story.headers["Cache-Control"]

        # ========== Part 2: GET /cards/{id} with include_story=false ==========
        response_without_story = await async_client.get(
            f"/api/v1/cards/{card_id_1}",
            params={"include_story": False}
        )

        # 驗證回應
        assert response_without_story.status_code == status.HTTP_200_OK
        card_data_without_story = response_without_story.json()

        # 驗證基本卡牌資料存在
        assert card_data_without_story["id"] == card_id_1
        assert card_data_without_story["name"] == "The Wanderer"

        # 驗證故事資料不存在（優化性能）
        assert "story" not in card_data_without_story or card_data_without_story.get("story") is None

        # ========== Part 3: GET /cards/{id} 預設行為（不指定 include_story） ==========
        response_default = await async_client.get(f"/api/v1/cards/{card_id_1}")

        # 驗證回應
        assert response_default.status_code == status.HTTP_200_OK
        card_data_default = response_default.json()

        # 預設應該不包含故事（性能優化）
        assert "story" not in card_data_default or card_data_default.get("story") is None

        # ========== Part 4: GET /cards with include_story=true ==========
        # 建立 3 張帶故事的測試卡牌
        for i in range(3):
            card = WastelandCard(
                name=f"Story Card {i}",
                suit="major_arcana",
                number=i,
                upright_meaning="Test",
                reversed_meaning="Test",
                story_background=VALID_STORY_VAULT_101,
                story_character=f"Character {i}"
            )
            db_session.add(card)
        await db_session.commit()

        # 批次查詢帶故事
        response_list_with_story = await async_client.get(
            "/api/v1/cards",
            params={"include_story": True}
        )

        # 驗證回應
        assert response_list_with_story.status_code == status.HTTP_200_OK
        data_with_story = response_list_with_story.json()

        # 驗證分頁結構
        assert "cards" in data_with_story
        assert "total_count" in data_with_story
        assert "page" in data_with_story
        assert "page_size" in data_with_story
        assert "has_more" in data_with_story

        cards_with_story = data_with_story["cards"]
        assert isinstance(cards_with_story, list)
        assert len(cards_with_story) >= 3

        # 驗證至少前 3 張卡有故事
        for card_data in cards_with_story[:3]:
            if card_data["name"].startswith("Story Card"):
                assert "story" in card_data
                assert card_data["story"] is not None
                assert card_data["story"]["background"] == VALID_STORY_VAULT_101

        # ========== Part 5: GET /cards with include_story=false ==========
        response_list_without_story = await async_client.get(
            "/api/v1/cards",
            params={"include_story": False}
        )

        # 驗證回應
        assert response_list_without_story.status_code == status.HTTP_200_OK
        data_without_story = response_list_without_story.json()

        # 驗證分頁結構
        assert "cards" in data_without_story
        cards_without_story = data_without_story["cards"]

        # 驗證所有卡牌都沒有故事欄位
        for card_data in cards_without_story:
            assert "story" not in card_data or card_data.get("story") is None

        # ========== Part 6: GET /cards 性能測試 ==========
        # 建立更多卡牌模擬真實場景
        for i in range(17):  # 加上前面的3張，總共20張
            card = WastelandCard(
                name=f"Performance Card {i}",
                suit="radiation_rods",
                number=i % 14 + 1,
                upright_meaning="Test",
                reversed_meaning="Test",
                story_background=VALID_STORY_VAULT_101 if i % 2 == 0 else None
            )
            db_session.add(card)
        await db_session.commit()

        # 測試查詢性能
        start_time = time.time()
        response_perf = await async_client.get(
            "/api/v1/cards",
            params={"include_story": False}
        )
        elapsed_ms = (time.time() - start_time) * 1000

        # 驗證回應和性能
        assert response_perf.status_code == status.HTTP_200_OK
        assert elapsed_ms < 150, f"Query took {elapsed_ms:.2f}ms, expected <150ms"


@pytest.mark.asyncio
@pytest.mark.api
class TestUpdateCardStory:
    """🔴 Red: 測試 POST /api/v1/cards/{id}/story 更新故事（預期失敗）"""

    async def test_update_story_complete(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """綜合測試：POST /cards/{id}/story 的認證、完整更新、部分更新、驗證和錯誤處理"""

        # ========== Part 1: 測試未認證使用者無法更新故事 ==========
        # 建立測試卡牌
        test_card_auth = WastelandCard(
            name="Auth Test Card",
            suit="major_arcana",
            upright_meaning="Test",
            reversed_meaning="Test"
        )
        db_session.add(test_card_auth)
        await db_session.commit()
        await db_session.refresh(test_card_auth)
        card_id_auth = str(test_card_auth.id)

        # 嘗試更新故事（未認證）
        story_data_auth = {
            "background": VALID_STORY_VAULT_101,
            "character": "Test Character",
            "timeline": "2277 年"
        }

        response_auth = await async_client.post(
            f"/api/v1/cards/{card_id_auth}/story",
            json=story_data_auth
        )

        # 應該返回 401 Unauthorized
        assert response_auth.status_code == status.HTTP_401_UNAUTHORIZED

        # ========== Part 2: 測試認證使用者可以完整更新故事 ==========
        # 建立測試使用者
        test_user = User(
            name="test_user",
            email="test@example.com",
            password_hash="fake_hash",
            is_active=True
        )
        db_session.add(test_user)

        # 建立測試卡牌
        test_card_update = WastelandCard(
            name="Update Test Card",
            suit="major_arcana",
            upright_meaning="Test",
            reversed_meaning="Test"
        )
        db_session.add(test_card_update)
        await db_session.commit()
        await db_session.refresh(test_card_update)
        card_id_update = str(test_card_update.id)

        # 建立認證 token（sub 應該是 user ID，不是 email）
        await db_session.refresh(test_user)
        access_token = create_access_token(data={"sub": str(test_user.id)})

        # 更新故事（已認證）
        story_data_full = {
            "background": VALID_STORY_VAULT_101,
            "character": "Updated Character",
            "location": "Updated Location",
            "timeline": "2287 年",
            "factions_involved": ["minutemen", "railroad"]
        }

        response_full_update = await async_client.post(
            f"/api/v1/cards/{card_id_update}/story",
            json=story_data_full,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # 應該成功更新
        assert response_full_update.status_code == status.HTTP_200_OK
        updated_card_full = response_full_update.json()

        # 驗證更新內容
        assert updated_card_full["story"]["background"] == VALID_STORY_VAULT_101
        assert updated_card_full["story"]["character"] == "Updated Character"
        assert updated_card_full["story"]["timeline"] == "2287 年"
        assert "minutemen" in updated_card_full["story"]["factions_involved"]

        # ========== Part 3: 測試部分更新故事欄位 ==========
        # 建立已有故事的卡牌
        test_card_partial = WastelandCard(
            name="Partial Update Card",
            suit="major_arcana",
            upright_meaning="Test",
            reversed_meaning="Test",
            story_background=VALID_STORY_VAULT_101,
            story_character="Original Character",
            story_timeline="2277 年"
        )
        db_session.add(test_card_partial)
        await db_session.commit()
        await db_session.refresh(test_card_partial)
        card_id_partial = str(test_card_partial.id)

        # 只更新部分欄位
        partial_update = {
            "character": "New Character",
            "location": "New Location"
        }

        response_partial = await async_client.post(
            f"/api/v1/cards/{card_id_partial}/story",
            json=partial_update,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # 應該成功部分更新
        assert response_partial.status_code == status.HTTP_200_OK
        updated_card_partial = response_partial.json()

        # 驗證部分更新成功，其他欄位保持不變
        assert updated_card_partial["story"]["character"] == "New Character"
        assert updated_card_partial["story"]["location"] == "New Location"
        assert updated_card_partial["story"]["background"] == VALID_STORY_VAULT_101  # 保持不變
        assert updated_card_partial["story"]["timeline"] == "2277 年"  # 保持不變

        # ========== Part 4: 測試無效的故事資料被拒絕 ==========
        # 建立測試卡牌
        test_card_validation = WastelandCard(
            name="Validation Test Card",
            suit="major_arcana",
            upright_meaning="Test",
            reversed_meaning="Test"
        )
        db_session.add(test_card_validation)
        await db_session.commit()
        await db_session.refresh(test_card_validation)
        card_id_validation = str(test_card_validation.id)

        # 嘗試更新無效的故事（背景太短）
        invalid_story = {
            "background": "太短。",  # 少於 200 字
            "character": "Test"
        }

        response_validation = await async_client.post(
            f"/api/v1/cards/{card_id_validation}/story",
            json=invalid_story,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # 應該返回驗證錯誤（422 Unprocessable Entity for Pydantic validation）
        assert response_validation.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error_data = response_validation.json()
        # 自定義錯誤格式：包含 error.code 和 error.message
        assert "error" in error_data or "detail" in error_data

        # ========== Part 5: 測試更新不存在的卡牌返回 404 ==========
        # 嘗試更新不存在的卡牌
        non_existent_id = str(uuid4())
        story_data_notfound = {
            "background": VALID_STORY_VAULT_101,
            "character": "Test"
        }

        response_notfound = await async_client.post(
            f"/api/v1/cards/{non_existent_id}/story",
            json=story_data_notfound,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # 應該返回 404 Not Found
        assert response_notfound.status_code == status.HTTP_404_NOT_FOUND
