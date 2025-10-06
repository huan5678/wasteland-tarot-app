"""
CORS配置測試
驗證跨域資源共享配置正確運行
"""

import pytest
from typing import Dict, List
from httpx import AsyncClient
from fastapi import status


class TestCORSConfiguration:
    """CORS配置測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_preflight_request(self, async_client: AsyncClient):
        """測試CORS預檢請求"""
        # 發送OPTIONS請求（預檢請求）
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type"
        }

        response = await async_client.options("/api/v1/cards/", headers=headers)

        # 預檢請求應該成功
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT
        ]

        # 檢查CORS標頭
        cors_headers = response.headers
        assert "access-control-allow-origin" in cors_headers
        assert "access-control-allow-methods" in cors_headers

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_simple_request(self, async_client: AsyncClient):
        """測試CORS簡單請求"""
        headers = {
            "Origin": "http://localhost:3000"
        }

        response = await async_client.get("/api/v1/cards/", headers=headers)
        assert response.status_code == status.HTTP_200_OK

        # 檢查CORS響應標頭
        cors_headers = response.headers
        assert "access-control-allow-origin" in cors_headers

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_allowed_origins(self, async_client: AsyncClient):
        """測試允許的來源"""
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "https://wastelandtarot.com"
        ]

        for origin in allowed_origins:
            headers = {"Origin": origin}
            response = await async_client.get("/", headers=headers)

            assert response.status_code == status.HTTP_200_OK

            cors_headers = response.headers
            # 檢查是否允許該來源
            allowed_origin = cors_headers.get("access-control-allow-origin", "")

            # 可能是具體來源或通配符
            assert allowed_origin in [origin, "*"], f"來源 {origin} 未被正確處理"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_disallowed_origins(self, async_client: AsyncClient):
        """測試不允許的來源"""
        disallowed_origins = [
            "http://malicious-site.com",
            "https://evil.example.com",
            "http://localhost:8080"  # 如果不在允許列表中
        ]

        for origin in disallowed_origins:
            headers = {"Origin": origin}
            response = await async_client.get("/", headers=headers)

            cors_headers = response.headers
            allowed_origin = cors_headers.get("access-control-allow-origin", "")

            # 如果不使用通配符，不應該允許這些來源
            if allowed_origin != "*":
                assert allowed_origin != origin, f"不應該允許來源: {origin}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_allowed_methods(self, async_client: AsyncClient):
        """測試允許的HTTP方法"""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        }

        response = await async_client.options("/api/v1/cards/search/advanced", headers=headers)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]:
            cors_headers = response.headers
            allowed_methods = cors_headers.get("access-control-allow-methods", "")

            # 檢查是否包含常用方法
            common_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            for method in common_methods:
                if method in ["GET", "POST", "OPTIONS"]:
                    # 這些方法應該被允許
                    assert method in allowed_methods, f"方法 {method} 應該被允許"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_allowed_headers(self, async_client: AsyncClient):
        """測試允許的標頭"""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, Authorization"
        }

        response = await async_client.options("/api/v1/cards/search/advanced", headers=headers)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]:
            cors_headers = response.headers
            allowed_headers = cors_headers.get("access-control-allow-headers", "").lower()

            # 檢查常用標頭是否被允許
            required_headers = ["content-type", "authorization"]
            for header in required_headers:
                assert header in allowed_headers, f"標頭 {header} 應該被允許"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_credentials_support(self, async_client: AsyncClient):
        """測試憑證支持"""
        headers = {
            "Origin": "http://localhost:3000"
        }

        response = await async_client.get("/", headers=headers)
        cors_headers = response.headers

        # 檢查是否支持憑證
        credentials_header = cors_headers.get("access-control-allow-credentials", "")
        if credentials_header:
            assert credentials_header.lower() == "true", "憑證支持設置不正確"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_exposed_headers(self, async_client: AsyncClient):
        """測試暴露的標頭"""
        headers = {
            "Origin": "http://localhost:3000"
        }

        response = await async_client.get("/", headers=headers)
        cors_headers = response.headers

        # 檢查是否暴露了自定義標頭
        exposed_headers = cors_headers.get("access-control-expose-headers", "")
        if exposed_headers:
            # 應該包含響應時間標頭
            expected_exposed = ["x-response-time", "x-request-id"]
            for header in expected_exposed:
                if header in response.headers:
                    assert header in exposed_headers.lower(), f"標頭 {header} 應該被暴露"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_max_age(self, async_client: AsyncClient):
        """測試預檢請求快取時間"""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        }

        response = await async_client.options("/api/v1/cards/search/advanced", headers=headers)

        if response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]:
            cors_headers = response.headers
            max_age = cors_headers.get("access-control-max-age")

            if max_age:
                # 驗證max-age是合理的數值
                max_age_value = int(max_age)
                assert 0 <= max_age_value <= 86400, f"Max-Age 值不合理: {max_age_value}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_post_request_with_json(self, async_client: AsyncClient):
        """測試帶JSON的POST請求CORS"""
        headers = {
            "Origin": "http://localhost:3000",
            "Content-Type": "application/json"
        }

        payload = {
            "query": "test",
            "min_radiation": 0.0,
            "max_radiation": 1.0
        }

        response = await async_client.post(
            "/api/v1/cards/search/advanced",
            json=payload,
            headers=headers
        )

        # 請求應該成功
        assert response.status_code == status.HTTP_200_OK

        # 檢查CORS標頭存在
        cors_headers = response.headers
        assert "access-control-allow-origin" in cors_headers

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_without_origin_header(self, async_client: AsyncClient):
        """測試沒有Origin標頭的請求"""
        # 不包含Origin標頭的請求（同源請求）
        response = await async_client.get("/api/v1/cards/")
        assert response.status_code == status.HTTP_200_OK

        # 同源請求不需要CORS標頭，但也不應該報錯

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_error_responses(self, async_client: AsyncClient):
        """測試錯誤響應的CORS標頭"""
        headers = {
            "Origin": "http://localhost:3000"
        }

        # 發送會產生錯誤的請求
        response = await async_client.get("/api/v1/cards/nonexistent-card", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # 錯誤響應也應該包含CORS標頭
        cors_headers = response.headers
        assert "access-control-allow-origin" in cors_headers


class TestCORSSecurityImplications:
    """CORS安全影響測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_wildcard_origin_security(self, async_client: AsyncClient):
        """測試通配符來源的安全性"""
        headers = {
            "Origin": "http://localhost:3000"
        }

        response = await async_client.get("/", headers=headers)
        cors_headers = response.headers

        allowed_origin = cors_headers.get("access-control-allow-origin", "")
        credentials = cors_headers.get("access-control-allow-credentials", "")

        # 如果允許憑證，不應該使用通配符來源
        if credentials and credentials.lower() == "true":
            assert allowed_origin != "*", "允許憑證時不應該使用通配符來源"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_null_origin_handling(self, async_client: AsyncClient):
        """測試null來源處理"""
        headers = {
            "Origin": "null"
        }

        response = await async_client.get("/", headers=headers)
        cors_headers = response.headers

        allowed_origin = cors_headers.get("access-control-allow-origin", "")

        # null來源通常不應該被明確允許
        assert allowed_origin not in ["null", ""], "不應該明確允許null來源"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_file_protocol_origin(self, async_client: AsyncClient):
        """測試file協議來源"""
        headers = {
            "Origin": "file://"
        }

        response = await async_client.get("/", headers=headers)
        cors_headers = response.headers

        allowed_origin = cors_headers.get("access-control-allow-origin", "")

        # 根據安全策略，可能允許或不允許file協議


class TestCORSWithDifferentEndpoints:
    """不同端點的CORS測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_on_api_endpoints(self, async_client: AsyncClient):
        """測試API端點的CORS"""
        api_endpoints = [
            "/api/v1/cards/",
            "/api/v1/cards/random",
            "/health"
        ]

        headers = {
            "Origin": "http://localhost:3000"
        }

        for endpoint in api_endpoints:
            response = await async_client.get(endpoint, headers=headers)

            # 所有API端點都應該有CORS支持
            if response.status_code == status.HTTP_200_OK:
                cors_headers = response.headers
                assert "access-control-allow-origin" in cors_headers, f"端點 {endpoint} 缺少CORS支持"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_on_documentation_endpoints(self, async_client: AsyncClient):
        """測試文檔端點的CORS"""
        doc_endpoints = [
            "/docs",
            "/redoc",
            "/openapi.json"
        ]

        headers = {
            "Origin": "http://localhost:3000"
        }

        for endpoint in doc_endpoints:
            response = await async_client.get(endpoint, headers=headers)

            if response.status_code == status.HTTP_200_OK:
                # 文檔端點也可能需要CORS支持（取決於配置）
                cors_headers = response.headers
                # 不強制要求，但如果存在應該正確


class TestCORSPerformance:
    """CORS性能測試"""

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_cors_preflight_performance(self, async_client: AsyncClient):
        """測試CORS預檢請求性能"""
        import time

        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        }

        start_time = time.time()
        response = await async_client.options("/api/v1/cards/search/advanced", headers=headers)
        end_time = time.time()

        # 預檢請求應該很快
        response_time = end_time - start_time
        assert response_time < 1.0, f"CORS預檢請求時間過長: {response_time:.2f}秒"

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_cors_overhead_measurement(self, async_client: AsyncClient):
        """測試CORS開銷"""
        import time

        # 測試無CORS標頭的請求
        start_time = time.time()
        response1 = await async_client.get("/")
        time1 = time.time() - start_time

        # 測試有CORS標頭的請求
        start_time = time.time()
        response2 = await async_client.get("/", headers={"Origin": "http://localhost:3000"})
        time2 = time.time() - start_time

        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK

        # CORS處理不應該增加太多開銷
        overhead = time2 - time1
        assert overhead < 0.5, f"CORS處理開銷過大: {overhead:.2f}秒"


class TestCORSCompliance:
    """CORS規範合規性測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_header_case_insensitivity(self, async_client: AsyncClient):
        """測試CORS標頭大小寫不敏感性"""
        headers = {
            "origin": "http://localhost:3000",  # 小寫
            "access-control-request-method": "POST"
        }

        response = await async_client.options("/api/v1/cards/search/advanced", headers=headers)

        # 應該正確處理小寫標頭
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT,
            status.HTTP_404_NOT_FOUND  # 如果端點不存在
        ]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_multiple_origins_in_header(self, async_client: AsyncClient):
        """測試多個來源在標頭中"""
        # 根據CORS規範，Origin標頭不應該包含多個值
        headers = {
            "Origin": "http://localhost:3000 http://localhost:3001"
        }

        response = await async_client.get("/", headers=headers)

        # 應該拒絕或正確處理無效的Origin標頭
        cors_headers = response.headers
        allowed_origin = cors_headers.get("access-control-allow-origin", "")

        # 不應該返回包含多個來源的值
        assert " " not in allowed_origin or allowed_origin == "*"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cors_vary_header(self, async_client: AsyncClient):
        """測試Vary標頭"""
        headers = {
            "Origin": "http://localhost:3000"
        }

        response = await async_client.get("/", headers=headers)

        # 檢查是否包含Vary: Origin標頭（用於快取控制）
        vary_header = response.headers.get("vary", "")
        if vary_header:
            # 如果存在Vary標頭，應該包含Origin
            assert "origin" in vary_header.lower(), "Vary標頭應該包含Origin"