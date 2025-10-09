"""
廢土塔羅牌陣 API 端點
牌陣模板管理與推薦系統，提供完整的文件說明
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
import logging

from app.db.session import get_db
from app.models.reading_enhanced import SpreadTemplate as SpreadTemplateModel
from app.schemas.spreads import (
    SpreadTemplate,
    SpreadTemplateCreate,
    SpreadTemplateUpdate,
    SpreadSearchParams,
    SpreadListResponse,
    SpreadUsageStats,
    SpreadRecommendation,
    SpreadRecommendationRequest,
    PopularSpreadsResponse,
    SpreadCategoryStats,
    SpreadValidation,
    SpreadType,
    DifficultyLevel
)
from app.schemas.cards import KarmaAlignment, FactionAlignment
from app.core.exceptions import SpreadNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/",
    response_model=SpreadListResponse,
    summary="取得所有牌陣模板",
    description="""
    **瀏覽並篩選可用的牌陣模板**

    探索完整的廢土塔羅牌陣模板收藏：

    - **難度等級**：從新手友善到專家級排列
    - **卡牌數量**：單張卡牌到複雜的 15 張卡牌陣
    - **派系偏好**：不同廢土派系偏好的牌陣
    - **使用統計**：熱門與高評分牌陣
    - **搜尋與篩選**：依名稱、描述或標籤搜尋牌陣

    可用的牌陣類型：
    - **廢土單牌**：快速單卡指引
    - **避難科技牌陣**：經典 3 卡過去/現在/未來
    - **廢土生存**：5 卡生存指引
    - **鋼鐵兄弟會議**：7 卡綜合分析
    - **自訂牌陣**：使用者創建的排列

    適用於：
    - 選擇適當的占卜排列
    - 理解牌陣複雜度
    - 尋找主題牌陣
    - 探索新的占卜風格
    """,
    response_description="可用牌陣模板清單及元數據",
    responses={
        200: {"description": "成功取得牌陣模板"},
        422: {"description": "無效的搜尋參數"}
    }
)
async def get_spreads(
    page: int = Query(default=1, ge=1, description="頁碼"),
    page_size: int = Query(default=20, ge=1, le=100, description="每頁牌陣數量"),
    spread_type: Optional[SpreadType] = Query(None, description="依牌陣類型篩選"),
    difficulty_level: Optional[DifficultyLevel] = Query(None, description="依難度篩選"),
    min_cards: Optional[int] = Query(None, ge=1, le=15, description="最小卡牌數量"),
    max_cards: Optional[int] = Query(None, ge=1, le=15, description="最大卡牌數量"),
    faction_preference: Optional[FactionAlignment] = Query(None, description="派系偏好"),
    is_premium: Optional[bool] = Query(None, description="篩選進階牌陣"),
    search: Optional[str] = Query(None, description="在名稱與描述中搜尋"),
    tags: Optional[str] = Query(None, description="逗號分隔的標籤列表"),
    sort_by: str = Query(default="usage_count", description="排序欄位"),
    sort_order: str = Query(default="desc", regex="^(asc|desc)$", description="排序順序"),
    include_inactive: bool = Query(default=False, description="包含停用的牌陣"),
    db: AsyncSession = Depends(get_db)
) -> SpreadListResponse:
    """取得牌陣模板清單並支援篩選與搜尋。"""
    try:
        # Build base query
        query = select(SpreadTemplateModel)
        count_query = select(func.count(SpreadTemplateModel.id))

        # Base conditions
        conditions = []
        if not include_inactive:
            conditions.append(SpreadTemplateModel.is_active == True)

        # Apply filters
        if spread_type:
            conditions.append(SpreadTemplateModel.spread_type == spread_type.value)

        if difficulty_level:
            conditions.append(SpreadTemplateModel.difficulty_level == difficulty_level.value)

        if min_cards:
            conditions.append(SpreadTemplateModel.card_count >= min_cards)

        if max_cards:
            conditions.append(SpreadTemplateModel.card_count <= max_cards)

        if faction_preference:
            conditions.append(SpreadTemplateModel.faction_preference == faction_preference.value)

        if is_premium is not None:
            conditions.append(SpreadTemplateModel.is_premium == is_premium)

        if search:
            search_condition = or_(
                SpreadTemplateModel.display_name.ilike(f"%{search}%"),
                SpreadTemplateModel.description.ilike(f"%{search}%")
            )
            conditions.append(search_condition)

        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Get total count
        total_result = await db.execute(count_query)
        total_count = total_result.scalar()

        # Apply sorting
        sort_column = getattr(SpreadTemplateModel, sort_by, SpreadTemplateModel.usage_count)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        spreads_data = result.scalars().all()

        # Convert to response models
        spreads = []
        for spread in spreads_data:
            spread_dict = spread.to_dict()
            spreads.append(SpreadTemplate(**spread_dict))

        has_more = (offset + len(spreads)) < total_count

        return SpreadListResponse(
            spreads=spreads,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_more=has_more
        )

    except Exception as e:
        logger.error(f"Error retrieving spreads: {str(e)}")
        raise HTTPException(status_code=500, detail="取得牌陣失敗")


@router.get(
    "/{spread_id}",
    response_model=SpreadTemplate,
    summary="取得牌陣模板詳細資訊",
    description="""
    **取得特定牌陣模板的詳細資訊**

    取得完整的牌陣模板資訊：

    - **牌位定義**：每個卡牌位置的詳細意義
    - **視覺佈局**：卡牌擺放的座標
    - **解讀指南**：占卜此牌陣的技巧
    - **使用統計**：熱門度與評分數據
    - **避難所起源**：Fallout 背景故事與派系連結
    - **音效/視覺**：主題元素與環境設定

    適用於：
    - 牌陣選擇介面
    - 占卜準備
    - 排列視覺化
    - 理解牌陣機制
    """,
    response_description="完整的牌陣模板及所有細節",
    responses={
        200: {"description": "成功取得牌陣模板"},
        404: {"description": "找不到牌陣模板"}
    }
)
async def get_spread(
    spread_id: str = Path(..., description="牌陣模板 ID"),
    include_stats: bool = Query(default=True, description="包含使用統計"),
    db: AsyncSession = Depends(get_db)
) -> SpreadTemplate:
    """取得特定牌陣模板的詳細資訊。"""
    try:
        query = select(SpreadTemplateModel).where(SpreadTemplateModel.id == spread_id)
        result = await db.execute(query)
        spread = result.scalar_one_or_none()

        if not spread:
            raise SpreadNotFoundError(spread_id)

        # Convert to response model
        spread_dict = spread.to_dict()
        return SpreadTemplate(**spread_dict)

    except SpreadNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error retrieving spread {spread_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="取得牌陣失敗")


@router.post(
    "/recommendations",
    response_model=List[SpreadRecommendation],
    summary="取得牌陣推薦",
    description="""
    **取得個人化的牌陣推薦**

    智慧推薦系統考量因素：

    - **經驗等級**：將牌陣配對到使用者技能等級
    - **可用時間**：建議符合時間限制的牌陣
    - **業力對齊**：推薦業力相容的牌陣
    - **派系偏好**：考量派系相關的牌陣
    - **問題類型**：將牌陣配對到詢問風格
    - **占卜歷史**：避免最近使用過的牌陣

    推薦演算法因素：
    - 使用者熟練度與舒適度
    - 牌陣複雜度與學習曲線
    - 主題適當性
    - 社群評分與回饋
    - 個人使用模式

    適用於：
    - 新使用者引導
    - 自適應占卜介面
    - 技能進階指引
    - 個人化體驗
    """,
    response_description="個人化牌陣推薦及匹配分數",
    responses={
        200: {"description": "成功產生推薦"},
        422: {"description": "無效的推薦參數"}
    }
)
async def get_spread_recommendations(
    recommendation_request: SpreadRecommendationRequest = Body(
        ...,
        example={
            "user_experience_level": "beginner",
            "karma_alignment": "good",
            "faction_preference": "vault_dweller",
            "available_time": 15,
            "question_type": "career",
            "count": 3
        }
    ),
    db: AsyncSession = Depends(get_db)
) -> List[SpreadRecommendation]:
    """依據使用者偏好取得個人化牌陣推薦。"""
    try:
        # Get available spreads
        query = select(SpreadTemplateModel).where(SpreadTemplateModel.is_active == True)
        result = await db.execute(query)
        available_spreads = result.scalars().all()

        recommendations = []

        for spread in available_spreads:
            match_score = 0.0
            reasons = []

            # Experience level matching
            if recommendation_request.user_experience_level:
                user_level = recommendation_request.user_experience_level.value
                spread_level = spread.difficulty_level

                if user_level == spread_level:
                    match_score += 0.4
                    reasons.append(f"Perfect difficulty match for {user_level} level")
                elif (user_level == "beginner" and spread_level in ["beginner", "intermediate"]) or \
                     (user_level == "intermediate" and spread_level != "expert"):
                    match_score += 0.2
                    reasons.append("Appropriate difficulty level")

            # Karma alignment matching
            if recommendation_request.karma_alignment:
                if spread.is_suitable_for_karma(recommendation_request.karma_alignment):
                    match_score += 0.2
                    reasons.append("Compatible with your karma alignment")

            # Faction preference matching
            if recommendation_request.faction_preference and spread.faction_preference:
                if spread.faction_preference == recommendation_request.faction_preference.value:
                    match_score += 0.3
                    reasons.append(f"Preferred by {recommendation_request.faction_preference.value}")

            # Time constraint matching
            if recommendation_request.available_time:
                estimated_time = spread.card_count * 2 + 5  # Rough estimate
                if estimated_time <= recommendation_request.available_time:
                    match_score += 0.1
                    reasons.append("Fits within your available time")

            # Usage and rating bonus
            if spread.average_rating > 4.0:
                match_score += 0.1
                reasons.append("Highly rated by community")

            if spread.usage_count > 100:
                match_score += 0.05
                reasons.append("Popular choice")

            # Avoid recently used (if provided)
            if recommendation_request.previous_spreads:
                if spread.id not in recommendation_request.previous_spreads:
                    match_score += 0.05
                    reasons.append("New spread to explore")
                else:
                    match_score *= 0.5  # Reduce score for recently used

            # Only include spreads with reasonable match scores
            if match_score >= 0.3:
                recommendations.append(SpreadRecommendation(
                    spread=SpreadTemplate(**spread.to_dict()),
                    match_score=min(match_score, 1.0),
                    reasons=reasons,
                    estimated_duration=spread.card_count * 2 + 5,
                    difficulty_match=(
                        recommendation_request.user_experience_level and
                        spread.difficulty_level == recommendation_request.user_experience_level.value
                    )
                ))

        # Sort by match score and limit results
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:recommendation_request.count]

    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="產生推薦失敗")


@router.get(
    "/popular/overview",
    response_model=PopularSpreadsResponse,
    summary="取得熱門牌陣概覽",
    description="""
    **精選的熱門與知名牌陣收藏**

    探索多個分類的牌陣：

    - **最常使用**：依使用頻率的社群最愛
    - **最高評分**：依使用者滿意度的頂級牌陣
    - **最新**：最近新增的牌陣模板
    - **新手友善**：適合新使用者
    - **進階**：適合有經驗占卜者的複雜牌陣

    每個分類提供社群偏好的洞察，
    協助使用者發現符合需求的適當牌陣。

    適用於：
    - 首頁推薦
    - 探索介面
    - 熱門內容區塊
    - 技能導向導航
    """,
    response_description="精選的知名牌陣收藏"
)
async def get_popular_spreads(
    limit: int = Query(default=5, ge=1, le=20, description="每個分類的項目數"),
    db: AsyncSession = Depends(get_db)
) -> PopularSpreadsResponse:
    """取得精選的熱門與知名牌陣收藏。"""
    try:
        base_query = select(SpreadTemplateModel).where(SpreadTemplateModel.is_active == True)

        # Most used spreads
        most_used_query = base_query.order_by(desc(SpreadTemplateModel.usage_count)).limit(limit)
        most_used_result = await db.execute(most_used_query)
        most_used = [SpreadTemplate(**s.to_dict()) for s in most_used_result.scalars().all()]

        # Highest rated spreads
        highest_rated_query = base_query.order_by(desc(SpreadTemplateModel.average_rating)).limit(limit)
        highest_rated_result = await db.execute(highest_rated_query)
        highest_rated = [SpreadTemplate(**s.to_dict()) for s in highest_rated_result.scalars().all()]

        # Newest spreads
        newest_query = base_query.order_by(desc(SpreadTemplateModel.created_at)).limit(limit)
        newest_result = await db.execute(newest_query)
        newest = [SpreadTemplate(**s.to_dict()) for s in newest_result.scalars().all()]

        # Beginner-friendly spreads
        beginner_query = base_query.where(
            SpreadTemplateModel.difficulty_level == "beginner"
        ).order_by(desc(SpreadTemplateModel.average_rating)).limit(limit)
        beginner_result = await db.execute(beginner_query)
        recommended_for_beginners = [SpreadTemplate(**s.to_dict()) for s in beginner_result.scalars().all()]

        # Advanced spreads
        advanced_query = base_query.where(
            SpreadTemplateModel.difficulty_level.in_(["advanced", "expert"])
        ).order_by(desc(SpreadTemplateModel.average_rating)).limit(limit)
        advanced_result = await db.execute(advanced_query)
        advanced_spreads = [SpreadTemplate(**s.to_dict()) for s in advanced_result.scalars().all()]

        return PopularSpreadsResponse(
            most_used=most_used,
            highest_rated=highest_rated,
            newest=newest,
            recommended_for_beginners=recommended_for_beginners,
            advanced_spreads=advanced_spreads
        )

    except Exception as e:
        logger.error(f"Error retrieving popular spreads: {str(e)}")
        raise HTTPException(status_code=500, detail="取得熱門牌陣失敗")


@router.get(
    "/stats/overview",
    response_model=SpreadCategoryStats,
    summary="取得牌陣統計概覽",
    description="""
    **牌陣模板的綜合統計資訊**

    牌陣收藏的分析與洞察：

    - **難度分布**：依複雜度等級的細分
    - **卡牌數量分布**：熱門的牌陣規模
    - **派系偏好**：哪些派系偏好哪些牌陣
    - **使用指標**：整體活動與參與度
    - **評分分析**：社群滿意度指標
    - **熱門標籤**：流行的分類主題

    適用於：
    - 管理儀表板
    - 社群洞察
    - 內容規劃
    - 使用者行為分析
    """,
    response_description="牌陣模板的統計概覽"
)
async def get_spread_stats(
    db: AsyncSession = Depends(get_db)
) -> SpreadCategoryStats:
    """取得牌陣模板的綜合統計資訊。"""
    try:
        # Get all active spreads for analysis
        query = select(SpreadTemplateModel).where(SpreadTemplateModel.is_active == True)
        result = await db.execute(query)
        spreads = result.scalars().all()

        # Calculate statistics
        by_difficulty = {}
        by_card_count = {}
        by_faction = {}
        total_ratings = []
        all_tags = []

        for spread in spreads:
            # Difficulty distribution
            difficulty = spread.difficulty_level
            by_difficulty[difficulty] = by_difficulty.get(difficulty, 0) + 1

            # Card count distribution
            card_count_key = f"{spread.card_count} cards"
            by_card_count[card_count_key] = by_card_count.get(card_count_key, 0) + 1

            # Faction distribution
            if spread.faction_preference:
                faction = spread.faction_preference
                by_faction[faction] = by_faction.get(faction, 0) + 1

            # Ratings
            if spread.average_rating > 0:
                total_ratings.append(spread.average_rating)

            # Tags
            if spread.tags:
                all_tags.extend(spread.tags)

        # Calculate overall average rating
        overall_average = sum(total_ratings) / len(total_ratings) if total_ratings else 0.0

        # Most popular tags
        tag_counts = {}
        for tag in all_tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

        most_popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        most_popular_tags = [tag for tag, count in most_popular_tags]

        return SpreadCategoryStats(
            by_difficulty=by_difficulty,
            by_card_count=by_card_count,
            by_faction=by_faction,
            total_spreads=len(spreads),
            average_rating_overall=round(overall_average, 2),
            most_popular_tags=most_popular_tags
        )

    except Exception as e:
        logger.error(f"Error retrieving spread stats: {str(e)}")
        raise HTTPException(status_code=500, detail="取得牌陣統計失敗")


@router.post(
    "/validate",
    response_model=SpreadValidation,
    summary="驗證牌陣模板",
    description="""
    **驗證牌陣模板配置**

    牌陣模板的綜合驗證：

    - **牌位驗證**：確保所有牌位正確定義
    - **排列驗證**：檢查視覺位置與座標
    - **內容驗證**：確認描述與元數據
    - **邏輯驗證**：確保牌陣主題合理
    - **可用性驗證**：檢查使用者體驗問題

    回傳詳細的回饋：
    - 阻止使用的嚴重錯誤
    - 潛在問題的警告
    - 改進建議

    適用於：
    - 模板建立工具
    - 品質保證
    - 使用者生成內容
    - 模板最佳化
    """,
    response_description="驗證結果、錯誤與建議"
)
async def validate_spread(
    spread_template: SpreadTemplateCreate = Body(...),
    db: AsyncSession = Depends(get_db)
) -> SpreadValidation:
    """驗證牌陣模板配置。"""
    try:
        errors = []
        warnings = []
        suggestions = []

        # Validate basic requirements
        if not spread_template.name.strip():
            errors.append("Spread name cannot be empty")

        if not spread_template.display_name.strip():
            errors.append("Display name cannot be empty")

        if len(spread_template.description) < 10:
            errors.append("Description must be at least 10 characters")

        if spread_template.card_count < 1 or spread_template.card_count > 15:
            errors.append("Card count must be between 1 and 15")

        # Validate positions
        if len(spread_template.positions) != spread_template.card_count:
            errors.append(f"Number of positions ({len(spread_template.positions)}) must match card count ({spread_template.card_count})")

        position_numbers = [pos.number for pos in spread_template.positions]
        expected_numbers = list(range(1, spread_template.card_count + 1))
        if sorted(position_numbers) != expected_numbers:
            errors.append("Position numbers must be consecutive starting from 1")

        # Check for duplicate position names
        position_names = [pos.name for pos in spread_template.positions]
        if len(set(position_names)) != len(position_names):
            warnings.append("Duplicate position names detected")

        # Validate visual coordinates if provided
        positions_with_coords = [pos for pos in spread_template.positions if pos.x_coordinate is not None]
        if positions_with_coords and len(positions_with_coords) != len(spread_template.positions):
            warnings.append("Some positions missing visual coordinates")

        # Suggestions based on best practices
        if spread_template.card_count > 7 and spread_template.difficulty_level == DifficultyLevel.BEGINNER:
            suggestions.append("Consider marking spreads with 8+ cards as intermediate or advanced difficulty")

        if not spread_template.interpretation_guide:
            suggestions.append("Adding an interpretation guide would help users understand how to read this spread")

        if not spread_template.tags:
            suggestions.append("Adding tags would help users discover this spread")

        if spread_template.card_count == 1 and spread_template.difficulty_level != DifficultyLevel.BEGINNER:
            suggestions.append("Single-card spreads are typically beginner-friendly")

        return SpreadValidation(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )

    except Exception as e:
        logger.error(f"Error validating spread template: {str(e)}")
        raise HTTPException(status_code=500, detail="驗證牌陣模板失敗")