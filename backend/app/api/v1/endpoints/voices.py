"""
廢土塔羅角色聲音 API 端點
角色聲音管理與解讀服務
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
import logging

from app.db.session import get_db
from app.models.reading_enhanced import InterpretationTemplate as InterpretationTemplateModel
from app.schemas.voices import (
    CharacterVoiceTemplate,
    CharacterTemplate,
    VoiceInterpretationRequest,
    VoiceInterpretationResponse,
    VoiceListResponse,
    VoiceUsageStats,
    VoiceComparisonRequest,
    VoiceComparisonResponse,
    CustomVoiceRequest,
    VoiceFeedback,
    VoiceRecommendationRequest,
    VoiceRecommendationResponse,
    CharacterVoiceSettings,
    VoiceTone,
    VocabularyStyle,
    HumorStyle,
    ResponseLength,
    DetailLevel
)
from app.schemas.cards import CharacterVoice, FactionAlignment

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/",
    response_model=VoiceListResponse,
    summary="取得可用的角色聲音",
    description="""
    **探索所有可用於塔羅解讀的角色聲音**

    探索完整的 Fallout 角色陣容：

    - **Pip-Boy 3000（嗶嗶小子 3000）**：技術分析與統計洞察
    - **Vault Dweller（避難所居民）**：樂觀與充滿希望的觀點
    - **Wasteland Trader（廢土商人）**：實用智慧與生存建議
    - **Super Mutant（超級變種人）**：簡單、直接且強大的解讀
    - **Codsworth（科茲沃斯）**：精緻的英式幽默與禮貌觀察
    - **更多角色...**：來自 Fallout 宇宙的額外角色

    每個角色聲音提供：
    - 獨特的個性特質與說話模式
    - 派系特定的觀點與專業知識
    - 可自訂的回應長度與細節程度
    - 豐富的 Fallout 背景整合
    - 社群評分與回饋

    適用於：
    - 角色選擇介面
    - 聲音比較工具
    - 個人化設定
    - 社群探索
    """,
    response_description="完整的角色聲音清單及詳細資訊",
    responses={
        200: {"description": "成功取得角色聲音"},
        500: {"description": "取得角色聲音失敗"}
    }
)
async def get_character_voices(
    include_inactive: bool = Query(default=False, description="包含停用的聲音"),
    include_beta: bool = Query(default=False, description="包含測試版聲音"),
    include_premium: bool = Query(default=True, description="包含進階聲音"),
    faction_filter: Optional[FactionAlignment] = Query(None, description="依派系陣營篩選"),
    tone_filter: Optional[VoiceTone] = Query(None, description="依聲音語氣篩選"),
    sort_by: str = Query(default="usage_count", description="排序方式：usage_count、average_rating、name"),
    sort_order: str = Query(default="desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
) -> VoiceListResponse:
    """取得可用角色聲音清單並支援篩選。"""
    try:
        # Build query
        query = select(InterpretationTemplateModel)
        conditions = []

        # Base filters
        if not include_inactive:
            conditions.append(InterpretationTemplateModel.is_active == True)

        if not include_beta:
            conditions.append(InterpretationTemplateModel.is_beta == False)

        if not include_premium:
            conditions.append(InterpretationTemplateModel.is_premium == False)

        # Additional filters
        if faction_filter:
            conditions.append(InterpretationTemplateModel.faction_alignment == faction_filter.value)

        if tone_filter:
            conditions.append(InterpretationTemplateModel.tone == tone_filter.value)

        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))

        # Apply sorting
        sort_column = getattr(InterpretationTemplateModel, sort_by, InterpretationTemplateModel.usage_count)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        # Execute query
        result = await db.execute(query)
        voices_data = result.scalars().all()

        # Convert to response models
        voices = []
        for voice_data in voices_data:
            voice_dict = voice_data.to_dict()
            voices.append(CharacterVoiceTemplate(**voice_dict))

        # Calculate counts
        total_count = len(voices)
        active_count = len([v for v in voices if v.is_active])
        premium_count = len([v for v in voices if v.is_premium])

        return VoiceListResponse(
            voices=voices,
            total_count=total_count,
            active_count=active_count,
            premium_count=premium_count
        )

    except Exception as e:
        logger.error(f"Error retrieving character voices: {str(e)}")
        raise HTTPException(status_code=500, detail="取得角色聲音失敗")


@router.get(
    "/{character_voice}",
    response_model=CharacterVoiceTemplate,
    summary="取得角色聲音詳細資訊",
    description="""
    **Get detailed information about a specific character voice**

    Comprehensive character profile including:

    - **Personality Traits**: Core characteristics and behavior patterns
    - **Speaking Patterns**: Common phrases and communication style
    - **Technical Expertise**: Areas of specialized knowledge
    - **Faction Alignment**: Political and organizational loyalties
    - **Response Templates**: Pre-built interpretation frameworks
    - **Usage Statistics**: Community adoption and satisfaction metrics
    - **Fallout References**: Lore integration and universe connections

    Perfect for:
    - Character selection interfaces
    - Voice preview and comparison
    - Customization settings
    - Understanding voice capabilities
    """,
    response_description="Complete character voice profile",
    responses={
        200: {"description": "Successfully retrieved character voice"},
        404: {"description": "Character voice not found"},
        500: {"description": "Failed to retrieve character voice"}
    }
)
async def get_character_voice(
    character_voice: CharacterVoice = Path(..., description="Character voice identifier"),
    include_templates: bool = Query(default=True, description="Include interpretation templates"),
    include_stats: bool = Query(default=True, description="Include usage statistics"),
    db: AsyncSession = Depends(get_db)
) -> CharacterVoiceTemplate:
    """Get detailed information for a specific character voice."""
    try:
        query = select(InterpretationTemplateModel).where(
            InterpretationTemplateModel.character_voice == character_voice.value
        )
        result = await db.execute(query)
        voice_data = result.scalar_one_or_none()

        if not voice_data:
            raise HTTPException(
                status_code=404,
                detail=f"Character voice '{character_voice.value}' not found in vault records"
            )

        # Convert to response model
        voice_dict = voice_data.to_dict()

        # Optionally exclude certain fields
        if not include_templates:
            voice_dict.pop('templates', None)

        if not include_stats:
            voice_dict.pop('usage_count', None)
            voice_dict.pop('user_ratings', None)
            voice_dict.pop('average_rating', None)

        return CharacterVoiceTemplate(**voice_dict)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving character voice {character_voice}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve character voice")


@router.post(
    "/interpret",
    response_model=VoiceInterpretationResponse,
    summary="取得角色聲音解讀",
    description="""
    **Generate character-specific interpretation for card data**

    Request detailed interpretation from any character voice:

    - **Context-Aware**: Considers question, karma, and situation
    - **Position-Specific**: Adapts to spread position meaning
    - **Personality-Driven**: True to character voice and traits
    - **Customizable**: Adjustable response length and detail level
    - **Confidence-Rated**: AI confidence assessment included

    Character voices provide unique perspectives:
    - **Pip-Boy**: "Statistical analysis indicates 73.2% probability..."
    - **Super Mutant**: "CARD MEANS GOOD THINGS COMING. STAY STRONG."
    - **Codsworth**: "I do believe this indicates rather promising developments..."
    - **Wasteland Trader**: "Smart caps say you're on the right track..."

    Perfect for:
    - Reading generation systems
    - Character voice comparisons
    - Interactive divination tools
    - Immersive storytelling
    """,
    response_description="Character-specific interpretation with confidence metrics",
    responses={
        200: {"description": "Successfully generated interpretation"},
        404: {"description": "Character voice not found"},
        422: {"description": "Invalid interpretation parameters"},
        500: {"description": "Failed to generate interpretation"}
    }
)
async def get_voice_interpretation(
    interpretation_request: VoiceInterpretationRequest = Body(
        ...,
        example={
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
    ),
    db: AsyncSession = Depends(get_db)
) -> VoiceInterpretationResponse:
    """Generate character-specific interpretation for card data."""
    try:
        # Get character voice template
        query = select(InterpretationTemplateModel).where(
            InterpretationTemplateModel.character_voice == interpretation_request.character_voice.value
        )
        result = await db.execute(query)
        voice_template = result.scalar_one_or_none()

        if not voice_template:
            raise HTTPException(
                status_code=404,
                detail=f"Character voice '{interpretation_request.character_voice.value}' not available"
            )

        # Generate interpretation based on character voice
        card_name = interpretation_request.card_data.get("name", "Unknown Card")
        base_meaning = interpretation_request.card_data.get("upright_meaning", "")
        radiation_level = interpretation_request.card_data.get("radiation_level", 0.0)

        # Character-specific interpretation generation
        character = interpretation_request.character_voice
        interpretation = ""
        style_notes = []
        fallout_references = []
        personality_elements = []

        if character == CharacterVoice.PIP_BOY:
            interpretation = f"""Data Analysis Complete: {card_name}

Statistical assessment indicates: {base_meaning}

Current radiation readings: {radiation_level:.1%} - within acceptable parameters for standard operations.

Probability calculations suggest this card represents significant variables in your current situation. Recommend implementing suggested actions with 73.2% confidence rating.

System recommendation: {interpretation_request.question or 'Proceed with calculated optimism'}"""

            style_notes = ["technical language", "statistical references", "system recommendations"]
            fallout_references = ["radiation readings", "statistical analysis", "system protocols"]
            personality_elements = ["analytical", "helpful", "data-driven", "systematic"]

        elif character == CharacterVoice.SUPER_MUTANT:
            interpretation = f"""{card_name.upper()} CARD CHOSEN.

CARD MEANS: {base_meaning.upper()}

SUPER MUTANT KNOWS: SIMPLE TRUTH BEST TRUTH.

YOU ASK ABOUT: {interpretation_request.question or 'LIFE THINGS'}.
ANSWER IS: DO GOOD THINGS. HELP FRIENDS. BE STRONG."""

            style_notes = ["all caps emphasis", "simple language", "direct communication"]
            fallout_references = ["super mutant wisdom", "strength philosophy"]
            personality_elements = ["direct", "simple", "loyal", "strong"]

        elif character == CharacterVoice.CODSWORTH:
            interpretation = f"""Ah, the {card_name}! How delightfully intriguing, if I may say so.

I do believe this card suggests: {base_meaning}

Regarding your inquiry about {interpretation_request.question or 'your current circumstances'}, I daresay the wasteland has taught us that {card_name.lower()} energy indicates rather promising developments ahead.

If I might be so bold as to suggest, sir/madam, maintaining one's British resolve whilst embracing these indicated changes would be most advisable. Chin up, as we used to say before the world went rather topsy-turvy."""

            style_notes = ["polite formality", "British expressions", "optimistic outlook"]
            fallout_references = ["pre-war British culture", "wasteland observations"]
            personality_elements = ["polite", "optimistic", "proper", "helpful"]

        elif character == CharacterVoice.WASTELAND_TRADER:
            interpretation = f"""Alright, {card_name} - now that's a card worth its weight in caps.

Here's the deal: {base_meaning}

You're asking about {interpretation_request.question or 'your situation'}, and smart money says this card's got the answer. I've been trading across the wasteland long enough to know when something's got value, and this reading? This has value.

My advice? {card_name} energy means opportunity's knocking. Keep your caps close, your friends closer, and trust your gut. The wasteland rewards those who can read the signs."""

            style_notes = ["conversational tone", "trading metaphors", "practical advice"]
            fallout_references = ["caps", "wasteland trading", "survival wisdom"]
            personality_elements = ["practical", "experienced", "trustworthy", "wise"]

        elif character == CharacterVoice.VAULT_DWELLER:
            interpretation = f"""Looking at {card_name}, I can't help but think about my own journey from the vault.

This card represents: {base_meaning}

When you ask about {interpretation_request.question or 'your path forward'}, I see the same kind of crossroads I faced when I first stepped into the wasteland. {card_name} suggests that every ending is really a new beginning.

The vault taught us to be prepared, but the wasteland taught us to adapt. Trust in your journey - you're stronger than you know, and the path ahead, while uncertain, is yours to shape."""

            style_notes = ["personal reflection", "hopeful outlook", "journey metaphors"]
            fallout_references = ["vault life", "wasteland journey", "personal growth"]
            personality_elements = ["hopeful", "reflective", "brave", "empathetic"]

        else:
            # Fallback interpretation
            interpretation = f"{card_name}: {base_meaning}"
            style_notes = ["standard interpretation"]
            personality_elements = ["neutral"]

        # Calculate confidence based on various factors
        confidence = 0.8
        if voice_template.usage_count > 100:
            confidence += 0.1
        if interpretation_request.context:
            confidence += 0.05
        if interpretation_request.question:
            confidence += 0.05

        confidence = min(confidence, 1.0)

        return VoiceInterpretationResponse(
            character_voice=interpretation_request.character_voice,
            interpretation=interpretation.strip(),
            style_notes=style_notes,
            confidence=confidence,
            fallout_references_used=fallout_references,
            personality_elements=personality_elements
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating voice interpretation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate interpretation")


@router.post(
    "/compare",
    response_model=VoiceComparisonResponse,
    summary="比較聲音解讀",
    description="""
    **Compare how different character voices interpret the same card**

    Side-by-side comparison of multiple character perspectives:

    - **Multiple Voices**: Compare 2-5 character voices simultaneously
    - **Same Card Context**: Identical card and situation data
    - **Style Analysis**: Detailed comparison of interpretation approaches
    - **Personality Insights**: How character traits influence readings
    - **Recommendation**: AI-suggested best voice for the context

    Perfect for:
    - Voice selection tools
    - Educational demonstrations
    - User preference discovery
    - Character voice showcasing
    - Research and analysis
    """,
    response_description="Comparative analysis of multiple voice interpretations",
    responses={
        200: {"description": "Successfully generated voice comparison"},
        422: {"description": "Invalid comparison parameters"},
        500: {"description": "Failed to generate comparison"}
    }
)
async def compare_voice_interpretations(
    comparison_request: VoiceComparisonRequest = Body(
        ...,
        example={
            "card_data": {
                "name": "The Wanderer",
                "upright_meaning": "New beginnings, journey into the unknown"
            },
            "voices": ["pip_boy", "super_mutant", "codsworth"],
            "context": {"karma_alignment": "neutral"},
            "question": "What should I focus on this week?"
        }
    ),
    db: AsyncSession = Depends(get_db)
) -> VoiceComparisonResponse:
    """Compare interpretations across multiple character voices."""
    try:
        interpretations = []
        style_differences = {}

        # Generate interpretation for each voice
        for voice in comparison_request.voices:
            # Create interpretation request for this voice
            voice_request = VoiceInterpretationRequest(
                character_voice=voice,
                card_data=comparison_request.card_data,
                context=comparison_request.context,
                question=comparison_request.question
            )

            # Get interpretation (reuse the interpretation logic)
            voice_interpretation = await get_voice_interpretation(voice_request, db)
            interpretations.append(voice_interpretation)

            # Track style differences
            style_differences[voice.value] = voice_interpretation.style_notes

        # Generate comparison insights
        comparison_insights = [
            f"Compared {len(interpretations)} different character perspectives",
            f"Each voice brings unique {comparison_request.card_data.get('name', 'card')} insights",
        ]

        if any("technical" in notes for notes in style_differences.values()):
            comparison_insights.append("Technical analysis available from Pip-Boy")

        if any("simple" in notes for notes in style_differences.values()):
            comparison_insights.append("Direct, straightforward guidance from Super Mutant")

        if any("polite" in notes for notes in style_differences.values()):
            comparison_insights.append("Refined British perspective from Codsworth")

        # Recommend best voice based on context
        recommended_voice = comparison_request.voices[0]  # Default to first

        # Simple recommendation logic
        question_lower = (comparison_request.question or "").lower()
        if "technical" in question_lower or "analyze" in question_lower:
            if CharacterVoice.PIP_BOY in comparison_request.voices:
                recommended_voice = CharacterVoice.PIP_BOY
        elif "simple" in question_lower or "direct" in question_lower:
            if CharacterVoice.SUPER_MUTANT in comparison_request.voices:
                recommended_voice = CharacterVoice.SUPER_MUTANT

        return VoiceComparisonResponse(
            card_data=comparison_request.card_data,
            interpretations=interpretations,
            comparison_insights=comparison_insights,
            style_differences=style_differences,
            recommended_voice=recommended_voice
        )

    except Exception as e:
        logger.error(f"Error comparing voice interpretations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compare voice interpretations")


@router.post(
    "/recommendations",
    response_model=VoiceRecommendationResponse,
    summary="取得聲音推薦",
    description="""
    **Get personalized character voice recommendations**

    Intelligent recommendation system considers:

    - **Question Type**: Technical vs. emotional vs. practical inquiries
    - **User Mood**: Current emotional state and preferences
    - **Communication Style**: Preferred tone and approach
    - **Experience Level**: Beginner-friendly vs. advanced interpretations
    - **Faction Preference**: Political and organizational alignments
    - **Usage History**: Previously used and avoided voices

    Perfect for:
    - First-time user onboarding
    - Adaptive interface personalization
    - Mood-based voice selection
    - Discovery and exploration tools
    """,
    response_description="Personalized voice recommendations with reasoning",
    responses={
        200: {"description": "Successfully generated recommendations"},
        422: {"description": "Invalid recommendation parameters"},
        500: {"description": "Failed to generate recommendations"}
    }
)
async def get_voice_recommendations(
    recommendation_request: VoiceRecommendationRequest = Body(
        ...,
        example={
            "question_type": "technical",
            "mood": "curious",
            "preferred_style": "analytical",
            "experience_level": "intermediate",
            "faction_preference": "vault_dweller",
            "count": 3
        }
    ),
    db: AsyncSession = Depends(get_db)
) -> VoiceRecommendationResponse:
    """Get personalized character voice recommendations."""
    try:
        # Get all active voices
        query = select(InterpretationTemplateModel).where(InterpretationTemplateModel.is_active == True)
        result = await db.execute(query)
        available_voices = result.scalars().all()

        recommendations = []
        match_explanations = {}

        for voice in available_voices:
            if CharacterVoice(voice.character_voice) in recommendation_request.avoid_voices:
                continue

            match_score = 0.0
            reasons = []

            # Question type matching
            if recommendation_request.question_type:
                if recommendation_request.question_type == "technical" and voice.character_voice == "pip_boy":
                    match_score += 0.4
                    reasons.append("Perfect for technical questions")
                elif recommendation_request.question_type == "practical" and voice.character_voice == "wasteland_trader":
                    match_score += 0.3
                    reasons.append("Excellent practical advice")
                elif recommendation_request.question_type == "emotional" and voice.character_voice == "vault_dweller":
                    match_score += 0.3
                    reasons.append("Empathetic perspective")

            # Mood matching
            if recommendation_request.mood:
                if recommendation_request.mood == "serious" and voice.character_voice == "pip_boy":
                    match_score += 0.2
                elif recommendation_request.mood == "playful" and voice.character_voice == "codsworth":
                    match_score += 0.2
                elif recommendation_request.mood == "direct" and voice.character_voice == "super_mutant":
                    match_score += 0.2

            # Style preference matching
            if recommendation_request.preferred_style:
                if str(recommendation_request.preferred_style) == voice.tone:
                    match_score += 0.3
                    reasons.append(f"Matches your preferred {recommendation_request.preferred_style} style")

            # Faction alignment
            if recommendation_request.faction_preference:
                if voice.faction_alignment == recommendation_request.faction_preference.value:
                    match_score += 0.2
                    reasons.append(f"Aligned with {recommendation_request.faction_preference.value}")

            # Experience level
            if recommendation_request.experience_level:
                if recommendation_request.experience_level == "beginner":
                    if voice.character_voice in ["vault_dweller", "codsworth"]:
                        match_score += 0.1
                        reasons.append("Beginner-friendly approach")
                elif recommendation_request.experience_level == "advanced":
                    if voice.character_voice == "pip_boy":
                        match_score += 0.1
                        reasons.append("Advanced analytical capabilities")

            # Usage and rating bonus
            if voice.average_rating > 4.0:
                match_score += 0.1
                reasons.append("Highly rated by community")

            if match_score > 0.2:
                character_voice = CharacterVoice(voice.character_voice)
                recommendations.append({
                    "voice": character_voice,
                    "match_score": min(match_score, 1.0),
                    "reasons": reasons
                })
                match_explanations[character_voice] = f"Score: {match_score:.2f} - " + ", ".join(reasons)

        # Sort by match score and limit results
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        recommendations = recommendations[:recommendation_request.count]

        # Suggest alternatives
        all_voices = [CharacterVoice(v.character_voice) for v in available_voices]
        recommended_voices = [r["voice"] for r in recommendations]
        alternative_suggestions = [v for v in all_voices if v not in recommended_voices][:3]

        return VoiceRecommendationResponse(
            recommendations=recommendations,
            match_explanations=match_explanations,
            alternative_suggestions=alternative_suggestions
        )

    except Exception as e:
        logger.error(f"Error generating voice recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate voice recommendations")


@router.post(
    "/feedback",
    status_code=204,
    summary="提交聲音回饋",
    description="""
    **Provide feedback on character voice performance**

    Help improve character voices by submitting detailed feedback:

    - **Overall Rating**: 1-5 star rating for voice quality
    - **Specific Aspects**: Rate accuracy, personality, helpfulness, entertainment
    - **Written Feedback**: Detailed comments and observations
    - **Improvement Suggestions**: Ideas for enhancement

    Feedback helps:
    - Improve AI interpretation quality
    - Refine character personalities
    - Enhance user satisfaction
    - Guide development priorities
    """,
    responses={
        204: {"description": "Feedback submitted successfully"},
        422: {"description": "Invalid feedback data"},
        500: {"description": "Failed to submit feedback"}
    }
)
async def submit_voice_feedback(
    feedback: VoiceFeedback = Body(
        ...,
        example={
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
    ),
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback for a character voice."""
    try:
        # Get character voice template
        query = select(InterpretationTemplateModel).where(
            InterpretationTemplateModel.character_voice == feedback.character_voice.value
        )
        result = await db.execute(query)
        voice_template = result.scalar_one_or_none()

        if not voice_template:
            raise HTTPException(
                status_code=404,
                detail=f"Character voice '{feedback.character_voice.value}' not found"
            )

        # Update rating
        if not voice_template.user_ratings:
            voice_template.user_ratings = []

        voice_template.user_ratings.append(feedback.rating)

        # Recalculate average rating
        if voice_template.user_ratings:
            voice_template.average_rating = sum(voice_template.user_ratings) / len(voice_template.user_ratings)

        await db.commit()

        logger.info(f"Received feedback for {feedback.character_voice.value}: {feedback.rating}/5")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting voice feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")