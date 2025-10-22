"""
廢土塔羅卡牌的 Pydantic 資料結構
提供完整的 API 文件與資料驗證模型
"""

from typing import List, Optional, Dict, Any, Union, TYPE_CHECKING
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum

if TYPE_CHECKING:
    from app.schemas.story import Story


class WastelandSuit(str, Enum):
    """廢土塔羅花色（Fallout 主題）"""
    MAJOR_ARCANA = "major_arcana"  # 大阿爾克那
    NUKA_COLA_BOTTLES = "nuka_cola_bottles"  # 核子可樂瓶（聖杯）
    COMBAT_WEAPONS = "combat_weapons"  # 戰鬥武器（寶劍）
    BOTTLE_CAPS = "bottle_caps"  # 瓶蓋（錢幣）
    RADIATION_RODS = "radiation_rods"  # 輻射棒（權杖）


class KarmaAlignment(str, Enum):
    """影響解讀的業力對齊"""
    GOOD = "good"  # 善良
    NEUTRAL = "neutral"  # 中立
    EVIL = "evil"  # 邪惡


class CharacterVoice(str, Enum):
    """角色解讀聲音"""
    PIP_BOY = "pip_boy"  # Pip-Boy（嗶嗶小子）
    VAULT_DWELLER = "vault_dweller"  # 避難所居民
    WASTELAND_TRADER = "wasteland_trader"  # 廢土商人
    SUPER_MUTANT = "super_mutant"  # 超級變種人
    CODSWORTH = "codsworth"  # Codsworth（科茲沃斯）


class FactionAlignment(str, Enum):
    """廢土派系陣營"""
    BROTHERHOOD = "brotherhood"  # 鋼鐵兄弟會（Brotherhood of Steel）
    NCR = "ncr"  # 新加州共和國（New California Republic）
    LEGION = "legion"  # 凱撒軍團（Caesar's Legion）
    RAIDERS = "raiders"  # 掠奪者
    VAULT_DWELLER = "vault_dweller"  # 獨立避難所居民


class CardBase(BaseModel):
    """基礎卡牌資料結構，包含必要資訊"""
    name: str = Field(..., description="卡牌名稱", example="The Wanderer")
    suit: WastelandSuit = Field(..., description="卡牌花色", example=WastelandSuit.MAJOR_ARCANA)
    number: Optional[int] = Field(None, description="卡牌編號（大阿爾克那為 None）", example=0)
    upright_meaning: str = Field(..., description="正位解讀", example="New beginnings in the wasteland")
    reversed_meaning: str = Field(..., description="逆位解讀", example="Fear of leaving the vault")


class WastelandCardMetadata(BaseModel):
    """廢土專屬的卡牌屬性"""
    radiation_level: float = Field(default=0.0, ge=0.0, le=1.0, description="輻射等級（0.0 到 1.0）", example=0.3)
    threat_level: int = Field(default=1, ge=1, le=10, description="威脅等級（1-10 級）", example=5)
    vault_number: Optional[int] = Field(None, description="關聯的避難所編號", example=111)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "radiation_level": 0.3,
                "threat_level": 5,
                "vault_number": 111
            }
        }
    )


class CharacterInterpretations(BaseModel):
    """不同角色聲音對卡牌的解讀"""
    pip_boy_analysis: Optional[str] = Field(None, description="Pip-Boy 技術分析", example="Statistical probability of success: 73.2%")
    vault_dweller_perspective: Optional[str] = Field(None, description="避難所居民的樂觀視角", example="Every journey begins with a single step outside the vault")
    wasteland_trader_wisdom: Optional[str] = Field(None, description="商人的實用建議", example="Trust your instincts, but verify your caps")
    super_mutant_simplicity: Optional[str] = Field(None, description="超級變種人的簡單觀點", example="BIG CHANGE COMING. GOOD OR BAD, CHANGE IS CHANGE")
    codsworth_analysis: Optional[str] = Field(None, description="Codsworth 的優雅觀點", example="I daresay this indicates a most fortuitous turn of events, sir")


class FactionSignificances(BaseModel):
    """各派系專屬的卡牌意義"""
    brotherhood_significance: Optional[str] = Field(None, description="鋼鐵兄弟會觀點")
    ncr_significance: Optional[str] = Field(None, description="新加州共和國觀點")
    legion_significance: Optional[str] = Field(None, description="凱撒軍團解讀")
    raiders_significance: Optional[str] = Field(None, description="掠奪者派系意義")
    vault_dweller_significance: Optional[str] = Field(None, description="獨立避難所居民觀點")


class CardVisuals(BaseModel):
    """卡牌的視覺與音效元素"""
    image_url: Optional[str] = Field(None, description="卡牌圖片 URL", example="/public/cards/major_arcana/the_wanderer.jpg")
    image_alt_text: Optional[str] = Field(None, description="無障礙替代文字", example="A lone figure in a vault suit walking into the wasteland")
    background_image_url: Optional[str] = Field(None, description="背景圖片 URL")
    audio_cue_url: Optional[str] = Field(None, description="音效提示 URL", example="/public/audio/geiger_click.mp3")
    geiger_sound_intensity: float = Field(default=0.1, ge=0.0, le=1.0, description="蓋革計數器音效強度")


class CardStats(BaseModel):
    """卡牌使用統計與詮釋資料"""
    draw_frequency: int = Field(default=0, ge=0, description="此卡牌被抽取的頻率", example=127)
    total_appearances: int = Field(default=0, ge=0, description="在占卜中出現的總次數", example=89)
    last_drawn_at: Optional[str] = Field(None, description="最後抽取時間戳記", example="2024-01-15T14:30:00Z")


class WastelandCard(CardBase):
    """完整的廢土塔羅卡牌資料結構"""
    id: str = Field(..., description="唯一卡牌識別碼", example="wanderer-001")

    # 廢土專屬屬性
    metadata: WastelandCardMetadata = Field(default_factory=WastelandCardMetadata)

    # 業力導向的解讀
    good_karma_interpretation: Optional[str] = Field(None, description="善良業力的解讀")
    neutral_karma_interpretation: Optional[str] = Field(None, description="中立業力的解讀")
    evil_karma_interpretation: Optional[str] = Field(None, description="邪惡業力的解讀")

    # 角色聲音解讀
    character_voices: CharacterInterpretations = Field(default_factory=CharacterInterpretations)

    # 派系陣營
    faction_meanings: FactionSignificances = Field(default_factory=FactionSignificances)

    # 視覺與音效元素
    visuals: CardVisuals = Field(default_factory=CardVisuals)

    # 風味與幽默
    wasteland_humor: Optional[str] = Field(None, description="廢土主題幽默")
    nuka_cola_reference: Optional[str] = Field(None, description="核子可樂主題引用")
    fallout_easter_egg: Optional[str] = Field(None, description="Fallout 遊戲彩蛋")

    # 遊戲機制
    affects_luck_stat: bool = Field(default=False, description="影響幸運屬性")
    affects_charisma_stat: bool = Field(default=False, description="影響魅力屬性")
    affects_intelligence_stat: bool = Field(default=False, description="影響智力屬性")
    special_ability: Optional[str] = Field(None, description="特殊卡牌能力")

    # 統計資料
    stats: CardStats = Field(default_factory=CardStats)

    # 計算屬性
    is_major_arcana: bool = Field(..., description="是否為大阿爾克那卡牌")
    is_court_card: bool = Field(..., description="是否為宮廷牌")
    rank: Optional[str] = Field(None, description="人頭牌的等級", example="Queen")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "wanderer-001",
                "name": "The Wanderer",
                "suit": "major_arcana",
                "number": 0,
                "upright_meaning": "New beginnings, journey into the unknown, potential for discovery",
                "reversed_meaning": "Fear of change, reluctance to leave comfort zone, missed opportunities",
                "metadata": {
                    "radiation_level": 0.3,
                    "threat_level": 5,
                    "vault_number": 111
                },
                "good_karma_interpretation": "Your noble intentions will guide you safely through the wasteland",
                "character_voices": {
                    "pip_boy_analysis": "Probability of successful journey: 73.2%. Recommend carrying extra stimpaks.",
                    "vault_dweller_perspective": "Every adventure starts with a single step outside the vault door"
                },
                "wasteland_humor": "Just like leaving Vault 111, sometimes you have to step into the unknown - but hopefully with better results than most vault experiments",
                "is_major_arcana": True,
                "is_court_card": False
            }
        }
    )


class CardCreate(CardBase):
    """建立新卡牌的資料結構"""
    metadata: Optional[WastelandCardMetadata] = None
    character_voices: Optional[CharacterInterpretations] = None
    faction_meanings: Optional[FactionSignificances] = None
    visuals: Optional[CardVisuals] = None

    # 選填的風味內容
    wasteland_humor: Optional[str] = None
    nuka_cola_reference: Optional[str] = None
    fallout_easter_egg: Optional[str] = None


class CardUpdate(BaseModel):
    """更新現有卡牌的資料結構"""
    name: Optional[str] = None
    upright_meaning: Optional[str] = None
    reversed_meaning: Optional[str] = None
    metadata: Optional[WastelandCardMetadata] = None
    character_voices: Optional[CharacterInterpretations] = None
    faction_meanings: Optional[FactionSignificances] = None
    visuals: Optional[CardVisuals] = None
    wasteland_humor: Optional[str] = None
    nuka_cola_reference: Optional[str] = None
    fallout_easter_egg: Optional[str] = None


class CardSearchParams(BaseModel):
    """卡牌搜尋參數"""
    query: Optional[str] = Field(None, description="搜尋關鍵字（名稱、意義、關鍵詞）", example="wanderer")
    suit: Optional[WastelandSuit] = Field(None, description="依花色篩選")
    karma_alignment: Optional[KarmaAlignment] = Field(None, description="依業力相容性篩選")
    faction: Optional[FactionAlignment] = Field(None, description="依派系陣營篩選")
    min_radiation: Optional[float] = Field(None, ge=0.0, le=1.0, description="最低輻射等級")
    max_radiation: Optional[float] = Field(None, ge=0.0, le=1.0, description="最高輻射等級")
    min_threat: Optional[int] = Field(None, ge=1, le=10, description="最低威脅等級")
    max_threat: Optional[int] = Field(None, ge=1, le=10, description="最高威脅等級")

    @field_validator('max_radiation')
    def validate_radiation_range(cls, v, info):
        if v is not None and info.data.get('min_radiation') is not None:
            if v < info.data['min_radiation']:
                raise ValueError('max_radiation 必須大於 min_radiation')
        return v

    @field_validator('max_threat')
    def validate_threat_range(cls, v, info):
        if v is not None and info.data.get('min_threat') is not None:
            if v < info.data['min_threat']:
                raise ValueError('max_threat 必須大於 min_threat')
        return v


class CardListResponse(BaseModel):
    """卡牌清單回應模型（支援Story Mode）"""
    cards: List[Union[WastelandCard, 'WastelandCardWithStory']] = Field(..., description="卡牌清單（可能包含故事內容）")
    total_count: int = Field(..., description="符合條件的卡牌總數")
    page: int = Field(..., description="目前頁碼")
    page_size: int = Field(..., description="每頁卡牌數量")
    has_more: bool = Field(..., description="是否有更多頁面")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class RandomCardParams(BaseModel):
    """隨機卡牌選擇參數"""
    count: int = Field(default=1, ge=1, le=10, description="要抽取的隨機卡牌數量")
    exclude_major_arcana: bool = Field(default=False, description="排除大阿爾克那卡牌")
    karma_influence: Optional[KarmaAlignment] = Field(None, description="影響選擇的業力對齊")
    faction_preference: Optional[FactionAlignment] = Field(None, description="選擇的派系偏好")
    radiation_factor: float = Field(default=0.5, ge=0.0, le=1.0, description="輻射對隨機性的影響")


class CardInterpretationRequest(BaseModel):
    """特定角色解讀請求"""
    character_voice: CharacterVoice = Field(..., description="解讀使用的角色聲音")
    karma_context: Optional[KarmaAlignment] = Field(None, description="解讀的業力語境")
    question_context: Optional[str] = Field(None, description="解讀的問題或情境")
    position_in_spread: Optional[str] = Field(None, description="在牌陣中的位置")


class CardInterpretationResponse(BaseModel):
    """帶有角色專屬解讀的回應"""
    card_id: str = Field(..., description="卡牌識別碼")
    character_voice: CharacterVoice = Field(..., description="使用的角色聲音")
    interpretation: str = Field(..., description="角色專屬解讀")
    context_applied: bool = Field(..., description="是否套用額外情境")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI 對解讀的信心度")
    radiation_influence: float = Field(..., description="輻射對解讀的影響")


# ============================================================
# Wasteland Story Mode Schemas (Phase: 故事模式擴展)
# ============================================================

class WastelandCardWithStory(WastelandCard):
    """
    帶有故事內容的廢土塔羅卡牌 Schema

    擴展 WastelandCard，新增故事模式相關欄位：
    - story: 完整的故事內容
    - audio_urls: 故事語音 URL（用於 TTS 功能）
    """

    story: Optional['Story'] = Field(
        None,
        description="卡牌故事內容（選填）"
    )

    audio_urls: Optional[Dict[str, str]] = Field(
        None,
        description="故事語音 URL 對應表（角色名稱 -> 音檔 URL）",
        example={
            "pip_boy": "/audio/story/card-001/pip_boy.mp3",
            "vault_dweller": "/audio/story/card-001/vault_dweller.mp3",
            "wasteland_trader": "/audio/story/card-001/wasteland_trader.mp3"
        }
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "wanderer-001",
                "name": "The Wanderer",
                "suit": "major_arcana",
                "number": 0,
                "upright_meaning": "New beginnings, journey into the unknown",
                "reversed_meaning": "Fear of change, reluctance to leave comfort zone",
                "is_major_arcana": True,
                "is_court_card": False,
                "story": {
                    "background": (
                        "在2277年10月23日的早晨，101號避難所的大門終於緩緩開啟。"
                        "一個年輕的居民站在出口處，手持父親留下的Pip-Boy 3000..."
                    ),
                    "character": "避難所居民 101 (Lone Wanderer)",
                    "location": "Vault 101 出口、Springvale 小鎮廢墟",
                    "timeline": "2277 年",
                    "factions_involved": ["vault_dweller", "brotherhood"],
                    "related_quest": "Following in His Footsteps"
                },
                "audio_urls": {
                    "pip_boy": "/audio/story/wanderer-001/pip_boy.mp3",
                    "vault_dweller": "/audio/story/wanderer-001/vault_dweller.mp3"
                }
            }
        }
    )


# ============================================================
# Resolve Forward References (必須在檔案結尾)
# ============================================================

# 在執行時解析 Story forward reference
# 這允許 WastelandCardWithStory 正確使用 story.Story 類型
try:
    from app.schemas.story import Story
    WastelandCardWithStory.model_rebuild()
except ImportError:
    # 如果 Story 尚未定義，靜默失敗（用於測試環境）
    pass