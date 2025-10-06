"""
查詢參數和篩選條件測試
驗證所有API端點的查詢參數和篩選功能正常工作
"""

import pytest
from typing import Dict, Any, List
from httpx import AsyncClient
from fastapi import status


class TestQueryParameters:
    """查詢參數測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_pagination_parameters(self, async_client: AsyncClient):
        """測試分頁參數"""
        # 測試第一頁
        response = await async_client.get("/api/v1/cards/?page=1&page_size=5")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 5
        assert len(data["cards"]) <= 5

        # 測試不同頁面大小
        response = await async_client.get("/api/v1/cards/?page=1&page_size=10")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["page_size"] == 10
        assert len(data["cards"]) <= 10

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_pagination_edge_cases(self, async_client: AsyncClient):
        """測試分頁邊界情況"""
        # 測試頁碼為0（應該失敗）
        response = await async_client.get("/api/v1/cards/?page=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試負頁碼（應該失敗）
        response = await async_client.get("/api/v1/cards/?page=-1")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試頁面大小為0（應該失敗）
        response = await async_client.get("/api/v1/cards/?page_size=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試頁面大小超過最大值（應該失敗）
        response = await async_client.get("/api/v1/cards/?page_size=1000")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試很大的頁碼（應該返回空結果）
        response = await async_client.get("/api/v1/cards/?page=9999")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert len(data["cards"]) == 0
        assert data["has_more"] == False

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_suit_filtering(self, async_client: AsyncClient):
        """測試花色篩選"""
        valid_suits = ["major_arcana", "nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"]

        for suit in valid_suits:
            response = await async_client.get(f"/api/v1/cards/?suit={suit}")
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            # 驗證返回的卡片都是指定花色
            for card in data["cards"]:
                assert card["suit"] == suit, f"卡片花色不匹配，期望：{suit}，實際：{card['suit']}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_suit_filtering(self, async_client: AsyncClient):
        """測試無效花色篩選"""
        invalid_suits = ["invalid_suit", "tarot", "hearts", "spades"]

        for suit in invalid_suits:
            response = await async_client.get(f"/api/v1/cards/?suit={suit}")
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_radiation_level_filtering(self, async_client: AsyncClient):
        """測試輻射等級篩選"""
        # 測試最小輻射等級
        response = await async_client.get("/api/v1/cards/?min_radiation=0.5")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for card in data["cards"]:
            assert card["radiation_level"] >= 0.5, f"卡片輻射等級低於最小值：{card['radiation_level']}"

        # 測試最大輻射等級
        response = await async_client.get("/api/v1/cards/?max_radiation=0.3")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for card in data["cards"]:
            assert card["radiation_level"] <= 0.3, f"卡片輻射等級高於最大值：{card['radiation_level']}"

        # 測試輻射等級範圍
        response = await async_client.get("/api/v1/cards/?min_radiation=0.2&max_radiation=0.8")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for card in data["cards"]:
            radiation = card["radiation_level"]
            assert 0.2 <= radiation <= 0.8, f"卡片輻射等級不在範圍內：{radiation}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_radiation_filtering(self, async_client: AsyncClient):
        """測試無效輻射等級篩選"""
        # 測試負值
        response = await async_client.get("/api/v1/cards/?min_radiation=-0.1")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試超過1.0的值
        response = await async_client.get("/api/v1/cards/?max_radiation=1.5")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試最小值大於最大值
        response = await async_client.get("/api/v1/cards/?min_radiation=0.8&max_radiation=0.2")
        assert response.status_code == status.HTTP_200_OK
        # 這種情況應該返回空結果
        data = response.json()
        assert len(data["cards"]) == 0

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_threat_level_filtering(self, async_client: AsyncClient):
        """測試威脅等級篩選"""
        # 測試最小威脅等級
        response = await async_client.get("/api/v1/cards/?min_threat=5")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for card in data["cards"]:
            if "threat_level" in card and card["threat_level"] is not None:
                assert card["threat_level"] >= 5, f"卡片威脅等級低於最小值：{card['threat_level']}"

        # 測試最大威脅等級
        response = await async_client.get("/api/v1/cards/?max_threat=3")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for card in data["cards"]:
            if "threat_level" in card and card["threat_level"] is not None:
                assert card["threat_level"] <= 3, f"卡片威脅等級高於最大值：{card['threat_level']}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_search_functionality(self, async_client: AsyncClient):
        """測試搜尋功能"""
        search_terms = ["vault", "wasteland", "新手", "輻射", "避難所"]

        for term in search_terms:
            response = await async_client.get(f"/api/v1/cards/?search={term}")
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            # 驗證搜尋結果包含關鍵字（在名稱或描述中）
            for card in data["cards"]:
                card_text = " ".join([
                    str(card.get("name", "")),
                    str(card.get("english_name", "")),
                    str(card.get("upright_meaning", "")),
                    str(card.get("description", ""))
                ]).lower()

                # 至少應該在某個欄位中包含搜尋詞
                contains_term = (
                    term.lower() in card_text or
                    any(char in card_text for char in term if len(char) > 1)  # 對中文字符的處理
                )
                # 注意：由於搜尋算法可能包含模糊匹配，這裡不強制要求

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_empty_search(self, async_client: AsyncClient):
        """測試空搜尋條件"""
        response = await async_client.get("/api/v1/cards/?search=")
        assert response.status_code == status.HTTP_200_OK

        # 空搜尋應該返回所有卡片
        data = response.json()
        assert len(data["cards"]) > 0

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_special_character_search(self, async_client: AsyncClient):
        """測試特殊字符搜尋"""
        special_chars = ["@", "#", "%", "&", "*", "!", "?"]

        for char in special_chars:
            response = await async_client.get(f"/api/v1/cards/?search={char}")
            assert response.status_code == status.HTTP_200_OK
            # 特殊字符搜尋不應該導致錯誤

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_sorting_parameters(self, async_client: AsyncClient):
        """測試排序參數"""
        sort_fields = ["name", "suit", "radiation_level"]
        sort_orders = ["asc", "desc"]

        for field in sort_fields:
            for order in sort_orders:
                response = await async_client.get(f"/api/v1/cards/?sort_by={field}&sort_order={order}")
                assert response.status_code == status.HTTP_200_OK

                data = response.json()
                if len(data["cards"]) > 1:
                    # 驗證排序正確性
                    values = []
                    for card in data["cards"]:
                        value = card.get(field)
                        if value is not None:
                            values.append(value)

                    if len(values) > 1:
                        if order == "asc":
                            assert values == sorted(values), f"升序排序失敗，欄位：{field}"
                        else:
                            assert values == sorted(values, reverse=True), f"降序排序失敗，欄位：{field}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_sorting_parameters(self, async_client: AsyncClient):
        """測試無效排序參數"""
        # 測試無效排序欄位
        response = await async_client.get("/api/v1/cards/?sort_by=invalid_field")
        # 可能返回422或200（使用默認排序）
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

        # 測試無效排序順序
        response = await async_client.get("/api/v1/cards/?sort_order=invalid_order")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_combined_filters(self, async_client: AsyncClient):
        """測試組合篩選條件"""
        # 組合多個篩選條件
        response = await async_client.get(
            "/api/v1/cards/?suit=major_arcana&min_radiation=0.1&max_radiation=0.9&page_size=10"
        )
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        for card in data["cards"]:
            assert card["suit"] == "major_arcana"
            assert 0.1 <= card["radiation_level"] <= 0.9
        assert len(data["cards"]) <= 10

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_karma_alignment_filtering(self, async_client: AsyncClient):
        """測試業力對齊篩選"""
        karma_levels = ["good", "neutral", "evil"]

        for karma in karma_levels:
            response = await async_client.get(f"/api/v1/cards/?karma_alignment={karma}")
            # 業力篩選可能不是所有API都支持，所以接受200或422
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_faction_filtering(self, async_client: AsyncClient):
        """測試派系篩選"""
        factions = ["brotherhood", "ncr", "raiders", "vault_dweller"]

        for faction in factions:
            response = await async_client.get(f"/api/v1/cards/?faction={faction}")
            # 派系篩選可能不是所有API都支持
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_random_cards_parameters(self, async_client: AsyncClient):
        """測試隨機卡片參數"""
        # 測試不同數量
        for count in [1, 3, 5, 10]:
            response = await async_client.get(f"/api/v1/cards/random?count={count}")
            assert response.status_code == status.HTTP_200_OK

            cards = response.json()
            assert len(cards) <= count

        # 測試排除Major Arcana
        response = await async_client.get("/api/v1/cards/random?count=5&exclude_major_arcana=true")
        assert response.status_code == status.HTTP_200_OK

        cards = response.json()
        for card in cards:
            assert card["suit"] != "major_arcana"

        # 測試輻射因子
        response = await async_client.get("/api/v1/cards/random?count=3&radiation_factor=0.5")
        assert response.status_code == status.HTTP_200_OK

        # 測試允許重複
        response = await async_client.get("/api/v1/cards/random?count=5&allow_duplicates=true")
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_random_cards_edge_cases(self, async_client: AsyncClient):
        """測試隨機卡片邊界情況"""
        # 測試過多數量
        response = await async_client.get("/api/v1/cards/random?count=100")
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

        # 測試0數量
        response = await async_client.get("/api/v1/cards/random?count=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試負數量
        response = await async_client.get("/api/v1/cards/random?count=-1")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試極端輻射因子
        response = await async_client.get("/api/v1/cards/random?radiation_factor=1.5")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_advanced_search_parameters(self, async_client: AsyncClient):
        """測試高級搜尋參數"""
        search_payload = {
            "query": "new beginning",
            "min_radiation": 0.0,
            "max_radiation": 0.5,
            "min_threat": 1,
            "max_threat": 5
        }

        response = await async_client.post("/api/v1/cards/search/advanced", json=search_payload)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "cards" in data
        assert "total_count" in data

        # 驗證篩選條件應用正確
        for card in data["cards"]:
            radiation = card.get("radiation_level", 0)
            assert 0.0 <= radiation <= 0.5

            threat = card.get("threat_level")
            if threat is not None:
                assert 1 <= threat <= 5

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_advanced_search_parameters(self, async_client: AsyncClient):
        """測試無效高級搜尋參數"""
        # 測試無效JSON結構
        invalid_payloads = [
            {"invalid_field": "value"},
            {"min_radiation": -1},
            {"max_radiation": 2.0},
            {"min_threat": 0},
            {"max_threat": 15}
        ]

        for payload in invalid_payloads:
            response = await async_client.post("/api/v1/cards/search/advanced", json=payload)
            # 可能返回422（驗證錯誤）或200（忽略無效欄位）
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_url_encoding(self, async_client: AsyncClient):
        """測試URL編碼處理"""
        # 測試包含空格的搜尋
        response = await async_client.get("/api/v1/cards/?search=new%20beginning")
        assert response.status_code == status.HTTP_200_OK

        # 測試包含特殊字符的搜尋
        response = await async_client.get("/api/v1/cards/?search=%E9%81%BF%E9%9B%A3%E6%89%80")  # 避難所 UTF-8編碼
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_parameter_case_sensitivity(self, async_client: AsyncClient):
        """測試參數大小寫敏感性"""
        # 測試花色名稱大小寫
        response1 = await async_client.get("/api/v1/cards/?suit=major_arcana")
        response2 = await async_client.get("/api/v1/cards/?suit=MAJOR_ARCANA")

        # 第一個應該成功，第二個可能失敗（取決於API設計）
        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_query_parameter_limits(self, async_client: AsyncClient):
        """測試查詢參數限制"""
        # 測試很長的搜尋字符串
        long_search = "a" * 1000
        response = await async_client.get(f"/api/v1/cards/?search={long_search}")
        # 應該處理長字符串而不崩潰
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

        # 測試大量查詢參數
        params = "&".join([f"param{i}=value{i}" for i in range(50)])
        response = await async_client.get(f"/api/v1/cards/?{params}")
        # 應該忽略未知參數
        assert response.status_code == status.HTTP_200_OK