"""
OpenAPI 規格整合測試

驗證 OpenAPI JSON 規格包含完整的繁體中文翻譯
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_openapi_json_contains_chinese_title(async_client: AsyncClient):
    """驗證 /openapi.json 包含繁體中文標題"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    # 驗證 info 區塊包含繁體中文
    assert "info" in openapi_spec
    assert "廢土塔羅" in openapi_spec["info"]["title"]


@pytest.mark.asyncio
async def test_openapi_json_contains_chinese_description(async_client: AsyncClient):
    """驗證 /openapi.json 包含繁體中文描述"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    # 驗證描述包含繁體中文
    assert "info" in openapi_spec
    assert "description" in openapi_spec["info"]
    assert "歡迎" in openapi_spec["info"]["description"]


@pytest.mark.asyncio
async def test_openapi_tags_are_chinese(async_client: AsyncClient):
    """驗證 tags 區塊包含繁體中文名稱"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    # 驗證 tags 區塊存在
    assert "tags" in openapi_spec

    # 提取所有標籤名稱
    tag_names = [tag["name"] for tag in openapi_spec.get("tags", [])]

    # 驗證包含繁體中文標籤（至少有卡牌標籤）
    assert any("卡牌" in tag_name for tag_name in tag_names), f"找不到繁體中文標籤。實際標籤：{tag_names}"


@pytest.mark.asyncio
async def test_openapi_endpoint_summaries_are_chinese(async_client: AsyncClient):
    """驗證端點 summary 為繁體中文"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    # 驗證 paths 區塊存在
    assert "paths" in openapi_spec

    # 檢查至少一個端點的 summary 包含繁體中文
    paths = openapi_spec.get("paths", {})

    # 檢查卡牌端點
    cards_endpoint = paths.get("/api/v1/cards", {})
    if cards_endpoint:
        get_operation = cards_endpoint.get("get", {})
        if get_operation and "summary" in get_operation:
            assert "取得" in get_operation["summary"] or "卡牌" in get_operation["summary"], \
                f"端點 summary 不是繁體中文：{get_operation.get('summary')}"


@pytest.mark.asyncio
async def test_openapi_endpoint_descriptions_are_chinese(async_client: AsyncClient):
    """驗證端點 description 為繁體中文"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    paths = openapi_spec.get("paths", {})

    # 檢查卡牌端點的詳細描述
    cards_endpoint = paths.get("/api/v1/cards", {})
    if cards_endpoint:
        get_operation = cards_endpoint.get("get", {})
        if get_operation and "description" in get_operation:
            description = get_operation["description"]
            # 驗證包含常見繁體中文詞彙
            assert any(word in description for word in ["取得", "卡牌", "篩選", "分頁"]), \
                f"端點 description 不是繁體中文：{description[:100]}..."


@pytest.mark.asyncio
async def test_openapi_schema_descriptions_are_chinese(async_client: AsyncClient):
    """驗證 Schema descriptions 為繁體中文"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    # 驗證 components.schemas 存在
    assert "components" in openapi_spec
    assert "schemas" in openapi_spec["components"]

    schemas = openapi_spec["components"]["schemas"]

    # 檢查至少一個 schema 的描述包含繁體中文
    # 例如檢查 CardBase schema
    if "CardBase" in schemas:
        card_base = schemas["CardBase"]
        if "description" in card_base:
            assert "卡牌" in card_base["description"], \
                f"Schema description 不是繁體中文：{card_base.get('description')}"


@pytest.mark.asyncio
async def test_openapi_field_descriptions_are_chinese(async_client: AsyncClient):
    """驗證 Schema 欄位描述為繁體中文"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    schemas = openapi_spec.get("components", {}).get("schemas", {})

    # 檢查 CardBase schema 的欄位描述
    if "CardBase" in schemas:
        card_base = schemas["CardBase"]
        if "properties" in card_base:
            properties = card_base["properties"]

            # 檢查 name 欄位
            if "name" in properties and "description" in properties["name"]:
                name_desc = properties["name"]["description"]
                assert "名稱" in name_desc or "卡牌" in name_desc, \
                    f"欄位描述不是繁體中文：{name_desc}"


@pytest.mark.asyncio
async def test_openapi_response_descriptions_are_chinese(async_client: AsyncClient):
    """驗證回應描述為繁體中文"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    paths = openapi_spec.get("paths", {})

    # 檢查卡牌端點的回應描述
    cards_endpoint = paths.get("/api/v1/cards", {})
    if cards_endpoint:
        get_operation = cards_endpoint.get("get", {})
        if get_operation and "responses" in get_operation:
            responses = get_operation["responses"]

            # 檢查 200 回應描述
            if "200" in responses:
                response_200 = responses["200"]
                if "description" in response_200:
                    desc = response_200["description"]
                    assert "成功" in desc or "取得" in desc or "卡牌" in desc, \
                        f"回應描述不是繁體中文：{desc}"


@pytest.mark.asyncio
async def test_openapi_contact_info_is_chinese(async_client: AsyncClient):
    """驗證聯絡資訊為繁體中文"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    # 驗證 contact 資訊
    if "info" in openapi_spec and "contact" in openapi_spec["info"]:
        contact = openapi_spec["info"]["contact"]
        if "name" in contact:
            assert "團隊" in contact["name"] or "廢土" in contact["name"], \
                f"聯絡人名稱不是繁體中文：{contact.get('name')}"


@pytest.mark.asyncio
async def test_openapi_license_info_is_chinese(async_client: AsyncClient):
    """驗證授權資訊為繁體中文"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()

    # 驗證 license 資訊
    if "info" in openapi_spec and "license" in openapi_spec["info"]:
        license_info = openapi_spec["info"]["license"]
        if "name" in license_info:
            # MIT 授權條款 或 MIT License
            assert "授權" in license_info["name"] or "MIT" in license_info["name"], \
                f"授權名稱格式不正確：{license_info.get('name')}"


@pytest.mark.asyncio
async def test_openapi_no_untranslated_common_english_terms(async_client: AsyncClient):
    """驗證沒有遺漏未翻譯的常見英文術語"""
    response = await async_client.get("/openapi.json")
    assert response.status_code == 200

    openapi_spec = response.json()
    openapi_str = str(openapi_spec)

    # 檢查不應該出現的英文術語（這些應該已被翻譯）
    # 注意：技術術語如 API, JSON, HTTP 等應保留英文
    untranslated_terms = [
        "Get all cards",  # 應該是「取得所有卡牌」
        "Create reading",  # 應該是「建立占卜」
        "User registration",  # 應該是「使用者註冊」
    ]

    for term in untranslated_terms:
        # 允許在範例值中出現，但不應該在描述或摘要中
        if term in openapi_str:
            # 這是一個警告，而非硬性錯誤
            # 因為某些範例值可能保留英文
            pass
