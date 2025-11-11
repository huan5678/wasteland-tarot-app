"""
測試標籤管理 API 端點

Task 7.5: 實作標籤管理 API 端點
Requirements: 4.1, 4.2

測試範圍：
- PATCH /api/v1/readings/{reading_id}/tags - 更新解讀標籤
- GET /api/v1/readings/tags - 列出使用者標籤統計
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user import User
from app.models.reading_enhanced import CompletedReading, ReadingTag, SpreadTemplate
import uuid as uuid_lib

client = TestClient(app)


@pytest.fixture
def test_user(db: Session) -> User:
    """創建測試用戶"""
    user = User(
        id=str(uuid_lib.uuid4()),
        email="test@example.com",
        username="test_user",
        hashed_password="hashed_password"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_spread_template(db: Session) -> SpreadTemplate:
    """創建測試牌陣模板"""
    spread = SpreadTemplate(
        id=str(uuid_lib.uuid4()),
        name="test_spread",
        display_name="測試牌陣",
        description="測試用牌陣模板",
        spread_type="single_wasteland",
        card_count=1,
        positions=[{"number": 1, "name": "Test", "meaning": "Test position"}],
        difficulty_level="beginner"
    )
    db.add(spread)
    db.commit()
    db.refresh(spread)
    return spread


@pytest.fixture
def test_reading(
    db: Session,
    test_user: User,
    test_spread_template: SpreadTemplate
) -> CompletedReading:
    """創建測試解讀記錄"""
    reading = CompletedReading(
        id=str(uuid_lib.uuid4()),
        user_id=test_user.id,
        spread_template_id=test_spread_template.id,
        question="測試問題",
        character_voice_used="pip_boy",
        karma_context="neutral",
        overall_interpretation="測試解讀",
        privacy_level="private"
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """創建認證 headers（模擬）"""
    # 實際環境中，這裡應該使用真實的 JWT token
    return {
        "Authorization": f"Bearer test_token_for_{test_user.id}"
    }


class TestUpdateReadingTags:
    """測試更新解讀標籤端點"""

    def test_update_reading_tags_success(
        self,
        db: Session,
        auth_headers: dict,
        test_reading: CompletedReading
    ):
        """測試成功更新解讀標籤"""
        response = client.patch(
            f"/api/v1/readings/{test_reading.id}/tags",
            json={"tags": ["愛情", "事業", "健康"]},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_reading.id)

        # 驗證標籤已更新
        tags = db.query(ReadingTag).filter(
            ReadingTag.reading_id == test_reading.id
        ).all()
        assert len(tags) == 3
        tag_names = {tag.tag for tag in tags}
        assert tag_names == {"愛情", "事業", "健康"}

    def test_update_tags_removes_duplicates(
        self,
        db: Session,
        auth_headers: dict,
        test_reading: CompletedReading
    ):
        """測試更新標籤時自動去除重複"""
        response = client.patch(
            f"/api/v1/readings/{test_reading.id}/tags",
            json={"tags": ["愛情", "愛情", "事業", "愛情"]},
            headers=auth_headers
        )

        assert response.status_code == 200

        # 驗證只保留唯一標籤
        tags = db.query(ReadingTag).filter(
            ReadingTag.reading_id == test_reading.id
        ).all()
        assert len(tags) == 2
        tag_names = {tag.tag for tag in tags}
        assert tag_names == {"愛情", "事業"}

    def test_tag_limit_enforcement(
        self,
        auth_headers: dict,
        test_reading: CompletedReading
    ):
        """測試 20 個標籤限制"""
        tags = [f"標籤_{i}" for i in range(21)]
        response = client.patch(
            f"/api/v1/readings/{test_reading.id}/tags",
            json={"tags": tags},
            headers=auth_headers
        )

        assert response.status_code == 422  # Pydantic validation error
        assert "20" in str(response.json())

    def test_tag_length_validation(
        self,
        auth_headers: dict,
        test_reading: CompletedReading
    ):
        """測試標籤長度驗證（1-50 字元）"""
        # 測試空標籤（會被自動過濾）
        response = client.patch(
            f"/api/v1/readings/{test_reading.id}/tags",
            json={"tags": ["", "  ", "正常標籤"]},
            headers=auth_headers
        )
        assert response.status_code == 200

        # 測試超長標籤
        long_tag = "a" * 51
        response = client.patch(
            f"/api/v1/readings/{test_reading.id}/tags",
            json={"tags": [long_tag]},
            headers=auth_headers
        )
        assert response.status_code == 422  # Pydantic validation error
        assert "50" in str(response.json())

    def test_update_tags_permission_check(
        self,
        test_reading: CompletedReading
    ):
        """測試權限檢查（不能更新別人的解讀）"""
        # 使用不同用戶的 token
        other_user_headers = {"Authorization": "Bearer other_user_token"}

        response = client.patch(
            f"/api/v1/readings/{test_reading.id}/tags",
            json={"tags": ["測試"]},
            headers=other_user_headers
        )

        assert response.status_code in [401, 403, 404]

    def test_update_tags_reading_not_found(
        self,
        auth_headers: dict
    ):
        """測試解讀記錄不存在"""
        fake_reading_id = str(uuid_lib.uuid4())
        response = client.patch(
            f"/api/v1/readings/{fake_reading_id}/tags",
            json={"tags": ["測試"]},
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_replace_existing_tags(
        self,
        db: Session,
        auth_headers: dict,
        test_reading: CompletedReading
    ):
        """測試替換現有標籤"""
        # 先新增一些標籤
        old_tags = [
            ReadingTag(reading_id=test_reading.id, tag="舊標籤1"),
            ReadingTag(reading_id=test_reading.id, tag="舊標籤2")
        ]
        for tag in old_tags:
            db.add(tag)
        db.commit()

        # 更新為新標籤
        response = client.patch(
            f"/api/v1/readings/{test_reading.id}/tags",
            json={"tags": ["新標籤1", "新標籤2", "新標籤3"]},
            headers=auth_headers
        )

        assert response.status_code == 200

        # 驗證舊標籤已被替換
        tags = db.query(ReadingTag).filter(
            ReadingTag.reading_id == test_reading.id
        ).all()
        assert len(tags) == 3
        tag_names = {tag.tag for tag in tags}
        assert tag_names == {"新標籤1", "新標籤2", "新標籤3"}
        assert "舊標籤1" not in tag_names
        assert "舊標籤2" not in tag_names


class TestListUserTags:
    """測試列出使用者標籤統計端點"""

    def test_list_user_tags_empty(
        self,
        auth_headers: dict
    ):
        """測試空標籤列表"""
        response = client.get(
            "/api/v1/readings/tags",
            headers=auth_headers
        )

        assert response.status_code == 200
        tags = response.json()
        assert isinstance(tags, list)
        assert len(tags) == 0

    def test_list_user_tags_with_data(
        self,
        db: Session,
        auth_headers: dict,
        test_reading: CompletedReading,
        test_user: User,
        test_spread_template: SpreadTemplate
    ):
        """測試列出標籤統計"""
        # 創建多個解讀記錄並新增標籤
        readings = []
        for i in range(3):
            reading = CompletedReading(
                id=str(uuid_lib.uuid4()),
                user_id=test_user.id,
                spread_template_id=test_spread_template.id,
                question=f"問題 {i}",
                character_voice_used="pip_boy",
                karma_context="neutral",
                privacy_level="private"
            )
            db.add(reading)
            readings.append(reading)

        db.commit()

        # 新增標籤（"愛情" 使用 3 次，"事業" 使用 2 次，"健康" 使用 1 次）
        tags_data = [
            (readings[0].id, "愛情"),
            (readings[0].id, "事業"),
            (readings[1].id, "愛情"),
            (readings[1].id, "健康"),
            (readings[2].id, "愛情"),
            (readings[2].id, "事業"),
        ]

        for reading_id, tag_name in tags_data:
            tag = ReadingTag(reading_id=reading_id, tag=tag_name)
            db.add(tag)

        db.commit()

        # 測試 API
        response = client.get(
            "/api/v1/readings/tags",
            headers=auth_headers
        )

        assert response.status_code == 200
        tags = response.json()
        assert len(tags) == 3

        # 驗證格式：[{"tag": "xxx", "count": N}, ...]
        for tag_item in tags:
            assert "tag" in tag_item
            assert "count" in tag_item
            assert isinstance(tag_item["count"], int)

        # 驗證按使用次數降序排列
        assert tags[0]["tag"] == "愛情"
        assert tags[0]["count"] == 3
        assert tags[1]["tag"] == "事業"
        assert tags[1]["count"] == 2
        assert tags[2]["tag"] == "健康"
        assert tags[2]["count"] == 1

    def test_list_tags_only_shows_user_tags(
        self,
        db: Session,
        auth_headers: dict,
        test_reading: CompletedReading,
        test_spread_template: SpreadTemplate
    ):
        """測試只顯示當前用戶的標籤"""
        # 創建另一個用戶的解讀記錄
        other_user = User(
            id=str(uuid_lib.uuid4()),
            email="other@example.com",
            username="other_user",
            hashed_password="hashed"
        )
        db.add(other_user)
        db.commit()

        other_reading = CompletedReading(
            id=str(uuid_lib.uuid4()),
            user_id=other_user.id,
            spread_template_id=test_spread_template.id,
            question="其他人的問題",
            character_voice_used="pip_boy",
            karma_context="neutral",
            privacy_level="private"
        )
        db.add(other_reading)
        db.commit()

        # 新增標籤
        other_tag = ReadingTag(reading_id=other_reading.id, tag="其他人的標籤")
        db.add(other_tag)

        my_tag = ReadingTag(reading_id=test_reading.id, tag="我的標籤")
        db.add(my_tag)

        db.commit()

        # 測試 API
        response = client.get(
            "/api/v1/readings/tags",
            headers=auth_headers
        )

        assert response.status_code == 200
        tags = response.json()

        # 應該只看到自己的標籤
        tag_names = [tag["tag"] for tag in tags]
        assert "我的標籤" in tag_names
        assert "其他人的標籤" not in tag_names
