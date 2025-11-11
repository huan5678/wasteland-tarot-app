"""
塔羅占卜的 Pydantic 資料結構
提供占卜會話、牌陣與解讀的完整模型
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum

from app.schemas.cards import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment


class SpreadType(str, Enum):
    """廢土塔羅系統中可用的牌陣類型"""
    SINGLE_WASTELAND = "single_wasteland"  # 單卡廢土占卜（1張）
    VAULT_TEC_SPREAD = "vault_tec_spread"  # 避難所科技三牌陣（3張）
    RAIDER_CHAOS = "raider_chaos"  # 掠奪者混沌陣（4張）
    WASTELAND_SURVIVAL = "wasteland_survival"  # 廢土生存五牌陣（5張）
    NCR_STRATEGIC = "ncr_strategic"  # NCR戰略陣（6張）
    BROTHERHOOD_COUNCIL = "brotherhood_council"  # 兄弟會議會（7張）
    CELTIC_CROSS = "celtic_cross"  # 十字路口抉擇陣（10張）
    CUSTOM_SPREAD = "custom_spread"  # 自訂牌陣


class InterpretationStyle(str, Enum):
    """可用的解讀風格"""
    DETAILED_ANALYSIS = "detailed_analysis"  # 詳細分析
    QUICK_INSIGHT = "quick_insight"  # 快速洞察
    STORY_NARRATIVE = "story_narrative"  # 故事敘述
    TACTICAL_BRIEFING = "tactical_briefing"  # 戰術簡報
    HUMOROUS_TAKE = "humorous_take"  # 幽默詮釋


class PrivacyLevel(str, Enum):
    """占卜的隱私等級"""
    PRIVATE = "private"  # 私密
    FRIENDS = "friends"  # 好友可見
    PUBLIC = "public"  # 公開


class CardPosition(BaseModel):
    """占卜牌陣中的卡牌牌位"""
    position_number: int = Field(..., description="牌陣中的牌位編號", example=1)
    position_name: str = Field(..., description="牌位名稱", example="Past")
    position_meaning: str = Field(..., description="此牌位所代表的意義", example="Past influences affecting your situation")
    card_id: str = Field(..., description="此牌位的卡牌 ID")
    is_reversed: bool = Field(default=False, description="卡牌是否為逆位")
    draw_order: int = Field(..., description="卡牌抽取順序")
    radiation_influence: float = Field(default=0.0, ge=0.0, le=1.0, description="輻射對此卡牌的影響")

    # Complete card data (included when fetching reading details)
    card: Optional[WastelandCard] = Field(None, description="完整的卡牌資訊（僅在詳情頁包含）")

    # Interpretation for this position
    position_interpretation: Optional[str] = Field(None, description="此牌位的專屬解讀")
    card_significance: Optional[str] = Field(None, description="此卡牌在此牌位的重要性")
    connection_to_question: Optional[str] = Field(None, description="此牌位與問題的關聯")

    # User feedback
    user_resonance: Optional[int] = Field(None, ge=1, le=5, description="使用者對此卡牌的共鳴程度 (1-5)")
    interpretation_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI 解讀的信心度")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "position_number": 1,
                "position_name": "Past",
                "position_meaning": "Past influences affecting your current situation",
                "card_id": "wanderer-001",
                "is_reversed": False,
                "draw_order": 1,
                "radiation_influence": 0.2,
                "position_interpretation": "Your past journey from the vault has shaped your current perspective",
                "user_resonance": 4
            }
        }
    )


class SpreadTemplate(BaseModel):
    """牌陣模板定義"""
    id: str = Field(..., description="唯一牌陣模板 ID")
    name: str = Field(..., description="內部牌陣名稱")
    display_name: str = Field(..., description="使用者友善的顯示名稱")
    description: str = Field(..., description="牌陣描述")
    spread_type: SpreadType = Field(..., description="牌陣類型")
    card_count: int = Field(..., description="牌陣卡牌數量")
    positions: List[Dict[str, Any]] = Field(..., description="牌位定義")
    difficulty_level: str = Field(..., description="難度等級", example="beginner")

    # Wasteland-specific attributes
    faction_preference: Optional[str] = Field(None, description="偏好此牌陣的派系")
    radiation_sensitivity: float = Field(default=0.5, description="輻射對此牌陣的影響程度")
    vault_origin: Optional[int] = Field(None, description="此牌陣的起源避難所")

    # Usage statistics
    usage_count: int = Field(default=0, description="此牌陣的使用次數")
    average_rating: float = Field(default=0.0, description="平均使用者評分")

    # Status
    is_active: bool = Field(default=True, description="此牌陣是否可用")
    is_premium: bool = Field(default=False, description="此牌陣是否需要進階權限")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "vault-tec-spread",
                "name": "vault_tec_spread",
                "display_name": "Vault-Tec Three Card Spread",
                "description": "A simple three-card spread examining past, present, and future",
                "spread_type": "vault_tec_spread",
                "card_count": 3,
                "positions": [
                    {"number": 1, "name": "Past", "meaning": "Past influences"},
                    {"number": 2, "name": "Present", "meaning": "Current situation"},
                    {"number": 3, "name": "Future", "meaning": "Potential outcomes"}
                ],
                "difficulty_level": "beginner",
                "vault_origin": 111,
                "usage_count": 1247,
                "average_rating": 4.2
            }
        }
    )


class ReadingCreate(BaseModel):
    """建立新占卜的 Schema"""
    question: str = Field(..., min_length=1, max_length=500, description="占卜的問題", example="What should I focus on in the coming weeks?")
    spread_template_id: str = Field(..., description="要使用的牌陣模板 ID")
    character_voice: CharacterVoice = Field(..., description="解讀使用的角色聲音")
    karma_context: KarmaAlignment = Field(..., description="業力對齊情境")
    faction_influence: Optional[str] = Field(None, description="派系對占卜的影響")
    radiation_factor: float = Field(default=0.5, ge=0.0, le=1.0, description="環境輻射因子")

    # Optional context
    focus_area: Optional[str] = Field(None, description="焦點領域", example="career")
    context_notes: Optional[str] = Field(None, max_length=1000, description="使用者提供的額外情境說明")

    # Privacy settings
    privacy_level: PrivacyLevel = Field(default=PrivacyLevel.PRIVATE, description="此占卜的隱私等級")
    allow_public_sharing: bool = Field(default=False, description="允許公開分享")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "question": "What should I focus on in the coming weeks?",
                "spread_template_id": "vault-tec-spread",
                "character_voice": "pip_boy",
                "karma_context": "neutral",
                "faction_influence": "vault_dweller",
                "radiation_factor": 0.3,
                "focus_area": "career",
                "privacy_level": "private"
            }
        }
    )


class ReadingSession(BaseModel):
    """完整的占卜會話回應"""
    id: str = Field(..., description="唯一占卜會話 ID")
    user_id: str = Field(..., description="建立此占卜的使用者")

    # Reading content
    question: str = Field(..., description="提出的問題")
    focus_area: Optional[str] = Field(None, description="焦點領域")
    context_notes: Optional[str] = Field(None, description="額外情境說明")

    # Configuration
    spread_template: SpreadTemplate = Field(..., description="使用的牌陣模板")
    character_voice_used: CharacterVoice = Field(..., description="使用的角色聲音")
    karma_context: KarmaAlignment = Field(..., description="業力情境")
    faction_influence: Optional[str] = Field(None, description="派系影響")
    radiation_factor: float = Field(..., description="使用的輻射因子")

    # Card positions
    card_positions: List[CardPosition] = Field(..., description="抽取的卡牌及其牌位")

    # Interpretations
    overall_interpretation: Optional[str] = Field(None, description="整體占卜解讀")
    summary_message: Optional[str] = Field(None, description="摘要訊息")
    prediction_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="預測的信心度")
    energy_reading: Optional[Dict[str, Any]] = Field(None, description="情緒/能量分析")

    # AI Interpretation Tracking
    ai_interpretation_requested: Optional[bool] = Field(None, description="是否已請求 AI 解讀")
    ai_interpretation_at: Optional[datetime] = Field(None, description="AI 解讀請求時間")
    ai_interpretation_provider: Optional[str] = Field(None, description="AI 服務提供者")
    interpretation_audio_url: Optional[str] = Field(None, description="AI 解讀的 TTS 音頻檔案 URL")

    # Session metadata
    session_duration: Optional[int] = Field(None, description="會話持續時間（秒）")
    start_time: Optional[datetime] = Field(None, description="占卜開始時間")
    end_time: Optional[datetime] = Field(None, description="占卜結束時間")
    location: Optional[str] = Field(None, description="廢土中的虛擬地點")

    # User experience
    mood_before: Optional[str] = Field(None, description="占卜前的使用者情緒")
    mood_after: Optional[str] = Field(None, description="占卜後的使用者情緒")

    # Privacy and sharing
    privacy_level: PrivacyLevel = Field(..., description="隱私等級")
    allow_public_sharing: bool = Field(default=False, description="允許公開分享")
    is_favorite: bool = Field(default=False, description="使用者標記為最愛")

    # User feedback
    user_satisfaction: Optional[int] = Field(None, ge=1, le=5, description="使用者滿意度評分")
    accuracy_rating: Optional[int] = Field(None, ge=1, le=5, description="準確度感知評分")
    helpful_rating: Optional[int] = Field(None, ge=1, le=5, description="有用程度評分")
    user_feedback: Optional[str] = Field(None, description="使用者回饋文字")

    # Social features
    likes_count: int = Field(default=0, description="收到的按讚數")
    shares_count: int = Field(default=0, description="被分享次數")
    comments_count: int = Field(default=0, description="評論數")

    # Timestamps
    created_at: datetime = Field(..., description="占卜建立時間")
    updated_at: Optional[datetime] = Field(None, description="最後更新時間")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "reading-12345",
                "user_id": "user-67890",
                "question": "What should I focus on in the coming weeks?",
                "focus_area": "career",
                "character_voice_used": "pip_boy",
                "karma_context": "neutral",
                "radiation_factor": 0.3,
                "card_positions": [
                    {
                        "position_number": 1,
                        "position_name": "Past",
                        "card_id": "wanderer-001",
                        "is_reversed": False,
                        "draw_order": 1,
                        "position_interpretation": "Your journey from the vault has prepared you well"
                    }
                ],
                "overall_interpretation": "The cards suggest a time of positive change and growth ahead",
                "privacy_level": "private",
                "user_satisfaction": 4,
                "created_at": "2024-01-15T14:30:00Z"
            }
        }
    )


class ReadingUpdate(BaseModel):
    """更新占卜的 Schema"""
    privacy_level: Optional[PrivacyLevel] = None
    allow_public_sharing: Optional[bool] = None
    is_favorite: Optional[bool] = None
    user_satisfaction: Optional[int] = Field(None, ge=1, le=5)
    accuracy_rating: Optional[int] = Field(None, ge=1, le=5)
    helpful_rating: Optional[int] = Field(None, ge=1, le=5)
    user_feedback: Optional[str] = Field(None, max_length=1000)
    mood_after: Optional[str] = None

    # AI Interpretation fields
    overall_interpretation: Optional[str] = Field(None, description="AI 生成的整體解讀")
    summary_message: Optional[str] = Field(None, description="AI 生成的摘要訊息")
    prediction_confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="預測信心度")
    ai_interpretation_requested: Optional[bool] = Field(None, description="是否已請求 AI 解讀")
    ai_interpretation_at: Optional[datetime] = Field(None, description="AI 解讀請求時間")
    ai_interpretation_provider: Optional[str] = Field(None, description="AI 服務提供者")


class ReadingListParams(BaseModel):
    """列出占卜記錄的參數"""
    user_id: Optional[str] = Field(None, description="按使用者 ID 篩選")
    character_voice: Optional[CharacterVoice] = Field(None, description="按角色聲音篩選")
    karma_context: Optional[KarmaAlignment] = Field(None, description="按業力情境篩選")
    spread_type: Optional[SpreadType] = Field(None, description="按牌陣類型篩選")
    privacy_level: Optional[PrivacyLevel] = Field(None, description="按隱私等級篩選")
    is_favorite: Optional[bool] = Field(None, description="篩選最愛項目")
    date_from: Optional[datetime] = Field(None, description="起始日期篩選")
    date_to: Optional[datetime] = Field(None, description="結束日期篩選")
    min_satisfaction: Optional[int] = Field(None, ge=1, le=5, description="最低滿意度評分")

    # Pagination
    page: int = Field(default=1, ge=1, description="頁碼")
    page_size: int = Field(default=20, ge=1, le=100, description="每頁項目數")

    # Sorting
    sort_by: str = Field(default="created_at", description="排序欄位")
    sort_order: str = Field(default="desc", description="排序順序 (asc/desc)")

    @field_validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('排序順序必須為 asc 或 desc')
        return v


class ReadingListResponse(BaseModel):
    """占卜記錄清單請求的回應"""
    readings: List[ReadingSession] = Field(..., description="占卜記錄清單")
    total_count: int = Field(..., description="占卜記錄總數")
    page: int = Field(..., description="當前頁碼")
    page_size: int = Field(..., description="每頁項目數")
    has_more: bool = Field(..., description="是否有更多頁面")


class ReadingStats(BaseModel):
    """占卜統計資料"""
    total_readings: int = Field(..., description="占卜總數")
    readings_this_month: int = Field(..., description="本月占卜數")
    readings_this_week: int = Field(..., description="本週占卜數")
    average_satisfaction: float = Field(..., description="平均滿意度評分")
    favorite_character_voice: CharacterVoice = Field(..., description="最常使用的角色聲音")
    favorite_spread: str = Field(..., description="最常使用的牌陣類型")
    total_cards_drawn: int = Field(..., description="所有占卜抽取的卡牌總數")

    # Karma breakdown
    karma_distribution: Dict[KarmaAlignment, int] = Field(..., description="按業力對齊的占卜分布")

    # Recent activity
    recent_readings_count: int = Field(..., description="過去 7 天的占卜數")
    consecutive_days: int = Field(..., description="連續有占卜的天數")


class QuickReadingRequest(BaseModel):
    """快速單卡占卜請求"""
    question: Optional[str] = Field(None, max_length=200, description="快速問題", example="What do I need to know today?")
    character_voice: CharacterVoice = Field(default=CharacterVoice.PIP_BOY, description="角色聲音")
    karma_context: KarmaAlignment = Field(default=KarmaAlignment.NEUTRAL, description="業力情境")
    radiation_factor: float = Field(default=0.5, ge=0.0, le=1.0, description="輻射影響")


class QuickReadingResponse(BaseModel):
    """快速占卜回應"""
    card: WastelandCard = Field(..., description="抽取的卡牌")
    interpretation: str = Field(..., description="角色解讀")
    quick_insight: str = Field(..., description="快速洞察訊息")
    radiation_influence: float = Field(..., description="輻射對占卜的影響")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI 信心度")
    wasteland_wisdom: str = Field(..., description="額外的廢土智慧")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "interpretation": "Data suggests today requires careful observation and calculated risks",
                "quick_insight": "Trust your pip-boy's guidance and stay alert in the wasteland",
                "radiation_influence": 0.3,
                "confidence": 0.85,
                "wasteland_wisdom": "Remember: In the wasteland, preparation prevents poor performance"
            }
        }
    )


# Reading Search Schemas
class ReadingSearchParams(BaseModel):
    """搜尋占卜記錄的參數"""
    q: Optional[str] = Field(None, description="搜尋問題或備註的查詢文字", min_length=1)
    spread_type: Optional[str] = Field(None, description="按牌陣類型篩選")
    start_date: Optional[datetime] = Field(None, description="篩選此日期之後建立的占卜")
    end_date: Optional[datetime] = Field(None, description="篩選此日期之前建立的占卜")
    page: int = Field(1, ge=1, description="頁碼")
    page_size: int = Field(20, ge=1, le=100, description="每頁項目數")
    sort: str = Field("created_at", description="排序欄位")
    order: str = Field("desc", description="排序順序 (asc/desc)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "q": "wasteland",
                "spread_type": "celtic_cross",
                "page": 1,
                "page_size": 20,
                "sort": "created_at",
                "order": "desc"
            }
        }
    )


class ReadingSearchResult(BaseModel):
    """單一占卜搜尋結果"""
    id: str
    question: Optional[str]
    spread_type: str
    created_at: datetime
    notes: Optional[str] = None
    cards_count: int
    character_voice: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReadingSearchResponse(BaseModel):
    """占卜搜尋回應"""
    results: List[ReadingSearchResult]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "results": [],
                "total": 42,
                "page": 1,
                "page_size": 20,
                "total_pages": 3
            }
        }
    )


# Reading Analytics Schemas
class ReadingAnalyticsStats(BaseModel):
    """基本占卜統計資料"""
    total_readings: int
    readings_this_week: int
    readings_this_month: int
    average_satisfaction: Optional[float]
    favorite_spread: Optional[str]
    favorite_character_voice: Optional[str]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_readings": 42,
                "readings_this_week": 5,
                "readings_this_month": 18,
                "average_satisfaction": 4.2,
                "favorite_spread": "celtic_cross",
                "favorite_character_voice": "pip_boy"
            }
        }
    )


class ReadingFrequencyDataPoint(BaseModel):
    """頻率分析的單一資料點"""
    date: str
    count: int


class ReadingFrequencyAnalysis(BaseModel):
    """時間序列的占卜頻率分析"""
    period: str
    data_points: List[ReadingFrequencyDataPoint]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "period": "30d",
                "data_points": [
                    {"date": "2025-10-01", "count": 3},
                    {"date": "2025-10-02", "count": 2}
                ]
            }
        }
    )


class SpreadUsageAnalytics(BaseModel):
    """牌陣類型使用統計"""
    spread_usage: Dict[str, int]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "spread_usage": {
                    "celtic_cross": 15,
                    "three_card": 12,
                    "single_card": 8
                }
            }
        }
    )


class VoicePreferenceAnalytics(BaseModel):
    """角色聲音偏好分析"""
    voice_usage: Dict[str, int]
    favorite_voice: Optional[str]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "voice_usage": {
                    "pip_boy": 20,
                    "vault_dweller": 15,
                    "wasteland_trader": 7
                },
                "favorite_voice": "pip_boy"
            }
        }
    )


class KarmaDistributionAnalytics(BaseModel):
    """業力情境分布分析"""
    karma_distribution: Dict[str, int]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "karma_distribution": {
                    "good": 15,
                    "neutral": 20,
                    "evil": 7
                }
            }
        }
    )


class SatisfactionTrends(BaseModel):
    """滿意度評分趨勢"""
    average_rating: Optional[float]
    trend: str  # "increasing", "decreasing", "stable"
    rating_distribution: Dict[int, int]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "average_rating": 4.2,
                "trend": "increasing",
                "rating_distribution": {
                    1: 0,
                    2: 2,
                    3: 5,
                    4: 10,
                    5: 8
                }
            }
        }
    )


class ReadingPatterns(BaseModel):
    """占卜模式分析"""
    most_active_day: Optional[str]
    most_active_hour: Optional[int]
    average_readings_per_week: float
    streak_days: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "most_active_day": "Monday",
                "most_active_hour": 14,
                "average_readings_per_week": 3.5,
                "streak_days": 7
            }
        }
    )


class CardFrequencyItem(BaseModel):
    """單一卡牌頻率項目"""
    card_id: str
    count: int
    percentage: float


class CardFrequencyAnalytics(BaseModel):
    """最常抽取的卡牌分析"""
    most_drawn_cards: List[CardFrequencyItem]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "most_drawn_cards": [
                    {"card_id": "major_0", "count": 15, "percentage": 12.5},
                    {"card_id": "major_1", "count": 12, "percentage": 10.0}
                ]
            }
        }
    )


class PeriodComparison(BaseModel):
    """時間區間比較資料"""
    reading_count: int
    average_satisfaction: Optional[float]


class TimePeriodComparison(BaseModel):
    """跨時間區間的分析比較"""
    period1: PeriodComparison
    period2: PeriodComparison
    changes: Dict[str, str]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "period1": {"reading_count": 12, "average_satisfaction": 4.2},
                "period2": {"reading_count": 8, "average_satisfaction": 4.0},
                "changes": {
                    "reading_count_change": "increase",
                    "satisfaction_change": "increase"
                }
            }
        }
    )


class DateRangeInfo(BaseModel):
    """日期範圍資訊"""
    start: str
    end: str


class AnalyticsWithDateRange(BaseModel):
    """帶有日期範圍篩選的分析資料"""
    date_range: DateRangeInfo
    total_readings: int
    readings_this_week: int
    readings_this_month: int
    average_satisfaction: Optional[float]
    favorite_spread: Optional[str]
    favorite_character_voice: Optional[str]


class AnalyticsExportData(BaseModel):
    """完整的分析資料匯出"""
    statistics: Dict[str, Any]
    trends: Dict[str, Any]
    patterns: Dict[str, Any]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "statistics": {"total_readings": 42},
                "trends": {"satisfaction_trend": "increasing"},
                "patterns": {"most_active_day": "Monday"}
            }
        }
    )


# ============================================================================
# TAG MANAGEMENT SCHEMAS
# ============================================================================

class TagUpdate(BaseModel):
    """更新解讀記錄標籤的 Schema"""
    tags: List[str] = Field(
        ...,
        max_length=20,
        description="標籤列表（最多 20 個，每個標籤 1-50 字元）",
        example=["愛情", "事業", "健康"]
    )

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """驗證標籤列表"""
        if len(v) > 20:
            raise ValueError('最多只能有 20 個標籤')

        # 驗證每個標籤
        validated_tags = []
        for tag in v:
            tag_stripped = tag.strip()
            if not tag_stripped:
                continue  # 跳過空白標籤
            if len(tag_stripped) > 50:
                raise ValueError(f'標籤 "{tag_stripped}" 超過 50 字元')
            validated_tags.append(tag_stripped)

        return validated_tags

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tags": ["愛情", "事業", "健康"]
            }
        }
    )


class TagWithCount(BaseModel):
    """帶有使用統計的標籤"""
    tag: str = Field(..., description="標籤名稱")
    count: int = Field(..., description="使用次數", ge=0)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "tag": "愛情",
                "count": 12
            }
        }
    )
