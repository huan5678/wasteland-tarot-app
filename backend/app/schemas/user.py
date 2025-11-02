"""
使用者相關的 Pydantic Schema
"""

from pydantic import BaseModel, field_validator
from typing import Optional, List


# ==================== 稱號系統 Schemas ====================

class UserTitlesResponse(BaseModel):
    """
    使用者稱號回應 Schema

    用於 GET /api/v1/users/me/titles 端點
    回傳使用者當前稱號和所有已解鎖的稱號列表
    """
    current_title: Optional[str] = None
    unlocked_titles: List[str] = []

    class Config:
        json_schema_extra = {
            "example": {
                "current_title": "廢土新手",
                "unlocked_titles": ["廢土新手", "初次解讀", "連續三日"]
            }
        }


class UpdateTitleRequest(BaseModel):
    """
    更新稱號請求 Schema

    用於 PUT /api/v1/users/me/title 端點
    允許使用者設定或取消當前稱號
    """
    title: Optional[str] = None

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """驗證稱號格式"""
        if v is not None:
            # 稱號不能為空字串
            if v.strip() == "":
                raise ValueError('稱號不能為空字串')

            # 稱號長度限制
            if len(v) > 100:
                raise ValueError('稱號長度不能超過 100 個字元')

        return v

    class Config:
        json_schema_extra = {
            "example": {
                "title": "廢土新手"
            }
        }


class UpdateTitleResponse(BaseModel):
    """
    更新稱號回應 Schema

    用於 PUT /api/v1/users/me/title 端點
    回傳更新結果和新的當前稱號
    """
    success: bool
    current_title: Optional[str] = None
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "current_title": "廢土新手",
                "message": "稱號已成功設定"
            }
        }
