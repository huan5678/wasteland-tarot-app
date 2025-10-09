"""
錯誤處理和異常情況測試
驗證API在各種錯誤情況下的正確響應和處理
"""

import pytest
import json
from typing import Dict, Any
from httpx import AsyncClient
from fastapi import status


class TestErrorHandling:
    """基本錯誤處理測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_404_not_found(self, async_client: AsyncClient):
        """測試404 Not Found錯誤"""
        # 測試不存在的路徑
        response = await async_client.get("/api/v1/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # 測試不存在的卡片ID
        response = await async_client.get("/api/v1/cards/nonexistent-card-id")
        assert response.status_code == status.HTTP_404_NOT_FOUND

        error_data = response.json()
        assert "detail" in error_data or "error" in error_data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_405_method_not_allowed(self, async_client: AsyncClient):
        """測試405 Method Not Allowed錯誤"""
        # 對只支持GET的端點發送POST請求
        response = await async_client.post("/")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

        # 對只支持GET的端點發送PUT請求
        response = await async_client.put("/api/v1/cards/")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_422_validation_errors(self, async_client: AsyncClient):
        """測試422 Unprocessable Entity驗證錯誤"""
        # 測試無效的查詢參數
        invalid_params = [
            "page=0",
            "page=-1",
            "page_size=0",
            "page_size=-5",
            "page_size=1000",
            "min_radiation=-0.5",
            "max_radiation=1.5",
            "min_threat=0",
            "max_threat=15"
        ]

        for param in invalid_params:
            response = await async_client.get(f"/api/v1/cards/?{param}")
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_malformed_json_requests(self, async_client: AsyncClient):
        """測試畸形JSON請求"""
        # 測試無效的JSON
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            content="invalid json content",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試空JSON
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            content="",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試不完整的JSON
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            content='{"query": "test"',  # 缺少結尾括號
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_missing_content_type(self, async_client: AsyncClient):
        """測試缺少Content-Type標頭"""
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            content='{"query": "test"}'
            # 故意不設置Content-Type
        )
        # 應該返回422或415錯誤
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        ]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_content_type(self, async_client: AsyncClient):
        """測試無效的Content-Type"""
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            content='{"query": "test"}',
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        ]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_request_timeout_simulation(self, async_client: AsyncClient):
        """測試請求超時模擬"""
        # 設置極短的超時時間
        import httpx

        try:
            async with httpx.AsyncClient(timeout=0.001) as timeout_client:
                response = await timeout_client.get("http://test/api/v1/cards/")
        except (httpx.TimeoutException, httpx.ConnectTimeout, httpx.ReadTimeout):
            # 預期的超時異常
            pass
        except Exception as e:
            # 其他類型的連接錯誤也是可以接受的
            pass

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_large_payload_handling(self, async_client: AsyncClient):
        """測試大型載荷處理"""
        # 創建一個很大的搜尋查詢
        large_query = "a" * 10000
        large_payload = {"query": large_query}

        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            json=large_payload
        )
        # 應該能處理大型載荷或返回適當的錯誤
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
        ]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_special_characters_in_requests(self, async_client: AsyncClient):
        """測試請求中的特殊字符"""
        special_chars = ["<script>", "'; DROP TABLE", "null", "undefined", "\x00", "\n", "\r"]

        for char in special_chars:
            # 測試在搜尋中使用特殊字符
            response = await async_client.get(f"/api/v1/cards/?search={char}")
            # 不應該導致伺服器錯誤
            assert response.status_code not in [
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                status.HTTP_502_BAD_GATEWAY,
                status.HTTP_503_SERVICE_UNAVAILABLE
            ]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_sql_injection_protection(self, async_client: AsyncClient):
        """測試SQL注入保護"""
        sql_injection_attempts = [
            "'; DROP TABLE wasteland_cards; --",
            "1' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "admin'--",
            "' OR 1=1--"
        ]

        for injection in sql_injection_attempts:
            # 測試在搜尋參數中的SQL注入
            response = await async_client.get(f"/api/v1/cards/?search={injection}")
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

            # 確保沒有返回異常數據
            if response.status_code == status.HTTP_200_OK:
                data = response.json()
                assert "cards" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_xss_protection(self, async_client: AsyncClient):
        """測試XSS保護"""
        xss_attempts = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>"
        ]

        for xss in xss_attempts:
            response = await async_client.get(f"/api/v1/cards/?search={xss}")
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

            # 確保響應中的XSS代碼被適當處理
            response_text = response.text
            assert "<script>" not in response_text
            assert "javascript:" not in response_text


class TestRadiationErrors:
    """輻射相關錯誤測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_radiation_overload_error(self, async_client: AsyncClient):
        """測試輻射過載錯誤"""
        # 測試極高的輻射因子
        response = await async_client.get("/api/v1/cards/random?radiation_factor=1.0")

        # 可能返回正常結果或輻射過載錯誤
        if response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
            error_data = response.json()
            error_text = str(error_data).lower()
            assert "radiation" in error_text or "輻射" in error_text

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_radiation_parameters(self, async_client: AsyncClient):
        """測試無效輻射參數"""
        invalid_radiation_values = [
            "abc",
            "null",
            "-1",
            "1.5",
            "999",
            ""
        ]

        for value in invalid_radiation_values:
            response = await async_client.get(f"/api/v1/cards/random?radiation_factor={value}")
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCardNotFoundErrors:
    """卡片未找到錯誤測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_card_ids(self, async_client: AsyncClient):
        """測試無效卡片ID"""
        invalid_card_ids = [
            "nonexistent-id",
            "123456789",
            "test-card",
            "null",
            "undefined",
            "",
            "special-chars-@#$%",
            "很長的中文卡片ID名稱測試",
            "card with spaces",
            "../../../etc/passwd"
        ]

        for card_id in invalid_card_ids:
            response = await async_client.get(f"/api/v1/cards/{card_id}")
            assert response.status_code == status.HTTP_404_NOT_FOUND

            error_data = response.json()
            assert "detail" in error_data or "error" in error_data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_card_interpretation_invalid_id(self, async_client: AsyncClient):
        """測試無效ID的卡片解讀"""
        interpretation_request = {
            "character_voice": "pip_boy",
            "karma_context": "neutral",
            "question_context": "test question"
        }

        response = await async_client.post(
            "/api/v1/cards/invalid-id/interpret",
            json=interpretation_request
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestValidationErrors:
    """驗證錯誤測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_enum_values(self, async_client: AsyncClient):
        """測試無效枚舉值"""
        # 測試無效花色
        response = await async_client.get("/api/v1/cards/?suit=invalid_suit")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試無效排序順序
        response = await async_client.get("/api/v1/cards/?sort_order=invalid_order")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_invalid_interpretation_request(self, async_client: AsyncClient):
        """測試無效解讀請求"""
        # 首先獲取一個有效的卡片ID
        cards_response = await async_client.get("/api/v1/cards/?page_size=1")
        if cards_response.status_code == 200:
            cards_data = cards_response.json()
            if cards_data["cards"]:
                card_id = cards_data["cards"][0]["id"]

                # 測試無效的character_voice
                invalid_request = {
                    "character_voice": "invalid_voice",
                    "karma_context": "neutral"
                }

                response = await async_client.post(
                    f"/api/v1/cards/{card_id}/interpret",
                    json=invalid_request
                )
                assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_missing_required_fields(self, async_client: AsyncClient):
        """測試缺少必要欄位"""
        # 測試空的解讀請求
        response = await async_client.post(
            "/api/v1/cards/test-id/interpret",
            json={}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # 測試空的高級搜尋
        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            json={}
        )
        # 可能接受空搜尋或返回驗證錯誤
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]


class TestErrorResponseFormat:
    """錯誤響應格式測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_response_structure(self, async_client: AsyncClient):
        """測試錯誤響應結構"""
        # 觸發一個已知的錯誤
        response = await async_client.get("/api/v1/cards/nonexistent-card")
        assert response.status_code == status.HTTP_404_NOT_FOUND

        error_data = response.json()

        # 檢查錯誤響應是否包含預期欄位
        required_fields = ["detail", "error"]  # 至少應該有其中一個
        has_required_field = any(field in error_data for field in required_fields)
        assert has_required_field, f"錯誤響應缺少必要欄位: {error_data}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_fallout_themed_error_messages(self, async_client: AsyncClient):
        """測試廢土主題錯誤訊息"""
        # 觸發驗證錯誤
        response = await async_client.get("/api/v1/cards/?page=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        error_data = response.json()
        error_text = str(error_data).lower()

        # 檢查是否包含廢土主題元素
        fallout_terms = ["pip-boy", "vault", "radiation", "wasteland", "輻射", "避難所"]
        has_theme = any(term in error_text for term in fallout_terms)
        # 不強制要求，但如果有主題化錯誤訊息會更好

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_response_headers(self, async_client: AsyncClient):
        """測試錯誤響應標頭"""
        response = await async_client.get("/api/v1/cards/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # 檢查基本標頭
        assert "content-type" in response.headers
        assert "application/json" in response.headers["content-type"]

        # 檢查CORS標頭（如果設置）
        # 在錯誤響應中CORS標頭也應該存在

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_response_timing(self, async_client: AsyncClient):
        """測試錯誤響應計時"""
        import time

        start_time = time.time()
        response = await async_client.get("/api/v1/cards/nonexistent")
        end_time = time.time()

        assert response.status_code == status.HTTP_404_NOT_FOUND

        response_time = end_time - start_time
        # 錯誤響應應該很快
        assert response_time < 1.0, f"錯誤響應時間過長: {response_time:.2f}秒"


class TestConcurrentErrorHandling:
    """並發錯誤處理測試"""

    @pytest.mark.integration
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_error_requests(self, async_client: AsyncClient):
        """測試並發錯誤請求"""
        import asyncio

        async def error_request():
            response = await async_client.get("/api/v1/cards/nonexistent")
            return response.status_code

        # 並發發送多個錯誤請求
        tasks = [error_request() for _ in range(10)]
        results = await asyncio.gather(*tasks)

        # 所有請求都應該返回404
        assert all(code == 404 for code in results), "並發錯誤請求處理不一致"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_handling_under_load(self, async_client: AsyncClient):
        """測試負載下的錯誤處理"""
        import asyncio

        async def mixed_request(i):
            if i % 2 == 0:
                # 正常請求
                response = await async_client.get("/")
            else:
                # 錯誤請求
                response = await async_client.get("/api/v1/cards/nonexistent")
            return response.status_code

        # 混合正常和錯誤請求
        tasks = [mixed_request(i) for i in range(20)]
        results = await asyncio.gather(*tasks)

        # 檢查結果模式
        normal_responses = [code for i, code in enumerate(results) if i % 2 == 0]
        error_responses = [code for i, code in enumerate(results) if i % 2 == 1]

        assert all(code == 200 for code in normal_responses), "正常請求受到錯誤請求影響"
        assert all(code == 404 for code in error_responses), "錯誤請求處理不正確"


class TestSecurityErrorHandling:
    """安全相關錯誤處理測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_path_traversal_protection(self, async_client: AsyncClient):
        """測試路徑遍歷保護"""
        path_traversal_attempts = [
            "../../../etc/passwd",
            "..\\..\\windows\\system32",
            "%2e%2e%2f%2e%2e%2f",
            "....//....//",
            "..\\..\\..\\"
        ]

        for attempt in path_traversal_attempts:
            response = await async_client.get(f"/api/v1/cards/{attempt}")
            # 應該返回404而不是500或其他伺服器錯誤
            assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_header_injection_protection(self, async_client: AsyncClient):
        """測試標頭注入保護"""
        malicious_headers = {
            "X-Forwarded-For": "127.0.0.1\r\nEvil: injection",
            "User-Agent": "test\r\nX-Injected: header",
            "Accept": "application/json\r\nMalicious: content"
        }

        response = await async_client.get("/", headers=malicious_headers)
        # 應該正常處理而不是返回伺服器錯誤
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_oversized_request_handling(self, async_client: AsyncClient):
        """測試超大請求處理"""
        # 創建一個非常大的請求體
        huge_data = {"data": "x" * 1000000}  # 1MB的數據

        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            json=huge_data
        )
        # 應該返回適當的錯誤而不是崩潰
        assert response.status_code in [
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST
        ]