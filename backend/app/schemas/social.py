"""
社群功能的 Pydantic 資料結構

社群互動、分享與社交功能的模型
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum

from app.schemas.cards import CharacterVoice, KarmaAlignment
from app.schemas.readings import ReadingSession


class SocialActionType(str, Enum):
    """社群操作類型"""
    LIKE = "like"  # 按讚
    SHARE = "share"  # 分享
    COMMENT = "comment"  # 評論
    FOLLOW = "follow"  # 追蹤
    BOOKMARK = "bookmark"  # 收藏


class ContentType(str, Enum):
    """可分享的內容類型"""
    READING = "reading"  # 占卜
    CARD_INTERPRETATION = "card_interpretation"  # 卡牌解讀
    SPREAD_REVIEW = "spread_review"  # 牌陣評論
    VOICE_RATING = "voice_rating"  # 聲音評分


class SocialStats(BaseModel):
    """內容的社群統計"""
    likes_count: int = Field(default=0, ge=0, description="按讚數")
    shares_count: int = Field(default=0, ge=0, description="分享數")
    comments_count: int = Field(default=0, ge=0, description="評論數")
    bookmarks_count: int = Field(default=0, ge=0, description="收藏數")
    views_count: int = Field(default=0, ge=0, description="瀏覽數")


class SharedReading(BaseModel):
    """公開分享的占卜"""
    id: str = Field(..., description="唯一識別碼")
    reading_id: str = Field(..., description="原始占卜 ID")
    user_id: str = Field(..., description="分享占卜的使用者")
    username: str = Field(..., description="分享者的使用者名稱")

    # 占卜內容
    question: str = Field(..., description="詢問的問題")
    character_voice_used: CharacterVoice = Field(..., description="使用的角色聲音")
    karma_context: KarmaAlignment = Field(..., description="業力脈絡")

    # 選擇的解讀（使用者可選擇要分享的部分）
    shared_interpretation: str = Field(..., description="分享的解讀內容")
    cards_revealed: List[str] = Field(..., description="要顯示哪些卡牌（按位置）")

    # 社群元數據
    title: Optional[str] = Field(None, description="使用者提供的分享標題")
    description: Optional[str] = Field(None, description="使用者對占卜的描述")

    # 社群統計
    social_stats: SocialStats = Field(default_factory=SocialStats)

    # 時間戳記
    shared_at: datetime = Field(..., description="分享時間")
    reading_date: datetime = Field(..., description="原始占卜的進行時間")

    # 使用者偏好
    allow_comments: bool = Field(default=True, description="是否允許在此分享上評論")
    is_featured: bool = Field(default=False, description="是否被管理員精選")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "share-12345",
                "reading_id": "reading-67890",
                "user_id": "user-abc123",
                "username": "VaultDweller76",
                "question": "What should I focus on this week?",
                "character_voice_used": "pip_boy",
                "karma_context": "good",
                "shared_interpretation": "The cards suggest focusing on new opportunities and maintaining positive relationships",
                "cards_revealed": ["past", "present", "future"],
                "title": "Great guidance for the week ahead!",
                "social_stats": {
                    "likes_count": 23,
                    "comments_count": 7,
                    "shares_count": 3
                },
                "allow_comments": True
            }
        }
    )


class Comment(BaseModel):
    """分享內容上的評論"""
    id: str = Field(..., description="唯一評論 ID")
    content_type: ContentType = Field(..., description="被評論的內容類型")
    content_id: str = Field(..., description="被評論的內容 ID")
    user_id: str = Field(..., description="發表評論的使用者")
    username: str = Field(..., description="評論者的使用者名稱")

    comment_text: str = Field(..., min_length=1, max_length=500, description="評論文字")
    parent_comment_id: Optional[str] = Field(None, description="父評論 ID（用於回覆）")

    # 社群統計
    likes_count: int = Field(default=0, description="此評論的按讚數")
    replies_count: int = Field(default=0, description="此評論的回覆數")

    # 時間戳記
    created_at: datetime = Field(..., description="評論建立時間")
    updated_at: Optional[datetime] = Field(None, description="評論最後編輯時間")

    # 管理
    is_edited: bool = Field(default=False, description="評論是否已編輯")
    is_reported: bool = Field(default=False, description="評論是否已被檢舉")
    is_hidden: bool = Field(default=False, description="評論是否被管理員隱藏")


class CreateCommentRequest(BaseModel):
    """建立評論的請求"""
    content_type: ContentType = Field(..., description="被評論的內容類型")
    content_id: str = Field(..., description="被評論的內容 ID")
    comment_text: str = Field(..., min_length=1, max_length=500, description="評論文字")
    parent_comment_id: Optional[str] = Field(None, description="父評論 ID（用於回覆）")


class SocialAction(BaseModel):
    """社群操作的紀錄"""
    id: str = Field(..., description="唯一操作 ID")
    user_id: str = Field(..., description="執行操作的使用者")
    action_type: SocialActionType = Field(..., description="操作類型")
    content_type: ContentType = Field(..., description="被操作的內容類型")
    content_id: str = Field(..., description="被操作的內容 ID")
    target_user_id: Optional[str] = Field(None, description="追蹤操作的目標使用者")

    created_at: datetime = Field(..., description="操作執行時間")
    is_active: bool = Field(default=True, description="操作是否仍然有效")


class UserSocialProfile(BaseModel):
    """User's social profile and stats"""
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    display_name: Optional[str] = Field(None, description="Display name")
    bio: Optional[str] = Field(None, max_length=200, description="User bio")

    # Social stats
    followers_count: int = Field(default=0, description="Number of followers")
    following_count: int = Field(default=0, description="Number of users following")
    readings_shared: int = Field(default=0, description="Number of readings shared")
    total_likes_received: int = Field(default=0, description="Total likes received on content")

    # Preferences
    karma_alignment: Optional[KarmaAlignment] = Field(None, description="Public karma alignment")
    favorite_character_voice: Optional[CharacterVoice] = Field(None, description="Favorite character voice")
    show_reading_stats: bool = Field(default=True, description="Show reading statistics publicly")
    allow_friend_requests: bool = Field(default=True, description="Allow friend requests")

    # Achievements
    achievements: List[str] = Field(default_factory=list, description="Unlocked achievements")
    badges: List[str] = Field(default_factory=list, description="Earned badges")

    # Activity
    last_active: Optional[datetime] = Field(None, description="Last activity timestamp")
    joined_at: datetime = Field(..., description="When user joined")


class ShareReadingRequest(BaseModel):
    """Request to share a reading publicly"""
    reading_id: str = Field(..., description="Reading to share")
    title: Optional[str] = Field(None, max_length=100, description="Title for the shared reading")
    description: Optional[str] = Field(None, max_length=300, description="Description of why sharing")
    cards_to_reveal: List[str] = Field(..., description="Which card positions to show")
    include_full_interpretation: bool = Field(default=False, description="Include full interpretation")
    allow_comments: bool = Field(default=True, description="Allow comments")

    @field_validator('cards_to_reveal')
    def validate_cards_revealed(cls, v):
        if not v:
            raise ValueError('Must reveal at least one card position')
        return v


class CommunityFeed(BaseModel):
    """Community feed response"""
    shared_readings: List[SharedReading] = Field(..., description="Recent shared readings")
    featured_content: List[SharedReading] = Field(..., description="Featured community content")
    community_stats: Dict[str, int] = Field(..., description="Overall community statistics")


class FeedFilters(BaseModel):
    """Filters for community feed"""
    character_voice: Optional[CharacterVoice] = Field(None, description="Filter by character voice")
    karma_alignment: Optional[KarmaAlignment] = Field(None, description="Filter by karma alignment")
    min_likes: Optional[int] = Field(None, ge=0, description="Minimum number of likes")
    date_from: Optional[datetime] = Field(None, description="Show content from this date")
    date_to: Optional[datetime] = Field(None, description="Show content until this date")
    followed_users_only: bool = Field(default=False, description="Show only followed users' content")
    sort_by: str = Field(default="shared_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order")

    @field_validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be asc or desc')
        return v


class UserInteraction(BaseModel):
    """User interaction with content"""
    content_type: ContentType = Field(..., description="Type of content")
    content_id: str = Field(..., description="Content ID")
    has_liked: bool = Field(default=False, description="User has liked this content")
    has_shared: bool = Field(default=False, description="User has shared this content")
    has_bookmarked: bool = Field(default=False, description="User has bookmarked this content")
    has_commented: bool = Field(default=False, description="User has commented on this content")


class LeaderboardEntry(BaseModel):
    """Entry in community leaderboards"""
    user_id: str = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    display_name: Optional[str] = Field(None, description="Display name")
    score: float = Field(..., description="Leaderboard score")
    rank: int = Field(..., description="Current rank")
    badge: Optional[str] = Field(None, description="Special badge for this achievement")


class CommunityLeaderboards(BaseModel):
    """Community leaderboards"""
    most_liked_shares: List[LeaderboardEntry] = Field(..., description="Users with most liked shared readings")
    most_helpful_comments: List[LeaderboardEntry] = Field(..., description="Users with most helpful comments")
    most_active_sharers: List[LeaderboardEntry] = Field(..., description="Most active content sharers")
    rising_stars: List[LeaderboardEntry] = Field(..., description="New users gaining popularity")
    karma_champions: Dict[KarmaAlignment, List[LeaderboardEntry]] = Field(..., description="Top users by karma alignment")


class ReportContentRequest(BaseModel):
    """Request to report inappropriate content"""
    content_type: ContentType = Field(..., description="Type of content being reported")
    content_id: str = Field(..., description="ID of content being reported")
    reason: str = Field(..., description="Reason for reporting")
    details: Optional[str] = Field(None, max_length=300, description="Additional details")


class ModerationAction(BaseModel):
    """Moderation action on content"""
    id: str = Field(..., description="Action ID")
    content_type: ContentType = Field(..., description="Type of content")
    content_id: str = Field(..., description="Content ID")
    action_taken: str = Field(..., description="Action taken")
    reason: str = Field(..., description="Reason for action")
    moderator_id: str = Field(..., description="Moderator who took action")
    created_at: datetime = Field(..., description="When action was taken")


class CommunityStats(BaseModel):
    """Overall community statistics"""
    total_shared_readings: int = Field(..., description="Total readings shared")
    total_comments: int = Field(..., description="Total comments made")
    total_likes: int = Field(..., description="Total likes given")
    active_users_this_week: int = Field(..., description="Active users in past week")
    trending_character_voices: Dict[CharacterVoice, int] = Field(..., description="Popular character voices")
    popular_reading_types: Dict[str, int] = Field(..., description="Popular reading types")
    community_karma_distribution: Dict[KarmaAlignment, int] = Field(..., description="Community karma breakdown")