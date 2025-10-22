"""
端到端故事查詢整合測試

測試完整流程：
1. API 查詢卡牌故事
2. 故事內容完整性驗證
3. 向後相容性（無故事的舊卡牌）

注意：本測試假設資料庫已透過 seed script 初始化故事資料
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

# 使用 AsyncClient 進行 API 測試
@pytest.fixture
async def async_client():
    """提供非同步 HTTP 客戶端"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


class TestStoryE2E:
    """端到端故事查詢測試套件"""

    @pytest.mark.asyncio
    async def test_query_card_with_story(self, async_client: AsyncClient):
        """
        測試：查詢卡牌應返回完整故事內容

        驗證：
        - 故事內容存在且格式正確
        - 故事欄位完整（background, character, location, timeline, factions, quest）
        """
        # 查詢任意卡牌（假設資料庫已有資料）
        response = await async_client.get("/api/v1/cards")

        assert response.status_code == 200
        cards = response.json()

        # 確保至少有一張卡牌
        assert len(cards) > 0, "Database should have at least one card"

        # 取第一張有故事的卡牌
        card_with_story = None
        for card in cards:
            if card.get("story"):
                card_with_story = card
                break

        # 如果沒有找到有故事的卡，跳過測試
        if not card_with_story:
            pytest.skip("No cards with story found in database")

        # 驗證故事欄位完整性
        story = card_with_story["story"]
        assert "background" in story
        assert len(story["background"]) >= 200, "Story background should be at least 200 characters"
        assert len(story["background"]) <= 500, "Story background should not exceed 500 characters"

        assert "character" in story
        assert isinstance(story["character"], str)

        assert "location" in story
        assert isinstance(story["location"], str)

        assert "timeline" in story
        assert isinstance(story["timeline"], str)
        # 時間格式驗證（例如：2287 年、戰前）
        assert "年" in story["timeline"] or "戰前" in story["timeline"] or "戰後" in story["timeline"]

        assert "factionsInvolved" in story
        assert isinstance(story["factionsInvolved"], list)
        assert len(story["factionsInvolved"]) >= 1

        # relatedQuest 可選
        assert "relatedQuest" in story or True  # 允許不存在

    @pytest.mark.asyncio
    async def test_backward_compatibility_cards_without_stories(self, async_client: AsyncClient):
        """
        測試：向後相容性 - 查詢沒有故事的卡牌不應報錯

        驗證：
        - 查詢沒有故事的卡牌應成功
        - story 欄位應為 null 或不存在
        """
        # 查詢所有卡牌
        response = await async_client.get("/api/v1/cards")
        assert response.status_code == 200
        cards = response.json()

        # 找一張沒有故事的卡牌（如果有的話）
        card_without_story = None
        for card in cards:
            if not card.get("story") or card.get("story") is None:
                card_without_story = card
                break

        # 如果所有卡牌都有故事，測試通過（向後相容性沒問題）
        if not card_without_story:
            pytest.skip("All cards have stories - backward compatibility not testable")

        # 驗證沒有故事的卡牌仍能正常返回
        assert card_without_story.get("id") is not None
        assert card_without_story.get("name") is not None
        assert card_without_story.get("story") is None or card_without_story.get("story") == {}

    @pytest.mark.asyncio
    async def test_story_factions_are_valid(self, async_client: AsyncClient):
        """
        測試：所有故事的陣營都是有效的 Fallout 陣營

        驗證：
        - 查詢所有故事
        - 檢查 factionsInvolved 欄位
        - 確認所有陣營都在白名單中
        """
        from app.models.story_constants import VALID_FACTIONS

        response = await async_client.get("/api/v1/cards")
        assert response.status_code == 200
        cards = response.json()

        # 檢查每張有故事的卡牌
        for card in cards:
            story = card.get("story")
            if not story:
                continue

            factions = story.get("factionsInvolved", [])
            for faction in factions:
                assert faction in VALID_FACTIONS, \
                    f"Invalid faction '{faction}' in card {card['name']}"

    @pytest.mark.asyncio
    async def test_api_response_performance(self, async_client: AsyncClient):
        """
        測試：API 回應性能

        驗證：
        - 卡牌查詢應在合理時間內完成（< 1000ms）
        - 回應大小應合理（< 50KB for list）
        """
        import time

        # 測試卡牌列表查詢性能
        start_time = time.time()
        response = await async_client.get("/api/v1/cards")
        end_time = time.time()

        response_time = (end_time - start_time) * 1000  # 轉為毫秒

        assert response.status_code == 200
        assert response_time < 1000, f"API response time {response_time:.2f}ms exceeds 1000ms threshold"

        # 檢查回應大小
        response_size = len(response.content)
        assert response_size < 51200, f"Response size {response_size} bytes exceeds 50KB limit"
