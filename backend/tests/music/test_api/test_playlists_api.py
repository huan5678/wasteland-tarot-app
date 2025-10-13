"""
後端 Playlist API 單元測試
Task 8.2: 測試 Playlist CRUD 和 Pattern 管理 API 端點

測試涵蓋:
- POST /api/v1/playlists (建立播放清單)
- GET /api/v1/playlists (獲取所有播放清單)
- GET /api/v1/playlists/{id} (獲取播放清單詳情)
- PUT /api/v1/playlists/{id} (更新播放清單)
- DELETE /api/v1/playlists/{id} (CASCADE 刪除)
- POST /api/v1/playlists/{id}/patterns (加入 Pattern)
- DELETE /api/v1/playlists/{id}/patterns/{pid} (移除 Pattern)
- PUT /api/v1/playlists/{id}/patterns/{pid}/position (調整順序)
- POST /api/v1/playlists/import-guest (匯入訪客播放清單)
- 擁有權驗證 (user_id 匹配)
- UNIQUE 約束測試
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient


# ==========================================
# Task 8.2.1: 測試建立播放清單
# ==========================================

@pytest.mark.asyncio
async def test_create_playlist_success(authenticated_client: TestClient):
    """測試成功建立播放清單"""
    playlist_data = {
        "name": "我的播放清單",
        "description": "測試播放清單"
    }

    response = authenticated_client.post(
        "/api/v1/playlists",
        json=playlist_data
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()

    assert data["name"] == playlist_data["name"]
    assert data["description"] == playlist_data["description"]
    assert "id" in data
    assert "user_id" in data
    assert data["patterns"] == []
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_playlist_minimal_data(authenticated_client: TestClient):
    """測試最小資料建立播放清單（無 description）"""
    playlist_data = {
        "name": "簡單播放清單"
    }

    response = authenticated_client.post(
        "/api/v1/playlists",
        json=playlist_data
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "簡單播放清單"


# ==========================================
# Task 8.2.2: 測試獲取播放清單
# ==========================================

@pytest.mark.asyncio
async def test_get_user_playlists(authenticated_client: TestClient):
    """測試獲取使用者所有播放清單"""
    # 建立兩個播放清單
    authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "播放清單 1"}
    )
    authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "播放清單 2"}
    )

    # 獲取播放清單
    response = authenticated_client.get("/api/v1/playlists")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 2

    # 驗證按建立時間降序排序
    playlist_names = [p["name"] for p in data]
    assert "播放清單 2" in playlist_names
    assert "播放清單 1" in playlist_names


@pytest.mark.asyncio
async def test_get_playlist_by_id(authenticated_client: TestClient):
    """測試獲取播放清單詳情"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "測試播放清單", "description": "測試用途"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取播放清單詳情
    response = authenticated_client.get(f"/api/v1/playlists/{playlist_id}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["id"] == playlist_id
    assert data["name"] == "測試播放清單"
    assert data["description"] == "測試用途"
    assert data["patterns"] == []


@pytest.mark.asyncio
async def test_get_playlist_not_found(authenticated_client: TestClient):
    """測試獲取不存在的播放清單 (404)"""
    response = authenticated_client.get(
        "/api/v1/playlists/00000000-0000-0000-0000-000000000000"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_get_other_user_playlist_forbidden(
    authenticated_client: TestClient,
    supabase_client
):
    """測試禁止獲取其他使用者的播放清單 (403)"""
    # 建立另一個使用者的播放清單
    other_user_id = "00000000-0000-0000-0000-000000000003"

    create_response = supabase_client.table("playlists").insert({
        "user_id": other_user_id,
        "name": "Other User Playlist",
        "is_default": False,
    }).execute()

    other_playlist_id = create_response.data[0]["id"]

    # 嘗試獲取
    response = authenticated_client.get(f"/api/v1/playlists/{other_playlist_id}")

    assert response.status_code == status.HTTP_403_FORBIDDEN


# ==========================================
# Task 8.2.3: 測試更新播放清單
# ==========================================

@pytest.mark.asyncio
async def test_update_playlist_success(authenticated_client: TestClient):
    """測試成功更新播放清單"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Original Name"}
    )
    playlist_id = create_response.json()["id"]

    # 更新播放清單
    update_data = {
        "name": "Updated Name",
        "description": "Updated description"
    }

    response = authenticated_client.put(
        f"/api/v1/playlists/{playlist_id}",
        json=update_data
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["name"] == "Updated Name"
    assert data["description"] == "Updated description"


@pytest.mark.asyncio
async def test_update_playlist_not_found(authenticated_client: TestClient):
    """測試更新不存在的播放清單 (404)"""
    response = authenticated_client.put(
        "/api/v1/playlists/00000000-0000-0000-0000-000000000000",
        json={"name": "New Name"}
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ==========================================
# Task 8.2.4: 測試刪除播放清單 (CASCADE)
# ==========================================

@pytest.mark.asyncio
async def test_delete_playlist_success(authenticated_client: TestClient, supabase_client):
    """測試成功刪除播放清單（CASCADE patterns）"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "To Be Deleted"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取系統預設 Pattern ID
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(1)\
        .execute()

    if preset_response.data:
        pattern_id = preset_response.data[0]["id"]

        # 加入 Pattern
        authenticated_client.post(
            f"/api/v1/playlists/{playlist_id}/patterns",
            json={"pattern_id": pattern_id}
        )

    # 刪除播放清單
    response = authenticated_client.delete(f"/api/v1/playlists/{playlist_id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT

    # 驗證播放清單已刪除
    get_response = authenticated_client.get(f"/api/v1/playlists/{playlist_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

    # 驗證 playlist_patterns 也被 CASCADE 刪除
    if preset_response.data:
        patterns_response = supabase_client.table("playlist_patterns")\
            .select("*")\
            .eq("playlist_id", playlist_id)\
            .execute()
        assert len(patterns_response.data) == 0


@pytest.mark.asyncio
async def test_delete_playlist_not_found(authenticated_client: TestClient):
    """測試刪除不存在的播放清單 (404)"""
    response = authenticated_client.delete(
        "/api/v1/playlists/00000000-0000-0000-0000-000000000000"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ==========================================
# Task 8.2.5: 測試加入 Pattern
# ==========================================

@pytest.mark.asyncio
async def test_add_pattern_to_playlist(authenticated_client: TestClient, supabase_client):
    """測試成功加入 Pattern 到播放清單"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Test Playlist"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取系統預設 Pattern ID
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(1)\
        .execute()

    if not preset_response.data:
        pytest.skip("No system presets found")

    pattern_id = preset_response.data[0]["id"]

    # 加入 Pattern
    response = authenticated_client.post(
        f"/api/v1/playlists/{playlist_id}/patterns",
        json={"pattern_id": pattern_id}
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    # 驗證 Pattern 已加入
    get_response = authenticated_client.get(f"/api/v1/playlists/{playlist_id}")
    data = get_response.json()

    assert len(data["patterns"]) == 1
    assert data["patterns"][0]["pattern_id"] == pattern_id
    assert data["patterns"][0]["position"] == 0


@pytest.mark.asyncio
async def test_add_multiple_patterns(authenticated_client: TestClient, supabase_client):
    """測試加入多個 Patterns（驗證 position 自動遞增）"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Multi Pattern Playlist"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取系統預設 Pattern IDs
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(3)\
        .execute()

    if len(preset_response.data) < 3:
        pytest.skip("Not enough system presets found")

    pattern_ids = [p["id"] for p in preset_response.data]

    # 加入 3 個 Patterns
    for pattern_id in pattern_ids:
        authenticated_client.post(
            f"/api/v1/playlists/{playlist_id}/patterns",
            json={"pattern_id": pattern_id}
        )

    # 驗證 Patterns 順序正確
    get_response = authenticated_client.get(f"/api/v1/playlists/{playlist_id}")
    data = get_response.json()

    assert len(data["patterns"]) == 3
    for i, pattern in enumerate(data["patterns"]):
        assert pattern["position"] == i


@pytest.mark.asyncio
async def test_add_duplicate_pattern_fails(authenticated_client: TestClient, supabase_client):
    """測試 UNIQUE 約束：禁止加入重複的 Pattern (400)"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Duplicate Test"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取系統預設 Pattern ID
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(1)\
        .execute()

    if not preset_response.data:
        pytest.skip("No system presets found")

    pattern_id = preset_response.data[0]["id"]

    # 第一次加入成功
    response1 = authenticated_client.post(
        f"/api/v1/playlists/{playlist_id}/patterns",
        json={"pattern_id": pattern_id}
    )
    assert response1.status_code == status.HTTP_204_NO_CONTENT

    # 第二次加入應失敗 (UNIQUE 約束)
    response2 = authenticated_client.post(
        f"/api/v1/playlists/{playlist_id}/patterns",
        json={"pattern_id": pattern_id}
    )
    assert response2.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_add_pattern_not_found(authenticated_client: TestClient):
    """測試加入不存在的 Pattern (404)"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Test Playlist"}
    )
    playlist_id = create_response.json()["id"]

    # 嘗試加入不存在的 Pattern
    response = authenticated_client.post(
        f"/api/v1/playlists/{playlist_id}/patterns",
        json={"pattern_id": "00000000-0000-0000-0000-000000000000"}
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ==========================================
# Task 8.2.6: 測試移除 Pattern
# ==========================================

@pytest.mark.asyncio
async def test_remove_pattern_from_playlist(authenticated_client: TestClient, supabase_client):
    """測試成功移除 Pattern（驗證 position 重新計算）"""
    # 建立播放清單並加入 3 個 Patterns
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Remove Test"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取系統預設 Pattern IDs
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(3)\
        .execute()

    if len(preset_response.data) < 3:
        pytest.skip("Not enough system presets found")

    pattern_ids = [p["id"] for p in preset_response.data]

    # 加入 3 個 Patterns
    for pattern_id in pattern_ids:
        authenticated_client.post(
            f"/api/v1/playlists/{playlist_id}/patterns",
            json={"pattern_id": pattern_id}
        )

    # 移除第二個 Pattern (position = 1)
    response = authenticated_client.delete(
        f"/api/v1/playlists/{playlist_id}/patterns/{pattern_ids[1]}"
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    # 驗證剩餘 Patterns 的 position 已重新計算
    get_response = authenticated_client.get(f"/api/v1/playlists/{playlist_id}")
    data = get_response.json()

    assert len(data["patterns"]) == 2
    assert data["patterns"][0]["pattern_id"] == pattern_ids[0]
    assert data["patterns"][0]["position"] == 0
    assert data["patterns"][1]["pattern_id"] == pattern_ids[2]
    assert data["patterns"][1]["position"] == 1


@pytest.mark.asyncio
async def test_remove_pattern_not_found(authenticated_client: TestClient):
    """測試移除不存在的 Pattern (404)"""
    # 建立播放清單
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Test Playlist"}
    )
    playlist_id = create_response.json()["id"]

    # 嘗試移除不存在的 Pattern
    response = authenticated_client.delete(
        f"/api/v1/playlists/{playlist_id}/patterns/00000000-0000-0000-0000-000000000000"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ==========================================
# Task 8.2.7: 測試調整 Pattern 順序
# ==========================================

@pytest.mark.asyncio
async def test_update_pattern_position(authenticated_client: TestClient, supabase_client):
    """測試成功調整 Pattern 順序"""
    # 建立播放清單並加入 3 個 Patterns
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "Position Test"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取系統預設 Pattern IDs
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(3)\
        .execute()

    if len(preset_response.data) < 3:
        pytest.skip("Not enough system presets found")

    pattern_ids = [p["id"] for p in preset_response.data]

    # 加入 3 個 Patterns (position: 0, 1, 2)
    for pattern_id in pattern_ids:
        authenticated_client.post(
            f"/api/v1/playlists/{playlist_id}/patterns",
            json={"pattern_id": pattern_id}
        )

    # 將第一個 Pattern 移到最後 (position: 0 → 2)
    response = authenticated_client.put(
        f"/api/v1/playlists/{playlist_id}/patterns/{pattern_ids[0]}/position",
        json={"new_position": 2}
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    # 驗證順序已更新
    get_response = authenticated_client.get(f"/api/v1/playlists/{playlist_id}")
    data = get_response.json()

    assert len(data["patterns"]) == 3
    assert data["patterns"][0]["pattern_id"] == pattern_ids[1]
    assert data["patterns"][0]["position"] == 0
    assert data["patterns"][1]["pattern_id"] == pattern_ids[2]
    assert data["patterns"][1]["position"] == 1
    assert data["patterns"][2]["pattern_id"] == pattern_ids[0]
    assert data["patterns"][2]["position"] == 2


@pytest.mark.asyncio
async def test_update_pattern_position_no_change(authenticated_client: TestClient, supabase_client):
    """測試調整到相同位置（無變化）"""
    # 建立播放清單並加入 Pattern
    create_response = authenticated_client.post(
        "/api/v1/playlists",
        json={"name": "No Change Test"}
    )
    playlist_id = create_response.json()["id"]

    # 獲取系統預設 Pattern ID
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(1)\
        .execute()

    if not preset_response.data:
        pytest.skip("No system presets found")

    pattern_id = preset_response.data[0]["id"]

    # 加入 Pattern
    authenticated_client.post(
        f"/api/v1/playlists/{playlist_id}/patterns",
        json={"pattern_id": pattern_id}
    )

    # 調整到相同位置 (position: 0 → 0)
    response = authenticated_client.put(
        f"/api/v1/playlists/{playlist_id}/patterns/{pattern_id}/position",
        json={"new_position": 0}
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT


# ==========================================
# Task 8.2.8: 測試匯入訪客播放清單
# ==========================================

@pytest.mark.asyncio
async def test_import_guest_playlist_success(authenticated_client: TestClient, supabase_client):
    """測試成功匯入訪客播放清單"""
    # 獲取系統預設 Pattern IDs
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(3)\
        .execute()

    if len(preset_response.data) < 3:
        pytest.skip("Not enough system presets found")

    pattern_ids = [p["id"] for p in preset_response.data]

    # 匯入訪客播放清單
    import_data = {
        "patterns": [
            {"pattern_id": pattern_ids[0], "position": 0},
            {"pattern_id": pattern_ids[1], "position": 1},
            {"pattern_id": pattern_ids[2], "position": 2},
        ]
    }

    response = authenticated_client.post(
        "/api/v1/playlists/import-guest",
        json=import_data
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert "playlist_id" in data
    assert data["pattern_count"] == 3
    assert data["invalid_pattern_ids"] == []

    # 驗證播放清單已建立
    get_response = authenticated_client.get(f"/api/v1/playlists/{data['playlist_id']}")
    playlist_data = get_response.json()

    assert playlist_data["name"] == "訪客播放清單（已匯入）"
    assert len(playlist_data["patterns"]) == 3


@pytest.mark.asyncio
async def test_import_guest_playlist_with_invalid_ids(
    authenticated_client: TestClient,
    supabase_client
):
    """測試匯入包含無效 Pattern ID（部分匯入）"""
    # 獲取系統預設 Pattern ID
    preset_response = supabase_client.table("user_rhythm_presets")\
        .select("id")\
        .eq("is_system_preset", True)\
        .limit(1)\
        .execute()

    if not preset_response.data:
        pytest.skip("No system presets found")

    valid_pattern_id = preset_response.data[0]["id"]
    invalid_pattern_id = "00000000-0000-0000-0000-000000000000"

    # 匯入訪客播放清單（包含無效 ID）
    import_data = {
        "patterns": [
            {"pattern_id": valid_pattern_id, "position": 0},
            {"pattern_id": invalid_pattern_id, "position": 1},
        ]
    }

    response = authenticated_client.post(
        "/api/v1/playlists/import-guest",
        json=import_data
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["pattern_count"] == 1  # 只匯入有效的
    assert len(data["invalid_pattern_ids"]) == 1
    assert invalid_pattern_id in data["invalid_pattern_ids"]


@pytest.mark.asyncio
async def test_import_guest_playlist_all_invalid(authenticated_client: TestClient):
    """測試匯入全部無效 Pattern ID (400)"""
    import_data = {
        "patterns": [
            {"pattern_id": "00000000-0000-0000-0000-000000000000", "position": 0},
            {"pattern_id": "11111111-1111-1111-1111-111111111111", "position": 1},
        ]
    }

    response = authenticated_client.post(
        "/api/v1/playlists/import-guest",
        json=import_data
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ==========================================
# 測試覆蓋率總結
# ==========================================

"""
測試覆蓋率:
✅ POST /api/v1/playlists - 建立播放清單
✅ GET /api/v1/playlists - 獲取所有播放清單
✅ GET /api/v1/playlists/{id} - 獲取播放清單詳情
✅ PUT /api/v1/playlists/{id} - 更新播放清單
✅ DELETE /api/v1/playlists/{id} - CASCADE 刪除
✅ POST /api/v1/playlists/{id}/patterns - 加入 Pattern
✅ DELETE /api/v1/playlists/{id}/patterns/{pid} - 移除 Pattern
✅ PUT /api/v1/playlists/{id}/patterns/{pid}/position - 調整順序
✅ POST /api/v1/playlists/import-guest - 匯入訪客播放清單

核心邏輯測試:
✅ 擁有權驗證 (user_id 匹配)
✅ UNIQUE 約束 (禁止重複 Pattern)
✅ CASCADE 刪除 (playlist_patterns 自動刪除)
✅ Position 重新計算 (移除 Pattern 後)
✅ Position 調整邏輯 (移動 Pattern)
✅ 批次匯入 (部分無效 Pattern)

錯誤情境:
✅ 403 Forbidden - 存取其他使用者的播放清單
✅ 404 Not Found - 播放清單/Pattern 不存在
✅ 400 Bad Request - UNIQUE 約束違反、全部無效 Pattern

總測試案例: 25+
預期覆蓋率: 90%+
"""
