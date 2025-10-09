"""
78張卡片資料完整性測試
驗證所有塔羅牌卡片的資料完整性和正確性
"""

import pytest
from typing import Set, List, Dict, Any
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.wasteland_card import WastelandCard as WastelandCardModel


class TestCardDataIntegrity:
    """卡片資料完整性測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_total_card_count(self, async_client: AsyncClient):
        """驗證總卡片數量為78張"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        total_count = data["total_count"]
        assert total_count == 78, f"卡片總數應為78張，實際為{total_count}張"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_major_arcana_count(self, async_client: AsyncClient):
        """驗證Major Arcana卡片數量為22張"""
        response = await async_client.get("/api/v1/cards/suits/major_arcana")
        assert response.status_code == 200

        data = response.json()
        major_arcana_count = len(data["cards"])
        assert major_arcana_count == 22, f"Major Arcana應為22張，實際為{major_arcana_count}張"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_minor_arcana_count(self, async_client: AsyncClient):
        """驗證Minor Arcana各花色卡片數量"""
        minor_suits = ["nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"]

        for suit in minor_suits:
            response = await async_client.get(f"/api/v1/cards/suits/{suit}")
            assert response.status_code == 200

            data = response.json()
            suit_count = len(data["cards"])
            assert suit_count == 14, f"{suit}花色應為14張，實際為{suit_count}張"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_card_id_uniqueness(self, db_session: AsyncSession):
        """驗證所有卡片ID唯一性"""
        query = select(WastelandCardModel.id)
        result = await db_session.execute(query)
        card_ids = [row[0] for row in result.fetchall()]

        unique_ids = set(card_ids)
        assert len(card_ids) == len(unique_ids), "存在重複的卡片ID"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_major_arcana_numbers(self, async_client: AsyncClient):
        """驗證Major Arcana卡片編號完整性（0-21）"""
        response = await async_client.get("/api/v1/cards/suits/major_arcana")
        assert response.status_code == 200

        data = response.json()
        card_numbers = [card.get("number") for card in data["cards"] if card.get("number") is not None]

        # 驗證編號範圍0-21
        expected_numbers = set(range(22))  # 0到21
        actual_numbers = set(card_numbers)

        missing_numbers = expected_numbers - actual_numbers
        extra_numbers = actual_numbers - expected_numbers

        assert not missing_numbers, f"缺少Major Arcana編號: {missing_numbers}"
        assert not extra_numbers, f"多餘的Major Arcana編號: {extra_numbers}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_minor_arcana_numbers(self, async_client: AsyncClient):
        """驗證Minor Arcana卡片編號完整性"""
        minor_suits = ["nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"]

        for suit in minor_suits:
            response = await async_client.get(f"/api/v1/cards/suits/{suit}")
            assert response.status_code == 200

            data = response.json()
            cards = data["cards"]

            # 分類數字牌和宮廷牌
            number_cards = [card for card in cards if card.get("number") is not None and isinstance(card.get("number"), int)]
            court_cards = [card for card in cards if card.get("rank") is not None]

            # 驗證數字牌 (1-10)
            number_values = [card["number"] for card in number_cards]
            expected_numbers = set(range(1, 11))  # 1到10
            actual_numbers = set(number_values)

            assert actual_numbers.issubset(expected_numbers), f"{suit}花色數字牌編號異常: {actual_numbers}"

            # 驗證宮廷牌
            court_ranks = [card["rank"] for card in court_cards]
            expected_ranks = {"recruit", "knight", "elder", "overseer"}  # Page, Knight, Queen, King的廢土版本
            actual_ranks = set(court_ranks)

            assert actual_ranks.issubset(expected_ranks), f"{suit}花色宮廷牌階級異常: {actual_ranks}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_required_fields_presence(self, async_client: AsyncClient):
        """驗證所有卡片必要欄位存在"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        required_fields = ["id", "name", "suit", "radiation_level"]

        for i, card in enumerate(cards):
            for field in required_fields:
                assert field in card, f"第{i+1}張卡片缺少必要欄位: {field}"
                assert card[field] is not None, f"第{i+1}張卡片的{field}欄位為空"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_card_names_not_empty(self, async_client: AsyncClient):
        """驗證所有卡片名稱非空"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        for i, card in enumerate(cards):
            name = card.get("name", "")
            assert isinstance(name, str), f"第{i+1}張卡片名稱類型錯誤"
            assert len(name.strip()) > 0, f"第{i+1}張卡片名稱為空: {card.get('id')}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_radiation_level_validity(self, async_client: AsyncClient):
        """驗證輻射等級在有效範圍內"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        for i, card in enumerate(cards):
            radiation = card.get("radiation_level")
            assert radiation is not None, f"第{i+1}張卡片輻射等級為空"
            assert isinstance(radiation, (int, float)), f"第{i+1}張卡片輻射等級類型錯誤"
            assert 0.0 <= radiation <= 1.0, f"第{i+1}張卡片輻射等級超出範圍: {radiation}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_suit_validity(self, async_client: AsyncClient):
        """驗證所有花色值有效"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        valid_suits = {
            "major_arcana",
            "nuka_cola_bottles",
            "combat_weapons",
            "bottle_caps",
            "radiation_rods"
        }

        for i, card in enumerate(cards):
            suit = card.get("suit")
            assert suit in valid_suits, f"第{i+1}張卡片花色無效: {suit}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_english_names_present(self, async_client: AsyncClient):
        """驗證英文名稱存在（如果有的話）"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        for card in cards:
            if "english_name" in card:
                english_name = card["english_name"]
                if english_name is not None:
                    assert isinstance(english_name, str), f"英文名稱類型錯誤: {card.get('id')}"
                    assert len(english_name.strip()) > 0, f"英文名稱為空: {card.get('id')}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_card_meanings_present(self, async_client: AsyncClient):
        """驗證卡片含義存在"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        meaning_fields = ["upright_meaning", "reversed_meaning", "description"]

        for card in cards:
            has_meaning = False
            for field in meaning_fields:
                if field in card and card[field] and len(str(card[field]).strip()) > 0:
                    has_meaning = True
                    break

            assert has_meaning, f"卡片缺少含義描述: {card.get('id')}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_fallout_theme_consistency(self, async_client: AsyncClient):
        """驗證廢土主題一致性"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        # 廢土主題關鍵詞
        fallout_keywords = [
            "避難所", "廢土", "輻射", "變種", "兄弟會", "NCR", "劫掠者",
            "可樂", "瓶蓋", "Pip-Boy", "vault", "wasteland", "radiation",
            "mutant", "brotherhood", "raider", "cola", "caps"
        ]

        cards_with_theme = 0

        for card in cards:
            card_text = ""
            for field in ["name", "english_name", "description", "upright_meaning"]:
                if field in card and card[field]:
                    card_text += str(card[field]).lower() + " "

            has_theme = any(keyword.lower() in card_text for keyword in fallout_keywords)
            if has_theme:
                cards_with_theme += 1

        # 至少50%的卡片應該包含廢土主題元素
        theme_percentage = cards_with_theme / len(cards)
        assert theme_percentage >= 0.5, f"廢土主題一致性不足: {theme_percentage:.2%}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_image_urls_format(self, async_client: AsyncClient):
        """驗證圖片URL格式正確"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        image_fields = ["image_front", "image_back", "pixel_art"]

        for card in cards:
            for field in image_fields:
                if field in card and card[field]:
                    image_url = card[field]
                    assert isinstance(image_url, str), f"圖片URL類型錯誤: {card.get('id')}.{field}"
                    assert image_url.startswith("/"), f"圖片URL格式錯誤: {card.get('id')}.{field} = {image_url}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_card_statistics_validity(self, async_client: AsyncClient):
        """驗證卡片統計數據有效性"""
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        for card in cards:
            # 檢查統計欄位
            if "draw_frequency" in card:
                freq = card["draw_frequency"]
                if freq is not None:
                    assert isinstance(freq, (int, float)), f"抽卡頻率類型錯誤: {card.get('id')}"
                    assert freq >= 0, f"抽卡頻率不能為負: {card.get('id')}"

            if "total_appearances" in card:
                appearances = card["total_appearances"]
                if appearances is not None:
                    assert isinstance(appearances, int), f"出現次數類型錯誤: {card.get('id')}"
                    assert appearances >= 0, f"出現次數不能為負: {card.get('id')}"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_card_consistency(self, db_session: AsyncSession):
        """驗證資料庫中卡片資料一致性"""
        # 檢查總數
        count_query = select(func.count(WastelandCardModel.id))
        result = await db_session.execute(count_query)
        total_count = result.scalar()
        assert total_count == 78, f"資料庫中卡片總數錯誤: {total_count}"

        # 檢查花色分布
        suit_query = select(WastelandCardModel.suit, func.count(WastelandCardModel.id)).group_by(WastelandCardModel.suit)
        result = await db_session.execute(suit_query)
        suit_counts = dict(result.fetchall())

        expected_counts = {
            "major_arcana": 22,
            "nuka_cola_bottles": 14,
            "combat_weapons": 14,
            "bottle_caps": 14,
            "radiation_rods": 14
        }

        for suit, expected_count in expected_counts.items():
            actual_count = suit_counts.get(suit, 0)
            assert actual_count == expected_count, f"{suit}花色卡片數量錯誤: 預期{expected_count}，實際{actual_count}"

    @pytest.mark.integration
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_all_cards_accessible(self, async_client: AsyncClient):
        """驗證所有卡片都可以單獨訪問"""
        # 獲取所有卡片ID
        response = await async_client.get("/api/v1/cards/?page_size=100")
        assert response.status_code == 200

        data = response.json()
        cards = data["cards"]

        failed_cards = []

        for card in cards:
            card_id = card["id"]
            card_response = await async_client.get(f"/api/v1/cards/{card_id}")

            if card_response.status_code != 200:
                failed_cards.append(card_id)

        assert not failed_cards, f"以下卡片無法單獨訪問: {failed_cards}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_card_data_encoding(self, async_client: AsyncClient):
        """驗證卡片資料編碼正確"""
        response = await async_client.get("/api/v1/cards/?page_size=10")
        assert response.status_code == 200

        # 驗證響應是有效的UTF-8編碼
        content = response.content
        try:
            content.decode('utf-8')
        except UnicodeDecodeError:
            pytest.fail("響應內容包含無效的UTF-8字符")

        data = response.json()
        cards = data["cards"]

        # 檢查中文字符正確顯示
        for card in cards:
            name = card.get("name", "")
            if name:
                # 驗證名稱不包含亂碼字符
                assert "?" not in name.replace("？", ""), f"卡片名稱可能包含亂碼: {name}"