"""
每日登入賓果遊戲的 Pydantic 資料結構

賓果卡設定、每日簽到與獎勵的請求/回應模型
"""

from typing import List, Optional, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator


class BingoCardCreate(BaseModel):
    """建立賓果卡的請求模型"""
    numbers: List[List[int]] = Field(
        ...,
        description="5x5 的數字網格（1-25）",
        example=[[1,2,3,4,5], [6,7,8,9,10], [11,12,13,14,15], [16,17,18,19,20], [21,22,23,24,25]]
    )

    @field_validator('numbers')
    @classmethod
    def validate_card_numbers(cls, v: List[List[int]]) -> List[List[int]]:
        """驗證賓果卡結構與數字"""
        # 必須是 5x5 網格
        if len(v) != 5:
            raise ValueError("卡片必須有 5 列")

        # 展開檢查數字
        all_numbers = []
        for row in v:
            if len(row) != 5:
                raise ValueError("每列必須有 5 個數字")
            all_numbers.extend(row)

        # 必須有 25 個數字
        if len(all_numbers) != 25:
            raise ValueError("卡片必須有 25 個數字")

        # 所有數字必須是 1-25 的整數
        if not all(isinstance(n, int) and 1 <= n <= 25 for n in all_numbers):
            raise ValueError("所有數字必須是 1 到 25 之間的整數")

        # 不能有重複
        if len(set(all_numbers)) != 25:
            raise ValueError("卡片數字必須唯一（不能重複）")

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "numbers": [
                    [1, 6, 11, 16, 21],
                    [2, 7, 12, 17, 22],
                    [3, 8, 13, 18, 23],
                    [4, 9, 14, 19, 24],
                    [5, 10, 15, 20, 25]
                ]
            }
        }
    )


class BingoCardResponse(BaseModel):
    """賓果卡的回應模型"""
    id: str = Field(..., description="卡片 ID")
    user_id: str = Field(..., description="使用者 ID")
    month_year: str = Field(..., description="月份（YYYY-MM 格式）", example="2025-10")
    card_data: List[List[int]] = Field(..., description="5x5 數字網格")
    is_active: bool = Field(..., description="卡片是否有效")
    created_at: str = Field(..., description="建立時間戳記")

    model_config = ConfigDict(from_attributes=True)


class DailyNumberResponse(BaseModel):
    """每日系統號碼的回應模型"""
    id: str = Field(..., description="號碼 ID")
    date: str = Field(..., description="日期（YYYY-MM-DD 格式）")
    number: int = Field(..., ge=1, le=25, description="每日號碼（1-25）")
    cycle_number: int = Field(..., description="目前的 25 天週期編號")
    generated_at: str = Field(..., description="生成時間戳記")

    model_config = ConfigDict(from_attributes=True)


class ClaimResponse(BaseModel):
    """每日號碼簽到的回應模型"""
    success: bool = Field(..., description="簽到是否成功")
    daily_number: int = Field(..., ge=1, le=25, description="簽到的號碼")
    is_on_card: bool = Field(..., description="號碼是否存在於使用者卡片上")
    line_count: int = Field(..., ge=0, le=12, description="目前完成的線數")
    has_reward: bool = Field(..., description="使用者是否達成 3 線獎勵")
    reward: Optional[Dict[str, Any]] = Field(None, description="獎勵詳情（如果達成）")
    claimed_at: str = Field(..., description="簽到時間戳記")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "daily_number": 13,
                "is_on_card": True,
                "line_count": 2,
                "has_reward": False,
                "reward": None,
                "claimed_at": "2025-10-15T08:30:00Z"
            }
        }
    )


class ClaimResponseWithReward(ClaimResponse):
    """Response model for claim with reward"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "daily_number": 13,
                "is_on_card": True,
                "line_count": 3,
                "has_reward": True,
                "reward": {
                    "id": "reward-uuid",
                    "type": "THREE_LINES",
                    "issued_at": "2025-10-15T08:30:00Z"
                },
                "claimed_at": "2025-10-15T08:30:00Z"
            }
        }
    )


class LineCheckResult(BaseModel):
    """連線檢測的回應模型"""
    line_count: int = Field(..., ge=0, le=12, description="完成的線數")
    line_types: List[str] = Field(..., description="完成的線類型", example=["row-0", "col-2", "diagonal-main"])
    has_three_lines: bool = Field(..., description="使用者是否有 3 條以上的線")
    reward_issued: bool = Field(..., description="獎勵是否已發放")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "line_count": 3,
                "line_types": ["row-0", "col-2", "diagonal-main"],
                "has_three_lines": True,
                "reward_issued": True
            }
        }
    )


class BingoStatusResponse(BaseModel):
    """使用者賓果狀態的回應模型"""
    has_card: bool = Field(..., description="使用者是否已設定本月卡片")
    card: Optional[BingoCardResponse] = Field(None, description="使用者的賓果卡（如果存在）")
    claimed_numbers: List[int] = Field(default_factory=list, description="使用者本月已簽到的號碼")
    line_count: int = Field(default=0, description="目前完成的線數")
    has_reward: bool = Field(default=False, description="使用者是否已獲得 3 線獎勵")
    today_claimed: bool = Field(default=False, description="使用者是否已簽到今日號碼")
    daily_number: Optional[int] = Field(None, description="今日系統號碼")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "has_card": True,
                "card": {
                    "id": "card-uuid",
                    "user_id": "user-uuid",
                    "month_year": "2025-10",
                    "card_data": [[1,2,3,4,5], [6,7,8,9,10], [11,12,13,14,15], [16,17,18,19,20], [21,22,23,24,25]],
                    "is_active": True,
                    "created_at": "2025-10-01T08:00:00Z"
                },
                "claimed_numbers": [1, 7, 13, 19, 25],
                "line_count": 1,
                "has_reward": False,
                "today_claimed": False,
                "daily_number": 3
            }
        }
    )


class RewardResponse(BaseModel):
    """Response model for bingo reward"""
    id: str = Field(..., description="Reward ID")
    user_id: str = Field(..., description="User ID")
    card_id: str = Field(..., description="Card ID")
    month_year: str = Field(..., description="Month in YYYY-MM format")
    line_types: List[str] = Field(..., description="Types of completed lines")
    line_count: int = Field(..., description="Number of lines completed")
    issued_at: str = Field(..., description="Issuance timestamp")

    model_config = ConfigDict(from_attributes=True)


class BingoHistoryResponse(BaseModel):
    """Response model for historical bingo data"""
    month_year: str = Field(..., description="Month in YYYY-MM format")
    card_data: List[List[int]] = Field(..., description="User's card for that month")
    claimed_numbers: List[int] = Field(..., description="Numbers claimed that month")
    line_count: int = Field(..., description="Lines completed")
    had_reward: bool = Field(..., description="Whether reward was achieved")
    reward: Optional[RewardResponse] = Field(None, description="Reward details if achieved")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "month_year": "2025-09",
                "card_data": [[1,2,3,4,5], [6,7,8,9,10], [11,12,13,14,15], [16,17,18,19,20], [21,22,23,24,25]],
                "claimed_numbers": [1, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25],
                "line_count": 3,
                "had_reward": True,
                "reward": {
                    "id": "reward-uuid",
                    "user_id": "user-uuid",
                    "card_id": "card-uuid",
                    "month_year": "2025-09",
                    "line_types": ["row-0", "col-2", "diagonal-main"],
                    "line_count": 3,
                    "issued_at": "2025-09-15T10:30:00Z"
                }
            }
        }
    )


class ErrorResponse(BaseModel):
    """Response model for errors"""
    error: str = Field(..., description="Error code")
    message: str = Field(..., description="User-friendly error message in Traditional Chinese")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: str = Field(..., description="Error timestamp")
    path: str = Field(..., description="API path where error occurred")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": "CARD_ALREADY_EXISTS",
                "message": "本月已設定賓果卡，無法重新設定",
                "details": None,
                "timestamp": "2025-10-15T08:30:00Z",
                "path": "/api/v1/bingo/card"
            }
        }
    )


# Internal service models (not exposed via API)

class ClaimResult(BaseModel):
    """Internal model for claim processing result"""
    success: bool
    daily_number: int
    is_on_card: bool
    line_count: int
    has_reward: bool
    reward: Optional[Dict[str, Any]] = None
    claimed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResetLogMetadata(BaseModel):
    """Metadata structure for monthly reset logs"""
    cards_archived: int = Field(default=0, description="Number of cards archived")
    claims_archived: int = Field(default=0, description="Number of claims archived")
    rewards_archived: int = Field(default=0, description="Number of rewards archived")
    errors: Optional[List[str]] = Field(default_factory=list, description="List of errors during reset")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "cards_archived": 150,
                "claims_archived": 3500,
                "rewards_archived": 45,
                "errors": []
            }
        }
    )
