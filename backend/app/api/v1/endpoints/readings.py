"""
廢土塔羅的占卜 API 端點
完整的占卜會話管理與全面的文件
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
import uuid
import logging

from app.db.session import get_db
from app.models.user import User
from app.models.reading_enhanced import (
    CompletedReading as ReadingSessionModel,
    ReadingCardPosition as ReadingCardPositionModel,
    SpreadTemplate as SpreadTemplateModel,
    ReadingTag
)
from app.models.wasteland_card import WastelandCard as WastelandCardModel
from app.models.audio_file import AudioType
from app.core.faction_voice_mapping import filter_character_voices_by_faction
from app.schemas.readings import (
    ReadingSession,
    ReadingCreate,
    ReadingUpdate,
    ReadingListParams,
    ReadingListResponse,
    ReadingStats,
    QuickReadingRequest,
    QuickReadingResponse,
    SpreadTemplate,
    CardPosition,
    ReadingSearchParams,
    ReadingSearchResponse,
    ReadingSearchResult,
    PrivacyLevel,
    # Analytics schemas
    ReadingAnalyticsStats,
    ReadingFrequencyAnalysis,
    SpreadUsageAnalytics,
    VoicePreferenceAnalytics,
    KarmaDistributionAnalytics,
    SatisfactionTrends,
    ReadingPatterns,
    CardFrequencyAnalytics,
    TimePeriodComparison,
    AnalyticsWithDateRange,
    AnalyticsExportData,
    # Tag management schemas
    TagUpdate,
    TagWithCount
)
from app.schemas.cards import WastelandCard, CharacterVoice, KarmaAlignment
from app.core.exceptions import (
    ReadingNotFoundError,
    SpreadNotFoundError,
    ReadingLimitExceededError,
    RadiationOverloadError
)
from app.core.dependencies import get_current_user  # Placeholder for auth
from app.services.analytics_service import AnalyticsService
from app.services.achievement_service import AchievementService
from app.services.achievement_background_tasks import schedule_achievement_check
from app.services.tasks_background_tasks import schedule_task_progress_update

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=ReadingSession,
    status_code=201,
    summary="建立新占卜",
    description="""
    **建立完整的塔羅占卜會話**

    產生完整的塔羅占卜，包含以下功能：

    - **牌陣選擇**：從各種牌陣佈局中選擇
    - **角色聲音**：選擇解讀風格（Pip-Boy、避難所居民等）
    - **業力情境**：善良、中立或邪惡的業力影響
    - **派系影響**：鋼鐵兄弟會、NCR、凱撒軍團的觀點
    - **輻射因子**：環境輻射影響卡牌選擇
    - **問題焦點**：特定的詢問領域
    - **隱私設定**：控制分享與可見性

    系統將會：
    1. 根據牌陣抽取適當的卡牌
    2. 產生角色特定的解讀
    3. 套用業力與派系影響
    4. 建立整體占卜綜合分析
    5. 儲存會話以供未來參考

    適用於：
    - 完整的占卜會話
    - 引導式自我反思
    - 角色驅動的敘事
    - 療癒性洞察
    """,
    response_description="完整的占卜會話，包含卡牌與解讀",
    responses={
        201: {"description": "占卜成功建立"},
        404: {"description": "找不到牌陣模板"},
        422: {"description": "無效的占卜參數"},
        429: {"description": "每日占卜次數已達上限"},
        500: {"description": "占卜產生失敗"}
    }
)
async def create_reading(
    reading_data: ReadingCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ReadingSession:
    """
    Create a new tarot reading session.

    Generates a complete reading with cards drawn according to the selected
    spread template, interpreted through the chosen character voice, and
    influenced by karma alignment and faction preferences.
    """
    try:
        # Check daily reading limit (placeholder logic)
        # In production, implement proper rate limiting
        today = datetime.now().date()
        daily_reading_count = 0  # Placeholder

        if daily_reading_count >= 20:  # Max readings per day
            raise ReadingLimitExceededError(daily_reading_count, 20)

        # Check radiation levels
        if reading_data.radiation_factor > 0.95:
            raise RadiationOverloadError(reading_data.radiation_factor)

        # Get spread template
        spread_query = select(SpreadTemplateModel).where(
            SpreadTemplateModel.id == reading_data.spread_template_id
        )
        spread_result = await db.execute(spread_query)
        spread_template = spread_result.scalar_one_or_none()

        if not spread_template:
            raise SpreadNotFoundError(reading_data.spread_template_id)

        # Generate unique reading ID
        reading_id = f"reading-{uuid.uuid4().hex[:8]}"

        # Start creating reading session
        reading_session = ReadingSessionModel(
            id=reading_id,
            user_id=current_user.id,
            spread_template_id=reading_data.spread_template_id,
            question=reading_data.question,
            focus_area=reading_data.focus_area,
            context_notes=reading_data.context_notes,
            character_voice_used=reading_data.character_voice.value,
            karma_context=reading_data.karma_context.value,
            faction_influence=reading_data.faction_influence.value if reading_data.faction_influence else None,
            radiation_factor=reading_data.radiation_factor,
            privacy_level=reading_data.privacy_level.value,
            allow_public_sharing=reading_data.allow_public_sharing,
            start_time=datetime.now()
        )

        db.add(reading_session)
        await db.flush()  # Get the ID

        # Draw cards for each position in the spread
        spread_positions = spread_template.get_position_meanings()
        card_positions = []

        # Get available cards for drawing
        cards_query = select(WastelandCardModel)
        cards_result = await db.execute(cards_query)
        available_cards = list(cards_result.scalars().all())

        # Simulate card drawing with influences
        import random
        drawn_cards = random.sample(available_cards, len(spread_positions))

        for position_data, card in zip(spread_positions, drawn_cards):
            # Create card position
            card_position = ReadingCardPositionModel(
                completed_reading_id=reading_id,
                card_id=card.id,
                position_number=position_data.get("number", 1),
                position_name=position_data.get("name", "Unknown"),
                position_meaning=position_data.get("meaning", ""),
                is_reversed=random.choice([True, False]),  # Random reversal
                draw_order=position_data.get("number", 1),
                radiation_influence=reading_data.radiation_factor * random.uniform(0.5, 1.5)
            )

            # Generate position-specific interpretation
            card_interpretation = card.get_character_voice_interpretation(
                reading_data.character_voice
            )

            if not card_interpretation:
                # Fallback interpretation
                base_meaning = card.reversed_meaning if card_position.is_reversed else card.upright_meaning
                card_interpretation = f"In the {position_data.get('name', 'position')}: {base_meaning}"

            card_position.position_interpretation = card_interpretation
            card_position.card_significance = f"This card brings {card.name} energy to your {position_data.get('name', 'situation')}"
            card_position.connection_to_question = f"Regarding your question about '{reading_data.question}', this position suggests important considerations"

            # Update card statistics
            card.draw_frequency += 1
            card.total_appearances += 1

            db.add(card_position)
            card_positions.append(card_position)

        # 🔧 FIX: Don't auto-generate interpretation on creation
        # AI interpretation should only be generated when user explicitly requests it
        # via the "請求 AI 解讀" button, which calls the streaming endpoint

        # Leave interpretation fields as NULL initially
        reading_session.overall_interpretation = None
        reading_session.summary_message = None
        reading_session.prediction_confidence = None

        logger.info(f"[DEBUG] Setting overall_interpretation to None for reading {reading_session.id}")
        reading_session.energy_reading = {
            "dominant_energy": random.choice(["positive", "neutral", "transformative"]),
            "secondary_influences": ["growth", "caution", "opportunity"]
        }
        reading_session.end_time = datetime.now()
        reading_session.session_duration = 300  # 5 minutes placeholder

        # Update spread usage statistics
        spread_template.usage_count += 1

        logger.info(f"[DEBUG] Before commit: overall_interpretation = {reading_session.overall_interpretation}")
        await db.commit()
        logger.info(f"[DEBUG] After commit: overall_interpretation = {reading_session.overall_interpretation}")

        # ===== Achievement System Integration =====
        # Schedule achievement check as background task to avoid blocking API response
        background_tasks.add_task(
            schedule_achievement_check,
            user_id=current_user.id,
            trigger_event='reading_completed',
            event_context={
                'reading_id': reading_session.id,
                'spread_type': reading_data.spread_template_id,
                'character_voice': reading_data.character_voice.value
            }
        )
        logger.debug(
            f"Scheduled achievement check for user {current_user.id} "
            f"after completing reading {reading_session.id}"
        )

        # ===== Task Progress Update Integration =====
        # Update daily_reading and weekly_readings task progress
        background_tasks.add_task(
            schedule_task_progress_update,
            user_id=current_user.id,
            task_keys=['daily_reading', 'weekly_readings'],
            increment=1
        )
        logger.debug(
            f"Scheduled task progress update for user {current_user.id} "
            f"after completing reading {reading_session.id}"
        )

        # Convert to response model
        response_data = {
            "id": reading_session.id,
            "user_id": reading_session.user_id,
            "question": reading_session.question,
            "focus_area": reading_session.focus_area,
            "context_notes": reading_session.context_notes,
            "spread_template": SpreadTemplate(**spread_template.to_dict()),
            "character_voice_used": CharacterVoice(reading_session.character_voice_used),
            "karma_context": KarmaAlignment(reading_session.karma_context),
            "faction_influence": reading_session.faction_influence,
            "radiation_factor": reading_session.radiation_factor,
            "card_positions": [
                CardPosition(
                    position_number=pos.position_number,
                    position_name=pos.position_name,
                    position_meaning=pos.position_meaning,
                    card_id=pos.card_id,
                    is_reversed=pos.is_reversed,
                    draw_order=pos.draw_order,
                    radiation_influence=pos.radiation_influence,
                    position_interpretation=pos.position_interpretation,
                    card_significance=pos.card_significance,
                    connection_to_question=pos.connection_to_question
                ) for pos in card_positions
            ],
            "overall_interpretation": reading_session.overall_interpretation,
            "summary_message": reading_session.summary_message,
            "prediction_confidence": reading_session.prediction_confidence,
            "energy_reading": reading_session.energy_reading,
            "session_duration": reading_session.session_duration,
            "start_time": reading_session.start_time,
            "end_time": reading_session.end_time,
            "privacy_level": reading_session.privacy_level,
            "allow_public_sharing": reading_session.allow_public_sharing,
            "is_favorite": reading_session.is_favorite,
            "likes_count": reading_session.likes_count,
            "shares_count": reading_session.shares_count,
            "comments_count": reading_session.comments_count,
            "created_at": reading_session.created_at
        }

        return ReadingSession(**response_data)

    except (ReadingLimitExceededError, SpreadNotFoundError, RadiationOverloadError):
        raise
    except Exception as e:
        logger.error(f"Error creating reading: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create reading")


@router.get(
    "/",
    response_model=ReadingListResponse,
    summary="取得使用者占卜記錄",
    description="""
    **取得使用者的占卜歷史記錄，並支援進階篩選**

    取得占卜的分頁清單，並提供完善的篩選選項：

    - **角色聲音篩選**：依特定聲音尋找占卜
    - **業力情境**：依使用的業力對齊篩選
    - **牌陣類型**：依使用的牌陣模板篩選
    - **日期範圍**：依建立日期篩選
    - **隱私等級**：依分享設定篩選
    - **我的最愛**：僅顯示收藏的占卜
    - **標籤**：依使用者套用的標籤篩選
    - **評分篩選**：依滿意度評分篩選

    適用於：
    - 個人占卜日誌
    - 進度追蹤
    - 模式分析
    - 最愛占卜收藏
    """,
    response_description="使用者占卜的分頁清單"
)
async def get_readings(
    character_voice: Optional[CharacterVoice] = Query(None, description="依角色聲音篩選"),
    karma_context: Optional[KarmaAlignment] = Query(None, description="依業力情境篩選"),
    privacy_level: Optional[str] = Query(None, description="依隱私等級篩選"),
    is_favorite: Optional[bool] = Query(None, description="篩選我的最愛"),
    date_from: Optional[datetime] = Query(None, description="起始日期篩選"),
    date_to: Optional[datetime] = Query(None, description="結束日期篩選"),
    min_satisfaction: Optional[int] = Query(None, ge=1, le=5, description="最低滿意度評分"),
    search: Optional[str] = Query(None, description="搜尋問題或解讀內容"),
    tags: Optional[str] = Query(None, description="依標籤篩選(逗號分隔,OR邏輯)"),
    category_id: Optional[str] = Query(None, description="依分類ID篩選"),
    archived: Optional[bool] = Query(False, description="是否顯示封存記錄"),
    page: int = Query(default=1, ge=1, description="頁碼"),
    page_size: int = Query(default=20, ge=1, le=100, description="每頁數量"),
    limit: int = Query(default=20, ge=1, le=100, description="每頁數量 (別名)"),
    sort_by: str = Query(default="created_at", description="排序欄位"),
    sort_order: str = Query(default="desc", regex="^(asc|desc)$", description="排序方向"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ReadingListResponse:
    """取得使用者的占卜歷史記錄，並支援篩選與分頁。"""
    try:
        # Use limit if page_size not explicitly set
        actual_page_size = limit if page_size == 20 else page_size

        # Build query with eager loading of spread_template relationship
        query = select(ReadingSessionModel).options(
            selectinload(ReadingSessionModel.spread_template)
        ).where(
            ReadingSessionModel.user_id == current_user.id
        )

        # Apply filters
        conditions = []

        if character_voice:
            conditions.append(ReadingSessionModel.character_voice_used == character_voice.value)

        if karma_context:
            conditions.append(ReadingSessionModel.karma_context == karma_context.value)

        if privacy_level:
            conditions.append(ReadingSessionModel.privacy_level == privacy_level)

        if is_favorite is not None:
            conditions.append(ReadingSessionModel.is_favorite == is_favorite)

        if date_from:
            conditions.append(ReadingSessionModel.created_at >= date_from)

        if date_to:
            conditions.append(ReadingSessionModel.created_at <= date_to)

        if min_satisfaction:
            conditions.append(ReadingSessionModel.user_satisfaction >= min_satisfaction)

        # Search filter (searches in question and interpretation)
        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                or_(
                    ReadingSessionModel.question.ilike(search_pattern),
                    ReadingSessionModel.overall_interpretation.ilike(search_pattern)
                )
            )

        # Category filter
        if category_id:
            conditions.append(ReadingSessionModel.category_id == category_id)

        # Archived filter
        if archived is not None:
            # Check if model has archived field
            if hasattr(ReadingSessionModel, 'archived'):
                conditions.append(ReadingSessionModel.archived == archived)

        # Tags filter (OR logic - returns readings with any of the specified tags)
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            if tag_list:
                # This requires reading_tags table join
                # For now, we'll add a placeholder that can be implemented when tags table is ready
                pass  # TODO: Implement tags filtering when reading_tags table is ready

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(ReadingSessionModel.id)).where(
            ReadingSessionModel.user_id == current_user.id
        )
        if conditions:
            count_query = count_query.where(and_(*conditions))

        total_result = await db.execute(count_query)
        total_count = total_result.scalar()

        # Apply sorting
        sort_column = getattr(ReadingSessionModel, sort_by, ReadingSessionModel.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        # Apply pagination
        offset = (page - 1) * actual_page_size
        query = query.offset(offset).limit(actual_page_size)

        # Execute query
        result = await db.execute(query)
        readings_data = result.scalars().all()

        # Pre-fetch all missing spread templates in one query (performance optimization)
        missing_template_ids = [
            reading.spread_template_id 
            for reading in readings_data 
            if not reading.spread_template and reading.spread_template_id
        ]
        
        templates_map = {}
        if missing_template_ids:
            templates_query = select(SpreadTemplateModel).where(
                SpreadTemplateModel.id.in_(missing_template_ids)
            )
            templates_result = await db.execute(templates_query)
            templates_map = {str(t.id): t for t in templates_result.scalars().all()}
        
        # Convert to response models using Pydantic's from_attributes
        readings = []
        for reading in readings_data:
            try:
                # Get spread template data from loaded relationship or pre-fetched map
                if reading.spread_template:
                    spread_template_data = SpreadTemplate(**reading.spread_template.to_dict())
                elif reading.spread_template_id and str(reading.spread_template_id) in templates_map:
                    template = templates_map[str(reading.spread_template_id)]
                    spread_template_data = SpreadTemplate(**template.to_dict())
                else:
                    # Use generic fallback for missing templates (avoid additional queries)
                    spread_template_data = SpreadTemplate(
                        id=str(reading.spread_template_id) if reading.spread_template_id else "unknown",
                        name="unknown_spread",
                        display_name="未知牌陣",
                        description="找不到牌陣模板",
                        spread_type="custom_spread",
                        card_count=1,
                        positions=[],
                        difficulty_level="beginner"
                    )

                # Use Pydantic's model_validate with from_attributes=True
                # This properly converts SQLAlchemy model to Pydantic model
                reading_dict = {
                    "id": str(reading.id),
                    "user_id": str(reading.user_id),
                    "question": reading.question,
                    "focus_area": reading.focus_area,
                    "context_notes": reading.context_notes,
                    "spread_template": spread_template_data,
                    "character_voice_used": CharacterVoice(reading.character_voice_used),
                    "karma_context": KarmaAlignment(reading.karma_context),
                    "faction_influence": reading.faction_influence,
                    "radiation_factor": reading.radiation_factor,
                    "card_positions": [],  # Empty for list view
                    "overall_interpretation": reading.overall_interpretation,
                    "summary_message": reading.summary_message,
                    "prediction_confidence": reading.prediction_confidence,
                    "energy_reading": reading.energy_reading,
                    # AI Interpretation Tracking
                    "ai_interpretation_requested": reading.ai_interpretation_requested,
                    "ai_interpretation_at": reading.ai_interpretation_at,
                    "ai_interpretation_provider": reading.ai_interpretation_provider,
                    "interpretation_audio_url": reading.interpretation_audio_url,
                    "session_duration": reading.session_duration,
                    "start_time": reading.start_time,
                    "end_time": reading.end_time,
                    "privacy_level": PrivacyLevel(reading.privacy_level) if reading.privacy_level else PrivacyLevel.PRIVATE,
                    "allow_public_sharing": reading.allow_public_sharing,
                    "is_favorite": reading.is_favorite,
                    "user_satisfaction": reading.user_satisfaction,
                    "accuracy_rating": reading.accuracy_rating,
                    "helpful_rating": reading.helpful_rating,
                    "likes_count": reading.likes_count,
                    "shares_count": reading.shares_count,
                    "comments_count": reading.comments_count,
                    "created_at": reading.created_at,
                    "updated_at": reading.updated_at
                }
                readings.append(ReadingSession(**reading_dict))
            except Exception as e:
                logger.error(f"Error converting reading {reading.id}: {str(e)}")
                continue

        has_more = (offset + len(readings)) < total_count

        return ReadingListResponse(
            readings=readings,
            total_count=total_count,
            total=total_count,  # Alias for backward compatibility
            page=page,
            page_size=actual_page_size,
            limit=actual_page_size,  # Alias for backward compatibility
            has_more=has_more
        )

    except Exception as e:
        logger.error(f"Error retrieving readings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve readings")


@router.get(
    "/{reading_id}",
    response_model=ReadingSession,
    summary="取得占卜詳細資訊",
    description="""
    **取得特定占卜會話的完整詳細資訊**

    取得占卜的全面資訊：

    - **完整卡牌佈局**：所有卡牌及其位置與意義
    - **角色解讀**：完整的聲音特定分析
    - **使用者回饋**：評分與個人筆記
    - **社群統計**：按讚、分享與評論
    - **會話中繼資料**：持續時間、時間戳記與情境
    - **隱私狀態**：分享權限與可見性

    適用於：
    - 占卜回顧與反思
    - 詳細分析介面
    - 分享準備
    - 進度追蹤
    """,
    response_description="完整的占卜會話及所有詳細資訊"
)
async def get_reading(
    reading_id: str = Path(..., description="占卜會話 ID"),
    include_cards: bool = Query(default=True, description="包含卡牌詳細資訊"),
    include_interpretations: bool = Query(default=True, description="包含解讀"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> ReadingSession:
    """取得特定占卜的詳細資訊。"""
    try:
        # Get reading session
        query = select(ReadingSessionModel).where(ReadingSessionModel.id == reading_id)
        result = await db.execute(query)
        reading = result.scalar_one_or_none()

        if not reading:
            raise ReadingNotFoundError(reading_id)

        # Check if user has access
        if str(reading.user_id) != str(current_user.id) and reading.privacy_level == "private":
            raise HTTPException(status_code=403, detail="Access denied to private reading")

        # Fetch card positions if requested
        card_positions_data = []
        if include_cards:
            # JOIN WastelandCardModel and load character interpretations
            from app.models.character_voice import CardInterpretation, Character
            card_positions_query = (
                select(ReadingCardPositionModel)
                .options(
                    selectinload(ReadingCardPositionModel.card)
                    .selectinload(WastelandCardModel.interpretations)
                    .selectinload(CardInterpretation.character)
                )
                .where(ReadingCardPositionModel.completed_reading_id == reading_id)
                .order_by(ReadingCardPositionModel.draw_order)
            )

            card_positions_result = await db.execute(card_positions_query)
            card_positions = card_positions_result.scalars().all()

            # 獲取當前用戶的陣營，用於過濾角色聲音
            user_faction = current_user.faction_alignment if hasattr(current_user, 'faction_alignment') else 'independent'

            card_positions_data = []
            for pos in card_positions:
                if pos.card:
                    card_dict = pos.card.to_dict()
                    
                    # 調試：檢查 to_dict() 的輸出
                    logger.info(f"[DEBUG] Card {pos.card.name} to_dict() character_voices keys: {list(card_dict.get('character_voices', {}).keys())}")
                    logger.info(f"[DEBUG] User faction: {user_faction}")
                    
                    # 根據用戶陣營過濾角色聲音解讀
                    if 'character_voices' in card_dict and card_dict['character_voices']:
                        original_voices = card_dict['character_voices'].copy()
                        card_dict['character_voices'] = filter_character_voices_by_faction(
                            card_dict['character_voices'],
                            user_faction
                        )
                        logger.info(f"[DEBUG] After filter: {list(card_dict['character_voices'].keys())} (from {len(original_voices)} to {len(card_dict['character_voices'])})")

                    card_position = CardPosition(
                        position_number=pos.position_number,
                        position_name=pos.position_name,
                        position_meaning=pos.position_meaning,
                        card_id=str(pos.card_id),  # Convert UUID to string
                        is_reversed=pos.is_reversed,
                        draw_order=pos.draw_order,
                        radiation_influence=pos.radiation_influence,
                        # Include full card data with filtered character voices
                        card=WastelandCard(**card_dict),
                        position_interpretation=pos.position_interpretation,
                        card_significance=pos.card_significance,
                        connection_to_question=pos.connection_to_question,
                        user_resonance=pos.user_resonance,
                        interpretation_confidence=pos.interpretation_confidence
                    )
                else:
                    card_position = CardPosition(
                        position_number=pos.position_number,
                        position_name=pos.position_name,
                        position_meaning=pos.position_meaning,
                        card_id=str(pos.card_id),
                        is_reversed=pos.is_reversed,
                        draw_order=pos.draw_order,
                        radiation_influence=pos.radiation_influence,
                        card=None,
                        position_interpretation=pos.position_interpretation,
                        card_significance=pos.card_significance,
                        connection_to_question=pos.connection_to_question,
                        user_resonance=pos.user_resonance,
                        interpretation_confidence=pos.interpretation_confidence
                    )

                card_positions_data.append(card_position)

        # Fetch spread template
        spread_template_data = None

        if reading.spread_template_id:
            spread_query = select(SpreadTemplateModel).where(
                SpreadTemplateModel.id == reading.spread_template_id
            )
            spread_result = await db.execute(spread_query)
            spread_template = spread_result.scalar_one_or_none()

            if spread_template:
                spread_template_data = SpreadTemplate(**spread_template.to_dict())

        # Fallback if no spread template found
        if not spread_template_data:
            spread_template_data = SpreadTemplate(
                id=str(reading.spread_template_id) if reading.spread_template_id else "unknown",
                name="unknown_spread",
                display_name="Unknown Spread",
                description="Spread template not found",
                spread_type="single_wasteland",
                card_count=1,
                positions=[],
                difficulty_level="beginner"
            )

        # Convert to response model properly
        reading_dict = {
            "id": str(reading.id),
            "user_id": str(reading.user_id),
            "question": reading.question,
            "focus_area": reading.focus_area,
            "context_notes": reading.context_notes,
            "spread_template": spread_template_data,
            "character_voice_used": CharacterVoice(reading.character_voice_used),
            "karma_context": KarmaAlignment(reading.karma_context),
            "faction_influence": reading.faction_influence,
            "radiation_factor": reading.radiation_factor,
            "card_positions": card_positions_data,
            "overall_interpretation": reading.overall_interpretation,
            "summary_message": reading.summary_message,
            "prediction_confidence": reading.prediction_confidence,
            "energy_reading": reading.energy_reading,
            # AI Interpretation Tracking
            "ai_interpretation_requested": reading.ai_interpretation_requested,
            "ai_interpretation_at": reading.ai_interpretation_at,
            "ai_interpretation_provider": reading.ai_interpretation_provider,
            "interpretation_audio_url": reading.interpretation_audio_url,
            "session_duration": reading.session_duration,
            "start_time": reading.start_time,
            "end_time": reading.end_time,
            "privacy_level": PrivacyLevel(reading.privacy_level) if reading.privacy_level else PrivacyLevel.PRIVATE,
            "allow_public_sharing": reading.allow_public_sharing,
            "is_favorite": reading.is_favorite,
            "user_satisfaction": reading.user_satisfaction,
            "accuracy_rating": reading.accuracy_rating,
            "helpful_rating": reading.helpful_rating,
            "likes_count": reading.likes_count,
            "shares_count": reading.shares_count,
            "comments_count": reading.comments_count,
            "created_at": reading.created_at,
            "updated_at": reading.updated_at
        }
        return ReadingSession(**reading_dict)

    except ReadingNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error retrieving reading {reading_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve reading")


async def generate_interpretation_audio_background(
    reading_id: str,
    interpretation_text: str,
    character_key: str
):
    """
    Background task to generate TTS audio for AI interpretation

    Args:
        reading_id: Reading ID to update
        interpretation_text: AI interpretation text
        character_key: Character voice key (e.g., 'pip_boy')
    """
    # Import inside function to avoid circular dependencies
    from app.db.session import get_db
    from app.core.dependencies import get_supabase_client
    from app.services.tts_service import get_tts_service
    from app.services.audio_storage_service import get_audio_storage_service

    try:
        logger.info(f"[TTS] Generating audio for reading {reading_id}")

        # Get new database session for background task
        async for db in get_db():
            # Get Supabase client
            supabase = get_supabase_client()

            # Get services
            tts_service = get_tts_service()
            storage_service = get_audio_storage_service(supabase)

            # Compute text hash
            text_hash = tts_service.compute_text_hash(interpretation_text, character_key)

            # Get character ID
            character_id = await storage_service.get_character_id_by_key(db, character_key)
            if not character_id:
                logger.error(f"[TTS] Invalid character_key: {character_key}")
                return

            # Check if audio already exists (by text_hash)
            audio_file = await storage_service.get_audio_by_text_hash(db, text_hash, character_id)

            if audio_file:
                # Audio already exists, use existing URL
                logger.info(f"[TTS] Using existing audio: {audio_file.storage_url}")
                audio_url = audio_file.storage_url
            else:
                # Generate new audio
                logger.info(f"[TTS] Synthesizing new audio (text_length={len(interpretation_text)})")

                # Synthesize speech
                result = tts_service.synthesize_speech(
                    text=interpretation_text,
                    character_key=character_key,
                    language_code="zh-TW"
                )

                # Generate storage path
                storage_path = storage_service.generate_storage_path(
                    audio_type=AudioType.AI_RESPONSE,
                    identifier=text_hash[:8],
                    character_key=character_key
                )

                # Upload to Supabase
                audio_url = await storage_service.upload_audio(
                    audio_content=result["audio_content"],
                    storage_path=storage_path
                )

                # Save metadata to database
                await storage_service.save_audio_metadata(
                    db=db,
                    card_id=None,
                    character_id=character_id,
                    storage_path=storage_path,
                    storage_url=audio_url,
                    file_size=result["file_size"],
                    duration_seconds=result["duration"],
                    text_length=result["text_length"],
                    text_hash=text_hash,
                    language_code="zh-TW",
                    voice_name=result["voice_name"],
                    ssml_params=result["ssml_params"],
                    audio_type=AudioType.AI_RESPONSE
                )

                logger.info(f"[TTS] Audio generated and uploaded: {audio_url}")

            # Update reading with audio URL
            import uuid as uuid_module
            reading_uuid = uuid_module.UUID(reading_id) if isinstance(reading_id, str) else reading_id
            query = select(ReadingSessionModel).where(ReadingSessionModel.id == reading_uuid)
            result_query = await db.execute(query)
            reading = result_query.scalar_one_or_none()

            if reading:
                reading.interpretation_audio_url = audio_url
                await db.commit()
                logger.info(f"[TTS] Updated reading {reading_id} with audio URL: {audio_url}")
            else:
                logger.error(f"[TTS] Reading {reading_id} not found during audio update")

            # Break after first (and only) iteration
            break

    except Exception as e:
        logger.error(f"[TTS] Failed to generate audio for reading {reading_id}: {e}", exc_info=True)


@router.patch(
    "/{reading_id}",
    response_model=ReadingSession,
    summary="更新占卜記錄",
    description="""
    **更新特定占卜記錄的資訊**

    可更新的欄位：
    - 隱私設定（privacy_level, allow_public_sharing）
    - 使用者回饋（user_satisfaction, accuracy_rating, helpful_rating, user_feedback）
    - AI 解讀結果（overall_interpretation, summary_message, prediction_confidence）
    - 最愛標記（is_favorite）
    - 心情狀態（mood_after）

    **重要限制：AI 解讀只能請求一次**
    - 當 ai_interpretation_requested 為 True 時，無法再次更新 AI 解讀欄位
    - 首次儲存 AI 解讀時會自動設定 ai_interpretation_requested = True

    適用於：
    - 儲存 AI 生成的解讀結果
    - 更新使用者回饋與評分
    - 修改隱私設定
    - 標記最愛占卜
    """,
    responses={
        200: {"description": "占卜記錄已成功更新"},
        403: {"description": "無權更新此占卜記錄或 AI 解讀已使用"},
        404: {"description": "找不到占卜記錄"},
        422: {"description": "無效的更新資料"},
        500: {"description": "更新失敗"}
    }
)
async def update_reading(
    background_tasks: BackgroundTasks,
    reading_id: str = Path(..., description="占卜會話 ID"),
    update_data: ReadingUpdate = Body(..., description="要更新的欄位"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """更新占卜記錄，包含 AI 解讀功能的一次性限制。"""
    try:
        # Get reading session
        query = select(ReadingSessionModel).where(ReadingSessionModel.id == reading_id)
        result = await db.execute(query)
        reading = result.scalar_one_or_none()

        if not reading:
            raise ReadingNotFoundError(reading_id)

        # Check if user has permission to update
        if str(reading.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to update this reading"
            )

        # Check AI interpretation one-time limit
        # Allow first-time setting of ai_interpretation_requested (user clicks button)
        # Allow setting overall_interpretation during streaming or completion
        # But prevent modifying existing COMPLETED interpretation
        is_requesting_ai = update_data.ai_interpretation_requested is not None

        # Block if trying to REQUEST AI when already requested
        if is_requesting_ai and reading.ai_interpretation_requested:
            raise HTTPException(
                status_code=403,
                detail="AI interpretation has already been requested for this reading."
            )

        # Only check for modification if trying to update overall_interpretation
        # Allow updating summary_message and prediction_confidence without restriction
        if update_data.overall_interpretation is not None:
            # Check if current interpretation exists and has content
            current_has_content = (
                reading.overall_interpretation is not None and
                len(reading.overall_interpretation.strip()) > 0
            )

            # 🔍 DEBUG: Log validation state
            logger.info(
                f"Validation check for reading {reading_id}: "
                f"current_has_content={current_has_content}, "
                f"current_length={len(reading.overall_interpretation) if reading.overall_interpretation else 0}, "
                f"new_length={len(update_data.overall_interpretation)}"
            )

            # Check if trying to update with different content
            is_modifying = False
            if current_has_content:
                new_content = update_data.overall_interpretation.strip()
                current_content = reading.overall_interpretation.strip()

                # Allow these cases:
                # 1. New content is exactly the same (redundant update)
                # 2. New content is longer (completion/retry of interrupted stream)
                # 3. New content contains the current content as prefix (progressive streaming)
                #
                # Only block if:
                # - New content is shorter AND different (replacement with different content)
                # - New content doesn't contain current content (completely different text)

                if new_content == current_content:
                    # Case 1: Redundant update, allow silently
                    is_modifying = False
                elif len(new_content) > len(current_content):
                    # Case 2 & 3: Check if new content builds on current
                    # Allow if current content is a prefix of new content
                    is_modifying = not new_content.startswith(current_content)
                else:
                    # New content is shorter
                    # Only allow if it's exactly the same (which we already checked above)
                    is_modifying = True

                # 🔍 DEBUG: Log modification check
                logger.info(
                    f"Modification check: is_modifying={is_modifying}, "
                    f"new_length={len(new_content)}, current_length={len(current_content)}, "
                    f"current_preview={current_content[:100]}..., "
                    f"new_preview={new_content[:100]}..."
                )

            if current_has_content and is_modifying:
                logger.warning(
                    f"BLOCKING modification for reading {reading_id}: "
                    f"Attempt to replace with shorter different content"
                )
                raise HTTPException(
                    status_code=403,
                    detail="AI interpretation content cannot be modified once set."
                )

        # Update fields (only update provided fields)
        update_dict = update_data.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            if hasattr(reading, field):
                setattr(reading, field, value)

        # If requesting AI interpretation, mark as requested and set timestamp + provider
        if is_requesting_ai and not reading.ai_interpretation_requested:
            reading.ai_interpretation_requested = True
            reading.ai_interpretation_at = datetime.now()

            # Save AI provider information if provided
            if update_data.ai_interpretation_provider:
                reading.ai_interpretation_provider = update_data.ai_interpretation_provider
            else:
                # Default to openai if not specified
                reading.ai_interpretation_provider = "openai"

        await db.commit()
        await db.refresh(reading)

        # Generate TTS audio for AI interpretation (background task)
        if (update_data.overall_interpretation is not None and
            len(update_data.overall_interpretation) > 0):
            # Extract character_key from character_voice_used
            character_key = reading.character_voice_used
            if character_key:
                # Add background task to generate audio
                background_tasks.add_task(
                    generate_interpretation_audio_background,
                    reading_id=reading_id,
                    interpretation_text=update_data.overall_interpretation,
                    character_key=character_key
                )
                logger.info(f"[TTS] Queued audio generation for reading {reading_id}")

        # Fetch full reading with relationships to return complete ReadingSession
        # (Reuse the logic from get_reading endpoint)

        # Fetch card positions
        card_positions_query = (
            select(ReadingCardPositionModel)
            .options(selectinload(ReadingCardPositionModel.card))
            .where(ReadingCardPositionModel.completed_reading_id == reading_id)
            .order_by(ReadingCardPositionModel.draw_order)
        )
        card_positions_result = await db.execute(card_positions_query)
        card_positions = card_positions_result.scalars().all()

        card_positions_data = [
            CardPosition(
                position_number=pos.position_number,
                position_name=pos.position_name,
                position_meaning=pos.position_meaning,
                card_id=str(pos.card_id),  # Convert UUID to string
                is_reversed=pos.is_reversed,
                draw_order=pos.draw_order,
                radiation_influence=pos.radiation_influence,
                # Include full card data
                card=WastelandCard(**pos.card.to_dict()) if pos.card else None,
                position_interpretation=pos.position_interpretation,
                card_significance=pos.card_significance,
                connection_to_question=pos.connection_to_question,
                user_resonance=pos.user_resonance,
                interpretation_confidence=pos.interpretation_confidence
            ) for pos in card_positions
        ]

        # Fetch spread template
        spread_template_data = None

        if reading.spread_template_id:
            spread_query = select(SpreadTemplateModel).where(
                SpreadTemplateModel.id == reading.spread_template_id
            )
            spread_result = await db.execute(spread_query)
            spread_template = spread_result.scalar_one_or_none()

            if spread_template:
                spread_template_data = SpreadTemplate(**spread_template.to_dict())

        # Fallback if no spread template found
        if not spread_template_data:
            spread_template_data = SpreadTemplate(
                id=str(reading.spread_template_id) if reading.spread_template_id else "unknown",
                name="unknown_spread",
                display_name="Unknown Spread",
                description="Spread template not found",
                spread_type="single_wasteland",
                card_count=1,
                positions=[],
                difficulty_level="beginner"
            )

        # Convert to response model
        reading_dict = {
            "id": str(reading.id),
            "user_id": str(reading.user_id),
            "question": reading.question,
            "focus_area": reading.focus_area,
            "context_notes": reading.context_notes,
            "spread_template": spread_template_data,
            "character_voice_used": CharacterVoice(reading.character_voice_used),
            "karma_context": KarmaAlignment(reading.karma_context),
            "faction_influence": reading.faction_influence,
            "radiation_factor": reading.radiation_factor,
            "card_positions": card_positions_data,
            "overall_interpretation": reading.overall_interpretation,
            "summary_message": reading.summary_message,
            "prediction_confidence": reading.prediction_confidence,
            "energy_reading": reading.energy_reading,
            # AI Interpretation Tracking
            "ai_interpretation_requested": reading.ai_interpretation_requested,
            "ai_interpretation_at": reading.ai_interpretation_at,
            "ai_interpretation_provider": reading.ai_interpretation_provider,
            "interpretation_audio_url": reading.interpretation_audio_url,
            "session_duration": reading.session_duration,
            "start_time": reading.start_time,
            "end_time": reading.end_time,
            "privacy_level": PrivacyLevel(reading.privacy_level) if reading.privacy_level else PrivacyLevel.PRIVATE,
            "allow_public_sharing": reading.allow_public_sharing,
            "is_favorite": reading.is_favorite,
            "user_satisfaction": reading.user_satisfaction,
            "accuracy_rating": reading.accuracy_rating,
            "helpful_rating": reading.helpful_rating,
            "likes_count": reading.likes_count,
            "shares_count": reading.shares_count,
            "comments_count": reading.comments_count,
            "created_at": reading.created_at,
            "updated_at": reading.updated_at
        }

        logger.info(f"Updated reading {reading_id} for user {current_user.id}")
        return ReadingSession(**reading_dict)

    except ReadingNotFoundError:
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating reading {reading_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update reading")


@router.delete(
    "/{reading_id}",
    status_code=204,
    summary="刪除占卜記錄",
    description="""
    **刪除特定的占卜會話記錄**

    永久刪除占卜記錄，包含：
    - 占卜會話資料
    - 所有關聯的卡牌位置
    - 解讀與筆記

    注意：此操作無法復原

    適用於：
    - 移除不需要的占卜記錄
    - 清理個人歷史記錄
    - 資料管理
    """,
    responses={
        204: {"description": "占卜記錄已成功刪除"},
        403: {"description": "無權刪除此占卜記錄"},
        404: {"description": "找不到占卜記錄"},
        500: {"description": "刪除失敗"}
    }
)
async def delete_reading(
    reading_id: str = Path(..., description="占卜會話 ID"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """刪除特定的占卜記錄。"""
    try:
        # Get reading session
        query = select(ReadingSessionModel).where(ReadingSessionModel.id == reading_id)
        result = await db.execute(query)
        reading = result.scalar_one_or_none()

        if not reading:
            raise ReadingNotFoundError(reading_id)

        # Check if user has permission to delete
        if str(reading.user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="You don't have permission to delete this reading")

        # Delete associated card positions first (due to foreign key constraints)
        delete_positions_query = select(ReadingCardPositionModel).where(
            ReadingCardPositionModel.completed_reading_id == reading_id
        )
        positions_result = await db.execute(delete_positions_query)
        positions = positions_result.scalars().all()

        for position in positions:
            await db.delete(position)

        # Delete the reading session
        await db.delete(reading)
        await db.commit()

        logger.info(f"Deleted reading {reading_id} for user {current_user.id}")
        # Return 204 No Content (FastAPI automatically returns empty response for 204)
        return

    except ReadingNotFoundError:
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting reading {reading_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete reading")


@router.post(
    "/quick",
    response_model=QuickReadingResponse,
    summary="快速單卡占卜",
    description="""
    **取得即時的單卡指引**

    適用於：
    - 每日指引
    - 快速洞察
    - 行動裝置體驗
    - 一般使用者

    功能：
    - 單張卡牌抽取，包含情境
    - 角色聲音解讀
    - 業力影響
    - 即時結果
    - 額外的廢土智慧
    """,
    response_description="快速占卜，包含卡牌與解讀"
)
async def quick_reading(
    quick_request: QuickReadingRequest = Body(
        ...,
        example={
            "question": "What do I need to know today?",
            "character_voice": "pip_boy",
            "karma_context": "neutral",
            "radiation_factor": 0.3
        }
    ),
    db: AsyncSession = Depends(get_db)
) -> QuickReadingResponse:
    """Generate a quick single-card reading."""
    try:
        # Get a random card
        cards_query = select(WastelandCardModel)
        cards_result = await db.execute(cards_query)
        available_cards = list(cards_result.scalars().all())

        import random
        selected_card = random.choice(available_cards)

        # Generate interpretation
        interpretation = selected_card.get_character_voice_interpretation(
            quick_request.character_voice
        )

        if not interpretation:
            # Fallback with character flavor
            base_meaning = selected_card.upright_meaning
            if quick_request.character_voice == CharacterVoice.PIP_BOY:
                interpretation = f"Analysis: {base_meaning}. Confidence level: High."
            else:
                interpretation = base_meaning

        # Generate quick insight
        insights = [
            "Trust your instincts in the wasteland",
            "Every challenge is an opportunity for growth",
            "The vault door opens when you're ready",
            "Fortune favors the prepared wanderer"
        ]
        quick_insight = random.choice(insights)

        # Wasteland wisdom
        wisdom_quotes = [
            "War never changes, but you can",
            "In the wasteland, adaptation is survival",
            "Even broken clocks are right twice a day",
            "The strongest steel is forged in the hottest fire"
        ]
        wasteland_wisdom = random.choice(wisdom_quotes)

        # Update card stats
        selected_card.draw_frequency += 1
        selected_card.total_appearances += 1
        await db.commit()

        return QuickReadingResponse(
            card=WastelandCard(**selected_card.to_dict()),
            interpretation=interpretation,
            quick_insight=quick_insight,
            radiation_influence=quick_request.radiation_factor,
            confidence=random.uniform(0.8, 0.95),
            wasteland_wisdom=wasteland_wisdom
        )

    except Exception as e:
        logger.error(f"Error generating quick reading: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate quick reading")


@router.get(
    "/stats/personal",
    response_model=ReadingStats,
    summary="取得個人占卜統計",
    description="""
    **個人占卜分析與洞察**

    關於您占卜習慣的全面統計：
    - 占卜頻率與模式
    - 最愛的角色聲音與牌陣
    - 業力對齊偏好
    - 滿意度趨勢
    - 成就進度
    """,
    response_description="個人占卜統計與分析"
)
async def get_personal_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ReadingStats:
    """Get personal reading statistics with real data calculation."""
    try:
        from app.schemas.cards import CharacterVoice, KarmaAlignment
        from datetime import timezone

        now = datetime.now(timezone.utc)

        # 1. Total readings count
        total_query = select(func.count()).select_from(ReadingSessionModel).where(
            ReadingSessionModel.user_id == current_user.id
        )
        total_result = await db.execute(total_query)
        total_readings = total_result.scalar() or 0

        # 2. Readings this month
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_query = select(func.count()).select_from(ReadingSessionModel).where(
            and_(
                ReadingSessionModel.user_id == current_user.id,
                ReadingSessionModel.created_at >= month_start
            )
        )
        month_result = await db.execute(month_query)
        readings_this_month = month_result.scalar() or 0

        # 3. Readings this week
        week_start = now - timedelta(days=now.weekday())  # Monday of current week
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_query = select(func.count()).select_from(ReadingSessionModel).where(
            and_(
                ReadingSessionModel.user_id == current_user.id,
                ReadingSessionModel.created_at >= week_start
            )
        )
        week_result = await db.execute(week_query)
        readings_this_week = week_result.scalar() or 0

        # 4. Average satisfaction rating
        avg_query = select(func.avg(ReadingSessionModel.user_satisfaction)).where(
            and_(
                ReadingSessionModel.user_id == current_user.id,
                ReadingSessionModel.user_satisfaction.isnot(None)
            )
        )
        avg_result = await db.execute(avg_query)
        average_satisfaction = float(avg_result.scalar() or 0.0)

        # 5. Favorite character voice (most used)
        voice_query = select(
            ReadingSessionModel.character_voice_used,
            func.count().label('count')
        ).where(
            ReadingSessionModel.user_id == current_user.id
        ).group_by(
            ReadingSessionModel.character_voice_used
        ).order_by(
            desc('count')
        ).limit(1)

        voice_result = await db.execute(voice_query)
        voice_row = voice_result.first()
        favorite_character_voice = CharacterVoice(voice_row[0]) if voice_row else CharacterVoice.PIP_BOY

        # 6. Favorite spread type (most used)
        spread_query = select(
            SpreadTemplateModel.name,
            func.count().label('count')
        ).select_from(ReadingSessionModel).join(
            SpreadTemplateModel,
            ReadingSessionModel.spread_template_id == SpreadTemplateModel.id
        ).where(
            ReadingSessionModel.user_id == current_user.id
        ).group_by(
            SpreadTemplateModel.name
        ).order_by(
            desc('count')
        ).limit(1)

        spread_result = await db.execute(spread_query)
        spread_row = spread_result.first()
        favorite_spread = spread_row[0] if spread_row else "unknown"

        # 7. Total cards drawn (count all card positions)
        cards_query = select(func.count()).select_from(ReadingCardPositionModel).join(
            ReadingSessionModel,
            ReadingCardPositionModel.completed_reading_id == ReadingSessionModel.id
        ).where(
            ReadingSessionModel.user_id == current_user.id
        )
        cards_result = await db.execute(cards_query)
        total_cards_drawn = cards_result.scalar() or 0

        # 8. Karma distribution
        karma_query = select(
            ReadingSessionModel.karma_context,
            func.count().label('count')
        ).where(
            ReadingSessionModel.user_id == current_user.id
        ).group_by(
            ReadingSessionModel.karma_context
        )

        karma_result = await db.execute(karma_query)
        karma_rows = karma_result.all()

        # Initialize karma distribution with all possible values
        karma_distribution = {
            KarmaAlignment.GOOD: 0,
            KarmaAlignment.NEUTRAL: 0,
            KarmaAlignment.EVIL: 0
        }

        for row in karma_rows:
            if row[0]:  # Check if karma_context is not None
                try:
                    karma_distribution[KarmaAlignment(row[0])] = row[1]
                except (ValueError, KeyError):
                    pass  # Skip invalid karma values

        # 9. Recent readings count (last 7 days)
        seven_days_ago = now - timedelta(days=7)
        recent_query = select(func.count()).select_from(ReadingSessionModel).where(
            and_(
                ReadingSessionModel.user_id == current_user.id,
                ReadingSessionModel.created_at >= seven_days_ago
            )
        )
        recent_result = await db.execute(recent_query)
        recent_readings_count = recent_result.scalar() or 0

        # 10. Consecutive days (count unique dates with readings in descending order)
        dates_query = select(
            func.date(ReadingSessionModel.created_at).label('reading_date')
        ).where(
            ReadingSessionModel.user_id == current_user.id
        ).group_by(
            func.date(ReadingSessionModel.created_at)
        ).order_by(
            desc('reading_date')
        )

        dates_result = await db.execute(dates_query)
        reading_dates = [row[0] for row in dates_result.all()]

        # Calculate consecutive days from today backwards
        consecutive_days = 0
        if reading_dates:
            current_date = now.date()
            for reading_date in reading_dates:
                # Convert datetime to date if needed
                if hasattr(reading_date, 'date'):
                    reading_date = reading_date.date()

                # Check if this date is consecutive
                if reading_date == current_date:
                    consecutive_days += 1
                    current_date = current_date - timedelta(days=1)
                elif reading_date == current_date - timedelta(days=1):
                    consecutive_days += 1
                    current_date = reading_date - timedelta(days=1)
                else:
                    break  # Break on first non-consecutive day

        return ReadingStats(
            total_readings=total_readings,
            readings_this_month=readings_this_month,
            readings_this_week=readings_this_week,
            average_satisfaction=round(average_satisfaction, 1),
            favorite_character_voice=favorite_character_voice,
            favorite_spread=favorite_spread,
            total_cards_drawn=total_cards_drawn,
            karma_distribution=karma_distribution,
            recent_readings_count=recent_readings_count,
            consecutive_days=consecutive_days
        )

    except Exception as e:
        logger.error(f"Error retrieving reading stats: {str(e)}")
        logger.exception(e)  # Log full traceback
        raise HTTPException(status_code=500, detail=f"Failed to retrieve reading statistics: {str(e)}")


@router.get(
    "/search",
    response_model=ReadingSearchResponse,
    summary="搜尋占卜",
    description="""
    **搜尋並篩選您的占卜歷史記錄**

    全面的搜尋功能，包含多種篩選條件：
    - **文字搜尋**：在問題與筆記中搜尋
    - **牌陣類型**：依特定牌陣佈局篩選
    - **標籤**：依占卜標籤篩選
    - **日期範圍**：尋找特定時間範圍內的占卜
    - **排序**：依日期、相關性或其他欄位排序
    - **分頁**：瀏覽大量結果集

    適用於：
    - 尋找關於特定主題的過往占卜
    - 組織您的占卜歷史記錄
    - 回顧長期模式
    - 快速參考重要占卜
    """,
    response_description="包含中繼資料的分頁搜尋結果"
)
async def search_readings(
    q: Optional[str] = Query(None, description="搜尋問題或筆記的查詢字串", min_length=1),
    spread_type: Optional[str] = Query(None, description="依牌陣類型篩選"),
    start_date: Optional[datetime] = Query(None, description="篩選此日期之後的占卜"),
    end_date: Optional[datetime] = Query(None, description="篩選此日期之前的占卜"),
    page: int = Query(1, ge=1, description="頁碼"),
    page_size: int = Query(20, ge=1, le=100, description="每頁項目數"),
    sort: str = Query("created_at", description="排序欄位"),
    order: str = Query("desc", description="排序方向（asc/desc）"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ReadingSearchResponse:
    """
    以進階篩選與分頁搜尋占卜。

    此端點提供強大的搜尋功能，用於在您的歷史記錄中尋找特定占卜。
    """
    try:
        user_id = current_user.id

        # Build query
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.user_id == user_id
        )

        # Text search in question and notes
        if q:
            search_term = f"%{q}%"
            query = query.where(
                or_(
                    ReadingSessionModel.question.ilike(search_term),
                    ReadingSessionModel.notes.ilike(search_term)
                )
            )

        # Filter by spread type
        if spread_type:
            query = query.where(ReadingSessionModel.spread_template_id == spread_type)

        # Date range filters
        if start_date:
            query = query.where(ReadingSessionModel.created_at >= start_date)
        if end_date:
            query = query.where(ReadingSessionModel.created_at <= end_date)

        # Count total results
        count_query = select(func.count()).select_from(query.subquery())
        result = await db.execute(count_query)
        total = result.scalar() or 0

        # Apply sorting
        if order.lower() == "asc":
            query = query.order_by(getattr(ReadingSessionModel, sort))
        else:
            query = query.order_by(desc(getattr(ReadingSessionModel, sort)))

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        readings = result.scalars().all()

        # Transform to search results
        search_results = []
        for reading in readings:
            # Count cards
            cards_result = await db.execute(
                select(func.count()).select_from(ReadingCardPositionModel).where(
                    ReadingCardPositionModel.completed_reading_id == reading.id
                )
            )
            cards_count = cards_result.scalar() or 0

            search_results.append(ReadingSearchResult(
                id=reading.id,
                question=reading.question,
                spread_type=reading.spread_template_id or "unknown",
                created_at=reading.created_at,
                notes=reading.notes,
                cards_count=cards_count,
                character_voice=reading.character_voice
            ))

        # Calculate total pages
        total_pages = (total + page_size - 1) // page_size

        return ReadingSearchResponse(
            results=search_results,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    except Exception as e:
        logger.error(f"Error searching readings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search readings")


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get(
    "/analytics/stats",
    response_model=ReadingAnalyticsStats,
    summary="取得基本占卜統計",
    description="取得基本統計資料，包含總占卜數、每週/每月次數與偏好"
)
async def get_analytics_stats(
    start_date: Optional[datetime] = Query(None, description="起始日期篩選"),
    end_date: Optional[datetime] = Query(None, description="結束日期篩選"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得目前使用者的基本占卜統計"""
    try:
        analytics_service = AnalyticsService(db)
        stats = await analytics_service.get_basic_statistics(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )

        # Return with date_range if provided
        if start_date or end_date:
            return AnalyticsWithDateRange(
                date_range={
                    "start": start_date.isoformat() if start_date else "",
                    "end": end_date.isoformat() if end_date else ""
                },
                **stats
            )

        return ReadingAnalyticsStats(**stats)

    except Exception as e:
        logger.error(f"Error getting analytics stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get analytics statistics")


@router.get(
    "/analytics/frequency",
    response_model=ReadingFrequencyAnalysis,
    summary="取得占卜頻率分析",
    description="分析時間週期內的占卜頻率"
)
async def get_reading_frequency(
    period: str = Query("30d", description="時間週期（例如：'30d'、'7d'）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得指定時間週期內的占卜頻率"""
    try:
        analytics_service = AnalyticsService(db)
        frequency = await analytics_service.get_frequency_analysis(
            user_id=current_user.id,
            period=period
        )
        return ReadingFrequencyAnalysis(**frequency)

    except Exception as e:
        logger.error(f"Error getting frequency analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get frequency analysis")


@router.get(
    "/analytics/spreads",
    response_model=SpreadUsageAnalytics,
    summary="取得牌陣使用統計",
    description="分析最常使用的牌陣類型"
)
async def get_spread_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得牌陣類型使用統計"""
    try:
        analytics_service = AnalyticsService(db)
        usage = await analytics_service.get_spread_usage(current_user.id)
        return SpreadUsageAnalytics(**usage)

    except Exception as e:
        logger.error(f"Error getting spread usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get spread usage")


@router.get(
    "/analytics/voices",
    response_model=VoicePreferenceAnalytics,
    summary="取得角色聲音偏好",
    description="分析角色聲音使用模式"
)
async def get_voice_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得角色聲音偏好分析"""
    try:
        analytics_service = AnalyticsService(db)
        preferences = await analytics_service.get_voice_preferences(current_user.id)
        return VoicePreferenceAnalytics(**preferences)

    except Exception as e:
        logger.error(f"Error getting voice preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get voice preferences")


@router.get(
    "/analytics/karma",
    response_model=KarmaDistributionAnalytics,
    summary="取得業力分佈",
    description="分析占卜中的業力情境分佈"
)
async def get_karma_distribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得業力情境分佈"""
    try:
        analytics_service = AnalyticsService(db)
        distribution = await analytics_service.get_karma_distribution(current_user.id)
        return KarmaDistributionAnalytics(**distribution)

    except Exception as e:
        logger.error(f"Error getting karma distribution: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get karma distribution")


@router.get(
    "/analytics/satisfaction",
    response_model=SatisfactionTrends,
    summary="取得滿意度趨勢",
    description="分析滿意度評分隨時間的趨勢"
)
async def get_satisfaction_trends(
    period: str = Query("30d", description="時間週期（例如：'30d'、'7d'）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得滿意度評分趨勢"""
    try:
        analytics_service = AnalyticsService(db)
        trends = await analytics_service.get_satisfaction_trends(
            user_id=current_user.id,
            period=period
        )
        return SatisfactionTrends(**trends)

    except Exception as e:
        logger.error(f"Error getting satisfaction trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get satisfaction trends")


@router.get(
    "/analytics/patterns",
    response_model=ReadingPatterns,
    summary="取得占卜模式",
    description="分析占卜行為模式（活躍日期、時間、連續紀錄）"
)
async def get_reading_patterns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得占卜模式分析"""
    try:
        analytics_service = AnalyticsService(db)
        patterns = await analytics_service.get_reading_patterns(current_user.id)
        return ReadingPatterns(**patterns)

    except Exception as e:
        logger.error(f"Error getting reading patterns: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get reading patterns")


@router.get(
    "/analytics/cards",
    response_model=CardFrequencyAnalytics,
    summary="取得卡牌頻率分析",
    description="分析在占卜中最常出現的卡牌"
)
async def get_card_frequency(
    limit: int = Query(10, ge=1, le=50, description="回傳的熱門卡牌數量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得最常抽取的卡牌分析"""
    try:
        analytics_service = AnalyticsService(db)
        frequency = await analytics_service.get_card_frequency(
            user_id=current_user.id,
            limit=limit
        )
        return CardFrequencyAnalytics(**frequency)

    except Exception as e:
        logger.error(f"Error getting card frequency: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get card frequency")


@router.get(
    "/analytics/compare",
    response_model=TimePeriodComparison,
    summary="比較時間週期",
    description="比較兩個時間週期之間的分析資料"
)
async def compare_time_periods(
    period1: str = Query(..., description="第一個週期（例如：'7d'）"),
    period2: str = Query(..., description="第二個週期（例如：'previous_7d'）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """比較兩個時間週期的分析資料"""
    try:
        analytics_service = AnalyticsService(db)
        comparison = await analytics_service.compare_time_periods(
            user_id=current_user.id,
            period1=period1,
            period2=period2
        )
        return TimePeriodComparison(**comparison)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error comparing time periods: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compare time periods")


@router.get(
    "/analytics/export",
    summary="匯出分析資料",
    description="以指定格式匯出完整的分析資料"
)
async def export_analytics(
    format: str = Query("json", description="匯出格式：'json' 或 'csv'"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """匯出分析資料"""
    try:
        analytics_service = AnalyticsService(db)
        data = await analytics_service.export_analytics_data(current_user.id)

        if format == "csv":
            # Return CSV format
            from fastapi.responses import StreamingResponse
            import csv
            from io import StringIO

            output = StringIO()
            writer = csv.writer(output)

            # Write statistics
            writer.writerow(["Metric", "Value"])
            for key, value in data["statistics"].items():
                writer.writerow([key, value])

            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=analytics.csv"}
            )

        elif format == "json":
            # Return JSON format
            return AnalyticsExportData(**data)

        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'json' or 'csv'")

    except Exception as e:
        logger.error(f"Error exporting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export analytics")


# ============================================================================
# TAG MANAGEMENT ENDPOINTS
# ============================================================================

@router.patch(
    "/{reading_id}/tags",
    response_model=ReadingSession,
    summary="更新解讀記錄的標籤",
    description="""
    **更新特定解讀記錄的標籤（最多 20 個）**

    功能：
    - 完全替換解讀記錄的標籤列表
    - 自動去除重複標籤
    - 驗證標籤長度（1-50 字元）
    - 驗證標籤數量（最多 20 個）
    - 檢查解讀記錄所有權
    - 原子操作：刪除舊標籤 + 新增新標籤

    適用於：
    - 組織個人占卜記錄
    - 標記占卜主題
    - 快速篩選與搜尋
    """,
    responses={
        200: {"description": "標籤已成功更新"},
        400: {"description": "無效的標籤資料"},
        403: {"description": "無權更新此解讀記錄"},
        404: {"description": "找不到解讀記錄"},
        500: {"description": "更新失敗"}
    }
)
async def update_reading_tags(
    reading_id: str = Path(..., description="解讀記錄 ID"),
    tag_update: TagUpdate = Body(..., description="標籤更新資料"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ReadingSession:
    """
    更新解讀記錄的標籤（最多 20 個）

    驗證：
    - 標籤長度（1-50 字元）
    - 標籤數量（最多 20 個）
    - 解讀記錄所有權

    操作：
    - 原子操作：刪除舊標籤 + 新增新標籤
    - 自動去除重複標籤
    """
    try:
        # 1. 驗證解讀記錄存在且屬於當前用戶
        query = select(ReadingSessionModel).where(
            ReadingSessionModel.id == reading_id,
            ReadingSessionModel.user_id == current_user.id
        )
        result = await db.execute(query)
        reading = result.scalar_one_or_none()

        if not reading:
            raise HTTPException(
                status_code=404,
                detail="Reading not found or you don't have permission to update it"
            )

        # 2. 驗證標籤（Pydantic 已做基本驗證）
        tags = tag_update.tags

        # 去除重複標籤（保持原始順序）
        unique_tags = []
        seen = set()
        for tag in tags:
            tag_stripped = tag.strip()
            if tag_stripped and tag_stripped not in seen:
                unique_tags.append(tag_stripped)
                seen.add(tag_stripped)

        # 3. 原子操作：刪除舊標籤
        delete_query = select(ReadingTag).where(ReadingTag.reading_id == reading_id)
        delete_result = await db.execute(delete_query)
        old_tags = delete_result.scalars().all()

        for old_tag in old_tags:
            await db.delete(old_tag)

        # 4. 新增新標籤
        for tag in unique_tags:
            new_tag = ReadingTag(
                reading_id=reading.id,  # Use UUID directly
                tag=tag
            )
            db.add(new_tag)

        # 5. 提交變更
        await db.commit()
        await db.refresh(reading)

        logger.info(
            f"Updated tags for reading {reading_id} (user {current_user.id}): "
            f"{len(old_tags)} -> {len(unique_tags)} tags"
        )

        # 6. 返回完整的解讀記錄（與 get_reading 端點相同的邏輯）
        # Fetch card positions
        card_positions_query = (
            select(ReadingCardPositionModel)
            .options(selectinload(ReadingCardPositionModel.card))
            .where(ReadingCardPositionModel.completed_reading_id == reading_id)
            .order_by(ReadingCardPositionModel.draw_order)
        )
        card_positions_result = await db.execute(card_positions_query)
        card_positions = card_positions_result.scalars().all()

        card_positions_data = [
            CardPosition(
                position_number=pos.position_number,
                position_name=pos.position_name,
                position_meaning=pos.position_meaning,
                card_id=str(pos.card_id),
                is_reversed=pos.is_reversed,
                draw_order=pos.draw_order,
                radiation_influence=pos.radiation_influence,
                card=WastelandCard(**pos.card.to_dict()) if pos.card else None,
                position_interpretation=pos.position_interpretation,
                card_significance=pos.card_significance,
                connection_to_question=pos.connection_to_question,
                user_resonance=pos.user_resonance,
                interpretation_confidence=pos.interpretation_confidence
            ) for pos in card_positions
        ]

        # Fetch spread template
        spread_template_data = None
        if reading.spread_template_id:
            spread_query = select(SpreadTemplateModel).where(
                SpreadTemplateModel.id == reading.spread_template_id
            )
            spread_result = await db.execute(spread_query)
            spread_template = spread_result.scalar_one_or_none()

            if spread_template:
                spread_template_data = SpreadTemplate(**spread_template.to_dict())

        # Fallback if no spread template found
        if not spread_template_data:
            spread_template_data = SpreadTemplate(
                id=str(reading.spread_template_id) if reading.spread_template_id else "unknown",
                name="unknown_spread",
                display_name="未知牌陣",
                description="找不到牌陣模板",
                spread_type="custom_spread",
                card_count=1,
                positions=[],
                difficulty_level="beginner"
            )

        # Convert to response model
        reading_dict = {
            "id": str(reading.id),
            "user_id": str(reading.user_id),
            "question": reading.question,
            "focus_area": reading.focus_area,
            "context_notes": reading.context_notes,
            "spread_template": spread_template_data,
            "character_voice_used": CharacterVoice(reading.character_voice_used),
            "karma_context": KarmaAlignment(reading.karma_context),
            "faction_influence": reading.faction_influence,
            "radiation_factor": reading.radiation_factor,
            "card_positions": card_positions_data,
            "overall_interpretation": reading.overall_interpretation,
            "summary_message": reading.summary_message,
            "prediction_confidence": reading.prediction_confidence,
            "energy_reading": reading.energy_reading,
            "ai_interpretation_requested": reading.ai_interpretation_requested,
            "ai_interpretation_at": reading.ai_interpretation_at,
            "ai_interpretation_provider": reading.ai_interpretation_provider,
            "interpretation_audio_url": reading.interpretation_audio_url,
            "session_duration": reading.session_duration,
            "start_time": reading.start_time,
            "end_time": reading.end_time,
            "privacy_level": PrivacyLevel(reading.privacy_level) if reading.privacy_level else PrivacyLevel.PRIVATE,
            "allow_public_sharing": reading.allow_public_sharing,
            "is_favorite": reading.is_favorite,
            "user_satisfaction": reading.user_satisfaction,
            "accuracy_rating": reading.accuracy_rating,
            "helpful_rating": reading.helpful_rating,
            "likes_count": reading.likes_count,
            "shares_count": reading.shares_count,
            "comments_count": reading.comments_count,
            "created_at": reading.created_at,
            "updated_at": reading.updated_at
        }

        return ReadingSession(**reading_dict)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tags for reading {reading_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update tags: {str(e)}")


@router.get(
    "/tags",
    response_model=List[TagWithCount],
    summary="列出使用者所有標籤",
    description="""
    **列出使用者所有標籤及使用統計**

    功能：
    - 列出使用者所有已使用的標籤
    - 顯示每個標籤的使用次數
    - 按使用次數降序排列

    返回格式：
    ```json
    [
        {"tag": "愛情", "count": 12},
        {"tag": "事業", "count": 8},
        {"tag": "健康", "count": 5}
    ]
    ```

    適用於：
    - 標籤管理介面
    - 篩選條件顯示
    - 使用者行為分析
    """,
    responses={
        200: {"description": "成功返回標籤列表"},
        500: {"description": "查詢失敗"}
    }
)
async def list_user_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[TagWithCount]:
    """
    列出使用者所有標籤及使用統計

    返回格式：[{"tag": "愛情", "count": 12}, ...]
    按使用次數降序排列
    """
    try:
        # 使用 SQLAlchemy 查詢標籤統計
        query = (
            select(
                ReadingTag.tag,
                func.count(ReadingTag.id).label('count')
            )
            .join(
                ReadingSessionModel,
                ReadingTag.reading_id == ReadingSessionModel.id
            )
            .where(ReadingSessionModel.user_id == current_user.id)
            .group_by(ReadingTag.tag)
            .order_by(desc('count'))
        )

        result = await db.execute(query)
        tag_stats = result.all()

        tags_list = [
            TagWithCount(tag=tag, count=count)
            for tag, count in tag_stats
        ]

        logger.info(f"Retrieved {len(tags_list)} tags for user {current_user.id}")
        return tags_list

    except Exception as e:
        logger.error(f"Error retrieving tags for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve tags")