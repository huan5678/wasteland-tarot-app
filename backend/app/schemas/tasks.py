"""
Pydantic schemas for Gamification Tasks System
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class TaskResponse(BaseModel):
    """單個任務響應."""

    id: str = Field(..., description="任務 ID（用戶任務記錄 ID）")
    task_key: str = Field(..., description="任務唯一鍵")
    name: str = Field(..., description="任務名稱")
    description: str = Field(..., description="任務描述")
    target_value: int = Field(..., description="目標值", gt=0)
    current_value: int = Field(..., description="當前進度值", ge=0)
    karma_reward: int = Field(..., description="Karma 獎勵", gt=0)
    is_completed: bool = Field(..., description="是否完成")
    is_claimed: bool = Field(..., description="是否已領取獎勵")
    progress_percentage: int = Field(..., description="進度百分比", ge=0, le=100)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid",
                "task_key": "daily_reading",
                "name": "完成 1 次占卜",
                "description": "進行一次塔羅占卜解讀",
                "target_value": 1,
                "current_value": 0,
                "karma_reward": 20,
                "is_completed": False,
                "is_claimed": False,
                "progress_percentage": 0
            }
        }


class DailyTasksListResponse(BaseModel):
    """每日任務列表響應."""

    tasks: List[TaskResponse] = Field(..., description="每日任務列表")
    reset_time: str = Field(..., description="重置時間 (ISO 8601)")
    completed_count: int = Field(..., description="已完成任務數量", ge=0)
    total_count: int = Field(..., description="總任務數量", gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "tasks": [
                    {
                        "id": "uuid",
                        "task_key": "daily_reading",
                        "name": "完成 1 次占卜",
                        "description": "進行一次塔羅占卜解讀",
                        "target_value": 1,
                        "current_value": 0,
                        "karma_reward": 20,
                        "is_completed": False,
                        "is_claimed": False,
                        "progress_percentage": 0
                    }
                ],
                "reset_time": "2025-01-05T00:00:00+08:00",
                "completed_count": 1,
                "total_count": 3
            }
        }


class WeeklyTasksListResponse(BaseModel):
    """每週任務列表響應."""

    tasks: List[TaskResponse] = Field(..., description="每週任務列表")
    reset_time: str = Field(..., description="重置時間 (ISO 8601)")
    completed_count: int = Field(..., description="已完成任務數量", ge=0)
    total_count: int = Field(..., description="總任務數量", gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "tasks": [
                    {
                        "id": "uuid",
                        "task_key": "weekly_readings",
                        "name": "完成 5 次占卜",
                        "description": "進行 5 次塔羅占卜",
                        "target_value": 5,
                        "current_value": 2,
                        "karma_reward": 50,
                        "is_completed": False,
                        "is_claimed": False,
                        "progress_percentage": 40
                    }
                ],
                "reset_time": "2025-01-06T00:00:00+08:00",
                "completed_count": 2,
                "total_count": 5
            }
        }


class ClaimTaskRewardResponse(BaseModel):
    """領取任務獎勵響應."""

    success: bool = Field(..., description="是否成功")
    karma_earned: int = Field(..., description="獲得的 Karma", gt=0)
    total_karma: int = Field(..., description="總 Karma", ge=0)
    message: str = Field(..., description="提示訊息")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "karma_earned": 20,
                "total_karma": 1280,
                "message": "已領取任務獎勵：完成 1 次占卜"
            }
        }


class UpdateTaskProgressRequest(BaseModel):
    """更新任務進度請求（內部 API）."""

    user_id: str = Field(..., description="用戶 ID")
    task_key: str = Field(..., description="任務唯一鍵")
    increment: int = Field(..., description="進度增量", gt=0)


class UpdateTaskProgressResponse(BaseModel):
    """更新任務進度響應."""

    success: bool = Field(..., description="是否成功")
    new_value: int = Field(..., description="新的進度值", ge=0)
    is_completed: bool = Field(..., description="是否已完成")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "new_value": 1,
                "is_completed": True
            }
        }


class TaskError(BaseModel):
    """任務錯誤響應."""

    error: str = Field(..., description="錯誤代碼")
    message: str = Field(..., description="錯誤訊息")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "TASK_NOT_COMPLETED",
                "message": "任務尚未完成，無法領取獎勵"
            }
        }
