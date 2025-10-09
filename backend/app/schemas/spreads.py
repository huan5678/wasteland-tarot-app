"""
塔羅牌陣的 Pydantic 資料結構

牌陣模板、牌位定義與牌陣管理的模型
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum

from app.schemas.cards import KarmaAlignment, FactionAlignment


class SpreadType(str, Enum):
    """廢土塔羅系統中可用的牌陣類型"""
    SINGLE_WASTELAND = "single_wasteland"  # 單卡廢土占卜
    VAULT_TEC_SPREAD = "vault_tec_spread"  # 3 張牌：過去/現在/未來
    WASTELAND_SURVIVAL = "wasteland_survival"  # 5 張牌
    BROTHERHOOD_COUNCIL = "brotherhood_council"  # 7 張牌
    CUSTOM_SPREAD = "custom_spread"  # 自訂牌陣


class DifficultyLevel(str, Enum):
    """牌陣的難度等級"""
    BEGINNER = "beginner"  # 初學者
    INTERMEDIATE = "intermediate"  # 中階
    ADVANCED = "advanced"  # 進階
    EXPERT = "expert"  # 專家


class SpreadPosition(BaseModel):
    """牌陣中某個牌位的定義"""
    number: int = Field(..., description="牌陣中的牌位編號", example=1)
    name: str = Field(..., description="牌位名稱", example="Past")
    meaning: str = Field(..., description="此牌位的代表意義", example="Past influences affecting your situation")
    description: Optional[str] = Field(None, description="牌位詳細描述")

    # 視覺定位（用於 UI 顯示）
    x_coordinate: Optional[float] = Field(None, description="視覺佈局的 X 座標")
    y_coordinate: Optional[float] = Field(None, description="視覺佈局的 Y 座標")
    rotation: Optional[float] = Field(None, description="卡牌旋轉角度（度數）")

    # 牌位專用指引
    interpretation_hints: Optional[List[str]] = Field(None, description="此牌位的解讀提示")
    common_themes: Optional[List[str]] = Field(None, description="此牌位的常見主題")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "number": 1,
                "name": "Past",
                "meaning": "Past influences affecting your current situation",
                "description": "This position reveals the foundation and past experiences that have led to your current circumstances",
                "x_coordinate": 0.2,
                "y_coordinate": 0.5,
                "interpretation_hints": ["Look for patterns from the past", "Consider lessons learned", "Identify recurring themes"],
                "common_themes": ["past experiences", "lessons learned", "foundations", "origins"]
            }
        }
    )


class SpreadTemplateBase(BaseModel):
    """基礎牌陣模板 Schema"""
    name: str = Field(..., min_length=1, max_length=100, description="內部牌陣名稱", example="vault_tec_spread")
    display_name: str = Field(..., min_length=1, max_length=150, description="使用者友善的顯示名稱", example="Vault-Tec Three Card Spread")
    description: str = Field(..., min_length=10, max_length=1000, description="牌陣描述")
    spread_type: SpreadType = Field(..., description="牌陣類型")
    difficulty_level: DifficultyLevel = Field(..., description="難度等級")

    # 卡牌配置
    card_count: int = Field(..., ge=1, le=15, description="牌陣的卡牌數量")
    positions: List[SpreadPosition] = Field(..., description="牌位定義")

    # 指引與解讀
    interpretation_guide: Optional[str] = Field(None, description="解讀此牌陣的指南")
    reading_tips: Optional[List[str]] = Field(None, description="有效解讀此牌陣的技巧")

    @field_validator('positions')
    def validate_positions_count(cls, v, info):
        card_count = info.data.get('card_count')
        if card_count is not None and len(v) != card_count:
            raise ValueError(f'牌位數量 ({len(v)}) 必須與 card_count ({card_count}) 相符')
        return v

    @field_validator('positions')
    def validate_position_numbers(cls, v):
        expected_numbers = set(range(1, len(v) + 1))
        actual_numbers = {pos.number for pos in v}
        if actual_numbers != expected_numbers:
            raise ValueError(f'牌位編號必須從 1 到 {len(v)} 連續')
        return v


class SpreadTemplateCreate(SpreadTemplateBase):
    """建立新牌陣模板的 Schema"""
    # 廢土專屬屬性
    faction_preference: Optional[FactionAlignment] = Field(None, description="偏好此牌陣的派系")
    radiation_sensitivity: float = Field(default=0.5, ge=0.0, le=1.0, description="輻射對此牌陣的影響程度")
    vault_origin: Optional[int] = Field(None, description="此牌陣的起源避難所")

    # 視覺與體驗
    background_theme: Optional[str] = Field(None, description="UI 的背景主題")
    audio_ambience: Optional[str] = Field(None, description="環境音效 URL")
    pip_boy_interface: Optional[Dict[str, Any]] = Field(None, description="Pip-Boy 專用 UI 配置")

    # 元數據
    tags: List[str] = Field(default_factory=list, description="分類標籤")
    is_premium: bool = Field(default=False, description="此牌陣是否需要進階權限")


class SpreadTemplate(SpreadTemplateBase):
    """完整的牌陣模板及所有元數據"""
    id: str = Field(..., description="唯一牌陣模板 ID")

    # 廢土專屬屬性
    faction_preference: Optional[FactionAlignment] = Field(None, description="偏好此牌陣的派系")
    radiation_sensitivity: float = Field(default=0.5, description="輻射對此牌陣的影響程度")
    vault_origin: Optional[int] = Field(None, description="此牌陣的起源避難所")

    # 視覺與體驗
    background_theme: Optional[str] = Field(None, description="UI 的背景主題")
    audio_ambience: Optional[str] = Field(None, description="環境音效 URL")
    pip_boy_interface: Optional[Dict[str, Any]] = Field(None, description="Pip-Boy 專用 UI 配置")

    # 使用統計
    usage_count: int = Field(default=0, description="此牌陣的使用次數")
    average_rating: float = Field(default=0.0, ge=0.0, le=5.0, description="平均使用者評分")
    last_used: Optional[datetime] = Field(None, description="最後使用時間")

    # 狀態與元數據
    is_active: bool = Field(default=True, description="此牌陣是否可用")
    is_premium: bool = Field(default=False, description="此牌陣是否需要進階權限")
    created_by: Optional[str] = Field(None, description="建立自訂牌陣的使用者 ID")
    tags: List[str] = Field(default_factory=list, description="分類標籤")

    # 時間戳記
    created_at: datetime = Field(..., description="牌陣建立時間")
    updated_at: Optional[datetime] = Field(None, description="最後更新時間")

    # 計算屬性
    complexity: str = Field(..., description="計算出的複雜度等級")
    estimated_duration: int = Field(..., description="預估占卜時長（分鐘）")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "vault-tec-spread",
                "name": "vault_tec_spread",
                "display_name": "Vault-Tec Three Card Spread",
                "description": "A classic three-card spread examining past, present, and future influences on your situation",
                "spread_type": "vault_tec_spread",
                "difficulty_level": "beginner",
                "card_count": 3,
                "positions": [
                    {
                        "number": 1,
                        "name": "Past",
                        "meaning": "Past influences and foundations",
                        "x_coordinate": 0.2,
                        "y_coordinate": 0.5
                    },
                    {
                        "number": 2,
                        "name": "Present",
                        "meaning": "Current situation and energies",
                        "x_coordinate": 0.5,
                        "y_coordinate": 0.5
                    },
                    {
                        "number": 3,
                        "name": "Future",
                        "meaning": "Potential outcomes and path forward",
                        "x_coordinate": 0.8,
                        "y_coordinate": 0.5
                    }
                ],
                "vault_origin": 111,
                "usage_count": 1247,
                "average_rating": 4.2,
                "complexity": "simple",
                "estimated_duration": 15,
                "tags": ["beginner", "past-present-future", "popular"]
            }
        }
    )


class SpreadTemplateUpdate(BaseModel):
    """更新牌陣模板的 Schema"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    difficulty_level: Optional[DifficultyLevel] = None
    interpretation_guide: Optional[str] = None
    reading_tips: Optional[List[str]] = None
    background_theme: Optional[str] = None
    audio_ambience: Optional[str] = None
    pip_boy_interface: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_premium: Optional[bool] = None


class SpreadSearchParams(BaseModel):
    """搜尋牌陣的參數"""
    query: Optional[str] = Field(None, description="搜尋查詢")
    spread_type: Optional[SpreadType] = Field(None, description="按牌陣類型篩選")
    difficulty_level: Optional[DifficultyLevel] = Field(None, description="按難度篩選")
    faction_preference: Optional[FactionAlignment] = Field(None, description="按派系偏好篩選")
    min_cards: Optional[int] = Field(None, ge=1, le=15, description="最少卡牌數")
    max_cards: Optional[int] = Field(None, ge=1, le=15, description="最多卡牌數")
    is_premium: Optional[bool] = Field(None, description="篩選進階牌陣")
    tags: Optional[List[str]] = Field(None, description="按標籤篩選")
    sort_by: str = Field(default="usage_count", description="排序欄位")
    sort_order: str = Field(default="desc", description="排序順序")

    @field_validator('max_cards')
    def validate_card_range(cls, v, info):
        min_cards = info.data.get('min_cards')
        if v is not None and min_cards is not None and v < min_cards:
            raise ValueError('max_cards 必須大於或等於 min_cards')
        return v

    @field_validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('排序順序必須為 asc 或 desc')
        return v


class SpreadListResponse(BaseModel):
    """牌陣清單的回應"""
    spreads: List[SpreadTemplate] = Field(..., description="牌陣模板清單")
    total_count: int = Field(..., description="符合條件的牌陣總數")
    page: int = Field(..., description="當前頁碼")
    page_size: int = Field(..., description="每頁牌陣數")
    has_more: bool = Field(..., description="是否有更多頁面")


class SpreadUsageStats(BaseModel):
    """牌陣的使用統計"""
    spread_id: str = Field(..., description="牌陣模板 ID")
    total_uses: int = Field(..., description="總使用次數")
    uses_this_month: int = Field(..., description="本月使用次數")
    uses_this_week: int = Field(..., description="本週使用次數")
    average_rating: float = Field(..., description="平均使用者評分")
    average_session_duration: float = Field(..., description="平均會話時長（分鐘）")
    user_satisfaction_breakdown: Dict[int, int] = Field(..., description="滿意度評分分布")
    popular_with_karma: Dict[KarmaAlignment, int] = Field(..., description="按業力對齊的使用量")
    popular_with_factions: Dict[FactionAlignment, int] = Field(..., description="按派系偏好的使用量")


class SpreadRecommendation(BaseModel):
    """基於使用者偏好的牌陣推薦"""
    spread: SpreadTemplate = Field(..., description="推薦的牌陣")
    match_score: float = Field(..., ge=0.0, le=1.0, description="與使用者偏好的匹配度")
    reasons: List[str] = Field(..., description="推薦理由")
    estimated_duration: int = Field(..., description="預估占卜時長（分鐘）")
    difficulty_match: bool = Field(..., description="難度是否符合使用者程度")


class SpreadRecommendationRequest(BaseModel):
    """請求牌陣推薦"""
    user_experience_level: Optional[DifficultyLevel] = Field(None, description="使用者的經驗等級")
    karma_alignment: Optional[KarmaAlignment] = Field(None, description="使用者的業力對齊")
    faction_preference: Optional[FactionAlignment] = Field(None, description="使用者的派系偏好")
    available_time: Optional[int] = Field(None, description="可用時間（分鐘）")
    question_type: Optional[str] = Field(None, description="所提問題的類型")
    previous_spreads: Optional[List[str]] = Field(None, description="先前使用過的牌陣 ID")
    count: int = Field(default=5, ge=1, le=10, description="要回傳的推薦數量")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_experience_level": "beginner",
                "karma_alignment": "good",
                "faction_preference": "vault_dweller",
                "available_time": 20,
                "question_type": "career",
                "count": 3
            }
        }
    )


class SpreadValidation(BaseModel):
    """牌陣模板的驗證結果"""
    is_valid: bool = Field(..., description="牌陣是否有效")
    errors: List[str] = Field(default_factory=list, description="驗證錯誤")
    warnings: List[str] = Field(default_factory=list, description="驗證警告")
    suggestions: List[str] = Field(default_factory=list, description="改進建議")


class PopularSpreadsResponse(BaseModel):
    """熱門牌陣查詢的回應"""
    most_used: List[SpreadTemplate] = Field(..., description="最常使用的牌陣")
    highest_rated: List[SpreadTemplate] = Field(..., description="評分最高的牌陣")
    newest: List[SpreadTemplate] = Field(..., description="最新的牌陣模板")
    recommended_for_beginners: List[SpreadTemplate] = Field(..., description="初學者推薦牌陣")
    advanced_spreads: List[SpreadTemplate] = Field(..., description="進階牌陣")


class SpreadCategoryStats(BaseModel):
    """按類別劃分的統計資料"""
    by_difficulty: Dict[DifficultyLevel, int] = Field(..., description="按難度等級統計")
    by_card_count: Dict[str, int] = Field(..., description="按卡牌數量統計")
    by_faction: Dict[str, int] = Field(..., description="按派系偏好統計")
    total_spreads: int = Field(..., description="可用牌陣總數")
    average_rating_overall: float = Field(..., description="整體平均評分")
    most_popular_tags: List[str] = Field(..., description="最熱門的標籤")
