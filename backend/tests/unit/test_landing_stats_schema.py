"""
Unit tests for Landing Stats Pydantic schema
測試 LandingStatsResponse schema 的驗證規則和序列化
"""

import pytest
from pydantic import ValidationError

from app.schemas.landing_stats import LandingStatsResponse


class TestLandingStatsResponseSchema:
    """測試 LandingStatsResponse Pydantic schema"""

    def test_valid_landing_stats_creation(self):
        """測試使用有效資料建立 LandingStatsResponse"""
        # Arrange & Act
        stats = LandingStatsResponse(
            users=1234,
            readings=5678,
            cards=78,
            providers=3
        )

        # Assert
        assert stats.users == 1234
        assert stats.readings == 5678
        assert stats.cards == 78
        assert stats.providers == 3

    def test_valid_landing_stats_with_defaults(self):
        """測試使用預設值建立 LandingStatsResponse（cards 和 providers 有預設值）"""
        # Arrange & Act
        stats = LandingStatsResponse(
            users=100,
            readings=500
        )

        # Assert
        assert stats.users == 100
        assert stats.readings == 500
        assert stats.cards == 78  # 預設值
        assert stats.providers == 3  # 預設值

    def test_users_must_be_non_negative(self):
        """測試 users 必須為非負整數"""
        # Arrange & Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            LandingStatsResponse(
                users=-1,
                readings=100,
                cards=78,
                providers=3
            )

        # 驗證錯誤訊息
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['loc'] == ('users',)
        assert errors[0]['type'] == 'greater_than_equal'

    def test_readings_must_be_non_negative(self):
        """測試 readings 必須為非負整數"""
        # Arrange & Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            LandingStatsResponse(
                users=100,
                readings=-500,
                cards=78,
                providers=3
            )

        # 驗證錯誤訊息
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['loc'] == ('readings',)
        assert errors[0]['type'] == 'greater_than_equal'

    def test_cards_must_be_exactly_78(self):
        """測試 cards 必須為固定值 78"""
        # Arrange & Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            LandingStatsResponse(
                users=100,
                readings=500,
                cards=50,  # 錯誤：不是 78
                providers=3
            )

        # 驗證錯誤訊息
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['loc'] == ('cards',)
        assert '78' in str(errors[0]['msg'])

    def test_providers_must_be_exactly_3(self):
        """測試 providers 必須為固定值 3"""
        # Arrange & Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            LandingStatsResponse(
                users=100,
                readings=500,
                cards=78,
                providers=5  # 錯誤：不是 3
            )

        # 驗證錯誤訊息
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['loc'] == ('providers',)
        assert '3' in str(errors[0]['msg'])

    def test_users_zero_is_valid(self):
        """測試 users 為 0 是有效的（新部署的系統）"""
        # Arrange & Act
        stats = LandingStatsResponse(
            users=0,
            readings=0,
            cards=78,
            providers=3
        )

        # Assert
        assert stats.users == 0
        assert stats.readings == 0

    def test_large_numbers_are_valid(self):
        """測試大數值是有效的（百萬級用戶）"""
        # Arrange & Act
        stats = LandingStatsResponse(
            users=1_000_000,
            readings=10_000_000,
            cards=78,
            providers=3
        )

        # Assert
        assert stats.users == 1_000_000
        assert stats.readings == 10_000_000

    def test_json_serialization(self):
        """測試 JSON 序列化正確"""
        # Arrange
        stats = LandingStatsResponse(
            users=1234,
            readings=5678,
            cards=78,
            providers=3
        )

        # Act
        json_data = stats.model_dump()

        # Assert
        assert json_data == {
            'users': 1234,
            'readings': 5678,
            'cards': 78,
            'providers': 3
        }

    def test_json_deserialization(self):
        """測試 JSON 反序列化正確"""
        # Arrange
        json_data = {
            'users': 999,
            'readings': 888,
            'cards': 78,
            'providers': 3
        }

        # Act
        stats = LandingStatsResponse(**json_data)

        # Assert
        assert stats.users == 999
        assert stats.readings == 888
        assert stats.cards == 78
        assert stats.providers == 3

    def test_model_config_example_matches_schema(self):
        """測試 ConfigDict 中的 example 符合 schema 規範"""
        # Arrange
        example_data = LandingStatsResponse.model_config['json_schema_extra']['example']

        # Act
        stats = LandingStatsResponse(**example_data)

        # Assert
        assert stats.users == 1234
        assert stats.readings == 5678
        assert stats.cards == 78
        assert stats.providers == 3

    def test_field_descriptions_are_set(self):
        """測試欄位描述已正確設定（用於 API 文件）"""
        # Arrange
        schema = LandingStatsResponse.model_json_schema()

        # Act & Assert
        assert '總註冊使用者數' in schema['properties']['users']['description']
        assert '總占卜次數' in schema['properties']['readings']['description']
        assert '卡牌總數' in schema['properties']['cards']['description']
        assert 'AI 供應商數量' in schema['properties']['providers']['description']

    def test_fallback_values_scenario(self):
        """測試 fallback 值場景（API 失敗時的預設值）"""
        # Arrange - 模擬 API 失敗時的 fallback 值
        fallback_data = {
            'users': 1000,
            'readings': 5000,
            'cards': 78,
            'providers': 3
        }

        # Act
        stats = LandingStatsResponse(**fallback_data)

        # Assert
        assert stats.users == 1000
        assert stats.readings == 5000
        assert stats.cards == 78
        assert stats.providers == 3

    def test_type_coercion_from_string(self):
        """測試型別轉換（從字串轉為整數）"""
        # Arrange & Act
        stats = LandingStatsResponse(
            users='100',  # 字串會被轉換為整數
            readings='500',
            cards='78',
            providers='3'
        )

        # Assert
        assert stats.users == 100
        assert stats.readings == 500
        assert stats.cards == 78
        assert stats.providers == 3
        assert isinstance(stats.users, int)
        assert isinstance(stats.readings, int)

    def test_invalid_type_raises_error(self):
        """測試無效型別會拋出錯誤"""
        # Arrange & Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            LandingStatsResponse(
                users='not_a_number',  # 無法轉換的字串
                readings=500,
                cards=78,
                providers=3
            )

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['loc'] == ('users',)
        assert errors[0]['type'] == 'int_parsing'

    def test_missing_required_field(self):
        """測試缺少必填欄位會拋出錯誤"""
        # Arrange & Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            LandingStatsResponse(
                # users 欄位缺失
                readings=500,
                cards=78,
                providers=3
            )

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['loc'] == ('users',)
        assert errors[0]['type'] == 'missing'
