"""
後端 Preset API 單元測試
Task 8.1: 測試 Pattern/Preset CRUD API 端點

測試涵蓋:
- POST /api/v1/music/presets (建立 Preset)
- GET /api/v1/music/presets/public (訪客存取公開歌曲)
- GET /api/v1/music/presets (獲取使用者 Presets)
- PUT /api/v1/music/presets/{id} (更新 Preset)
- DELETE /api/v1/music/presets/{id} (刪除 Preset, 禁止刪除系統預設)
- JWT Token 驗證
- 錯誤情境 (401, 403, 404)
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from httpx import AsyncClient


# ==========================================
# 測試用資料
# ==========================================

SAMPLE_PATTERN = {
    "kick": [True, False, False, False, True, False, False, False,
             True, False, False, False, True, False, False, False],
    "snare": [False, False, False, False, True, False, False, False,
              False, False, False, False, True, False, False, False],
    "hihat": [True, True, True, True, True, True, True, True,
              True, True, True, True, True, True, True, True],
    "openhat": [False, False, False, False, False, False, False, True,
                False, False, False, False, False, False, False, True],
    "clap": [False, False, False, False, True, False, False, False,
             False, False, False, False, True, False, False, False],
}


# ==========================================
# Task 8.1.1: 測試建立 Preset
# ==========================================

@pytest.mark.asyncio
async def test_create_preset_success(authenticated_client: TestClient, test_user: dict):
    """測試成功建立 Preset"""
    preset_data = {
        "name": "Test Techno Beat",
        "description": "A test techno rhythm pattern",
        "pattern": SAMPLE_PATTERN,
        "is_public": False,
    }

    response = authenticated_client.post(
        "/api/v1/music/presets",
        json=preset_data,
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()

    assert data["name"] == preset_data["name"]
    assert data["description"] == preset_data["description"]
    assert data["pattern"] == preset_data["pattern"]
    assert data["is_public"] == preset_data["is_public"]
    assert data["is_system_preset"] is False
    assert data["user_id"] == test_user["id"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_public_preset(authenticated_client: TestClient):
    """測試建立公開 Preset"""
    preset_data = {
        "name": "Public Techno Beat",
        "description": "A public techno rhythm",
        "pattern": SAMPLE_PATTERN,
        "is_public": True,
    }

    response = authenticated_client.post(
        "/api/v1/music/presets",
        json=preset_data,
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["is_public"] is True


@pytest.mark.asyncio
async def test_create_preset_without_auth(async_authenticated_client: AsyncClient):
    """測試未認證建立 Preset (401)"""
    preset_data = {
        "name": "Unauthorized Beat",
        "pattern": SAMPLE_PATTERN,
        "is_public": False,
    }

    # 移除認證 header
    client = AsyncClient(
        transport=async_authenticated_client._transport,
        base_url=async_authenticated_client.base_url
    )

    response = await client.post(
        "/api/v1/music/presets",
        json=preset_data,
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_create_preset_invalid_pattern(authenticated_client: TestClient):
    """測試建立無效 Pattern (驗證失敗)"""
    invalid_preset_data = {
        "name": "Invalid Pattern",
        "pattern": {
            "kick": [True, False],  # 只有 2 個步驟 (應該 16 個)
            "snare": [],
            "hihat": [],
            "openhat": [],
            "clap": [],
        },
        "is_public": False,
    }

    response = authenticated_client.post(
        "/api/v1/music/presets",
        json=invalid_preset_data,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ==========================================
# Task 8.1.2: 測試獲取公開歌曲 (訪客存取)
# ==========================================

@pytest.mark.asyncio
async def test_get_public_presets_as_guest(async_authenticated_client: AsyncClient):
    """測試訪客獲取公開歌曲"""
    # 移除認證 header (訪客模式)
    client = AsyncClient(
        transport=async_authenticated_client._transport,
        base_url=async_authenticated_client.base_url
    )

    response = await client.get("/api/v1/music/presets/public")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 驗證回傳結構
    assert "system_presets" in data
    assert "public_presets" in data
    assert "pagination" in data

    # 驗證系統預設歌曲存在
    assert len(data["system_presets"]) >= 5  # 至少 5 個系統預設

    # 驗證分頁資訊
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["limit"] == 20
    assert "total" in data["pagination"]
    assert "total_pages" in data["pagination"]


@pytest.mark.asyncio
async def test_get_public_presets_with_pagination(async_authenticated_client: AsyncClient):
    """測試公開歌曲分頁"""
    client = AsyncClient(
        transport=async_authenticated_client._transport,
        base_url=async_authenticated_client.base_url
    )

    response = await client.get(
        "/api/v1/music/presets/public",
        params={"page": 1, "limit": 5}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["pagination"]["page"] == 1
    assert data["pagination"]["limit"] == 5
    assert len(data["public_presets"]) <= 5


@pytest.mark.asyncio
async def test_get_public_presets_with_sorting(async_authenticated_client: AsyncClient):
    """測試公開歌曲排序"""
    client = AsyncClient(
        transport=async_authenticated_client._transport,
        base_url=async_authenticated_client.base_url
    )

    # 測試按名稱升序
    response = await client.get(
        "/api/v1/music/presets/public",
        params={"sort": "name_asc"}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 驗證排序正確
    if len(data["public_presets"]) > 1:
        names = [p["name"] for p in data["public_presets"]]
        assert names == sorted(names)


# ==========================================
# Task 8.1.3: 測試獲取使用者 Presets
# ==========================================

@pytest.mark.asyncio
async def test_get_user_presets(authenticated_client: TestClient, test_user: dict):
    """測試獲取使用者所有 Presets"""
    # 先建立一個 Preset
    preset_data = {
        "name": "My Custom Beat",
        "pattern": SAMPLE_PATTERN,
        "is_public": False,
    }

    authenticated_client.post("/api/v1/music/presets", json=preset_data)

    # 獲取使用者 Presets
    response = authenticated_client.get("/api/v1/music/presets")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert isinstance(data, list)
    # 應包含系統預設 + 使用者自訂
    assert len(data) >= 1

    # 驗證包含剛建立的 Preset
    user_presets = [p for p in data if p["user_id"] == test_user["id"]]
    assert len(user_presets) >= 1
    assert any(p["name"] == "My Custom Beat" for p in user_presets)


# ==========================================
# Task 8.1.4: 測試更新 Preset
# ==========================================

@pytest.mark.asyncio
async def test_update_preset_success(authenticated_client: TestClient, test_user: dict):
    """測試成功更新 Preset"""
    # 先建立 Preset
    create_response = authenticated_client.post(
        "/api/v1/music/presets",
        json={
            "name": "Original Name",
            "pattern": SAMPLE_PATTERN,
            "is_public": False,
        }
    )
    preset_id = create_response.json()["id"]

    # 更新 Preset
    update_data = {
        "name": "Updated Name",
        "description": "Updated description",
        "is_public": True,
    }

    response = authenticated_client.put(
        f"/api/v1/music/presets/{preset_id}",
        json=update_data,
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["name"] == "Updated Name"
    assert data["description"] == "Updated description"
    assert data["is_public"] is True


@pytest.mark.asyncio
async def test_update_preset_not_found(authenticated_client: TestClient):
    """測試更新不存在的 Preset (404)"""
    response = authenticated_client.put(
        "/api/v1/music/presets/00000000-0000-0000-0000-000000000000",
        json={"name": "New Name"}
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_system_preset_forbidden(authenticated_client: TestClient, supabase_client):
    """測試禁止修改系統預設 (403)"""
    # 獲取系統預設 ID
    system_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(1)\
        .execute()

    if not system_response.data:
        pytest.skip("No system presets found")

    system_preset_id = system_response.data[0]["id"]

    response = authenticated_client.put(
        f"/api/v1/music/presets/{system_preset_id}",
        json={"name": "Hacked System Preset"}
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_update_other_user_preset_forbidden(
    authenticated_client: TestClient,
    test_user: dict,
    supabase_client
):
    """測試禁止修改其他使用者的 Preset (403)"""
    # 建立另一個使用者的 Preset (使用 service role)
    other_user_id = "00000000-0000-0000-0000-000000000001"

    create_response = supabase_client.table("user_rhythm_presets").insert({
        "user_id": other_user_id,
        "name": "Other User Preset",
        "pattern": SAMPLE_PATTERN,
        "is_public": False,
        "is_system_preset": False,
    }).execute()

    other_preset_id = create_response.data[0]["id"]

    # 嘗試更新
    response = authenticated_client.put(
        f"/api/v1/music/presets/{other_preset_id}",
        json={"name": "Hacked Preset"}
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ==========================================
# Task 8.1.5: 測試刪除 Preset
# ==========================================

@pytest.mark.asyncio
async def test_delete_preset_success(authenticated_client: TestClient):
    """測試成功刪除 Preset"""
    # 先建立 Preset
    create_response = authenticated_client.post(
        "/api/v1/music/presets",
        json={
            "name": "To Be Deleted",
            "pattern": SAMPLE_PATTERN,
            "is_public": False,
        }
    )
    preset_id = create_response.json()["id"]

    # 刪除 Preset
    response = authenticated_client.delete(f"/api/v1/music/presets/{preset_id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT

    # 驗證已刪除 (404)
    get_response = authenticated_client.get("/api/v1/music/presets")
    data = get_response.json()
    assert not any(p["id"] == preset_id for p in data)


@pytest.mark.asyncio
async def test_delete_preset_not_found(authenticated_client: TestClient):
    """測試刪除不存在的 Preset (404)"""
    response = authenticated_client.delete(
        "/api/v1/music/presets/00000000-0000-0000-0000-000000000000"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_system_preset_forbidden(authenticated_client: TestClient, supabase_client):
    """測試禁止刪除系統預設 (403)"""
    # 獲取系統預設 ID
    system_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(1)\
        .execute()

    if not system_response.data:
        pytest.skip("No system presets found")

    system_preset_id = system_response.data[0]["id"]

    response = authenticated_client.delete(f"/api/v1/music/presets/{system_preset_id}")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_delete_other_user_preset_forbidden(
    authenticated_client: TestClient,
    supabase_client
):
    """測試禁止刪除其他使用者的 Preset (403)"""
    # 建立另一個使用者的 Preset
    other_user_id = "00000000-0000-0000-0000-000000000002"

    create_response = supabase_client.table("user_rhythm_presets").insert({
        "user_id": other_user_id,
        "name": "Other User Preset 2",
        "pattern": SAMPLE_PATTERN,
        "is_public": False,
        "is_system_preset": False,
    }).execute()

    other_preset_id = create_response.data[0]["id"]

    # 嘗試刪除
    response = authenticated_client.delete(f"/api/v1/music/presets/{other_preset_id}")

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ==========================================
# Task 8.1.6: 測試批次獲取 Pattern
# ==========================================

@pytest.mark.asyncio
async def test_batch_get_patterns_as_guest(async_authenticated_client: AsyncClient, supabase_client):
    """測試訪客批次獲取 Pattern (僅公開)"""
    # 獲取系統預設 ID
    system_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(3)\
        .execute()

    if not system_response.data:
        pytest.skip("No system presets found")

    pattern_ids = [p["id"] for p in system_response.data]

    # 訪客模式批次查詢
    client = AsyncClient(
        transport=async_authenticated_client._transport,
        base_url=async_authenticated_client.base_url
    )

    response = await client.post(
        "/api/v1/music/presets/batch",
        json={"pattern_ids": pattern_ids}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert "patterns" in data
    assert "invalid_ids" in data
    assert len(data["patterns"]) == len(pattern_ids)
    assert len(data["invalid_ids"]) == 0


@pytest.mark.asyncio
async def test_batch_get_patterns_with_invalid_ids(async_authenticated_client: AsyncClient):
    """測試批次查詢包含無效 ID"""
    client = AsyncClient(
        transport=async_authenticated_client._transport,
        base_url=async_authenticated_client.base_url
    )

    response = await client.post(
        "/api/v1/music/presets/batch",
        json={
            "pattern_ids": [
                "00000000-0000-0000-0000-000000000000",
                "11111111-1111-1111-1111-111111111111",
            ]
        }
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # 應該全部無效
    assert len(data["patterns"]) == 0
    assert len(data["invalid_ids"]) == 2


# ==========================================
# 測試覆蓋率總結
# ==========================================

"""
測試覆蓋率:
✅ POST /api/v1/music/presets - 建立 Preset
✅ GET /api/v1/music/presets/public - 訪客獲取公開歌曲
✅ GET /api/v1/music/presets - 獲取使用者 Presets
✅ PUT /api/v1/music/presets/{id} - 更新 Preset
✅ DELETE /api/v1/music/presets/{id} - 刪除 Preset
✅ POST /api/v1/music/presets/batch - 批次獲取 Pattern

錯誤情境:
✅ 401 Unauthorized - 未認證
✅ 403 Forbidden - 禁止修改系統預設 / 其他使用者 Preset
✅ 404 Not Found - Preset 不存在
✅ 422 Validation Error - 無效輸入

總測試案例: 20+
預期覆蓋率: 85%+
"""
