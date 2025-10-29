"""
成就系統的 Pydantic 資料結構

成就定義、使用者進度、獎勵領取的請求/回應模型
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum


class AchievementCategory(str, Enum):
    """成就類別列舉"""
    READING = "READING"
    SOCIAL = "SOCIAL"
    BINGO = "BINGO"
    KARMA = "KARMA"
    EXPLORATION = "EXPLORATION"


class AchievementRarity(str, Enum):
    """成就稀有度列舉"""
    COMMON = "COMMON"
    RARE = "RARE"
    EPIC = "EPIC"
    LEGENDARY = "LEGENDARY"


class AchievementStatus(str, Enum):
    """成就狀態列舉"""
    IN_PROGRESS = "IN_PROGRESS"
    UNLOCKED = "UNLOCKED"
    CLAIMED = "CLAIMED"


# ===== Achievement Response Schemas =====

class AchievementCriteria(BaseModel):
    """成就解鎖條件的資料結構"""
    type: str = Field(..., description="條件類型（如 READING_COUNT, SOCIAL_SHARE）")
    target: int = Field(..., gt=0, description="目標數值")
    filters: Optional[Dict[str, Any]] = Field(None, description="額外篩選條件")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "READING_COUNT",
                "target": 10,
                "filters": {"spread_type": "CELTIC_CROSS"}
            }
        }
    )


class AchievementRewards(BaseModel):
    """成就獎勵的資料結構"""
    karma_points: Optional[int] = Field(None, description="Karma 點數獎勵")
    title: Optional[str] = Field(None, description="獲得的稱號")
    badge: Optional[str] = Field(None, description="徽章圖示")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "karma_points": 100,
                "title": "占卜大師"
            }
        }
    )


class AchievementResponse(BaseModel):
    """成就定義的回應模型"""
    id: str = Field(..., description="成就 ID")
    code: str = Field(..., description="成就唯一代碼")
    name: str = Field(..., description="成就名稱（繁體中文）")
    description: str = Field(..., description="成就描述")
    category: AchievementCategory = Field(..., description="成就類別")
    rarity: AchievementRarity = Field(..., description="成就稀有度")
    icon_name: str = Field(..., description="圖示名稱（PixelIcon）")
    icon_image_url: Optional[str] = Field(None, description="成就圖片 URL（選填）")
    criteria: Dict[str, Any] = Field(..., description="解鎖條件（JSON）")
    rewards: Dict[str, Any] = Field(..., description="獎勵內容（JSON）")
    is_hidden: bool = Field(..., description="是否為隱藏成就")
    display_order: int = Field(..., description="顯示順序")
    created_at: str = Field(..., description="建立時間")
    updated_at: str = Field(..., description="更新時間")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "code": "FIRST_READING",
                "name": "廢土新手",
                "description": "完成你的第一次占卜",
                "category": "READING",
                "rarity": "COMMON",
                "icon_name": "trophy",
                "criteria": {
                    "type": "READING_COUNT",
                    "target": 1
                },
                "rewards": {
                    "karma_points": 50,
                    "title": "廢土占卜師"
                },
                "is_hidden": False,
                "display_order": 1,
                "created_at": "2025-10-22T00:00:00Z",
                "updated_at": "2025-10-22T00:00:00Z"
            }
        }
    )


class AchievementListResponse(BaseModel):
    """成就列表的回應模型"""
    achievements: List[AchievementResponse] = Field(..., description="成就列表")
    total: int = Field(..., description="總成就數量")
    category_filter: Optional[AchievementCategory] = Field(None, description="已套用的分類篩選")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "achievements": [],
                "total": 15,
                "category_filter": "READING"
            }
        }
    )


# ===== User Progress Response Schemas =====

class UserAchievementProgressResponse(BaseModel):
    """使用者成就進度的回應模型"""
    id: str = Field(..., description="進度 ID")
    user_id: str = Field(..., description="使用者 ID")
    achievement_id: str = Field(..., description="成就 ID")
    achievement: Optional[AchievementResponse] = Field(None, description="成就定義資料")
    current_progress: int = Field(..., description="當前進度")
    target_progress: int = Field(..., description="目標進度")
    progress_percentage: float = Field(..., description="進度百分比")
    status: AchievementStatus = Field(..., description="成就狀態")
    unlocked_at: Optional[str] = Field(None, description="解鎖時間")
    claimed_at: Optional[str] = Field(None, description="領取時間")
    created_at: str = Field(..., description="建立時間")
    updated_at: str = Field(..., description="更新時間")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "660e8400-e29b-41d4-a716-446655440000",
                "user_id": "770e8400-e29b-41d4-a716-446655440000",
                "achievement_id": "550e8400-e29b-41d4-a716-446655440000",
                "achievement": None,
                "current_progress": 5,
                "target_progress": 10,
                "progress_percentage": 50.0,
                "status": "IN_PROGRESS",
                "unlocked_at": None,
                "claimed_at": None,
                "created_at": "2025-10-22T00:00:00Z",
                "updated_at": "2025-10-22T00:00:00Z"
            }
        }
    )


class UserProgressSummaryResponse(BaseModel):
    """使用者成就進度總覽的回應模型"""
    user_id: str = Field(..., description="使用者 ID")
    total_achievements: int = Field(..., description="總成就數量")
    unlocked_count: int = Field(..., description="已解鎖數量")
    claimed_count: int = Field(..., description="已領取數量")
    in_progress_count: int = Field(..., description="進行中數量")
    completion_percentage: float = Field(..., description="總完成度百分比")
    achievements: List[UserAchievementProgressResponse] = Field(..., description="成就進度列表")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "770e8400-e29b-41d4-a716-446655440000",
                "total_achievements": 15,
                "unlocked_count": 3,
                "claimed_count": 2,
                "in_progress_count": 12,
                "completion_percentage": 20.0,
                "achievements": []
            }
        }
    )


# ===== Reward Claim Schemas =====

class ClaimRewardRequest(BaseModel):
    """領取獎勵的請求模型"""
    achievement_code: str = Field(..., description="成就代碼", min_length=1, max_length=100)

    @field_validator('achievement_code')
    @classmethod
    def validate_achievement_code(cls, v: str) -> str:
        """驗證成就代碼格式"""
        if not v or not v.strip():
            raise ValueError("成就代碼不能為空")
        return v.strip()

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "achievement_code": "FIRST_READING"
            }
        }
    )


class ClaimRewardResponse(BaseModel):
    """領取獎勵的回應模型"""
    success: bool = Field(..., description="領取是否成功")
    achievement_code: str = Field(..., description="成就代碼")
    rewards: Dict[str, Any] = Field(..., description="獲得的獎勵")
    message: str = Field(..., description="回應訊息")
    claimed_at: str = Field(..., description="領取時間")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "achievement_code": "FIRST_READING",
                "rewards": {
                    "karma_points": 50,
                    "title": "廢土占卜師"
                },
                "message": "獎勵領取成功！你獲得了 50 Karma 點數和「廢土占卜師」稱號",
                "claimed_at": "2025-10-22T00:00:00Z"
            }
        }
    )


# ===== Unlock Notification Schema =====

class AchievementUnlockNotification(BaseModel):
    """成就解鎖通知的資料模型（回傳給前端）"""
    achievement: AchievementResponse = Field(..., description="解鎖的成就")
    progress: UserAchievementProgressResponse = Field(..., description="進度資料")
    message: str = Field(..., description="通知訊息")
    show_notification: bool = Field(True, description="是否顯示通知彈窗")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "achievement": {
                    "code": "FIRST_READING",
                    "name": "廢土新手"
                },
                "progress": {
                    "status": "UNLOCKED"
                },
                "message": "恭喜！你解鎖了「廢土新手」成就",
                "show_notification": True
            }
        }
    )


# ===== Error Response Schemas =====

class AchievementErrorResponse(BaseModel):
    """成就系統錯誤回應的標準格式"""
    error: str = Field(..., description="錯誤類型")
    message: str = Field(..., description="錯誤訊息（繁體中文）")
    detail: Optional[Dict[str, Any]] = Field(None, description="錯誤詳細資訊")
    timestamp: str = Field(..., description="錯誤發生時間")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": "ACHIEVEMENT_NOT_FOUND",
                "message": "找不到指定的成就",
                "detail": {
                    "achievement_code": "INVALID_CODE"
                },
                "timestamp": "2025-10-22T00:00:00Z"
            }
        }
    )


class AchievementAlreadyClaimedError(AchievementErrorResponse):
    """獎勵已領取錯誤"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": "ACHIEVEMENT_ALREADY_CLAIMED",
                "message": "此成就的獎勵已經領取過了",
                "detail": {
                    "achievement_code": "FIRST_READING",
                    "claimed_at": "2025-10-20T00:00:00Z"
                },
                "timestamp": "2025-10-22T00:00:00Z"
            }
        }
    )


class AchievementNotUnlockedError(AchievementErrorResponse):
    """成就尚未解鎖錯誤"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error": "ACHIEVEMENT_NOT_UNLOCKED",
                "message": "此成就尚未解鎖，無法領取獎勵",
                "detail": {
                    "achievement_code": "READING_MASTER",
                    "current_progress": 5,
                    "target_progress": 100
                },
                "timestamp": "2025-10-22T00:00:00Z"
            }
        }
    )
