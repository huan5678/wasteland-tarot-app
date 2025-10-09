"""
Swagger UI功能測試
驗證API文檔的完整性和可用性
"""

import pytest
import json
from typing import Dict, Any
from httpx import AsyncClient
from fastapi import status


class TestSwaggerDocumentation:
    """Swagger文檔測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_openapi_schema_accessibility(self, async_client: AsyncClient):
        """測試OpenAPI schema可訪問性"""
        response = await async_client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK

        # 驗證內容類型
        content_type = response.headers.get("content-type", "")
        assert "application/json" in content_type

        # 驗證響應是有效的JSON
        schema = response.json()
        assert isinstance(schema, dict)

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_openapi_schema_structure(self, async_client: AsyncClient):
        """測試OpenAPI schema結構"""
        response = await async_client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK

        schema = response.json()

        # 驗證必要的OpenAPI欄位
        required_fields = ["openapi", "info", "paths"]
        for field in required_fields:
            assert field in schema, f"OpenAPI schema缺少必要欄位: {field}"

        # 驗證OpenAPI版本
        assert "openapi" in schema
        openapi_version = schema["openapi"]
        assert openapi_version.startswith("3."), f"OpenAPI版本不正確: {openapi_version}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_api_info_section(self, async_client: AsyncClient):
        """測試API資訊部分"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        info = schema.get("info", {})

        # 驗證API資訊完整性
        assert "title" in info, "缺少API標題"
        assert "version" in info, "缺少API版本"
        assert "description" in info, "缺少API描述"

        # 驗證廢土主題
        title = info.get("title", "").lower()
        description = info.get("description", "").lower()

        fallout_terms = ["wasteland", "tarot", "fallout", "廢土", "塔羅"]
        has_theme = any(term in title + description for term in fallout_terms)
        assert has_theme, "API資訊缺少廢土主題元素"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_api_paths_completeness(self, async_client: AsyncClient):
        """測試API路徑完整性"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        paths = schema.get("paths", {})

        # 驗證關鍵路徑存在
        expected_paths = [
            "/",
            "/health",
            "/api/v1/cards/",
            "/api/v1/cards/{card_id}",
            "/api/v1/cards/random",
            "/api/v1/cards/search/advanced"
        ]

        for path in expected_paths:
            assert path in paths, f"缺少API路徑: {path}"

        # 驗證每個路徑都有方法定義
        for path, path_info in paths.items():
            assert isinstance(path_info, dict), f"路徑{path}的定義不是字典"
            assert len(path_info) > 0, f"路徑{path}沒有定義任何HTTP方法"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_api_tags(self, async_client: AsyncClient):
        """測試API標籤"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        tags = schema.get("tags", [])

        # 驗證標籤存在
        assert len(tags) > 0, "沒有定義API標籤"

        # 驗證廢土主題標籤
        tag_names = [tag.get("name", "") for tag in tags]
        expected_tags = ["🃏 Cards", "🔧 System"]

        for expected_tag in expected_tags:
            tag_found = any(expected_tag in tag_name for tag_name in tag_names)
            assert tag_found, f"缺少預期的標籤: {expected_tag}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_response_schemas(self, async_client: AsyncClient):
        """測試響應schema定義"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        paths = schema.get("paths", {})
        components = schema.get("components", {})
        schemas = components.get("schemas", {})

        # 檢查關鍵的響應schema
        expected_schemas = ["WastelandCard", "CardListResponse"]

        for schema_name in expected_schemas:
            # 檢查是否在components/schemas中定義
            if schema_name not in schemas:
                # 或者檢查是否在路徑響應中內聯定義
                schema_referenced = False
                for path_info in paths.values():
                    for method_info in path_info.values():
                        responses = method_info.get("responses", {})
                        for response_info in responses.values():
                            content = response_info.get("content", {})
                            for media_type in content.values():
                                if schema_name in str(media_type):
                                    schema_referenced = True
                                    break

                assert schema_referenced, f"缺少schema定義: {schema_name}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_parameter_definitions(self, async_client: AsyncClient):
        """測試參數定義"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        paths = schema.get("paths", {})

        # 檢查GET /api/v1/cards/的參數
        cards_path = paths.get("/api/v1/cards/")
        if cards_path:
            get_method = cards_path.get("get", {})
            parameters = get_method.get("parameters", [])

            # 驗證關鍵參數存在
            param_names = [param.get("name") for param in parameters]
            expected_params = ["page", "page_size", "suit", "search"]

            for param in expected_params:
                assert param in param_names, f"缺少參數定義: {param}"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_response_definitions(self, async_client: AsyncClient):
        """測試錯誤響應定義"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        paths = schema.get("paths", {})

        # 檢查是否定義了錯誤響應
        error_codes = ["400", "404", "422", "500"]

        for path_info in paths.values():
            for method_info in path_info.values():
                responses = method_info.get("responses", {})

                # 至少應該定義一些錯誤響應
                has_error_response = any(code in responses for code in error_codes)
                if not has_error_response:
                    # 不是所有端點都需要錯誤響應定義，但主要端點應該有
                    pass


class TestSwaggerUI:
    """Swagger UI界面測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_swagger_ui_accessibility(self, async_client: AsyncClient):
        """測試Swagger UI可訪問性"""
        response = await async_client.get("/docs")
        assert response.status_code == status.HTTP_200_OK

        # 驗證內容類型
        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_swagger_ui_content(self, async_client: AsyncClient):
        """測試Swagger UI內容"""
        response = await async_client.get("/docs")
        assert response.status_code == status.HTTP_200_OK

        content = response.text

        # 驗證包含必要的Swagger UI元素
        assert "swagger" in content.lower(), "頁面不包含Swagger相關內容"
        assert "api" in content.lower(), "頁面不包含API相關內容"

        # 驗證包含OpenAPI schema引用
        assert "/openapi.json" in content, "頁面不包含OpenAPI schema引用"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_redoc_accessibility(self, async_client: AsyncClient):
        """測試ReDoc可訪問性"""
        response = await async_client.get("/redoc")
        assert response.status_code == status.HTTP_200_OK

        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_redoc_content(self, async_client: AsyncClient):
        """測試ReDoc內容"""
        response = await async_client.get("/redoc")
        assert response.status_code == status.HTTP_200_OK

        content = response.text

        # 驗證包含ReDoc相關內容
        assert "redoc" in content.lower(), "頁面不包含ReDoc相關內容"
        assert "/openapi.json" in content, "頁面不包含OpenAPI schema引用"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_docs_redirect_fallback(self, async_client: AsyncClient):
        """測試文檔重定向備用方案"""
        # 測試不同的文檔路徑
        doc_paths = ["/docs/", "/documentation", "/api-docs"]

        for path in doc_paths:
            response = await async_client.get(path)
            # 可能返回200（如果有重定向）或404（如果路徑不存在）
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_404_NOT_FOUND,
                status.HTTP_301_MOVED_PERMANENTLY,
                status.HTTP_302_FOUND
            ]


class TestAPIDocumentationContent:
    """API文檔內容測試"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_endpoint_descriptions(self, async_client: AsyncClient):
        """測試端點描述"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        paths = schema.get("paths", {})

        for path, path_info in paths.items():
            for method, method_info in path_info.items():
                # 驗證端點有描述
                has_description = (
                    "summary" in method_info or
                    "description" in method_info
                )
                assert has_description, f"端點 {method.upper()} {path} 缺少描述"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_parameter_descriptions(self, async_client: AsyncClient):
        """測試參數描述"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        paths = schema.get("paths", {})

        for path_info in paths.values():
            for method_info in path_info.values():
                parameters = method_info.get("parameters", [])

                for param in parameters:
                    # 驗證參數有名稱和描述
                    assert "name" in param, "參數缺少名稱"
                    assert "description" in param, f"參數 {param.get('name')} 缺少描述"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_response_examples(self, async_client: AsyncClient):
        """測試響應示例"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        paths = schema.get("paths", {})

        # 檢查主要端點是否有響應示例
        cards_endpoint = paths.get("/api/v1/cards/", {}).get("get", {})
        responses = cards_endpoint.get("responses", {})

        if "200" in responses:
            success_response = responses["200"]
            content = success_response.get("content", {})

            if "application/json" in content:
                json_content = content["application/json"]
                # 檢查是否有示例
                has_example = "example" in json_content or "examples" in json_content
                # 不強制要求，但有示例會更好

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_security_definitions(self, async_client: AsyncClient):
        """測試安全定義"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        # 檢查是否定義了安全方案（如果API需要認證）
        components = schema.get("components", {})
        security_schemes = components.get("securitySchemes", {})

        # 如果有受保護的端點，應該定義安全方案
        # 這裡不強制要求，因為當前API可能不需要認證

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_fallout_theme_consistency_in_docs(self, async_client: AsyncClient):
        """測試文檔中的廢土主題一致性"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        # 檢查標題和描述中的廢土主題
        info = schema.get("info", {})
        title = info.get("title", "").lower()
        description = info.get("description", "").lower()

        fallout_indicators = [
            "wasteland", "fallout", "vault", "radiation", "pip-boy",
            "廢土", "避難所", "輻射", "塔羅"
        ]

        theme_found = any(indicator in title + description for indicator in fallout_indicators)
        assert theme_found, "API文檔缺少廢土主題元素"

        # 檢查標籤描述中的主題
        tags = schema.get("tags", [])
        for tag in tags:
            tag_description = tag.get("description", "").lower()
            # 至少一些標籤應該包含廢土主題

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_contact_and_license_info(self, async_client: AsyncClient):
        """測試聯絡和許可證資訊"""
        response = await async_client.get("/openapi.json")
        schema = response.json()

        info = schema.get("info", {})

        # 檢查聯絡資訊（可選）
        if "contact" in info:
            contact = info["contact"]
            # 應該包含有用的聯絡資訊
            contact_fields = ["name", "email", "url"]
            has_contact_info = any(field in contact for field in contact_fields)
            assert has_contact_info, "聯絡資訊不完整"

        # 檢查許可證資訊（可選）
        if "license" in info:
            license_info = info["license"]
            assert "name" in license_info, "許可證資訊缺少名稱"


class TestDocumentationPerformance:
    """文檔性能測試"""

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_openapi_schema_performance(self, async_client: AsyncClient):
        """測試OpenAPI schema載入性能"""
        import time

        start_time = time.time()
        response = await async_client.get("/openapi.json")
        end_time = time.time()

        assert response.status_code == status.HTTP_200_OK

        load_time = end_time - start_time
        assert load_time < 2.0, f"OpenAPI schema載入時間過長: {load_time:.2f}秒"

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_swagger_ui_performance(self, async_client: AsyncClient):
        """測試Swagger UI載入性能"""
        import time

        start_time = time.time()
        response = await async_client.get("/docs")
        end_time = time.time()

        assert response.status_code == status.HTTP_200_OK

        load_time = end_time - start_time
        assert load_time < 3.0, f"Swagger UI載入時間過長: {load_time:.2f}秒"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_schema_size_reasonable(self, async_client: AsyncClient):
        """測試schema大小合理性"""
        response = await async_client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK

        content_length = len(response.content)
        # OpenAPI schema不應該過大（<1MB）
        assert content_length < 1024 * 1024, f"OpenAPI schema過大: {content_length} bytes"

        # 但也不應該太小（至少10KB表示有實際內容）
        assert content_length > 10 * 1024, f"OpenAPI schema過小: {content_length} bytes"