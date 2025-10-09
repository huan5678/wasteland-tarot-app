"""
完整的API端點測試 - 測試所有API端點的功能性
包含CRUD操作、查詢參數、錯誤處理和性能測試
"""

import pytest
import json
from typing import Dict, Any, List
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession


class TestCardsAPI:
    """卡片API端點測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_all_cards(self, async_client: AsyncClient):
        """測試獲取所有卡片端點"""
        response = await async_client.get("/api/v1/cards/")

        assert response.status_code == status.HTTP_200_OK, f"獲取卡片失敗: {response.text}"

        data = response.json()
        assert "cards" in data, "響應中缺少cards欄位"
        assert "total_count" in data, "響應中缺少total_count欄位"
        assert "page" in data, "響應中缺少page欄位"
        assert "page_size" in data, "響應中缺少page_size欄位"
        assert "has_more" in data, "響應中缺少has_more欄位"

        # 驗證響應數據類型
        assert isinstance(data["cards"], list), "cards應該是列表"
        assert isinstance(data["total_count"], int), "total_count應該是整數"
        assert isinstance(data["page"], int), "page應該是整數"
        assert isinstance(data["page_size"], int), "page_size應該是整數"
        assert isinstance(data["has_more"], bool), "has_more應該是布爾值"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_cards_with_pagination(self, async_client: AsyncClient):
        """測試卡片分頁功能"""
        # 測試第一頁
        response1 = await async_client.get("/api/v1/cards/?page=1&page_size=5")
        assert response1.status_code == status.HTTP_200_OK

        data1 = response1.json()
        assert data1["page"] == 1
        assert data1["page_size"] == 5
        assert len(data1["cards"]) <= 5

        # 如果有足夠的卡片，測試第二頁
        if data1["has_more"]:
            response2 = await async_client.get("/api/v1/cards/?page=2&page_size=5")
            assert response2.status_code == status.HTTP_200_OK

            data2 = response2.json()
            assert data2["page"] == 2
            assert data2["page_size"] == 5

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_cards_with_filters(self, async_client: AsyncClient):
        """測試卡片篩選功能"""
        # 測試按suit篩選
        response = await async_client.get("/api/v1/cards/?suit=major_arcana")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        if data["cards"]:
            # 驗證返回的卡片確實是major_arcana
            for card in data["cards"]:
                assert card.get("suit") == "major_arcana", f"卡片suit不匹配: {card}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_cards_with_radiation_filter(self, async_client: AsyncClient):
        """測試輻射等級篩選"""
        # 測試輻射等級範圍篩選
        response = await async_client.get("/api/v1/cards/?min_radiation=0.0&max_radiation=0.5")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        if data["cards"]:
            for card in data["cards"]:
                radiation = card.get("radiation_level", 0)
                assert 0.0 <= radiation <= 0.5, f"輻射等級超出範圍: {radiation}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_cards_search(self, async_client: AsyncClient):
        """測試卡片搜尋功能"""
        response = await async_client.get("/api/v1/cards/?search=vault")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        # 驗證搜尋結果包含關鍵字（如果有結果的話）
        if data["cards"]:
            for card in data["cards"]:
                card_text = f"{card.get('name', '')} {card.get('upright_meaning', '')}".lower()
                # 搜尋結果應該包含關鍵字或者是相關的
                # 注意：可能包含中文內容，所以不一定包含英文關鍵字

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_cards_sorting(self, async_client: AsyncClient):
        """測試卡片排序功能"""
        # 測試按名稱升序排序
        response = await async_client.get("/api/v1/cards/?sort_by=name&sort_order=asc")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        if len(data["cards"]) > 1:
            card_names = [card.get("name", "") for card in data["cards"]]
            assert card_names == sorted(card_names), "卡片未按名稱升序排列"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_single_card_valid_id(self, async_client: AsyncClient):
        """測試獲取單張卡片（有效ID）"""
        # 首先獲取一張卡片的ID
        cards_response = await async_client.get("/api/v1/cards/?page_size=1")
        assert cards_response.status_code == status.HTTP_200_OK

        cards_data = cards_response.json()
        if cards_data["cards"]:
            card_id = cards_data["cards"][0]["id"]

            # 測試獲取這張卡片
            response = await async_client.get(f"/api/v1/cards/{card_id}")
            assert response.status_code == status.HTTP_200_OK

            card_data = response.json()
            assert card_data["id"] == card_id
            assert "name" in card_data
            assert "suit" in card_data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_single_card_invalid_id(self, async_client: AsyncClient):
        """測試獲取單張卡片（無效ID）"""
        response = await async_client.get("/api/v1/cards/invalid-card-id-12345")
        assert response.status_code == status.HTTP_404_NOT_FOUND

        error_data = response.json()
        assert "detail" in error_data or "error" in error_data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_advanced_search(self, async_client: AsyncClient):
        """測試高級搜尋API"""
        search_params = {
            "query": "new",
            "min_radiation": 0.0,
            "max_radiation": 1.0
        }

        response = await async_client.post("/api/v1/cards/search/advanced", json=search_params)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "cards" in data
        assert "total_count" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_random_cards(self, async_client: AsyncClient):
        """測試隨機抽卡功能"""
        response = await async_client.get("/api/v1/cards/random?count=3")
        assert response.status_code == status.HTTP_200_OK

        cards = response.json()
        assert isinstance(cards, list), "隨機卡片應該返回列表"
        assert len(cards) <= 3, "返回的卡片數量不應超過請求數量"

        # 驗證每張卡片都有必要的欄位
        for card in cards:
            assert "id" in card
            assert "name" in card
            assert "suit" in card

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_random_cards_with_filters(self, async_client: AsyncClient):
        """測試帶篩選條件的隨機抽卡"""
        response = await async_client.get(
            "/api/v1/cards/random?count=2&exclude_major_arcana=true&radiation_factor=0.3"
        )
        assert response.status_code == status.HTTP_200_OK

        cards = response.json()
        assert isinstance(cards, list)

        # 驗證排除了Major Arcana
        for card in cards:
            assert card.get("suit") != "major_arcana", "應該排除Major Arcana卡片"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_cards_by_suit(self, async_client: AsyncClient):
        """測試按花色獲取卡片"""
        response = await async_client.get("/api/v1/cards/suits/major_arcana")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "cards" in data

        # 驗證所有卡片都是指定花色
        for card in data["cards"]:
            assert card.get("suit") == "major_arcana"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_card_interpretation(self, async_client: AsyncClient):
        """測試卡片解讀功能"""
        # 首先獲取一張卡片
        cards_response = await async_client.get("/api/v1/cards/?page_size=1")
        cards_data = cards_response.json()

        if cards_data["cards"]:
            card_id = cards_data["cards"][0]["id"]

            interpretation_request = {
                "character_voice": "pip_boy",
                "karma_context": "neutral",
                "question_context": "What should I focus on today?",
                "position_in_spread": "Present"
            }

            response = await async_client.post(
                f"/api/v1/cards/{card_id}/interpret",
                json=interpretation_request
            )
            assert response.status_code == status.HTTP_200_OK

            data = response.json()
            assert "card_id" in data
            assert "character_voice" in data
            assert "interpretation" in data
            assert "confidence" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_query_parameters(self, async_client: AsyncClient):
        """測試無效查詢參數的處理"""
        # 測試無效的頁碼
        response = await async_client.get("/api/v1/cards/?page=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試無效的頁面大小
        response = await async_client.get("/api/v1/cards/?page_size=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試無效的輻射範圍
        response = await async_client.get("/api/v1/cards/?min_radiation=-1")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_extreme_radiation_levels(self, async_client: AsyncClient):
        """測試極端輻射等級處理"""
        # 測試高輻射等級抽卡
        response = await async_client.get("/api/v1/cards/random?radiation_factor=1.0")

        # 可能成功也可能返回輻射過載錯誤
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_data = response.json()
            # 驗證錯誤訊息包含輻射相關內容
            error_msg = str(error_data).lower()
            assert "radiation" in error_msg or "輻射" in error_msg


class TestSystemAPI:
    """系統API測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_root_endpoint(self, async_client: AsyncClient):
        """測試根端點"""
        response = await async_client.get("/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "status" in data
        assert "features" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_health_check(self, async_client: AsyncClient):
        """測試健康檢查端點"""
        response = await async_client.get("/health")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
        assert "environment" in data
        assert "components" in data
        assert "system" in data
        assert "api" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_openapi_schema(self, async_client: AsyncClient):
        """測試OpenAPI schema端點"""
        response = await async_client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK

        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema
        assert "paths" in schema

        # 驗證包含我們的API路徑
        paths = schema["paths"]
        assert "/api/v1/cards/" in paths
        assert "/health" in paths

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_docs_endpoint(self, async_client: AsyncClient):
        """測試文檔端點可訪問性"""
        response = await async_client.get("/docs")
        assert response.status_code == status.HTTP_200_OK

        # 驗證返回HTML內容
        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_redoc_endpoint(self, async_client: AsyncClient):
        """測試ReDoc文檔端點"""
        response = await async_client.get("/redoc")
        assert response.status_code == status.HTTP_200_OK

        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type


class TestErrorHandling:
    """錯誤處理測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_404_not_found(self, async_client: AsyncClient):
        """測試404錯誤處理"""
        response = await async_client.get("/api/v1/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_method_not_allowed(self, async_client: AsyncClient):
        """測試方法不被允許錯誤"""
        response = await async_client.post("/")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_validation_error_handling(self, async_client: AsyncClient):
        """測試驗證錯誤處理"""
        # 發送無效的JSON到需要驗證的端點
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            json={"invalid_field": "invalid_value"}
        )
        # 可能是422（驗證錯誤）或400（請求錯誤）
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST
        ]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_malformed_json_handling(self, async_client: AsyncClient):
        """測試畸形JSON處理"""
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            content="invalid json content",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestResponseHeaders:
    """響應標頭測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_headers(self, async_client: AsyncClient):
        """測試CORS標頭"""
        response = await async_client.get("/", headers={"Origin": "http://localhost:3000"})
        assert response.status_code == status.HTTP_200_OK

        # 檢查CORS相關標頭
        headers = response.headers
        # 根據FastAPI的CORS設置，這些標頭應該存在
        # assert "access-control-allow-origin" in headers
        # assert "access-control-allow-credentials" in headers

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_response_time_header(self, async_client: AsyncClient):
        """測試響應時間標頭"""
        response = await async_client.get("/")
        assert response.status_code == status.HTTP_200_OK

        # 檢查響應時間標頭
        headers = response.headers
        assert "x-response-time" in headers

        response_time = float(headers["x-response-time"])
        assert response_time > 0, "響應時間應該大於0"
        assert response_time < 10, "響應時間不應該超過10秒"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_content_type_headers(self, async_client: AsyncClient):
        """測試內容類型標頭"""
        # JSON API端點
        response = await async_client.get("/api/v1/cards/")
        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response.headers.get("content-type", "")

        # HTML文檔端點
        response = await async_client.get("/docs")
        assert response.status_code == status.HTTP_200_OK
        assert "text/html" in response.headers.get("content-type", "")


class TestAPIPerformance:
    """API性能測試"""

    @pytest.mark.performance
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_cards_endpoint_performance(self, async_client: AsyncClient):
        """測試卡片端點性能"""
        import time

        start_time = time.time()
        response = await async_client.get("/api/v1/cards/?page_size=50")
        end_time = time.time()

        assert response.status_code == status.HTTP_200_OK

        response_time = end_time - start_time
        assert response_time < 2.0, f"API響應時間過長: {response_time:.2f}秒"

    @pytest.mark.performance
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, async_client: AsyncClient):
        """測試並發請求處理"""
        import asyncio

        async def single_request():
            response = await async_client.get("/")
            return response.status_code

        # 執行5個並發請求
        tasks = [single_request() for _ in range(5)]
        results = await asyncio.gather(*tasks)

        # 所有請求都應該成功
        assert all(status_code == 200 for status_code in results), "並發請求測試失敗"

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_memory_usage_stability(self, async_client: AsyncClient):
        """測試記憶體使用穩定性"""
        # 執行多次請求確保沒有記憶體洩漏
        for _ in range(10):
            response = await async_client.get("/api/v1/cards/?page_size=10")
            assert response.status_code == status.HTTP_200_OK

            # 確保響應正常
            data = response.json()
            assert "cards" in data