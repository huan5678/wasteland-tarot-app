#!/usr/bin/env python3
"""
Wasteland Tarot API - Swagger Demo
簡化版API展示，專注於Swagger UI文件
"""

from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
import uvicorn
from database import card_repository, spread_repository
import logging

# === Pydantic Models ===

class SuitType(str, Enum):
    """塔羅牌花色"""
    MAJOR_ARCANA = "MAJOR_ARCANA"
    major_arcana = "major_arcana"  # 相容資料庫格式
    RADIATION_RODS = "RADIATION_RODS"
    radiation_rods = "radiation_rods"  # 相容資料庫格式
    COMBAT_WEAPONS = "COMBAT_WEAPONS"
    combat_weapons = "combat_weapons"  # 相容資料庫格式
    BOTTLE_CAPS = "BOTTLE_CAPS"
    bottle_caps = "bottle_caps"  # 相容資料庫格式
    NUKA_COLA_BOTTLES = "NUKA_COLA_BOTTLES"
    nuka_cola_bottles = "nuka_cola_bottles"  # 相容資料庫格式

class KarmaAlignment(str, Enum):
    """業力對齊"""
    GOOD = "GOOD"
    NEUTRAL = "NEUTRAL"
    EVIL = "EVIL"

class CharacterVoice(str, Enum):
    """角色聲音"""
    PIP_BOY = "PIP_BOY"
    SUPER_MUTANT = "SUPER_MUTANT"
    GHOUL = "GHOUL"
    RAIDER = "RAIDER"
    BROTHERHOOD_SCRIBE = "BROTHERHOOD_SCRIBE"
    VAULT_DWELLER = "VAULT_DWELLER"
    CODSWORTH = "CODSWORTH"
    WASTELAND_TRADER = "WASTELAND_TRADER"

class WastelandCard(BaseModel):
    """廢土塔羅卡牌"""
    id: str = Field(..., description="卡牌唯一ID")
    name: str = Field(..., description="卡牌名稱")
    suit: str = Field(..., description="花色")  # 改為 str 以提高相容性
    number: Optional[int] = Field(None, ge=0, le=21, description="卡牌編號")
    upright_meaning: str = Field(..., description="正位含義")
    reversed_meaning: str = Field(..., description="逆位含義")
    radiation_level: Optional[float] = Field(None, ge=0.0, le=1.0, description="輻射等級 (0.0-1.0)")
    threat_level: Optional[int] = Field(None, ge=1, le=5, description="威脅等級 (1-5)")

    # Supabase 資料庫欄位對應
    wasteland_humor: Optional[str] = Field(None, description="廢土幽默")
    nuka_cola_reference: Optional[str] = Field(None, description="Nuka Cola 參考")
    fallout_easter_egg: Optional[str] = Field(None, description="Fallout 彩蛋")
    special_ability: Optional[str] = Field(None, description="特殊能力")

    # 關鍵詞陣列
    upright_keywords: Optional[List[str]] = Field(None, description="正位關鍵詞")
    reversed_keywords: Optional[List[str]] = Field(None, description="逆位關鍵詞")

    # 業力解讀
    good_interpretation: Optional[str] = Field(None, description="善良業力解讀")
    neutral_interpretation: Optional[str] = Field(None, description="中立業力解讀")
    evil_interpretation: Optional[str] = Field(None, description="邪惡業力解讀")

    # 角色聲音
    pip_boy_voice: Optional[str] = Field(None, description="Pip-Boy 聲音")
    vault_dweller_voice: Optional[str] = Field(None, description="避難所居民聲音")
    wasteland_trader_voice: Optional[str] = Field(None, description="廢土商人聲音")
    super_mutant_voice: Optional[str] = Field(None, description="超級變種人聲音")
    codsworth_voice: Optional[str] = Field(None, description="Codsworth 聲音")

    # 派系意義
    brotherhood_significance: Optional[str] = Field(None, description="鋼鐵兄弟會意義")
    ncr_significance: Optional[str] = Field(None, description="NCR 意義")
    legion_significance: Optional[str] = Field(None, description="凱撒軍團意義")
    raiders_significance: Optional[str] = Field(None, description="掠奪者意義")

    # 時間戳記
    created_at: Optional[datetime] = Field(None, description="建立時間")
    updated_at: Optional[datetime] = Field(None, description="更新時間")

    # 為了向後相容性保留的屬性
    @property
    def radiation_factor(self) -> float:
        """向後相容性：輻射因子"""
        return self.radiation_level or 0.0

    @property
    def karma_alignment(self) -> str:
        """向後相容性：業力對齊"""
        if self.good_interpretation:
            return "GOOD"
        elif self.evil_interpretation:
            return "EVIL"
        else:
            return "NEUTRAL"

    @property
    def fallout_reference(self) -> str:
        """向後相容性：Fallout 參考"""
        return self.fallout_easter_egg or self.nuka_cola_reference or "經典 Fallout 元素"

    @property
    def character_voices(self) -> Dict[str, str]:
        """向後相容性：角色聲音字典"""
        voices = {}
        if self.pip_boy_voice:
            voices["PIP_BOY"] = self.pip_boy_voice
        if self.vault_dweller_voice:
            voices["VAULT_DWELLER"] = self.vault_dweller_voice
        if self.wasteland_trader_voice:
            voices["WASTELAND_TRADER"] = self.wasteland_trader_voice
        if self.super_mutant_voice:
            voices["SUPER_MUTANT"] = self.super_mutant_voice
        if self.codsworth_voice:
            voices["CODSWORTH"] = self.codsworth_voice
        return voices

    @property
    def keywords(self) -> List[str]:
        """向後相容性：關鍵詞列表"""
        all_keywords = []
        if self.upright_keywords:
            all_keywords.extend(self.upright_keywords)
        if self.reversed_keywords:
            all_keywords.extend(self.reversed_keywords)
        return list(set(all_keywords))  # 去重

    @property
    def description(self) -> str:
        """向後相容性：卡牌描述"""
        return self.wasteland_humor or self.special_ability or f"{self.name} 是一張充滿廢土智慧的塔羅卡牌。"

    @property
    def image_url(self) -> str:
        """向後相容性：圖片URL"""
        return f"/cards/{self.id.lower().replace('_', '-')}.png"

    class Config:
        json_schema_extra = {
            "example": {
                "id": "915ef88b-6ffc-4ca3-8ae6-fdfb85ca014e",
                "name": "新手避難所居民",
                "suit": "major_arcana",
                "number": 0,
                "upright_meaning": "新開始、天真、無知即福、適應能力、探索精神。代表剛走出避難所對廢土充滿好奇心的新手",
                "reversed_meaning": "魯莽、缺乏準備、忽視危險、過度樂觀。警告未做好準備就踏入危險廢土",
                "radiation_level": 0.1,
                "threat_level": 1,
                "wasteland_humor": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土，完全沒意識到危險",
                "nuka_cola_reference": "第一次喝到Nuka-Cola Quantum就興奮得手舞足蹈",
                "fallout_easter_egg": "戰爭...戰爭從不改變。但冒險？總是從踏出避難所的第一步開始",
                "special_ability": "增加運氣值1點直到下次占卜。提供新手運氣加成",
                "upright_keywords": ["新開始", "天真", "探索", "適應", "希望"],
                "reversed_keywords": ["魯莽", "無知", "危險", "準備不足"],
                "good_interpretation": "你的純真將成為在廢土中生存的優勢。保持開放的心態，學習新事物",
                "neutral_interpretation": "新的開始需要謹慎。在探索廢土時保持警覺，但不要失去好奇心",
                "evil_interpretation": "利用別人的信任。你的外表無害，可以讓其他人放下戒心",
                "pip_boy_voice": "檢測到新冒險！建議：保持謹慎，收集資源，建立同盟關係",
                "vault_dweller_voice": "我還記得第一次走出避難所的感覺...充滿希望但也很害怕",
                "wasteland_trader_voice": "新面孔總是好消息！需要什麼裝備嗎？新手價八折！",
                "super_mutant_voice": "又一個弱小人類！需要保護，教導戰鬥！",
                "codsworth_voice": "歡迎來到外面的世界，先生/女士。我相信您會適應得很好的",
                "created_at": "2024-01-01T12:00:00Z"
            }
        }

class SpreadType(str, Enum):
    """牌陣類型"""
    THREE_CARD = "THREE_CARD"
    CELTIC_CROSS = "CELTIC_CROSS"
    HORSESHOE = "HORSESHOE"
    RELATIONSHIP = "RELATIONSHIP"
    YEAR_AHEAD = "YEAR_AHEAD"
    VAULT_TEC_SPREAD = "VAULT_TEC_SPREAD"  # 新增的牌陣類型
    BROTHERHOOD_COUNCIL = "BROTHERHOOD_COUNCIL"  # 新增的牌陣類型

class SpreadTemplate(BaseModel):
    """牌陣模板"""
    id: str = Field(..., description="牌陣ID")
    name: str = Field(..., description="牌陣名稱")
    type: str = Field(..., description="牌陣類型")  # 改為 str 以提高相容性
    description: str = Field(..., description="牌陣描述")
    difficulty: int = Field(..., ge=1, le=5, description="難度等級 (1-5)")
    card_count: int = Field(..., ge=1, le=21, description="需要卡牌數量")
    positions: List[str] = Field(..., description="卡牌位置說明")

    class Config:
        schema_extra = {
            "example": {
                "id": "celtic_cross",
                "name": "廢土凱爾特十字",
                "type": "CELTIC_CROSS",
                "description": "經典的十張卡牌陣，適合深度探索問題的各個層面",
                "difficulty": 4,
                "card_count": 10,
                "positions": ["現在情況", "挑戰", "遠程過去", "近期過去", "可能結果", "近期未來", "你的方法", "外界影響", "希望與恐懼", "最終結果"]
            }
        }

class ReadingSession(BaseModel):
    """塔羅閱讀會話"""
    id: str = Field(..., description="會話ID")
    spread_id: str = Field(..., description="使用的牌陣ID")
    cards: List[WastelandCard] = Field(..., description="抽到的卡牌")
    question: Optional[str] = Field(None, description="提問的問題")
    interpretation: str = Field(..., description="整體解讀")
    created_at: datetime = Field(..., description="創建時間")

    class Config:
        schema_extra = {
            "example": {
                "id": "reading_001",
                "spread_id": "three_card",
                "cards": [],
                "question": "我在廢土中的未來會如何？",
                "interpretation": "卡牌顯示你將面臨挑戰，但最終會找到新的希望。",
                "created_at": "2024-01-01T12:00:00Z"
            }
        }

class CardSearchResponse(BaseModel):
    """卡牌搜索響應"""
    cards: List[WastelandCard] = Field(..., description="搜索到的卡牌")
    total: int = Field(..., description="總數量")
    page: int = Field(..., description="當前頁面")
    per_page: int = Field(..., description="每頁數量")

# === FastAPI App Setup ===

app = FastAPI(
    title="🃏 Wasteland Tarot API",
    description="""
    # ☢️ 廢土塔羅牌API系統

    **完整的78張廢土主題塔羅卡牌系統，融合Fallout世界觀與塔羅占卜的神秘力量。**

    ## 🌟 主要特色

    - 🃏 **78張完整卡牌** - 22張大阿爾克那 + 56張小阿爾克那
    - 🎭 **8個角色聲音** - Pip-Boy、超級變種人、屍鬼等Fallout角色解讀
    - ☢️ **輻射系統** - 每張卡牌都有獨特的輻射因子
    - ⚖️ **業力系統** - 善良、中立、邪惡的道德對齊
    - 🎯 **多種牌陣** - 三卡牌陣、凱爾特十字等經典佈局
    - 📊 **閱讀歷史** - 完整的占卜記錄和統計分析

    ## 🚀 開始使用

    1. 瀏覽所有卡牌：`GET /api/v1/cards`
    2. 抽取隨機卡牌：`GET /api/v1/cards/random`
    3. 創建占卜會話：`POST /api/v1/readings`
    4. 探索牌陣模板：`GET /api/v1/spreads`

    > 戰爭...戰爭從不改變。但塔羅占卜？它將指引你在廢土中找到希望。
    """,
    version="3.0.0",
    terms_of_service="https://fallout.bethesda.net/terms",
    contact={
        "name": "Vault-Tec 技術支援",
        "url": "https://vault-tec.com/support",
        "email": "support@vault-tec.com",
    },
    license_info={
        "name": "Wasteland Public License",
        "url": "https://fallout.fandom.com/wiki/Fallout_Wiki",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Database Configuration ===
# 使用 database.py 中的實際資料庫連接
# 節點現在會從 Supabase 讀取真實資料

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === API Endpoints ===

@app.get("/", tags=["首頁"])
async def root():
    """
    🏠 API首頁

    歡迎來到廢土塔羅API！這裡融合了Fallout的後末日世界觀與塔羅占卜的神秘智慧。
    """
    return {
        "message": "☢️ 歡迎來到廢土塔羅API",
        "version": "3.0.0",
        "description": "78張完整的Fallout主題塔羅卡牌系統",
        "docs": "/docs",
        "total_cards": 78,
        "vault_tec_approved": True
    }

@app.get("/api/v1/cards", response_model=CardSearchResponse, tags=["🃏 卡牌管理"])
async def get_all_cards(
    suit: Optional[SuitType] = Query(None, description="篩選特定花色"),
    karma: Optional[KarmaAlignment] = Query(None, description="篩選業力對齊"),
    min_radiation: Optional[float] = Query(None, ge=0.0, le=1.0, description="最低輻射因子"),
    max_radiation: Optional[float] = Query(None, ge=0.0, le=1.0, description="最高輻射因子"),
    page: int = Query(1, ge=1, description="頁面編號"),
    per_page: int = Query(10, ge=1, le=100, description="每頁數量")
):
    """
    🃏 獲取所有卡牌

    返回完整的78張廢土塔羅卡牌列表，支援多種篩選條件：

    - **花色篩選**: major_arcana（大阿爾克那）、radiation_rods（輻射棒）、combat_weapons（戰鬥武器）、bottle_caps（瓶蓋）、nuka_cola_bottles（可樂瓶）
    - **業力篩選**: 基於卡牌的業力解讀內容
    - **輻射範圍**: 0.0 (安全) 到 1.0 (極高輻射)

    每張卡牌都包含豐富的Fallout背景故事、多角色解讀、派系意義和廢土幽默。實際欄位包括：
    - wasteland_humor（廢土幽默）
    - nuka_cola_reference（可樂參考）
    - fallout_easter_egg（Fallout彩蛋）
    - special_ability（特殊能力）
    - 8種角色聲音解讀
    - 4種派系意義解讀
    """
    try:
        logger.info(f"查詢卡牌: suit={suit}, karma={karma}, radiation=({min_radiation}, {max_radiation}), page={page}")

        # 使用 CardRepository 查詢資料庫
        result = await card_repository.get_all_cards(
            suit=suit.value if suit else None,
            karma=karma.value if karma else None,
            min_radiation=min_radiation,
            max_radiation=max_radiation,
            page=page,
            per_page=per_page
        )

        # 轉換為 WastelandCard 物件
        cards = [WastelandCard(**card_data) for card_data in result['cards']]

        return CardSearchResponse(
            cards=cards,
            total=result['total'],
            page=result['page'],
            per_page=result['per_page']
        )

    except Exception as e:
        logger.error(f"獲取卡牌失敗: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"☢️ Pip-Boy 系統錯誤：無法連接到廢土資料庫。詳情: {str(e)}"
        )

@app.get("/api/v1/cards/random", response_model=List[WastelandCard], tags=["🃏 卡牌管理"])
async def get_random_cards(
    count: int = Query(1, ge=1, le=10, description="隨機卡牌數量"),
    karma_influence: Optional[KarmaAlignment] = Query(None, description="業力影響隨機性"),
    radiation_zone: Optional[bool] = Query(False, description="是否限制在高輻射區域")
):
    """
    🎰 抽取隨機卡牌

    從78張卡牌中隨機抽取指定數量的卡牌，可選擇影響因素：

    - 🎲 **純隨機抽取** - 標準的塔羅占卜方式
    - ⚖️ **業力影響** - 根據你的道德取向調整隨機性
    - ☢️ **輻射區域** - 限制在高輻射污染的卡牌中抽取

    適合各種占卜情境，從簡單的每日一卡到複雜的牌陣佈局。
    """
    try:
        logger.info(f"隨機抽卡: count={count}, karma={karma_influence}, radiation_zone={radiation_zone}")

        # 使用 CardRepository 獲取隨機卡牌
        card_data_list = await card_repository.get_random_cards(
            count=count,
            karma_influence=karma_influence.value if karma_influence else None,
            radiation_zone=radiation_zone
        )

        if not card_data_list:
            raise HTTPException(
                status_code=404,
                detail="☢️ 廢土中找不到符合條件的卡牌！請調整篩選條件。"
            )

        return [WastelandCard(**card_data) for card_data in card_data_list]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"隨機抽卡失敗: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"☢️ Pip-Boy 隨機數產生器故障！詳情: {str(e)}"
        )

@app.get("/api/v1/cards/{card_id}", response_model=WastelandCard, tags=["🃏 卡牌管理"])
async def get_card_by_id(
    card_id: str = Path(..., description="卡牌ID (例如: major_0, rad_5)")
):
    """
    🎯 獲取特定卡牌詳情

    返回單張卡牌的完整詳細信息，包括：

    - 🎭 **8個角色聲音解讀** (pip_boy_voice、vault_dweller_voice、wasteland_trader_voice、super_mutant_voice、codsworth_voice)
    - ☢️ **輻射等級(radiation_level)和威脅評估(threat_level)**
    - 🎮 **Fallout遊戲背景故事** (fallout_easter_egg、nuka_cola_reference、wasteland_humor)
    - 🔮 **正位和逆位含義** (upright_meaning、reversed_meaning)
    - 🏷️ **關鍵詞標籤** (upright_keywords、reversed_keywords)
    - ⚖️ **業力解讀** (good_interpretation、neutral_interpretation、evil_interpretation)
    - 🏛️ **派系意義** (brotherhood_significance、ncr_significance、legion_significance、raiders_significance)
    - ⭐ **特殊能力** (special_ability)

    卡牌ID為UUID格式，花色使用小寫下劃線格式。
    """
    try:
        logger.info(f"查詢卡牌 ID: {card_id}")

        # 使用 CardRepository 查詢特定卡牌
        card_data = await card_repository.get_card_by_id(card_id)

        if not card_data:
            raise HTTPException(
                status_code=404,
                detail=f"☢️ 卡牌 {card_id} 在廢土資料庫中失蹤了！請檢查 Pip-Boy 記錄。"
            )

        return WastelandCard(**card_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"獲取卡牌 {card_id} 失敗: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"☢️ Pip-Boy 系統錯誤：無法讀取卡牌資料。詳情: {str(e)}"
        )

@app.get("/api/v1/spreads", response_model=List[SpreadTemplate], tags=["🎯 牌陣系統"])
async def get_spread_templates(
    difficulty: Optional[int] = Query(None, ge=1, le=5, description="難度等級篩選")
):
    """
    🎯 獲取牌陣模板

    返回可用的塔羅牌陣模板，包括：

    - 📊 **難度等級** (1-5星)
    - 🃏 **所需卡牌數量**
    - 📍 **卡牌位置說明**
    - 💡 **適用情境建議**

    從簡單的三卡牌陣到複雜的凱爾特十字，滿足不同水平的占卜需求。
    """
    try:
        logger.info(f"查詢牌陣模板: difficulty={difficulty}")

        # 使用 SpreadRepository 獲取牌陣模板
        spreads = await spread_repository.get_all_spreads(difficulty=difficulty)

        return [SpreadTemplate(**spread) for spread in spreads]

    except Exception as e:
        logger.error(f"獲取牌陣模板失敗: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"☢️ Vault-Tec 牌陣資料庫連接失敗。詳情: {str(e)}"
        )

@app.post("/api/v1/readings", response_model=ReadingSession, tags=["📖 閱讀會話"])
async def create_reading(
    spread_id: str = Query(..., description="使用的牌陣ID"),
    question: Optional[str] = Query(None, description="占卜問題"),
    karma_alignment: Optional[KarmaAlignment] = Query(None, description="占卜者業力")
):
    """
    📖 創建新的占卜會話

    根據指定的牌陣創建一次完整的塔羅占卜：

    1. 🎯 **選擇牌陣** - 從可用模板中選擇適合的佈局
    2. 🃏 **抽取卡牌** - 根據牌陣要求抽取對應數量的卡牌
    3. 🎭 **角色解讀** - 自動生成多角色視角的解釋
    4. 💾 **保存記錄** - 會話將被保存以供後續查閱

    每次占卜都會考慮廢土環境因素和業力影響。
    """
    try:
        import random
        from datetime import datetime

        logger.info(f"創建占卜會話: spread_id={spread_id}, question={question}, karma={karma_alignment}")

        # 使用 SpreadRepository 找到對應的牌陣模板
        spread_template = await spread_repository.get_spread_by_id(spread_id)

        if not spread_template:
            raise HTTPException(
                status_code=404,
                detail=f"☢️ 牌陣模板 {spread_id} 在 Vault-Tec 資料庫中遺失！"
            )

        # 使用 CardRepository 隨機抽取卡牌
        card_data_list = await card_repository.get_random_cards(
            count=spread_template["card_count"],
            karma_influence=karma_alignment.value if karma_alignment else None,
            radiation_zone=False
        )

        if not card_data_list:
            raise HTTPException(
                status_code=404,
                detail="☢️ 廢土中找不到足夠的卡牌進行占卜！"
            )

        cards = [WastelandCard(**card_data) for card_data in card_data_list]

        # 生成智能解讀
        interpretation = f"根據 {spread_template['name']} 牌陣，"

        if karma_alignment:
            interpretation += f"從{karma_alignment.value.lower()}業力角度來看，"

        interpretation += "卡牌顯示了以下信息：\n\n"

        # 為每個位置生成簡單的解讀
        for i, (position, card) in enumerate(zip(spread_template["positions"], cards)):
            interpretation += f"**{position}**: {card.name} - {card.upright_meaning[:50]}...\n"

        if question:
            interpretation += f"\n針對「{question}」這個問題，建議仔細考慮每張卡牌的含義以及它們在廢土環境中的特殊意義。"

        reading = ReadingSession(
            id=f"reading_{random.randint(1000, 9999)}",
            spread_id=spread_id,
            cards=cards,
            question=question,
            interpretation=interpretation,
            created_at=datetime.now()
        )

        return reading

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"創建占卜會話失敗: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"☢️ Pip-Boy 占卜系統故障！詳情: {str(e)}"
        )

@app.get("/api/v1/voices", tags=["🎭 角色系統"])
async def get_character_voices():
    """
    🎭 獲取可用角色聲音

    返回所有可用的Fallout角色聲音，每個角色都有獨特的解讀風格：

    - 🤖 **Pip-Boy** - 科技分析風格
    - 👹 **超級變種人** - 直接暴力風格
    - 💀 **屍鬼** - 睿智經驗風格
    - 🔫 **掠奪者** - 實用主義風格
    - 📚 **兄弟會書記員** - 學術研究風格
    - 🏠 **避難所居民** - 樂觀希望風格
    - 🎩 **Codsworth** - 禮貌服務風格
    - 💰 **廢土商人** - 商業機會風格
    """
    voices = [
        {
            "id": "PIP_BOY",
            "name": "Pip-Boy 3000",
            "description": "你的可靠Pip-Boy設備，提供技術性分析和數據驅動的解讀",
            "personality": "科技、理性、數據導向",
            "sample_quote": "檢測到塔羅卡牌。正在分析象徵意義..."
        },
        {
            "id": "SUPER_MUTANT",
            "name": "超級變種人",
            "description": "強大而直接的變種人視角，簡單粗暴但往往一針見血",
            "personality": "直接、強力、簡單",
            "sample_quote": "卡片說什麼就是什麼！不要想太複雜！"
        },
        {
            "id": "GHOUL",
            "name": "廢土屍鬼",
            "description": "經歷過核戰的老居民，擁有豐富的人生經驗和黑色幽默",
            "personality": "睿智、經驗豐富、諷刺",
            "sample_quote": "孩子，我見過戰前的世界，這些卡片比你想的更有道理..."
        }
    ]

    return {
        "total_voices": len(voices),
        "voices": voices,
        "usage_tip": "每個角色會根據自己的經歷和性格來解讀同一張卡牌，提供多元化的觀點。"
    }

@app.get("/health", tags=["🔧 系統狀態"])
async def health_check():
    """
    🔧 系統健康檢查

    檢查API系統的運行狀態，確保所有功能正常運作，包含：
    - 資料庫連接狀態
    - 卡牌資料完整性
    - 系統效能指標
    """
    try:
        # 測試資料庫連接 - 嘗試獲取一張卡牌
        test_result = await card_repository.get_all_cards(page=1, per_page=1)
        database_status = "connected"
        total_cards = test_result.get('total', 0)
        database_message = f"✅ Supabase 連接正常，共 {total_cards} 張卡牌可用"

        # 測試牌陣模板
        spreads = await spread_repository.get_all_spreads()
        total_spreads = len(spreads)

    except Exception as e:
        database_status = "disconnected"
        total_cards = 0
        total_spreads = 0
        database_message = f"❌ 資料庫連接失敗: {str(e)}"
        logger.error(f"健康檢查失敗: {e}")

    return {
        "status": "healthy" if database_status == "connected" else "degraded",
        "message": "☢️ Vault-Tec 塔羅系統狀態報告",
        "version": "3.0.0",
        "vault_status": "operational",
        "radiation_levels": "within acceptable parameters",
        "database_connection": database_status,
        "database_message": database_message,
        "total_cards_available": total_cards,
        "total_spreads_available": total_spreads,
        "features": {
            "card_search": True,
            "random_draw": True,
            "spread_reading": True,
            "character_voices": True
        }
    }

# === 啟動指令 ===
if __name__ == "__main__":
    uvicorn.run(
        "swagger_demo:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )