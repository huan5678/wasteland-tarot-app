"""
Character Voice System Schemas
角色聲音系統的 Pydantic Schemas - 用於 API 請求和回應驗證
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ============================================================================
# Character Schemas
# ============================================================================

class CharacterBase(BaseModel):
    """角色基礎 Schema"""
    key: str = Field(..., min_length=1, max_length=50, description="角色唯一識別碼")
    name: str = Field(..., min_length=1, max_length=100, description="角色顯示名稱")
    description: Optional[str] = Field(None, description="角色描述")
    personality: Optional[str] = Field(None, max_length=200, description="角色性格特點")
    voice_style: Optional[str] = Field(None, description="角色說話風格")
    theme_color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$', description="主題顏色 (HEX)")
    icon_name: Optional[str] = Field(None, max_length=50, description="圖示名稱")
    is_active: bool = Field(True, description="是否啟用")
    sort_order: int = Field(0, ge=0, description="排序順序")


class CharacterCreate(CharacterBase):
    """建立角色的 Schema"""
    pass


class CharacterUpdate(BaseModel):
    """更新角色的 Schema（所有欄位可選）"""
    key: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    personality: Optional[str] = Field(None, max_length=200)
    voice_style: Optional[str] = None
    theme_color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon_name: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)


class CharacterResponse(CharacterBase):
    """角色回應 Schema"""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CharacterWithInterpretationsCount(CharacterResponse):
    """帶解讀數量的角色回應"""
    interpretations_count: int = Field(0, description="解讀數量")


# ============================================================================
# Faction Schemas
# ============================================================================

class FactionBase(BaseModel):
    """陣營基礎 Schema"""
    key: str = Field(..., min_length=1, max_length=50, description="陣營唯一識別碼")
    name: str = Field(..., min_length=1, max_length=100, description="陣營顯示名稱")
    description: Optional[str] = Field(None, description="陣營描述")
    alignment: Optional[str] = Field(None, max_length=20, description="陣營傾向")
    icon_name: Optional[str] = Field(None, max_length=50, description="圖示名稱")
    theme_color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$', description="主題顏色 (HEX)")
    is_active: bool = Field(True, description="是否啟用")
    sort_order: int = Field(0, ge=0, description="排序順序")


class FactionCreate(FactionBase):
    """建立陣營的 Schema"""
    pass


class FactionUpdate(BaseModel):
    """更新陣營的 Schema（所有欄位可選）"""
    key: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    alignment: Optional[str] = Field(None, max_length=20)
    icon_name: Optional[str] = Field(None, max_length=50)
    theme_color: Optional[str] = Field(None, max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$')
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)


class FactionResponse(FactionBase):
    """陣營回應 Schema"""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# FactionCharacter Schemas (陣營-角色關聯)
# ============================================================================

class FactionCharacterBase(BaseModel):
    """陣營-角色關聯基礎 Schema"""
    faction_id: UUID = Field(..., description="陣營 ID")
    character_id: UUID = Field(..., description="角色 ID")
    priority: int = Field(0, ge=0, description="優先順序（數字越小優先級越高）")


class FactionCharacterCreate(FactionCharacterBase):
    """建立陣營-角色關聯的 Schema"""
    pass


class FactionCharacterUpdate(BaseModel):
    """更新陣營-角色關聯的 Schema"""
    priority: Optional[int] = Field(None, ge=0)


class FactionCharacterResponse(FactionCharacterBase):
    """陣營-角色關聯回應 Schema"""
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FactionWithCharacters(FactionResponse):
    """帶角色列表的陣營回應"""
    characters: List[CharacterResponse] = Field(default_factory=list, description="關聯的角色列表")


# ============================================================================
# CardInterpretation Schemas
# ============================================================================

class CardInterpretationBase(BaseModel):
    """卡牌解讀基礎 Schema"""
    card_id: UUID = Field(..., description="卡牌 ID")
    character_id: UUID = Field(..., description="角色 ID")
    interpretation_text: str = Field(..., min_length=1, description="解讀文字內容")
    is_active: bool = Field(True, description="是否啟用")


class CardInterpretationCreate(CardInterpretationBase):
    """建立卡牌解讀的 Schema"""
    pass


class CardInterpretationUpdate(BaseModel):
    """更新卡牌解讀的 Schema（所有欄位可選）"""
    interpretation_text: Optional[str] = Field(None, min_length=1)
    is_active: Optional[bool] = None


class CardInterpretationResponse(CardInterpretationBase):
    """卡牌解讀回應 Schema"""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CardInterpretationWithDetails(CardInterpretationResponse):
    """帶詳細資訊的卡牌解讀回應"""
    character_name: Optional[str] = Field(None, description="角色名稱")
    character_key: Optional[str] = Field(None, description="角色識別碼")
    card_name: Optional[str] = Field(None, description="卡牌名稱")


# ============================================================================
# Bulk Operations Schemas
# ============================================================================

class BulkInterpretationCreate(BaseModel):
    """批量建立解讀的 Schema"""
    card_id: UUID = Field(..., description="卡牌 ID")
    interpretations: List[dict] = Field(
        ...,
        description="解讀列表，格式：[{character_id: UUID, interpretation_text: str}, ...]"
    )


class BulkOperationResponse(BaseModel):
    """批量操作回應 Schema"""
    success_count: int = Field(0, description="成功數量")
    failed_count: int = Field(0, description="失敗數量")
    errors: List[str] = Field(default_factory=list, description="錯誤訊息列表")


# ============================================================================
# Query Schemas
# ============================================================================

class CharacterQuery(BaseModel):
    """角色查詢參數"""
    is_active: Optional[bool] = Field(None, description="篩選啟用狀態")
    search: Optional[str] = Field(None, description="搜尋角色名稱或描述")
    skip: int = Field(0, ge=0, description="跳過筆數")
    limit: int = Field(100, ge=1, le=1000, description="限制筆數")


class FactionQuery(BaseModel):
    """陣營查詢參數"""
    is_active: Optional[bool] = Field(None, description="篩選啟用狀態")
    search: Optional[str] = Field(None, description="搜尋陣營名稱或描述")
    skip: int = Field(0, ge=0, description="跳過筆數")
    limit: int = Field(100, ge=1, le=1000, description="限制筆數")


class InterpretationQuery(BaseModel):
    """解讀查詢參數"""
    card_id: Optional[UUID] = Field(None, description="篩選卡牌 ID")
    character_id: Optional[UUID] = Field(None, description="篩選角色 ID")
    is_active: Optional[bool] = Field(None, description="篩選啟用狀態")
    skip: int = Field(0, ge=0, description="跳過筆數")
    limit: int = Field(100, ge=1, le=1000, description="限制筆數")
