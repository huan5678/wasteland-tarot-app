"""
Music API endpoints
音樂系統 API 端點 - Pattern/Preset CRUD, 公開歌曲查詢, AI 生成節奏
"""

import logging
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.core.supabase import get_supabase_client
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.music import (
    PresetCreate,
    PresetUpdate,
    PresetResponse,
    PublicPresetResponse,
    PublicPresetsResponse,
    BatchGetPatternsRequest,
    BatchGetPatternsResponse,
    AIGenerateRhythmRequest,
    AIGenerateRhythmResponse,
    QuotaResponse,
    QuotaExceededResponse,
    Pattern,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Task 2.1: Pattern/Preset CRUD API 端點
# ============================================

@router.post(
    "/presets",
    response_model=PresetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="儲存 Preset",
    description="""
    儲存使用者創作的節奏 Preset（支援公開/私密選項）

    邏輯:
    - 驗證 JWT Token，提取 user_id
    - 插入 user_rhythm_presets 表
    - 支援 is_public 參數（公開分享）
    - 回傳完整 Preset 資訊

    認證: Required (Bearer token)
    """,
)
async def create_preset(
    data: PresetCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> PresetResponse:
    """儲存 Preset (Task 2.1)"""
    user_id = current_user.id

    try:
        # 插入 Preset
        response = supabase.table("user_rhythm_presets").insert({
            "user_id": user_id,
            "name": data.name,
            "description": data.description,
            "pattern": data.pattern.model_dump(),
            "is_public": data.is_public,
            "is_system_preset": False,
        }).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create preset"
            )

        preset_data = response.data[0]
        return PresetResponse(
            id=preset_data["id"],
            name=preset_data["name"],
            description=preset_data.get("description"),
            pattern=Pattern(**preset_data["pattern"]),
            is_public=preset_data["is_public"],
            is_system_preset=preset_data["is_system_preset"],
            user_id=preset_data["user_id"],
            created_at=preset_data["created_at"],
            updated_at=preset_data["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating preset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create preset"
        )


@router.get(
    "/presets",
    response_model=List[PresetResponse],
    summary="獲取使用者所有 Presets",
    description="""
    獲取使用者所有 Presets（含系統預設）

    邏輯:
    - 查詢 user_rhythm_presets 表
    - 包含使用者自訂 Presets (user_id = current_user.id)
    - 包含系統預設 Presets (is_system_preset = true)
    - 按建立時間降序排序

    認證: Required (Bearer token)
    """,
)
async def get_user_presets(
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> List[PresetResponse]:
    """獲取使用者所有 Presets (Task 2.1)"""
    user_id = current_user.id

    try:
        # 查詢使用者 Presets + 系統預設
        response = supabase.table("user_rhythm_presets")\
            .select("*")\
            .or_(f"user_id.eq.{user_id},is_system_preset.eq.true")\
            .order("created_at", desc=True)\
            .execute()

        presets = []
        for preset_data in response.data:
            presets.append(PresetResponse(
                id=preset_data["id"],
                name=preset_data["name"],
                description=preset_data.get("description"),
                pattern=Pattern(**preset_data["pattern"]),
                is_public=preset_data["is_public"],
                is_system_preset=preset_data["is_system_preset"],
                user_id=preset_data.get("user_id"),
                created_at=preset_data["created_at"],
                updated_at=preset_data["updated_at"],
            ))

        return presets

    except Exception as e:
        logger.error(f"Error fetching user presets: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch presets"
        )


@router.put(
    "/presets/{preset_id}",
    response_model=PresetResponse,
    summary="更新 Preset",
    description="""
    更新 Preset（支援變更 isPublic）

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - 禁止修改系統預設 (is_system_preset = true)
    - 更新 name, description, pattern, is_public
    - 回傳更新後的 Preset

    認證: Required (Bearer token)
    """,
)
async def update_preset(
    preset_id: str,
    data: PresetUpdate,
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> PresetResponse:
    """更新 Preset (Task 2.1)"""
    user_id = current_user.id

    try:
        # 檢查 Preset 是否存在且擁有
        check_response = supabase.table("user_rhythm_presets")\
            .select("*")\
            .eq("id", preset_id)\
            .execute()

        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preset not found"
            )

        preset = check_response.data[0]

        # 禁止修改系統預設
        if preset["is_system_preset"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify system preset"
            )

        # 驗證擁有權
        if preset["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this preset"
            )

        # 構建更新資料
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.description is not None:
            update_data["description"] = data.description
        if data.pattern is not None:
            update_data["pattern"] = data.pattern.model_dump()
        if data.is_public is not None:
            update_data["is_public"] = data.is_public

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        # 更新 Preset
        response = supabase.table("user_rhythm_presets")\
            .update(update_data)\
            .eq("id", preset_id)\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update preset"
            )

        preset_data = response.data[0]
        return PresetResponse(
            id=preset_data["id"],
            name=preset_data["name"],
            description=preset_data.get("description"),
            pattern=Pattern(**preset_data["pattern"]),
            is_public=preset_data["is_public"],
            is_system_preset=preset_data["is_system_preset"],
            user_id=preset_data["user_id"],
            created_at=preset_data["created_at"],
            updated_at=preset_data["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preset"
        )


@router.delete(
    "/presets/{preset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="刪除 Preset",
    description="""
    刪除 Preset

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - 禁止刪除系統預設 (is_system_preset = true)
    - 刪除 Preset

    認證: Required (Bearer token)
    """,
)
async def delete_preset(
    preset_id: str,
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> None:
    """刪除 Preset (Task 2.1)"""
    user_id = current_user.id
    try:
        # 檢查 Preset 是否存在且擁有
        check_response = supabase.table("user_rhythm_presets")\
            .select("*")\
            .eq("id", preset_id)\
            .execute()

        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preset not found"
            )

        preset = check_response.data[0]

        # 禁止刪除系統預設
        if preset["is_system_preset"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete system preset"
            )

        # 驗證擁有權
        if preset["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this preset"
            )

        # 刪除 Preset
        supabase.table("user_rhythm_presets")\
            .delete()\
            .eq("id", preset_id)\
            .execute()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting preset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete preset"
        )


# ============================================
# Task 2.2: 公開歌曲查詢 API（訪客可存取）
# ============================================

@router.get(
    "/presets/public",
    response_model=PublicPresetsResponse,
    summary="獲取公開歌曲列表",
    description="""
    獲取公開歌曲列表（訪客可存取）

    邏輯:
    - 查詢條件：is_system_preset = true OR is_public = true
    - 支援分頁：page (default: 1), limit (default: 20, max: 100)
    - 支援排序：created_at_desc | created_at_asc | name_asc | name_desc
    - 回傳 systemPresets 和 publicPresets 分開的陣列
    - 包含創作者名稱（JOIN auth.users）

    認證: Optional (訪客可存取)
    """,
)
async def get_public_presets(
    page: int = Query(1, ge=1, description="頁數（從 1 開始）"),
    limit: int = Query(20, ge=1, le=100, description="每頁數量（最大 100）"),
    sort: str = Query("created_at_desc", description="排序方式：created_at_desc | created_at_asc | name_asc | name_desc"),
    supabase: Client = Depends(get_supabase_client),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> PublicPresetsResponse:
    """獲取公開歌曲列表 (Task 2.2)"""
    try:
        # 查詢系統預設歌曲（不分頁）
        system_response = supabase.table("user_rhythm_presets")\
            .select("*")\
            .eq("is_system_preset", True)\
            .order("created_at", desc=False)\
            .execute()

        system_presets = []
        for preset_data in system_response.data:
            system_presets.append(PresetResponse(
                id=preset_data["id"],
                name=preset_data["name"],
                description=preset_data.get("description"),
                pattern=Pattern(**preset_data["pattern"]),
                is_public=preset_data["is_public"],
                is_system_preset=preset_data["is_system_preset"],
                user_id=preset_data.get("user_id"),
                created_at=preset_data["created_at"],
                updated_at=preset_data["updated_at"],
            ))

        # 解析排序參數
        sort_column = "created_at"
        sort_desc = True
        if sort == "created_at_asc":
            sort_column = "created_at"
            sort_desc = False
        elif sort == "name_asc":
            sort_column = "name"
            sort_desc = False
        elif sort == "name_desc":
            sort_column = "name"
            sort_desc = True

        # 查詢公開使用者創作（分頁）
        offset = (page - 1) * limit

        # 先查詢總數
        count_response = supabase.table("user_rhythm_presets")\
            .select("id", count="exact")\
            .eq("is_public", True)\
            .eq("is_system_preset", False)\
            .execute()

        total = count_response.count or 0

        # 查詢公開歌曲
        public_query = supabase.table("user_rhythm_presets")\
            .select("*")\
            .eq("is_public", True)\
            .eq("is_system_preset", False)\
            .order(sort_column, desc=sort_desc)\
            .range(offset, offset + limit - 1)

        public_response = public_query.execute()

        # 獲取創作者資訊（批次查詢）
        user_ids = [p["user_id"] for p in public_response.data if p.get("user_id")]
        users_map = {}

        if user_ids:
            # 使用 auth.users 查詢（需要 service role key）
            # 注意：Supabase Python SDK 不直接支援 auth.users 查詢
            # 這裡我們簡化處理，從 raw_user_meta_data 中獲取
            for user_id in set(user_ids):
                try:
                    user_response = supabase.auth.admin.get_user_by_id(user_id)
                    if user_response.user:
                        users_map[user_id] = {
                            "email": user_response.user.email,
                            "name": user_response.user.user_metadata.get("username") or user_response.user.email
                        }
                except Exception as e:
                    logger.warning(f"Failed to fetch user {user_id}: {str(e)}")
                    users_map[user_id] = {"email": None, "name": "Unknown User"}

        public_presets = []
        for preset_data in public_response.data:
            user_id = preset_data.get("user_id")
            creator_info = users_map.get(user_id, {"email": None, "name": "Unknown User"})

            public_presets.append(PublicPresetResponse(
                id=preset_data["id"],
                name=preset_data["name"],
                description=preset_data.get("description"),
                pattern=Pattern(**preset_data["pattern"]),
                is_public=preset_data["is_public"],
                is_system_preset=preset_data["is_system_preset"],
                user_id=user_id,
                created_at=preset_data["created_at"],
                updated_at=preset_data["updated_at"],
                creator_name=creator_info["name"],
                creator_email=creator_info["email"],
            ))

        # 計算分頁資訊
        total_pages = (total + limit - 1) // limit

        return PublicPresetsResponse(
            system_presets=system_presets,
            public_presets=public_presets,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages,
            }
        )

    except Exception as e:
        logger.error(f"Error fetching public presets: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch public presets"
        )


# ============================================
# Task 2.3: 批次獲取 Pattern 詳情 API
# ============================================

@router.post(
    "/presets/batch",
    response_model=BatchGetPatternsResponse,
    summary="批次獲取 Pattern 詳情",
    description="""
    批次獲取多個 Pattern 的詳細資訊

    邏輯:
    - Request Body: { patternIds: string[] }
    - Response: { patterns: Pattern[], invalidIds: string[] }
    - 驗證所有 patternId 存在，過濾無效 ID
    - 支援訪客存取（僅回傳公開歌曲）

    認證: Optional (訪客可存取，僅回傳公開歌曲)
    """,
)
async def batch_get_patterns(
    request: BatchGetPatternsRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> BatchGetPatternsResponse:
    """批次獲取 Pattern 詳情 (Task 2.3)"""
    try:
        pattern_ids = request.pattern_ids

        # 查詢 Patterns
        query = supabase.table("user_rhythm_presets")\
            .select("*")\
            .in_("id", pattern_ids)

        # 訪客：僅查詢公開歌曲
        if not current_user:
            query = query.or_("is_system_preset.eq.true,is_public.eq.true")

        response = query.execute()

        # 構建結果
        patterns = []
        found_ids = set()

        for preset_data in response.data:
            found_ids.add(preset_data["id"])
            patterns.append(PresetResponse(
                id=preset_data["id"],
                name=preset_data["name"],
                description=preset_data.get("description"),
                pattern=Pattern(**preset_data["pattern"]),
                is_public=preset_data["is_public"],
                is_system_preset=preset_data["is_system_preset"],
                user_id=preset_data.get("user_id"),
                created_at=preset_data["created_at"],
                updated_at=preset_data["updated_at"],
            ))

        # 找出無效 ID
        invalid_ids = [pid for pid in pattern_ids if pid not in found_ids]

        return BatchGetPatternsResponse(
            patterns=patterns,
            invalid_ids=invalid_ids,
        )

    except Exception as e:
        logger.error(f"Error batch fetching patterns: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to batch fetch patterns"
        )


# ============================================
# Task 2.7: AI 節奏生成 API
# ============================================

@router.post(
    "/generate-rhythm",
    response_model=AIGenerateRhythmResponse,
    responses={
        400: {"model": QuotaExceededResponse, "description": "Daily quota exceeded"}
    },
    summary="AI 生成節奏",
    description="""
    AI 生成節奏 Pattern（每日 20 次配額）

    邏輯:
    1. 檢查 user_ai_quotas 配額（每日 20 次）
    2. 呼叫 AI Provider（OpenAI/Gemini）生成 Pattern
    3. 更新配額使用量（rhythm_quota_used += 1）
    4. Response: { pattern, quotaRemaining }
    5. 配額用盡時回傳 400 錯誤

    認證: Required (Bearer token)
    """,
)
async def generate_rhythm(
    request: AIGenerateRhythmRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> AIGenerateRhythmResponse:
    """AI 生成節奏 (Task 2.7)"""
    user_id = current_user.id

    try:
        # 查詢配額
        quota_response = supabase.table("user_ai_quotas")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()

        # 若無記錄則建立
        if not quota_response.data:
            today = datetime.utcnow().date()
            tomorrow = today + timedelta(days=1)
            reset_at = datetime.combine(tomorrow, datetime.min.time())

            supabase.table("user_ai_quotas").insert({
                "user_id": user_id,
                "rhythm_quota_used": 0,
                "rhythm_quota_limit": 20,
                "quota_reset_at": reset_at.isoformat(),
            }).execute()

            quota_data = {
                "rhythm_quota_used": 0,
                "rhythm_quota_limit": 20,
                "quota_reset_at": reset_at.isoformat(),
            }
        else:
            quota_data = quota_response.data[0]

        # 檢查配額
        quota_used = quota_data["rhythm_quota_used"]
        quota_limit = quota_data["rhythm_quota_limit"]

        if quota_used >= quota_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Daily quota exceeded",
                    "message": f"今日 AI 生成配額已用完（{quota_used}/{quota_limit}），明日重置",
                    "quota_limit": quota_limit,
                    "quota_used": quota_used,
                    "reset_at": quota_data["quota_reset_at"],
                }
            )

        # TODO: 呼叫 AI Provider 生成 Pattern
        # 目前使用 mock 資料
        generated_pattern = Pattern(
            kick=[True, False, False, False, True, False, False, False, True, False, False, False, True, False, False, False],
            snare=[False, False, False, False, True, False, False, False, False, False, False, False, True, False, False, False],
            hihat=[False, False, True, False, False, False, True, False, False, False, True, False, False, False, True, False],
            openhat=[False, False, False, False, False, False, False, False, False, False, False, False, False, False, False, True],
            clap=[False, False, False, False, True, False, False, False, False, False, False, False, True, False, False, False],
        )

        # 更新配額
        supabase.table("user_ai_quotas")\
            .update({"rhythm_quota_used": quota_used + 1})\
            .eq("user_id", user_id)\
            .execute()

        quota_remaining = quota_limit - quota_used - 1

        return AIGenerateRhythmResponse(
            pattern=generated_pattern,
            quota_remaining=quota_remaining,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating rhythm: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate rhythm"
        )


# ============================================
# Task 2.8: 配額查詢 API
# ============================================

@router.get(
    "/quota",
    response_model=QuotaResponse,
    summary="查詢 AI 生成配額",
    description="""
    查詢 AI 生成配額狀態

    邏輯:
    - 查詢 user_ai_quotas 表
    - Response: { quotaLimit: 20, quotaUsed, quotaRemaining, resetAt }
    - 若使用者無記錄則自動建立（quotaUsed = 0）

    認證: Required (Bearer token)
    """,
)
async def get_quota(
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> QuotaResponse:
    """查詢 AI 生成配額 (Task 2.8)"""
    user_id = current_user.id

    try:
        # 查詢配額
        quota_response = supabase.table("user_ai_quotas")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()

        # 若無記錄則建立
        if not quota_response.data:
            today = datetime.utcnow().date()
            tomorrow = today + timedelta(days=1)
            reset_at = datetime.combine(tomorrow, datetime.min.time())

            supabase.table("user_ai_quotas").insert({
                "user_id": user_id,
                "rhythm_quota_used": 0,
                "rhythm_quota_limit": 20,
                "quota_reset_at": reset_at.isoformat(),
            }).execute()

            return QuotaResponse(
                quota_limit=20,
                quota_used=0,
                quota_remaining=20,
                reset_at=reset_at,
            )

        quota_data = quota_response.data[0]
        quota_used = quota_data["rhythm_quota_used"]
        quota_limit = quota_data["rhythm_quota_limit"]

        return QuotaResponse(
            quota_limit=quota_limit,
            quota_used=quota_used,
            quota_remaining=quota_limit - quota_used,
            reset_at=datetime.fromisoformat(quota_data["quota_reset_at"]),
        )

    except Exception as e:
        logger.error(f"Error fetching quota: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch quota"
        )
