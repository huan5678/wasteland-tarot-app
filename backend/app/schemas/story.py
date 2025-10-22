"""
廢土故事模式的 Pydantic 資料結構
提供故事內容的驗證與序列化模型
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
import re

# 導入共用常數
from app.models.story_constants import (
    VALID_FACTIONS,
    TIMELINE_PATTERNS,
    MIN_STORY_LENGTH,
    MAX_STORY_LENGTH,
)


class Story(BaseModel):
    """
    廢土卡牌故事內容 Schema

    用於卡牌故事資料的驗證與序列化
    """

    background: str = Field(
        ...,
        description=f"故事背景（{MIN_STORY_LENGTH}-{MAX_STORY_LENGTH} 字）",
        min_length=MIN_STORY_LENGTH,
        max_length=MAX_STORY_LENGTH,
        example=(
            "在2277年10月23日的早晨，101號避難所的大門終於緩緩開啟。"
            "一個年輕的居民站在出口處，手持父親留下的Pip-Boy 3000，"
            "眼前是他從未見過的荒涼世界..."
        )
    )

    character: Optional[str] = Field(
        None,
        description="主要角色名稱",
        max_length=100,
        example="避難所居民 101 (Lone Wanderer)"
    )

    location: Optional[str] = Field(
        None,
        description="故事發生地點",
        max_length=100,
        example="Vault 101 出口、Springvale 小鎮廢墟"
    )

    timeline: Optional[str] = Field(
        None,
        description="時間線：「戰前」、「戰後」或「YYYY 年」格式",
        max_length=50,
        example="2277 年"
    )

    factions_involved: Optional[List[str]] = Field(
        None,
        description="涉及的陣營列表",
        example=["vault_dweller", "brotherhood"]
    )

    related_quest: Optional[str] = Field(
        None,
        description="相關任務名稱",
        max_length=200,
        example="Following in His Footsteps"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "background": (
                    "在2277年10月23日的早晨，101號避難所的大門終於緩緩開啟。"
                    "一個年輕的居民站在出口處，手持父親留下的Pip-Boy 3000，"
                    "眼前是他從未見過的荒涼世界。首都廢土在核戰後已經過了200年，"
                    "到處都是輻射、變種生物和危險的掠奪者。但他必須踏上這段旅程，"
                    "去尋找失蹤的父親。"
                ),
                "character": "避難所居民 101 (Lone Wanderer)",
                "location": "Vault 101 出口、Springvale 小鎮廢墟",
                "timeline": "2277 年",
                "factions_involved": ["vault_dweller", "brotherhood"],
                "related_quest": "Following in His Footsteps"
            }
        }
    )

    @field_validator('background')
    @classmethod
    def validate_background_length(cls, v: str) -> str:
        """驗證故事背景字數（200-500字）"""
        text_length = len(v)

        if text_length < MIN_STORY_LENGTH:
            raise ValueError(
                f"故事背景字數不足：需要至少 {MIN_STORY_LENGTH} 字，目前為 {text_length} 字"
            )

        if text_length > MAX_STORY_LENGTH:
            raise ValueError(
                f"故事背景字數超長：最多 {MAX_STORY_LENGTH} 字，目前為 {text_length} 字"
            )

        return v

    @field_validator('timeline')
    @classmethod
    def validate_timeline_format(cls, v: Optional[str]) -> Optional[str]:
        """驗證時間格式：「戰前」、「戰後」或「YYYY 年」"""
        if v is None:
            return v

        # 檢查是否符合任一有效格式
        is_valid = any(re.match(pattern, v) for pattern in TIMELINE_PATTERNS)

        if not is_valid:
            raise ValueError(
                f"時間格式無效：'{v}'。必須是「戰前」、「戰後」或「YYYY 年」格式（例如：2277 年）"
            )

        return v

    @field_validator('factions_involved')
    @classmethod
    def validate_factions(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """驗證陣營列表內容"""
        if v is None:
            return v

        if not isinstance(v, list):
            raise ValueError("陣營列表必須是 list 類型")

        if len(v) == 0:
            raise ValueError("陣營列表不能為空")

        # 檢查所有陣營是否有效
        invalid_factions = [faction for faction in v if faction not in VALID_FACTIONS]

        if invalid_factions:
            raise ValueError(
                f"陣營列表包含無效的陣營：{', '.join(invalid_factions)}。"
                f"有效陣營：{', '.join(VALID_FACTIONS)}"
            )

        return v


class StoryUpdateRequest(BaseModel):
    """
    故事更新請求 Schema

    用於 API 端點接收故事更新資料
    所有欄位皆為選填，允許部分更新
    """

    background: Optional[str] = Field(
        None,
        description=f"故事背景（{MIN_STORY_LENGTH}-{MAX_STORY_LENGTH} 字）",
        min_length=MIN_STORY_LENGTH,
        max_length=MAX_STORY_LENGTH
    )

    character: Optional[str] = Field(
        None,
        description="主要角色名稱",
        max_length=100
    )

    location: Optional[str] = Field(
        None,
        description="故事發生地點",
        max_length=100
    )

    timeline: Optional[str] = Field(
        None,
        description="時間線：「戰前」、「戰後」或「YYYY 年」格式",
        max_length=50
    )

    factions_involved: Optional[List[str]] = Field(
        None,
        description="涉及的陣營列表"
    )

    related_quest: Optional[str] = Field(
        None,
        description="相關任務名稱",
        max_length=200
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "background": (
                    "在2287年的波士頓廢土，一個剛從111號避難所甦醒的倖存者，"
                    "睜開眼睛發現世界已經過了210年。他的配偶被殺害，兒子被綁架..."
                ),
                "character": "唯一倖存者 (Sole Survivor)",
                "timeline": "2287 年",
                "factions_involved": ["minutemen", "railroad"]
            }
        }
    )

    # 重用相同的驗證器
    _validate_background = field_validator('background')(Story.validate_background_length.__func__)
    _validate_timeline = field_validator('timeline')(Story.validate_timeline_format.__func__)
    _validate_factions = field_validator('factions_involved')(Story.validate_factions.__func__)
