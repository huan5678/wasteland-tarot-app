"""
Level API Endpoints (Task 3.2)
/api/v1/levels/* - Level information, leaderboard, and progression
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.services.level_service import LevelService


router = APIRouter(prefix="/levels", tags=["⬆️ Level System"])


@router.get("/me")
async def get_my_level_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得我的等級資訊
    
    Returns:
        - level: 當前等級
        - title: 繁中稱號
        - title_en: 英文稱號
        - icon: PixelIcon 圖示名稱
        - total_karma: 總 karma
        - karma_to_next: 到下一級所需 karma
        - progress_percentage: 本級進度百分比
        - privileges: 特權 JSONB
    """
    level_service = LevelService(db)
    level_info = await level_service.get_user_level_info(current_user.id)
    
    return {
        "success": True,
        "data": level_info
    }


@router.get("/{user_id}")
async def get_user_level_info(
    user_id: UUID = Path(..., description="使用者 ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    取得指定使用者的等級資訊（公開）
    
    用於排行榜、使用者資料頁等公開展示
    """
    level_service = LevelService(db)
    
    try:
        level_info = await level_service.get_user_level_info(user_id)
        return {
            "success": True,
            "data": {
                "level": level_info["level"],
                "title": level_info["title"],
                "title_en": level_info["title_en"],
                "icon": level_info["icon"],
                "total_karma": level_info["total_karma"]
                # 不回傳 privileges，保持隱私
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"User not found: {str(e)}")


@router.get("/me/rank")
async def get_my_rank(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得我的全服排名
    
    Returns:
        - rank: 排名（1-indexed）
        - total_users: 總使用者數（有 karma 記錄的）
    """
    level_service = LevelService(db)
    rank = await level_service.get_user_rank(current_user.id)
    
    if rank is None:
        return {
            "success": False,
            "message": "User has no karma record yet"
        }
    
    return {
        "success": True,
        "data": {
            "rank": rank,
            "user_id": str(current_user.id)
        }
    }


@router.get("/me/next-milestone")
async def get_my_next_milestone(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得我的下一個里程碑等級資訊
    
    里程碑為每 10 級（10, 20, 30, ...）
    
    Returns:
        - milestone_level: 里程碑等級
        - title: 里程碑稱號
        - icon: 圖示
        - required_karma: 所需總 karma
        - karma_needed: 還需多少 karma
        - special_rewards: 特殊獎勵
    """
    level_service = LevelService(db)
    milestone = await level_service.get_next_milestone(current_user.id)
    
    if milestone is None:
        return {
            "success": False,
            "message": "No more milestones (reached level 100)"
        }
    
    return {
        "success": True,
        "data": milestone
    }


@router.get("/leaderboard")
async def get_leaderboard(
    page: int = Query(1, ge=1, description="頁碼"),
    limit: int = Query(10, ge=1, le=100, description="每頁數量"),
    db: AsyncSession = Depends(get_db)
):
    """
    全服排行榜（按 total_karma DESC）
    
    Args:
        page: 頁碼（從 1 開始）
        limit: 每頁數量（1-100）
    
    Returns:
        - leaderboard: 排行榜列表
        - pagination: 分頁資訊
    """
    level_service = LevelService(db)
    offset = (page - 1) * limit
    
    leaderboard = await level_service.get_leaderboard(limit=limit, offset=offset)
    
    # Get total count for pagination
    from sqlalchemy import select, func, text
    count_result = await db.execute(
        text("SELECT COUNT(*) FROM user_karma")
    )
    total = count_result.scalar() or 0
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "success": True,
        "data": {
            "leaderboard": leaderboard,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages
            }
        }
    }


@router.get("/details/{level}")
async def get_level_details(
    level: int = Path(..., ge=1, le=100, description="等級 (1-100)"),
    db: AsyncSession = Depends(get_db)
):
    """
    查詢指定等級的詳細資訊
    
    用於等級預覽、目標設定等功能
    
    Returns:
        - level: 等級數字
        - required_karma: 達到此等級所需 karma
        - title_zh_tw / title_en: 稱號
        - icon_name: 圖示
        - privileges: 特權內容
    """
    level_service = LevelService(db)
    
    try:
        level_details = await level_service.get_level_details(level)
        return {
            "success": True,
            "data": level_details
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Level not found: {str(e)}")


@router.get("/progress")
async def get_level_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得詳細的等級進度資訊
    
    Returns:
        - current_level: 當前等級
        - current_karma: 當前總 karma
        - level_start_karma: 本級起始 karma
        - level_end_karma: 下一級起始 karma
        - karma_in_level: 本級已獲得 karma
        - karma_to_next: 到下一級還需 karma
        - progress_percentage: 本級進度百分比
    """
    level_service = LevelService(db)
    
    # Get user's current karma
    from app.services.unified_karma_service import UnifiedKarmaService
    karma_service = UnifiedKarmaService(db)
    user_karma = await karma_service.get_user_karma(current_user.id)
    
    if not user_karma:
        return {
            "success": False,
            "message": "User has no karma record"
        }
    
    progress = LevelService.calculate_level_progress(user_karma.total_karma)
    
    return {
        "success": True,
        "data": progress
    }
