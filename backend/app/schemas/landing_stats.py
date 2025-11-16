"""
Landing page statistics Pydantic schema
提供首頁統計數據的 API 文件與資料驗證模型
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator


class LandingStatsResponse(BaseModel):
    """
    Landing page statistics response
    首頁統計數據回應

    Fields:
        users: 總註冊使用者數 (非負整數)
        readings: 總占卜次數 (非負整數)
        cards: 卡牌總數 (固定值 78)
        providers: AI 供應商數量 (固定值 3)
    """

    users: int = Field(
        ...,
        ge=0,
        description="總註冊使用者數",
        example=1234
    )

    readings: int = Field(
        ...,
        ge=0,
        description="總占卜次數",
        example=5678
    )

    cards: int = Field(
        default=78,
        ge=78,
        le=78,
        description="卡牌總數（固定值 78：22 張大阿爾克那 + 56 張小阿爾克那）",
        example=78
    )

    providers: int = Field(
        default=3,
        ge=3,
        le=3,
        description="AI 供應商數量（固定值 3：Anthropic Claude, OpenAI GPT, Google Gemini）",
        example=3
    )

    @field_validator('cards')
    @classmethod
    def validate_cards_count(cls, v: int) -> int:
        """驗證卡牌數量必須為 78"""
        if v != 78:
            raise ValueError('卡牌總數必須為 78（22 張大阿爾克那 + 56 張小阿爾克那）')
        return v

    @field_validator('providers')
    @classmethod
    def validate_providers_count(cls, v: int) -> int:
        """驗證 AI 供應商數量必須為 3"""
        if v != 3:
            raise ValueError('AI 供應商數量必須為 3（Anthropic, OpenAI, Google Gemini）')
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "users": 1234,
                "readings": 5678,
                "cards": 78,
                "providers": 3
            }
        }
    )
