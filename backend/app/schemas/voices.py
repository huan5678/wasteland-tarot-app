"""
角色聲音的 Pydantic 資料結構

角色解讀模板與聲音管理的模型
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum

from app.schemas.cards import CharacterVoice, FactionAlignment


class VoiceTone(str, Enum):
    """聲音語氣特徵"""
    ANALYTICAL = "analytical"  # 分析型
    HUMOROUS = "humorous"  # 幽默型
    WISE = "wise"  # 睿智型
    DIRECT = "direct"  # 直接型
    POETIC = "poetic"  # 詩意型
    TECHNICAL = "technical"  # 技術型
    SARCASTIC = "sarcastic"  # 諷刺型
    OPTIMISTIC = "optimistic"  # 樂觀型
    CAUTIOUS = "cautious"  # 謹慎型


class VocabularyStyle(str, Enum):
    """角色聲音的詞彙風格"""
    TECHNICAL = "technical"  # 技術性
    SIMPLE = "simple"  # 簡單
    POETIC = "poetic"  # 詩意
    MILITARY = "military"  # 軍事
    WASTELAND_SLANG = "wasteland_slang"  # 廢土俚語
    FORMAL = "formal"  # 正式
    COLLOQUIAL = "colloquial"  # 口語


class HumorStyle(str, Enum):
    """角色使用的幽默類型"""
    WASTELAND = "wasteland"  # 廢土幽默
    SARCASTIC = "sarcastic"  # 諷刺
    WHOLESOME = "wholesome"  # 溫馨
    DARK = "dark"  # 黑暗幽默
    TECHNICAL = "technical"  # 技術幽默
    NONE = "none"  # 無


class ResponseLength(str, Enum):
    """回應長度偏好"""
    SHORT = "short"  # 簡短
    MEDIUM = "medium"  # 中等
    LONG = "long"  # 詳細


class DetailLevel(str, Enum):
    """回應的詳細程度"""
    MINIMAL = "minimal"  # 最少
    BALANCED = "balanced"  # 平衡
    DETAILED = "detailed"  # 詳細


class CharacterTemplate(BaseModel):
    """基礎角色模板資訊"""
    character_voice: CharacterVoice = Field(..., description="角色聲音識別碼")
    character_name: str = Field(..., description="角色顯示名稱", example="Pip-Boy 3000")
    description: str = Field(..., description="提供給使用者的角色描述")
    personality_traits: List[str] = Field(..., description="個性特徵清單")

    # 聲音特徵
    tone: VoiceTone = Field(..., description="主要語氣")
    vocabulary_style: VocabularyStyle = Field(..., description="詞彙與語言風格")
    speaking_patterns: List[str] = Field(default_factory=list, description="常見用語與說話模式")

    # Fallout 專屬元素
    faction_alignment: Optional[FactionAlignment] = Field(None, description="角色的派系陣營")
    humor_style: HumorStyle = Field(default=HumorStyle.NONE, description="使用的幽默類型")
    fallout_references: List[str] = Field(default_factory=list, description="常見 Fallout 遊戲梗")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "character_voice": "pip_boy",
                "character_name": "Pip-Boy 3000",
                "description": "Your trusty wrist-mounted computer providing technical analysis and statistical insights",
                "personality_traits": ["logical", "helpful", "data-driven", "systematic"],
                "tone": "analytical",
                "vocabulary_style": "technical",
                "speaking_patterns": ["Statistical probability indicates...", "Data analysis complete", "System recommendation:"],
                "faction_alignment": "vault_dweller",
                "humor_style": "technical",
                "fallout_references": ["S.P.E.C.I.A.L. stats", "Vault-Tec protocols", "radiation readings"]
            }
        }
    )


class InterpretationTemplates(BaseModel):
    """生成解讀的模板"""
    greeting_templates: List[str] = Field(default_factory=list, description="此角色開始占卜的方式")
    card_interpretation_templates: List[str] = Field(default_factory=list, description="卡牌解讀的模板")
    conclusion_templates: List[str] = Field(default_factory=list, description="此角色結束占卜的方式")
    transition_phrases: List[str] = Field(default_factory=list, description="在卡牌之間轉換的用語")
    emphasis_patterns: List[str] = Field(default_factory=list, description="角色強調重點的方式")


class CharacterVoiceSettings(BaseModel):
    """角色聲音的使用者自訂設定"""
    response_length: ResponseLength = Field(default=ResponseLength.MEDIUM, description="偏好的回應長度")
    detail_level: DetailLevel = Field(default=DetailLevel.BALANCED, description="解讀的詳細程度")
    include_humor: bool = Field(default=True, description="是否包含角色幽默")
    include_references: bool = Field(default=True, description="是否包含 Fallout 遊戲梗")
    emphasis_on_practical: bool = Field(default=False, description="強調實用建議")
    custom_phrases: List[str] = Field(default_factory=list, description="使用者新增的自訂用語")


class CharacterVoiceTemplate(CharacterTemplate):
    """完整的角色聲音模板"""
    id: str = Field(..., description="唯一模板 ID")

    # 回應模板
    templates: InterpretationTemplates = Field(default_factory=InterpretationTemplates)

    # 技術專長領域
    technical_expertise: List[str] = Field(default_factory=list, description="此角色的專長領域")

    # 使用與回饋
    usage_count: int = Field(default=0, description="此聲音被使用的次數")
    user_ratings: List[int] = Field(default_factory=list, description="使用者評分（1-5）")
    average_rating: float = Field(default=0.0, description="計算出的平均評分")

    # 狀態與元數據
    is_active: bool = Field(default=True, description="此聲音是否可用")
    is_premium: bool = Field(default=False, description="此聲音是否需要進階權限")
    is_beta: bool = Field(default=False, description="此聲音是否處於測試階段")

    # 時間戳記
    created_at: datetime = Field(..., description="模板建立時間")
    last_updated: datetime = Field(..., description="模板最後更新時間")
    last_used: Optional[datetime] = Field(None, description="聲音最後使用時間")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "pip-boy-3000",
                "character_voice": "pip_boy",
                "character_name": "Pip-Boy 3000",
                "description": "Your trusty wrist-mounted computer providing technical analysis and statistical insights",
                "personality_traits": ["logical", "helpful", "data-driven", "systematic"],
                "tone": "analytical",
                "vocabulary_style": "technical",
                "technical_expertise": ["statistics", "probability", "radiation monitoring", "health tracking"],
                "usage_count": 1547,
                "average_rating": 4.3,
                "is_active": True,
                "templates": {
                    "greeting_templates": ["Pip-Boy 3000 interface activated. Beginning tarot analysis...", "Data compilation complete. Ready for card interpretation."],
                    "card_interpretation_templates": ["Statistical analysis of card indicates: {interpretation}", "Data suggests: {interpretation}"],
                    "conclusion_templates": ["Analysis complete. Recommendation: {conclusion}", "Data processing finished. System suggests: {conclusion}"]
                }
            }
        }
    )


class VoiceInterpretationRequest(BaseModel):
    """角色聲音解讀請求"""
    character_voice: CharacterVoice = Field(..., description="要使用的角色聲音")
    card_data: Dict[str, Any] = Field(..., description="要解讀的卡牌資訊")
    context: Dict[str, Any] = Field(default_factory=dict, description="額外的脈絡資訊")
    settings: Optional[CharacterVoiceSettings] = Field(None, description="聲音自訂設定")
    question: Optional[str] = Field(None, description="使用者的問題（提供脈絡）")
    position_in_spread: Optional[str] = Field(None, description="在牌陣中的位置")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "character_voice": "pip_boy",
                "card_data": {
                    "name": "The Wanderer",
                    "upright_meaning": "New beginnings, journey into the unknown",
                    "radiation_level": 0.3
                },
                "context": {
                    "karma_alignment": "neutral",
                    "faction_influence": "vault_dweller"
                },
                "question": "What should I focus on this week?",
                "position_in_spread": "Present"
            }
        }
    )


class VoiceInterpretationResponse(BaseModel):
    """角色聲音解讀回應"""
    character_voice: CharacterVoice = Field(..., description="使用的角色聲音")
    interpretation: str = Field(..., description="角色專屬的解讀內容")
    style_notes: List[str] = Field(default_factory=list, description="關於解讀風格的註記")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI 對解讀的信心程度")
    fallout_references_used: List[str] = Field(default_factory=list, description="包含的 Fallout 遊戲梗")
    personality_elements: List[str] = Field(default_factory=list, description="展現的個性特徵")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "character_voice": "pip_boy",
                "interpretation": "Statistical analysis indicates a 73.2% probability of positive outcomes when embarking on new endeavors this week. Recommended action: Maintain current health status while exploring opportunities. Radiation levels acceptable for standard operations.",
                "style_notes": ["technical language", "statistical references", "practical recommendations"],
                "confidence": 0.87,
                "fallout_references_used": ["radiation levels", "health status monitoring"],
                "personality_elements": ["analytical", "helpful", "data-driven"]
            }
        }
    )


class VoiceListResponse(BaseModel):
    """聲音清單回應"""
    voices: List[CharacterVoiceTemplate] = Field(..., description="可用的角色聲音清單")
    total_count: int = Field(..., description="聲音總數")
    active_count: int = Field(..., description="啟用的聲音數量")
    premium_count: int = Field(..., description="進階聲音數量")


class VoiceUsageStats(BaseModel):
    """角色聲音的使用統計"""
    character_voice: CharacterVoice = Field(..., description="角色聲音")
    total_uses: int = Field(..., description="總使用次數")
    uses_this_month: int = Field(..., description="本月使用次數")
    uses_this_week: int = Field(..., description="本週使用次數")
    average_rating: float = Field(..., description="平均使用者評分")
    user_satisfaction: Dict[int, int] = Field(..., description="評分分布")
    popular_with_karma: Dict[str, int] = Field(..., description="按業力對齊的使用量")
    popular_card_types: List[str] = Field(..., description="最常解讀的卡牌類型")


class VoiceComparisonRequest(BaseModel):
    """Request to compare interpretations across voices"""
    card_data: Dict[str, Any] = Field(..., description="Card to interpret")
    voices: List[CharacterVoice] = Field(..., description="Voices to compare")
    context: Dict[str, Any] = Field(default_factory=dict, description="Shared context")
    question: Optional[str] = Field(None, description="Question for context")

    @field_validator('voices')
    def validate_voice_count(cls, v):
        if len(v) < 2:
            raise ValueError('At least 2 voices required for comparison')
        if len(v) > 5:
            raise ValueError('Maximum 5 voices allowed for comparison')
        return v


class VoiceComparisonResponse(BaseModel):
    """Response comparing interpretations across voices"""
    card_data: Dict[str, Any] = Field(..., description="Card that was interpreted")
    interpretations: List[VoiceInterpretationResponse] = Field(..., description="Interpretations from each voice")
    comparison_insights: List[str] = Field(..., description="Insights about the differences")
    style_differences: Dict[str, List[str]] = Field(..., description="Style differences by voice")
    recommended_voice: CharacterVoice = Field(..., description="Recommended voice for this context")


class CustomVoiceRequest(BaseModel):
    """Request to create a custom voice template"""
    base_voice: CharacterVoice = Field(..., description="Base voice to customize from")
    custom_name: str = Field(..., min_length=1, max_length=50, description="Custom name for the voice")
    personality_adjustments: List[str] = Field(default_factory=list, description="Personality trait adjustments")
    custom_phrases: List[str] = Field(default_factory=list, description="Custom phrases to include")
    tone_adjustment: Optional[VoiceTone] = Field(None, description="Tone adjustment")
    humor_preference: Optional[HumorStyle] = Field(None, description="Humor style preference")
    settings: CharacterVoiceSettings = Field(default_factory=CharacterVoiceSettings, description="Custom settings")


class VoiceFeedback(BaseModel):
    """User feedback for a character voice"""
    character_voice: CharacterVoice = Field(..., description="Character voice being rated")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    feedback_text: Optional[str] = Field(None, max_length=500, description="Optional feedback text")
    specific_aspects: Dict[str, int] = Field(default_factory=dict, description="Ratings for specific aspects")
    suggestions: Optional[str] = Field(None, max_length=300, description="Suggestions for improvement")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "character_voice": "pip_boy",
                "rating": 4,
                "feedback_text": "Love the technical analysis, but could use more humor",
                "specific_aspects": {
                    "accuracy": 5,
                    "personality": 4,
                    "helpfulness": 4,
                    "entertainment": 3
                },
                "suggestions": "Add more witty technical observations"
            }
        }
    )


class VoiceRecommendationRequest(BaseModel):
    """Request for character voice recommendations"""
    question_type: Optional[str] = Field(None, description="Type of question being asked")
    mood: Optional[str] = Field(None, description="User's current mood")
    preferred_style: Optional[VoiceTone] = Field(None, description="Preferred communication style")
    experience_level: Optional[str] = Field(None, description="User's tarot experience level")
    faction_preference: Optional[FactionAlignment] = Field(None, description="Faction preference")
    avoid_voices: List[CharacterVoice] = Field(default_factory=list, description="Voices to avoid")
    count: int = Field(default=3, ge=1, le=5, description="Number of recommendations")


class VoiceRecommendationResponse(BaseModel):
    """Character voice recommendations"""
    recommendations: List[Dict[str, Any]] = Field(..., description="Recommended voices with reasons")
    match_explanations: Dict[CharacterVoice, str] = Field(..., description="Why each voice was recommended")
    alternative_suggestions: List[CharacterVoice] = Field(default_factory=list, description="Alternative voices to try")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "recommendations": [
                    {
                        "voice": "pip_boy",
                        "match_score": 0.92,
                        "reasons": ["analytical style matches question type", "technical expertise relevant"]
                    }
                ],
                "match_explanations": {
                    "pip_boy": "Perfect match for technical questions requiring detailed analysis"
                },
                "alternative_suggestions": ["vault_dweller", "codsworth"]
            }
        }
    )