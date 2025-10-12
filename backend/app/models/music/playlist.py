"""Playlist data models."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .music_track import MusicTrackResponse


class PlaylistBase(BaseModel):
    """播放清單基礎模型"""

    name: str = Field(
        min_length=1,
        max_length=50,
        description="播放清單名稱",
    )
    description: Optional[str] = Field(
        default=None,
        max_length=200,
        description="播放清單描述",
    )


class PlaylistCreate(PlaylistBase):
    """建立播放清單請求模型"""

    pass


class PlaylistUpdate(BaseModel):
    """更新播放清單請求模型"""

    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    description: Optional[str] = None


class PlaylistTrack(BaseModel):
    """播放清單歌曲關聯模型"""

    id: UUID = Field(description="關聯 ID")
    playlist_id: UUID = Field(description="播放清單 ID")
    track_id: UUID = Field(description="音樂 ID")
    position: int = Field(description="歌曲順序")
    added_at: datetime = Field(description="加入時間")

    # 展開的音樂資訊
    track: Optional[MusicTrackResponse] = None

    class Config:
        from_attributes = True


class Playlist(PlaylistBase):
    """播放清單資料庫模型"""

    id: UUID = Field(description="播放清單 ID")
    user_id: UUID = Field(description="擁有者 ID")
    is_default: bool = Field(description="預設播放清單")
    created_at: datetime = Field(description="建立時間")
    updated_at: datetime = Field(description="最後更新時間")

    # 展開的歌曲清單
    tracks: List[MusicTrackResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class PlaylistResponse(Playlist):
    """播放清單 API 回應模型"""

    track_count: int = Field(default=0, description="歌曲數量")


class AddTrackRequest(BaseModel):
    """加入音樂至播放清單請求模型"""

    track_id: UUID = Field(description="音樂 ID")


class ReorderTracksRequest(BaseModel):
    """調整播放清單音樂順序請求模型"""

    track_ids: List[UUID] = Field(
        description="音樂 ID 陣列（按新順序排列）",
        min_length=1,
    )
