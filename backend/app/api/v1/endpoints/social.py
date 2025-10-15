"""
Social API endpoints for Wasteland Tarot
Community features, sharing, and social interactions
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
import logging

from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.social import (
    SharedReading,
    Comment,
    CreateCommentRequest,
    SocialAction,
    UserSocialProfile,
    ShareReadingRequest,
    CommunityFeed,
    FeedFilters,
    UserInteraction,
    LeaderboardEntry,
    CommunityLeaderboards,
    ReportContentRequest,
    ModerationAction,
    CommunityStats,
    SocialActionType,
    ContentType,
    SocialStats
)
from app.schemas.cards import CharacterVoice, KarmaAlignment

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/feed",
    response_model=CommunityFeed,
    summary="Get Community Feed",
    description="""
    **Discover shared readings and community content**

    Explore the vibrant Wasteland Tarot community:

    - **Recent Shares**: Latest readings shared by community members
    - **Featured Content**: Moderator-highlighted exceptional readings
    - **Trending Tags**: Popular themes and topics in the community
    - **Community Stats**: Overall activity and engagement metrics

    Feed content includes:
    - Shared tarot readings with interpretations
    - Character voice demonstrations
    - Spread reviews and recommendations
    - User achievements and milestones

    Content is filtered for:
    - Community guidelines compliance
    - Quality and relevance
    - User preferences and karma alignment
    - Appropriate content ratings

    Perfect for:
    - Community discovery
    - Inspiration and learning
    - Social engagement
    - Trending content exploration
    """,
    response_description="Community feed with shared content and statistics",
    responses={
        200: {"description": "Successfully retrieved community feed"},
        500: {"description": "Failed to load community feed"}
    }
)
async def get_community_feed(
    character_voice: Optional[CharacterVoice] = Query(None, description="Filter by character voice"),
    karma_alignment: Optional[KarmaAlignment] = Query(None, description="Filter by karma alignment"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
    min_likes: Optional[int] = Query(None, ge=0, description="Minimum number of likes"),
    hours_back: int = Query(default=72, ge=1, le=720, description="Hours of content history"),
    followed_only: bool = Query(default=False, description="Show only followed users' content"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
) -> CommunityFeed:
    """Get community feed with shared readings and content."""
    try:
        # Mock data for community feed
        # In production, this would query actual shared readings from the database

        # Recent shared readings (mock data)
        shared_readings = [
            SharedReading(
                id="share-001",
                reading_id="reading-001",
                user_id="user-vault76",
                username="VaultDweller76",
                question="Should I leave the vault?",
                character_voice_used=CharacterVoice.VAULT_DWELLER,
                karma_context=KarmaAlignment.GOOD,
                shared_interpretation="The cards encourage taking brave steps into the unknown. The wasteland awaits, but you're prepared.",
                cards_revealed=["past", "present", "future"],
                title="Finally ready to explore the wasteland!",
                description="After months of vault life, the cards are telling me it's time to step outside.",
                tags=["first-journey", "vault-life", "courage"],
                social_stats=SocialStats(
                    likes_count=23,
                    shares_count=3,
                    comments_count=7,
                    bookmarks_count=12,
                    views_count=89
                ),
                shared_at=datetime.now() - timedelta(hours=2),
                reading_date=datetime.now() - timedelta(hours=3),
                allow_comments=True,
                is_featured=False
            ),
            SharedReading(
                id="share-002",
                reading_id="reading-002",
                user_id="user-trader",
                username="WastelandTrader",
                question="Is this trade deal worth it?",
                character_voice_used=CharacterVoice.WASTELAND_TRADER,
                karma_context=KarmaAlignment.NEUTRAL,
                shared_interpretation="Smart caps say this deal has potential, but watch for hidden costs. Trust your instincts.",
                cards_revealed=["opportunity", "risk", "outcome"],
                title="Reading the market like reading the cards",
                description="Sometimes the best business advice comes from the most unexpected sources.",
                tags=["trading", "business", "opportunity"],
                social_stats=SocialStats(
                    likes_count=18,
                    shares_count=5,
                    comments_count=4,
                    bookmarks_count=8,
                    views_count=67
                ),
                shared_at=datetime.now() - timedelta(hours=6),
                reading_date=datetime.now() - timedelta(hours=7),
                allow_comments=True,
                is_featured=True
            )
        ]

        # Featured content (subset of shared readings marked as featured)
        featured_content = [reading for reading in shared_readings if reading.is_featured]

        # Trending tags (mock data)
        trending_tags = [
            "vault-life",
            "wasteland-wisdom",
            "new-beginnings",
            "survival",
            "brotherhood",
            "trading",
            "karma-choices",
            "radiation-effects"
        ]

        # Community stats (mock data)
        community_stats = {
            "total_shared_readings": 1247,
            "active_users_today": 89,
            "total_likes_given": 5432,
            "total_comments": 1876,
            "featured_content_count": 23
        }

        return CommunityFeed(
            shared_readings=shared_readings[:page_size],
            featured_content=featured_content,
            trending_tags=trending_tags,
            community_stats=community_stats
        )

    except Exception as e:
        logger.error(f"Error retrieving community feed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load community feed")


@router.post(
    "/share",
    response_model=SharedReading,
    status_code=201,
    summary="Share Reading Publicly",
    description="""
    **Share your tarot reading with the community**

    Make your insights available to fellow vault dwellers:

    - **Selective Sharing**: Choose which cards and positions to reveal
    - **Custom Titles**: Add compelling titles to attract viewers
    - **Tag System**: Categorize your reading for discoverability
    - **Privacy Controls**: Enable/disable comments and interactions
    - **Community Guidelines**: Content automatically screened

    Sharing benefits:
    - Help other community members learn
    - Receive feedback and alternative perspectives
    - Build reputation and social connections
    - Contribute to collective wasteland wisdom

    Perfect for:
    - Meaningful readings worth sharing
    - Educational demonstrations
    - Community building
    - Seeking additional insights
    """,
    response_description="Successfully shared reading with community metadata",
    responses={
        201: {"description": "Reading successfully shared"},
        404: {"description": "Original reading not found"},
        422: {"description": "Invalid sharing parameters"},
        500: {"description": "Failed to share reading"}
    }
)
async def share_reading(
    share_request: ShareReadingRequest = Body(
        ...,
        example={
            "reading_id": "reading-12345",
            "title": "Amazing guidance for career transition",
            "description": "The cards provided exactly the insight I needed for my big decision",
            "cards_to_reveal": ["past", "present", "future"],
            "include_full_interpretation": False,
            "tags": ["career", "transition", "guidance"],
            "allow_comments": True
        }
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> SharedReading:
    """Share a reading publicly with the community."""
    try:
        # Validate that user owns the reading (simplified)
        # In production, verify reading ownership and privacy settings

        # Create shared reading (mock implementation)
        shared_reading = SharedReading(
            id=f"share-{len(share_request.reading_id)}",  # Mock ID generation
            reading_id=share_request.reading_id,
            user_id=current_user.id,
            username=current_user.name,
            question="What should I focus on this week?",  # Would come from actual reading
            character_voice_used=CharacterVoice.PIP_BOY,  # Would come from actual reading
            karma_context=KarmaAlignment.NEUTRAL,  # Would come from actual reading
            shared_interpretation="The cards reveal important insights about timing and opportunity...",
            cards_revealed=share_request.cards_to_reveal,
            title=share_request.title or "Shared Reading",
            description=share_request.description,
            tags=share_request.tags,
            social_stats=SocialStats(),
            shared_at=datetime.now(),
            reading_date=datetime.now() - timedelta(hours=1),
            allow_comments=share_request.allow_comments,
            is_featured=False
        )

        logger.info(f"Reading {share_request.reading_id} shared by {current_user.name}")
        return shared_reading

    except Exception as e:
        logger.error(f"Error sharing reading: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to share reading")


@router.get(
    "/shared/{shared_reading_id}",
    response_model=SharedReading,
    summary="Get Shared Reading Details",
    description="""
    **View detailed information about a shared reading**

    Access complete shared reading information:

    - **Reading Content**: Cards, positions, and interpretations
    - **Community Engagement**: Likes, shares, comments, and bookmarks
    - **User Context**: Sharer information and sharing motivation
    - **Interaction History**: Community responses and discussions
    - **Related Content**: Similar readings and recommendations

    Perfect for:
    - Reading detail pages
    - Community engagement interfaces
    - Social sharing features
    - Learning and inspiration tools
    """,
    response_description="Complete shared reading with engagement data"
)
async def get_shared_reading(
    shared_reading_id: str = Path(..., description="Shared reading ID"),
    include_interactions: bool = Query(default=True, description="Include user interactions"),
    db: AsyncSession = Depends(get_db)
) -> SharedReading:
    """Get detailed information about a shared reading."""
    try:
        # Mock shared reading data
        # In production, this would query the database for the specific shared reading

        shared_reading = SharedReading(
            id=shared_reading_id,
            reading_id="reading-original-123",
            user_id="user-sharer",
            username="WastelandWisdom",
            question="How can I help rebuild civilization?",
            character_voice_used=CharacterVoice.VAULT_DWELLER,
            karma_context=KarmaAlignment.GOOD,
            shared_interpretation="""The cards speak of hope and renewal in the wasteland.

The Past shows the Foundation card - the knowledge and values preserved in the vaults serve as bedrock for rebuilding. Your technical skills and ethical foundation are assets.

The Present reveals the Community card - working with others multiplies your impact. No one rebuilds civilization alone.

The Future holds the New Dawn card - your efforts will contribute to something greater than yourself, bringing light to the wasteland.""",
            cards_revealed=["past", "present", "future"],
            title="Finding purpose in the post-apocalyptic world",
            description="After leaving Vault 101, I struggled with my role in the wasteland. This reading gave me the clarity I needed.",
            tags=["purpose", "rebuilding", "community", "hope"],
            social_stats=SocialStats(
                likes_count=45,
                shares_count=12,
                comments_count=18,
                bookmarks_count=23,
                views_count=234
            ),
            shared_at=datetime.now() - timedelta(hours=12),
            reading_date=datetime.now() - timedelta(hours=13),
            allow_comments=True,
            is_featured=True
        )

        return shared_reading

    except Exception as e:
        logger.error(f"Error retrieving shared reading {shared_reading_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve shared reading")


@router.post(
    "/shared/{shared_reading_id}/like",
    status_code=204,
    summary="Like Shared Reading",
    description="""
    **Like or unlike a shared reading**

    Show appreciation for community content:

    - **Toggle Likes**: Like/unlike with single action
    - **Real-time Updates**: Immediate feedback reflection
    - **User Tracking**: Prevent duplicate likes
    - **Reputation System**: Contributes to user reputation

    Helps build positive community interactions and highlight valuable content.
    """,
    responses={
        204: {"description": "Like action completed successfully"},
        404: {"description": "Shared reading not found"},
        409: {"description": "Already liked by this user"}
    }
)
async def like_shared_reading(
    shared_reading_id: str = Path(..., description="Shared reading ID"),
    unlike: bool = Query(default=False, description="Set to true to unlike"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Like or unlike a shared reading."""
    try:
        # In production, this would:
        # 1. Verify the shared reading exists
        # 2. Check if user already liked it
        # 3. Add/remove like record
        # 4. Update like count

        action = "unliked" if unlike else "liked"
        logger.info(f"User {current_user.name} {action} shared reading {shared_reading_id}")

    except Exception as e:
        logger.error(f"Error processing like action: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process like action")


@router.post(
    "/comments",
    response_model=Comment,
    status_code=201,
    summary="Add Comment",
    description="""
    **Comment on shared readings or other community content**

    Engage in meaningful discussions:

    - **Threaded Comments**: Reply to existing comments for organized discussions
    - **Content Types**: Comment on readings, interpretations, or reviews
    - **Community Guidelines**: Automatic content moderation
    - **User Reputation**: Comments affect community standing

    Perfect for:
    - Sharing alternative interpretations
    - Asking questions about readings
    - Providing encouragement and support
    - Building community connections
    """,
    response_description="Successfully created comment",
    responses={
        201: {"description": "Comment created successfully"},
        404: {"description": "Content to comment on not found"},
        422: {"description": "Invalid comment data"}
    }
)
async def create_comment(
    comment_request: CreateCommentRequest = Body(
        ...,
        example={
            "content_type": "reading",
            "content_id": "share-12345",
            "comment_text": "This reading really resonates with me! I had a similar experience when I left my vault.",
            "parent_comment_id": None
        }
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Comment:
    """Create a new comment on community content."""
    try:
        # Create comment (mock implementation)
        comment = Comment(
            id=f"comment-{datetime.now().timestamp()}",
            content_type=comment_request.content_type,
            content_id=comment_request.content_id,
            user_id=current_user.id,
            username=current_user.name,
            comment_text=comment_request.comment_text,
            parent_comment_id=comment_request.parent_comment_id,
            likes_count=0,
            replies_count=0,
            created_at=datetime.now(),
            updated_at=None,
            is_edited=False,
            is_reported=False,
            is_hidden=False
        )

        logger.info(f"Comment created by {current_user.name} on {comment_request.content_type} {comment_request.content_id}")
        return comment

    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create comment")


@router.get(
    "/shared/{shared_reading_id}/comments",
    response_model=List[Comment],
    summary="Get Reading Comments",
    description="""
    **Get all comments for a shared reading**

    View community discussions and feedback:

    - **Threaded Structure**: Organized comment hierarchy
    - **Pagination Support**: Handle large comment volumes
    - **Moderation Status**: Hidden/reported comments handled
    - **User Context**: Commenter information and reputation

    Perfect for:
    - Comment sections
    - Community engagement displays
    - Discussion analysis
    - Moderation interfaces
    """,
    response_description="List of comments with threading information"
)
async def get_reading_comments(
    shared_reading_id: str = Path(..., description="Shared reading ID"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at", description="Sort by: created_at, likes_count"),
    sort_order: str = Query(default="desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
) -> List[Comment]:
    """Get comments for a shared reading."""
    try:
        # Mock comment data
        comments = [
            Comment(
                id="comment-001",
                content_type=ContentType.READING,
                content_id=shared_reading_id,
                user_id="user-comment1",
                username="VaultExplorer",
                comment_text="This interpretation really helped me understand my own situation better. Thank you for sharing!",
                parent_comment_id=None,
                likes_count=5,
                replies_count=2,
                created_at=datetime.now() - timedelta(hours=2),
                updated_at=None,
                is_edited=False,
                is_reported=False,
                is_hidden=False
            ),
            Comment(
                id="comment-002",
                content_type=ContentType.READING,
                content_id=shared_reading_id,
                user_id="user-comment2",
                username="WastelandSage",
                comment_text="I've used the same character voice and got a completely different perspective. Fascinating how the cards adapt to each person's journey.",
                parent_comment_id=None,
                likes_count=3,
                replies_count=0,
                created_at=datetime.now() - timedelta(hours=4),
                updated_at=None,
                is_edited=False,
                is_reported=False,
                is_hidden=False
            )
        ]

        return comments[:page_size]

    except Exception as e:
        logger.error(f"Error retrieving comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve comments")


@router.get(
    "/leaderboards",
    response_model=CommunityLeaderboards,
    summary="Get Community Leaderboards",
    description="""
    **View community leaderboards and achievements**

    Celebrate top contributors across categories:

    - **Most Liked Shares**: Users with highest-rated shared content
    - **Most Helpful Comments**: Users providing valuable community feedback
    - **Most Active Sharers**: Prolific content contributors
    - **Rising Stars**: New users gaining rapid recognition
    - **Karma Champions**: Top contributors by karma alignment

    Recognition categories reward:
    - Quality content creation
    - Helpful community participation
    - Consistent positive engagement
    - Welcoming new members
    - Building inclusive community

    Perfect for:
    - Community recognition pages
    - Gamification features
    - User motivation systems
    - Community health metrics
    """,
    response_description="Community leaderboards across multiple categories"
)
async def get_community_leaderboards(
    timeframe: str = Query(default="month", regex="^(week|month|quarter|all)$", description="Leaderboard timeframe"),
    limit: int = Query(default=10, ge=5, le=50, description="Number of entries per leaderboard"),
    db: AsyncSession = Depends(get_db)
) -> CommunityLeaderboards:
    """Get community leaderboards across different categories."""
    try:
        # Mock leaderboard data
        # In production, this would calculate actual statistics from the database

        most_liked_shares = [
            LeaderboardEntry(
                user_id="user-top1",
                username="VaultLegend",
                display_name="The Vault Legend",
                score=234.5,
                rank=1,
                badge="Community Favorite"
            ),
            LeaderboardEntry(
                user_id="user-top2",
                username="WastelandWise",
                display_name="Wasteland Wisdom",
                score=198.2,
                rank=2,
                badge="Insight Master"
            )
        ]

        most_helpful_comments = [
            LeaderboardEntry(
                user_id="user-helper1",
                username="CommentGuru",
                display_name="The Helper",
                score=456.0,
                rank=1,
                badge="Community Support"
            )
        ]

        most_active_sharers = [
            LeaderboardEntry(
                user_id="user-active1",
                username="ShareMaster",
                display_name="Active Sharer",
                score=89.0,
                rank=1,
                badge="Content Creator"
            )
        ]

        rising_stars = [
            LeaderboardEntry(
                user_id="user-new1",
                username="NewVaultie",
                display_name="Rising Star",
                score=45.0,
                rank=1,
                badge="Rising Star"
            )
        ]

        karma_champions = {
            KarmaAlignment.GOOD: [
                LeaderboardEntry(
                    user_id="user-good1",
                    username="GoodKarmaChamp",
                    display_name="The Saint",
                    score=567.0,
                    rank=1,
                    badge="Good Karma Champion"
                )
            ],
            KarmaAlignment.NEUTRAL: [
                LeaderboardEntry(
                    user_id="user-neutral1",
                    username="BalancedUser",
                    display_name="The Balanced",
                    score=423.0,
                    rank=1,
                    badge="Neutral Karma Champion"
                )
            ],
            KarmaAlignment.EVIL: [
                LeaderboardEntry(
                    user_id="user-evil1",
                    username="DarkReader",
                    display_name="The Pragmatist",
                    score=356.0,
                    rank=1,
                    badge="Evil Karma Champion"
                )
            ]
        }

        return CommunityLeaderboards(
            most_liked_shares=most_liked_shares,
            most_helpful_comments=most_helpful_comments,
            most_active_sharers=most_active_sharers,
            rising_stars=rising_stars,
            karma_champions=karma_champions
        )

    except Exception as e:
        logger.error(f"Error retrieving leaderboards: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve community leaderboards")


@router.get(
    "/stats",
    response_model=CommunityStats,
    summary="Get Community Statistics",
    description="""
    **View overall community health and activity metrics**

    Comprehensive community analytics:

    - **Content Metrics**: Total shared readings and user contributions
    - **Engagement Stats**: Likes, comments, and interaction rates
    - **Activity Levels**: Active users and participation trends
    - **Popular Preferences**: Trending character voices and reading types
    - **Community Health**: Karma distribution and user satisfaction

    Perfect for:
    - Community dashboards
    - Health monitoring
    - Trend analysis
    - Growth tracking
    - Administrative insights
    """,
    response_description="Comprehensive community statistics and metrics"
)
async def get_community_stats(
    timeframe: str = Query(default="month", regex="^(week|month|quarter|all)$"),
    db: AsyncSession = Depends(get_db)
) -> CommunityStats:
    """Get comprehensive community statistics."""
    try:
        # Mock community statistics
        # In production, these would be calculated from actual database data

        community_stats = CommunityStats(
            total_shared_readings=1247,
            total_comments=3456,
            total_likes=12789,
            active_users_this_week=234,
            trending_character_voices={
                CharacterVoice.PIP_BOY: 345,
                CharacterVoice.VAULT_DWELLER: 298,
                CharacterVoice.WASTELAND_TRADER: 267,
                CharacterVoice.CODSWORTH: 189,
                CharacterVoice.SUPER_MUTANT: 156
            },
            popular_reading_types={
                "career_guidance": 234,
                "relationships": 189,
                "personal_growth": 156,
                "decision_making": 134,
                "spiritual_insight": 98
            },
            community_karma_distribution={
                KarmaAlignment.GOOD: 567,
                KarmaAlignment.NEUTRAL: 445,
                KarmaAlignment.EVIL: 235
            }
        )

        return community_stats

    except Exception as e:
        logger.error(f"Error retrieving community stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve community statistics")